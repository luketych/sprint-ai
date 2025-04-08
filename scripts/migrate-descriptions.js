import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOARDS_DIR = path.join(__dirname, '../public/boards');

function migrateCard(cardPath) {
    try {
        // Read the card.json file
        const cardData = JSON.parse(fs.readFileSync(cardPath, 'utf8'));
        
        // Skip if no descriptions
        if (!cardData.descriptions || cardData.descriptions.length === 0) {
            console.log(`Skipping ${cardPath} - no descriptions`);
            return;
        }

        // Create descriptions directory
        const descriptionsDir = path.join(path.dirname(cardPath), 'descriptions');
        if (!fs.existsSync(descriptionsDir)) {
            fs.mkdirSync(descriptionsDir, { recursive: true });
        }

        // Move each description to a separate file
        cardData.descriptions.forEach((description, index) => {
            const descriptionFile = path.join(descriptionsDir, `description_${index + 1}.json`);
            const descriptionData = {
                name: `Description ${index + 1}`,
                body: description
            };
            fs.writeFileSync(descriptionFile, JSON.stringify(descriptionData, null, 2));
        });

        // Remove descriptions from card.json
        delete cardData.descriptions;
        fs.writeFileSync(cardPath, JSON.stringify(cardData, null, 2));

        console.log(`Migrated ${cardPath}`);
    } catch (error) {
        console.error(`Error migrating ${cardPath}:`, error);
    }
}

function findAndMigrateCards(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            findAndMigrateCards(fullPath);
        } else if (entry.name === 'card.json') {
            migrateCard(fullPath);
        }
    }
}

// Start the migration
findAndMigrateCards(BOARDS_DIR);
console.log('Migration complete!'); 