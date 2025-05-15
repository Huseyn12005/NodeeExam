import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}

export const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        console.log("MongoDB disconnected");
    } catch (error) {
        console.error("MongoDB disconnection error:", error);
    }
}

const dbMethods = {
    connectDB,
    disconnectDB
}

export default dbMethods