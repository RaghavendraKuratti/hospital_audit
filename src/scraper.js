import axios from 'axios';
import * as cheerio from 'cheerio';

export const scrapeLivePrice = async (productUrl) => {
    try {
        const { data } = await axios.get(productUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const $ = cheerio.load(data);
        
        // Amazon India Selector for 2026
        let priceText = $('.a-price-whole').first().text().replace(/[,.]/g, '');
        
        // Flipkart Selector for 2026 (Fallback)
        if (!priceText) {
            priceText = $('._30jeq3').first().text().replace(/[₹,]/g, '');
        }

        const price = parseInt(priceText);
        return price || null;
    } catch (error) {
        console.error("Scraping failed:", error.message);
        return null;
    }
};