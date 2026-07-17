-- ============================================================
-- Smart Gym Platform — PostgreSQL Database Setup
-- Run: psql -U gym_user -d smart_gym -f database/setup.sql
--
-- NOTE: unlike the old MySQL script, this file does NOT create
-- the database or user. When run via docker-compose, the
-- official postgres image already creates them from the
-- POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD env vars.
-- If running manually, create them first:
--   CREATE DATABASE smart_gym;
--   CREATE USER gym_user WITH PASSWORD 'gym_password';
--   GRANT ALL PRIVILEGES ON DATABASE smart_gym TO gym_user;
-- ============================================================

-- ─── Enum types ────────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('member', 'trainer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE goal_type AS ENUM ('weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general_fitness');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('active', 'inactive', 'suspended', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Trigger helper: auto-update `updated_at` (replaces MySQL's ON UPDATE) ──
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Trainers ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trainers (
    id               SERIAL PRIMARY KEY,
    user_id          INT NULL,
    name             VARCHAR(255) NOT NULL,
    specialization   VARCHAR(255),
    rating           FLOAT DEFAULT 0.0,
    experience_years INT DEFAULT 0,
    bio              TEXT,
    avatar_url       VARCHAR(500),
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT now()
);

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                 SERIAL PRIMARY KEY,
    email              VARCHAR(255) NOT NULL UNIQUE,
    hashed_password    VARCHAR(255) NOT NULL,
    full_name          VARCHAR(255) NOT NULL,
    role               user_role DEFAULT 'member',
    age                INT,
    weight             FLOAT,
    height             FLOAT,
    goal               goal_type DEFAULT 'general_fitness',
    membership_status  membership_status DEFAULT 'active',
    trainer_id         INT NULL REFERENCES trainers(id) ON DELETE SET NULL,
    phone              VARCHAR(20),
    avatar_url         VARCHAR(500),
    created_at         TIMESTAMPTZ DEFAULT now(),
    updated_at         TIMESTAMPTZ,
    last_login         TIMESTAMPTZ
);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ─── Workouts ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workouts (
    id               SERIAL PRIMARY KEY,
    user_id          INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_type     VARCHAR(100) NOT NULL,
    duration_minutes INT NOT NULL,
    calories_burned  FLOAT,
    notes            TEXT,
    difficulty       VARCHAR(20) DEFAULT 'medium',
    exercises        TEXT,
    created_at       TIMESTAMPTZ DEFAULT now()
);

-- ─── Attendance ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
    id               SERIAL PRIMARY KEY,
    user_id          INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in         TIMESTAMPTZ DEFAULT now(),
    check_out        TIMESTAMPTZ,
    duration_minutes INT
);

-- ─── Payments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount          FLOAT NOT NULL,
    currency        VARCHAR(10) DEFAULT 'USD',
    payment_type    VARCHAR(50),
    status          VARCHAR(50) DEFAULT 'completed',
    transaction_id  VARCHAR(255) UNIQUE,
    is_flagged      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── Diet Logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diet_logs (
    id        SERIAL PRIMARY KEY,
    user_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calories  FLOAT NOT NULL,
    protein_g FLOAT,
    carbs_g   FLOAT,
    fat_g     FLOAT,
    meal_type VARCHAR(50),
    notes     TEXT,
    logged_at TIMESTAMPTZ DEFAULT now()
);

-- ─── ML Predictions cache ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ml_predictions (
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_type VARCHAR(100),
    prediction TEXT,
    confidence FLOAT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Seed Data ───────────────────────────────────────────────────────────────
INSERT INTO trainers (name, specialization, rating, experience_years, bio) VALUES
('Alex Johnson',  'Strength & Conditioning', 4.8, 8,  'NSCA-certified strength coach specialising in powerlifting and athletic performance.'),
('Maria Santos',  'Yoga & Flexibility',       4.9, 12, 'E-RYT 500 yoga instructor with expertise in therapeutic yoga and mindfulness.'),
('David Kim',     'HIIT & Cardio',            4.7, 5,  'ACSM-certified personal trainer focused on high-intensity interval training.'),
('Sarah Williams','Nutrition & Wellness',     4.6, 7,  'Registered dietitian and personal trainer with expertise in body recomposition.')
ON CONFLICT DO NOTHING;

-- Admin user (password: Admin@123)
INSERT INTO users (email, hashed_password, full_name, role, age, weight, height, goal, membership_status) VALUES
('admin@smartgym.com',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhN3wFd.q1p2C6g3Z9oR3e',
 'Gym Admin', 'admin', 35, 80.0, 178.0, 'general_fitness', 'active')
ON CONFLICT (email) DO NOTHING;
