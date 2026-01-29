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

bot.start((ctx) => ctx.reply('Upload a photo of a hospital bill. I will find the corruption.'));


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
        await sendLongMessage(ctx, `--- SHADOW AUDITOR REPORT ---\n\n${auditReport}`);
    } catch (error) {
        console.error(error);
        ctx.reply('❌ The system choked on that image. Try a clearer photo.');
    }
});

bot.launch();