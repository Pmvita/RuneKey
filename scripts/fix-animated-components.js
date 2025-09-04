const fs = require('fs');
const path = require('path');

// Function to update LoginScreen.tsx
function updateLoginScreen(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Replace all AnimatedView with Animated.View
  const animatedViewRegex = /<AnimatedView/g;
  if (animatedViewRegex.test(content)) {
    content = content.replace(animatedViewRegex, '<Animated.View');
    updated = true;
  }
  
  // Replace all closing AnimatedView with Animated.View
  const closingAnimatedViewRegex = /<\/AnimatedView>/g;
  if (closingAnimatedViewRegex.test(content)) {
    content = content.replace(closingAnimatedViewRegex, '</Animated.View>');
    updated = true;
  }
  
  // Replace all AnimatedText with Animated.Text
  const animatedTextRegex = /<AnimatedText/g;
  if (animatedTextRegex.test(content)) {
    content = content.replace(animatedTextRegex, '<Animated.Text');
    updated = true;
  }
  
  // Replace all closing AnimatedText with Animated.Text
  const closingAnimatedTextRegex = /<\/AnimatedText>/g;
  if (closingAnimatedTextRegex.test(content)) {
    content = content.replace(closingAnimatedTextRegex, '</Animated.Text>');
    updated = true;
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
  }
}

// Update LoginScreen
const loginScreenPath = path.join(__dirname, '..', 'src', 'screens', 'auth', 'LoginScreen.tsx');
updateLoginScreen(loginScreenPath);

console.log('🎉 Animated component fixes completed!');
