import express from 'express';
import fsPromises from 'fs/promises';
import fs from 'fs';
import path from 'path';
import Busboy from 'busboy';

const router = express.Router();

interface UploadedFile {
  filename: string;
  filepath: string;
  mimetype: string;
  size: number;
}

interface FileUploadRequest extends express.Request {
  files?: {
    [fieldname: string]: UploadedFile[];
  };
}


// Ensure required directories exist
const ensureDirectories = async () => {
  const uploadsPath = path.join(process.cwd(), 'uploads');
  try {
    await fsPromises.mkdir(uploadsPath, { recursive: true });
    console.log('Uploads directory ready:', uploadsPath);
  } catch (err) {
    console.error('Error creating uploads directory:', err);
  }
};

// Initialize directories
ensureDirectories();

// Create directory route - must be before the file upload handler
router.post('/:boardId/*/mkdir', async (req, res) => {
  try {
    const { boardId } = req.params;
    const subPath = req.params[0];
    
    if (!boardId || !subPath) {
      res.status(400).json({ error: 'Invalid path parameters' });
      return;
    }

    // Remove /mkdir from the end of subPath if present
    const cleanSubPath = subPath.replace(/\/mkdir$/, '');

    let targetPath;
    if (boardId === 'uploads') {
      // Special handling for uploads directory
      targetPath = path.join(process.cwd(), 'public', 'uploads', cleanSubPath);
      
      // Additional security check for uploads
      const resolvedPath = path.resolve(targetPath);
      const uploadsRoot = path.resolve(path.join(process.cwd(), 'public', 'uploads'));
      if (!resolvedPath.startsWith(uploadsRoot)) {
        res.status(403).json({ error: 'Invalid upload path' });
        return;
      }
    } else {
      // Regular board directory
      targetPath = path.join(process.cwd(), 'public', 'boards', boardId, cleanSubPath);
    }

    // Create directory (and parent directories if needed)
    await fsPromises.mkdir(targetPath, { recursive: true });
    console.log('Created directory:', targetPath);

    res.json({
      message: 'Directory created',
      path: path.relative(path.join(process.cwd(), 'public'), targetPath)
    });

  } catch (err) {
    console.error('Error creating directory:', err);
    res.status(500).json({ error: 'Failed to create directory' });
  }
});

