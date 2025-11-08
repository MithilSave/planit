CREATE DATABASE IF NOT EXISTS planit_db;
USE planit_db;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    user_id INT,
    color VARCHAR(7) DEFAULT '#007bff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tasks table
CREATE TABLE tasks (
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
);

-- Task history table for audit trail
CREATE TABLE task_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT,
    action VARCHAR(50) NOT NULL,
    old_values JSON,
    new_values JSON,
    changed_by INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Gamification tables
CREATE TABLE user_stats (
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
);

CREATE TABLE achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'bi-trophy',
    color VARCHAR(7) DEFAULT '#ffd700',
    criteria_type ENUM('tasks_completed', 'streak', 'points', 'level') NOT NULL,
    criteria_value INT NOT NULL,
    points_reward INT DEFAULT 0
);

CREATE TABLE user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id)
);

-- Insert default achievements
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
('Legend', 'Reach level 10', 'bi-crown', '#ff6b6b', 'level', 10, 300);

-- Sessions table for better tracking
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(500) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add last_login to users table
ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL AFTER created_at;