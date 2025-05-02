export class FileSystemServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'FileSystemServiceError';
  }
}

export const fileSystemService = {
  async writeFile(filePath: string, content: string | ArrayBuffer): Promise<void> {
    try {
      const headers: Record<string, string> = {};
      const isBinary = content instanceof ArrayBuffer;
      
      if (isBinary) {
        headers['Content-Type'] = 'application/octet-stream';
      } else if (filePath.endsWith('.json')) {
        headers['Content-Type'] = 'application/json';
      } else if (filePath.endsWith('.md')) {
        headers['Content-Type'] = 'text/markdown';
      } else {
        headers['Content-Type'] = 'text/plain';
      }

      // Use uploads endpoint for binary data, boards endpoint for text
      const endpoint = isBinary ? 'uploads' : 'boards';
      const response = await fetch(`http://localhost:3456/api/${endpoint}/${filePath}`, {
        method: isBinary ? 'POST' : 'PUT',
        headers,
        body: content,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to write file: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error writing file:', error);
      throw new FileSystemServiceError(`Failed to write file: ${filePath}`, 'FILE_WRITE_ERROR');
    }
  },

  async readTextFile(filePath: string): Promise<string> {
    try {
      const url = `http://localhost:3456/api/boards/${filePath.replace(/^public\//, '')}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new FileSystemServiceError(`File not found: ${filePath}`, 'FILE_NOT_FOUND');
      }

      const data = await response.json();
      if (typeof data === 'object' && 'content' in data) {
        return data.content;
      }
      return JSON.stringify(data);
    } catch (error) {
      if (error instanceof FileSystemServiceError) {
        throw error;
      }
      throw new FileSystemServiceError(`Failed to read file: ${filePath}`, 'FILE_READ_ERROR');
    }
  },

  async readBinaryFile(filePath: string): Promise<ArrayBuffer> {
    try {
      const url = `http://localhost:3456/uploads/${filePath}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new FileSystemServiceError(`File not found: ${filePath}`, 'FILE_NOT_FOUND');
      }

      return await response.arrayBuffer();
    } catch (error) {
      if (error instanceof FileSystemServiceError) {
        throw error;
      }
      throw new FileSystemServiceError(`Failed to read file: ${filePath}`, 'FILE_READ_ERROR');
    }
  },

  async deleteFile(filePath: string): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3456/api/boards/${filePath}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }
    } catch (error) {
      throw new FileSystemServiceError(`Failed to delete file: ${filePath}`, 'FILE_DELETE_ERROR');
    }
  },

  async deleteFileFromUploads(filePath: string): Promise<void> {
    try {
      // The filePath should be relative to the 'uploads' directory, e.g., 'boardId/cardId/image.jpg'
      const response = await fetch(`http://localhost:3456/api/uploads/${filePath}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Failed to delete file ${filePath}: ${response.status} ${response.statusText}`, errorBody);
        throw new FileSystemServiceError('FILE_DELETE_ERROR', `Failed to delete file: ${response.statusText}`);
      }
      console.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      if (error instanceof FileSystemServiceError) {
        throw error;
      }
      throw new FileSystemServiceError('NETWORK_ERROR', 'Network error during file deletion.');
    }
  },

  async fileExists(filePath: string): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:3456/api/boards/${filePath.replace(/^public\//, '')}`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async uploadBinaryFile(filePath: string, data: ArrayBuffer | Blob): Promise<void> {
    try {
      const fileBuffer = data instanceof Blob ? 
        await data.arrayBuffer() : 
        data;
      
      const response = await fetch(`http://localhost:3456/api/uploads/${filePath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: fileBuffer
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
      }
    } catch (error) {
      throw new FileSystemServiceError(`Failed to upload file: ${filePath}`, 'FILE_UPLOAD_ERROR');
    }
  },

  async createUploadsDirectory(dirPath: string): Promise<void> {
    try {
      const normalizedPath = dirPath.startsWith('public/uploads/') ? 
        dirPath.replace('public/uploads/', '') : 
        dirPath.startsWith('uploads/') ? 
          dirPath.replace('uploads/', '') : 
          dirPath;

      if (normalizedPath) {
        const boardIdMatch = normalizedPath.match(/^boards\/([^\/]+)\/.*$/);
        const boardId = boardIdMatch ? boardIdMatch[1] : null;
        const response = await fetch(`http://localhost:3456/api/boards/${boardId}/uploads/${normalizedPath.replace(/^boards\/[^\/]+\//, '')}/mkdir`, {
          method: 'POST'
        });

        if (!response.ok) {
          throw new Error(`Failed to create uploads directory: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error creating uploads directory:', error);
      throw new FileSystemServiceError(`Failed to create uploads directory: ${dirPath}`, 'DIRECTORY_CREATE_ERROR');
    }
  },

  async listDirectory(dirPath: string): Promise<string[]> {
    try {
      // Handle special case for uploads directory
      if (dirPath.startsWith('uploads/') || dirPath.startsWith('public/uploads/')) {
        // Create directory first
        const normalizedPath = dirPath.replace(/^(?:public\/)?/, '');
        await this.createUploadsDirectory(normalizedPath);
        
        // Then list contents
        const cleanPath = normalizedPath.replace(/^uploads\//, '');
        const response = await fetch(`http://localhost:3456/uploads/${cleanPath}`);
        
        if (!response.ok) {
          // Return empty array for non-existent directories
          if (response.status === 404) return [];
          throw new Error(`Failed to list directory: ${response.statusText}`);
        }
        
        const json = await response.json();
        return (json.files || [])
          .filter((f: { name: string }) => !f.name.startsWith('.'))
          .map((f: { name: string }) => f.name);
      }

      // Otherwise, use the API route
      const response = await fetch(`http://localhost:3456/api/boards/${dirPath.replace(/^public\//, '')}`);
      if (!response.ok) {
        return [];
      }
      const { files } = await response.json();
      const filteredFiles = files
        .filter((file: { name: string; type: string }) => 
          !file.name.startsWith('.') && 
          !file.name.startsWith('__MACOSX')
        )
        .map((file: { name: string }) => file.name);
      return filteredFiles;
    } catch (error) {
      return [];
    }
  },

  async createDirectory(dirPath: string): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3456/api/boards/${dirPath.replace(/^public\//, '')}/mkdir`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create directory: ${response.statusText}`);
      }
    } catch (error) {
      throw new FileSystemServiceError(`Failed to create directory: ${dirPath}`, 'DIRECTORY_CREATE_ERROR');
    }
  },

  async readDirectory(dirPath: string): Promise<string[]> {
    try {
      const response = await fetch(`http://localhost:3456/api/boards/${dirPath.replace(/^public\//, '')}`);
      if (!response.ok) {
        return [];
      }
      const { files } = await response.json();
      return files
        .filter((file: { name: string; type: string }) => 
          !file.name.startsWith('.') && 
          !file.name.startsWith('__MACOSX')
        )
        .map((file: { name: string }) => file.name);
    } catch (error) {
      return [];
    }
  },

  async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:3456/api/boards/${dirPath.replace(/^public\//, '')}`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async deleteDirectory(dirPath: string): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3456/api/boards/${dirPath.replace(/^public\//, '')}/rmdir`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete directory: ${response.statusText}`);
      }
    } catch (error) {
      throw new FileSystemServiceError(`Failed to delete directory: ${dirPath}`, 'DIRECTORY_DELETE_ERROR');
    }
  }
};
