import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all categories for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [categories] = await pool.execute(
            'SELECT * FROM categories WHERE user_id = ? ORDER BY name',
            [req.user.id]
        );
        
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

// Create category
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, color } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO categories (name, color, user_id) VALUES (?, ?, ?)',
            [name, color, req.user.id]
        );
        
        const [newCategory] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json(newCategory[0]);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

export default router;