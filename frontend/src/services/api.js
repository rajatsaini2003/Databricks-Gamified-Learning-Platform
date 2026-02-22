import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Check if we're in demo mode (no backend connection)
const isDemoMode = () => {
  const user = localStorage.getItem('user');
  return user && JSON.parse(user).isDemo === true;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request Interceptor: Add Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Refresh Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          // Call refresh endpoint
          // Note: We use a separate instance to avoid infinite loops if this fails
          const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });

          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed - logout user
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available - redirect only if not in demo mode
        if (!isDemoMode()) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Demo mode mock data
const DEMO_USER = {
  id: 'demo-user-001',
  username: 'DemoExplorer',
  email: 'demo@example.com',
  tier: 'Data Apprentice',
  total_xp: 250,
  isDemo: true,
  created_at: new Date().toISOString()
};

export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response;
    } catch (error) {
      // ONLY allow demo mode for the specific demo email
      if (credentials.email === 'demo@demo.com') {
        console.log('Demo mode login with demo@demo.com');
        return {
          data: {
            user: DEMO_USER,
            token: 'demo-token-' + Date.now(),
            message: 'Demo mode - running without backend'
          }
        };
      }
      // For all other errors, throw them so user sees the actual error
      throw error;
    }
  },
  register: async (data) => {
    try {
      const response = await api.post('/auth/register', data);
      return response;
    } catch (error) {
      // ONLY allow demo mode for demo email registration
      if (data.email === 'demo@demo.com') {
        console.log('Demo mode registration with demo@demo.com');
        return {
          data: {
            user: { ...DEMO_USER, username: data.username, email: data.email },
            token: 'demo-token-' + Date.now(),
            message: 'Demo mode registration'
          }
        };
      }
      // For all other errors, throw them so user sees the actual error
      throw error;
    }
  },
  getMe: async () => {
    if (isDemoMode()) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return { data: { user } };
    }
    return api.get('/auth/me');
  },
  refreshToken: (token) => api.post('/auth/refresh-token', { refreshToken: token }),

  // Demo login helper
  demoLogin: () => {
    localStorage.setItem('user', JSON.stringify(DEMO_USER));
    localStorage.setItem('token', 'demo-token-' + Date.now());
    return { user: DEMO_USER };
  }
};

export const challengesAPI = {
  getAll: () => api.get('/challenges'),
  getById: (id) => api.get(`/challenges/${id}`),
  getIslands: async () => {
    try {
      return await api.get('/challenges/islands');
    } catch (error) {
      // Return demo data if backend unavailable
      return { data: getDemoIslands() };
    }
  },
  getByIsland: async (islandId) => {
    try {
      return await api.get(`/challenges/island/${islandId}`);
    } catch (error) {
      return { data: getDemoIslandChallenges(islandId) };
    }
  },
  getBySection: async (islandId, sectionId) => {
    try {
      return await api.get(`/challenges/section/${islandId}/${sectionId}`);
    } catch (error) {
      return { data: getDemoSectionChallenges(islandId, sectionId) };
    }
  },
  submit: async (id, data) => {
    if (isDemoMode()) {
      // Demo mode: simulate submission success and save to localStorage
      const score = 130;
      const xpEarned = 150;

      // Save progress to localStorage for demo mode
      const savedProgress = JSON.parse(localStorage.getItem('demoProgress') || '{}');
      const isNewCompletion = !savedProgress[id]?.completed;

      savedProgress[id] = {
        completed: true,
        score: score,
        best_score: Math.max(savedProgress[id]?.best_score || 0, score),
        attempts: (savedProgress[id]?.attempts || 0) + 1
      };
      localStorage.setItem('demoProgress', JSON.stringify(savedProgress));

      // Update user XP in localStorage
      if (isNewCompletion) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.total_xp = (user.total_xp || 0) + xpEarned;
        localStorage.setItem('user', JSON.stringify(user));
      }

      return {
        data: {
          validation: { correct: true, correctnessScore: 80, qualityScore: 20, performanceScore: 30 },
          score: score,
          xpEarned: xpEarned,
          isNewCompletion: isNewCompletion
        }
      };
    }
    // Increase timeout for AI validation (Gemini can take 10-20 seconds)
    return api.post(`/challenges/${id}/submit`, data, { timeout: 30000 });
  },
  getHint: (id, level) => api.get(`/challenges/${id}/hints/${level}`),
};

