-- ============================================================
-- Smart Gym Platform — MySQL Database Setup
-- Run: mysql -u root -p < database/setup.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_gym CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'gym_user'@'localhost' IDENTIFIED BY 'gym_password';
GRANT ALL PRIVILEGES ON smart_gym.* TO 'gym_user'@'localhost';
FLUSH PRIVILEGES;

USE smart_gym;

-- ─── Trainers ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trainers (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NULL,
    name             VARCHAR(255) NOT NULL,
    specialization   VARCHAR(255),
    rating           FLOAT DEFAULT 0.0,
    experience_years INT DEFAULT 0,
    bio              TEXT,
    avatar_url       VARCHAR(500),
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    email              VARCHAR(255) NOT NULL UNIQUE,
    hashed_password    VARCHAR(255) NOT NULL,
    full_name          VARCHAR(255) NOT NULL,
    role               ENUM('member','trainer','admin') DEFAULT 'member',
    age                INT,
    weight             FLOAT,
    height             FLOAT,
    goal               ENUM('weight_loss','muscle_gain','endurance','flexibility','general_fitness') DEFAULT 'general_fitness',
    membership_status  ENUM('active','inactive','suspended','cancelled') DEFAULT 'active',
    trainer_id         INT NULL,
    phone              VARCHAR(20),
    avatar_url         VARCHAR(500),
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME ON UPDATE CURRENT_TIMESTAMP,
    last_login         DATETIME,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
);

-- ─── Workouts ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workouts (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NOT NULL,
    workout_type     VARCHAR(100) NOT NULL,
    duration_minutes INT NOT NULL,
    calories_burned  FLOAT,
    notes            TEXT,
    difficulty       VARCHAR(20) DEFAULT 'medium',
    exercises        TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Attendance ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NOT NULL,
    check_in         DATETIME DEFAULT CURRENT_TIMESTAMP,
    check_out        DATETIME,
    duration_minutes INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Payments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    amount          FLOAT NOT NULL,
    currency        VARCHAR(10) DEFAULT 'USD',
    payment_type    VARCHAR(50),
    status          VARCHAR(50) DEFAULT 'completed',
    transaction_id  VARCHAR(255) UNIQUE,
    is_flagged      BOOLEAN DEFAULT FALSE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Diet Logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diet_logs (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    user_id   INT NOT NULL,
    calories  FLOAT NOT NULL,
    protein_g FLOAT,
    carbs_g   FLOAT,
    fat_g     FLOAT,
    meal_type VARCHAR(50),
    notes     TEXT,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── ML Predictions cache ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ml_predictions (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    model_type VARCHAR(100),
    prediction TEXT,
    confidence FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Seed Data ───────────────────────────────────────────────────────────────
INSERT INTO trainers (name, specialization, rating, experience_years, bio) VALUES
('Alex Johnson',  'Strength & Conditioning', 4.8, 8,  'NSCA-certified strength coach specialising in powerlifting and athletic performance.'),
('Maria Santos',  'Yoga & Flexibility',       4.9, 12, 'E-RYT 500 yoga instructor with expertise in therapeutic yoga and mindfulness.'),
('David Kim',     'HIIT & Cardio',            4.7, 5,  'ACSM-certified personal trainer focused on high-intensity interval training.'),
('Sarah Williams','Nutrition & Wellness',     4.6, 7,  'Registered dietitian and personal trainer with expertise in body recomposition.');

-- Admin user (password: Admin@123)
INSERT INTO users (email, hashed_password, full_name, role, age, weight, height, goal, membership_status) VALUES
('admin@smartgym.com',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhN3wFd.q1p2C6g3Z9oR3e',
 'Gym Admin', 'admin', 35, 80.0, 178.0, 'general_fitness', 'active');
