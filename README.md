# Telegram PDF Watermark & Refiner Bot

Fast, automated Telegram Bot to watermark PDF documents with the official **UPSCFILE** brand mark at the bottom center and append a clean ending page to each file.

## Features
- ⚡ **Instant Processing**: Send any `.pdf` document and get back `<filename>_planned.pdf`.
- 🏷️ **UPSCFILE Watermark**: Applied to all uploaded pages (clean and crisp, bottom center).
- 📄 **Ending Page Appended**: Default UPSC ending page added to the end without watermark.
- ⚙️ **Interactive Controls**:
  - `/settings`: Toggle watermark ON/OFF with 1 tap.
  - Upload custom watermark image or custom ending PDF anytime.
  - 1-tap reset to defaults.
- 🌐 **Zero-Cost Free 24/7 Hosting**: Ready to deploy on Render's Free Web Service tier.

---

## 🚀 How to Deploy on Render (100% Free, Zero Cost)

1. **Push to GitHub**:
   - Create a GitHub repository (e.g., `telegrambox` or `telegram-pdf-bot`).
   - Push this directory to your repository.

2. **Deploy on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com/) (Sign in with GitHub).
   - Click **New +** -> **Web Service**.
   - Select your GitHub repository.
   - Choose:
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: `Free` ($0/month)
   - Add Environment Variable:
     - `BOT_TOKEN`: `8874505167:AAFUj888x4jQFjbPMF3Zad2b0MDwwYwtwMM`
   - Click **Create Web Service**.
   - Render will build and launch your bot 24/7 at $0 cost!

---

## 💻 Running Locally (Desktop)

Simply double-click the `Launch Telegram Bot.bat` on your Desktop!
Or run:
```bash
npm install
npm start
```
