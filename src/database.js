import { MongoClient } from 'mongodb';

// Build MongoDB URI from environment variables
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_CLUSTER = process.env.MONGODB_CLUSTER || 'cluster0.mongodb.net';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'vigilx';

// Validate required credentials
if (!MONGODB_USER || !MONGODB_PASSWORD) {
    throw new Error('MongoDB credentials not found. Please set MONGODB_USER and MONGODB_PASSWORD environment variables.');
}

// Build connection URI
const MONGODB_URI = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_CLUSTER}/${MONGODB_DATABASE}?retryWrites=true&w=majority`;

// Initialize MongoDB connection
const mongoClient = new MongoClient(MONGODB_URI);
await mongoClient.connect();
const mongoDb = mongoClient.db(MONGODB_DATABASE);
console.log('✅ Connected to MongoDB Atlas');

// Helper function to get users collection
const getUsersCollection = () => mongoDb.collection('users');

export const upsertUser = async (chatId, name) => {
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
};

export const addProduct = async (chatId, product) => {
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
};

export const getAllUsers = async () => {
    const collection = getUsersCollection();
    return await collection.find({}).toArray();
};

export const updateUserTracking = async (chatId, tracking) => {
    const collection = getUsersCollection();
    await collection.updateOne(
        { chatId },
        { $set: { tracking } }
    );
};

// Graceful shutdown
process.on('SIGINT', async () => {
    if (mongoClient) {
        await mongoClient.close();
        console.log('MongoDB connection closed');
    }
    process.exit(0);
});