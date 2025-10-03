import mongoose from "mongoose"
import {config} from "./../config/config.js"

export const connectDb = async() => {
    try {
        const conn = await mongoose.connect(config.mongoUrl, {
            serverSelectionTimeoutMS: 5000
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1); // Exit if MongoDB fails to connect
    }
}