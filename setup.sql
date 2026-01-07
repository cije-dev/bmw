-- BMW Database Setup
CREATE DATABASE IF NOT EXISTS bmw_db;
USE bmw_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    scores JSON DEFAULT '[]',
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ra_wellness (
    id INT PRIMARY KEY,
    activity TEXT NOT NULL,
    source TEXT NOT NULL,
    priority JSON NOT NULL
);

-- Seed ra_wellness table
INSERT IGNORE INTO ra_wellness VALUES
(1, 'Physical activity (e.g., walking or exercise)', 'NHS exercise guidelines', '["high","moderate"]'),
(2, 'Mindfulness or meditation', 'NHS mindfulness guide', '["high","mild"]'),
(3, 'Connect with others socially', 'APA social connections', '["low","mild"]'),
(4, 'Get restorative sleep', 'APA lifestyle page', '["all"]'),
(5, 'Practice gratitude or journaling', 'Greater Good Health routines', '["moderate","low"]'),
(6, 'Healthy eating', 'APA nutrition info', '["high"]');

-- Create index for better performance
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_priority ON ra_wellness((priority));
