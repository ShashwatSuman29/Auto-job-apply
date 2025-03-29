import express from 'express';
import { connectToDatabase, closeDatabaseConnection } from '../db.js';
import { ObjectId } from 'mongodb';
import auth from './middleware/auth.js';

const router = express.Router();

// Get all job applications
router.get('/jobs', auth, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const jobs = await db.collection('jobs').find({ user: req.user.id }).toArray();
        res.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

// Search job applications
router.get('/jobs/search', auth, async (req, res) => {
    try {
        const { query, status, company, dateFrom, dateTo } = req.query;
        const db = await connectToDatabase();
        
        // Build search filter
        const filter = { user: req.user.id };
        
        // Text search on job title, company name, and description
        if (query) {
            // Split the query into words for better partial matching
            const searchTerms = query.trim().split(/\s+/).filter(term => term.length > 0);
            
            if (searchTerms.length > 0) {
                // Create OR conditions for each search term and each field
                const orConditions = [];
                
                for (const term of searchTerms) {
                    orConditions.push(
                        { jobTitle: { $regex: term, $options: 'i' } },
                        { companyName: { $regex: term, $options: 'i' } },
                        { description: { $regex: term, $options: 'i' } },
                        { location: { $regex: term, $options: 'i' } },
                        // Add search for position type (if it exists in your schema)
                        { positionType: { $regex: term, $options: 'i' } },
                        // Add search for skills or requirements (if they exist in your schema)
                        { skills: { $regex: term, $options: 'i' } },
                        { requirements: { $regex: term, $options: 'i' } }
                    );
                }
                
                filter.$or = orConditions;
            }
        }
        
        // Filter by status
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        // Filter by company
        if (company) {
            filter.companyName = { $regex: company, $options: 'i' };
        }
        
        // Filter by application date range
        if (dateFrom || dateTo) {
            filter.applicationDate = {};
            
            if (dateFrom) {
                filter.applicationDate.$gte = new Date(dateFrom);
            }
            
            if (dateTo) {
                filter.applicationDate.$lte = new Date(dateTo);
            }
        }
        
        console.log('Search filter:', JSON.stringify(filter, null, 2));
        
        // Execute search query
        const jobs = await db.collection('jobs').find(filter).toArray();
        console.log(`Found ${jobs.length} matching jobs`);
        res.json(jobs);
    } catch (error) {
        console.error('Error searching jobs:', error);
        res.status(500).json({ error: 'Failed to search jobs' });
    }
});

// Get a single job application by ID
router.get('/jobs/:id', auth, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const { id } = req.params;
        
        // Validate ObjectId
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid job ID format' });
        }
        
        const job = await db.collection('jobs').findOne({ 
            _id: new ObjectId(id),
            user: req.user.id 
        });
        
        if (!job) {
            return res.status(404).json({ error: 'Job application not found' });
        }
        
        res.json(job);
    } catch (error) {
        console.error('Error fetching job by ID:', error);
        res.status(500).json({ error: 'Failed to fetch job application' });
    }
});

// Add a new job application
router.post('/jobs', auth, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const jobData = {
            ...req.body,
            user: req.user.id,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await db.collection('jobs').insertOne(jobData);
        res.status(201).json({ ...jobData, _id: result.insertedId });
    } catch (error) {
        console.error('Error adding job:', error);
        res.status(500).json({ error: 'Failed to add job' });
    }
});

// Update a job application
router.put('/jobs/:id', auth, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const { id } = req.params;
        
        // Convert string ID to MongoDB ObjectId
        const objectId = new ObjectId(id);
        
        // Add updated timestamp
        const updateData = {
            ...req.body,
            updatedAt: new Date()
        };
        
        const result = await db.collection('jobs').updateOne(
            { _id: objectId, user: req.user.id },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        res.json({ ...updateData, _id: id });
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ error: 'Failed to update job' });
    }
});

// Delete a job application
router.delete('/jobs/:id', auth, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const { id } = req.params;
        
        // Convert string ID to MongoDB ObjectId
        const objectId = new ObjectId(id);
        
        const result = await db.collection('jobs').deleteOne({ 
            _id: objectId,
            user: req.user.id
        });
        
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