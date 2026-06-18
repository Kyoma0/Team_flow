'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Shield, ShieldOff, Copy, Check } from 'lucide-react';

export default function SecurityPage() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [secret, setSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [codesCopied, setCodesCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/api/2fa/status');
      setEnabled(data.enabled);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleSetup = async () => {
    try {
      const { data } = await api.post('/api/2fa/generate');
      setSecret(data.secret);
      setOtpauthUrl(data.otpauth_url);
      setShowSetup(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao configurar 2FA');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length < 6) return;
    setVerifying(true);
    try {
      const { data } = await api.post('/api/2fa/verify', { token });
      setBackupCodes(data.backupCodes);
      setEnabled(true);
      toast.success('2FA ativado com sucesso!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Código inválido');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('Desabilitar 2FA? Isso reduz a segurança da sua conta.')) return;
    await api.post('/api/2fa/disable');
    setEnabled(false);
    setShowSetup(false);
    setBackupCodes([]);
    toast.success('2FA desabilitado');
  };

  const copyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCodesCopied(true);
    setTimeout(() => setCodesCopied(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Segurança</h1>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {enabled ? <Shield className="w-5 h-5 text-green-500" /> : <ShieldOff className="w-5 h-5 text-gray-400" />}
              Autenticação de dois fatores (2FA)
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {enabled
                ? 'Sua conta está protegida com 2FA'
                : 'Adicione uma camada extra de segurança à sua conta'}
            </p>
          </div>
          {!enabled ? (
            <button onClick={handleSetup} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">
              Configurar
            </button>
          ) : (
            <button onClick={handleDisable} className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium">
              Desabilitar
            </button>
          )}
        </div>

        {showSetup && !backupCodes.length && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <p className="text-sm font-medium">Escaneie o QR code ou insira a chave manualmente no seu app autenticador:</p>
            {otpauthUrl && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`} alt="QR Code" className="rounded-lg" />
              </div>
            )}
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2 text-center">
              <code className="text-sm font-mono break-all select-all">{secret}</code>
            </div>
            <form onSubmit={handleVerify} className="flex gap-2">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-center text-lg tracking-widest font-mono focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <button type="submit" disabled={token.length < 6 || verifying}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                {verifying ? 'Verificando...' : 'Verificar'}
              </button>
            </form>
          </div>
        )}

        {backupCodes.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <p className="text-sm font-medium mb-2">Códigos de recuperação (guarde em local seguro):</p>
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-1">
                {backupCodes.map((code) => (
                  <code key={code} className="text-xs font-mono">{code}</code>
                ))}
              </div>
            </div>
            <button onClick={copyCodes} className="mt-2 flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
              {codesCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {codesCopied ? 'Copiado!' : 'Copiar códigos'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
