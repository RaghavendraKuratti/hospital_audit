import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const auditReceipt = async (imageBuffer) => {
    try {
        if (!imageBuffer || imageBuffer.length === 0) {
            throw new Error('Invalid image buffer');
        }

        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_API_MODEL });
        const prompt = "Extract the Product Name, Variant (Color/Storage), and Total Price Paid from this Indian e-commerce receipt. Return ONLY valid JSON in this exact format: { \"name\": \"product name\", \"variant\": \"variant\", \"price\": \"price as number\", \"platform\": \"platform name\" }. Do not include any markdown formatting or code blocks.";

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageBuffer.toString("base64"), mimeType: "image/jpeg" } }
        ]);

        const responseText = result.response.text();
        
        // Clean the response text to remove markdown code blocks if present
        let cleanedText = responseText.trim();
        if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/```\n?/g, '');
        }
        
        const parsedData = JSON.parse(cleanedText.trim());
        
        // Validate required fields
        if (!parsedData.name || !parsedData.price) {
            throw new Error('Missing required fields in receipt data');
        }
        
        // Ensure price is a number
        if (typeof parsedData.price === 'string') {
            parsedData.price = parseFloat(parsedData.price.replace(/[^\d.]/g, ''));
        }
        
        return parsedData;
    } catch (error) {
        console.error('Error in auditReceipt:', error);
        throw new Error(`Failed to analyze receipt: ${error.message}`);
    }
};