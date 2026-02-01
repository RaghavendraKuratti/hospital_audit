# Deployment Guide for Render.com

## Prerequisites

### MongoDB Atlas Setup (Free Tier)

Since Render.com has ephemeral storage, you need a persistent database:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account and cluster
3. Create a database user with username and password
4. Whitelist all IPs (0.0.0.0/0) for Render.com access
5. Note your cluster URL (e.g., `cluster0.xxxxx.mongodb.net`)

## Environment Variables Required

Set these environment variables in your Render.com dashboard:

### Required Variables:
1. `TELEGRAM_API_KEY` - Your Telegram Bot API key
2. `GEMINI_API_KEY` - Your Google Gemini API key
3. `GEMINI_API_MODEL` - Model name (e.g., `gemini-1.5-flash`)
4. `NODE_ENV` - Set to `production`
5. `MONGODB_USER` - Your MongoDB Atlas username (e.g., `vigilx`)
6. `MONGODB_PASSWORD` - Your MongoDB Atlas password (e.g., `password123`)

### Optional Variables:
7. `MONGODB_CLUSTER` - Your MongoDB cluster URL (default: `cluster0.mongodb.net`)
8. `MONGODB_DATABASE` - Database name (default: `vigilx`)
9. `WEBHOOK_URL` - Your Render.com app URL (auto-detected if not set)

## Deployment Steps

1. **Connect your GitHub repository** to Render.com

2. **Create a new Web Service** with these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

3. **Set Environment Variables** in the Render dashboard (see list above)

4. **Deploy** - Render will automatically deploy your app

## How It Works

- **Development Mode**: Uses polling (when running locally)
- **Production Mode**: Uses webhooks (when deployed on Render.com)

The bot automatically detects the environment and switches between polling and webhook modes.

## Webhook Setup

The webhook is automatically configured when the app starts in production mode. The webhook URL will be:
```
https://your-app.onrender.com/bot<YOUR_TELEGRAM_API_KEY>
```

## Database Storage

The app automatically detects the environment:

- **Production (with MongoDB credentials)**: Uses MongoDB Atlas for persistent storage
- **Development (no MongoDB credentials)**: Uses local `db.json` file

### Why MongoDB?

Render.com uses ephemeral storage - any files created (like `db.json`) are lost on restart. MongoDB Atlas provides:
- ✅ Free tier (512MB storage)
- ✅ Persistent data storage
- ✅ Automatic backups
- ✅ Global availability

## Troubleshooting

### 409 Conflict Error
If you see "terminated by other getUpdates request", it means:
- Multiple instances are running (old deployment still active)
- Another bot instance is polling
- **Solution**: The webhook mode in this update fixes this issue

### Webhook Not Working
1. Check that `NODE_ENV=production` is set in Render
2. Verify your Render app URL is accessible
3. Check Render logs for webhook setup confirmation

### Database Connection Issues
1. Verify `MONGODB_USER` and `MONGODB_PASSWORD` are correctly set
2. Check MongoDB Atlas IP whitelist includes 0.0.0.0/0
3. Ensure database user has read/write permissions
4. Check Render logs for "Connected to MongoDB Atlas" message
5. If connection fails, app will fall back to local storage (data will be lost on restart)

## Testing Locally

To test locally with polling mode:
```bash
npm install
npm start
```

Make sure `NODE_ENV` is NOT set to `production` when testing locally.