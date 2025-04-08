import { Card, CardFolder, CardStatus } from '../types';
import { fileSystemService } from './fileSystemService';

export class CardServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CardServiceError';
  }
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

      const cardPath = `${boardId}/${id}/card.json`;
      await fileSystemService.writeFile(cardPath, JSON.stringify(newCard, null, 2));

      return {
        id,
        card: newCard,
        path: cardPath,
      };
    } catch (error) {
      throw new CardServiceError('Failed to create card');
    }
  },

  async getCards(boardId: string): Promise<CardFolder[]> {
    try {
      const cardDirs = await fileSystemService.listDirectory(boardId);
      const cards: CardFolder[] = [];

      for (const cardDir of cardDirs) {
        const cardPath = `${boardId}/${cardDir}/card.json`;
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

  async addDescription(boardId: string, cardId: string, description: string): Promise<CardFolder> {
    try {
      const cardPath = `${boardId}/${cardId}/card.json`;
      if (!await fileSystemService.fileExists(cardPath)) {
        throw new CardServiceError(`Card not found: ${cardId}`);
      }

      const cardContent = await fileSystemService.readFile(cardPath);
      const card = JSON.parse(cardContent.trim());
      const updatedCard = {
        ...card,
        descriptions: [...(card.descriptions || []), description],
        updatedAt: new Date().toISOString(),
      };

      await fileSystemService.writeFile(cardPath, JSON.stringify(updatedCard, null, 2));

      return {
        id: cardId,
        card: updatedCard,
        path: cardPath,
      };
    } catch (error) {
      throw new CardServiceError('Failed to add description');
    }
  },

  async deleteCard(boardId: string, cardId: string): Promise<void> {
    try {
      const cardPath = `${boardId}/${cardId}/card.json`;
      if (await fileSystemService.fileExists(cardPath)) {
        await fileSystemService.deleteFile(cardPath);
      }
    } catch (error) {
      throw new CardServiceError('Failed to delete card');
    }
  }
};
