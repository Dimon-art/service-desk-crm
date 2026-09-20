import React, { useState } from 'react';
import { Inbox, Mail, Lock, AlertCircle, LogIn } from 'lucide-react';

interface Props {
  onSuccess: () => void;
}

export default function LoginPage({ onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Не удалось войти');
        return;
      }
      onSuccess();
    } catch (err: any) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#049460] flex items-center justify-center text-white mb-3 shadow-lg shadow-emerald-500/20">
            <Inbox className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-[#14213D]">Вход для сотрудников</h1>
          <p className="text-xs text-slate-500 mt-1">Service Desk CRM</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-[#14213D] focus:border-[#049460] focus:outline-none focus:ring-2 focus:ring-[#049460]/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1.5">
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-[#14213D] focus:border-[#049460] focus:outline-none focus:ring-2 focus:ring-[#049460]/20 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#049460] hover:bg-[#078454] disabled:bg-slate-300 text-white font-bold rounded-lg text-sm transition shadow-md"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="mt-6 text-[10px] text-center text-slate-400 leading-relaxed">
          Демо-доступ выдаётся администратором.<br />
          Нет аккаунта? Обратитесь к руководителю отдела.
        </p>
      </div>
    </div>
  );
}