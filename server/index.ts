import express from 'express';
import cors from 'cors';
import { cardService } from '../src/services/cardService';
import { Card, CardStatus } from '../src/types';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// File system operations
app.get('/boards/*', async (req, res) => {
  try {
    const filePath = req.path.replace('/boards/', '');
    const fullPath = path.join(process.cwd(), 'public/boards', filePath);
    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      const files = await fs.readdir(fullPath, { withFileTypes: true });
      const dirs = files
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      res.json({ files: dirs });
    } else {
      const content = await fs.readFile(fullPath, 'utf-8');
      res.send(content);
    }
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

app.put('/boards/*', async (req, res) => {
  try {
    const filePath = req.path.replace('/boards/', '');
    const fullPath = path.join(process.cwd(), 'public/boards', filePath);
    const dirPath = path.dirname(fullPath);
    await fs.mkdir(dirPath, { recursive: true });
    
    // Ensure the content is properly formatted JSON
    let content: string;
    if (typeof req.body === 'string') {
      try {
        // If it's already a string, try to parse and re-stringify to ensure it's valid JSON
        const parsed = JSON.parse(req.body);
        content = JSON.stringify(parsed, null, 2);
      } catch {
        // If parsing fails, use the string as-is
        content = req.body;
      }
    } else {
      content = JSON.stringify(req.body, null, 2);
    }
    
    await fs.writeFile(fullPath, content);
    res.status(200).json({ message: 'File written successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to write file' });
  }
});

app.delete('/boards/*', async (req, res) => {
  try {
    const filePath = req.path.replace('/boards/', '');
    const fullPath = path.join(process.cwd(), 'public/boards', filePath);
    await fs.unlink(fullPath);
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.head('/boards/*', async (req, res) => {
  try {
    const filePath = req.path.replace('/boards/', '');
    const fullPath = path.join(process.cwd(), 'public/boards', filePath);
    await fs.access(fullPath);
    res.status(200).end();
  } catch (error) {
    res.status(404).end();
  }
});

// Get all cards
app.get('/api/cards', async (req, res) => {
  try {
    const boardId = req.query.boardId as string;
    const cards = await cardService.getCards(boardId);
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// Create a new card
app.post('/api/cards', async (req, res) => {
  try {
    const { boardId, card } = req.body;
    const newCard = await cardService.createCard(boardId, card);
    res.status(201).json(newCard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create card' });
  }
});

// Update a card
app.put('/api/cards/:id', async (req, res) => {
  try {
    const { boardId, updates } = req.body;
    const card = await cardService.updateCard(boardId, req.params.id, updates);
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update card' });
  }
});

// Add a description to a card
app.post('/api/cards/:id/descriptions', async (req, res) => {
  try {
    const { boardId, description } = req.body;
    await cardService.addDescription(boardId, req.params.id, description);
    res.status(201).json({ message: 'Description added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add description' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
