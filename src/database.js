import { JSONFilePreset } from 'lowdb/node';

// Structure: Each user has a unique ID and a list of items being hunted.
const defaultData = { users: [] };
export const db = await JSONFilePreset('db.json', defaultData);

export const upsertUser = async (chatId, name) => {
    const user = db.data.users.find(u => u.chatId === chatId);
    if (!user) {
        db.data.users.push({ chatId, name, tracking: [], totalRefundsClaimed: 0 });
        await db.write();
    }
};

export const addProduct = async (chatId, product) => {
    const user = db.data.users.find(u => u.chatId === chatId);
    if (user) {
        user.tracking.push({ id: Date.now(), ...product });
        await db.write();
    }
};