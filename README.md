# Vigil-X - Price Drop Alert Bot

A Telegram bot that monitors e-commerce product prices and alerts users when prices drop, helping them claim price protection benefits from credit cards.

## Features

- 📸 Receipt scanning using Google Gemini AI
- 🔍 Automated price tracking for Amazon & Flipkart
- 🚨 Real-time price drop alerts
- 📝 Automatic claim letter generation
- 💾 Persistent data storage with LowDB

## Fixed Issues

### 1. Module System Inconsistencies
- ✅ Converted `verification.js` from CommonJS to ES6 modules
- ✅ Added proper exports to `src/claim-gen.js`

### 2. Environment Variable Issues
- ✅ Fixed `GEMINI_KEY` → `GEMINI_API_KEY` in `src/analyser.js`
- ✅ Fixed `BOT_TOKEN` → `TELEGRAM_API_KEY` in `bot.js`
- ✅ Added dotenv support for environment variables
- ✅ Cleaned up `.env` file format (removed spaces around `=`)

### 3. Missing Files & Imports
- ✅ Created `src/scraper.js` with price scraping functionality
- ✅ Fixed missing `imageBuffer` variable in `bot.js`
- ✅ Added proper image download logic for Telegram photos

### 4. Integration Issues
- ✅ Added missing imports in `bot.js`
- ✅ Implemented callback query handler for claim generation
- ✅ Fixed tracker loop integration
- ✅ Added error handling for photo processing
- ✅ Initialized `db.json` with proper structure

### 5. Data Handling
- ✅ Added null checks in `src/tracker.js` for missing URLs
- ✅ Added fallback for `pricePaid` vs `price` property
- ✅ Added `currentPrice` tracking in database

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key
TELEGRAM_API_KEY=your_telegram_bot_token
```

3. Run the bot:
```bash
npm start
```

## Usage

1. Start the bot: `/start`
2. Send a product receipt screenshot
3. Bot will analyze and start monitoring the price
4. Receive alerts when price drops
5. Click "Generate Claim" to get a draft letter

## Project Structure

```
vigil-x/
├── bot.js                 # Main bot entry point
├── src/
│   ├── analyser.js       # Gemini AI receipt analysis
│   ├── claim-gen.js      # Claim letter generator
│   ├── database.js       # LowDB operations
│   ├── scraper.js        # Price scraping logic
│   └── tracker.js        # Price monitoring loop
├── db.json               # User data storage
└── .env                  # Environment variables
```

## Technologies

- Node.js with ES6 modules
- Telegram Bot API
- Google Gemini AI
- Axios & Cheerio for web scraping
- LowDB for data persistence

## Notes

- Price checking runs every 12 hours
- Supports Amazon India and Flipkart
- Requires valid Gemini API key and Telegram bot token