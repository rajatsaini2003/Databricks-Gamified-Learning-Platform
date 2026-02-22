const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;

class AuthService {
  async hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  generateToken(userId, expiresIn = '7d') {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  generateRefreshToken(userId) {
     // For simplicity in this iteration, we reuse the sign method but with a longer expiry if needed
     // In a full production system, you might store refresh tokens in Redis/DB to allow revocation.
     return jwt.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '30d' });
  }
}

module.exports = new AuthService();
