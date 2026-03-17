"""
Telegram bot commands — the bot listens in channels/groups for admin commands
and also sends announcements when streams start/end.
"""

import logging
from pyrogram import Client, filters
from pyrogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton

logger = logging.getLogger(__name__)


def register_handlers(app: Client, stream_manager, bot_client: Client):
    """Register all message/command handlers on the user client."""

    @app.on_message(filters.command("status") & filters.private)
    async def cmd_status(client: Client, message: Message):
        streams = stream_manager.get_all_streams()
        if not streams:
            await message.reply("📡 No active streams right now.")
            return

        lines = ["📡 **Active Streams**\n"]
        for chat_id, s in streams.items():
            lines.append(
                f"• **{s.match_name}** in `{chat_id}`\n"
                f"  State: `{s.state.value}` | Source: `{s.source[:40]}...`"
            )
        await message.reply("\n".join(lines))

    @app.on_message(filters.command("stop") & filters.private)
    async def cmd_stop(client: Client, message: Message):
        parts = message.text.split()
        if len(parts) < 2:
            await message.reply("Usage: /stop <chat_id>")
            return
        try:
            chat_id = int(parts[1])
            ok = await stream_manager.stop_stream(chat_id)
            await message.reply("⏹ Stream stopped." if ok else "No stream found for that chat.")
        except ValueError:
            await message.reply("Invalid chat_id")


async def send_live_announcement(
    bot_client: Client,
    chat_id: str,
    match_name: str,
    competition: str,
) -> int | None:
    """Send a 🔴 LIVE announcement to a channel when a stream starts. Returns message_id."""
    try:
        text = (
            f"🔴 <b>LIVE NOW ON TELEGRAM</b>\n\n"
            f"⚽ <b>{match_name}</b>\n"
            f"🏆 {competition}\n\n"
            f"📱 <b>Open the channel to watch the live stream directly in Telegram!</b>"
        )
        msg = await bot_client.send_message(
            int(chat_id),
            text,
            parse_mode="html",
        )
        return msg.id
    except Exception as e:
        logger.error(f"Failed to send live announcement to {chat_id}: {e}")
        return None


async def send_end_announcement(
    bot_client: Client,
    chat_id: str,
    message_id: int | None,
    match_name: str,
    final_score: str = "",
) -> None:
    """Edit or send an end-of-stream message."""
    text = (
        f"✅ <b>STREAM ENDED</b>\n\n"
        f"⚽ <b>{match_name}</b>\n"
        + (f"📊 Final Score: <b>{final_score}</b>\n" if final_score else "")
        + "\nThanks for watching! 🙌"
    )
    try:
        if message_id:
            await bot_client.edit_message_text(int(chat_id), message_id, text, parse_mode="html")
        else:
            await bot_client.send_message(int(chat_id), text, parse_mode="html")
    except Exception as e:
        logger.error(f"Failed to send end announcement to {chat_id}: {e}")
