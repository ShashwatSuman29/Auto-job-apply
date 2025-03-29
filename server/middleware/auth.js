import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT token and add user data to request
export default function auth(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');
    
    // Check if no token
    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }
    
    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Ensure the decoded token has the required user data
        if (!decoded || !decoded.id) {
            return res.status(401).json({ error: 'Invalid token structure' });
        }
        
        // Add user from payload to request
        req.user = decoded;
        console.log('Authenticated user:', req.user.id);
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        res.status(401).json({ error: 'Token is not valid' });
    }
}
