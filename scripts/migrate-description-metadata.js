import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOARDS_DIR = path.join(__dirname, '../public/boards');

async function migrateDescriptions(boardDir) {
  try {
    // Get all card directories
    const cardDirs = fs.readdirSync(boardDir)
      .filter(dir => dir.match(/^\d+$/));

    for (const cardDir of cardDirs) {
      const descriptionsDir = path.join(boardDir, cardDir, 'descriptions');
      if (!fs.existsSync(descriptionsDir)) {
        continue;
      }

      // Get all description files
      const descriptionFiles = fs.readdirSync(descriptionsDir)
        .filter(file => file.endsWith('.md'));

      if (descriptionFiles.length === 0) {
        continue;
      }

      // Create or load metadata
      const metadataPath = path.join(descriptionsDir, 'metadata.json');
      let metadata = {};
      if (fs.existsSync(metadataPath)) {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      }

      // Process each description file
      for (const fileName of descriptionFiles) {
        const filePath = path.join(descriptionsDir, fileName);
        const content = fs.readFileSync(filePath, 'utf8');

        // Parse YAML frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
        if (!frontmatterMatch) {
          console.warn(`No frontmatter found in ${filePath}`);
          continue;
        }

        const frontmatter = yaml.load(frontmatterMatch[1]);
        const id = frontmatter.id || fileName.replace('.md', '');

        // Add to metadata
        metadata[id] = {
          id,
          createdAt: frontmatter.createdAt || new Date().toISOString(),
          updatedAt: frontmatter.updatedAt || new Date().toISOString(),
        };

        // Remove timestamps from frontmatter
        const newFrontmatter = {
          id: frontmatter.id,
          title: frontmatter.title,
          tags: frontmatter.tags,
        };

        // Create new content without timestamps
        const newContent = `---
${yaml.dump(newFrontmatter)}---
${content.slice(frontmatterMatch[0].length)}`;

        // Write updated content back to file
        fs.writeFileSync(filePath, newContent);
      }

      // Write metadata to file
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      console.log(`Migrated descriptions in ${cardDir}`);
    }
  } catch (error) {
    console.error(`Error migrating descriptions in ${boardDir}:`, error);
  }
}

async function migrateAllBoards() {
  try {
    const boardDirs = fs.readdirSync(BOARDS_DIR)
      .filter(dir => dir !== 'board.json');

    for (const boardDir of boardDirs) {
      const fullPath = path.join(BOARDS_DIR, boardDir);
      if (fs.statSync(fullPath).isDirectory()) {
        await migrateDescriptions(fullPath);
      }
    }
  } catch (error) {
    console.error('Error migrating boards:', error);
  }
}

migrateAllBoards().then(() => {
  console.log('Migration complete');
}).catch(error => {
  console.error('Migration failed:', error);
}); 