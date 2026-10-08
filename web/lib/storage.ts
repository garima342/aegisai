import * as fs from 'fs/promises';
import * as path from 'path';

export interface StorageProvider {
  uploadFile(fileBuffer: Buffer, fileName: string): Promise<string>;
  getFile(fileUrl: string): Promise<Buffer>;
  deleteFile(fileUrl: string): Promise<void>;
}

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir: string = './storage') {
    this.baseDir = baseDir;
    fs.mkdir(this.baseDir, { recursive: true }).catch(console.error);
  }

  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    const filePath = path.join(this.baseDir, fileName);
    await fs.writeFile(filePath, fileBuffer);
    return filePath;
  }

  async getFile(fileUrl: string): Promise<Buffer> {
    return fs.readFile(fileUrl);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    await fs.unlink(fileUrl);
  }
}
