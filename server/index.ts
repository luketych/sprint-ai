import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import apiRouter from './api-router';

interface FileUpload {
  mv: (path: string) => Promise<void>;
}

interface FileUploadRequest extends express.Request {
  files?: {
    [key: string]: FileUpload | FileUpload[];
  };
}

const app = express();
const port = 3456;

// Ensure required directories exist
const ensureDirectories = async () => {
  const publicUploadsPath = path.join(process.cwd(), 'public', 'uploads');
  try {
    await fs.mkdir(publicUploadsPath, { recursive: true });
    console.log('Public uploads directory ready:', publicUploadsPath);
  } catch (err) {
    console.error('Error creating public uploads directory:', err);
  }
};

// Initialize directories
ensureDirectories();

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
// Add middleware for parsing raw application/octet-stream bodies
app.use('/api/uploads', express.raw({ type: 'application/octet-stream', limit: '10mb' }));

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

app.use('/api/boards', apiRouter);

// *** NEW: Handler for raw binary file uploads ***
app.post('/api/uploads/*', async (req, res) => {
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
      console.error(`Security Alert: Attempted path traversal: ${filePathParam}`);
      return res.status(403).json({ error: 'Forbidden: Invalid file path' });
    }

    // Ensure the directory exists
    const dirName = path.dirname(targetPath);
    await fs.mkdir(dirName, { recursive: true });

    // Write the raw buffer from the request body to the file
    // express.raw() middleware should place the buffer in req.body
    if (!(req.body instanceof Buffer)) {
       console.error('Error: req.body is not a Buffer. Middleware setup issue?');
       return res.status(500).json({ error: 'Server error: Could not process request body' });
    }
    
    await fs.writeFile(targetPath, req.body);
    console.log(`File saved successfully: ${targetPath}`);
    res.status(201).json({ message: 'File uploaded successfully', path: `/uploads/${filePathParam}` });

  } catch (err) {
    console.error('Error handling file upload:', err);
    // Provide a more specific error message if possible
    let errorMessage = 'Failed to upload file';
    if (err instanceof Error && 'code' in err) { 
        if (err.code === 'ENOENT') errorMessage = 'Failed to upload file: Directory path issue.';
        else if (err.code === 'EACCES') errorMessage = 'Failed to upload file: Permission denied.';
    }
    res.status(500).json({ error: errorMessage, details: err instanceof Error ? err.message : String(err) });
  }
});

// *** NEW: Handler for deleting files ***
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
console.log('Boards path:', path.join(process.cwd(), 'public/boards'));

app.listen(port, () => {
  console.log(`\nServer running at http://localhost:${port}`);
  console.log('\nTry these endpoints:');
  console.log(`curl http://localhost:${port}/api`);
  console.log(`curl http://localhost:${port}/api/boards`);
});
