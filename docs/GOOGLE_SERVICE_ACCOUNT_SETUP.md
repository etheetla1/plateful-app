# Google Service Account Keys Setup for Play Store Deployment

This guide explains how to set up Google Service Account Keys for automated Play Store submission with EAS.

## Overview

Google Service Account Keys allow EAS to automatically submit your app builds to the Google Play Store without manual intervention. You have two options for managing these keys.

## Option 1: Local File Method (Recommended for Initial Setup)

This method keeps the service account key file locally in your project.

### Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Sign in with the same Google account used for Play Console

2. **Create or Select Project**
   - If you don't have a project, click "Create Project"
   - Name it something like "Plateful Play Store API"
   - If you have an existing project, select it

3. **Enable Google Play Developer API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Play Developer API"
   - Click on it and press "Enable"

4. **Create Service Account**
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Name: `plateful-play-store-service`
   - Description: `Service account for Plateful app Play Store submissions`
   - Click "Create and Continue"

5. **Download JSON Key**
   - After creating the service account, click on it
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose "JSON" format
   - Download the file (it will be named something like `plateful-play-store-service-xxxxx.json`)

### Step 2: Google Play Console Setup

1. **Access API Settings**
   - Go to [play.google.com/console](https://play.google.com/console)
   - Select your developer account
   - Go to "Setup" → "API access"

2. **Link Google Cloud Project**
   - Click "Link Google Cloud project"
   - Select the project you created/used in Step 1
   - Click "Link project"

3. **Grant Permissions to Service Account**
   - In the "Service accounts" section, find your service account
   - Click "Grant access"
   - Select these permissions:
     - **Release manager** (can manage releases and edit store listing)
     - **View app information and download bulk reports**
   - Click "Apply"

### Step 3: Local Project Setup

1. **Save the JSON File**
   ```bash
   # Navigate to your mobile app directory
   cd apps/mobile
   
   # Copy the downloaded JSON file (replace with your actual filename)
   cp ~/Downloads/plateful-play-store-service-xxxxx.json ./google-play-service-account.json
   ```

2. **Add to .gitignore**
   ```bash
   # Add the service account file to .gitignore to keep it secure
   echo "google-play-service-account.json" >> .gitignore
   ```

3. **Update EAS Configuration**
   Your `eas.json` should reference the local file:
   ```json
   {
     "submit": {
       "production": {
         "android": {
           "serviceAccountKeyPath": "./google-play-service-account.json",
           "track": "internal",
           "releaseStatus": "draft"
         }
       }
     }
   }
   ```

## Option 2: Expo Website Method (For Advanced CI/CD)

This method stores the service account key securely on Expo's servers.

### Step 1-2: Same as Option 1
Complete the Google Cloud Console and Google Play Console setup exactly as described in Option 1.

### Step 3: Expo Website Setup

1. **Go to Expo Dashboard**
   - Visit [expo.dev](https://expo.dev)
   - Sign in to your account (`kingeli1221`)
   - Navigate to your "plateful" project

2. **Upload Service Account Key**
   - Go to "Credentials" section
   - Click "Add new credential"
   - Select "Google Service Account Key"
   - Upload your JSON file
   - Give it a name like "Play Store Service Account"

3. **Update EAS Configuration**
   ```json
   {
     "submit": {
       "production": {
         "android": {
           "track": "internal",
           "releaseStatus": "draft"
         }
       }
     }
   }
   ```
   Note: No `serviceAccountKeyPath` needed - EAS will use the uploaded credential.

## Which Option Should You Choose?

### Choose Option 1 (Local File) if:
- ✅ You're doing manual deployments initially
- ✅ You want direct control over credentials
- ✅ You're working solo or with a small team
- ✅ You want simpler troubleshooting

### Choose Option 2 (Expo-managed) if:
- ✅ You want automated CI/CD pipelines
- ✅ You're working with a team
- ✅ You want enhanced security (credentials stored on Expo servers)
- ✅ You plan to use GitHub Actions or similar for deployments

## Recommended Approach for Your Project

**Start with Option 1 (Local File Method)** because:
1. You're setting up the deployment process for the first time
2. It's easier to debug if something goes wrong
3. You maintain full control over the credentials
4. Simpler initial setup

You can always migrate to Option 2 later when you want to set up automated deployments.

## Testing Your Setup

After completing either option, test your configuration:

```bash
# Navigate to mobile app
cd apps/mobile

# Test the submission configuration (this won't actually submit)
eas submit --platform android --profile production --dry-run
```

## Security Best Practices

### For Option 1 (Local File):
- ✅ Always add the JSON file to `.gitignore`
- ✅ Never commit service account keys to version control
- ✅ Rotate keys periodically (every 90 days recommended)
- ✅ Use different service accounts for different environments

### For Option 2 (Expo-managed):
- ✅ Use Expo's secure credential storage
- ✅ Regularly review access permissions
- ✅ Monitor credential usage in Expo dashboard

## Troubleshooting Common Issues

### "Service account not found" Error
- Verify the service account exists in Google Cloud Console
- Check that the JSON file path is correct in `eas.json`
- Ensure the service account has proper permissions in Play Console

### "Insufficient permissions" Error
- Go to Play Console → Setup → API access
- Verify the service account has "Release manager" permissions
- Check that the Google Cloud project is properly linked

### "Invalid JSON" Error
- Verify the JSON file isn't corrupted
- Re-download the service account key if needed
- Check file permissions (should be readable)

## Commands Reference

```bash
# Test submission configuration
eas submit --platform android --profile production --dry-run

# Actually submit to Play Store
eas submit --platform android --profile production

# Check submission status
eas submission:list

# View detailed submission info
eas submission:view [submission-id]
```

## Next Steps After Setup

1. **Test with Internal Track**: Always submit to internal testing first
2. **Verify App Appears**: Check Play Console for your app submission
3. **Test the Build**: Download and test the app from Play Console
4. **Move to Production**: Once tested, promote to production track

---

**Important**: Keep your service account credentials secure and never share them publicly. The JSON file contains sensitive information that could allow unauthorized access to your Play Store account.