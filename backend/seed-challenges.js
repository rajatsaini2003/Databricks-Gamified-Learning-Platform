/**
 * Seed Challenges Runner
 * Populates the challenges table with initial data
 */

require('dotenv').config();
const { Pool } = require('pg');

const poolConfig = {
    connectionString: process.env.DATABASE_URL,
};

if (process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true') {
    poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

// Challenge data
const CHALLENGES = [
    {
        id: 'sql_shore_1',
        island_id: 'sql_shore',
        section_id: 'shores_of_selection',
        order_index: 1,
        title: 'The Harbor Manifest',
        story_context: 'The Harbor Master rushes to you, scrolls clutched in his weathered hands. "Navigator! Our manifest system is in chaos. I need to see EVERY ship currently docked in our harbor - all their details. Can you query our records?"',
        description: 'Select ALL columns from the ships table and return the complete dataset without any filtering',
        difficulty: 1,
        datasets: JSON.stringify({ ships: [{ id: 1, name: 'Sea Breeze', type: 'Galleon', captain_id: 1, port: 'Havana', cargo_weight: 4500, arrival_date: '2024-01-10' }] }),
        hints: JSON.stringify([{ level: 1, cost: 5, text: 'Use the SELECT keyword to retrieve data from a table.' }, { level: 2, cost: 10, text: 'The asterisk (*) symbol selects all columns.' }, { level: 3, cost: 20, text: 'The complete query is: SELECT * FROM ships;' }]),
        time_estimate: 5,
        expected_output: JSON.stringify({ type: 'exact_match', rowCount: 10, requiresColumns: ['id', 'name', 'type', 'captain_id'] }),
        xp_reward: 50
    },
    {
        id: 'sql_shore_2',
        island_id: 'sql_shore',
        section_id: 'shores_of_selection',
        order_index: 2,
        title: "Captain's Call",
        story_context: 'A distinguished Commodore approaches you at the dock. "I\'m searching for my vessel. My captain_id is 5. Find my ships - I only need the name and type of each."',
        description: 'Select only the name and type columns, filtering where captain_id equals 5',
        difficulty: 1,
        datasets: JSON.stringify({ ships: [{ id: 1, name: 'Sea Breeze', type: 'Galleon', captain_id: 1 }, { id: 2, name: 'Storm Chaser', type: 'Frigate', captain_id: 5 }] }),
        hints: JSON.stringify([{ level: 1, cost: 5, text: 'List specific column names after SELECT, separated by commas.' }, { level: 2, cost: 10, text: 'Use WHERE clause to filter: WHERE captain_id = 5' }, { level: 3, cost: 20, text: 'SELECT name, type FROM ships WHERE captain_id = 5;' }]),
        time_estimate: 5,
        expected_output: JSON.stringify({ type: 'exact_match', rowCount: 2, requiresColumns: ['name', 'type'] }),
        xp_reward: 60
    },
    {
        id: 'sql_shore_3',
        island_id: 'sql_shore',
        section_id: 'shores_of_selection',
        order_index: 3,
        title: 'Cargo Weight Check',
        story_context: 'The Dock Inspector frowns as she reviews the logs. "We\'ve had reports of overloaded vessels! Find all ships with cargo_weight exceeding 5000. These need immediate inspection."',
        description: 'Select all columns from ships where cargo_weight is greater than 5000',
        difficulty: 2,
        datasets: JSON.stringify({ ships: [{ id: 1, name: 'Heavy Hauler', cargo_weight: 7500 }, { id: 2, name: 'Light Runner', cargo_weight: 3000 }] }),
        hints: JSON.stringify([{ level: 1, cost: 5, text: 'Use comparison operators: >, <, =, >=, <=' }, { level: 2, cost: 10, text: 'WHERE cargo_weight > 5000' }, { level: 3, cost: 20, text: 'SELECT * FROM ships WHERE cargo_weight > 5000;' }]),
        time_estimate: 8,
        expected_output: JSON.stringify({ type: 'row_count', rowCount: 6 }),
        xp_reward: 80
    },
    {
        id: 'sql_shore_4',
        island_id: 'sql_shore',
        section_id: 'shores_of_selection',
        order_index: 4,
        title: 'Port of Origin',
        story_context: 'The Royal Navy has issued a warrant! "We need to track all ships arriving from either Tortuga or Port Royal. These ports have been flagged for... suspicious activity."',
        description: 'Select all ship information where port is either "Tortuga" OR "Port Royal"',
        difficulty: 2,
        datasets: JSON.stringify({ ships: [{ id: 1, name: 'Black Pearl', port: 'Tortuga' }, { id: 2, name: 'HMS Victory', port: 'Port Royal' }] }),
        hints: JSON.stringify([{ level: 1, cost: 5, text: 'The OR operator allows multiple conditions.' }, { level: 2, cost: 10, text: "Strings must be in single quotes: 'Tortuga'" }, { level: 3, cost: 20, text: "SELECT * FROM ships WHERE port = 'Tortuga' OR port = 'Port Royal';" }]),
        time_estimate: 10,
        expected_output: JSON.stringify({ type: 'row_count', rowCount: 6 }),
        xp_reward: 80
    },
    {
        id: 'sql_shore_5',
        island_id: 'sql_shore',
        section_id: 'shores_of_selection',
        order_index: 5,
        title: 'The Late Arrivals',
        story_context: 'The Harbor Master needs an audit report. "List all ships that arrived after January 15th, 2024. And sort them by arrival date, newest first - I want to see the patterns!"',
        description: "Select all columns from ships where arrival_date is after '2024-01-15' and order by arrival_date descending",
        difficulty: 2,
        datasets: JSON.stringify({ ships: [{ id: 1, name: 'Late Ship', arrival_date: '2024-01-20' }, { id: 2, name: 'Early Ship', arrival_date: '2024-01-05' }] }),
        hints: JSON.stringify([{ level: 1, cost: 5, text: "Dates can be compared like strings: > '2024-01-15'" }, { level: 2, cost: 10, text: 'ORDER BY column_name DESC sorts newest first' }, { level: 3, cost: 20, text: "SELECT * FROM ships WHERE arrival_date > '2024-01-15' ORDER BY arrival_date DESC;" }]),
        time_estimate: 12,
        expected_output: JSON.stringify({ type: 'ordered', rowCount: 5 }),
        xp_reward: 100
    },
    {
        id: 'sql_shore_6',
        island_id: 'sql_shore',
        section_id: 'join_junction',
        order_index: 6,
        title: 'Captains & Their Ships',
        story_context: 'The Admiral needs a comprehensive report. "I want to see each ship alongside its captain\'s name and rank. Connect the records for me, Navigator!"',
        description: 'Join ships with captains table, showing ship name, ship type, captain name, and captain rank',
        difficulty: 2,
        datasets: JSON.stringify({ ships: [{ id: 1, name: 'Sea Breeze', type: 'Galleon', captain_id: 1 }], captains: [{ id: 1, name: 'Captain Jack', rank: 'Admiral' }] }),
        hints: JSON.stringify([{ level: 1, cost: 5, text: 'Use INNER JOIN to combine tables on a common column.' }, { level: 2, cost: 10, text: 'ships.captain_id links to captains.id' }, { level: 3, cost: 20, text: 'SELECT s.name, s.type, c.name, c.rank FROM ships s INNER JOIN captains c ON s.captain_id = c.id;' }]),
        time_estimate: 15,
        expected_output: JSON.stringify({ type: 'row_count', rowCount: 10, minColumns: 4 }),
        xp_reward: 120
    },
    {
        id: 'sql_shore_7',
        island_id: 'sql_shore',
        section_id: 'join_junction',
        order_index: 7,
        title: 'Crew Roster',
        story_context: 'The Quartermaster needs payroll data. "Give me a list of all crew members with their ship names and their salaries. Some ships might not have crew listed yet - make sure to include those ships too!"',
        description: 'Use LEFT JOIN to include all ships, showing ship name, crew member name, role, and salary',
        difficulty: 3,
        datasets: JSON.stringify({ ships: [{ id: 1, name: 'Sea Breeze' }, { id: 2, name: 'Empty Ship' }], crew: [{ id: 1, ship_id: 1, name: 'John', role: 'Navigator', salary: 100 }] }),
        hints: JSON.stringify([{ level: 1, cost: 5, text: 'LEFT JOIN keeps all rows from the left table.' }, { level: 2, cost: 10, text: 'crew.ship_id links to ships.id' }, { level: 3, cost: 20, text: 'SELECT s.name AS ship, c.name AS crew_member, c.role, c.salary FROM ships s LEFT JOIN crew c ON s.id = c.ship_id;' }]),
        time_estimate: 18,
        expected_output: JSON.stringify({ type: 'row_count_min', minRowCount: 10 }),
        xp_reward: 140
    },
    {
        id: 'sql_shore_8',
        island_id: 'sql_shore',
        section_id: 'aggregation_atoll',
        order_index: 8,
        title: 'Fleet Statistics',
        story_context: 'The Royal Accountant adjusts her spectacles. "I need aggregate data for the quarterly report. How many ships do we have? What\'s the total cargo weight? And the average weight per ship?"',
        description: 'Calculate COUNT of ships, SUM of cargo_weight, and AVG cargo_weight',
        difficulty: 3,
        datasets: JSON.stringify({ ships: [{ id: 1, cargo_weight: 5000 }, { id: 2, cargo_weight: 7000 }] }),
        hints: JSON.stringify([{ level: 1, cost: 5, text: 'Aggregate functions: COUNT(), SUM(), AVG()' }, { level: 2, cost: 10, text: 'Use AS to give columns readable names.' }, { level: 3, cost: 20, text: 'SELECT COUNT(*) AS total_ships, SUM(cargo_weight) AS total_cargo, AVG(cargo_weight) AS avg_cargo FROM ships;' }]),
        time_estimate: 15,
        expected_output: JSON.stringify({ type: 'single_row', minColumns: 3 }),
        xp_reward: 150
    },
    {
        id: 'sql_shore_9',
        island_id: 'sql_shore',
        section_id: 'aggregation_atoll',
        order_index: 9,
        title: 'Ships by Type',
        story_context: 'The Fleet Commander strokes his beard thoughtfully. "Group our ships by type. For each type, tell me how many we have and their combined cargo capacity. Order by count, highest first."',
        description: 'GROUP BY ship type, COUNT ships, SUM cargo_weight, ORDER BY count descending',
        difficulty: 3,
        datasets: JSON.stringify({ ships: [{ type: 'Galleon', cargo_weight: 5000 }, { type: 'Frigate', cargo_weight: 3000 }, { type: 'Galleon', cargo_weight: 6000 }] }),
        hints: JSON.stringify([{ level: 1, cost: 5, text: 'GROUP BY groups rows with the same value.' }, { level: 2, cost: 10, text: 'You can ORDER BY aggregate results.' }, { level: 3, cost: 20, text: 'SELECT type, COUNT(*) AS ship_count, SUM(cargo_weight) FROM ships GROUP BY type ORDER BY ship_count DESC;' }]),
        time_estimate: 18,
        expected_output: JSON.stringify({ type: 'grouped', minRows: 3, requiresColumns: ['type'] }),
        xp_reward: 160
    },
    {
        id: 'sql_shore_10',
        island_id: 'sql_shore',
        section_id: 'aggregation_atoll',
        order_index: 10,
        title: 'Treasure Analysis',
        story_context: 'The Treasure Master leans in conspiratorially. "I need a complex analysis. Join the ships with their cargo, group by ship, and show me the total value of cargo per ship. But only show ships with total cargo value over 5000 gold pieces!"',
        description: 'JOIN ships with cargo, GROUP BY ship, calculate SUM of cargo value, use HAVING to filter groups > 5000',
        difficulty: 4,
        datasets: JSON.stringify({ ships: [{ id: 1, name: 'Rich Ship' }, { id: 2, name: 'Poor Ship' }], cargo: [{ ship_id: 1, value: 6000 }, { ship_id: 2, value: 2000 }] }),
        hints: JSON.stringify([{ level: 1, cost: 5, text: 'HAVING filters after GROUP BY (like WHERE for groups).' }, { level: 2, cost: 10, text: 'cargo.ship_id links to ships.id' }, { level: 3, cost: 20, text: 'SELECT s.name, SUM(c.value) AS total_value FROM ships s INNER JOIN cargo c ON s.id = c.ship_id GROUP BY s.name HAVING SUM(c.value) > 5000;' }]),
        time_estimate: 25,
        expected_output: JSON.stringify({ type: 'filtered_aggregate', minValue: 5000 }),
        xp_reward: 200
    }
];

async function main() {
    console.log('🚀 Seeding Challenges...\n');

    try {
        await pool.query('SELECT 1');
        console.log('✓ Database connected!\n');

        // First add xp_reward column if it doesn't exist
        try {
            await pool.query('ALTER TABLE challenges ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 50');
            console.log('✓ Ensured xp_reward column exists\n');
        } catch (e) {
            console.log('Note: xp_reward column check:', e.message);
        }

        // Insert challenges
        let inserted = 0;
        let skipped = 0;

        for (const c of CHALLENGES) {
            try {
                await pool.query(`
          INSERT INTO challenges (id, island_id, section_id, order_index, title, story_context, description, difficulty, datasets, hints, time_estimate, expected_output, xp_reward)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            story_context = EXCLUDED.story_context,
            description = EXCLUDED.description,
            xp_reward = EXCLUDED.xp_reward
        `, [c.id, c.island_id, c.section_id, c.order_index, c.title, c.story_context, c.description, c.difficulty, c.datasets, c.hints, c.time_estimate, c.expected_output, c.xp_reward]);
                inserted++;
                console.log(`  ✓ ${c.id}: ${c.title}`);
            } catch (err) {
                if (err.code === '23505') {
                    skipped++;
                    console.log(`  ⏭ ${c.id}: Already exists`);
                } else {
                    console.error(`  ❌ ${c.id}: ${err.message}`);
                }
            }
        }

        console.log(`\n✅ Done! Inserted: ${inserted}, Skipped: ${skipped}`);

        // Verify
        const count = await pool.query('SELECT COUNT(*) FROM challenges');
        console.log(`\n📊 Total challenges in database: ${count.rows[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
