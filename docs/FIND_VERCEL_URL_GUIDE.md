# How to Find Your Vercel Deployment URL

## 🔍 Method 1: Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard:**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Sign in with your account

2. **Find Your Project:**
   - Look for your "plateful-app" project (or similar name)
   - Click on the project

3. **Get the URL:**
   - You'll see your deployment URL at the top
   - It will look like: `https://plateful-app-xxxxx.vercel.app`
   - Or if you have a custom domain: `https://your-custom-domain.com`

## 🔍 Method 2: Command Line

If you have Vercel CLI installed:

```bash
# Navigate to your project root
cd /path/to/plateful-app

# List your deployments
vercel ls

# Or get project info
vercel inspect
```

## 🔍 Method 3: GitHub Integration

If your Vercel is connected to GitHub:

1. Go to your GitHub repository
2. Look for Vercel deployment comments on recent commits
3. The URL will be in the deployment preview comments

## 🔍 Method 4: Check Recent Deployments

Look for deployment notifications in:
- Your email (Vercel sends deployment notifications)
- Slack/Discord if you have integrations set up
- GitHub commit comments

## 📝 What to Look For

Your Vercel URL will typically be one of these formats:

### Auto-generated URL:
```
https://plateful-app.vercel.app
https://plateful-app-git-main-yourusername.vercel.app
https://plateful-app-xxxxx.vercel.app
```

### Custom Domain (if you set one up):
```
https://api.plateful.com
https://your-custom-domain.com
```

## ✅ Once You Find Your URL

**Copy the URL and I'll update your configuration automatically!**

Just tell me what your Vercel URL is, and I'll update the `apps/mobile/app.json` file with the correct API endpoints.

## 🚀 Quick Test

You can test if your API is working by visiting:
```
https://your-vercel-url.vercel.app/api/health
```

This should return a response from your API backend.

---

**Next Step:** Once you find your Vercel URL, tell me what it is and I'll update the mobile app configuration automatically!