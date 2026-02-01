import { getAllUsers, updateUserTracking } from './database.js';
import { scrapeLivePrice } from './scraper.js';

export const runTrackerLoop = async (bot) => {
    const users = await getAllUsers(); // Get all users from DB
    console.log("Users", users);
    
    for (const user of users) {
        let trackingUpdated = false;
        
        for (const item of user.tracking) {
            // Skip if no URL is available
            if (!item.url) {
                console.log(`Skipping ${item.name} - no URL provided`);
                continue;
            }
            
            const livePrice = await scrapeLivePrice(item.url);
            
            // Skip if scraping failed
            if (!livePrice) {
                console.log(`Failed to scrape price for ${item.name}`);
                continue;
            }
            
            const pricePaid = item.price || item.pricePaid || 0;
            
            if (livePrice < pricePaid) {
                const refund = pricePaid - livePrice;
                
                // Update current price in tracking item
                item.currentPrice = livePrice;
                trackingUpdated = true;
                
                // INTIMATION: Message with Action Button
                const opts = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `💸 Claim ₹${refund} Refund`, callback_data: `claim_${item.id}` }]
                        ]
                    }
                };

                bot.sendMessage(user.chatId, `🚨 JACKPOT!\n${item.name} dropped to ₹${livePrice}!`, opts);
            }
        }
        
        // Update user tracking if any prices changed
        if (trackingUpdated) {
            await updateUserTracking(user.chatId, user.tracking);
        }
    }
};