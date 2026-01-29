import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
dotenv.config();

console.log("\n🔍 Initiating Shadow Health Audit...", process.env.GEMINI_API_KEY, process.env.GEMINI_API_MODEL);


// 1. THE BRAIN: Use your API Key from Google AI Studio
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_API_MODEL });


function fileToGenerativePart(path, mimeType) {
    return {
      inlineData: {
        data: Buffer.from(fs.readFileSync(path)).toString("base64"),
        mimeType
      },
    };
  }

async function runAudit(imagePath) {
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
    - **Total Recovery Amount:** The exact INR the patient should demand back.`;
// Change 'image/jpeg' to 'application/pdf' if using a PDF
    const imagePart = fileToGenerativePart(imagePath, "image/jpeg");

    try {
        const result = await model.generateContent([prompt, imagePart]);
        console.log("\n--- SHADOW AUDITOR REPORT ---");
        console.log(result.response.text());
    } catch (error) {
        console.error("Audit Failed:", error);
    }
}





runAudit("assets/fortis-1.jpg");

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function runNationalAudit() {
  const directoryPath = "./assets"; // Folder with your 5 bills
  const files = fs.readdirSync(directoryPath);
  const resultsTable = [];

  console.log(`\n🚀 Initializing National Health Audit for ${files.length} bills...\n`);

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    console.log(`🔍 Auditing: ${file}...`);

    const filePart = {
      inlineData: {
        data: fs.readFileSync(filePath).toString("base64"),
        mimeType: "image/jpeg" // Adjust to "application/pdf" if needed
      }
    };

    const prompt = `
    Analyze this hospital bill against CGHS and IRDAI 2021 guidelines. 
    Return ONLY a JSON object with these keys: 
    { "Hospital": string, "TotalBill": number, "PotentialSavings": number, "TopViolation": string, "CorruptionScore": number (1-10) }
    `;

    try {
      const result = await model.generateContent([prompt, filePart]);
      console.log(`🔍 Auditing Res : ${result.response.text().slice(4)}`);
      const auditJson = JSON.parse(result.response.text().slice(4));
      resultsTable.push(auditJson);
    } catch (e) {
      console.error(`❌ Failed to audit ${file}:`, e.message);
    }
    await delay(10000);
  }

  // 2. THE POWER VIEW
  console.log("\n--- NATIONAL CORRUPTION COMPARISON REPORT ---");
  console.table(resultsTable);
  
  const totalNationSavings = resultsTable.reduce((sum, r) => sum + r.PotentialSavings, 0);
  console.log(`\n💰 TOTAL RECOVERABLE WEALTH FROM THIS SAMPLE: ₹${totalNationSavings.toLocaleString()}`);
}

// runNationalAudit();
