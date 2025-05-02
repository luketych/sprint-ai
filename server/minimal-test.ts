import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const app = express();

app.get('/test', (_req, res) => {
  console.log('Test endpoint hit');
  res
    .status(200)
    .setHeader('Content-Type', 'application/json')
    .json({
      message: 'Test endpoint working',
      time: new Date().toISOString()
    });
});

app.get('/boards', async (_req, res) => {
  try {
    const boardsPath = path.join(process.cwd(), 'public/boards');
    console.log('Reading:', boardsPath);
    
    const files = await fs.readdir(boardsPath, { withFileTypes: true });
    const boards = files
      .filter(f => !f.name.startsWith('.'))
      .map(f => ({
        name: f.name,
        type: f.isDirectory() ? 'directory' : 'file'
      }));

    console.log('Found:', boards);
    res
      .status(200)
      .setHeader('Content-Type', 'application/json')
      .json({ files: boards });
  } catch (err) {
    console.error('Error:', err);
    res
      .status(500)
      .setHeader('Content-Type', 'application/json')
      .json({ error: String(err) });
  }
});

const port = 3456;
const server = app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
  console.log('Try:');
  console.log(`  curl http://localhost:${port}/test`);
  console.log(`  curl http://localhost:${port}/boards`);
});
