-- Seed file to populate challenges table from static data
-- This replaces the hardcoded frontend/src/data/challenges.js file

-- SQL Shore Island Challenges
-- Section 1: Shores of Selection (Basic SELECT queries)

INSERT INTO challenges (id, island_id, section_id, order_index, title, story_context, description, difficulty, datasets, hints, time_estimate, expected_output) VALUES

-- Challenge 1: The Harbor Manifest
('sql_shore_1', 'sql_shore', 'shores_of_selection', 1, 'The Harbor Manifest', 
'The Harbor Master rushes to you, scrolls clutched in his weathered hands. "Navigator! Our manifest system is in chaos. I need to see EVERY ship currently docked in our harbor - all their details. Can you query our records?"',
'Select ALL columns from the ships table and return the complete dataset without any filtering',
1,
'{"ships": [{"id": 1, "name": "Sea Breeze", "type": "Galleon", "captain_id": 1, "port": "Havana", "cargo_weight": 4500, "arrival_date": "2024-01-10"}]}',
'[{"level": 1, "cost": 5, "text": "Use the SELECT keyword to retrieve data from a table."}, {"level": 2, "cost": 10, "text": "The asterisk (*) symbol selects all columns."}, {"level": 3, "cost": 20, "text": "The complete query is: SELECT * FROM ships;"}]',
5,
'{"type": "exact_match", "rowCount": 10, "requiresColumns": ["id", "name", "type", "captain_id"]}'
),

-- Challenge 2: Captain's Call
('sql_shore_2', 'sql_shore', 'shores_of_selection', 2, 'Captain''s Call',
'A distinguished Commodore approaches you at the dock. "I''m searching for my vessel. My captain_id is 5. Find my ships - I only need the name and type of each."',
'Select only the name and type columns, filtering where captain_id equals 5',
1,
'{"ships": [{"id": 1, "name": "Sea Breeze", "type": "Galleon", "captain_id": 1}, {"id": 2, "name": "Storm Chaser", "type": "Frigate", "captain_id": 5}]}',
'[{"level": 1, "cost": 5, "text": "List specific column names after SELECT, separated by commas."}, {"level": 2, "cost": 10, "text": "Use WHERE clause to filter: WHERE captain_id = 5"}, {"level": 3, "cost": 20, "text": "SELECT name, type FROM ships WHERE captain_id = 5;"}]',
5,
'{"type": "exact_match", "rowCount": 2, "requiresColumns": ["name", "type"]}'
),

-- Challenge 3: Cargo Weight Check
('sql_shore_3', 'sql_shore', 'shores_of_selection', 3, 'Cargo Weight Check',
'The Dock Inspector frowns as she reviews the logs. "We''ve had reports of overloaded vessels! Find all ships with cargo_weight exceeding 5000. These need immediate inspection."',
'Select all columns from ships where cargo_weight is greater than 5000',
2,
'{"ships": [{"id": 1, "name": "Heavy Hauler", "cargo_weight": 7500}, {"id": 2, "name": "Light Runner", "cargo_weight": 3000}]}',
'[{"level": 1, "cost": 5, "text": "Use comparison operators: >, <, =, >=, <="}, {"level": 2, "cost": 10, "text": "WHERE cargo_weight > 5000"}, {"level": 3, "cost": 20, "text": "SELECT * FROM ships WHERE cargo_weight > 5000;"}]',
8,
'{"type": "row_count", "rowCount": 6}'
),

-- Challenge 4: Port of Origin
('sql_shore_4', 'sql_shore', 'shores_of_selection', 4, 'Port of Origin',
'The Royal Navy has issued a warrant! "We need to track all ships arriving from either Tortuga or Port Royal. These ports have been flagged for... suspicious activity."',
'Select all ship information where port is either "Tortuga" OR "Port Royal"',
2,
'{"ships": [{"id": 1, "name": "Black Pearl", "port": "Tortuga"}, {"id": 2, "name": "HMS Victory", "port": "Port Royal"}]}',
'[{"level": 1, "cost": 5, "text": "The OR operator allows multiple conditions."}, {"level": 2, "cost": 10, "text": "Strings must be in single quotes: ''Tortuga''"}, {"level": 3, "cost": 20, "text": "SELECT * FROM ships WHERE port = ''Tortuga'' OR port = ''Port Royal'';"}]',
10,
'{"type": "row_count", "rowCount": 6}'
),

