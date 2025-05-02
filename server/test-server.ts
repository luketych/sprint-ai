import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import cors from 'cors';

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Force JSON content type for all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  console.log(`[${req.method}] ${req.path}`);
  next();
});

// Simple test route
app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({
    message: 'Test endpoint working',
    time: new Date().toISOString()
  });
});

// List boards route
app.get('/api/boards', async (req, res) => {
  try {
    const boardsPath = path.join(process.cwd(), 'public', 'boards');
    console.log('Reading boards from:', boardsPath);
    
    const files = await fs.readdir(boardsPath, { withFileTypes: true });
    const boards = files
      .filter(f => !f.name.startsWith('.'))
      .map(f => ({
        name: f.name,
        type: f.isDirectory() ? 'directory' : 'file'
      }));
      
    console.log('Found boards:', boards);
    res.json({ files: boards });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: err.message });
});

// Start server
const port = 3001;
app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
  console.log('Available routes:');
  console.log('- GET /test');
  console.log('- GET /api/boards');
});
