import alasql from 'alasql';

// SQL Shore Challenge Datasets
// These simulate the "Data Archipelago" theme with maritime/treasure data

const DATASETS = {
  // Primary challenge tables for SQL Shore
  ships: [
    { id: 1, name: 'The Sea Dragon', type: 'cargo', captain_id: 1, arrival_date: '2024-01-15', cargo_weight: 8500, port: 'Tortuga' },
    { id: 2, name: 'Black Pearl', type: 'warship', captain_id: 2, arrival_date: '2024-01-16', cargo_weight: 2000, port: 'Port Royal' },
    { id: 3, name: 'Flying Dutchman', type: 'cargo', captain_id: 3, arrival_date: '2024-01-10', cargo_weight: 12000, port: 'Tortuga' },
    { id: 4, name: 'Queen Anne', type: 'passenger', captain_id: 4, arrival_date: '2024-01-18', cargo_weight: 3500, port: 'Nassau' },
    { id: 5, name: 'Neptune\'s Wrath', type: 'cargo', captain_id: 5, arrival_date: '2024-01-20', cargo_weight: 7200, port: 'Port Royal' },
    { id: 6, name: 'Silver Gull', type: 'fishing', captain_id: 1, arrival_date: '2024-01-22', cargo_weight: 1200, port: 'Havana' },
    { id: 7, name: 'Storm Chaser', type: 'warship', captain_id: 6, arrival_date: '2024-01-25', cargo_weight: 2800, port: 'Tortuga' },
    { id: 8, name: 'Merchant\'s Pride', type: 'cargo', captain_id: 7, arrival_date: '2023-12-28', cargo_weight: 9500, port: 'Nassau' },
    { id: 9, name: 'Golden Horizon', type: 'passenger', captain_id: 8, arrival_date: '2024-01-05', cargo_weight: 4100, port: 'Port Royal' },
    { id: 10, name: 'Crimson Tide', type: 'cargo', captain_id: 5, arrival_date: '2024-01-30', cargo_weight: 6800, port: 'Tortuga' }
  ],
  
  captains: [
    { id: 1, name: 'Captain Blackbeard', rank: 'Admiral', years_experience: 25, hometown: 'Bristol' },
    { id: 2, name: 'Jack Sparrow', rank: 'Captain', years_experience: 15, hometown: 'London' },
    { id: 3, name: 'Davy Jones', rank: 'Admiral', years_experience: 50, hometown: 'Unknown' },
    { id: 4, name: 'Anne Bonny', rank: 'Captain', years_experience: 12, hometown: 'Cork' },
    { id: 5, name: 'Henry Morgan', rank: 'Commodore', years_experience: 30, hometown: 'Cardiff' },
    { id: 6, name: 'Calico Jack', rank: 'Captain', years_experience: 8, hometown: 'Nassau' },
    { id: 7, name: 'Edward Teach', rank: 'Captain', years_experience: 18, hometown: 'Bristol' },
    { id: 8, name: 'Mary Read', rank: 'Lieutenant', years_experience: 6, hometown: 'London' }
  ],
  
  crew: [
    { id: 1, name: 'Scurvy Pete', ship_id: 1, role: 'First Mate', salary: 150 },
    { id: 2, name: 'One-Eye Willie', ship_id: 1, role: 'Navigator', salary: 120 },
    { id: 3, name: 'Barnacle Bill', ship_id: 2, role: 'First Mate', salary: 180 },
    { id: 4, name: 'Salty Sam', ship_id: 2, role: 'Cook', salary: 80 },
    { id: 5, name: 'Rusty Hook', ship_id: 3, role: 'Gunner', salary: 100 },
    { id: 6, name: 'Seaweed Steve', ship_id: 3, role: 'First Mate', salary: 200 },
    { id: 7, name: 'Parrot Paul', ship_id: 4, role: 'Navigator', salary: 130 },
    { id: 8, name: 'Deck Hand Dave', ship_id: 5, role: 'Deckhand', salary: 50 },
    { id: 9, name: 'Cannon Carl', ship_id: 5, role: 'Gunner', salary: 110 },
    { id: 10, name: 'Lighthouse Larry', ship_id: 6, role: 'Lookout', salary: 70 }
  ],
  
  cargo: [
    { id: 1, ship_id: 1, item: 'Spices', quantity: 500, value: 2500 },
    { id: 2, ship_id: 1, item: 'Silk', quantity: 200, value: 8000 },
    { id: 3, ship_id: 3, item: 'Gold Coins', quantity: 5000, value: 50000 },
    { id: 4, ship_id: 3, item: 'Silver Bars', quantity: 1000, value: 15000 },
    { id: 5, ship_id: 5, item: 'Rum', quantity: 800, value: 3200 },
    { id: 6, ship_id: 5, item: 'Tobacco', quantity: 600, value: 1800 },
    { id: 7, ship_id: 8, item: 'Cotton', quantity: 1500, value: 4500 },
    { id: 8, ship_id: 8, item: 'Tea', quantity: 400, value: 2000 },
    { id: 9, ship_id: 10, item: 'Pearls', quantity: 100, value: 10000 },
    { id: 10, ship_id: 4, item: 'Passenger Luggage', quantity: 50, value: 500 }
  ],
  
  ports: [
    { id: 1, name: 'Tortuga', country: 'Haiti', dock_fee: 200, is_pirate_friendly: true },
    { id: 2, name: 'Port Royal', country: 'Jamaica', dock_fee: 350, is_pirate_friendly: false },
    { id: 3, name: 'Nassau', country: 'Bahamas', dock_fee: 250, is_pirate_friendly: true },
    { id: 4, name: 'Havana', country: 'Cuba', dock_fee: 400, is_pirate_friendly: false },
    { id: 5, name: 'Kingston', country: 'Jamaica', dock_fee: 300, is_pirate_friendly: false }
  ],
  
  treasure_maps: [
    { id: 1, location: 'Skull Island', difficulty: 5, estimated_value: 100000, found_by: null },
    { id: 2, location: 'Dead Man\'s Cove', difficulty: 3, estimated_value: 25000, found_by: 2 },
    { id: 3, location: 'Mermaid Lagoon', difficulty: 4, estimated_value: 50000, found_by: null },
    { id: 4, location: 'Shipwreck Shoals', difficulty: 2, estimated_value: 15000, found_by: 1 },
    { id: 5, location: 'Ghost Reef', difficulty: 5, estimated_value: 200000, found_by: null }
  ]
};

