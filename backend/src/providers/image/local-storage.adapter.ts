import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export class LocalStorageAdapter {
  private readonly baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), env.LOCAL_STORAGE_DIR);
  }

  async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (err) {
      logger.error({ err, dir: this.baseDir }, 'Failed to create local asset storage directory');
    }
  }

  async saveFile(fileName: string, buffer: Buffer): Promise<string> {
    await this.ensureDirectory();
    // Prevent path traversal
    const safeFileName = path.basename(fileName);
    const destinationPath = path.join(this.baseDir, safeFileName);
    await fs.writeFile(destinationPath, buffer);
    return destinationPath;
  }

  async deleteFile(destinationPath: string): Promise<void> {
    try {
      await fs.unlink(destinationPath);
    } catch {
      // Ignored if file does not exist
    }
  }

  getPublicUrl(fileName: string): string {
    const safeFileName = path.basename(fileName);
    return `/api/v1/assets/${safeFileName}`;
  }
}

export const localStorageAdapter = new LocalStorageAdapter();
