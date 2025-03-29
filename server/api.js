import express from 'express';
import { connectToDatabase, closeDatabaseConnection } from '../db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Get all job applications
router.get('/jobs', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const jobs = await db.collection('jobs').find({}).toArray();
        res.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

// Add a new job application
router.post('/jobs', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const result = await db.collection('jobs').insertOne(req.body);
        res.status(201).json({ ...req.body, _id: result.insertedId });
    } catch (error) {
        console.error('Error adding job:', error);
        res.status(500).json({ error: 'Failed to add job' });
    }
});

// Update a job application
router.put('/jobs/:id', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const { id } = req.params;
        
        // Convert string ID to MongoDB ObjectId
        const objectId = new ObjectId(id);
        
        const result = await db.collection('jobs').updateOne(
            { _id: objectId },
            { $set: req.body }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        res.json({ ...req.body, _id: id });
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ error: 'Failed to update job' });
    }
});

// Delete a job application
router.delete('/jobs/:id', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const { id } = req.params;
        
        // Convert string ID to MongoDB ObjectId
        const objectId = new ObjectId(id);
        
        const result = await db.collection('jobs').deleteOne({ _id: objectId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ error: 'Failed to delete job' });
    }
});

export default router;