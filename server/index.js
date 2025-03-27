import express from 'express';
import cors from 'cors';
import jobRoutes from './api.js';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', jobRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 