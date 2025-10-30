#!/bin/bash

# Firebase Configuration Verification Script
# Verifies that all Firebase configurations are correct for both iOS and Android

set -e

echo "🔥 Firebase Configuration Verification"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MOBILE_DIR="apps/mobile"
EXPECTED_PACKAGE="com.plateful.app"
EXPECTED_PROJECT_ID="plateful-83021"

# Counter for issues
ISSUES_FOUND=0
WARNINGS_FOUND=0

echo -e "${BLUE}Expected Configuration:${NC}"
echo "  Package Name: $EXPECTED_PACKAGE"
echo "  Project ID: $EXPECTED_PROJECT_ID"
echo ""

# Function to check file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description exists"
        return 0
    else
        echo -e "${RED}✗${NC} $description NOT FOUND"
        echo -e "  ${RED}Expected location: $file${NC}"
        ((ISSUES_FOUND++))
        return 1
    fi
}

# Function to check for string in file
check_contains() {
    local file=$1
    local search_string=$2
    local description=$3
    
    if grep -q "$search_string" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $description"
        return 0
    else
        echo -e "${RED}✗${NC} $description NOT FOUND"
        echo -e "  ${RED}Looking for: $search_string${NC}"
        echo -e "  ${RED}In file: $file${NC}"
        ((ISSUES_FOUND++))
        return 1
    fi
}

# Function to check for placeholder
check_no_placeholder() {
    local file=$1
    local description=$2
    
    if grep -q "PLACEHOLDER" "$file" 2>/dev/null; then
        echo -e "${RED}✗${NC} $description contains PLACEHOLDER"
        grep "PLACEHOLDER" "$file" | sed 's/^/  /'
        ((ISSUES_FOUND++))
        return 1
    else
        echo -e "${GREEN}✓${NC} $description has no placeholders"
        return 0
    fi
}

echo -e "${BLUE}Checking File Locations${NC}"
echo "----------------------"

# Check Android google-services.json
ANDROID_CONFIG="$MOBILE_DIR/android/app/google-services.json"
check_file "$ANDROID_CONFIG" "Android google-services.json"

# Check iOS GoogleService-Info.plist
IOS_CONFIG="$MOBILE_DIR/ios/Plateful/GoogleService-Info.plist"
check_file "$IOS_CONFIG" "iOS GoogleService-Info.plist"

# Check app.json
APP_JSON="$MOBILE_DIR/app.json"
check_file "$APP_JSON" "app.json"

echo ""
echo -e "${BLUE}Checking Package Names${NC}"
echo "----------------------"

# Check Android package in google-services.json
if [ -f "$ANDROID_CONFIG" ]; then
    check_contains "$ANDROID_CONFIG" "\"package_name\": \"$EXPECTED_PACKAGE\"" "Android package in google-services.json"
fi

# Check iOS bundle in GoogleService-Info.plist
if [ -f "$IOS_CONFIG" ]; then
    check_contains "$IOS_CONFIG" "<string>$EXPECTED_PACKAGE</string>" "iOS bundle in GoogleService-Info.plist"
fi

# Check app.json iOS
if [ -f "$APP_JSON" ]; then
    check_contains "$APP_JSON" "\"bundleIdentifier\": \"$EXPECTED_PACKAGE\"" "iOS bundle in app.json"
fi

# Check app.json Android
if [ -f "$APP_JSON" ]; then
    check_contains "$APP_JSON" "\"package\": \"$EXPECTED_PACKAGE\"" "Android package in app.json"
fi

# Check Android build.gradle
ANDROID_BUILD_GRADLE="$MOBILE_DIR/android/app/build.gradle"
if [ -f "$ANDROID_BUILD_GRADLE" ]; then
    check_contains "$ANDROID_BUILD_GRADLE" "applicationId '$EXPECTED_PACKAGE'" "Android applicationId in build.gradle"
    check_contains "$ANDROID_BUILD_GRADLE" "namespace '$EXPECTED_PACKAGE'" "Android namespace in build.gradle"
