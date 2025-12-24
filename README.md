# TEF Master - TEF Canada Oral Expression Simulator

An AI-powered oral expression simulator and evaluator for the TEF Canada exam. Practice your French speaking skills with real-time evaluation using Google Gemini AI.

## Features

- 🎯 **Section A Practice** - Ask questions to obtain information (4 minutes)
- 💬 **Section B Practice** - Argue to convince a friend (8 minutes)
- 🏆 **Complete Exam Mode** - Full exam simulation (12 minutes)
- 🤖 **AI-Powered Evaluation** - Real-time feedback with detailed scoring
- 📊 **Performance Tracking** - View history and track your progress
- 🎙️ **Audio Recording** - Review your performance with complete session recordings
- 📝 **Detailed Feedback** - Get comprehensive evaluation including CLB and CECR levels

## Tech Stack

- **Frontend**: React 19, Vite, React Router, Tailwind CSS
- **Backend**: Express.js, Node.js
- **AI**: Google Gemini API (Live Audio, Transcription, Evaluation)
- **Database**: MongoDB with GridFS for audio storage
- **Authentication**: Clerk
- **Deployment**: Railway-ready

## Prerequisites

- Node.js 20+ 
- MongoDB database (local or MongoDB Atlas)
- Google Gemini API key
- Clerk account (for authentication)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Stripe Price IDs (for pack purchases)
STRIPE_PRICE_ID_STARTER_PACK=price_xxxxx
STRIPE_PRICE_ID_EXAM_READY_PACK=price_xxxxx

# Optional
MONGODB_DB_NAME=tef_master
VITE_BACKEND_URL=http://localhost:3001
PORT=3001
```

### 2.1. Testing Stripe Webhooks Locally

To test Stripe webhooks locally, use the Stripe CLI:

**1. Install Stripe CLI:**
- **Windows**: Download from [Stripe CLI releases](https://github.com/stripe/stripe-cli/releases) or use `scoop install stripe`
- **macOS**: `brew install stripe/stripe-cli/stripe`
- **Linux**: See [Stripe CLI installation guide](https://stripe.com/docs/stripe-cli)

**2. Login to Stripe:**
```bash
stripe login
```
This will open your browser to authenticate with your Stripe account.

**3. Forward webhooks to your local server:**
```bash
stripe listen --forward-to localhost:3001/api/subscription/webhook
```

**4. Copy the webhook signing secret:**
After running `stripe listen`, you'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

**5. Update your `.env.local` file:**
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**6. Trigger test events:**
In a new terminal, you can trigger test events:
```bash
# Test checkout completion
stripe trigger checkout.session.completed
```

**Note:** The webhook secret from `stripe listen` is different from production webhook secrets. Make sure to use the local secret when testing locally.

### 3. Run Locally

**Development Mode (Frontend only):**
```bash
npm run dev
```
Frontend runs on http://localhost:3000

**Backend Server:**
```bash
npm run server
```
Backend runs on http://localhost:3001

**Production Build (Frontend + Backend):**
```bash
npm run build
npm start
```

## Project Structure

```
├── components/          # React components
│   ├── OralExpressionLive.tsx    # Main exam simulator
│   ├── DetailedResultView.tsx    # Results display
│   └── HistoryList.tsx           # Exam history
├── services/           # Business logic
│   ├── gemini.ts                 # Gemini AI integration
│   ├── persistence.ts            # Database operations
│   └── prompts/                  # AI prompts for exam & evaluation
├── server/             # Express backend
│   └── server.ts                 # API server with MongoDB
├── data/               # Task knowledge bases
│   ├── section_a_knowledge_base.json
│   └── section_b_knowledge_base.json
└── dist/               # Production build output
```

## API Endpoints

- `POST /api/results` - Save exam results
- `GET /api/results/:userId` - Get user's exam history
- `GET /api/results/detail/:id` - Get specific result details
- `POST /api/recordings/upload` - Upload audio recording
- `GET /api/recordings/:id` - Download audio recording
- `GET /api/health` - Health check

## Deployment

See [README_DEPLOYMENT.md](./README_DEPLOYMENT.md) for detailed Railway deployment instructions.

Quick deploy to Railway:
1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Railway will auto-detect and deploy

## Scoring

The evaluation provides:
- **TEF Score**: 0-699 (overall performance)
- **CLB Level**: Canadian Language Benchmark (single level)
- **CECR Level**: Common European Framework (A1-C2)
- **Detailed Criteria**: Task fulfillment, coherence, lexical range, grammar, fluency, interaction
- **Feedback**: Strengths, weaknesses, improvement suggestions

## License

Private project - All rights reserved

## Support

For issues or questions, please open an issue in the repository.