export const usersAPI = {
  getMe: async () => {
    if (isDemoMode()) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        data: {
          ...user,
          stats: { completed_challenges: 0, attempted_challenges: 0, total_score: 0, avg_score: 0 },
          achievements: []
        }
      };
    }
    return api.get('/users/me');
  },
  getProgress: async () => {
    if (isDemoMode()) {
      // For demo mode, get progress from localStorage
      const savedProgress = JSON.parse(localStorage.getItem('demoProgress') || '{}');
      const progressArray = Object.entries(savedProgress).map(([challengeId, data]) => ({
        challenge_id: challengeId,
        completed: data.completed || false,
        score: data.score || 0,
        best_score: data.best_score || 0,
        attempts: data.attempts || 0
      }));
      return { data: { progress: progressArray, all: progressArray, byIsland: {} } };
    }
    try {
      const response = await api.get('/users/me/progress');
      // Normalize the response - backend returns { all: [...], byIsland: {...} }
      return {
        data: {
          progress: response.data.all || [],
          all: response.data.all || [],
          byIsland: response.data.byIsland || {}
        }
      };
    } catch (error) {
      console.error('Failed to fetch progress:', error);
      return { data: { progress: [], all: [], byIsland: {} } };
    }
  }
};

export const leaderboardAPI = {
  getGlobal: async (params) => {
    try {
      return await api.get('/leaderboard', { params });
    } catch (error) {
      // Return demo leaderboard
      return {
        data: {
          leaderboard: getDemoLeaderboard(),
          total: 10,
          limit: 50,
          offset: 0
        }
      };
    }
  },
  getByTier: (tier, params) => api.get(`/leaderboard/tier/${tier}`, { params }),
  getMyRank: async () => {
    if (isDemoMode()) {
      return { data: { user: { ...DEMO_USER, rank: 156 }, nearby: [] } };
    }
    return api.get('/leaderboard/me');
  }
};

export const guildsAPI = {
  getAll: () => api.get('/guilds'),
  getById: (id) => api.get(`/guilds/${id}`),
  join: (id) => api.post(`/guilds/${id}/join`),
  create: (data) => api.post('/guilds', data),
};

export const pvpAPI = {
  // Get all user's matches
  getMatches: async (status) => {
    if (isDemoMode()) {
      return { data: { matches: getDemoPvPMatches() } };
    }
    return api.get('/pvp', { params: { status } });
  },

  // Get available PvP challenges
  getChallenges: async () => {
    if (isDemoMode()) {
      return { data: { challenges: getDemoPvPChallenges() } };
    }
    return api.get('/pvp/challenges');
  },

  // Get PvP leaderboard
  getLeaderboard: async (limit = 10) => {
    if (isDemoMode()) {
      return { data: { leaderboard: getDemoPvPLeaderboard() } };
    }
    return api.get('/pvp/leaderboard', { params: { limit } });
  },

  // Get match details
  getMatch: async (matchId) => {
    if (isDemoMode()) {
      return { data: { match: getDemoPvPMatches().find(m => m.id === matchId) || getDemoPvPMatches()[0] } };
    }
    return api.get(`/pvp/${matchId}`);
  },

  // Find or create a match
  findMatch: async (challengeId) => {
    if (isDemoMode()) {
      const demoMatch = {
        id: 'demo-match-' + Date.now(),
        challenge_id: challengeId,
        player1_id: 'demo-user-001',
        player1_username: 'DemoExplorer',
        player2_id: null,
        player2_username: null,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString()
      };
      // Store in localStorage for demo
      const matches = JSON.parse(localStorage.getItem('demoPvPMatches') || '[]');
      matches.push(demoMatch);
      localStorage.setItem('demoPvPMatches', JSON.stringify(matches));
      return { data: { match: demoMatch, isNew: true } };
    }
    return api.post('/pvp/find', { challengeId });
  },

  // Submit solution for a match
  submitMatch: async (matchId, code, score) => {
    if (isDemoMode()) {
      // Simulate submission in demo mode
      const matches = JSON.parse(localStorage.getItem('demoPvPMatches') || '[]');
      const matchIndex = matches.findIndex(m => m.id === matchId);
      if (matchIndex >= 0) {
        matches[matchIndex].player1_submitted = true;
        matches[matchIndex].player1_score = score;
        matches[matchIndex].player1_code = code;
        // Simulate opponent submission
        matches[matchIndex].player2_submitted = true;
        matches[matchIndex].player2_score = Math.floor(Math.random() * 150) + 50;
        matches[matchIndex].status = 'completed';
        matches[matchIndex].winner_id = score > matches[matchIndex].player2_score ? 'demo-user-001' : 'demo-opponent';
        localStorage.setItem('demoPvPMatches', JSON.stringify(matches));
        return {
          data: {
            submitted: true,
            matchComplete: true,
            winnerId: matches[matchIndex].winner_id,
            player1Score: score,
            player2Score: matches[matchIndex].player2_score
          }
        };
      }
      return { data: { submitted: true, matchComplete: false } };
    }
    // Use longer timeout for PvP - Gemini AI validation can take 30+ seconds
    return api.post(`/pvp/${matchId}/submit`, { code, score }, { timeout: 60000 });
  },

  // Cancel a pending match
  cancelMatch: async (matchId) => {
    if (isDemoMode()) {
      const matches = JSON.parse(localStorage.getItem('demoPvPMatches') || '[]');
      const filtered = matches.filter(m => m.id !== matchId);
      localStorage.setItem('demoPvPMatches', JSON.stringify(filtered));
      return { data: { message: 'Match cancelled' } };
    }
    return api.delete(`/pvp/${matchId}`);
  }
};

