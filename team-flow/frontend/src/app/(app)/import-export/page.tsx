'use client';

import { useState, useRef } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Download, Upload, FileJson, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ImportExportPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: number; errorMessages: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/api/projects');
      setProjects(data);
    } catch {}
  };

  useState(() => { fetchProjects(); });

  const handleExport = async (type: 'project' | 'all') => {
    if (type === 'project' && !selectedProject) { toast.error('Selecione um projeto'); return; }
    setExporting(true);
    try {
      const url = type === 'project'
        ? `/api/export/project/${selectedProject}?format=${exportFormat}`
        : `/api/export/all?format=${exportFormat}`;
      const { data } = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([data], { type: exportFormat === 'json' ? 'application/json' : 'text/csv' });
      const url2 = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url2;
      const project = projects.find((p) => p.id === selectedProject);
      a.download = type === 'project'
        ? `${project?.name || 'projeto'}-export.${exportFormat}`
        : `teamflow-export.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url2);
      toast.success('Exportação concluída!');
    } catch (err: any) {
      toast.error('Erro ao exportar');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) { toast.error('Selecione um projeto e um arquivo'); return; }

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      let tasks: any[];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        tasks = parsed.tasks || parsed;
      } else {
        const lines = text.split('\n').filter((l) => l.trim());
        if (lines.length < 2) throw new Error('CSV vazio');
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        tasks = lines.slice(1).map((line) => {
          const values = line.split(',').map((v) => v.replace(/^"|"$/g, '').trim());
          const task: any = {};
          headers.forEach((h, i) => { task[h] = values[i] || ''; });
          return task;
        });
      }

      const { data } = await api.post(`/api/export/import/${selectedProject}`, { tasks });
      setImportResult(data);
      toast.success(`${data.imported} tarefas importadas${data.errors > 0 ? `, ${data.errors} erros` : ''}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao importar');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Importar / Exportar</h1>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-primary-500" /> Exportar
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Projeto</label>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">Selecione um projeto...</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Formato</label>
            <div className="flex gap-2">
              <button onClick={() => setExportFormat('json')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${exportFormat === 'json' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'border-gray-300 dark:border-slate-600'}`}>
                <FileJson className="w-4 h-4" /> JSON
              </button>
              <button onClick={() => setExportFormat('csv')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${exportFormat === 'csv' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'border-gray-300 dark:border-slate-600'}`}>
                <FileSpreadsheet className="w-4 h-4" /> CSV
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleExport('project')} disabled={!selectedProject || exporting}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Exportar projeto
            </button>
            <button onClick={() => handleExport('all')} disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">
              Exportar tudo
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-primary-500" /> Importar
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Projeto de destino</label>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">Selecione um projeto...</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-500">
            Formatos aceitos: JSON (array de tasks ou objeto com chave "tasks") e CSV (colunas: title, description, status, priority, dueDate)
          </p>
          <input ref={fileRef} type="file" accept=".json,.csv" onChange={handleImport} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 dark:file:bg-primary-900/30 file:text-primary-600 hover:file:bg-primary-100" />
          {importing && <Loader2 className="w-5 h-5 animate-spin text-primary-500" />}
          {importResult && (
            <div className="space-y-1">
              <p className="flex items-center gap-1 text-sm text-green-600"><CheckCircle className="w-4 h-4" /> {importResult.imported} tarefas importadas</p>
              {importResult.errors > 0 && (
                <div className="text-sm text-red-500">
                  <p className="flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {importResult.errors} erros</p>
                  <ul className="mt-1 text-xs space-y-0.5">
                    {importResult.errorMessages.slice(0, 5).map((msg, i) => <li key={i}>{msg}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
