'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Model3DViewer } from '@/components/viewer/Model3DViewer';
import { ArrowLeft } from 'lucide-react';

const SUPPORTED_3D_FORMATS = ['glb', 'gltf', 'fbx', 'obj', 'stl'] as const;

export default function ViewerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/api/files/${id}`)
      .then(({ data }) => {
        const ext = data.originalName?.split('.').pop()?.toLowerCase();
        if (!ext || !SUPPORTED_3D_FORMATS.includes(ext)) {
          setError(`Formato não suportado para visualização 3D: .${ext}`);
          setLoading(false);
          return;
        }
        setFile(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Arquivo não encontrado');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 dark:text-gray-400">{error || 'Arquivo não encontrado'}</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-primary-600 hover:underline"
        >
          Voltar
        </button>
      </div>
    );
  }

  const ext = file.originalName.split('.').pop()?.toLowerCase() as typeof SUPPORTED_3D_FORMATS[number];
  const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/files/${file.id}/download`;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">{file.originalName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Visualizador 3D - Arraste para rotacionar, scroll para zoom
          </p>
        </div>
      </div>

      <div className="flex-1 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
        <Model3DViewer url={downloadUrl} format={ext} fileName={file.originalName} />
      </div>
    </div>
  );
}
