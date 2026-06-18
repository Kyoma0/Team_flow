'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { User, Save, Lock, Eye, EyeOff, Loader2, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      await api.patch('/api/profile', { name, avatar: avatar || undefined });
      toast.success('Perfil atualizado!');
      if (refreshUser) refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) { toast.error('Digite sua senha atual'); return; }
    if (newPassword.length < 6) { toast.error('Nova senha deve ter no mínimo 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { toast.error('Senhas não conferem'); return; }
    setChangingPassword(true);
    try {
      await api.post('/api/profile/change-password', { currentPassword, newPassword });
      toast.success('Senha alterada!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      {/* Profile Info */}
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-2xl font-bold">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              (user.name || 'U')[0].toUpperCase()
            )}
          </div>
          <div>
            <p className="font-medium">{user.name || 'Usuário'}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nome</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Foto do perfil</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-2xl font-bold overflow-hidden">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                (user.name || 'U')[0].toUpperCase()
              )}
            </div>
            <label className="cursor-pointer px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload foto
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const form = new FormData();
                form.append('avatar', file);
                try {
                  const { data } = await api.post('/api/profile/avatar', form);
                  setAvatar(data.avatar);
                  toast.success('Foto atualizada!');
                  if (refreshUser) refreshUser();
                } catch (err: any) {
                  toast.error(err.response?.data?.message || 'Erro ao enviar foto');
                }
              }} />
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">URL do Avatar</label>
          <input type="url" value={avatar} onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </button>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Lock className="w-5 h-5" /> Alterar Senha</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Senha atual</label>
          <div className="relative">
            <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nova senha</label>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              minLength={6} className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirmar nova senha</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
        <button type="submit" disabled={changingPassword}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
          {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          Alterar senha
        </button>
      </form>
    </div>
  );
}
