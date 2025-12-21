# Railway Deployment Guide

This guide explains how to deploy the TEF Master application to Railway.

## Architecture

The application consists of:
- **Frontend**: React + Vite (builds to `dist/`)
- **Backend**: Express.js server (serves both API and static frontend files)

In production, the Express server serves the built frontend from the `dist/` directory.

## Prerequisites

1. Railway account (sign up at https://railway.app)
2. MongoDB database (can use Railway's MongoDB plugin or external MongoDB Atlas)
3. All required environment variables

## Environment Variables

Set these in Railway's environment variables:

### Required
- `MONGODB_URI` - MongoDB connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/`)
- `GEMINI_API_KEY` - Your Google Gemini API key
- `CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- `CLERK_SECRET_KEY` - Your Clerk secret key (if using server-side Clerk features)

### Optional
- `MONGODB_DB_NAME` - Database name (defaults to `tef_master`)
- `PORT` - Server port (Railway sets this automatically)
- `VITE_BACKEND_URL` - Backend URL (set to your Railway URL in production, e.g., `https://your-app.railway.app`)

## Deployment Steps

### Option 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Create a new Railway project**
   - Go to https://railway.app/dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure the project**
   - Railway will auto-detect Node.js
   - Set the Root Directory to `/` (default)
   - Set the Build Command to: `npm run build`
   - Set the Start Command to: `npm start`

4. **Add environment variables**
   - In Railway project settings, go to "Variables"
   - Add all required environment variables listed above
   - Make sure to set `NODE_ENV=production`

5. **Deploy**
   - Railway will automatically build and deploy
   - You'll get a URL like `https://your-app.railway.app`

### Option 2: Deploy from CLI

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize project**
   ```bash
   railway init
   ```

4. **Set environment variables**
   ```bash
   railway variables set MONGODB_URI="your-mongodb-uri"
   railway variables set GEMINI_API_KEY="your-api-key"
   railway variables set CLERK_PUBLISHABLE_KEY="your-clerk-key"
   railway variables set NODE_ENV=production
   railway variables set VITE_BACKEND_URL="https://your-app.railway.app"
   ```

5. **Deploy**
   ```bash
   railway up
   ```

## Important Notes

1. **Frontend-Backend Communication**: 
   - Make sure `VITE_BACKEND_URL` is set to your Railway deployment URL
   - The frontend will make API calls to this URL

2. **Static File Serving**:
   - The Express server serves the built frontend from `dist/`
   - All non-API routes are served the `index.html` file (for React Router)

3. **MongoDB**:
   - You can use Railway's MongoDB plugin
   - Or use MongoDB Atlas (recommended for production)
   - Make sure your MongoDB URI includes the database name or set `MONGODB_DB_NAME`

4. **Build Process**:
   - Railway runs `npm run build` which builds the Vite frontend
   - The `npm start` command runs the Express server with `NODE_ENV=production`
   - The server serves both API endpoints and static frontend files

## Testing Locally

To test the production build locally:

```bash
# Build the frontend
npm run build

# Start the server in production mode
NODE_ENV=production npm run server
```

Then visit http://localhost:3001 (or your configured PORT)

## Troubleshooting

1. **Build fails**: Check that all dependencies are in `package.json`, not just `devDependencies`
2. **API calls fail**: Verify `VITE_BACKEND_URL` is set correctly in Railway
3. **Static files not loading**: Ensure the `dist/` folder exists after build
4. **MongoDB connection fails**: Check `MONGODB_URI` is correct and accessible from Railway

## Monitoring

- Check Railway logs: `railway logs` or view in Railway dashboard
- Health check endpoint: `GET /api/health`
- Check server logs for MongoDB connection status

