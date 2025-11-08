import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'planit_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        
        await initializeTables();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('\n🔧 Please check your database configuration in .env file');
        process.exit(1);
    }
};

const initializeTables = async () => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Categories table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                user_id INT,
                color VARCHAR(7) DEFAULT '#007bff',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Tasks table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                status ENUM('pending', 'completed') DEFAULT 'pending',
                priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
                due_date DATE,
                user_id INT,
                category_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
            )
        `);

        // Task history table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS task_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_id INT,
                action VARCHAR(50) NOT NULL,
                old_values JSON,
                new_values JSON,
                changed_by INT,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Gamification tables
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_stats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNIQUE NOT NULL,
                total_points INT DEFAULT 0,
                current_level INT DEFAULT 1,
                current_streak INT DEFAULT 0,
                longest_streak INT DEFAULT 0,
                last_activity_date DATE,
                tasks_completed INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS achievements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                icon VARCHAR(50) DEFAULT 'bi-trophy',
                color VARCHAR(7) DEFAULT '#ffd700',
                criteria_type ENUM('tasks_completed', 'streak', 'points', 'level') NOT NULL,
                criteria_value INT NOT NULL,
                points_reward INT DEFAULT 0
            )
        `);

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_achievements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                achievement_id INT NOT NULL,
                earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_achievement (user_id, achievement_id)
            )
        `);

        // Insert default achievements
        const [existingAchievements] = await connection.execute('SELECT COUNT(*) as count FROM achievements');
        if (existingAchievements[0].count === 0) {
            await connection.execute(`
                INSERT INTO achievements (name, description, icon, color, criteria_type, criteria_value, points_reward) VALUES
                ('First Steps', 'Complete your first task', 'bi-star', '#ff6b6b', 'tasks_completed', 1, 10),
                ('Task Master', 'Complete 10 tasks', 'bi-award', '#4ecdc4', 'tasks_completed', 10, 50),
                ('Productivity Pro', 'Complete 50 tasks', 'bi-trophy', '#45b7d1', 'tasks_completed', 50, 200),
                ('Week Warrior', '7-day streak', 'bi-lightning', '#f9c80e', 'streak', 7, 100),
                ('Month Master', '30-day streak', 'bi-fire', '#ff6b6b', 'streak', 30, 500),
                ('Early Bird', 'Complete a task before 9 AM', 'bi-sun', '#f9c80e', 'tasks_completed', 1, 25),
                ('Night Owl', 'Complete a task after 9 PM', 'bi-moon', '#4a4e69', 'tasks_completed', 1, 25),
                ('Speed Demon', 'Complete a task within 1 hour of creation', 'bi-lightning-charge', '#9b5de5', 'tasks_completed', 1, 30),
                ('Overachiever', 'Reach level 5', 'bi-rocket', '#00bbf9', 'level', 5, 100),
                ('Legend', 'Reach level 10', 'bi-crown', '#ff6b6b', 'level', 10, 300)
            `);
        }

        await connection.commit();
        console.log('✅ Database tables created successfully');
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error creating tables:', error.message);
    } finally {
        connection.release();
    }
};

// Test connection on startup
testConnection();

export default pool;