// Rewards API - Daily rewards, cosmetics, achievements
export const rewardsAPI = {
  getDailyReward: () => api.get('/rewards/daily'),
  claimDailyReward: () => api.post('/rewards/claim'),
  getCosmetics: () => api.get('/rewards/cosmetics'),
  purchaseCosmetic: (cosmeticId) => api.post(`/rewards/cosmetics/${cosmeticId}/purchase`),
  equipCosmetic: (cosmeticId) => api.post(`/rewards/cosmetics/${cosmeticId}/equip`),
};

// Achievements API
export const achievementsAPI = {
  getAll: () => api.get('/rewards/achievements'),
  getNotifications: () => api.get('/rewards/notifications'),
  markNotificationRead: (notificationId) => api.post(`/rewards/notifications/${notificationId}/read`),
};

// Demo PvP data helpers
function getDemoPvPMatches() {
  const stored = JSON.parse(localStorage.getItem('demoPvPMatches') || '[]');
  if (stored.length > 0) return stored;

  // Return sample completed matches for demo
  return [
    {
      id: 'demo-match-1',
      challenge_id: 'sql_shore_3',
      challenge_title: 'Cargo Weight Check',
      difficulty: 2,
      player1_id: 'demo-user-001',
      player1_username: 'DemoExplorer',
      player2_id: 'demo-opponent-1',
      player2_username: 'SQLMaster',
      status: 'completed',
      player1_score: 145,
      player2_score: 132,
      winner_id: 'demo-user-001',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      completed_at: new Date(Date.now() - 82800000).toISOString()
    },
    {
      id: 'demo-match-2',
      challenge_id: 'sql_shore_5',
      challenge_title: 'The Late Arrivals',
      difficulty: 3,
      player1_id: 'demo-opponent-2',
      player1_username: 'DataNinja',
      player2_id: 'demo-user-001',
      player2_username: 'DemoExplorer',
      status: 'active',
      player1_submitted: true,
      player2_submitted: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      expires_at: new Date(Date.now() + 82800000).toISOString()
    }
  ];
}

