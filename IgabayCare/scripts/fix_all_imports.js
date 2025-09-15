#!/usr/bin/env node

/**
 * Comprehensive fix script for IgabayCare application
 * Fixes import paths, missing dependencies, and standardizes Supabase imports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'src');

// Files that need import path fixes
const importFixes = [
  {
    pattern: /from ['"]\.\.\/lib\/supabase['"]/g,
    replacement: "from '../supabaseClient'"
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/lib\/supabase['"]/g,
    replacement: "from '../../supabaseClient'"
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/\.\.\/lib\/supabase['"]/g,
    replacement: "from '../../../supabaseClient'"
  }
];

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    importFixes.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed imports in: ${path.relative(srcDir, filePath)}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      fixImportsInFile(fullPath);
    }
  });
}

console.log('🚀 Starting comprehensive IgabayCare fixes...');
console.log('📁 Processing directory:', srcDir);

// Process all TypeScript files
processDirectory(srcDir);

console.log('✅ Import path fixes completed!');
