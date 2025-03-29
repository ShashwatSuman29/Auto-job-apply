import express from 'express';
import cors from 'cors';
import jobRoutes from './api.js';
import authRoutes from './auth.js';
import credentialRoutes from './credentials.js';
import profileRoutes from './profile.js';
import settingsRoutes from './settings.js';
import autoApplyRoutes from './autoApply.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory at:', uploadsDir);
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api', jobRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auto-apply', autoApplyRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Uploads directory: ${uploadsDir}`);
});