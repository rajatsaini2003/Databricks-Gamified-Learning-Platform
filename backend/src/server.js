require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimiter = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/auth');
const challengesRoutes = require('./routes/challenges');
const validationRoutes = require('./routes/validation');
const leaderboardRoutes = require('./routes/leaderboard');
const guildsRoutes = require('./routes/guilds');
const pvpRoutes = require('./routes/pvp');
const usersRoutes = require('./routes/users');
const rewardsRoutes = require('./routes/rewards');

// Initialize Express app
const app = express();

// Middleware setup
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' })); // Allow all if not specified for dev
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/guilds', guildsRoutes);
app.use('/api/pvp', pvpRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/rewards', rewardsRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Centralized Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found', message: "The requested resource could not be found." });
});

const PORT = process.env.PORT || 3001;

// Only start the server if not being imported for tests
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        // Initialize DB and Redis connections
        require('./config/database');
        require('./config/redis');
    });
}

module.exports = app;