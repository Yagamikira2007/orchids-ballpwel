#!/usr/bin/env python3
"""
Football Live Stream Bot — Main entry point.

Starts:
  1. Pyrogram USER client  → hosts voice chats / live streams on channels
  2. Pyrogram BOT client   → sends announcements & receives commands
  3. FastAPI server        → admin panel communicates with this
  4. PyTgCalls             → WebRTC bridge that streams video to Telegram

Usage:
  python main.py

Environment variables (copy .env.example → .env and fill in):
  API_ID, API_HASH, BOT_TOKEN, SESSION_NAME, API_SECRET
"""

import asyncio
import logging
import signal
import sys

import uvicorn
from pyrogram import Client, idle
from pyrogram.errors import SessionPasswordNeeded

import config
from stream_manager import StreamManager
from api_server import app as fastapi_app, set_clients
from bot_commands import register_handlers

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Pyrogram clients ─────────────────────────────────────────────────────────

def make_user_client() -> Client:
    """
    USER account client — needed to create/join voice chats on channels.
    On first run, Pyrogram will ask for your phone number and OTP.
    The session is saved as SESSION_NAME.session so login is only needed once.
    """
    return Client(
        name      = config.SESSION_NAME,
        api_id    = config.API_ID,
        api_hash  = config.API_HASH,
        workdir   = ".",          # saves .session file in bot/ directory
    )


def make_bot_client() -> Client:
    """BOT client — for sending announcements and pinning messages."""
    return Client(
        name      = "bot",
        api_id    = config.API_ID,
        api_hash  = config.API_HASH,
        bot_token = config.BOT_TOKEN,
        workdir   = ".",
    )


# ── Main ─────────────────────────────────────────────────────────────────────

async def main():
    logger.info("═══════════════════════════════════════════")
    logger.info("  Football Live Stream Bot  — Starting up  ")
    logger.info("═══════════════════════════════════════════")

    # Validate config
    if not config.API_ID or not config.API_HASH:
        logger.error("API_ID and API_HASH are required. Set them in .env")
        sys.exit(1)

    # ── Start Pyrogram clients ─────────────────────────────────────────────
    user_client = make_user_client()
    bot_client  = make_bot_client() if config.BOT_TOKEN else None

    logger.info("Starting USER client (handles live streams)…")
    await user_client.start()
    me = await user_client.get_me()
    logger.info(f"  ✓ User logged in as: {me.first_name} (@{me.username})")

    if bot_client:
        logger.info("Starting BOT client (handles announcements)…")
        await bot_client.start()
        bot_me = await bot_client.get_me()
        logger.info(f"  ✓ Bot: @{bot_me.username}")

    # ── Stream manager ─────────────────────────────────────────────────────
    stream_mgr = StreamManager(user_client)
    await stream_mgr.start()

    # ── Register bot command handlers ──────────────────────────────────────
    register_handlers(user_client, stream_mgr, bot_client)

    # ── Inject into FastAPI ────────────────────────────────────────────────
    set_clients(stream_mgr, bot_client, user_client)
    logger.info("Stream manager ready ✓")

    # ── FastAPI server (async, non-blocking) ───────────────────────────────
    uv_config = uvicorn.Config(
        fastapi_app,
        host=config.API_HOST,
        port=config.API_PORT,
        log_level="info",
        loop="none",          # use the existing asyncio loop
    )
    uv_server = uvicorn.Server(uv_config)

    logger.info(f"Admin API listening on http://{config.API_HOST}:{config.API_PORT}")
    logger.info("Bot is READY. Admin panel can now control streams.")
    logger.info("═══════════════════════════════════════════\n")

    # Run FastAPI + keep Pyrogram alive concurrently
    await asyncio.gather(
        uv_server.serve(),
        idle(),               # keeps Pyrogram running
    )

    # ── Shutdown ───────────────────────────────────────────────────────────
    logger.info("Shutting down…")
    await stream_mgr.stop()
    await user_client.stop()
    if bot_client:
        await bot_client.stop()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
