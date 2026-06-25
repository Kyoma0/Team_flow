import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private root: string;

  constructor() {
    this.root = process.env.STORAGE_ROOT || path.resolve(process.cwd(), 'terabox_storage');
  }

  onModuleInit() {
    if (!fs.existsSync(this.root)) {
      fs.mkdirSync(this.root, { recursive: true });
    }
  }

  async upload(
    buffer: Buffer,
    companyName: string,
    userIdentifier: string,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    const dir = path.join(this.root, this.sanitize(companyName), this.sanitize(userIdentifier));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  async download(filePath: string): Promise<{ stream: Readable; exists: boolean }> {
    const exists = fs.existsSync(filePath);
    if (!exists) return { stream: null, nullthrows: false } as any;
    return { stream: fs.createReadStream(filePath), exists: true };
  }

  async remove(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  getRelativePath(companyName: string, userIdentifier: string, fileName: string): string {
    return path.join(this.sanitize(companyName), this.sanitize(userIdentifier), fileName);
  }

  getFullPath(relativePath: string): string {
    return path.join(this.root, relativePath);
  }

  private sanitize(name: string): string {
    return name.replace(/[^a-zA-Z0-9_\-@.]/g, '_').toLowerCase();
  }
}
