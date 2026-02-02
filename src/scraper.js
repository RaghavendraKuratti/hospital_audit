import axios from 'axios';
import * as cheerio from 'cheerio';

// Scrape price from direct product URL
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

// Search for product and get price
export const searchAndGetPrice = async (productName, variant, platform) => {
    try {
        const searchQuery = `${productName} ${variant || ''}`.trim();
        let searchUrl;
        
        if (platform?.toLowerCase().includes('amazon')) {
            searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(searchQuery)}`;
        } else if (platform?.toLowerCase().includes('flipkart')) {
            searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(searchQuery)}`;
        } else {
            // Default to Amazon
            searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(searchQuery)}`;
        }
        
        console.log(`🔍 Searching: ${searchUrl}`);
        
        const { data } = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const $ = cheerio.load(data);
        
        let price = null;
        
        if (platform?.toLowerCase().includes('amazon')) {
            // Get first product price from Amazon search results
            const priceWhole = $('.a-price-whole').first().text().replace(/[,.]/g, '');
            price = parseInt(priceWhole);
        } else if (platform?.toLowerCase().includes('flipkart')) {
            // Get first product price from Flipkart search results
            const priceText = $('._30jeq3').first().text().replace(/[₹,]/g, '');
            price = parseInt(priceText);
        }
        
        console.log(`💰 Found price: ₹${price || 'N/A'}`);
        return price || null;
    } catch (error) {
        console.error("Search scraping failed:", error.message);
        return null;
    }
};