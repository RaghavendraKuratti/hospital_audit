import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const auditReceipt = async (imageBuffer) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "Extract the Product Name, Variant (Color/Storage), and Total Price Paid from this Indian e-commerce receipt. Return JSON: { name, variant, price, platform }";

    const result = await model.generateContent([
        prompt,
        { inlineData: { data: imageBuffer.toString("base64"), mimeType: "image/jpeg" } }
    ]);
    return JSON.parse(result.response.text());
};