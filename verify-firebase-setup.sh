#!/bin/bash

# Firebase Setup Verification Script
# This script checks if all Firebase configuration is correctly set up

set -e

echo "🔍 Firebase Setup Verification"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $description: $file"
        return 0
    else
        echo -e "${RED}❌${NC} $description: $file (NOT FOUND)"
        ((ERRORS++))
        return 1
    fi
}

# Function to check directory doesn't exist
check_no_dir() {
    local dir=$1
    local description=$2
    
    if [ ! -d "$dir" ]; then
        echo -e "${GREEN}✅${NC} $description: $dir (correctly removed)"
        return 0
    else
        echo -e "${YELLOW}⚠️${NC} $description: $dir (should not exist)"
        ((WARNINGS++))
        return 1
    fi
}

# Function to check string in file
check_string_in_file() {
    local file=$1
    local search=$2
    local description=$3
    
    if [ -f "$file" ]; then
        if grep -q "$search" "$file"; then
            echo -e "${GREEN}✅${NC} $description"
            return 0
        else
            echo -e "${RED}❌${NC} $description (NOT FOUND in $file)"
            ((ERRORS++))
            return 1
        fi
    else
        echo -e "${RED}❌${NC} $description (file $file not found)"
        ((ERRORS++))
        return 1
    fi
}

echo "📁 Checking File Locations..."
echo "----------------------------"
check_file "apps/mobile/android/app/google-services.json" "Android Firebase config"
check_file "apps/mobile/ios/Plateful/GoogleService-Info.plist" "iOS Firebase config"
check_file "apps/mobile/android/build.gradle" "Android root build.gradle"
check_file "apps/mobile/android/app/build.gradle" "Android app build.gradle"
check_file "apps/mobile/app.json" "Expo app.json"
echo ""

echo "🧹 Checking Cleaned Directories..."
echo "----------------------------------"
check_no_dir "apps/api/android" "API android folder"
check_no_dir "apps/api/ios" "API ios folder"
check_no_dir "apps/mobile/app/google-services.json" "Old google-services.json location"
echo ""

echo "📦 Checking Package Names..."
echo "----------------------------"
check_string_in_file "apps/mobile/android/app/google-services.json" "com.plateful.app" "Android package name in google-services.json"
check_string_in_file "apps/mobile/app.json" "com.plateful.app" "Package name in app.json"
check_string_in_file "apps/mobile/android/app/build.gradle" "com.plateful.app" "Package name in build.gradle"
check_string_in_file "apps/mobile/ios/Plateful/GoogleService-Info.plist" "com.plateful.app" "iOS bundle identifier"
echo ""

echo "🔌 Checking Gradle Plugin Configuration..."
echo "-------------------------------------------"
check_string_in_file "apps/mobile/android/build.gradle" "com.google.gms:google-services" "Google Services plugin classpath"
check_string_in_file "apps/mobile/android/app/build.gradle" "com.google.gms.google-services" "Google Services plugin applied"
echo ""

echo "🧪 Checking Firebase SDK..."
echo "---------------------------"
check_file "apps/mobile/src/config/firebase.ts" "Firebase configuration file"
check_string_in_file "apps/mobile/package.json" "firebase" "Firebase SDK dependency"
echo ""

echo "================================"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Download fresh google-services.json from Firebase Console (Android)"
    echo "2. Download fresh GoogleService-Info.plist from Firebase Console (iOS)"
    echo "3. Replace the files in your project"
    echo "4. Run: cd apps/mobile && npm install"
    echo "5. Run: cd apps/mobile/android && ./gradlew clean"
    echo "6. Run: cd apps/mobile/ios && pod install"
    echo "7. Test: npm run android or npm run ios"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️ Passed with $WARNINGS warning(s)${NC}"
    echo "Please review the warnings above."
    exit 0
else
    echo -e "${RED}❌ Failed with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo "Please fix the errors above before proceeding."
    exit 1
fi



