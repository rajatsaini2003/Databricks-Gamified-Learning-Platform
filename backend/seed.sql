-- Seed Data for Databricks Learning Quest
-- Run after migrations/001_create_tables.sql

-- Clear existing data (for re-seeding)
TRUNCATE TABLE achievements CASCADE;
TRUNCATE TABLE user_progress CASCADE;
TRUNCATE TABLE pvp_matches CASCADE;
TRUNCATE TABLE guild_members CASCADE;
TRUNCATE TABLE guilds CASCADE;
TRUNCATE TABLE challenges CASCADE;
TRUNCATE TABLE leaderboard_cache CASCADE;
TRUNCATE TABLE users CASCADE;

-- Users (Password: 'password123' - bcrypt hash)
INSERT INTO users (id, username, email, password_hash, tier, total_xp) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'DataWizard', 'wizard@example.com', '$2b$10$rBV2JDeWW3.vKyeQcM8fFu0DnXL4JVqZ2/UYhVnlR5b8VJ.EiPnZO', 'Data Master', 12500),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QueryQueen', 'queen@example.com', '$2b$10$rBV2JDeWW3.vKyeQcM8fFu0DnXL4JVqZ2/UYhVnlR5b8VJ.EiPnZO', 'Data Master', 11800),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'SparkShark', 'shark@example.com', '$2b$10$rBV2JDeWW3.vKyeQcM8fFu0DnXL4JVqZ2/UYhVnlR5b8VJ.EiPnZO', 'Code Sorcerer', 10200),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'PipelinePro', 'pipeline@example.com', '$2b$10$rBV2JDeWW3.vKyeQcM8fFu0DnXL4JVqZ2/UYhVnlR5b8VJ.EiPnZO', 'Code Sorcerer', 9800),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'SQLSailor', 'sailor@example.com', '$2b$10$rBV2JDeWW3.vKyeQcM8fFu0DnXL4JVqZ2/UYhVnlR5b8VJ.EiPnZO', 'Pipeline Builder', 8500),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Pythoneer', 'python@example.com', '$2b$10$rBV2JDeWW3.vKyeQcM8fFu0DnXL4JVqZ2/UYhVnlR5b8VJ.EiPnZO', 'Pipeline Builder', 7200),
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'DeltaDiver', 'delta@example.com', '$2b$10$rBV2JDeWW3.vKyeQcM8fFu0DnXL4JVqZ2/UYhVnlR5b8VJ.EiPnZO', 'Pipeline Builder', 6800),
('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'CloudChaser', 'cloud@example.com', '$2b$10$rBV2JDeWW3.vKyeQcM8fFu0DnXL4JVqZ2/UYhVnlR5b8VJ.EiPnZO', 'Data Apprentice', 5500),
('30eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'AlgoAce', 'algo@example.com', '$2b$10$rBV2JDeWW3.vKyeQcM8fFu0DnXL4JVqZ2/UYhVnlR5b8VJ.EiPnZO', 'Data Apprentice', 4200),
('40eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa', 'BitBuilder', 'bit@example.com', '$2b$10$rBV2JDeWW3.vKyeQcM8fFu0DnXL4JVqZ2/UYhVnlR5b8VJ.EiPnZO', 'Data Apprentice', 3800);

-- SQL Shore Challenges - Shores of Selection (matching frontend IDs)
INSERT INTO challenges (id, island_id, section_id, order_index, title, story_context, description, difficulty, hints, time_estimate, datasets) VALUES
(
    'sql_shore_1',
    'sql_shore',
    'shores_of_selection',
    1,
    'The Harbor Manifest',
    'Captain Ironbeard needs a complete list of all ships in the harbor. As the new dock clerk, your first task is to retrieve the full manifest.',
    'Select all columns from the "ships" table to display the complete harbor manifest.',
    1,
    '["Use the SELECT keyword to retrieve data", "The * symbol selects all columns", "Complete syntax: SELECT * FROM table_name"]',
    5,
    '{"tables": ["ships"]}'
),
(
    'sql_shore_2',
    'sql_shore',
    'shores_of_selection',
    2,
    'Captain''s Call',
    'A distinguished Commodore approaches you at the dock. "I''m searching for my vessel. My captain_id is 5. Find my ships - I only need the name and type of each."',
    'Select the name and type columns from ships where captain_id equals 5.',
    1,
    '["Specify column names after SELECT", "Separate columns with commas", "Use WHERE to filter"]',
    5,
    '{"tables": ["ships"]}'
),
(
    'sql_shore_3',
    'sql_shore',
    'shores_of_selection',
    3,
    'The Treasure Fleet',
    'The Governor wants to know about ships carrying valuable cargo worth more than 10,000 gold coins.',
    'Find all ships where cargo_value is greater than 10000. Select ship_name, cargo_type, and cargo_value.',
    2,
    '["Use WHERE to filter rows", "Greater than operator is >", "WHERE cargo_value > 10000"]',
    10,
    '{"tables": ["ships", "cargo"]}'
),
(
    'sql_shore_4',
    'sql_shore',
    'shores_of_selection',
    4,
    'Sorting the Fleet',
    'The Admiral needs ships listed by their cargo capacity. Most capable vessels first!',
    'Select all ships and order them by cargo_capacity in descending order.',
    2,
    '["Use ORDER BY to sort results", "DESC means descending order", "ORDER BY column_name DESC"]',
    10,
    '{"tables": ["ships"]}'
),
(
    'sql_shore_5',
    'sql_shore',
    'shores_of_selection',
    5,
    'The Missing Crew',
    'Several crew members have gone missing! Find sailors whose last_checkin is NULL.',
    'Find crew members where last_checkin IS NULL. Select name and role.',
    2,
    '["Use IS NULL to check for missing values", "WHERE column IS NULL", "Remember NULL is not equal to anything"]',
    10,
    '{"tables": ["crew"]}'
);

-- SQL Shore Challenges - Join Junction
INSERT INTO challenges (id, island_id, section_id, order_index, title, story_context, description, difficulty, hints, time_estimate, datasets) VALUES
(
    'sql_shore_6',
    'sql_shore',
    'join_junction',
    1,
    'Ships and Their Captains',
    'The Harbor Master needs a report showing each ship alongside its captain''s name for the registry update.',
    'Join the ships and captains tables to show ship_name and captain_name together.',
    2,
    '["Use INNER JOIN to combine tables", "ON specifies the matching columns", "ships.captain_id = captains.id"]',
    15,
    '{"tables": ["ships", "captains"]}'
),
(
    'sql_shore_7',
    'sql_shore',
    'join_junction',
    2,
    'Crew Assignments',
    'We need a complete roster showing all crew members and which ships they''re assigned to.',
    'Use LEFT JOIN to show all crew members and their ship assignments. Include sailors without ships.',
    3,
    '["LEFT JOIN keeps all rows from the left table", "Unmatched rows show NULL", "FROM crew LEFT JOIN ships"]',
    15,
    '{"tables": ["crew", "ships"]}'
);

-- SQL Shore Challenges - Aggregation Atoll
INSERT INTO challenges (id, island_id, section_id, order_index, title, story_context, description, difficulty, hints, time_estimate, datasets) VALUES
(
    'sql_shore_8',
    'sql_shore',
    'aggregation_atoll',
    1,
    'Fleet Statistics',
    'The Admiral needs to know the total count of ships and their combined cargo capacity.',
    'Calculate the COUNT of ships and SUM of cargo_capacity from the ships table.',
    2,
    '["COUNT(*) counts all rows", "SUM(column) adds up values", "Both can be in the same SELECT"]',
    10,
    '{"tables": ["ships"]}'
),
(
    'sql_shore_9',
    'sql_shore',
    'aggregation_atoll',
    2,
    'Cargo by Port',
    'The Trade Commissioner needs to know the average cargo value for each home port.',
    'Group ships by home_port and calculate the AVG(cargo_value) for each group.',
    2,
    '["GROUP BY groups rows together", "AVG() calculates the average", "SELECT home_port, AVG(cargo_value)"]',
    10,
    '{"tables": ["ships"]}'
),
(
    'sql_shore_10',
    'sql_shore',
    'aggregation_atoll',
    3,
    'The Elite Ports',
    'Find ports with more than 3 ships and a total cargo value exceeding 50,000 gold.',
    'Group by home_port, use HAVING to filter groups where COUNT > 3 AND SUM(cargo_value) > 50000.',
    3,
    '["HAVING filters groups (not rows)", "Use HAVING after GROUP BY", "WHERE filters before grouping, HAVING after"]',
    15,
    '{"tables": ["ships"]}'
);

-- Python Peninsula Challenges - DataFrame Dunes
INSERT INTO challenges (id, island_id, section_id, order_index, title, story_context, description, difficulty, hints, time_estimate, datasets) VALUES
(
    'python_peninsula_1',
    'python_peninsula',
    'dataframe_dunes',
    1,
    'Your First DataFrame',
    'Welcome to Python Peninsula! Start by creating a Spark DataFrame from the expedition data.',
    'Create a Spark DataFrame from the given list of tuples containing (name, age, role).',
    1,
    '["Use spark.createDataFrame(data, columns)", "columns is a list of column names", "data is a list of tuples"]',
    10,
    '{"data_type": "list_of_tuples"}'
),
(
    'python_peninsula_2',
    'python_peninsula',
    'dataframe_dunes',
    2,
    'Filter the Explorers',
    'We need to find all experienced explorers (age > 25) for the dangerous jungle expedition.',
    'Filter the DataFrame to show only rows where age is greater than 25.',
    1,
    '["Use df.filter() or df.where()", "For column reference: df.age or col(\"age\")", "df.filter(df.age > 25)"]',
    10,
    '{"tables": ["explorers"]}'
),
(
    'python_peninsula_3',
    'python_peninsula',
    'dataframe_dunes',
    3,
    'Selecting Columns',
    'The expedition report only needs the name and role of each team member.',
    'Select only the name and role columns from the explorers DataFrame.',
    1,
    '["Use df.select(\"column1\", \"column2\")", "Or df.select(col(\"name\"), col(\"role\"))", "Returns a new DataFrame"]',
    10,
    '{"tables": ["explorers"]}'
);

-- Guilds
INSERT INTO guilds (id, name, description, leader_id, total_xp, member_count) VALUES
('guild0001-0000-0000-0000-000000000001', 'Data Dragons', 'Masters of big data and analytics', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 25000, 4),
('guild0002-0000-0000-0000-000000000002', 'Query Knights', 'SQL warriors and optimization experts', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 18500, 3);

-- Guild Members
INSERT INTO guild_members (guild_id, user_id, contribution_xp) VALUES
('guild0001-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 12500),
('guild0001-0000-0000-0000-000000000001', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 10200),
('guild0001-0000-0000-0000-000000000001', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 8500),
('guild0002-0000-0000-0000-000000000002', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 11800),
('guild0002-0000-0000-0000-000000000002', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 9800);

-- Sample Achievements
INSERT INTO achievements (user_id, badge_id) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'first_query'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sql_master'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'speed_demon'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'first_query'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'join_expert'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'first_query'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'aggregation_ace');

-- Leaderboard Cache
INSERT INTO leaderboard_cache (user_id, username, tier, total_xp, rank) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'DataWizard', 'Data Master', 12500, 1),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'QueryQueen', 'Data Master', 11800, 2),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'SparkShark', 'Code Sorcerer', 10200, 3),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'PipelinePro', 'Code Sorcerer', 9800, 4),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'SQLSailor', 'Pipeline Builder', 8500, 5),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Pythoneer', 'Pipeline Builder', 7200, 6),
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'DeltaDiver', 'Pipeline Builder', 6800, 7),
('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'CloudChaser', 'Data Apprentice', 5500, 8),
('30eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'AlgoAce', 'Data Apprentice', 4200, 9),
('40eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa', 'BitBuilder', 'Data Apprentice', 3800, 10);

-- Sample User Progress (with new string IDs)
INSERT INTO user_progress (user_id, challenge_id, completed, score, best_score, attempts, best_time, completed_at) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sql_shore_1', true, 185, 185, 1, 45, NOW() - INTERVAL '30 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sql_shore_2', true, 180, 180, 2, 60, NOW() - INTERVAL '29 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sql_shore_3', true, 175, 175, 1, 90, NOW() - INTERVAL '28 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'sql_shore_1', true, 190, 190, 1, 30, NOW() - INTERVAL '25 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'sql_shore_2', true, 185, 185, 1, 45, NOW() - INTERVAL '24 days'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'sql_shore_1', true, 175, 175, 2, 55, NOW() - INTERVAL '20 days');
