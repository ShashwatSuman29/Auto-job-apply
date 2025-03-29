import express from 'express';
import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';
import auth from './middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get all credentials for a user
// Protected route - requires authentication
router.get('/', auth, async (req, res) => {
    try {
        console.log('Fetching credentials for user ID:', req.user.id);
        
        // Ensure user ID is available
        if (!req.user || !req.user.id) {
            console.log('User authentication failed: No user ID in request');
            return res.status(401).json({ error: 'User authentication failed' });
        }
        
        const db = await connectToDatabase();
        
        // Find credentials for this user
        const credentials = await db.collection('credentials')
            .find({ userId: req.user.id })
            .toArray();
            
        console.log(`Found ${credentials.length} credentials for user ${req.user.id}`);
            
        // Don't send actual passwords to the client
        const sanitizedCredentials = credentials.map(cred => ({
            ...cred,
            password: '••••••••••' // Replace actual password with dots
        }));
        
        res.json(sanitizedCredentials);
    } catch (error) {
        console.error('Error fetching credentials:', error);
        res.status(500).json({ error: 'Failed to fetch credentials: ' + error.message });
    }
});

// Add a new credential
// Protected route - requires authentication
router.post('/', auth, async (req, res) => {
    try {
        console.log('Received credential save request');
        console.log('User ID from token:', req.user.id);
        console.log('Request body:', { ...req.body, password: '[REDACTED]' });
        
        const { portalName, username, password, url, notes } = req.body;
        
        // Validate required fields
        if (!portalName || !username || !password) {
            console.log('Validation failed: Missing required fields');
            return res.status(400).json({ error: 'Portal name, username, and password are required' });
        }

        // Ensure user ID is available
        if (!req.user || !req.user.id) {
            console.log('User authentication failed: No user ID in request');
            return res.status(401).json({ error: 'User authentication failed' });
        }
        
        const db = await connectToDatabase();
        
        // Hash the password before storing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newCredential = {
            userId: req.user.id,
            portalName,
            username,
            password: hashedPassword,
            url: url || '',
            notes: notes || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        console.log('Adding credential for user:', req.user.id);
        console.log('Credential data:', { ...newCredential, password: '[REDACTED]' });
        
        const result = await db.collection('credentials').insertOne(newCredential);
        console.log('Credential added successfully, ID:', result.insertedId);
        
        // Return the credential with masked password
        res.status(201).json({ 
            ...newCredential, 
            _id: result.insertedId,
            password: '••••••••••' // Replace actual password with dots
        });
    } catch (error) {
        console.error('Error adding credential:', error);
        res.status(500).json({ error: 'Failed to add credential: ' + error.message });
    }
});

// Update a credential
// Protected route - requires authentication
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { portalName, username, password, url, notes } = req.body;
        
        // Validate required fields
        if (!portalName || !username) {
            return res.status(400).json({ error: 'Portal name and username are required' });
        }
        
        const db = await connectToDatabase();
        const objectId = new ObjectId(id);
        
        // First check if the credential belongs to the user
        const credential = await db.collection('credentials').findOne({ 
            _id: objectId,
            userId: req.user.id
        });
        
        if (!credential) {
            return res.status(404).json({ error: 'Credential not found or not authorized' });
        }
        
        // Prepare update object
        const updateData = {
            portalName,
            username,
            url: url || '',
            notes: notes || '',
            updatedAt: new Date()
        };
        
        // Only update password if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }
        
        const result = await db.collection('credentials').updateOne(
            { _id: objectId },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Credential not found' });
        }
        
        // Return updated credential with masked password
        res.json({ 
            ...updateData, 
            _id: id,
            password: '••••••••••' // Replace actual password with dots
        });
    } catch (error) {
        console.error('Error updating credential:', error);
        res.status(500).json({ error: 'Failed to update credential' });
    }
});

// Delete a credential
// Protected route - requires authentication
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await connectToDatabase();
        const objectId = new ObjectId(id);
        
        // First check if the credential belongs to the user
        const credential = await db.collection('credentials').findOne({ 
            _id: objectId,
            userId: req.user.id
        });
        
        if (!credential) {
            return res.status(404).json({ error: 'Credential not found or not authorized' });
        }
        
        const result = await db.collection('credentials').deleteOne({ _id: objectId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Credential not found' });
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting credential:', error);
        res.status(500).json({ error: 'Failed to delete credential' });
    }
});

export default router;
