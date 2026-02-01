# Deployment Guide for Render.com

## Environment Variables Required

Set these environment variables in your Render.com dashboard:

1. `TELEGRAM_API_KEY` - Your Telegram Bot API key
2. `GEMINI_API_KEY` - Your Google Gemini API key
3. `GEMINI_API_MODEL` - Model name (e.g., `gemini-1.5-flash`)
4. `NODE_ENV` - Set to `production`
5. `WEBHOOK_URL` (Optional) - Your Render.com app URL (e.g., `https://your-app.onrender.com`)

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

## Testing Locally

To test locally with polling mode:
```bash
npm install
npm start
```

Make sure `NODE_ENV` is NOT set to `production` when testing locally.