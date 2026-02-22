-- Migration 002: Gamification Enhancement Tables
-- Adds tables for streaks, daily rewards, cosmetics, quests, notifications, and session tracking

-- 1. Streaks Table - Track daily login streaks
CREATE TABLE streaks (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_login_date DATE,
    streak_bonuses_claimed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_streaks_user ON streaks(user_id);

-- 2. Daily Rewards Table - Track daily login rewards
CREATE TABLE daily_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reward_date DATE NOT NULL,
    reward_type VARCHAR(50) NOT NULL, -- 'xp', 'cosmetic', 'multiplier'
    reward_value INTEGER NOT NULL, -- XP amount or cosmetic ID
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, reward_date)
);

CREATE INDEX idx_daily_rewards_user_date ON daily_rewards(user_id, reward_date);

-- 3. Cosmetics Table - Store available cosmetic items
CREATE TABLE cosmetics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cosmetic_type VARCHAR(50) NOT NULL, -- 'avatar_border', 'avatar_bg', 'badge', 'title'
    rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
    xp_cost INTEGER DEFAULT 0,
    unlock_condition JSONB, -- e.g., {"achievement": "first_challenge", "xp": 1000}
    data JSONB, -- Store CSS classes, colors, image URLs, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. User Cosmetics - Track which cosmetics users own
CREATE TABLE user_cosmetics (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cosmetic_id UUID REFERENCES cosmetics(id) ON DELETE CASCADE,
    equipped BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, cosmetic_id)
);

CREATE INDEX idx_user_cosmetics_user ON user_cosmetics(user_id);

-- 5. Quests Table - Daily and weekly challenges
CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    quest_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'special'
    objective JSONB NOT NULL, -- e.g., {"type": "complete_challenges", "count": 3}
    xp_reward INTEGER DEFAULT 0,
    cosmetic_reward UUID REFERENCES cosmetics(id),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. User Quests Progress - Track quest completion
CREATE TABLE user_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0, -- Current progress toward objective
    completed BOOLEAN DEFAULT FALSE,
    claimed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, quest_id)
);

CREATE INDEX idx_user_quests_user ON user_quests(user_id);
CREATE INDEX idx_user_quests_quest ON user_quests(quest_id);

-- 7. Notifications Table - Achievement unlocks and system notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'achievement', 'level_up', 'quest_complete', 'reward'
    title VARCHAR(100) NOT NULL,
    message TEXT,
    data JSONB, -- Additional metadata (achievement ID, XP earned, etc.)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- 8. Session Time Table - Track time spent in sessions
CREATE TABLE session_time (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER, -- Calculated on session end
    challenges_completed INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_time_user ON session_time(user_id);
CREATE INDEX idx_session_time_start ON session_time(session_start DESC);

-- 9. Milestones Table - Track progress milestones
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    milestone_type VARCHAR(50) NOT NULL, -- 'xp', 'challenges', 'streak', 'island'
    threshold INTEGER NOT NULL, -- e.g., 1000 XP, 50 challenges, 7 day streak
    xp_reward INTEGER DEFAULT 0,
    cosmetic_reward UUID REFERENCES cosmetics(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. User Milestones - Track which milestones users have achieved
CREATE TABLE user_milestones (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, milestone_id)
);

CREATE INDEX idx_user_milestones_user ON user_milestones(user_id);

-- Add XP multiplier column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_multiplier DECIMAL(3,2) DEFAULT 1.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_session_id UUID;

-- Add last_activity timestamp for better session tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE;

-- Seed some basic cosmetics
INSERT INTO cosmetics (name, description, cosmetic_type, rarity, xp_cost, data) VALUES
('Bronze Border', 'A simple bronze avatar border', 'avatar_border', 'common', 0, '{"borderColor": "#CD7F32", "borderWidth": "3px", "borderStyle": "solid"}'),
('Silver Border', 'A sleek silver avatar border', 'avatar_border', 'common', 100, '{"borderColor": "#C0C0C0", "borderWidth": "3px", "borderStyle": "solid"}'),
('Gold Border', 'A prestigious gold avatar border', 'avatar_border', 'rare', 500, '{"borderColor": "#FFD700", "borderWidth": "3px", "borderStyle": "solid"}'),
('Diamond Border', 'A legendary diamond avatar border', 'avatar_border', 'epic', 2000, '{"borderColor": "#B9F2FF", "borderWidth": "4px", "borderStyle": "double", "glow": true}'),
('Ocean Gradient', 'A calming ocean gradient background', 'avatar_bg', 'common', 200, '{"gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"}'),
('Fire Gradient', 'A fierce fire gradient background', 'avatar_bg', 'rare', 800, '{"gradient": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"}'),
('Code Master Title', 'Show off your mastery', 'title', 'epic', 5000, '{"text": "Code Master", "color": "#FFD700"}'),
('SQL Wizard Badge', 'Badge for SQL mastery', 'badge', 'rare', 1000, '{"icon": "database", "color": "#4299e1"}');

-- Seed some milestones
INSERT INTO milestones (name, description, milestone_type, threshold, xp_reward) VALUES
('First Steps', 'Earn your first XP', 'xp', 1, 50),
('Century Club', 'Reach 100 XP', 'xp', 100, 100),
('XP Warrior', 'Reach 500 XP', 'xp', 500, 250),
('XP Legend', 'Reach 1000 XP', 'xp', 1000, 500),
('Master Navigator', 'Reach 5000 XP', 'xp', 5000, 1000),
('First Challenge', 'Complete your first challenge', 'challenges', 1, 50),
('Challenge Apprentice', 'Complete 5 challenges', 'challenges', 5, 150),
('Challenge Expert', 'Complete 10 challenges', 'challenges', 10, 300),
('Challenge Master', 'Complete 25 challenges', 'challenges', 25, 750),
('Week Warrior', 'Maintain a 7-day streak', 'streak', 7, 500),
('Month Champion', 'Maintain a 30-day streak', 'streak', 30, 2000);

COMMENT ON TABLE streaks IS 'Tracks daily login streaks for gamification';
COMMENT ON TABLE daily_rewards IS 'Daily login rewards for user engagement';
COMMENT ON TABLE cosmetics IS 'Available cosmetic items for avatar customization';
COMMENT ON TABLE user_cosmetics IS 'Cosmetics owned by users';
COMMENT ON TABLE quests IS 'Daily and weekly quests for additional engagement';
COMMENT ON TABLE user_quests IS 'User progress on active quests';
COMMENT ON TABLE notifications IS 'Achievement and system notifications';
COMMENT ON TABLE session_time IS 'Session tracking for analytics and time-based rewards';
COMMENT ON TABLE milestones IS 'Progress milestones definitions';
COMMENT ON TABLE user_milestones IS 'Milestones achieved by users';
