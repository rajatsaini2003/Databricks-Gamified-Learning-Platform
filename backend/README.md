# Databricks Learning Quest - Backend

This is the backend for the Gamified Databricks Learning Platform. It uses Node.js, Express, PostgreSQL, and Redis.

## Architecture

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via `pg`)
- **Cache**: Redis (via `ioredis`)
- **AI**: Gemini API
- **Auth**: JWT

## Project Structure

```
backend/
├── src/
│   ├── routes/        # API Routes (auth, challenges, etc.)
│   ├── services/      # Business logic (Gemini, SQL execution)
│   ├── models/        # Data models
│   ├── middleware/    # Express middleware (auth, rate limiting)
│   ├── config/        # Configuration (DB, Redis, Gemini)
│   └── server.js      # Entry point
├── .env.example       # Environment variables template
├── package.json       # Dependencies and scripts
└── migrations/        # SQL migration files
```

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Copy `.env.example` to `.env` and update the values.
    ```bash
    cp .env.example .env
    ```

3.  **Database**:
    Ensure PostgreSQL is running and the database exists.
    Run migrations (see `migrations/` folder).

4.  **Redis**:
    Ensure Redis is running.

5.  **Run Server**:
    - Development:
      ```bash
      npm run dev
      ```
    - Production:
      ```bash
      npm start
      ```

## API Endpoints

- `/api/auth`: Authentication (Register, Login)
- `/api/challenges`: Challenge management
- `/api/validation`: Code validation (Gemini)
- `/api/leaderboard`: Leaderboards
- `/api/guilds`: Guild management
- `/api/pvp`: PvP matches

## License

ISC