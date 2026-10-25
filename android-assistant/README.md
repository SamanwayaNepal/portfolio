# Screen Question Assistant

This Android app is a consent-based screen assistant. The user explicitly approves
screen capture through Android's MediaProjection dialog, and a persistent foreground
notification remains visible while monitoring is active.

## What it does

1. Stores a Telegram bot token and chat ID locally in the app's private preferences.
2. Captures the device screen only after the user approves the system prompt.
3. Runs OCR on-device with ML Kit.
4. Detects text that looks like a question and sends the question to the configured
   Telegram bot using `sendMessage`.

It does not use accessibility services, hide monitoring, or capture credentials. The
app does not automatically type answers into another app.

## Setup

Open `android-assistant` in Android Studio, sync Gradle, and run it on an Android 8.0+
device or emulator. Create a Telegram bot with BotFather, send the bot `/start`, and
enter the bot token and resulting chat ID in the app.

The project intentionally does not include a bot token or any secret.
