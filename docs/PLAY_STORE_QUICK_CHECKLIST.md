# Android Play Store Deployment - Quick Checklist

## Pre-Deployment Checklist

### ✅ Technical Requirements
- [ ] EAS CLI installed globally (`npm install -g @expo/eas-cli`)
- [ ] Logged into EAS account (`eas login`)
- [ ] Project connected to EAS (`eas project:info`)
- [ ] Production EAS configuration updated
- [ ] App signing credentials configured
- [ ] Environment variables set for production
- [ ] API backend accessible and working

### ✅ App Configuration
- [ ] App name finalized: "Plateful"
- [ ] Package name: `com.plateful.app`
- [ ] Version code incremented
- [ ] Icons and splash screens optimized
- [ ] Permissions properly configured
- [ ] Firebase configuration included

### ✅ Google Play Console
- [ ] Google Play Console account active
- [ ] App created in console
- [ ] Store listing information prepared
- [ ] Screenshots captured (phone + tablet)
- [ ] App description written
- [ ] Privacy policy URL ready
- [ ] Content rating completed

## Build Commands (Execute in Order)

```bash
# 1. Navigate to mobile app
cd apps/mobile

# 2. Install EAS CLI (if not done)
npm install -g @expo/eas-cli

# 3. Login to EAS
eas login

# 4. Verify project
eas project:info

# 5. Configure credentials
eas credentials

# 6. Create production build
eas build --platform android --profile production

# 7. Check build status
eas build:list

# 8. Submit to Play Store (optional - automated)
eas submit --platform android --profile production
```

## Critical Files to Update

1. **`apps/mobile/eas.json`** - Build configuration
2. **`apps/mobile/app.json`** - App metadata and Android config
3. **Environment variables** - API endpoints and keys

## Play Store Submission Steps

1. **Internal Testing**
   - Upload AAB to internal testing track
   - Test with small group
   - Verify all features work

2. **Production Release**
   - Move from internal to production
   - Submit for review
   - Monitor review status

## Timeline

- **Setup & Configuration:** 1-2 hours
- **First Build:** 15-30 minutes
- **Play Store Setup:** 1-2 hours
- **Review Process:** 1-3 days

## Emergency Contacts & Resources

- **EAS Documentation:** https://docs.expo.dev/build/introduction/
- **Play Console:** https://play.google.com/console
- **Firebase Console:** https://console.firebase.google.com
- **Vercel Dashboard:** https://vercel.com/dashboard

## Post-Launch Monitoring

- [ ] Monitor crash reports in Play Console
- [ ] Check user reviews and ratings
- [ ] Monitor API usage on Vercel
- [ ] Set up analytics tracking
- [ ] Plan first update cycle