# ⚽ Football Live Stream Bot

Streams live football video **directly on your Telegram channel** using
[Pyrogram](https://pyrogram.org) + [PyTgCalls](https://pytgcalls.github.io).
Viewers watch inside the Telegram app — no external links needed.

---

## Architecture

```
Admin Panel (React)
       │  HTTP REST
       ▼
FastAPI Bot API  (port 8000)
       │
       ├── Pyrogram USER client  ──► Telegram Voice Chat (Live Stream)
       │        │                         ▲ video/audio
       │        └── PyTgCalls  ──────────┘
       │
       └── Pyrogram BOT client  ──► Channel announcements (🔴 LIVE messages)
```

---

## Quick Setup

### 1 — Get Telegram API credentials

1. Go to **https://my.telegram.org/apps**
2. Create an app → copy **API ID** and **API Hash**

### 2 — Create a bot (for announcements)

1. Message **@BotFather** on Telegram
2. `/newbot` → follow prompts → copy the **bot token**
3. Add the bot as **admin** of your channel

### 3 — Configure environment

```bash
cd bot
cp .env.example .env
# Edit .env with your API_ID, API_HASH, BOT_TOKEN
```

### 4 — Install Python dependencies

```bash
cd bot
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 5 — First run (login)

```bash
python main.py
```

On first run Pyrogram will ask for your **phone number** and **OTP** to log in
the USER account. This account must also be admin of your channels.
A `stream_session.session` file is created — future runs won't ask again.

---

## Stream Sources

The bot accepts any source that `ffmpeg` / `yt-dlp` can read:

| Type          | Example                                       |
|---------------|-----------------------------------------------|
| RTMP (OBS)    | `rtmp://live.example.com/live/KEY`            |
| HLS / M3U8    | `https://example.com/stream/index.m3u8`       |
| YouTube Live  | `https://www.youtube.com/watch?v=VIDEO_ID`    |
| Direct video  | `https://example.com/match.mp4`               |
| Local file    | `/path/to/video.mp4`                          |

### Streaming from OBS

1. In OBS → Settings → Stream
2. Service: **Custom**
3. Server: `rtmp://YOUR_SERVER_IP/live`
4. Stream Key: anything (e.g. `football`)
5. In admin panel source: `rtmp://YOUR_SERVER_IP/live/football`

---

## Admin Panel Integration

Set these in your React app's `.env` (root `/home/user/app/`):

```env
VITE_BOT_API_URL=http://localhost:8000
VITE_BOT_API_SECRET=my-super-secret-key-change-this
```

Make sure `API_SECRET` in `bot/.env` matches `VITE_BOT_API_SECRET`.

---

## Running in production

```bash
# Install as a systemd service or use screen/tmux
screen -S football-bot
cd bot && source venv/bin/activate && python main.py
# Ctrl+A D to detach
```

Or with Docker (add your own Dockerfile) using Python 3.11+ base image.

---

## API Endpoints

| Method | Path              | Description                    |
|--------|-------------------|--------------------------------|
| GET    | `/status`         | Bot health + active streams    |
| POST   | `/stream/start`   | Start live stream on channel   |
| POST   | `/stream/stop`    | End live stream                |
| POST   | `/stream/pause`   | Pause stream                   |
| POST   | `/stream/resume`  | Resume stream                  |
| GET    | `/stream/{id}`    | Single stream status           |
| POST   | `/channels/info`  | Get channel metadata           |
| POST   | `/announce/live`  | Send 🔴 LIVE message           |
| POST   | `/announce/end`   | Send stream ended message      |

All write endpoints require `x-api-secret` header.
