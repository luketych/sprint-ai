import fs from 'fs/promises';
import path from 'path';

export class FSError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'FSError';
  }
}

export const fsUtils = {
  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await fs.mkdir(dirPath, { recursive: true });
      } else {
        throw new FSError(`Failed to ensure directory exists: ${dirPath}`, 'DIRECTORY_ERROR');
      }
    }
  },

  async readFileSafe(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new FSError(`File not found: ${filePath}`, 'FILE_NOT_FOUND');
      }
      throw new FSError(`Failed to read file: ${filePath}`, 'READ_ERROR');
    }
  },

  async writeFileSafe(filePath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new FSError(`Failed to write file: ${filePath}`, 'WRITE_ERROR');
    }
  },

  async readDirSafe(dirPath: string): Promise<string[]> {
    try {
      return await fs.readdir(dirPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new FSError(`Directory not found: ${dirPath}`, 'DIRECTORY_NOT_FOUND');
      }
      throw new FSError(`Failed to read directory: ${dirPath}`, 'READ_DIR_ERROR');
    }
  },

  async statSafe(filePath: string) {
    try {
      return await fs.stat(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new FSError(`Path not found: ${filePath}`, 'PATH_NOT_FOUND');
      }
      throw new FSError(`Failed to get file stats: ${filePath}`, 'STAT_ERROR');
    }
  }
}; 