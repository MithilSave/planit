import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );
        
        // Create default categories
        const defaultCategories = ['Work', 'Personal', 'Shopping', 'Health'];
        for (const categoryName of defaultCategories) {
            await pool.execute(
                'INSERT INTO categories (name, user_id) VALUES (?, ?)',
                [categoryName, result.insertId]
            );
        }
        
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt for:', email);
        
        // Find user
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            console.log('User not found:', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log('Invalid password for:', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Generate token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('Login successful for user:', user.id);
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

export default router;