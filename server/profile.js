import express from 'express';
import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';
import auth from './middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'resume-' + uniqueSuffix + ext);
    }
});

// File filter to only allow certain file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Get user profile
router.get('/', auth, async (req, res) => {
    try {
        console.log('Fetching profile for user ID:', req.user.id);
        
        const db = await connectToDatabase();
        const profile = await db.collection('profiles').findOne({ userId: req.user.id });
        
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        
        res.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile: ' + error.message });
    }
});

// Create or update user profile
router.post('/', auth, async (req, res) => {
    try {
        console.log('Updating profile for user ID:', req.user.id);
        console.log('Request body:', req.body);
        
        const { name, email, title, skills, experience, education } = req.body;
        
        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }
        
        const db = await connectToDatabase();
        
        // Format profile data
        const profileData = {
            userId: req.user.id,
            name,
            email,
            title: title || '',
            skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
            experience: Array.isArray(experience) ? experience : (experience ? experience.split('\n').map(s => s.trim()).filter(Boolean) : []),
            education: Array.isArray(education) ? education : (education ? education.split('\n').map(s => s.trim()).filter(Boolean) : []),
            updatedAt: new Date()
        };
        
        // Check if profile already exists
        const existingProfile = await db.collection('profiles').findOne({ userId: req.user.id });
        
        if (existingProfile) {
            // Update existing profile
            const result = await db.collection('profiles').updateOne(
                { userId: req.user.id },
                { $set: profileData }
            );
            
            if (result.modifiedCount === 0) {
                return res.status(400).json({ error: 'Failed to update profile' });
            }
            
            // Get updated profile
            const updatedProfile = await db.collection('profiles').findOne({ userId: req.user.id });
            res.json(updatedProfile);
        } else {
            // Create new profile
            profileData.createdAt = new Date();
            
            const result = await db.collection('profiles').insertOne(profileData);
            
            if (!result.insertedId) {
                return res.status(400).json({ error: 'Failed to create profile' });
            }
            
            const newProfile = await db.collection('profiles').findOne({ _id: result.insertedId });
            res.status(201).json(newProfile);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile: ' + error.message });
    }
});

// Upload resume
router.post('/resume', auth, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        console.log('Resume uploaded for user ID:', req.user.id);
        console.log('File details:', req.file);
        
        const db = await connectToDatabase();
        
        // Update profile with resume information
        const result = await db.collection('profiles').updateOne(
            { userId: req.user.id },
            { 
                $set: { 
                    resumeUrl: req.file.filename,
                    resumeOriginalName: req.file.originalname,
                    resumeUpdatedAt: new Date()
                } 
            },
            { upsert: true }
        );
        
        // Get updated profile
        const updatedProfile = await db.collection('profiles').findOne({ userId: req.user.id });
        
        res.json({
            success: true,
            message: 'Resume uploaded successfully',
            resumeUrl: req.file.filename,
            resumeOriginalName: req.file.originalname,
            profile: updatedProfile
        });
    } catch (error) {
        console.error('Error uploading resume:', error);
        res.status(500).json({ error: 'Failed to upload resume: ' + error.message });
    }
});

// Delete resume
router.delete('/resume', auth, async (req, res) => {
    try {
        console.log('Deleting resume for user ID:', req.user.id);
        
        const db = await connectToDatabase();
        
        // Get current profile to find resume filename
        const profile = await db.collection('profiles').findOne({ userId: req.user.id });
        
        if (!profile || !profile.resumeUrl) {
            return res.status(404).json({ error: 'No resume found' });
        }
        
        // Delete file from filesystem
        const filePath = path.join(__dirname, '../uploads', profile.resumeUrl);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Update profile to remove resume information
        const result = await db.collection('profiles').updateOne(
            { userId: req.user.id },
            { 
                $unset: { 
                    resumeUrl: "",
                    resumeOriginalName: "",
                    resumeUpdatedAt: ""
                } 
            }
        );
        
        if (result.modifiedCount === 0) {
            return res.status(400).json({ error: 'Failed to update profile' });
        }
        
        res.json({
            success: true,
            message: 'Resume deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting resume:', error);
        res.status(500).json({ error: 'Failed to delete resume: ' + error.message });
    }
});

// Get resume file
router.get('/resume/:filename', auth, (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../uploads', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        
        res.sendFile(filePath);
    } catch (error) {
        console.error('Error retrieving resume:', error);
        res.status(500).json({ error: 'Failed to retrieve resume: ' + error.message });
    }
});

// Update profile photo
router.put('/photo', auth, async (req, res) => {
    try {
        const { photoUrl } = req.body;
        
        if (!photoUrl) {
            return res.status(400).json({ error: 'Photo URL is required' });
        }
        
        console.log('Updating profile photo for user:', req.user.id);
        
        const db = await connectToDatabase();
        
        // Update user's profile photo in the users collection
        const userResult = await db.collection('users').updateOne(
            { _id: new ObjectId(req.user.id) },
            { 
                $set: { 
                    profilePhoto: photoUrl,
                    updatedAt: new Date()
                } 
            }
        );
        
        if (userResult.matchedCount === 0) {
            console.error('User not found for ID:', req.user.id);
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Also update the user profile if it exists
        await db.collection('userProfiles').updateOne(
            { userId: req.user.id },
            { 
                $set: { 
                    profilePhoto: photoUrl,
                    updatedAt: new Date()
                } 
            },
            { upsert: true }
        );
        
        console.log('Profile photo updated successfully for user:', req.user.id);
        
        // Get updated user
        const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(req.user.id) });
        
        res.json({
            id: updatedUser._id.toString(),
            name: updatedUser.name,
            email: updatedUser.email,
            title: updatedUser.title || '',
            skills: updatedUser.skills || [],
            profilePhoto: updatedUser.profilePhoto || ''
        });
    } catch (error) {
        console.error('Error updating profile photo:', error.message);
        res.status(500).json({ error: `Failed to update profile photo: ${error.message}` });
    }
});

export default router;
