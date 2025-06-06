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
app.use(express.text({ type: 'text/*' }));

// File system operations
app.get('/boards/*', async (req, res) => {
  try {
    const filePath = req.path.replace('/boards/', '');
    const fullPath = path.join(process.cwd(), 'public/boards', filePath);
    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      const files = await fs.readdir(fullPath, { withFileTypes: true });
      const items = files
        .filter(dirent => !dirent.name.startsWith('.') && dirent.name !== '__MACOSX')
        .map(dirent => dirent.name);
      res.json({ files: items });
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
    
    // Handle content based on file extension
    let content: string;
    if (filePath.endsWith('.json')) {
      // For JSON files, ensure proper formatting
      if (typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          content = JSON.stringify(parsed, null, 2);
        } catch {
          content = req.body;
        }
      } else {
        content = JSON.stringify(req.body, null, 2);
      }
    } else {
      // For non-JSON files (like .md), use the raw body
      content = req.body;
    }
    
    await fs.writeFile(fullPath, content);
    res.status(200).json({ message: 'File written successfully' });
  } catch (error) {
    console.error('Error writing file:', error);
    res.status(500).json({ error: 'Failed to write file' });
  }
});

app.delete('/boards/*', async (req, res) => {
  try {
    const filePath = req.path.replace('/boards/', '');
    const fullPath = path.join(process.cwd(), 'public/boards', filePath);
    
    try {
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        await fs.rm(fullPath, { recursive: true, force: true });
      } else {
        await fs.unlink(fullPath);
      }
      res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
      // If the file doesn't exist, consider it already deleted
      res.status(200).json({ message: 'File already deleted' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.head('/boards/*', async (req, res) => {
  try {
    const filePath = req.path.replace('/boards/', '');
    const fullPath = path.join(process.cwd(), 'public/boards', filePath);
    const stats = await fs.stat(fullPath);
    res.status(200).end();
  } catch (error) {
    res.status(404).end();
  }
});

// Directory operations
app.post('/boards/*/mkdir', async (req, res) => {
  try {
    const dirPath = req.path.replace('/boards/', '').replace('/mkdir', '');
    const fullPath = path.join(process.cwd(), 'public/boards', dirPath);
    await fs.mkdir(fullPath, { recursive: true });
    res.status(200).json({ message: 'Directory created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create directory' });
  }
});

app.delete('/boards/*/rmdir', async (req, res) => {
  try {
    const dirPath = req.path.replace('/boards/', '').replace('/rmdir', '');
    const fullPath = path.join(process.cwd(), 'public/boards', dirPath);
    await fs.rm(fullPath, { recursive: true, force: true });
    res.status(200).json({ message: 'Directory deleted successfully' });
  } catch (error) {
    console.error('Error deleting directory:', error);
    res.status(500).json({ error: 'Failed to delete directory' });
  }
});

app.get('/boards/*/ls', async (req, res) => {
  try {
    const dirPath = req.path.replace('/boards/', '').replace('/ls', '');
    const fullPath = path.join(process.cwd(), 'public/boards', dirPath);
    const files = await fs.readdir(fullPath);
    res.json({ files });
  } catch (error) {
    res.status(404).json({ error: 'Directory not found' });
  }
});

app.head('/boards/*/exists', async (req, res) => {
  try {
    const dirPath = req.path.replace('/boards/', '').replace('/exists', '');
    const fullPath = path.join(process.cwd(), 'public/boards', dirPath);
    const stats = await fs.stat(fullPath);
    res.status(stats.isDirectory() ? 200 : 404).end();
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
