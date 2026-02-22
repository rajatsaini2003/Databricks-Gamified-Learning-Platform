-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tier VARCHAR(50) DEFAULT 'Data Apprentice',
    total_xp INTEGER DEFAULT 0,
    avatar_url TEXT,
    cosmetics JSONB DEFAULT '{}', -- Store equipped items
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_total_xp ON users(total_xp DESC);
CREATE INDEX idx_users_username ON users(username);

-- 2. Challenges Table
CREATE TABLE challenges (
    id VARCHAR(100) PRIMARY KEY, -- e.g., 'sql_shore_1', 'sql_shore_2'
    island_id VARCHAR(50) NOT NULL, -- 'sql_shore' or 'python_peninsula'
    section_id VARCHAR(50) NOT NULL,
    order_index INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    story_context TEXT,
    description TEXT NOT NULL,
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    expected_output JSONB, -- Expected result structure/data
    datasets JSONB, -- Initial data for the challenge
    hints JSONB DEFAULT '[]',
    time_estimate INTEGER, -- In minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_challenges_island_section ON challenges(island_id, section_id, order_index);

-- 3. User Progress Table
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_id VARCHAR(100) REFERENCES challenges(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    score INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    best_time INTEGER, -- In seconds
    last_code TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, challenge_id)
);

CREATE INDEX idx_user_progress_user ON user_progress(user_id);

-- 4. Guilds Table
CREATE TABLE guilds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    emblem_url TEXT,
    leader_id UUID REFERENCES users(id),
    total_xp INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 1,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guilds_total_xp ON guilds(total_xp DESC);

-- 5. Guild Members Table
CREATE TABLE guild_members (
    guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    contribution_xp INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
);

-- 6. PvP Matches Table
CREATE TABLE pvp_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id VARCHAR(100) REFERENCES challenges(id),
    player1_id UUID REFERENCES users(id),
    player2_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, completed, expired, declined
    player1_submitted BOOLEAN DEFAULT FALSE,
    player2_submitted BOOLEAN DEFAULT FALSE,
    player1_score INTEGER,
    player2_score INTEGER,
    player1_code TEXT,
    player2_code TEXT,
    winner_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_pvp_matches_players ON pvp_matches(player1_id, player2_id);

-- 7. Achievements Table
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- 8. Leaderboard Cache (Materialized View or Table)
-- Using a standard table for simplified updates via application logic or triggers, 
-- or a Materialized View if we want periodic refreshes. 
-- For this setup, we'll use a standard table that Redis/Background jobs can update.
CREATE TABLE leaderboard_cache (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    tier VARCHAR(50),
    total_xp INTEGER,
    rank INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_xp ON leaderboard_cache(total_xp DESC);