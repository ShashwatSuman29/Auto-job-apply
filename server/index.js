import express from 'express';
import cors from 'cors';
import jobRoutes from './api.js';
import authRoutes from './auth.js';
import credentialRoutes from './credentials.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', jobRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/credentials', credentialRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});