import os
from dotenv import load_dotenv

load_dotenv()

# ─── Telegram Credentials ────────────────────────────────────────────────────
# Get API_ID and API_HASH from https://my.telegram.org/apps
API_ID   = int(os.getenv("API_ID", "0"))
API_HASH = os.getenv("API_HASH", "")

# Bot token from @BotFather  (used for sending messages / announcements)
BOT_TOKEN = os.getenv("BOT_TOKEN", "")

# Session name for the USER account that will host the live stream
# The user account must be admin of the channel
SESSION_NAME = os.getenv("SESSION_NAME", "stream_session")

# ─── API Server ───────────────────────────────────────────────────────────────
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# Secret key for admin panel → bot API communication
API_SECRET = os.getenv("API_SECRET", "change-me-in-production")

# ─── Stream Defaults ─────────────────────────────────────────────────────────
DEFAULT_VIDEO_WIDTH  = int(os.getenv("VIDEO_WIDTH", "1280"))
DEFAULT_VIDEO_HEIGHT = int(os.getenv("VIDEO_HEIGHT", "720"))
DEFAULT_VIDEO_FPS    = int(os.getenv("VIDEO_FPS", "30"))
DEFAULT_VIDEO_BITRATE = int(os.getenv("VIDEO_BITRATE", "2000"))  # kbps
DEFAULT_AUDIO_BITRATE = int(os.getenv("AUDIO_BITRATE", "128"))   # kbps