fi

echo ""
echo -e "${BLUE}Checking Firebase Project ID${NC}"
echo "-----------------------------"

# Check Android project ID
if [ -f "$ANDROID_CONFIG" ]; then
    check_contains "$ANDROID_CONFIG" "\"project_id\": \"$EXPECTED_PROJECT_ID\"" "Android Firebase project ID"
fi

# Check iOS project ID
if [ -f "$IOS_CONFIG" ]; then
    check_contains "$IOS_CONFIG" "<string>$EXPECTED_PROJECT_ID</string>" "iOS Firebase project ID"
fi

echo ""
echo -e "${BLUE}Checking for Placeholders${NC}"
echo "-------------------------"

# Check for placeholders in iOS config
if [ -f "$IOS_CONFIG" ]; then
    check_no_placeholder "$IOS_CONFIG" "iOS GoogleService-Info.plist"
fi

echo ""
echo -e "${BLUE}Checking File in Wrong Locations${NC}"
echo "--------------------------------"

# Check if google-services.json is in wrong location
WRONG_ANDROID_LOCATION="$MOBILE_DIR/app/google-services.json"
if [ -f "$WRONG_ANDROID_LOCATION" ]; then
    echo -e "${RED}✗${NC} google-services.json found in WRONG location"
    echo -e "  ${RED}Found: $WRONG_ANDROID_LOCATION${NC}"
    echo -e "  ${GREEN}Should be: $ANDROID_CONFIG${NC}"
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}✓${NC} No google-services.json in wrong location"
fi

# Check if GoogleService-Info.plist is in wrong location
WRONG_IOS_LOCATION="$MOBILE_DIR/GoogleService-Info.plist"
if [ -f "$WRONG_IOS_LOCATION" ]; then
    echo -e "${RED}✗${NC} GoogleService-Info.plist found in WRONG location"
    echo -e "  ${RED}Found: $WRONG_IOS_LOCATION${NC}"
    echo -e "  ${GREEN}Should be: $IOS_CONFIG${NC}"
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}✓${NC} No GoogleService-Info.plist in wrong location"
fi

echo ""
echo -e "${BLUE}Environment Variables Check${NC}"
echo "--------------------------"

# Check if .env exists
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    # Check for Firebase env vars
    if grep -q "EXPO_PUBLIC_FIREBASE_API_KEY" .env; then
        echo -e "${GREEN}✓${NC} EXPO_PUBLIC_FIREBASE_API_KEY is set"
    else
        echo -e "${YELLOW}⚠${NC} EXPO_PUBLIC_FIREBASE_API_KEY not found in .env"
        ((WARNINGS_FOUND++))
    fi
    
    if grep -q "EXPO_PUBLIC_FIREBASE_PROJECT_ID" .env; then
        echo -e "${GREEN}✓${NC} EXPO_PUBLIC_FIREBASE_PROJECT_ID is set"
    else
        echo -e "${YELLOW}⚠${NC} EXPO_PUBLIC_FIREBASE_PROJECT_ID not found in .env"
        ((WARNINGS_FOUND++))
    fi
else
    echo -e "${YELLOW}⚠${NC} .env file not found (may be using system env vars)"
    ((WARNINGS_FOUND++))
fi

echo ""
echo "======================================"
echo -e "${BLUE}Summary${NC}"
echo "======================================"

if [ $ISSUES_FOUND -eq 0 ] && [ $WARNINGS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Firebase is configured correctly.${NC}"
    exit 0
elif [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${YELLOW}⚠ Configuration OK with $WARNINGS_FOUND warning(s).${NC}"
    exit 0
else
    echo -e "${RED}✗ Found $ISSUES_FOUND critical issue(s) and $WARNINGS_FOUND warning(s).${NC}"
    echo ""
    echo "Please review the issues above and fix them."
    echo "See docs/FIREBASE_SETUP_CRITICAL.md for detailed instructions."
    exit 1
fi


