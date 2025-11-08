import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Points system configuration
const POINTS_CONFIG = {
    TASK_COMPLETED: 10,
    TASK_CREATED: 2,
    STREAK_BONUS: 5,
    LEVEL_MULTIPLIER: 100
};

// Update user stats
const updateUserStats = async (userId, action) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Get current stats
        const [stats] = await connection.execute(
            'SELECT * FROM user_stats WHERE user_id = ?',
            [userId]
        );

        let currentStats = stats[0];
        if (!currentStats) {
            await connection.execute(
                'INSERT INTO user_stats (user_id) VALUES (?)',
                [userId]
            );
            currentStats = {
                total_points: 0,
                current_level: 1,
                current_streak: 0,
                longest_streak: 0,
                tasks_completed: 0
            };
        }

        let pointsEarned = 0;
        let newStreak = currentStats.current_streak;
        const today = new Date().toISOString().split('T')[0];

        switch (action) {
            case 'task_completed':
                pointsEarned += POINTS_CONFIG.TASK_COMPLETED;
                
                // Streak logic
                if (currentStats.last_activity_date) {
                    const lastDate = new Date(currentStats.last_activity_date);
                    const todayDate = new Date(today);
                    const diffTime = todayDate - lastDate;
                    const diffDays = diffTime / (1000 * 60 * 60 * 24);
                    
                    if (diffDays === 1) {
                        newStreak += 1;
                        pointsEarned += newStreak * POINTS_CONFIG.STREAK_BONUS;
                    } else if (diffDays > 1) {
                        newStreak = 1;
                    }
                } else {
                    newStreak = 1;
                }

                await connection.execute(
                    'UPDATE user_stats SET tasks_completed = tasks_completed + 1 WHERE user_id = ?',
                    [userId]
                );
                break;

            case 'task_created':
                pointsEarned += POINTS_CONFIG.TASK_CREATED;
                break;
        }

        // Update points and level
        const newTotalPoints = currentStats.total_points + pointsEarned;
        const newLevel = Math.floor(newTotalPoints / POINTS_CONFIG.LEVEL_MULTIPLIER) + 1;

        await connection.execute(
            `UPDATE user_stats 
             SET total_points = ?, current_level = ?, current_streak = ?, 
                 longest_streak = GREATEST(longest_streak, ?), last_activity_date = ?
             WHERE user_id = ?`,
            [newTotalPoints, newLevel, newStreak, newStreak, today, userId]
        );

        await connection.commit();
        
        return {
            pointsEarned,
            newLevel,
            newStreak,
            newTotalPoints
        };
    } catch (error) {
        await connection.rollback();
        console.error('Update stats error:', error);
        throw error;
    } finally {
        connection.release();
    }
};

// Get user stats
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const [stats] = await pool.execute(`
            SELECT us.*, COUNT(ua.id) as achievements_count
            FROM user_stats us 
            LEFT JOIN user_achievements ua ON us.user_id = ua.user_id
            WHERE us.user_id = ?
            GROUP BY us.id
        `, [req.user.id]);

        if (stats.length === 0) {
            return res.json({
                total_points: 0,
                current_level: 1,
                current_streak: 0,
                longest_streak: 0,
                tasks_completed: 0,
                achievements_count: 0
            });
        }

        res.json(stats[0]);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Get user achievements
router.get('/achievements', authenticateToken, async (req, res) => {
    try {
        const [achievements] = await pool.execute(`
            SELECT a.*, ua.earned_at IS NOT NULL as earned
            FROM achievements a
            LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
            ORDER BY a.criteria_value
        `, [req.user.id]);

        res.json(achievements);
    } catch (error) {
        console.error('Get achievements error:', error);
        res.status(500).json({ error: 'Failed to get achievements' });
    }
});

export { router, updateUserStats };