// Handle file uploads - after mkdir route
router.post('/uploads/*', async (req: FileUploadRequest, res) => {
  const files: { [fieldname: string]: UploadedFile[] } = {};
  const uploadPath = path.join(process.cwd(), 'public', 'uploads', req.params[0]);
  
  try {
    // Create upload directory
    await fsPromises.mkdir(uploadPath, { recursive: true });

    // Security check for path traversal
    const resolvedPath = path.resolve(uploadPath);
    const uploadsRoot = path.resolve(path.join(process.cwd(), 'public', 'uploads'));
    if (!resolvedPath.startsWith(uploadsRoot)) {
      res.status(403).json({ error: 'Invalid upload path' });
      return;
    }

    const busboy = Busboy({ 
      headers: req.headers,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 2 // Max number of files
      }
    });

    const uploadPromise = new Promise((resolve, reject) => {
      busboy.on('file', async (fieldname: string, file: NodeJS.ReadableStream, info: { filename: string; mimeType: string }) => {
        if (!info.mimeType.startsWith('image/')) {
          reject(new Error('Only image files are allowed'));
          return;
        }

        const filepath = path.join(uploadPath, info.filename);
        try {
          const writeStream = fs.createWriteStream(filepath);
          file.pipe(writeStream);

          let size = 0;
          file.on('data', (data) => {
            size += data.length;
          });

          file.on('end', () => {
            if (!files[fieldname]) {
              files[fieldname] = [];
            }
            files[fieldname].push({
              filename: info.filename,
              filepath,
              mimetype: info.mimeType,
              size
            });
          });
        } catch (err) {
          reject(err);
        }
      });

      busboy.on('finish', () => {
        resolve(files);
      });

      busboy.on('error', (err) => {
        reject(err);
      });
    });

    req.pipe(busboy);
    await uploadPromise;

    const image = files['image']?.[0];
    const thumbnail = files['thumbnail']?.[0];

    if (!image || !thumbnail) {
      res.status(400).json({ error: 'Both image and thumbnail are required' });
      return;
    }

    res.json({
      message: 'Files uploaded successfully',
      image: `/uploads/${req.params[0]}/${image.filename}`,
      thumbnail: `/uploads/${req.params[0]}/${thumbnail.filename}`
    });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// List directory contents
const listDir = async (dirPath: string) => {
  const files = await fsPromises.readdir(dirPath, { withFileTypes: true });
  return {
    files: files
      .filter(f => !f.name.startsWith('.'))
      .map(f => ({
        name: f.name,
        type: f.isDirectory() ? 'directory' : 'file'
      }))
  };
};

// List all boards (root path)
router.get('/', async (req, res) => {
  try {
    console.log('Listing all boards');
    const boardsPath = path.join(process.cwd(), 'public', 'boards');
    const result = await listDir(boardsPath);
    res.json(result);
  } catch (err) {
    console.error('Error listing boards:', err);
    res.status(500).json({ error: 'Failed to list boards' });
  }
});

// Route for board root requests (no subpath)
router.get('/:boardId', async (req, res) => {
  try {
    const { boardId } = req.params;
    const boardPath = path.join(process.cwd(), 'public', 'boards', boardId);
    
    try {
      const stats = await fsPromises.stat(boardPath);
      if (!stats.isDirectory()) {
        throw new Error('Not a directory');
      }
      
      const entries = await fsPromises.readdir(boardPath, { withFileTypes: true });
      const dirs = entries
        .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
        .map(entry => ({
          name: entry.name,
          type: 'directory'
        }));
      res.json({ files: dirs });
    } catch (err) {
      console.error('Board directory not found:', boardPath);
      res.status(404).json({ error: 'Board not found' });
    }
  } catch (err) {
    console.error('Error accessing board:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET and HEAD requests for board subdirectories and files
router.all('/:boardId/*', async (req, res, next) => {
  // Skip if it's a mkdir request
  if (req.path.endsWith('/mkdir')) {
    return next();
  }

  try {
    const { boardId } = req.params;
    const subPath = req.params[0] || '';
    const fullPath = path.join(process.cwd(), 'public', 'boards', boardId, subPath);
    const boardPath = path.join(process.cwd(), 'public', 'boards', boardId);

    // Log the paths we're working with
    console.log('Full path:', fullPath);
    console.log('Board path:', boardPath);
    
    console.log('Accessing path:', fullPath);
    
    // Check if the board directory exists
    try {
      await fsPromises.stat(boardPath);
    } catch (err) {
      console.error('Board directory not found:', boardPath);
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    // Handle board directory request
    if (fullPath === boardPath || subPath === '') {
      const entries = await fsPromises.readdir(boardPath, { withFileTypes: true });
      const dirs = entries
        .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
        .map(entry => ({
          name: entry.name,
          type: 'directory'
        }));
      res.json({ files: dirs });
      return;
    }

    // Handle other directories and files
    const stats = await fsPromises.stat(fullPath);
    if (stats.isDirectory()) {
      const result = await listDir(fullPath);
      res.json(result);
    } else {
      if (req.method === 'HEAD') {
        res.sendStatus(200);
      } else {
        // Determine if file is in uploads directory
        const isUploadPath = fullPath.includes('/uploads/');
        if (isUploadPath) {
          // Send file directly for uploads
          try {
            const ext = path.extname(fullPath).toLowerCase();
            let contentType = 'application/octet-stream';

            // Set content type based on file extension
            if (ext === '.json') contentType = 'application/json';
            else if (ext === '.txt') contentType = 'text/plain';
            else if (ext === '.md') contentType = 'text/markdown';

            // Add security headers
            res.setHeader('Content-Type', contentType);
            res.setHeader('X-Content-Type-Options', 'nosniff');
            
            res.sendFile(fullPath);
          } catch (err) {
            console.error('Error sending file:', err);
            res.status(500).json({ error: 'Failed to send file' });
          }
        } else {
          // Handle JSON and other text files
          try {
            const content = await fsPromises.readFile(fullPath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.json({ content });
          } catch (err) {
            console.error('Error reading file:', err);
            res.status(500).json({ error: 'Failed to read file' });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error accessing path:', err);
    res.status(404).json({ error: 'Not found' });
  }
});


// Write file
router.put('/:boardId/*', async (req, res) => {
  try {
    const { boardId } = req.params;
    const subPath = req.params[0];
    const fullPath = path.join(process.cwd(), 'public', 'boards', boardId, subPath);
    
    await fsPromises.mkdir(path.dirname(fullPath), { recursive: true });
    const content = typeof req.body === 'object' ? JSON.stringify(req.body, null, 2) : req.body;
    await fsPromises.writeFile(fullPath, content);
    
    res.json({ message: 'File written' });
  } catch (err) {
    console.error('Error writing file:', err);
    res.status(500).json({ error: 'Failed to write file' });
  }
});

export default router;
