export class FileSystemServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'FileSystemServiceError';
  }
}

export const fileSystemService = {
  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3000/boards/${filePath}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: content,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to write file: ${response.statusText}`);
      }
    } catch (error) {
      throw new FileSystemServiceError(`Failed to write file: ${filePath}`, 'FILE_WRITE_ERROR');
    }
  },

  async readFile(filePath: string): Promise<string> {
    try {
      const response = await fetch(`http://localhost:3000/boards/${filePath}`);
      if (!response.ok) {
        throw new FileSystemServiceError(`File not found: ${filePath}`, 'FILE_NOT_FOUND');
      }
      return await response.text();
    } catch (error) {
      if (error instanceof FileSystemServiceError) {
        throw error;
      }
      throw new FileSystemServiceError(`Failed to read file: ${filePath}`, 'FILE_READ_ERROR');
    }
  },

  async deleteFile(filePath: string): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3000/boards/${filePath}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }
    } catch (error) {
      throw new FileSystemServiceError(`Failed to delete file: ${filePath}`, 'FILE_DELETE_ERROR');
    }
  },

  async fileExists(filePath: string): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:3000/boards/${filePath}`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async listDirectory(dirPath: string): Promise<string[]> {
    try {
      const response = await fetch(`http://localhost:3000/boards/${dirPath}`);
      if (!response.ok) {
        return [];
      }
      const { files } = await response.json();
      return files.filter((name: string) => name !== '__MACOSX' && !name.startsWith('.'));
    } catch (error) {
      return [];
    }
  },

  async createDirectory(dirPath: string): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3000/boards/${dirPath}/mkdir`, {
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
      const response = await fetch(`http://localhost:3000/boards/${dirPath}`);
      if (!response.ok) {
        return [];
      }
      const { files } = await response.json();
      return files.filter((name: string) => name !== '__MACOSX' && !name.startsWith('.'));
    } catch (error) {
      return [];
    }
  },

  async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:3000/boards/${dirPath}`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};