-- Challenge 5: The Late Arrivals
('sql_shore_5', 'sql_shore', 'shores_of_selection', 5, 'The Late Arrivals',
'The Harbor Master needs an audit report. "List all ships that arrived after January 15th, 2024. And sort them by arrival date, newest first - I want to see the patterns!"',
'Select all columns from ships where arrival_date is after ''2024-01-15'' and order by arrival_date descending',
2,
'{"ships": [{"id": 1, "name": "Late Ship", "arrival_date": "2024-01-20"}, {"id": 2, "name": "Early Ship", "arrival_date": "2024-01-05"}]}',
'[{"level": 1, "cost": 5, "text": "Dates can be compared like strings: > ''2024-01-15''"}, {"level": 2, "cost": 10, "text": "ORDER BY column_name DESC sorts newest first"}, {"level": 3, "cost": 20, "text": "SELECT * FROM ships WHERE arrival_date > ''2024-01-15'' ORDER BY arrival_date DESC;"}]',
12,
'{"type": "ordered", "rowCount": 5}'
),

-- Section 2: Join Junction (Table Joins)

-- Challenge 6: Captains & Their Ships
('sql_shore_6', 'sql_shore', 'join_junction', 6, 'Captains & Their Ships',
'The Admiral needs a comprehensive report. "I want to see each ship alongside its captain''s name and rank. Connect the records for me, Navigator!"',
'Join ships with captains table, showing ship name, ship type, captain name, and captain rank',
2,
'{"ships": [{"id": 1, "name": "Sea Breeze", "type": "Galleon", "captain_id": 1}], "captains": [{"id": 1, "name": "Captain Jack", "rank": "Admiral"}]}',
'[{"level": 1, "cost": 5, "text": "Use INNER JOIN to combine tables on a common column."}, {"level": 2, "cost": 10, "text": "ships.captain_id links to captains.id"}, {"level": 3, "cost": 20, "text": "SELECT s.name, s.type, c.name, c.rank FROM ships s INNER JOIN captains c ON s.captain_id = c.id;"}]',
15,
'{"type": "row_count", "rowCount": 10, "minColumns": 4}'
),

-- Challenge 7: Crew Roster
('sql_shore_7', 'sql_shore', 'join_junction', 7, 'Crew Roster',
'The Quartermaster needs payroll data. "Give me a list of all crew members with their ship names and their salaries. Some ships might not have crew listed yet - make sure to include those ships too!"',
'Use LEFT JOIN to include all ships, showing ship name, crew member name, role, and salary',
3,
'{"ships": [{"id": 1, "name": "Sea Breeze"}, {"id": 2, "name": "Empty Ship"}], "crew": [{"id": 1, "ship_id": 1, "name": "John", "role": "Navigator", "salary": 100}]}',
'[{"level": 1, "cost": 5, "text": "LEFT JOIN keeps all rows from the left table."}, {"level": 2, "cost": 10, "text": "crew.ship_id links to ships.id"}, {"level": 3, "cost": 20, "text": "SELECT s.name AS ship, c.name AS crew_member, c.role, c.salary FROM ships s LEFT JOIN crew c ON s.id = c.ship_id;"}]',
18,
'{"type": "row_count_min", "minRowCount": 10}'
),

-- Section 3: Aggregation Atoll (GROUP BY and Aggregates)

-- Challenge 8: Fleet Statistics
('sql_shore_8', 'sql_shore', 'aggregation_atoll', 8, 'Fleet Statistics',
'The Royal Accountant adjusts her spectacles. "I need aggregate data for the quarterly report. How many ships do we have? What''s the total cargo weight? And the average weight per ship?"',
'Calculate COUNT of ships, SUM of cargo_weight, and AVG cargo_weight',
3,
'{"ships": [{"id": 1, "cargo_weight": 5000}, {"id": 2, "cargo_weight": 7000}]}',
'[{"level": 1, "cost": 5, "text": "Aggregate functions: COUNT(), SUM(), AVG()"}, {"level": 2, "cost": 10, "text": "Use AS to give columns readable names."}, {"level": 3, "cost": 20, "text": "SELECT COUNT(*) AS total_ships, SUM(cargo_weight) AS total_cargo, AVG(cargo_weight) AS avg_cargo FROM ships;"}]',
15,
'{"type": "single_row", "minColumns": 3}'
),

