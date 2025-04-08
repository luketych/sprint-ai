import { Board, CardFolder } from '../types';
import { cardService } from './cardService';
import { fileSystemService } from './fileSystemService';
import { generateTestCards } from '../utils/testData';

export const boardService = {
  async getBoards(): Promise<Board[]> {
    try {
      const boardDirs = await fileSystemService.listDirectory('');
      const boards: Board[] = [];

      for (const boardDir of boardDirs) {
        try {
          const boardConfigPath = `${boardDir}/board.json`;
          if (await fileSystemService.fileExists(boardConfigPath)) {
            const boardContent = await fileSystemService.readFile(boardConfigPath);
            const boardConfig = JSON.parse(boardContent);
            const cards = await cardService.getCards(boardDir);
            
            boards.push({
              id: boardDir,
              name: boardConfig.name,
              repoUrl: boardConfig.repoUrl,
              cards,
            });
          }
        } catch (error) {
          console.error(`Error loading board ${boardDir}:`, error);
          // Continue loading other boards even if one fails
        }
      }

      return boards;
    } catch (error) {
      console.error('Failed to get boards:', error);
      return [];
    }
  },

  async getBoard(id: string): Promise<Board> {
    try {
      const boardConfigPath = `${id}/board.json`;
      if (!await fileSystemService.fileExists(boardConfigPath)) {
        throw new Error(`Board not found: ${id}`);
      }

      const boardContent = await fileSystemService.readFile(boardConfigPath);
      const boardConfig = JSON.parse(boardContent);
      const cards = await cardService.getCards(id);

      return {
        id,
        name: boardConfig.name,
        repoUrl: boardConfig.repoUrl,
        cards,
      };
    } catch (error) {
      throw new Error(`Failed to get board: ${id}`);
    }
  },

  async createBoard(name: string, repoUrl: string): Promise<Board> {
    try {
      const id = name.toLowerCase().replace(/\s+/g, '-');
      const boardConfig = {
        id,
        name,
        repoUrl,
        cards: []
      };

      await fileSystemService.writeFile(`${id}/board.json`, JSON.stringify(boardConfig, null, 2));

      return {
        id,
        name,
        repoUrl,
        cards: [],
      };
    } catch (error) {
      throw new Error('Failed to create board');
    }
  },

  async getSampleBoard(): Promise<Board> {
    try {
      const boards = await this.getBoards();
      const sampleBoard = boards.find(board => board.name === 'Sample Board');
      
      if (sampleBoard) {
        return sampleBoard;
      }

      // Create sample board if it doesn't exist
      const newSampleBoard = await this.createBoard('Sample Board', 'https://github.com/microsoft/vscode');

      // Generate and add sample cards
      const testCards = generateTestCards(10);
      const cardFolders = await Promise.all(
        testCards.map(card => cardService.createCard(newSampleBoard.id, card))
      );

      // Update board with new cards
      const updatedBoard = {
        ...newSampleBoard,
        cards: cardFolders
      };

      // Update board.json with cards
      await this.updateBoard(updatedBoard);

      return updatedBoard;
    } catch (error) {
      throw new Error('Failed to get sample board');
    }
  },

  async updateBoard(board: Board): Promise<void> {
    try {
      const boardConfig = {
        id: board.id,
        name: board.name,
        repoUrl: board.repoUrl,
        cards: board.cards
      };

      await fileSystemService.writeFile(`${board.id}/board.json`, JSON.stringify(boardConfig, null, 2));
    } catch (error) {
      throw new Error('Failed to update board');
    }
  }
};
