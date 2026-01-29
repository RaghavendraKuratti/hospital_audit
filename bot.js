import { Telegraf } from 'telegraf';
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import dotenv from "dotenv";
import http from 'http';

const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Auditor is Active');
}).listen(port);


dotenv.config();

// --- CONFIG ---
const bot = new Telegraf(process.env.TELEGRAM_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_API_MODEL });

console.log("🚀 Portable Shadow Auditor is waking up...");

bot.start((ctx) => {
    ctx.replyWithMarkdown(`
        👋 **Welcome to VigilHealth Auditor!**
        I help you find hidden overcharges in your hospital bills using AI.

        🛡️ **Privacy Guarantee:**
        - Blur your name/address before uploading.
        - I don't store your photos or personal data.
        - I only care about the numbers.

        **How to use:**
        Simply send me a clear photo of your hospital bill.
    `);
});


const sendLongMessage = async (ctx, text) => {
    const limit = 4000;
    let startIndex = 0;

    while (startIndex < text.length) {
        let endIndex = startIndex + limit;

        // If we're not at the end of the text, find the last newline or space
        if (endIndex < text.length) {
            const lastNewline = text.lastIndexOf('\n', endIndex);
            const lastSpace = text.lastIndexOf(' ', endIndex);

            // Prioritize breaking at a newline, then a space
            if (lastNewline > startIndex) {
                endIndex = lastNewline;
            } else if (lastSpace > startIndex) {
                endIndex = lastSpace;
            }
        }

        const chunk = text.substring(startIndex, endIndex).trim();
        if (chunk) {
            await ctx.reply(chunk, { parse_mode: 'Markdown' });
        }

        startIndex = endIndex;
    }
};

bot.on('photo', async (ctx) => {
    ctx.reply('🔍 Analyzing for overcharges and IRDAI violations... hang tight.');

    try {
        // 1. Get the image URL from Telegram
        const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        const fileUrl = await ctx.telegram.getFileLink(fileId);

        // 2. Download the image as a buffer
        const response = await axios.get(fileUrl.href, { responseType: 'arraybuffer' });
        const base64Image = Buffer.from(response.data).toString('base64');

        // 3. Send to Gemini
        const prompt = process.env.AUDIT_PROMPT || "Audit this bill for overcharges and IRDAI violations.";
        console.log(`📸 Prompt: ${prompt}`);

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
        ]);

        // 4. Reply to your phone using sendLongMessage to handle long responses
        const auditReport = result.response.text();

        const disclaimer = "\n\n---\n*⚖️ VigilHealth Advisory: This AI report is for educational purposes. Always verify with a legal expert before filing a formal grievance.*";
        await sendLongMessage(ctx, `--- SHADOW AUDITOR REPORT ---\n\n${auditReport}${disclaimer}`);
    } catch (error) {
        console.error(error);
        ctx.reply('❌ The system choked on that image. Try a clearer photo.');
    }
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log("✅ VigilHealth Auditor is now active and listening for bills!");