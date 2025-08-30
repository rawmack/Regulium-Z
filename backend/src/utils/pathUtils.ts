import fs from 'fs';
import path from 'path';

/**
 * Shared utility function for resolving CSV file paths
 * This eliminates duplicate path resolution logic across the codebase
 */
export function getCSVPath(filename: string): string {
  // Check if environment variable is set
  const envKey = `${filename.toUpperCase().replace('.csv', '')}_CSV_PATH`;
  if (process.env[envKey]) {
    return path.resolve(process.env[envKey]!);
  }
  
  // Try different relative paths - prioritize current directory
  const possiblePaths = [
    path.join(process.cwd(), filename),                 // From current directory (backend)
    path.join(process.cwd(), '..', filename),           // From parent directory (root)
    path.join(__dirname, '..', '..', filename),         // From compiled dist directory
    path.join(__dirname, '..', '..', '..', filename)    // From src directory
  ];
  
  // Find the first path that exists
  const existingPath = possiblePaths.find(p => fs.existsSync(p));
  if (!existingPath) {
    throw new Error(`${filename} not found in any of these locations: ${possiblePaths.join(', ')}`);
  }
  
  return existingPath;
}
