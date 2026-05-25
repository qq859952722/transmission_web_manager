const fs = require('fs');
const path = require('path');

function removeLines(file, start, end) {
  const p = path.join(process.cwd(), file);
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  lines.splice(start - 1, end - start + 1); // 0-indexed, splice (startIdx, deleteCount)
  fs.writeFileSync(p, lines.join('\n'), 'utf8');
  console.log(`Fixed ${file}`);
}

// In zh-CN.ts, injected lines are 425 to 510 inclusive
removeLines('src/utils/i18n/zh-CN.ts', 425, 510);
// In en.ts, injected lines are 422 to 507 inclusive
removeLines('src/utils/i18n/en.ts', 422, 507);
