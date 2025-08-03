#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 RuneKey Development Server Troubleshooter\n');

// Check if node_modules exists
if (!fs.existsSync(path.join(__dirname, '../node_modules'))) {
  console.log('❌ node_modules not found. Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Check if Metro cache exists and clear it
const metroCachePath = path.join(__dirname, '../node_modules/.cache/metro');
if (fs.existsSync(metroCachePath)) {
  console.log('🧹 Clearing Metro cache...');
  try {
    execSync('npx expo start --clear', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (error) {
    console.log('ℹ️  Metro cache cleared');
  }
}

// Check network configuration
console.log('\n🌐 Network Configuration:');
console.log('- Make sure your device/simulator is on the same network as your development machine');
console.log('- Check that port 8081 is not blocked by firewall');
console.log('- Try using tunnel mode: npx expo start --tunnel');

// Check Expo CLI
try {
  const expoVersion = execSync('npx expo --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Expo CLI version: ${expoVersion}`);
} catch (error) {
  console.log('❌ Expo CLI not found. Installing...');
  try {
    execSync('npm install -g @expo/cli', { stdio: 'inherit' });
  } catch (installError) {
    console.error('❌ Failed to install Expo CLI:', installError.message);
  }
}

console.log('\n🚀 Starting development server...');
console.log('If you still have issues, try:');
console.log('1. npx expo start --tunnel');
console.log('2. npx expo start --localhost');
console.log('3. npx expo start --lan');

try {
  execSync('npx expo start', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
} catch (error) {
  console.error('❌ Failed to start development server:', error.message);
  process.exit(1);
} 