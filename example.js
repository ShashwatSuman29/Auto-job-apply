import { connectToDatabase, closeDatabaseConnection } from './db.js';

async function example() {
    try {
        // Connect to the database
        const db = await connectToDatabase();
        
        // Example: Insert a document into a collection
        const collection = db.collection('your_collection_name');
        await collection.insertOne({
            title: "Test Document",
            createdAt: new Date()
        });
        
        // Example: Find documents
        const documents = await collection.find({}).toArray();
        console.log('Found documents:', documents);
        
        // Close the connection when done
        await closeDatabaseConnection();
    } catch (error) {
        console.error('Error:', error);
        await closeDatabaseConnection();
    }
}

// Run the example
example(); 