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
        const prompt = `
        Act as a Senior Health Audit Consultant specializing in CGHS (Central Government Health Scheme) and IRDAI (Insurance Regulatory and Development Authority of India) compliance.
        Analyze the provided medical bill image against these SPECIFIC national standards:
        1. **CGHS Rate Compliance:** Check if Room Rent and Consultation fees exceed the capped rates for a 'NABH Accredited' hospital in a Tier 1 city (Pune/Metro).
        2. **Non-Payable Items (IRDAI):** Identify charges for 'Consumables' that are legally non-payable (e.g., gloves, masks, syringes, admission kits, pulse oximetry charges) as per the 2016/2021 IRDAI Master Circular.
        3. **Unbundling Audit:** Identify if the hospital is charging separately for items that should be part of the 'Package Rate' (e.g., OT charges including disposables).
        4. **Phantom Charges:** Flag vague entries like 'Service Charges' or 'Medical Equipment' that lack itemization.

        FORMAT YOUR REPORT:
        - **Statutory Violations:** List each charge that violates a specific government guideline.
        - **Inflation Index:** The percentage markup over standard CGHS rates.
        - **Total Recovery Amount:** The exact INR the patient should demand back.
        `;
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