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
        let productTitle = '';
        
        if (platform?.toLowerCase().includes('amazon')) {
            // Amazon: Find best matching product
            const products = [];
            
            // Get all product cards
            $('[data-component-type="s-search-result"]').each((i, elem) => {
                const title = $(elem).find('h2 a span').text().trim();
                const priceWhole = $(elem).find('.a-price-whole').first().text().replace(/[,.]/g, '');
                const priceValue = parseInt(priceWhole);
                
                if (title && priceValue) {
                    products.push({ title, price: priceValue });
                }
            });
            
            // Find best match based on product name similarity
            const bestMatch = findBestMatch(productName, variant, products);
            if (bestMatch) {
                price = bestMatch.price;
                productTitle = bestMatch.title;
            }
            
        } else if (platform?.toLowerCase().includes('flipkart')) {
            // Flipkart: Find best matching product
            const products = [];
            
            // Get all product cards
            $('._1AtVbE').each((i, elem) => {
                const title = $(elem).find('._4rR01T').text().trim() || $(elem).find('.IRpwTa').text().trim();
                const priceText = $(elem).find('._30jeq3').text().replace(/[₹,]/g, '');
                const priceValue = parseInt(priceText);
                
                if (title && priceValue) {
                    products.push({ title, price: priceValue });
                }
            });
            
            // Find best match
            const bestMatch = findBestMatch(productName, variant, products);
            if (bestMatch) {
                price = bestMatch.price;
                productTitle = bestMatch.title;
            }
        }
        
        if (price) {
            console.log(`💰 Found matching product: "${productTitle.substring(0, 50)}..." - ₹${price}`);
        } else {
            console.log(`❌ No matching product found`);
        }
        
        return price || null;
    } catch (error) {
        console.error("Search scraping failed:", error.message);
        return null;
    }
};

// Helper function to find best matching product
function findBestMatch(productName, variant, products) {
    if (!products || products.length === 0) return null;
    
    const searchTerms = `${productName} ${variant || ''}`.toLowerCase().split(' ').filter(t => t.length > 2);
    
    let bestMatch = null;
    let highestScore = 0;
    
    for (const product of products) {
        const titleLower = product.title.toLowerCase();
        let score = 0;
        
        // Count how many search terms appear in the title
        for (const term of searchTerms) {
            if (titleLower.includes(term)) {
                score++;
            }
        }
        
        // Prefer products with higher match scores
        if (score > highestScore) {
            highestScore = score;
            bestMatch = product;
        }
    }
    
    // Only return if we have at least some matching terms
    return highestScore >= Math.min(2, searchTerms.length) ? bestMatch : products[0];
}