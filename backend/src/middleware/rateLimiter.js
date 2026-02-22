// Path: backend/src/middleware/rateLimiter.js
// Middleware for rate limiting API requests.
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 1 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 1 minutes',
});

module.exports = limiter;
