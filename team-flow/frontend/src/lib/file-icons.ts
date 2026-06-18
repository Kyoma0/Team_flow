import { File, FileImage, FileText, FileVideo, FileArchive, FileSpreadsheet, FileCode } from 'lucide-react';

const FILE_ICON_MAP: Record<string, any> = {
  'image/jpeg': FileImage,
  'image/png': FileImage,
  'image/gif': FileImage,
  'image/webp': FileImage,
  'image/svg+xml': FileImage,
  'image/bmp': FileImage,
  'application/pdf': FileText,
  'application/msword': FileText,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
  'text/plain': FileText,
  'text/csv': FileSpreadsheet,
  'application/vnd.ms-excel': FileSpreadsheet,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
  'video/mp4': FileVideo,
  'video/webm': FileVideo,
  'video/quicktime': FileVideo,
  'video/x-msvideo': FileVideo,
  'application/zip': FileArchive,
  'application/x-rar-compressed': FileArchive,
  'application/x-7z-compressed': FileArchive,
  'application/gzip': FileArchive,
  'application/x-tar': FileArchive,
  'text/javascript': FileCode,
  'text/typescript': FileCode,
  'text/html': FileCode,
  'text/css': FileCode,
  'application/json': FileCode,
  'text/x-python': FileCode,
  'text/x-java': FileCode,
  'model/gltf+json': FileCode,
  'model/gltf-binary': FileCode,
  'application/octet-stream': File,
};

const EXT_ICON_MAP: Record<string, any> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  mp4: FileVideo,
  avi: FileVideo,
  mov: FileVideo,
  webm: FileVideo,
  zip: FileArchive,
  rar: FileArchive,
  '7z': FileArchive,
  gz: FileArchive,
  tar: FileArchive,
  js: FileCode,
  ts: FileCode,
  jsx: FileCode,
  tsx: FileCode,
  html: FileCode,
  css: FileCode,
  json: FileCode,
  py: FileCode,
  java: FileCode,
  glb: FileCode,
  gltf: FileCode,
  blend: FileCode,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  gif: FileImage,
  webp: FileImage,
  svg: FileImage,
  bmp: FileImage,
  mp3: File,
  wav: File,
  ogg: File,
};

export function getFileIcon(mimetype: string, filename: string) {
  const Icon = FILE_ICON_MAP[mimetype];
  if (Icon) return Icon;

  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return EXT_ICON_MAP[ext] || File;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
