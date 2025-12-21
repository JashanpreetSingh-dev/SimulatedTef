# Environment Variables Reference

This document lists all environment variables required for the TEF Master application.

## Backend Environment Variables

### Required Variables

#### Database
- **`MONGODB_URI`** (Required)
  - MongoDB connection string
  - Example: `mongodb+srv://user:password@cluster.mongodb.net/`
  - Used for: Database connection with connection pooling

#### Authentication
- **`CLERK_SECRET_KEY`** (Required for production)
  - Clerk authentication secret key
  - Get from: [Clerk Dashboard](https://dashboard.clerk.com)
  - Used for: User authentication middleware
  - Note: If not set, authentication is disabled (development only)

### Optional Variables

#### Database
- **`MONGODB_DB_NAME`** (Optional, default: `tef_master`)
  - MongoDB database name
  - Example: `tef_master`

#### Redis (Required for Job Queue)
- **`REDIS_URL`** (Required for job queue functionality)
  - Redis connection string
  - Local: `redis://localhost:6379`
  - Railway: Automatically set when using Railway Redis plugin
  - Example: `redis://default:password@host:port`
  - Used for: BullMQ job queue (evaluation jobs)

#### Server Configuration
- **`PORT`** (Optional, default: `3001`)
  - Server port number
  - Example: `3001`

- **`HOST`** (Optional, default: `0.0.0.0`)
  - Server host address
  - Example: `0.0.0.0` (listen on all interfaces for Railway)

- **`NODE_ENV`** (Optional, default: `development`)
  - Environment mode: `development` or `production`
  - Used for: Error handling, static file serving

#### Worker Configuration
- **`RUN_WORKER`** (Optional)
  - Set to `true` to run the evaluation worker in the same process
  - Set to `false` to disable worker (use separate worker process)
  - Default: `true` in development, `false` in production
  - Note: For production, recommended to run worker as separate process

## Frontend Environment Variables

### Required Variables

- **`VITE_BACKEND_URL`** (Optional, default: `http://localhost:3001`)
  - Backend API URL
  - Development: `http://localhost:3001`
  - Production: Your deployed backend URL
  - Example: `https://your-app.railway.app`

### Gemini API (Frontend)

- **`GEMINI_API_KEY`** (Required)
  - Google Gemini API key
  - Get from: [Google AI Studio](https://aistudio.google.com/apikey)
  - Used for: AI evaluation and transcription
  - Note: This is NOT prefixed with `VITE_` because it's processed server-side by Vite during build, not exposed to the browser

## Environment Setup Examples

### Local Development (.env)

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/tef_master
MONGODB_DB_NAME=tef_master

# Authentication
CLERK_SECRET_KEY=sk_test_...

# Redis (for job queue)
REDIS_URL=redis://localhost:6379

# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
RUN_WORKER=true
```

### Frontend (.env.local)

```bash
# Backend URL
VITE_BACKEND_URL=http://localhost:3001

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
```

### Railway Production

Set these in Railway dashboard:

```bash
# Database (Railway MongoDB plugin sets this automatically)
MONGODB_URI=mongodb+srv://...

# Authentication
CLERK_SECRET_KEY=sk_live_...

# Redis (Railway Redis plugin sets this automatically)
REDIS_URL=redis://default:password@host:port

# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
RUN_WORKER=false  # Run worker as separate service

# Frontend
VITE_BACKEND_URL=https://your-backend.railway.app
GEMINI_API_KEY=your_gemini_api_key
```

## Railway-Specific Setup

### 1. MongoDB
- Add Railway MongoDB plugin
- `MONGODB_URI` is automatically set

### 2. Redis
- Add Railway Redis plugin
- `REDIS_URL` is automatically set

### 3. Worker Process
For production, run the worker as a separate Railway service:
- Create a new service
- Use the same codebase
- Set environment variable: `RUN_WORKER=true`
- Use command: `npm run worker`

## Quick Start Checklist

- [ ] Set `MONGODB_URI` (required)
- [ ] Set `CLERK_SECRET_KEY` (required for production)
- [ ] Set `REDIS_URL` (required for job queue)
- [ ] Set `VITE_BACKEND_URL` (frontend)
- [ ] Set `GEMINI_API_KEY` (frontend)
- [ ] Set `RUN_WORKER=true` if running worker in same process
- [ ] Set `NODE_ENV=production` for production

## Notes

- All environment variables are loaded using `dotenv/config`
- Backend variables are read from `process.env`
- Frontend variables must be prefixed with `VITE_` to be accessible
- Never commit `.env` files to version control
- Use Railway's environment variable management for production

