# 🎮 DatabrickLearningQuest

A gamified, interactive learning platform designed to make learning SQL and database concepts engaging and fun. Navigate through themed islands, complete challenges, compete with friends, and master data engineering skills through an immersive RPG-style experience.

## 🌟 Features

### 🗺️ Island-Based Learning Journey
- **Progressive Learning Path**: Navigate through multiple themed islands, each focusing on different SQL and database concepts
- **SQL Shore**: Master SELECT queries and basic data retrieval
- **JOIN Junction**: Learn table relationships and complex joins
- **Aggregation Archipelago**: Conquer GROUP BY and aggregate functions
- **Subquery Sanctuary**: Unlock the power of nested queries

### 💻 Interactive Code Challenges
- **Monaco Editor Integration**: Industry-standard code editor with syntax highlighting
- **Real-time SQL Execution**: Execute queries directly in the browser using AlasSQL
- **AI-Powered Hints**: Get intelligent hints powered by Google Gemini AI
- **Progressive Difficulty**: Challenges scale from beginner to advanced levels
- **XP & Rewards System**: Earn experience points and unlock achievements

### ⚔️ PvP Arena
- **Real-time Battles**: Compete against other learners in SQL challenges
- **Matchmaking System**: Fair pairing based on skill level
- **Leaderboards**: Track your ranking and compare with the community
- **Guild System**: Join or create guilds to collaborate with other learners

### 📊 Progress Tracking
- **Visual Progress Dashboard**: Monitor your learning journey across all islands
- **Achievement System**: Unlock badges and achievements as you progress
- **Tier Progression**: Advance through ranks from "Data Apprentice" to "Data Master"
- **Statistics & Analytics**: Detailed insights into your learning patterns

## 🏗️ Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Monaco Editor** - VS Code's editor for web
- **AlasSQL** - Client-side SQL database engine
- **Recharts** - Data visualization library
- **Lucide React** - Beautiful icon system

### Backend
- **Node.js & Express** - Server runtime and web framework
- **PostgreSQL** - Production-grade relational database
- **Redis (IORedis)** - Caching and session management
- **Google Gemini AI** - Intelligent hint generation
- **JWT** - Secure authentication
- **Bcrypt** - Password hashing
- **Joi** - Request validation
- **Helmet** - Security middleware
- **Rate Limiting** - API protection

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v14 or higher)
- **Redis** (v7 or higher)
- **Google Gemini API Key** (for AI hints feature)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd DatabrickLearningQuest
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Configure Environment Variables
Create a `.env` file in the `backend` directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=databrick_learning_quest
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=7d

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Initialize Database
```bash
# Create the database (if using psql)
psql -U postgres -c "CREATE DATABASE databrick_learning_quest;"

# Run migrations
psql -U your_db_user -d databrick_learning_quest -f migrations/001_create_tables.sql

# Seed the database with sample data
psql -U your_db_user -d databrick_learning_quest -f seed.sql
```

#### Start Backend Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```
The backend server will run on `http://localhost:5000`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd ../frontend
npm install
```

#### Configure Environment Variables
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

#### Start Frontend Development Server
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`

### 4. Access the Application
Open your browser and navigate to `http://localhost:5173`

**Demo Credentials** (from seed data):
- Username: `DataWizard`
- Password: `password123`

## 📁 Project Structure

```
DatabrickLearningQuest/
├── backend/
│   ├── migrations/          # Database schema migrations
│   ├── src/
│   │   ├── config/          # Configuration files (DB, Redis, Gemini)
│   │   ├── middleware/      # Express middleware (auth, validation, rate limiting)
│   │   ├── models/          # Data models
│   │   ├── routes/          # API route handlers
│   │   └── services/        # Business logic services
│   ├── seed.sql             # Sample data for development
│   └── package.json
├── frontend/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client services
│   │   ├── store/           # Context providers (Auth, Progress, UI)
│   │   └── utils/           # Utility functions
│   └── package.json
└── README.md
```

## 🔑 Key Features Explained

### Challenge System
Each challenge includes:
- **Story Context**: Engaging narrative to make learning fun
- **Datasets**: Sample tables with data to query
- **Validation**: Automatic checking of query results
- **Hints**: AI-powered hints that adapt to your struggle
- **Time Estimates**: Know how long each challenge typically takes

### PvP System
- Create or join battles with real-time matchmaking
- Compete on the same challenge simultaneously
- Fastest correct solution wins
- Earn bonus XP and climb the leaderboards

### Guild System
- Create guilds with custom names and descriptions
- Invite other learners to join
- Contribute to guild XP collectively
- Guild leaderboards and achievements

## 🔧 Development

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Build for Production
```bash
# Backend (no build needed for Node.js)
cd backend
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Bcrypt Password Hashing**: Industry-standard password encryption
- **Helmet**: HTTP headers security
- **CORS Protection**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Joi schemas for all API inputs
- **SQL Injection Protection**: Parameterized queries

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Challenges
- `GET /api/challenges` - List all challenges
- `GET /api/challenges/:id` - Get challenge details
- `POST /api/validation/validate` - Validate SQL solution

### PvP
- `POST /api/pvp/create` - Create new battle
- `POST /api/pvp/join/:matchId` - Join existing battle
- `POST /api/pvp/submit` - Submit solution to battle
- `GET /api/pvp/active` - Get user's active battles

### Leaderboard
- `GET /api/leaderboard/global` - Global rankings
- `GET /api/leaderboard/guilds` - Guild rankings

### Guilds
- `POST /api/guilds` - Create new guild
- `GET /api/guilds` - List all guilds
- `POST /api/guilds/:id/join` - Join a guild
- `DELETE /api/guilds/:id/leave` - Leave a guild



## 📧 Support

For questions, issues, or suggestions:
- I would Like to Thank Yash Sir For giving me this opportunity

---
