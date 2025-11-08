import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { updateUserStats } from './gamification.js';

const router = express.Router();

// Get all tasks for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [tasks] = await pool.execute(`
            SELECT t.*, c.name as category_name, c.color as category_color 
            FROM tasks t 
            LEFT JOIN categories c ON t.category_id = c.id 
            WHERE t.user_id = ? 
            ORDER BY t.created_at DESC
        `, [req.user.id]);
        
        res.json(tasks);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create task
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, description, priority, due_date, category_id } = req.body;
        
        const [result] = await pool.execute(
            `INSERT INTO tasks (title, description, priority, due_date, user_id, category_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, description, priority, due_date, req.user.id, category_id]
        );
        
        // Update gamification stats
        try {
            await updateUserStats(req.user.id, 'task_created');
        } catch (error) {
            console.error('Failed to update user stats for task creation:', error);
        }
        
        const [newTask] = await pool.execute(`
            SELECT t.*, c.name as category_name, c.color as category_color 
            FROM tasks t 
            LEFT JOIN categories c ON t.category_id = c.id 
            WHERE t.id = ?
        `, [result.insertId]);
        
        res.status(201).json(newTask[0]);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const { status } = req.body;

        console.log('Update request for task:', taskId, 'Status:', status);

        // Get old task status
        const [existingTasks] = await pool.execute(
            'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
            [taskId, req.user.id]
        );

        if (existingTasks.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const oldTask = existingTasks[0];

        const [result] = await pool.execute(
            `UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ? AND user_id = ?`,
            [status, taskId, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Update gamification stats if task was completed
        if (status === 'completed' && oldTask.status !== 'completed') {
            try {
                await updateUserStats(req.user.id, 'task_completed');
            } catch (error) {
                console.error('Failed to update user stats:', error);
            }
        }

        res.json({ 
            message: 'Task updated successfully',
            taskId: taskId
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        
        await pool.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.user.id]);
        
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

export default router;