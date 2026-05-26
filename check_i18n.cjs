const fs = require('fs');
const path = require('path');

const enContent = fs.readFileSync('src/utils/i18n/en.ts', 'utf-8');
const zhContent = fs.readFileSync('src/utils/i18n/zh-CN.ts', 'utf-8');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src');
const usedKeys = new Set();
const regex = /t\(['"]([^'"]+)['"]/g;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    usedKeys.add(match[1]);
  }
});

const missingInEn = [];
const missingInZh = [];

usedKeys.forEach(key => {
  const lastPart = key.split('.').pop();
  if (!enContent.includes(`"${lastPart}"`) && !enContent.includes(`"${key}"`)) {
    missingInEn.push(key);
  }
  if (!zhContent.includes(`"${lastPart}"`) && !zhContent.includes(`"${key}"`)) {
    missingInZh.push(key);
  }
});

console.log('Missing in EN:', missingInEn);
console.log('Missing in ZH:', missingInZh);
