'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useParams } from 'next/navigation';
import {
  Plus, Package, Clock, CheckCircle, XCircle, AlertCircle, RotateCcw, ChevronDown, ChevronUp, ThumbsUp, MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateTime } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  IN_PRODUCTION: { label: 'Em produção', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
  IN_REVIEW: { label: 'Em revisão', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertCircle },
  CHANGES_REQUESTED: { label: 'Correção solicitada', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  APPROVED: { label: 'Aprovado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  FINALIZED: { label: 'Finalizado', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400', icon: CheckCircle },
};

const STATUS_ORDER = ['IN_PRODUCTION', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'FINALIZED'];

export default function ProjectDeliveriesPage() {
  const { id } = useParams();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewTarget, setReviewTarget] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', dueDate: '' });
  const [creating, setCreating] = useState(false);

  const fetchDeliveries = useCallback(async () => {
    const { data } = await api.get(`/api/deliveries/project/${id}`);
    setDeliveries(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/deliveries', { ...formData, projectId: id });
      toast.success('Entrega criada!');
      setShowCreateModal(false);
      setFormData({ title: '', description: '', dueDate: '' });
      fetchDeliveries();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar entrega');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (deliveryId: string, status: string) => {
    try {
      await api.patch(`/api/deliveries/${deliveryId}/status`, { status, reviewNote: reviewNote || undefined });
      toast.success('Status atualizado!');
      setReviewNote('');
      setReviewTarget(null);
      fetchDeliveries();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar status');
    }
  };

  const handleVersionAdd = async (deliveryId: string) => {
    try {
      await api.post(`/api/deliveries/${deliveryId}/versions`, {});
      toast.success('Nova versão criada!');
      fetchDeliveries();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar versão');
    }
  };

  const getNextActions = (status: string) => {
    switch (status) {
      case 'IN_PRODUCTION': return [{ status: 'IN_REVIEW', label: 'Enviar para revisão', color: 'bg-yellow-600 hover:bg-yellow-700' }];
      case 'IN_REVIEW': return [
        { status: 'APPROVED', label: 'Aprovar', color: 'bg-green-600 hover:bg-green-700' },
        { status: 'CHANGES_REQUESTED', label: 'Solicitar correção', color: 'bg-red-600 hover:bg-red-700' },
      ];
      case 'CHANGES_REQUESTED': return [{ status: 'IN_REVIEW', label: 'Reenviar para revisão', color: 'bg-yellow-600 hover:bg-yellow-700' }];
      case 'APPROVED': return [{ status: 'FINALIZED', label: 'Finalizar', color: 'bg-gray-600 hover:bg-gray-700' }];
      default: return [];
    }
  };

  const getStatusIcon = (status: string) => {
    const config = STATUS_CONFIG[status];
    return config ? <config.icon className="w-4 h-4" /> : null;
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Entregas ({deliveries.length})</h2>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Nova entrega
        </button>
      </div>

      {deliveries.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma entrega ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.map((delivery) => {
            const config = STATUS_CONFIG[delivery.status] || STATUS_CONFIG.IN_PRODUCTION;
            const actions = getNextActions(delivery.status);
            const isExpanded = expandedId === delivery.id;
            return (
              <div key={delivery.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{delivery.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                          {getStatusIcon(delivery.status)} {config.label}
                        </span>
                      </div>
                      {delivery.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{delivery.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>Criado por {delivery.createdBy?.name}</span>
                        <span>{formatDateTime(delivery.createdAt)}</span>
                        {delivery.dueDate && <span>Prazo: {new Date(delivery.dueDate).toLocaleDateString()}</span>}
                        <span className="font-medium">{delivery.versions?.length || 0} versões</span>
                      </div>
                    </div>
                    <button onClick={() => setExpandedId(isExpanded ? null : delivery.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {actions.map((action) => (
                      <button key={action.status} onClick={() => {
                        if (delivery.status === 'IN_REVIEW') {
                          setReviewTarget(delivery.id);
                        } else {
                          handleStatusChange(delivery.id, action.status);
                        }
                      }}
                        className={`px-3 py-1.5 text-white rounded-lg text-xs font-medium ${action.color}`}>
                        {action.label}
                      </button>
                    ))}
                    <button onClick={() => handleVersionAdd(delivery.id)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-slate-700">
                      <RotateCcw className="w-3 h-3" /> Nova versão
                    </button>
                  </div>

                  {reviewTarget === delivery.id && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                      <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Adicionar nota de revisão..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none mb-2" rows={2} />
                      <div className="flex gap-2">
                        <button onClick={() => handleStatusChange(delivery.id, 'APPROVED')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium">
                          <ThumbsUp className="w-3 h-3" /> Aprovar
                        </button>
                        <button onClick={() => handleStatusChange(delivery.id, 'CHANGES_REQUESTED')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium">
                          <XCircle className="w-3 h-3" /> Solicitar correção
                        </button>
                        <button onClick={() => setReviewTarget(null)}
                          className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-slate-700">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isExpanded && delivery.versions?.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-slate-700">
                    <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700/30 text-xs font-medium text-gray-500">
                      Histórico de versões
                    </div>
                    {delivery.versions.map((v: any) => (
                      <div key={v.id} className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">v{v.version}</span>
                          <span className="text-gray-500">por {v.uploadedBy?.name}</span>
                          <span className="text-xs text-gray-400">{formatDateTime(v.createdAt)}</span>
                        </div>
                        {v.note && <span className="text-xs text-gray-500">{v.note}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {delivery.reviewNote && (
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/30 flex items-start gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">{delivery.reviewNote}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nova entrega</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Ex: Renderização final" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                  rows={3} placeholder="Descreva o que está sendo entregue..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prazo</label>
                <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700">
                  Cancelar
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {creating ? 'Criando...' : 'Criar entrega'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
