import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { upsertUser, addProduct, getAllUsers } from './src/database.js';
import { auditReceipt } from './src/analyser.js';
import { runTrackerLoop } from './src/tracker.js';
import { generateClaimDraft } from './src/claim-gen.js';
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Telegram bot in polling mode
const bot = new TelegramBot(process.env.TELEGRAM_API_KEY, { polling: true });

// Simple HTTP server for Render.com port requirement
app.get('/', (req, res) => {
    res.send('Vigil-X Tracker is Active');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', bot: 'running', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`✅ HTTP server running on port ${port}`);
    console.log('✅ Telegram bot running in polling mode');
});

// A. Onboarding
bot.onText(/\/start/, async (msg) => {
    await upsertUser(msg.chat.id, msg.from.first_name);
    bot.sendMessage(msg.chat.id, "Vigil-X Active. Send me a receipt to start the hunt.");
});

// B. Data Intake (The "Add" Action)
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🔍 Auditing receipt...");
    
    try {
        // Download the photo
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const file = await bot.getFile(fileId);
        
        if (!file || !file.file_path) {
            throw new Error('Failed to retrieve image file from Telegram');
        }
        
        const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_API_KEY}/${file.file_path}`;
        
        // Fetch image as buffer
        const axios = (await import('axios')).default;
        const response = await axios.get(fileUrl, {
            responseType: 'arraybuffer',
            timeout: 30000 // 30 second timeout
        });
        
        if (!response.data || response.data.byteLength === 0) {
            throw new Error('Downloaded image is empty');
        }
        
        const imageBuffer = Buffer.from(response.data);
        
        // Pass to Gemini for analysis
        const productData = await auditReceipt(imageBuffer);
        
        if (!productData || !productData.name) {
            throw new Error('Could not extract product information from receipt');
        }
        
        await addProduct(chatId, productData);
        
        bot.sendMessage(chatId, `✅ Watchlist: ${productData.name}\nVariant: ${productData.variant || 'N/A'}\nPrice: ₹${productData.price}\nPlatform: ${productData.platform || 'Unknown'}\n\nMonitoring starts now.`);
    } catch (error) {
        console.error('Error processing photo:', error);
        const errorMessage = error.message || 'Unknown error occurred';
        bot.sendMessage(chatId, `❌ Failed to process receipt.\n\nError: ${errorMessage}\n\nPlease ensure:\n• The image is clear and readable\n• The receipt shows product name and price\n• Try taking a better photo and send again`);
    }
});

// C. Handle claim generation callback
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    
    if (data.startsWith('claim_')) {
        const itemId = parseInt(data.split('_')[1]);
        const users = await getAllUsers();
        const user = users.find(u => u.chatId === chatId);
        const item = user?.tracking.find(i => i.id === itemId);
        
        if (item) {
            const claimText = generateClaimDraft(
                { userName: user.name, lastFourDigits: 'XXXX', bankName: 'Your Bank' },
                {
                    productName: item.name,
                    purchaseDate: new Date(item.id).toLocaleDateString('en-IN'),
                    pricePaid: item.price,
                    currentPrice: item.currentPrice || item.price,
                    orderId: 'ORDER_ID'
                }
            );
            
            bot.sendMessage(chatId, `📝 Claim Draft:\n\n${claimText}`);
            bot.answerCallbackQuery(query.id, { text: 'Claim draft generated!' });
        }
    }
});

// D. The Action (Background Loop) - Run tracker every 12 hours
setInterval(async () => {
    await runTrackerLoop(bot);
}, 10 * 60 * 1000); // 12-hour hunt cycle

// Start the bot
console.log('Vigil-X Bot is running...');