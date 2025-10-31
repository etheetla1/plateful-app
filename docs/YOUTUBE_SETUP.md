# YouTube API Setup Guide

This guide will help you enable YouTube video search in the Plateful app by setting up the YouTube Data API v3.

## Quick Setup Steps

### 1. Get Your YouTube API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select a Project**
   - If you don't have a project, click "Create Project"
   - Give it a name (e.g., "Plateful App")
   - Click "Create"

3. **Enable YouTube Data API v3**
   - Navigate to **APIs & Services** → **Library**
   - Search for "YouTube Data API v3"
   - Click on it and press **Enable**

4. **Create API Key**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **API Key**
   - Copy the generated API key (it will look like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

5. **(Recommended) Restrict the API Key**
   - Click on the newly created API key
   - Under **API restrictions**, select "Restrict key"
   - Choose "YouTube Data API v3" from the list
   - Under **Application restrictions**, you can restrict by IP address or HTTP referrer if needed
   - Click **Save**

## 2. Add the Key to Your Environment

### For Local Development

Create or edit `apps/api/.env` or `apps/api/.env.local`:

```bash
YOUTUBE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Note:** The dev server uses `dotenv` which will automatically load `.env` files.

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Key:** `YOUTUBE_API_KEY`
   - **Value:** Your API key (paste the key you copied)
   - **Environment:** Select all environments (Production, Preview, Development)
4. Click **Save**

## 3. Restart Your Server

After adding the API key, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd apps/api
npm run dev
```

## 4. Test It Out

1. Open your mobile app
2. Navigate to the **Learn** tab
3. Try searching for a cooking tutorial (e.g., "how to make pasta")
4. You should now see YouTube videos in the results!

## Troubleshooting

### "YOUTUBE_API_KEY not configured" Warning

- Make sure the `.env` file is in the `apps/api` directory
- Check that the variable name is exactly `YOUTUBE_API_KEY` (case-sensitive)
- Restart your dev server after adding the key

### API Quota Exceeded

YouTube Data API has daily quotas:
- **Default:** 10,000 units per day
- **Free tier:** Each search request costs 100 units
- This means ~100 searches per day on the free tier

If you hit the quota:
1. Wait 24 hours for it to reset
2. Or request a quota increase in Google Cloud Console

### "API key not valid" Error

- Make sure the API key is correct (no extra spaces)
- Verify that YouTube Data API v3 is enabled in your Google Cloud project
- Check that the API key restrictions allow your usage

### Videos Not Showing Up

- Check the server logs for error messages
- Make sure the search query is valid
- The API may return empty results if no videos match your search

## Security Notes

⚠️ **Important:** Never commit your API key to Git!

- The `.env` file is already in `.gitignore`
- For Vercel, use environment variables (not code)
- If your API key is leaked, immediately regenerate it in Google Cloud Console

## Current Implementation

The YouTube search is integrated in:
- **Service:** `apps/api/services/youtube-search.ts`
- **API Endpoint:** `GET /api/tutorials/search?query=...&type=video`
- **Search Limit:** Currently configured to return 1 video per search (configurable in `apps/api/api/tutorials.ts`)

The search filters videos by:
- Category: "Howto & Style" (category ID 26)
- Type: Video only
- Order: Relevance
- Safe Search: None (to get cooking tutorials)

