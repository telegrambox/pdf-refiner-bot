# Telegram PDF Watermark & Refiner Bot

Fast Telegram bot to watermark PDF documents with the official **UPSCFILE** brand mark at the bottom center and append a clean ending page to each file.

## Features
- ⚡ **PDF Processing**: Send a `.pdf` document and get back `<filename>_planned.pdf`.
- 🏷️ **UPSCFILE Watermark**: Applied to all uploaded primary pages.
- 📄 **Ending Page Appended**: Default UPSC ending page added to the end without watermark.
- ⚙️ **Interactive Controls**:
  - `/settings`: Toggle watermark ON/OFF.
  - Upload a custom watermark image or custom ending PDF.
  - 1-tap reset to defaults.

## Deploy on Render

1. Push the repository to GitHub.
2. Create a Render Web Service from the repository.
3. Use:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` or a paid plan as preferred.
4. Add the environment variable:
   - `BOT_TOKEN`: your Telegram bot token from BotFather.

**Security:** Never commit the Telegram bot token to GitHub, README files, or source code. If a token was previously exposed, revoke/rotate it in BotFather before deploying the new version.

**Hosting note:** Render Free Web Services may sleep when idle, so continuous Telegram bot availability should not be assumed on the free tier. Use a suitable always-on plan for production reliability.

## Running locally

```bash
npm install
npm start
```
