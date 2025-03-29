import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection URI from environment variables
const uri = process.env.MONGODB_URI || "mongodb+srv://shashwatsumanat29:Shashwat%4029@cluster0.yfh4ijr.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoDB client
const client = new MongoClient(uri);

// Database connection instance
let dbInstance = null;

// Function to connect to the database
export async function connectToDatabase() {
    try {
        if (!dbInstance) {
            await client.connect();
            dbInstance = client.db();
            console.log('Successfully connected to MongoDB.');
        }
        return dbInstance; // Returns database instance
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

// Function to close the database connection
export async function closeDatabaseConnection() {
    try {
        if (client) {
            await client.close();
            dbInstance = null;
            console.log('Database connection closed.');
        }
    } catch (error) {
        console.error('Error closing database connection:', error);
        throw error;
    }
}