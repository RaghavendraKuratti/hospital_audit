import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.TELEGRAM_API_KEY);

async function clearWebhook() {
    try {
        console.log('🔄 Deleting webhook...');
        const result = await bot.deleteWebHook();
        console.log('✅ Webhook deleted successfully:', result);
        
        // Verify webhook is deleted
        const webhookInfo = await bot.getWebHookInfo();
        console.log('📋 Current webhook info:', webhookInfo);
        
        if (webhookInfo.url === '') {
            console.log('✅ Webhook is now cleared. You can run the bot in polling mode.');
        } else {
            console.log('⚠️ Webhook still exists:', webhookInfo.url);
        }
    } catch (error) {
        console.error('❌ Error clearing webhook:', error);
    }
    process.exit(0);
}

clearWebhook();