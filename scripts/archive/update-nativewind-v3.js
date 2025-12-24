const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript/JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results = results.concat(findFiles(filePath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Function to update a single file
function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Remove styled imports
  const styledImportRegex = /import\s+\{\s*styled\s*\}\s+from\s+['"]nativewind['"];?\s*\n?/g;
  if (styledImportRegex.test(content)) {
    content = content.replace(styledImportRegex, '');
    updated = true;
  }
  
  // Remove styled component declarations
  const styledDeclarationsRegex = /const\s+\w+\s*=\s*styled\([^)]+\);\s*\n?/g;
  if (styledDeclarationsRegex.test(content)) {
    content = content.replace(styledDeclarationsRegex, '');
    updated = true;
  }
  
  // Replace StyledComponentName with ComponentName in JSX
  const componentNames = ['TouchableOpacity', 'Text', 'View', 'ScrollView', 'Image', 'Pressable', 'TextInput'];
  
  componentNames.forEach(componentName => {
    const styledComponentRegex = new RegExp(`Styled${componentName}`, 'g');
    if (styledComponentRegex.test(content)) {
      content = content.replace(styledComponentRegex, componentName);
      updated = true;
    }
  });
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
  }
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} files to process...`);

files.forEach(file => {
  try {
    updateFile(file);
  } catch (error) {
    console.error(`❌ Error updating ${file}:`, error.message);
  }
});

console.log('🎉 NativeWind v3 migration completed!');
