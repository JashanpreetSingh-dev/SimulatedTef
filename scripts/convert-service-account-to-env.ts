/**
 * Helper script to convert service-account-key.json to .env format
 * Usage: tsx scripts/convert-service-account-to-env.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const serviceAccountPath = path.join(projectRoot, 'service-account-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Error: ${serviceAccountPath} not found`);
  process.exit(1);
}

try {
  // Read the JSON file
  const jsonContent = fs.readFileSync(serviceAccountPath, 'utf8');
  
  // Parse to validate it's valid JSON
  const parsed = JSON.parse(jsonContent);
  
  // Convert to single-line JSON (minified)
  const singleLineJson = JSON.stringify(parsed);
  
  console.log('\nAdd this line to your .env file:\n');
  console.log('GOOGLE_APPLICATION_CREDENTIALS=' + singleLineJson);
  console.log('\nOr if you prefer the file path approach:\n');
  console.log('GOOGLE_APPLICATION_CREDENTIALS=service-account-key.json');
  console.log('\n');
  
} catch (error: any) {
  console.error(`Error processing JSON: ${error.message}`);
  process.exit(1);
}
