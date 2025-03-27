import { MongoClient } from 'mongodb';

// MongoDB connection URI
const uri = "mongodb+srv://shashwatsumanat29:Shashwat%4029@cluster0.yfh4ijr.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoDB client
const client = new MongoClient(uri);

// Function to connect to the database
async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Successfully connected to MongoDB.');
        return client.db(); // Returns database instance
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

// Function to close the database connection
async function closeDatabaseConnection() {
    try {
        await client.close();
        console.log('Database connection closed.');
    } catch (error) {
        console.error('Error closing database connection:', error);
        throw error;
    }
}

export {
    connectToDatabase,
    closeDatabaseConnection,
    client
}; 