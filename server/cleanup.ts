import fs from 'fs/promises';
import path from 'path';

async function cleanupJsonFiles(dir: string) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await cleanupJsonFiles(fullPath);
      } else if (entry.name.endsWith('.json')) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          
          // Remove duplicate content by finding the last valid JSON object
          let cleanedContent = content;
          let lastValidJson = '';
          let lastValidIndex = 0;
          
          for (let i = 0; i < content.length; i++) {
            const testContent = content.substring(0, i + 1);
            try {
              JSON.parse(testContent);
              lastValidJson = testContent;
              lastValidIndex = i;
            } catch (e) {
              // Not valid JSON, continue
            }
          }
          
          if (lastValidJson) {
            cleanedContent = lastValidJson;
          }
          
          // Parse and re-stringify to ensure proper formatting
          const parsed = JSON.parse(cleanedContent);
          const formatted = JSON.stringify(parsed, null, 2);
          await fs.writeFile(fullPath, formatted);
          console.log(`Cleaned ${fullPath}`);
        } catch (error) {
          console.error(`Failed to clean ${fullPath}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error);
  }
}

// Run cleanup on the boards directory
const boardsDir = path.join(process.cwd(), 'public/boards');
cleanupJsonFiles(boardsDir)
  .then(() => console.log('Cleanup complete'))
  .catch(error => console.error('Cleanup failed:', error)); 