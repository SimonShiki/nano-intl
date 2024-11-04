import { extractMessages } from '../src/extractor';
import * as path from 'path';
import * as fs from 'fs';

const sourceDir = process.argv[2] || './src';
const outputFile = process.argv[3] || './messages.json';

function getAllFiles(dir: string): string[] {
  const files: string[] = [];
  
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      files.push(fullPath);
    }
  });
  
  return files;
}

const files = getAllFiles(sourceDir);
const messages = extractMessages(files);

fs.writeFileSync(outputFile, JSON.stringify(messages, null, 2));
console.log(`Extracted ${messages.length} messages to ${outputFile}`);
