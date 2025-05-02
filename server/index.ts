import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import apiRouter from './api-router';
import multer, { File } from 'multer';
import { v4 as uuidv4 } from 'uuid';

// --- Declaration Merging for Express Request --- 
declare global {
  namespace Express {
    interface Request {
      files?: File[] | { [fieldname: string]: File[] }; // Add files property for multer
    }
  }
}
// --- End Declaration Merging ---

interface FileUpload {
  mv: (path: string) => Promise<void>;
}

const app = express();
const port = 3456;

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure required directories exist
const ensureDirectories = async () => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    console.log('Public uploads directory ready:', UPLOADS_DIR);
  } catch (err) {
    console.error('Error creating public uploads directory:', err);
  }
};

// Utility to list directory contents with file type
const listUploadDir = async (dirPath: string) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return {
      files: entries
        .filter(entry => !entry.name.startsWith('.'))
        .map(entry => ({
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file'
        }))
    };
  } catch (err) {
    console.error('Error listing directory:', err);
    return { files: [] };
  }
};

// Basic middleware
app.use(cors());
app.use(express.json()); // For parsing application/json
// // Add middleware for parsing raw application/octet-stream bodies (Commented out as we'll use multer)
// app.use('/api/uploads', express.raw({ type: 'application/octet-stream', limit: '10mb' }));

// Serve uploads directory statically with CORS
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(process.cwd(), 'public', 'uploads')));

