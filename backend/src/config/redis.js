require('dotenv').config();

// Mock Redis client for when Redis is not available
class MockRedis {
  constructor() {
    this.data = new Map();
    this.sortedSets = new Map();
    console.log('Using in-memory mock Redis (no Redis server connected)');
  }
  
  async get(key) {
    return this.data.get(key) || null;
  }
  
  async set(key, value, ...args) {
    this.data.set(key, value);
    return 'OK';
  }
  
  async del(key) {
    this.data.delete(key);
    return 1;
  }
  
  async zincrby(key, increment, member) {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, new Map());
    }
    const set = this.sortedSets.get(key);
    const currentScore = set.get(member) || 0;
    set.set(member, currentScore + increment);
    return set.get(member);
  }
  
  async zrevrange(key, start, stop, withScores) {
    if (!this.sortedSets.has(key)) return [];
    const set = this.sortedSets.get(key);
    const sorted = [...set.entries()].sort((a, b) => b[1] - a[1]);
    const slice = sorted.slice(start, stop + 1);
    if (withScores === 'WITHSCORES') {
      return slice.flatMap(([member, score]) => [member, score.toString()]);
    }
    return slice.map(([member]) => member);
  }

  async zrevrank(key, member) {
    if (!this.sortedSets.has(key)) return null;
    const set = this.sortedSets.get(key);
    const sorted = [...set.entries()].sort((a, b) => b[1] - a[1]);
    const index = sorted.findIndex(([m]) => m === member);
    return index >= 0 ? index : null;
  }

  async zscore(key, member) {
    if (!this.sortedSets.has(key)) return null;
    const set = this.sortedSets.get(key);
    return set.get(member)?.toString() || null;
  }

  async setex(key, seconds, value) {
    this.data.set(key, value);
    // In mock mode, we don't actually expire - just store
    return 'OK';
  }

  async expire(key, seconds) {
    // Mock - do nothing
    return 1;
  }
  
  on() { return this; }
  quit() { return Promise.resolve(); }
}

let redisClient;

// Try to connect to Redis, fall back to mock if unavailable
if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
  const Redis = require('ioredis');
  redisClient = new Redis(process.env.REDIS_URL);

  redisClient.on('connect', () => {
    console.log('Connected to Redis!');
  });

  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });
} else {
  // Use mock Redis for development without Redis server
  redisClient = new MockRedis();
}

module.exports = redisClient;
