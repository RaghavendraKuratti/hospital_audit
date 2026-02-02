import { getAllUsers, updateUserTracking } from './database.js';
import { scrapeLivePrice, searchAndGetPrice } from './scraper.js';

export const runTrackerLoop = async (bot) => {
    const users = await getAllUsers(); // Get all users from DB
    console.log(`🔍 Checking prices for ${users.length} users...`);
    
    for (const user of users) {
        let trackingUpdated = false;
        
        for (const item of user.tracking) {
            let livePrice = null;
            
            // Try to get price from URL if available
            if (item.url) {
                console.log(`📍 Scraping from URL: ${item.name}`);
                livePrice = await scrapeLivePrice(item.url);
            }
            
            // If no URL or URL scraping failed, search by product name
            if (!livePrice && item.name) {
                console.log(`🔎 Searching for: ${item.name}`);
                livePrice = await searchAndGetPrice(item.name, item.variant, item.platform);
            }
            
            // Skip if both methods failed
            if (!livePrice) {
                console.log(`❌ Failed to get price for ${item.name}`);
                continue;
            }
            
            const pricePaid = item.price || item.pricePaid || 0;
            
            // Update current price in tracking item
            item.currentPrice = livePrice;
            trackingUpdated = true;
            
            if (livePrice < pricePaid) {
                const refund = pricePaid - livePrice;
                
                // INTIMATION: Message with Action Button
                const opts = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `💸 Claim ₹${refund} Refund`, callback_data: `claim_${item.id}` }]
                        ]
                    }
                };

                bot.sendMessage(user.chatId, `🚨 JACKPOT!\n${item.name} dropped to ₹${livePrice}!\n\nYou paid: ₹${pricePaid}\nCurrent price: ₹${livePrice}\nPotential refund: ₹${refund}`, opts);
            } else {
                console.log(`✅ ${item.name}: ₹${pricePaid} → ₹${livePrice} (no drop)`);
            }
        }
        
        // Update user tracking if any prices changed
        if (trackingUpdated) {
            await updateUserTracking(user.chatId, user.tracking);
        }
    }
    
    console.log('✅ Price check completed');
};