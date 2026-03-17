"""
Stream Manager — handles all active Telegram live streams.

Each stream lifecycle:
  IDLE → STARTING → LIVE → STOPPING → IDLE

The manager keeps one PyTgCalls instance per Pyrogram client
and tracks which channels are streaming what source.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Optional

from pyrogram import Client
from pytgcalls import PyTgCalls
from pytgcalls.types import MediaStream, AudioQuality, VideoQuality
from pytgcalls.exceptions import NoActiveGroupCall, AlreadyJoinedError

logger = logging.getLogger(__name__)


class StreamState(str, Enum):
    IDLE     = "idle"
    STARTING = "starting"
    LIVE     = "live"
    STOPPING = "stopping"
    ERROR    = "error"


@dataclass
class ActiveStream:
    chat_id:    int
    source:     str          # RTMP URL, HLS URL, or file path
    match_name: str
    competition: str = ""
    state:      StreamState = StreamState.IDLE
    error:      Optional[str] = None
    started_at: Optional[float] = None   # unix timestamp
    announcement_msg_ids: Dict[str, int] = field(default_factory=dict)  # chatId → msgId


class StreamManager:
    def __init__(self, client: Client):
        self._client  = client
        self._calls   = PyTgCalls(client)
        self._streams: Dict[int, ActiveStream] = {}   # chat_id → ActiveStream
        self._started = False

    # ── Lifecycle ──────────────────────────────────────────────────────────

    async def start(self):
        """Start PyTgCalls — call once after Pyrogram is connected."""
        if not self._started:
            await self._calls.start()
            self._started = True
            logger.info("PyTgCalls started")

    async def stop(self):
        """Gracefully stop all streams and PyTgCalls."""
        for chat_id in list(self._streams):
            try:
                await self.stop_stream(chat_id)
            except Exception as e:
                logger.warning(f"Error stopping stream for {chat_id}: {e}")

    # ── Start / Stop ────────────────────────────────────────────────────────

    async def start_stream(
        self,
        chat_id: int,
        source: str,
        match_name: str,
        competition: str = "",
        video_width: int = 1280,
        video_height: int = 720,
        video_fps: int = 30,
    ) -> ActiveStream:
        """
        Start a live stream on a Telegram channel/group.

        :param chat_id:   Telegram channel ID (negative int, e.g. -1001234567890)
        :param source:    RTMP URL, HLS m3u8 URL, YouTube URL, or local file path
        :param match_name: Display name for logging / API status
        """
        stream = self._streams.get(chat_id)
        if stream and stream.state in (StreamState.LIVE, StreamState.STARTING):
            raise ValueError(f"Channel {chat_id} is already streaming")

        import time
        stream = ActiveStream(
            chat_id=chat_id,
            source=source,
            match_name=match_name,
            competition=competition,
            state=StreamState.STARTING,
        )
        self._streams[chat_id] = stream

        try:
            media = MediaStream(
                source,
                video_parameters=VideoQuality.HD_720p,
                audio_parameters=AudioQuality.STUDIO,
            )

            await self._calls.play(chat_id, media)
            stream.state     = StreamState.LIVE
            stream.started_at = time.time()
            logger.info(f"▶ Stream LIVE on {chat_id}: {match_name} ← {source}")

        except AlreadyJoinedError:
            # Already in call — try to change stream
            await self._calls.change_stream(
                chat_id,
                MediaStream(source, video_parameters=VideoQuality.HD_720p, audio_parameters=AudioQuality.STUDIO),
            )
            stream.state     = StreamState.LIVE
            stream.started_at = time.time()

        except Exception as e:
            stream.state = StreamState.ERROR
            stream.error = str(e)
            logger.error(f"Failed to start stream on {chat_id}: {e}")
            raise

        return stream

    async def stop_stream(self, chat_id: int) -> bool:
        """End the live stream on a channel."""
        stream = self._streams.get(chat_id)
        if not stream:
            return False

        stream.state = StreamState.STOPPING
        try:
            await self._calls.leave_call(chat_id)
        except Exception as e:
            logger.warning(f"leave_call error for {chat_id}: {e}")

        stream.state = StreamState.IDLE
        self._streams.pop(chat_id, None)
        logger.info(f"⏹ Stream stopped on {chat_id}")
        return True

    async def pause_stream(self, chat_id: int):
        stream = self._streams.get(chat_id)
        if stream and stream.state == StreamState.LIVE:
            await self._calls.pause_stream(chat_id)

    async def resume_stream(self, chat_id: int):
        stream = self._streams.get(chat_id)
        if stream and stream.state == StreamState.LIVE:
            await self._calls.resume_stream(chat_id)

    # ── Status ──────────────────────────────────────────────────────────────

    def get_stream(self, chat_id: int) -> Optional[ActiveStream]:
        return self._streams.get(chat_id)

    def get_all_streams(self) -> Dict[int, ActiveStream]:
        return dict(self._streams)

    def is_live(self, chat_id: int) -> bool:
        s = self._streams.get(chat_id)
        return s is not None and s.state == StreamState.LIVE