// Handle directory listings for uploads
app.get('/uploads/*', async (req, res) => {
  try {
    const requestedPath = req.params[0] || '';
    const absolutePath = path.join(process.cwd(), 'public', 'uploads', requestedPath);
    
    // Check if path exists
    try {
      const stats = await fs.stat(absolutePath);
      if (stats.isDirectory()) {
        // If it's a directory, return listing
        const listing = await listUploadDir(absolutePath);
        res.json(listing);
      } else {
        // If it's a file, serve it
        res.sendFile(absolutePath);
      }
    } catch (err) {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Request logging
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api', (req, res, next) => {
  console.log('API Request:', req.method, req.url);
  next();
});

app.get('/api', (req, res) => {
  res.json({
    message: 'API is running',
    endpoints: ['/api/boards']
  });
});

// Endpoint to list images for a specific card
app.get('/api/boards/:boardId/cards/:cardId/images', async (req, res) => {
  const { boardId, cardId } = req.params;
  const cardUploadsPath = path.join(UPLOADS_DIR, boardId, cardId);
  console.log(`[IMG LIST] Attempting to list images for path: ${cardUploadsPath}`); // Log path

  try {
    // Check if directory exists
    await fs.access(cardUploadsPath);
    console.log(`[IMG LIST] Directory exists: ${cardUploadsPath}`); // Log success

    // Read directory contents
    const files = await fs.readdir(cardUploadsPath);
    console.log(`[IMG LIST] Found files in directory: ${files}`); // Log files found

    // Filter for image files (simple check based on common extensions)
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
    console.log(`[IMG LIST] Filtered image files: ${imageFiles}`); // Log filtered files

    // Map filenames to full public URLs
    const imageUrls = imageFiles.map(file => `/uploads/${boardId}/${cardId}/${file}`);
    console.log(`[IMG LIST] Mapped image URLs: ${imageUrls}`); // Log mapped URLs

    res.json(imageUrls);
  } catch (error: any) { // Added ': any' to handle potential error types
    console.error(`[IMG LIST] Error listing images for path ${cardUploadsPath}:`, error); // Log error
    if (error.code === 'ENOENT') {
      // Directory doesn't exist, return empty array
      res.json([]);
    } else {
      console.error(`Error listing images for ${boardId}/${cardId}:`, error);
      res.status(500).json({ error: 'Failed to list images' });
    }
  }
});

// *** NEW: Handler for Multer image uploads ***
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { boardId, cardId } = req.params;
    if (!boardId || !cardId) {
      console.error('[Multer Dest] Missing boardId or cardId in request params');
      return cb(new Error('Missing boardId or cardId'), '');
    }
    const destinationPath = path.join(UPLOADS_DIR, boardId, cardId);
    console.log(`[Multer Dest] Ensuring directory exists: ${destinationPath}`);
    // Ensure the destination directory exists
    fs.mkdir(destinationPath, { recursive: true })
      .then(() => {
        console.log(`[Multer Dest] Directory ready, saving to: ${destinationPath}`);
        cb(null, destinationPath);
      })
      .catch(err => {
        console.error(`[Multer Dest] Error creating directory ${destinationPath}:`, err);
        cb(err, '');
      });
  },
  filename: function (req, file, cb) {
    // Generate unique filename: uuid + original extension
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension)
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size (e.g., 10MB)
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

app.post('/api/boards/:boardId/cards/:cardId/upload-images', upload.array('images', 10), (req: Request, res: Response) => { 
  const files = req.files;
  const { boardId, cardId } = req.params; // Get params for response path

  if (!files || !Array.isArray(files) || files.length === 0) { 
    return res.status(400).json({ error: 'No files were uploaded or files property is not an array.' });
  }

  // Files have been successfully saved by multer at this point
  // Construct the full relative path including board/card IDs
  const uploadedFilePaths = files.map(file => `/uploads/${boardId}/${cardId}/${file.filename}`);

  console.log('Uploaded files:', files.map(f => f.filename));
  console.log('Response paths:', uploadedFilePaths);

  res.status(201).json({ 
    message: `${files.length} image(s) uploaded successfully`, 
    paths: uploadedFilePaths 
  });
});

app.use('/api/boards', apiRouter);

// *** Handler for deleting files ***
app.delete('/api/uploads/*', async (req, res) => {
  try {
    const filePathParam = req.params[0];
    if (!filePathParam) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Construct the target path within the public/uploads directory
    const targetBasePath = path.join(process.cwd(), 'public', 'uploads');
    const targetPath = path.join(targetBasePath, filePathParam);

    // Security check: Ensure the final path is still within the targetBasePath
    const resolvedPath = path.resolve(targetPath);
    if (!resolvedPath.startsWith(path.resolve(targetBasePath))) {
      console.error(`Security Alert: Attempted path traversal for delete: ${filePathParam}`);
      return res.status(403).json({ error: 'Forbidden: Invalid file path' });
    }

    // Check if file exists before attempting deletion
    try {
      await fs.access(targetPath); // Check file existence and permissions
    } catch (accessError) {
      // If fs.access throws, file likely doesn't exist or isn't accessible
      console.warn(`File not found or inaccessible for deletion: ${targetPath}`);
      return res.status(404).json({ error: 'File not found or inaccessible' });
    }

    // Delete the file
    await fs.unlink(targetPath);
    console.log(`File deleted successfully: ${targetPath}`);
    res.status(200).json({ message: 'File deleted successfully' });

  } catch (err) {
    console.error('Error handling file deletion:', err);
    let errorMessage = 'Failed to delete file';
    if (err instanceof Error && 'code' in err) {
      if (err.code === 'EACCES') errorMessage = 'Failed to delete file: Permission denied.';
      // Other specific errors can be handled here
    }
    res.status(500).json({ error: errorMessage, details: err instanceof Error ? err.message : String(err) });
  }
});

// Start server
console.log('Starting server...');
console.log('Working directory:', process.cwd());
console.log('Uploads path:', UPLOADS_DIR);
// console.log('Boards path:', path.join(process.cwd(), 'public/boards')); // Keep if boards are still relevant

app.listen(port, () => {
  console.log(`\nServer running at http://localhost:${port}`);
  console.log('\nTry these endpoints:');
  console.log(`curl http://localhost:${port}/api`);
  console.log(`curl http://localhost:${port}/api/boards`);
});
