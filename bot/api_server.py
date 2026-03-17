"""
FastAPI server — Admin Panel communicates with this to control live streams.

Endpoints:
  GET  /status                    → bot + all streams status
  POST /stream/start              → start live stream on channel(s)
  POST /stream/stop               → stop live stream
  POST /stream/pause              → pause stream
  POST /stream/resume             → resume stream
  GET  /stream/{chat_id}          → single stream status
  POST /channels/info             → get channel info by chat_id
  POST /announce/live             → send live announcement message
  POST /announce/end              → send end announcement message
"""

import asyncio
import logging
import time
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import config
from stream_manager import StreamManager, StreamState
from bot_commands import send_live_announcement, send_end_announcement

logger = logging.getLogger(__name__)

app = FastAPI(title="Football Live Stream Bot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Shared state (injected from main.py) ─────────────────────────────────────
_stream_manager: Optional[StreamManager] = None
_bot_client     = None          # Pyrogram Bot client for announcements
_user_client    = None          # Pyrogram User client (for voice chats)

def set_clients(sm: StreamManager, bot, user):
    global _stream_manager, _bot_client, _user_client
    _stream_manager = sm
    _bot_client     = bot
    _user_client    = user


# ── Auth ─────────────────────────────────────────────────────────────────────
async def verify_secret(x_api_secret: str = Header(...)):
    if x_api_secret != config.API_SECRET:
        raise HTTPException(status_code=401, detail="Invalid API secret")


# ── Request / Response models ─────────────────────────────────────────────────
class StartStreamRequest(BaseModel):
    chat_ids:    List[str]         # channel IDs (string) to stream to
    source:      str               # RTMP, HLS, YouTube, or file path
    match_name:  str
    competition: str = ""
    video_width:  int = 1280
    video_height: int = 720
    video_fps:    int = 30
    announce:    bool = True       # send 🔴 LIVE message on each channel


class StopStreamRequest(BaseModel):
    chat_ids:    List[str]
    final_score: str = ""
    announce:    bool = True


class AnnounceRequest(BaseModel):
    chat_id:     str
    match_name:  str
    competition: str = ""
    message_id:  Optional[int] = None
    final_score: str = ""


# ── Helpers ───────────────────────────────────────────────────────────────────
def _stream_to_dict(chat_id: int, s) -> dict:
    return {
        "chat_id":    chat_id,
        "match_name": s.match_name,
        "competition": s.competition,
        "source":     s.source,
        "state":      s.state.value,
        "error":      s.error,
        "started_at": s.started_at,
        "uptime_sec": int(time.time() - s.started_at) if s.started_at else 0,
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/status")
async def get_status():
    """Health check + overview of all active streams."""
    streams = {}
    if _stream_manager:
        for cid, s in _stream_manager.get_all_streams().items():
            streams[str(cid)] = _stream_to_dict(cid, s)

    return {
        "ok": True,
        "bot_ready": _bot_client is not None,
        "user_ready": _user_client is not None,
        "active_streams": len(streams),
        "streams": streams,
    }


@app.post("/stream/start", dependencies=[Depends(verify_secret)])
async def start_stream(req: StartStreamRequest):
    """Start a live stream on one or more Telegram channels."""
    if not _stream_manager:
        raise HTTPException(503, "Stream manager not ready")

    results = []
    for raw_id in req.chat_ids:
        chat_id = int(raw_id)
        result  = {"chat_id": raw_id, "ok": False, "error": None, "announcement_msg_id": None}

        try:
            await _stream_manager.start_stream(
                chat_id      = chat_id,
                source       = req.source,
                match_name   = req.match_name,
                competition  = req.competition,
                video_width  = req.video_width,
                video_height = req.video_height,
                video_fps    = req.video_fps,
            )
            result["ok"] = True

            # Send announcement
            if req.announce and _bot_client:
                msg_id = await send_live_announcement(
                    _bot_client, raw_id, req.match_name, req.competition
                )
                result["announcement_msg_id"] = msg_id

        except Exception as e:
            result["error"] = str(e)
            logger.error(f"start_stream error for {chat_id}: {e}")

        results.append(result)

    success = sum(1 for r in results if r["ok"])
    return {"ok": success > 0, "results": results, "success_count": success}


@app.post("/stream/stop", dependencies=[Depends(verify_secret)])
async def stop_stream(req: StopStreamRequest):
    """Stop live stream(s) and optionally send an end announcement."""
    if not _stream_manager:
        raise HTTPException(503, "Stream manager not ready")

    results = []
    for raw_id in req.chat_ids:
        chat_id = int(raw_id)
        stream  = _stream_manager.get_stream(chat_id)
        result  = {"chat_id": raw_id, "ok": False, "error": None}

        try:
            ok = await _stream_manager.stop_stream(chat_id)
            result["ok"] = ok

            if ok and req.announce and _bot_client:
                msg_id = stream.announcement_msg_ids.get(raw_id) if stream else None
                await send_end_announcement(
                    _bot_client, raw_id, msg_id,
                    stream.match_name if stream else "Match",
                    req.final_score,
                )
        except Exception as e:
            result["error"] = str(e)

        results.append(result)

    return {"ok": True, "results": results}


@app.post("/stream/pause", dependencies=[Depends(verify_secret)])
async def pause_stream(body: dict):
    chat_id = int(body.get("chat_id", 0))
    if _stream_manager:
        await _stream_manager.pause_stream(chat_id)
    return {"ok": True}


@app.post("/stream/resume", dependencies=[Depends(verify_secret)])
async def resume_stream(body: dict):
    chat_id = int(body.get("chat_id", 0))
    if _stream_manager:
        await _stream_manager.resume_stream(chat_id)
    return {"ok": True}


@app.get("/stream/{chat_id}")
async def get_stream_status(chat_id: str):
    if not _stream_manager:
        return {"ok": False, "state": "idle"}
    s = _stream_manager.get_stream(int(chat_id))
    if not s:
        return {"ok": True, "state": "idle"}
    return {"ok": True, **_stream_to_dict(int(chat_id), s)}


@app.post("/channels/info", dependencies=[Depends(verify_secret)])
async def get_channel_info(body: dict):
    """Get Telegram channel metadata (name, members) via the user client."""
    chat_id = body.get("chat_id")
    if not _user_client or not chat_id:
        raise HTTPException(503, "User client not ready")
    try:
        chat = await _user_client.get_chat(chat_id)
        members = 0
        try:
            members = await _user_client.get_chat_members_count(chat_id)
        except Exception:
            pass
        return {
            "ok": True,
            "id": chat.id,
            "title": chat.title,
            "username": chat.username,
            "type": chat.type.value,
            "members": members,
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.post("/announce/live", dependencies=[Depends(verify_secret)])
async def announce_live(req: AnnounceRequest):
    if not _bot_client:
        raise HTTPException(503, "Bot client not ready")
    msg_id = await send_live_announcement(
        _bot_client, req.chat_id, req.match_name, req.competition
    )
    return {"ok": msg_id is not None, "message_id": msg_id}


@app.post("/announce/end", dependencies=[Depends(verify_secret)])
async def announce_end(req: AnnounceRequest):
    if not _bot_client:
        raise HTTPException(503, "Bot client not ready")
    await send_end_announcement(
        _bot_client, req.chat_id, req.message_id,
        req.match_name, req.final_score
    )
    return {"ok": True}
