import express from 'express';
import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';
import auth from './middleware/auth.js';

const router = express.Router();

// Get user settings
router.get('/', auth, async (req, res) => {
    try {
        console.log('Fetching settings for user ID:', req.user.id);
        
        const db = await connectToDatabase();
        const settings = await db.collection('settings').findOne({ userId: req.user.id });
        
        if (!settings) {
            // Return default settings if none exist
            return res.json({
                userId: req.user.id,
                darkMode: false,
                emailNotifications: true,
                autoApplyPreferences: {
                    jobTitles: [],
                    locations: [],
                    salaryRange: {
                        min: 0,
                        max: 0
                    },
                    excludeCompanies: [],
                    includeRemote: true
                }
            });
        }
        
        res.json(settings);
    } catch (error) {
        console.error('Error fetching user settings:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user settings
router.post('/', auth, async (req, res) => {
    try {
        console.log('Updating settings for user ID:', req.user.id);
        
        const { darkMode, emailNotifications, autoApplyPreferences } = req.body;
        
        // Validate required fields
        if (autoApplyPreferences === undefined) {
            return res.status(400).json({ error: 'Auto apply preferences are required' });
        }
        
        // Validate autoApplyPreferences structure
        if (!autoApplyPreferences.jobTitles || !autoApplyPreferences.locations || 
            !autoApplyPreferences.salaryRange || autoApplyPreferences.excludeCompanies === undefined || 
            autoApplyPreferences.includeRemote === undefined) {
            return res.status(400).json({ error: 'Invalid auto apply preferences format' });
        }
        
        const db = await connectToDatabase();
        
        // Check if settings already exist for this user
        const existingSettings = await db.collection('settings').findOne({ userId: req.user.id });
        
        let result;
        
        if (existingSettings) {
            // Update existing settings
            result = await db.collection('settings').updateOne(
                { userId: req.user.id },
                { 
                    $set: { 
                        darkMode,
                        emailNotifications,
                        autoApplyPreferences,
                        updatedAt: new Date()
                    } 
                }
            );
            
            if (result.modifiedCount === 0) {
                return res.status(400).json({ error: 'Failed to update settings' });
            }
        } else {
            // Create new settings
            result = await db.collection('settings').insertOne({
                userId: req.user.id,
                darkMode,
                emailNotifications,
                autoApplyPreferences,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            if (!result.insertedId) {
                return res.status(400).json({ error: 'Failed to create settings' });
            }
        }
        
        // Get the updated settings
        const updatedSettings = await db.collection('settings').findOne({ userId: req.user.id });
        
        res.json(updatedSettings);
    } catch (error) {
        console.error('Error updating user settings:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
