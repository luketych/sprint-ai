import { Card, CardFolder, Description } from '../types';
import { fileSystemService } from './fileSystemService';
import yaml from 'js-yaml';

export class CardServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CardServiceError';
  }
}

interface DescriptionFrontmatter {
  id: string;
  title: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const cardService = {
  async createCard(boardId: string, card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>): Promise<CardFolder> {
    try {
      const id = Date.now().toString();
      const now = new Date().toISOString();
      const newCard: Card = {
        ...card,
        id,
        createdAt: now,
        updatedAt: now,
      };

      // Create card directory first
      const cardDir = `${boardId}/${id}`;
      await fileSystemService.createDirectory(cardDir);

      // Create card.json file
      const cardPath = `${cardDir}/card.json`;
      await fileSystemService.writeFile(cardPath, JSON.stringify(newCard, null, 2));

      // Create descriptions directory
      const descriptionsDir = `${cardDir}/descriptions`;
      await fileSystemService.createDirectory(descriptionsDir);

      return {
        id,
        card: newCard,
        path: cardPath,
      };
    } catch (error) {
      console.error('Error creating card:', error);
      throw new CardServiceError('Failed to create card');
    }
  },

  async getCards(boardId: string): Promise<CardFolder[]> {
    try {
      // List all directories in the board directory
      const boardDir = boardId;
      const cardDirs = await fileSystemService.listDirectory(boardDir);
      const cards: CardFolder[] = [];

      for (const cardDir of cardDirs) {
        // Skip board.json and other non-card directories
        if (cardDir === 'board.json' || !cardDir.match(/^\d+$/)) {
          continue;
        }

        const cardPath = `${boardDir}/${cardDir}/card.json`;
        if (await fileSystemService.fileExists(cardPath)) {
          try {
            const cardContent = await fileSystemService.readFile(cardPath);
            const card = JSON.parse(cardContent.trim());
            cards.push({
              id: card.id,
              card,
              path: cardPath,
            });
          } catch (error) {
            console.error(`Failed to parse card JSON in ${cardPath}:`, error);
            // Skip invalid cards instead of failing the entire request
            continue;
          }
        }
      }

      return cards;
    } catch (error) {
      console.error('Error in getCards:', error);
      throw new CardServiceError('Failed to get cards');
    }
  },

  async updateCard(boardId: string, cardId: string, updates: Partial<Card>): Promise<CardFolder> {
    try {
      const cardPath = `${boardId}/${cardId}/card.json`;
      if (!await fileSystemService.fileExists(cardPath)) {
        throw new CardServiceError(`Card not found: ${cardId}`);
      }

      const cardContent = await fileSystemService.readFile(cardPath);
      const card = JSON.parse(cardContent.trim());
      const updatedCard = {
        ...card,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await fileSystemService.writeFile(cardPath, JSON.stringify(updatedCard, null, 2));

      return {
        id: cardId,
        card: updatedCard,
        path: cardPath,
      };
    } catch (error) {
      throw new CardServiceError('Failed to update card');
    }
  },

  async getDescriptions(boardId: string, cardId: string): Promise<Description[]> {
    try {
      const descriptionsDir = `${boardId}/${cardId}/descriptions`;
      if (!await fileSystemService.directoryExists(descriptionsDir)) {
        return [];
      }

      // Get the list of description files
      const descriptionFiles = await this.getDescriptionFiles(boardId, cardId);
      
      // Load each description file
      const descriptions: Description[] = [];
      for (const fileName of descriptionFiles) {
        try {
          const descriptionPath = `${descriptionsDir}/${fileName}`;
          const content = await fileSystemService.readFile(descriptionPath);
          
          // Parse YAML frontmatter
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
          let frontmatter: Partial<DescriptionFrontmatter> = {};
          let markdownContent = content;
          
          if (frontmatterMatch) {
            frontmatter = yaml.load(frontmatterMatch[1]) as Partial<DescriptionFrontmatter>;
            markdownContent = content.slice(frontmatterMatch[0].length);
          }
          
          const description: Description = {
            id: frontmatter.id || fileName,
            content: markdownContent,
            title: frontmatter.title || '',
            tags: frontmatter.tags || [],
            createdAt: frontmatter.createdAt || new Date().toISOString(),
            updatedAt: frontmatter.updatedAt || new Date().toISOString()
          };
          
          descriptions.push(description);
        } catch (error) {
          console.warn(`Error loading description file: ${fileName}`, error);
        }
      }

      return descriptions;
    } catch (error) {
      console.error('Error getting descriptions:', error);
      return [];
    }
  },

  async getDescriptionFiles(boardId: string, cardId: string): Promise<string[]> {
    try {
      const descriptionsDir = `${boardId}/${cardId}/descriptions`;
      const descriptionsJsonPath = `${descriptionsDir}/descriptions.json`;
      
      try {
        const content = await fileSystemService.readFile(descriptionsJsonPath);
        return JSON.parse(content.trim());
      } catch (error) {
        // If the file doesn't exist, create it with an empty array
        await fileSystemService.writeFile(descriptionsJsonPath, JSON.stringify([], null, 2));
        return [];
      }
    } catch (error) {
      console.error('Error getting description files:', error);
      return [];
    }
  },

  async addDescription(boardId: string, cardId: string, description: string, title: string = '', tags: string[] = []): Promise<CardFolder> {
    try {
      const descriptionsDir = `${boardId}/${cardId}/descriptions`;
      if (!await fileSystemService.directoryExists(descriptionsDir)) {
        await fileSystemService.createDirectory(descriptionsDir);
      }

      // Get existing description files
      const descriptionFiles = await this.getDescriptionFiles(boardId, cardId);
      const nextNumber = descriptionFiles.length + 1;
      const newFileName = `description_${nextNumber}.md`;
      const id = nextNumber.toString();
      
      // Create the YAML frontmatter
      const frontmatter = {
        id,
        title,
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Create the markdown content with YAML frontmatter
      const content = `---
${yaml.dump(frontmatter)}---
${description}`;
      
      // Add the new file to the list
      descriptionFiles.push(newFileName);
      const descriptionsJsonPath = `${descriptionsDir}/descriptions.json`;
      await fileSystemService.writeFile(descriptionsJsonPath, JSON.stringify(descriptionFiles, null, 2));

      // Create the new description file with the content
      const descriptionPath = `${descriptionsDir}/${newFileName}`;
      await fileSystemService.writeFile(descriptionPath, content);

      // Update card's updatedAt
      const cardPath = `${boardId}/${cardId}/card.json`;
      const cardContent = await fileSystemService.readFile(cardPath);
      const card = JSON.parse(cardContent.trim());
      const updatedCard = {
        ...card,
        updatedAt: new Date().toISOString(),
      };

      await fileSystemService.writeFile(cardPath, JSON.stringify(updatedCard, null, 2));

      return {
        id: cardId,
        card: updatedCard,
        path: cardPath,
      };
    } catch (error) {
      console.error('Error adding description:', error);
      throw new CardServiceError('Failed to add description');
    }
  },

  async deleteDescription(boardId: string, cardId: string, descriptionIndex: number): Promise<CardFolder> {
    try {
      const descriptionsDir = `${boardId}/${cardId}/descriptions`;
      
      // Get the list of description files
      const descriptionFiles = await this.getDescriptionFiles(boardId, cardId);
      
      if (descriptionIndex < 0 || descriptionIndex >= descriptionFiles.length) {
        throw new CardServiceError(`Invalid description index: ${descriptionIndex}`);
      }

      const fileName = descriptionFiles[descriptionIndex];
      const descriptionPath = `${descriptionsDir}/${fileName}`;

      try {
        await fileSystemService.deleteFile(descriptionPath);
        
        // Remove the file from the list
        descriptionFiles.splice(descriptionIndex, 1);
        const descriptionsJsonPath = `${descriptionsDir}/descriptions.json`;
        await fileSystemService.writeFile(descriptionsJsonPath, JSON.stringify(descriptionFiles, null, 2));
      } catch (error) {
        console.warn(`Error deleting description file: ${descriptionPath}`, error);
      }

      // Update card's updatedAt
      const cardPath = `${boardId}/${cardId}/card.json`;
      const cardContent = await fileSystemService.readFile(cardPath);
      const card = JSON.parse(cardContent.trim());
      const updatedCard = {
        ...card,
        updatedAt: new Date().toISOString(),
      };

      await fileSystemService.writeFile(cardPath, JSON.stringify(updatedCard, null, 2));

      return {
        id: cardId,
        card: updatedCard,
        path: cardPath,
      };
    } catch (error) {
      console.error('Error deleting description:', error);
      throw new CardServiceError('Failed to delete description');
    }
  },

  async deleteCard(boardId: string, cardId: string): Promise<void> {
    try {
      const cardDir = `${boardId}/${cardId}`;
      
      // Delete the descriptions directory and its contents
      const descriptionsDir = `${cardDir}/descriptions`;
      if (await fileSystemService.directoryExists(descriptionsDir)) {
        const descriptionFiles = await this.getDescriptionFiles(boardId, cardId);
        for (const fileName of descriptionFiles) {
          const descriptionPath = `${descriptionsDir}/${fileName}`;
          try {
            await fileSystemService.deleteFile(descriptionPath);
          } catch (error) {
            console.warn(`Error deleting description file: ${descriptionPath}`, error);
          }
        }
        
        // Delete the descriptions.json file
        try {
          await fileSystemService.deleteFile(`${descriptionsDir}/descriptions.json`);
        } catch (error) {
          console.warn('Error deleting descriptions.json:', error);
        }
        
        // Delete the descriptions directory
        try {
          await fileSystemService.deleteDirectory(descriptionsDir);
        } catch (error) {
          console.warn('Error deleting descriptions directory:', error);
        }
      }
      
      // Delete the card.json file
      const cardPath = `${cardDir}/card.json`;
      if (await fileSystemService.fileExists(cardPath)) {
        await fileSystemService.deleteFile(cardPath);
      }
      
      // Delete the card directory
      try {
        await fileSystemService.deleteDirectory(cardDir);
      } catch (error) {
        console.warn('Error deleting card directory:', error);
      }

      // Remove the card from metadata.json
      const metadataPath = `${boardId}/metadata.json`;
      if (await fileSystemService.fileExists(metadataPath)) {
        try {
          const metadataContent = await fileSystemService.readFile(metadataPath);
          const metadata = JSON.parse(metadataContent);
          if (metadata.cards && metadata.cards[cardId]) {
            delete metadata.cards[cardId];
            await fileSystemService.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
          }
        } catch (error) {
          console.warn('Error updating metadata.json:', error);
        }
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      throw new CardServiceError('Failed to delete card');
    }
  },

  async updateDescription(boardId: string, cardId: string, descriptionId: string, updates: { content?: string; title?: string; tags?: string[] }): Promise<CardFolder> {
    try {
      const descriptionsDir = `${boardId}/${cardId}/descriptions`;
      const descriptionPath = `${descriptionsDir}/description_${descriptionId}.md`;
      
      if (!await fileSystemService.fileExists(descriptionPath)) {
        throw new CardServiceError(`Description not found: description_${descriptionId}.md`);
      }

      // Read the current description content
      const currentContent = await fileSystemService.readFile(descriptionPath);
      
      // Parse the current frontmatter
      const frontmatterMatch = currentContent.match(/^---\n([\s\S]*?)\n---\n/);
      let frontmatter: Partial<DescriptionFrontmatter> = {};
      let currentMarkdownContent = currentContent;
      
      if (frontmatterMatch) {
        frontmatter = yaml.load(frontmatterMatch[1]) as Partial<DescriptionFrontmatter>;
        currentMarkdownContent = currentContent.slice(frontmatterMatch[0].length);
      }

      // Update the frontmatter with new values
      const updatedFrontmatter = {
        id: frontmatter.id || descriptionId,
        title: updates.title ?? frontmatter.title ?? '',
        tags: updates.tags ?? frontmatter.tags ?? [],
        createdAt: frontmatter.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create the new content with updated frontmatter
      const newContent = `---
${yaml.dump(updatedFrontmatter)}---
${updates.content ?? currentMarkdownContent}`;

      // Write the updated content back to the file
      await fileSystemService.writeFile(descriptionPath, newContent);

      // Update card's updatedAt
      const cardPath = `${boardId}/${cardId}/card.json`;
      const cardContent = await fileSystemService.readFile(cardPath);
      const card = JSON.parse(cardContent.trim());
      const updatedCard = {
        ...card,
        updatedAt: new Date().toISOString(),
      };

      await fileSystemService.writeFile(cardPath, JSON.stringify(updatedCard, null, 2));

      return {
        id: cardId,
        card: updatedCard,
        path: cardPath,
      };
    } catch (error) {
      console.error('Error updating description:', error);
      throw new CardServiceError('Failed to update description');
    }
  }
};