function getDemoPvPChallenges() {
  return [
    { id: 'sql_shore_3', title: 'Cargo Weight Check', description: 'Filter ships by weight', difficulty: 2, island_id: 'sql_shore' },
    { id: 'sql_shore_4', title: 'Port of Origin', description: 'Filter by origin port', difficulty: 2, island_id: 'sql_shore' },
    { id: 'sql_shore_5', title: 'The Late Arrivals', description: 'Date filtering', difficulty: 3, island_id: 'sql_shore' },
    { id: 'sql_shore_6', title: 'Fleet Assembly', description: 'JOIN two tables', difficulty: 3, island_id: 'sql_shore' },
    { id: 'sql_shore_8', title: 'Port Traffic', description: 'COUNT and GROUP BY', difficulty: 3, island_id: 'sql_shore' }
  ];
}

function getDemoPvPLeaderboard() {
  return [
    { id: '1', username: 'SQLMaster', tier: 'Data Master', wins: 45, losses: 12, draws: 3 },
    { id: '2', username: 'QueryQueen', tier: 'Code Sorcerer', wins: 38, losses: 15, draws: 5 },
    { id: '3', username: 'DataNinja', tier: 'Code Sorcerer', wins: 32, losses: 18, draws: 2 },
    { id: 'demo-user-001', username: 'DemoExplorer', tier: 'Data Apprentice', wins: 1, losses: 0, draws: 0 },
    { id: '5', username: 'JoinJockey', tier: 'Pipeline Builder', wins: 22, losses: 20, draws: 8 }
  ];
}

// Demo data helpers
function getDemoIslands() {
  return [
    {
      id: 'sql_shore',
      name: 'SQL Shore',
      description: 'Master the fundamentals of SQL and data querying',
      theme: 'nautical',
      unlocked: true,
      sections: [
        { id: 'shores_of_selection', name: 'Selection Strait', description: 'Learn SELECT statements', challengeCount: 5 },
        { id: 'join_junction', name: 'Join Junction', description: 'Master table joins', challengeCount: 2 },
        { id: 'aggregation_atoll', name: 'Aggregation Atoll', description: 'GROUP BY and aggregates', challengeCount: 3 }
      ],
      totalChallenges: 10
    },
    {
      id: 'python_peninsula',
      name: 'Python Peninsula',
      description: 'Learn PySpark and data transformation',
      theme: 'jungle',
      unlocked: false,
      requiredXP: 500,
      sections: [
        { id: 'dataframe_dunes', name: 'DataFrame Dunes', description: 'Create and manipulate DataFrames', challengeCount: 3 }
      ],
      totalChallenges: 3
    }
  ];
}

function getDemoIslandChallenges(islandId) {
  // Returns empty for demo - frontend uses local challenges.js
  return { island: getDemoIslands().find(i => i.id === islandId), sections: [], challenges: [] };
}

function getDemoSectionChallenges(islandId, sectionId) {
  return {
    island: getDemoIslands().find(i => i.id === islandId),
    section: getDemoIslands().find(i => i.id === islandId)?.sections.find(s => s.id === sectionId),
    challenges: []
  };
}

function getDemoLeaderboard() {
  return [
    { rank: 1, id: '1', username: 'DataWizard', tier: 'Data Master', total_xp: 12500, change: 0 },
    { rank: 2, id: '2', username: 'QueryQueen', tier: 'Data Master', total_xp: 11800, change: 1 },
    { rank: 3, id: '3', username: 'SparkShark', tier: 'Code Sorcerer', total_xp: 10200, change: -1 },
    { rank: 4, id: '4', username: 'PipelinePro', tier: 'Code Sorcerer', total_xp: 9800, change: 2 },
    { rank: 5, id: '5', username: 'SQLSailor', tier: 'Pipeline Builder', total_xp: 8500, change: 0 },
    { rank: 6, id: '6', username: 'Pythoneer', tier: 'Pipeline Builder', total_xp: 7200, change: -2 },
    { rank: 7, id: '7', username: 'DeltaDiver', tier: 'Pipeline Builder', total_xp: 6800, change: 1 },
    { rank: 8, id: '8', username: 'CloudChaser', tier: 'Data Apprentice', total_xp: 5500, change: 3 },
    { rank: 9, id: '9', username: 'AlgoAce', tier: 'Data Apprentice', total_xp: 4200, change: 0 },
    { rank: 10, id: '10', username: 'BitBuilder', tier: 'Data Apprentice', total_xp: 3800, change: -1 }
  ];
}

export default api;
