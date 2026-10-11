import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface StorageProvider {
  uploadFile(fileBuffer: Buffer, fileName: string): Promise<string>;
  getFile(fileUrl: string): Promise<Buffer>;
  deleteFile(fileUrl: string): Promise<void>;
}

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir: string = './storage') {
    this.baseDir = path.resolve(baseDir);
    fs.mkdir(this.baseDir, { recursive: true }).catch(console.error);
  }

  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    await fs.mkdir(this.baseDir, { recursive: true });
    const safeFileName = (fileName || 'uploaded-file')
      .split('/')
      .pop()
      ?.replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'uploaded-file';

    const finalName = `${randomUUID()}-${safeFileName}`;
    const filePath = path.join(this.baseDir, finalName);
    await fs.writeFile(filePath, fileBuffer);
    return filePath;
  }

  async getFile(fileUrl: string): Promise<Buffer> {
    return fs.readFile(fileUrl);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    await fs.unlink(fileUrl).catch(() => undefined);
  }
}
