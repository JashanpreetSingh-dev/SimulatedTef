# Environment Variables Reference

## Backend Variables

### Required
- **`MONGODB_URI`** - MongoDB connection string
- **`CLERK_SECRET_KEY`** - Clerk authentication key (required for production)

### Optional
- **`MONGODB_DB_NAME`** - Database name (default: `tef_master`)
- **`REDIS_URL`** - Redis connection (required for job queue)
- **`PORT`** - Server port (default: `3001`)
- **`HOST`** - Server host (default: `0.0.0.0`)
- **`NODE_ENV`** - Environment mode (`development` or `production`)
- **`RUN_WORKER`** - Run worker in same process (default: `true` in dev, `false` in prod)

## AWS S3 Configuration (Audio Storage)

Audio files (user recordings and listening exam audio) are stored in AWS S3.

### Required for Audio Features
- **`AWS_REGION`** - AWS region (e.g., `us-east-1`)
- **`AWS_ACCESS_KEY_ID`** - AWS IAM access key
- **`AWS_SECRET_ACCESS_KEY`** - AWS IAM secret key
- **`AWS_S3_BUCKET`** - S3 bucket name for audio files

### Optional
- **`S3_URL_EXPIRY_SECONDS`** - Presigned URL expiry time in seconds (default: `3600` = 1 hour)

### S3 Bucket Setup

1. Create an S3 bucket in your AWS account
2. Block all public access (recommended for security)
3. Create an IAM user with the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

4. Generate access keys for the IAM user
5. Add the credentials to your environment variables

## Frontend Variables

- **`VITE_BACKEND_URL`** - Backend API URL (default: `http://localhost:3001`)
- **`GEMINI_API_KEY`** - Gemini API key (for Gemini TTS or AI features)

## TTS Provider Configuration

### Google Cloud TTS (Recommended - Better Rate Limits)

- **`TTS_PROVIDER`** - Set to `gcp` (optional, auto-detected)
- **`GOOGLE_APPLICATION_CREDENTIALS`** - Service account JSON content or file path

**Format Options:**
1. **JSON in .env** (recommended):
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"...",...}
   ```
   - Use helper script: `npm run convert-service-account`
   - Must be single line, no quotes around JSON

2. **File path**:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=service-account-key.json
   ```

### Gemini TTS (Alternative - Lower Rate Limits)

- **`TTS_PROVIDER`** - Set to `gemini`
- **`GEMINI_API_KEY`** - Required

## Quick Setup Examples

### Local Development (.env)

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/tef_master
CLERK_SECRET_KEY=sk_test_...
REDIS_URL=redis://localhost:6379

# AWS S3 (Audio Storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name

# TTS - Google Cloud (recommended)
TTS_PROVIDER=gcp
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account",...}

# OR TTS - Gemini (alternative)
# TTS_PROVIDER=gemini
# GEMINI_API_KEY=your_key_here
```

### Production (Railway)

Set in Railway dashboard (same format as .env):

```bash
MONGODB_URI=mongodb+srv://...  # Auto-set by Railway plugin
REDIS_URL=redis://...          # Auto-set by Railway plugin
CLERK_SECRET_KEY=sk_live_...

# AWS S3 (Audio Storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name

TTS_PROVIDER=gcp
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account",...}
NODE_ENV=production
RUN_WORKER=false
```

## Service Account Key Setup

### Quick Method: Use Helper Script

```bash
npm run convert-service-account
```

This outputs the correctly formatted line for your `.env` file.

### Manual Method

1. Download service account JSON from [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Convert to single-line JSON (minified)
3. Paste in `.env`: `GOOGLE_APPLICATION_CREDENTIALS={...}`

**Important:**
- ✅ Single line, no quotes around JSON
- ❌ Don't use quotes: `GOOGLE_APPLICATION_CREDENTIALS="{...}"`
- ❌ Don't use multi-line JSON

### Security Notes

- `.env` files are in `.gitignore` - never commit them
- Use separate service accounts for staging/production
- Rotate keys every 90 days
- Service account needs "Cloud Text-to-Speech API User" role

## Quick Checklist

- [ ] `MONGODB_URI`
- [ ] `CLERK_SECRET_KEY` (production)
- [ ] `REDIS_URL` (for job queue)
- [ ] `AWS_REGION` + `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` + `AWS_S3_BUCKET` (audio storage)
- [ ] `TTS_PROVIDER=gcp` + `GOOGLE_APPLICATION_CREDENTIALS` (recommended)
- [ ] OR `TTS_PROVIDER=gemini` + `GEMINI_API_KEY` (alternative)
