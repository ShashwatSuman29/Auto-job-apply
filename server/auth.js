import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, title, skills } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const db = await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with additional fields
    const newUser = {
      name,
      email,
      password: hashedPassword,
      title: title || '',
      skills: skills || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);
    
    // Create JWT token
    const token = jwt.sign(
      { id: result.insertedId.toString(), email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user info (without password) and token
    res.status(201).json({
      token,
      user: {
        id: result.insertedId.toString(),
        name: newUser.name,
        email: newUser.email,
        title: newUser.title,
        skills: newUser.skills
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const db = await connectToDatabase();
    
    // Find user by email
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user info (without password) and token
    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        title: user.title || '',
        skills: user.skills || []
      }
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user (protected route)
router.get('/me', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.id) });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user info (without password)
    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      title: user.title || '',
      skills: user.skills || []
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(401).json({ error: 'Token is not valid' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { name, email, title, skills } = req.body;
    
    // Validate input
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    const db = await connectToDatabase();
    
    // Check if email is already taken by another user
    if (email !== decoded.email) {
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser && existingUser._id.toString() !== decoded.id) {
        return res.status(400).json({ error: 'Email is already in use' });
      }
    }
    
    // Update user profile
    const updateData = {
      name,
      email,
      title: title || '',
      skills: skills || [],
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(decoded.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create new token if email changed
    let newToken = token;
    if (email !== decoded.email) {
      newToken = jwt.sign(
        { id: decoded.id, email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
    }
    
    // Return updated user info
    res.json({
      token: newToken,
      user: {
        id: decoded.id,
        name,
        email,
        title: title || '',
        skills: skills || []
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
