#!/usr/bin/env node
/**
 * Quick script to check if YouTube API key is configured
 */

require('dotenv').config();

const apiKey = process.env.YOUTUBE_API_KEY;

if (!apiKey) {
  console.log('❌ YOUTUBE_API_KEY is not configured');
  console.log('\n📝 To fix this:');
  console.log('1. Get a YouTube API key from: https://console.cloud.google.com/apis/credentials');
  console.log('2. Add it to apps/api/.env file:');
  console.log('   YOUTUBE_API_KEY=your-key-here');
  console.log('3. Restart your dev server');
  process.exit(1);
} else {
  console.log('✅ YOUTUBE_API_KEY is configured');
  console.log(`   Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log('\n🎉 YouTube video search should work!');
  process.exit(0);
}

