#!/usr/bin/env node

import { program } from 'commander';
import { glob } from 'glob';
import * as path from 'path';
import * as fs from 'fs';
import { extractMessages } from './extractor';

program
  .name('nano-intl-extract')
  .description('Extract translatable messages from source files')
  .option('-p, --pattern <pattern>', 'Glob pattern for source files', 'src/**/*.{ts,tsx,js,jsx}')
  .option('-o, --output <file>', 'Output JSON file', 'messages.json')
  .option('-i, --ignore <pattern>', 'Glob pattern to ignore', 'node_modules/**')
  .parse(process.argv);

const options = program.opts();

async function run() {
  try {
    const files = glob.sync(options.pattern, {
      ignore: options.ignore,
      absolute: true
    });

    if (files.length === 0) {
      console.log('No files found matching pattern:', options.pattern);
      return;
    }

    const messages = extractMessages(files);
    const outputPath = path.resolve(options.output);
    
    fs.writeFileSync(outputPath, JSON.stringify(messages, null, 2));
    console.log(`✓ Extracted ${messages.length} messages to ${outputPath}`);
    console.log(`  Found in ${files.length} files`);
  } catch (error) {
    console.error('Error extracting messages:\n', error);
    process.exit(1);
  }
}

run();
