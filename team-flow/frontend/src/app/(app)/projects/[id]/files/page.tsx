'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useParams } from 'next/navigation';
import {
  Upload, Download, Trash2, FileText, Image, FileArchive, File, RefreshCw, Upload as UploadIcon, Box, Search,
  History, RotateCcw, X, Eye, List, LayoutGrid,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBytes, formatDate, formatDateTime } from '@/lib/utils';
import { getFileIcon, formatFileSize } from '@/lib/file-icons';
import Link from 'next/link';

const SUPPORTED_3D_FORMATS = ['glb', 'gltf', 'fbx', 'obj', 'stl'];

export default function ProjectFilesPage() {
  const { id } = useParams();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [fileVersions, setFileVersions] = useState<any[]>([]);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const versionInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = searchQuery
    ? files.filter((f) => f.originalName?.toLowerCase().includes(searchQuery.toLowerCase()))
    : files;

  const fetchFiles = useCallback(async () => {
    const { data } = await api.get(`/api/files/project/${id}`);
    setFiles(data.files || data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const fetchVersions = async (fileId: string) => {
    setVersionsLoading(true);
    try {
      const { data } = await api.get(`/api/files/${fileId}`);
      setSelectedFile(data);
      setFileVersions(data.versions || []);
      setShowVersionsModal(true);
    } catch {
      toast.error('Erro ao carregar versões');
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleUploadVersion = async (fileId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/api/files/${fileId}/version`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Nova versão enviada!');
      fetchVersions(fileId);
      fetchFiles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao enviar versão');
    }
  };

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    const results = await Promise.allSettled(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post(`/api/files/upload?projectId=${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setUploadProgress((prev) => ({ ...prev, current: prev.current + 1 }));
        return data;
      })
    );

    const uploaded: any[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        uploaded.push(result.value);
        toast.success(`${files[index].name} enviado!`);
      } else {
        toast.error(`${files[index].name}: ${result.reason?.response?.data?.message || 'Erro ao enviar'}`);
      }
    });

    if (uploaded.length > 0) {
      setFiles((prev) => [...uploaded, ...prev]);
    }

    setUploading(false);
    setUploadProgress({ current: 0, total: 0 });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) handleUpload(droppedFiles);
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Excluir este arquivo?')) return;
    await api.delete(`/api/files/${fileId}`);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.success('Arquivo excluído');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) handleUpload(selectedFiles);
    e.target.value = '';
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Arquivos ({files.length})</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 border border-gray-300 dark:border-slate-600 rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-100 dark:bg-slate-700' : ''}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-slate-700' : ''}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar arquivos..."
              className="w-full sm:w-56 pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shrink-0">
            <Upload className="w-4 h-4" /> Enviar
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInputChange} />
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors
          ${dragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-slate-600'}`}
      >
        <UploadIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-500">Arraste arquivos aqui ou clique em "Enviar"</p>
        <p className="text-xs text-gray-400 mt-1">Qualquer formato é aceito</p>
        {uploading && (
          <p className="text-sm text-primary-600 mt-2">
            Enviando arquivo {uploadProgress.current + 1} de {uploadProgress.total}...
          </p>
        )}
      </div>

      {/* File list / grid */}
      {searchQuery && filteredFiles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum arquivo encontrado para "{searchQuery}"</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredFiles.map((file) => {
            const FileIcon = getFileIcon(file.mimeType, file.originalName);
            return (
              <div key={file.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center h-20 bg-gray-50 dark:bg-slate-700/50 rounded-lg mb-2">
                  <FileIcon className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-xs font-medium truncate">{file.originalName}</p>
                <p className="text-[10px] text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            );
          })}
        </div>
      ) : (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
        {filteredFiles.map((file) => {
          const Icon = getFileIcon(file.mimeType, file.originalName);
          const isImage = file.mimeType?.startsWith('image/');
          return (
            <div key={file.id} className="flex items-center gap-3 p-3 border-b last:border-b-0 border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                <Icon className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.originalName}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)} · {formatDate(file.createdAt)} · v{file.version}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {isImage && (
                  <button onClick={() => setPreviewFile(file)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
                    title="Visualizar">
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                {SUPPORTED_3D_FORMATS.includes(file.originalName?.split('.').pop()?.toLowerCase()) && (
                  <Link
                    href={`/viewer/${file.id}`}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-blue-500"
                    title="Visualizar 3D"
                  >
                    <Box className="w-4 h-4" />
                  </Link>
                )}
                <button onClick={() => fetchVersions(file.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
                  title="Histórico de versões">
                  <History className="w-4 h-4" />
                </button>
                <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/files/${file.id}/download`}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                  <Download className="w-4 h-4" />
                </a>
                <button onClick={() => handleDelete(file.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {filteredFiles.length === 0 && !searchQuery && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum arquivo ainda</p>
          </div>
        )}
      </div>
      )}
      {showVersionsModal && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowVersionsModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Versões</h2>
                <p className="text-sm text-gray-500">{selectedFile.originalName}</p>
              </div>
              <button onClick={() => setShowVersionsModal(false)}><X className="w-5 h-5" /></button>
            </div>

            <input ref={versionInputRef} type="file" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUploadVersion(selectedFile.id, e.target.files[0])} />

            <button onClick={() => versionInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium mb-4 w-fit">
              <Upload className="w-4 h-4" /> Enviar nova versão
            </button>

            <div className="flex-1 overflow-y-auto space-y-2">
              {versionsLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" /></div>
              ) : (
                <>
                  {/* Versão atual */}
                  <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-primary-600 text-white px-1.5 py-0.5 rounded">Atual</span>
                        <span className="font-medium text-sm">v{selectedFile.version}</span>
                        <span className="text-xs text-gray-500">{formatBytes(selectedFile.size)}</span>
                      </div>
                      <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/files/${selectedFile.id}/download`}
                        className="p-1.5 rounded hover:bg-primary-100 dark:hover:bg-primary-900/50">
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Versão atual · {formatDateTime(selectedFile.createdAt)}</p>
                  </div>

                  {fileVersions.length === 0 && (
                    <p className="text-center py-8 text-sm text-gray-500">Nenhuma versão anterior</p>
                  )}
                  {fileVersions.map((v: any) => (
                    <div key={v.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">v{v.version}</span>
                          <span className="text-xs text-gray-500">{formatBytes(v.size)}</span>
                        </div>
                        <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/files/versions/${v.id}/download`}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {v.uploadedBy?.name} · {formatDateTime(v.createdAt)}
                      </p>
                      {v.note && <p className="text-xs text-gray-400 mt-1">{v.note}</p>}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image preview modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setPreviewFile(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full mb-2">
              <div className="text-white text-sm truncate max-w-md">
                <span className="font-medium">{previewFile.originalName}</span>
                <span className="ml-2 opacity-70">{formatBytes(previewFile.size)}</span>
              </div>
              <div className="flex items-center gap-2">
                <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/files/${previewFile.id}/download`}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  title="Download">
                  <Download className="w-5 h-5" />
                </a>
                <button onClick={() => setPreviewFile(null)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  title="Fechar">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}/api/files/${previewFile.id}/download`}
              alt={previewFile.originalName}
              className="max-w-full max-h-[80vh] rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
