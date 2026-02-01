import { JSONFilePreset } from 'lowdb/node';
import { MongoClient } from 'mongodb';

// Build MongoDB URI from environment variables
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_CLUSTER = process.env.MONGODB_CLUSTER || 'cluster0.mongodb.net';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'vigilx';

let mongoClient = null;
let mongoDb = null;

// Initialize MongoDB connection if credentials are provided
if (MONGODB_USER && MONGODB_PASSWORD) {
    try {
        const MONGODB_URI = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_CLUSTER}/${MONGODB_DATABASE}?retryWrites=true&w=majority`;
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        mongoDb = mongoClient.db(MONGODB_DATABASE);
        console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.log('Falling back to local JSON storage');
    }
}

// Fallback to local JSON file for development
const defaultData = { users: [] };
export const db = !mongoDb ? await JSONFilePreset('db.json', defaultData) : null;

// Helper function to get users collection
const getUsersCollection = () => {
    if (mongoDb) {
        return mongoDb.collection('users');
    }
    return null;
};

export const upsertUser = async (chatId, name) => {
    if (mongoDb) {
        // MongoDB implementation
        const collection = getUsersCollection();
        const existingUser = await collection.findOne({ chatId });
        
        if (!existingUser) {
            await collection.insertOne({
                chatId,
                name,
                tracking: [],
                totalRefundsClaimed: 0,
                createdAt: new Date()
            });
        }
    } else {
        // Local JSON implementation
        const user = db.data.users.find(u => u.chatId === chatId);
        if (!user) {
            db.data.users.push({ chatId, name, tracking: [], totalRefundsClaimed: 0 });
            await db.write();
        }
    }
};

export const addProduct = async (chatId, product) => {
    if (mongoDb) {
        // MongoDB implementation
        const collection = getUsersCollection();
        await collection.updateOne(
            { chatId },
            {
                $push: {
                    tracking: {
                        id: Date.now(),
                        ...product,
                        addedAt: new Date()
                    }
                }
            }
        );
    } else {
        // Local JSON implementation
        const user = db.data.users.find(u => u.chatId === chatId);
        if (user) {
            user.tracking.push({ id: Date.now(), ...product });
            await db.write();
        }
    }
};

export const getAllUsers = async () => {
    if (mongoDb) {
        const collection = getUsersCollection();
        return await collection.find({}).toArray();
    } else {
        return db.data.users;
    }
};

export const updateUserTracking = async (chatId, tracking) => {
    if (mongoDb) {
        const collection = getUsersCollection();
        await collection.updateOne(
            { chatId },
            { $set: { tracking } }
        );
    } else {
        const user = db.data.users.find(u => u.chatId === chatId);
        if (user) {
            user.tracking = tracking;
            await db.write();
        }
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    if (mongoClient) {
        await mongoClient.close();
        console.log('MongoDB connection closed');
    }
    process.exit(0);
});