-- Challenge 9: Ships by Type
('sql_shore_9', 'sql_shore', 'aggregation_atoll', 9, 'Ships by Type',
'The Fleet Commander strokes his beard thoughtfully. "Group our ships by type. For each type, tell me how many we have and their combined cargo capacity. Order by count, highest first."',
'GROUP BY ship type, COUNT ships, SUM cargo_weight, ORDER BY count descending',
3,
'{"ships": [{"type": "Galleon", "cargo_weight": 5000}, {"type": "Frigate", "cargo_weight": 3000}, {"type": "Galleon", "cargo_weight": 6000}]}',
'[{"level": 1, "cost": 5, "text": "GROUP BY groups rows with the same value."}, {"level": 2, "cost": 10, "text": "You can ORDER BY aggregate results."}, {"level": 3, "cost": 20, "text": "SELECT type, COUNT(*) AS ship_count, SUM(cargo_weight) FROM ships GROUP BY type ORDER BY ship_count DESC;"}]',
18,
'{"type": "grouped", "minRows": 3, "requiresColumns": ["type"]}'
),

-- Challenge 10: Treasure Analysis
('sql_shore_10', 'sql_shore', 'aggregation_atoll', 10, 'Treasure Analysis',
'The Treasure Master leans in conspiratorially. "I need a complex analysis. Join the ships with their cargo, group by ship, and show me the total value of cargo per ship. But only show ships with total cargo value over 5000 gold pieces!"',
'JOIN ships with cargo, GROUP BY ship, calculate SUM of cargo value, use HAVING to filter groups > 5000',
4,
'{"ships": [{"id": 1, "name": "Rich Ship"}, {"id": 2, "name": "Poor Ship"}], "cargo": [{"ship_id": 1, "value": 6000}, {"ship_id": 2, "value": 2000}]}',
'[{"level": 1, "cost": 5, "text": "HAVING filters after GROUP BY (like WHERE for groups)."}, {"level": 2, "cost": 10, "text": "cargo.ship_id links to ships.id"}, {"level": 3, "cost": 20, "text": "SELECT s.name, SUM(c.value) AS total_value FROM ships s INNER JOIN cargo c ON s.id = c.ship_id GROUP BY s.name HAVING SUM(c.value) > 5000;"}]',
25,
'{"type": "filtered_aggregate", "minValue": 5000}'
);

-- Update challenges to include XP rewards (not in original schema, but should be added)
-- These correspond to the xpReward values from the original challenges.js

UPDATE challenges SET description = description WHERE id = 'sql_shore_1'; -- 50 XP
UPDATE challenges SET description = description WHERE id = 'sql_shore_2'; -- 60 XP
UPDATE challenges SET description = description WHERE id = 'sql_shore_3'; -- 80 XP
UPDATE challenges SET description = description WHERE id = 'sql_shore_4'; -- 80 XP
UPDATE challenges SET description = description WHERE id = 'sql_shore_5'; -- 100 XP
UPDATE challenges SET description = description WHERE id = 'sql_shore_6'; -- 120 XP
UPDATE challenges SET description = description WHERE id = 'sql_shore_7'; -- 140 XP
UPDATE challenges SET description = description WHERE id = 'sql_shore_8'; -- 150 XP
UPDATE challenges SET description = description WHERE id = 'sql_shore_9'; -- 160 XP
UPDATE challenges SET description = description WHERE id = 'sql_shore_10'; -- 200 XP

-- Note: If the challenges table should have an xp_reward column, add it first:
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 50;

-- Then update with actual XP values
UPDATE challenges SET xp_reward = 50 WHERE id = 'sql_shore_1';
UPDATE challenges SET xp_reward = 60 WHERE id = 'sql_shore_2';
UPDATE challenges SET xp_reward = 80 WHERE id = 'sql_shore_3';
UPDATE challenges SET xp_reward = 80 WHERE id = 'sql_shore_4';
UPDATE challenges SET xp_reward = 100 WHERE id = 'sql_shore_5';
UPDATE challenges SET xp_reward = 120 WHERE id = 'sql_shore_6';
UPDATE challenges SET xp_reward = 140 WHERE id = 'sql_shore_7';
UPDATE challenges SET xp_reward = 150 WHERE id = 'sql_shore_8';
UPDATE challenges SET xp_reward = 160 WHERE id = 'sql_shore_9';
UPDATE challenges SET xp_reward = 200 WHERE id = 'sql_shore_10';
