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
  
  // Add styled import if it doesn't exist
  if (!content.includes("import { styled } from 'nativewind'")) {
    // Find the last import statement
    const importRegex = /import.*from.*['"][^'"]*['"];?\s*\n/g;
    const imports = content.match(importRegex);
    
    if (imports) {
      const lastImport = imports[imports.length - 1];
      const insertIndex = content.lastIndexOf(lastImport) + lastImport.length;
      
      // Insert styled import after the last import
      content = content.slice(0, insertIndex) + 
                "import { styled } from 'nativewind';\n" +
                content.slice(insertIndex);
      updated = true;
    }
  }
  
  // Add styled component declarations for common components
  const componentNames = ['TouchableOpacity', 'Text', 'View', 'ScrollView', 'Image', 'Pressable', 'TextInput'];
  let styledDeclarations = '';
  
  componentNames.forEach(componentName => {
    if (content.includes(componentName) && !content.includes(`const Styled${componentName} = styled(${componentName})`)) {
      styledDeclarations += `const Styled${componentName} = styled(${componentName});\n`;
    }
  });
  
  if (styledDeclarations) {
    // Insert styled declarations after styled import
    const styledImportIndex = content.indexOf("import { styled } from 'nativewind'");
    if (styledImportIndex !== -1) {
      const insertIndex = content.indexOf(';', styledImportIndex) + 1;
      content = content.slice(0, insertIndex) + '\n' + styledDeclarations + content.slice(insertIndex);
      updated = true;
    }
  }
  
  // Replace ComponentName with StyledComponentName in JSX
  componentNames.forEach(componentName => {
    const componentRegex = new RegExp(`<${componentName}(?![A-Za-z])`, 'g');
    if (componentRegex.test(content)) {
      content = content.replace(componentRegex, `<Styled${componentName}`);
      updated = true;
    }
    
    const closingComponentRegex = new RegExp(`</${componentName}>`, 'g');
    if (closingComponentRegex.test(content)) {
      content = content.replace(closingComponentRegex, `</Styled${componentName}>`);
      updated = true;
    }
  });
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Restored: ${filePath}`);
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

console.log('🎉 NativeWind v2 restoration completed!');
