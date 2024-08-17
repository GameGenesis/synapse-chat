import mongoose from "mongoose";

const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/ChatbotDB";

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
}

declare global {
    var mongoose: any;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const dbConnect = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(MONGODB_URI)
            .then((mongoose) => {
                console.log('Connected to MongoDB');
                return mongoose;
            })
            .catch(() => console.warn("Could not connect to MongoDB"));
    }
    console.log('Connected to MongoDB (Cached)');
    cached.conn = await cached.promise;
    return cached.conn;
};

export default dbConnect;
