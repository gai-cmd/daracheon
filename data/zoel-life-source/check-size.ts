import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'src', 'pages');
const files = fs.readdirSync(dir);
let totalSize = 0;
for (const file of files) {
  const stat = fs.statSync(path.join(dir, file));
  console.log(`${file}: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
  totalSize += stat.size;
}
console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
