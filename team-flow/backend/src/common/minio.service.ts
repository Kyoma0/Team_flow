import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { Readable } from 'stream';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Minio.Client;
  private bucket: string;
  private useLocalFallback: boolean;

  constructor() {
    this.useLocalFallback = !process.env.MINIO_ENDPOINT || process.env.MINIO_ENDPOINT === 'localhost' && !process.env.MINIO_ACCESS_KEY;
  }

  async onModuleInit() {
    if (this.useLocalFallback) return;

    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });

    this.bucket = process.env.MINIO_BUCKET || 'teamflow';

    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, 'us-east-1');
    }
  }

  async upload(fileName: string, buffer: Buffer, mimeType: string): Promise<string> {
    if (this.useLocalFallback) {
      const fs = await import('fs');
      const path = await import('path');
      const dir = path.resolve(__dirname, '../../uploads');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, fileName), buffer);
      return fileName;
    }

    await this.client.putObject(this.bucket, fileName, buffer, buffer.length, {
      'Content-Type': mimeType,
    });
    return fileName;
  }

  async download(fileName: string): Promise<{ stream: Readable | null; exists: boolean }> {
    if (this.useLocalFallback) {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.resolve(__dirname, '../../uploads', fileName);
      const exists = fs.existsSync(filePath);
      if (!exists) return { stream: null, exists: false };
      return { stream: fs.createReadStream(filePath), exists: true };
    }

    try {
      const stream = await this.client.getObject(this.bucket, fileName);
      return { stream: stream as unknown as Readable, exists: true };
    } catch {
      return { stream: null, exists: false };
    }
  }

  async remove(fileName: string): Promise<void> {
    if (this.useLocalFallback) {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.resolve(__dirname, '../../uploads', fileName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return;
    }

    try {
      await this.client.removeObject(this.bucket, fileName);
    } catch {}
  }

  getUrl(fileName: string): string {
    if (this.useLocalFallback) return `/api/files/download/${fileName}`;
    return `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${this.bucket}/${fileName}`;
  }
}
