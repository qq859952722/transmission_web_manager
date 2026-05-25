import fs from 'fs';
import path from 'path';

function findTranslations(dir) {
  let results = new Set();
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findTranslations(fullPath).forEach(r => results.add(r));
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const regex = /t\('dialog\.settings\.([^']+)'\)/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        results.add(match[1]);
      }
    }
  }
  return results;
}

const usedKeys = findTranslations(path.join(process.cwd(), 'src'));
console.log('Used dialog.settings keys:', Array.from(usedKeys).sort());

// Load zh-CN.ts (very roughly, by regexing the settings object)
const zhCN = fs.readFileSync(path.join(process.cwd(), 'src/utils/i18n/zh-CN.ts'), 'utf-8');
const settingsBlockMatch = zhCN.match(/"settings":\s*{([^}]+)}/);
if (settingsBlockMatch) {
  const block = settingsBlockMatch[1];
  const definedKeys = [];
  const regex = /"([^"]+)":/g;
  let match;
  while ((match = regex.exec(block)) !== null) {
    definedKeys.push(match[1]);
  }
  console.log('\nDefined dialog.settings keys:', definedKeys.sort());
  
  const missing = Array.from(usedKeys).filter(k => !definedKeys.includes(k));
  console.log('\nMissing keys:', missing);
}