class SQLExecutor {
  constructor() {
    this.initialized = false;
    this.db = alasql;
  }

  initialize() {
    if (this.initialized) return;
    
    // Create tables and insert data
    Object.entries(DATASETS).forEach(([tableName, data]) => {
      // Drop table if exists
      try {
        alasql(`DROP TABLE IF EXISTS ${tableName}`);
      } catch (e) {
        // Ignore
      }
      
      // Create table from data
      alasql(`CREATE TABLE ${tableName}`);
      alasql.tables[tableName].data = [...data];
    });
    
    this.initialized = true;
    console.log('SQL Executor initialized with tables:', Object.keys(DATASETS));
  }

  reset() {
    this.initialized = false;
    this.initialize();
  }

  execute(sql) {
    this.initialize();
    
    const startTime = performance.now();
    
    try {
      // Basic SQL injection prevention for learning environment
      const normalizedSQL = sql.trim().toUpperCase();
      
      // Block dangerous operations in learning mode
      const blockedKeywords = ['DELETE', 'DROP', 'TRUNCATE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE'];
      for (const keyword of blockedKeywords) {
        if (normalizedSQL.startsWith(keyword)) {
          return {
            success: false,
            error: `For learning purposes, ${keyword} statements are not allowed. Focus on SELECT queries!`,
            executionTime: 0,
            rows: [],
            columns: []
          };
        }
      }

      const result = alasql(sql);
      const endTime = performance.now();
      
      // Format result
      let rows = [];
      let columns = [];
      
      if (Array.isArray(result) && result.length > 0) {
        columns = Object.keys(result[0]);
        rows = result;
      } else if (typeof result === 'number') {
        // For COUNT, etc.
        rows = [{ result }];
        columns = ['result'];
      }
      
      return {
        success: true,
        rows,
        columns,
        rowCount: rows.length,
        executionTime: Math.round(endTime - startTime)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'SQL execution failed',
        executionTime: 0,
        rows: [],
        columns: []
      };
    }
  }

  getTableInfo(tableName) {
    this.initialize();
    
    const table = DATASETS[tableName];
    if (!table || table.length === 0) return null;
    
    const columns = Object.keys(table[0]).map(col => ({
      name: col,
      type: typeof table[0][col]
    }));
    
    return {
      name: tableName,
      columns,
      rowCount: table.length,
      sampleData: table.slice(0, 3)
    };
  }

  getAllTables() {
    return Object.keys(DATASETS).map(name => this.getTableInfo(name));
  }

  getDatasets() {
    return DATASETS;
  }
}

// Export singleton instance
export const sqlExecutor = new SQLExecutor();
export default sqlExecutor;
