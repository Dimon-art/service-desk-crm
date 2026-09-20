import React, { useState, useEffect } from 'react';
import { 
  Home, PlusCircle, List, Server, AlertCircle, Inbox, Activity, CheckCircle, Bell, Settings, Users, BarChart3, Clock, AlertTriangle, MoreHorizontal, UserCheck, Search, ChevronRight, ArrowLeft, MessageSquare, Calendar, Mail, User, Zap, Check, BookOpen, ShieldCheck, Database, ArrowUpRight, Info, Archive, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SupportRequest, CreateRequestInput, RequestStatus } from './types';
import { getStatusLabel } from './statusLabels';
import HomeView from './components/HomeView.redesign';
import CreateRequestForm from './components/CreateRequestForm';
import RequestList from './components/RequestList';
import RequestDetails from './components/RequestDetails';
import RequesterView from './components/RequesterView';
import ArchiveList from './components/ArchiveList';
import LoginPage from './components/LoginPage';

interface CurrentUser {
  id: number;
  email: string;
  name: string;
  role: 'manager' | 'executor' | 'requester';
}

function getRequesterParams(): { requestId: number; accessToken: string } | null {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get('requestId');
  const accessToken = params.get('accessToken');
  if (requestId && accessToken) {
    const id = parseInt(requestId, 10);
    if (!isNaN(id) && id > 0) return { requestId: id, accessToken };
  }
  return null;
}

export const TEAM_MEMBERS = [
  { name: 'Дмитрий Петров', role: 'Ведущий инженер', email: 'd.petrov@servicedesk.ru', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', status: 'online' },
  { name: 'Алексей Иванов', role: 'Инженер поддержки L2', email: 'a.ivanov@servicedesk.ru', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80', status: 'online' },
  { name: 'Мария Сидорова', role: 'Специалист поддержки L1', email: 'm.sidorova@servicedesk.ru', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', status: 'away' },
  { name: 'Елена Козлова', role: 'Диспетчер обращений', email: 'e.kozlova@servicedesk.ru', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80', status: 'offline' }
];

export default function App() {
  const requesterParams = getRequesterParams();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [view, setView] = useState<'home' | 'requests_all' | 'requests_mine' | 'requests_archive' | 'team' | 'analytics' | 'settings' | 'create_request' | 'details_request'>('home');
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [archivedRequests, setArchivedRequests] = useState<SupportRequest[]>([]);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [detailsSource, setDetailsSource] = useState<'active' | 'archive'>('active');
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [notifications, setNotifications] = useState<{ id: number; text: string; time: string; read: boolean }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check auth on mount
  useEffect(() => {
    if (requesterParams) {
      setAuthChecked(true);
      return;
    }
    fetch('/api/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setUser(data);
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/requests', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) { setUser(null); return; }
        throw new Error('Ошибка при загрузке заявок');
      }
      const data = await response.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchArchivedRequests = async () => {
    if (!user || user.role !== 'manager') { setArchivedRequests([]); return; }
    setIsArchiveLoading(true);
    try {
      const response = await fetch('/api/archived-requests', { credentials: 'include' });
      if (response.ok) {
        setArchivedRequests(await response.json());
      }
    } catch (err) { console.error(err); }
    finally { setIsArchiveLoading(false); }
  };

  useEffect(() => {
    if (user) { fetchRequests(); fetchArchivedRequests(); }
  }, [user]);

  const handleLogout = async () => {
    try { await fetch('/api/logout', { method: 'POST', credentials: 'include' }); } catch {}
    setUser(null);
    setRequests([]);
    setArchivedRequests([]);
  };

  const handleAddRequest = async (input: CreateRequestInput): Promise<SupportRequest> => {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      let errMsg = 'Ошибка при создании заявки';
      try { errMsg = (await response.json()).error || errMsg; } catch { errMsg = `Ошибка сервера (${response.status})`; }
      throw new Error(errMsg);
    }
    const created: SupportRequest = await response.json();
    setRequests((prev) => [created, ...prev]);
    return created;
  };

  const handleUpdateStatusAndComment = async (
    id: number, status: RequestStatus, comment: string, assignee?: string
  ): Promise<SupportRequest> => {
    const response = await fetch(`/api/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, manager_comment: comment, ...(assignee !== undefined ? { assignee } : {}) }),
    });
    if (!response.ok) {
      let errMsg = 'Ошибка при обновлении заявки';
      try { errMsg = (await response.json()).error || errMsg; } catch { errMsg = `Ошибка сервера (${response.status})`; }
      throw new Error(errMsg);
    }
    const updated: SupportRequest = await response.json();
    if (status === 'closed') {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setArchivedRequests((prev) => [updated, ...prev.filter((r) => r.id !== id)]);
      setView('requests_archive');
      setSelectedRequestId(null);
      setDetailsSource('active');
    } else {
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    }
    return updated;
  };

  const selectedRequest =
    requests.find((r) => r.id === selectedRequestId) ||
    archivedRequests.find((r) => r.id === selectedRequestId);
  const isArchivedDetails = detailsSource === 'archive' || selectedRequest?.status === 'closed';

  const handleNotificationClick = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const handleMarkAllNotificationsAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  if (requesterParams) {
    return <RequesterView requestId={requesterParams.requestId} accessToken={requesterParams.accessToken} />;
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB]">
        <div className="w-9 h-9 border-3 border-[#049460] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onSuccess={() => {
      fetch('/api/me', { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => data && setUser(data));
    }} />;
  }

  const roleLabel = user.role === 'manager' ? 'Руководитель' : user.role === 'executor' ? 'Исполнитель' : 'Заявитель';

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex text-[#14213D] antialiased font-sans select-none overflow-x-hidden">
      
      <aside className="w-[260px] bg-[#063D31] text-slate-300 flex-col justify-between shrink-0 hidden md:flex border-r border-slate-800 relative z-20">
        <div className="flex flex-col">
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#049460] flex items-center justify-center text-white shadow-lg">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-sm leading-tight block">Сервис заявок</span>
              <span className="text-[10px] text-slate-400 block font-semibold tracking-wider uppercase">Service Desk CRM</span>
            </div>
          </div>

          <div className="px-3 py-4 space-y-6">
            <div>
              <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Управление</span>
              <nav className="space-y-1">
                {[
                  { id: 'home', icon: Home, label: 'Главная' },
                  { id: 'requests_all', icon: List, label: 'Все заявки' },
                  { id: 'requests_mine', icon: UserCheck, label: 'Мои заявки' },
                  ...(user.role === 'manager' ? [{ id: 'requests_archive', icon: Archive, label: 'Архив' }] : []),
                  { id: 'team', icon: Users, label: 'Команда' },
                  { id: 'analytics', icon: BarChart3, label: 'Аналитика' },
                  { id: 'settings', icon: Settings, label: 'Настройки' },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => { setView(id as any); setSelectedRequestId(null); if (id === 'requests_archive') fetchArchivedRequests(); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      view === id ? 'bg-[#0F6C53] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#049460] flex items-center justify-center text-white font-bold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs text-white block truncate">{user.name}</span>
              <span className="text-[10px] text-slate-400 block truncate">{roleLabel}</span>
            </div>
            <button onClick={handleLogout} title="Выйти" className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="city-bg-container flex-1 min-h-screen flex flex-col relative overflow-x-hidden">
        <div className="absolute inset-0 bg-[#0F172A]/78 backdrop-blur-[1.5px] pointer-events-none" />

        <header className="sticky top-0 z-30 bg-white/95 border-b border-slate-100 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm relative">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 md:hidden">
              <Inbox className="w-5 h-5 text-[#049460]" />
            </button>
            <h2 className="text-sm font-bold text-[#14213D] leading-tight flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-1.5 h-3 bg-[#049460] rounded-full inline-block" />
              {view === 'home' && 'Главная'}
              {view === 'requests_all' && 'Все входящие обращения'}
              {view === 'requests_mine' && 'Мои заявки'}
              {view === 'requests_archive' && 'Архив закрытых заявок'}
              {view === 'team' && 'Команда Service Desk'}
              {view === 'analytics' && 'Статистический мониторинг'}
              {view === 'settings' && 'Конфигурация'}
              {view === 'create_request' && 'Регистрация инцидента'}
              {view === 'details_request' && 'Панель обработки'}
            </h2>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="relative hidden lg:block w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text" placeholder="Глобальный поиск..." value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 focus:border-[#049460] outline-none rounded-lg text-xs text-slate-900 placeholder:text-slate-400 transition focus:bg-white"
              />
            </div>

            <button onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-600 relative transition-all">
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D84A5A] rounded-full ring-2 ring-white" />}
            </button>

            <div className="flex items-center gap-2 border-l border-slate-200/80 pl-3">
              <button
                onClick={() => { setView('create_request'); setSelectedRequestId(null); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#049460] hover:bg-[#078454] text-white font-bold rounded-lg text-xs transition shadow-md">
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Создать заявку</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow p-4 sm:p-6 relative z-10">
          {error && (
            <div className="bg-[#D84A5A]/10 border border-[#D84A5A]/30 text-[#D84A5A] rounded-xl p-4 mb-6 flex gap-3 items-start">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold">Проблема:</span> {error}.
                <button onClick={fetchRequests} className="ml-3 underline font-bold">Повторить</button>
              </div>
            </div>
          )}

          {isLoading && requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-9 h-9 border-3 border-[#049460] border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-xs font-semibold drop-shadow-md">Загрузка...</p>
            </div>
          ) : (
            <div>
              {view === 'home' && (
                <HomeView
                  requests={requests} archivedCount={archivedRequests.length} globalSearch={globalSearch}
                  onSelectRequest={(id) => { setSelectedRequestId(id); setDetailsSource('active'); setView('details_request'); }}
                  onNavigate={(v) => {
                    if (v === 'create') setView('create_request');
                    else if (v === 'list') setView('requests_all');
                    else if (v === 'archive') { setView('requests_archive'); fetchArchivedRequests(); }
                    else setView(v as any);
                  }}
                />
              )}
              {view === 'requests_all' && (
                <RequestList requests={requests}
                  onSelectRequest={(id) => { setSelectedRequestId(id); setDetailsSource('active'); setView('details_request'); }}
                  onNavigateHome={() => setView('home')} />
              )}
              {view === 'requests_mine' && (
                <RequestList requests={requests.filter(r => user.role === 'executor' ? r.assignee === user.name : r.requester_email === user.email)} mineFilterOnly={true}
                  onSelectRequest={(id) => { setSelectedRequestId(id); setDetailsSource('active'); setView('details_request'); }}
                  onNavigateHome={() => setView('home')} />
              )}
              {view === 'requests_archive' && (
                <ArchiveList requests={archivedRequests} isLoading={isArchiveLoading}
                  onSelectRequest={(id) => { setSelectedRequestId(id); setDetailsSource('archive'); setView('details_request'); }}
                  onNavigateHome={() => setView('home')} />
              )}
              {view === 'team' && (
                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                  <h3 className="text-base font-bold text-[#14213D] mb-2 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#049460]" />Инженерный состав
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    {TEAM_MEMBERS.map((m, idx) => (
                      <div key={idx} className="bg-[#F6F8FB]/50 border border-slate-100 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <img src={m.avatar} className="w-11 h-11 rounded-full object-cover" alt={m.name} />
                          <div>
                            <h4 className="font-bold text-xs text-[#14213D]">{m.name}</h4>
                            <p className="text-[10px] text-slate-400">{m.role}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {view === 'analytics' && (
                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                  <h3 className="text-base font-bold text-[#14213D] mb-2 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#049460]" />Аналитика SLA
                  </h3>
                  <div className="p-4 bg-[#F6F8FB]/50 rounded-xl flex flex-col justify-center items-center h-64">
                    <Clock className="w-10 h-10 text-[#049460] mb-2" />
                    <span className="font-bold text-xs text-[#14213D]">Всего обработано: {requests.length}</span>
                  </div>
                </div>
              )}
              {view === 'settings' && (
                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                  <h3 className="text-base font-bold text-[#14213D] mb-2 uppercase tracking-wider flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#049460]" />Настройки
                  </h3>
                  <div className="mt-4 text-xs space-y-2">
                    <div className="flex justify-between p-2 border-b border-slate-100"><span>СУБД:</span><span className="font-bold">SQLite</span></div>
                    <div className="flex justify-between p-2 border-b border-slate-100"><span>Текущий пользователь:</span><span className="font-bold">{user.email}</span></div>
                    <div className="flex justify-between p-2"><span>Роль:</span><span className="font-bold">{roleLabel}</span></div>
                  </div>
                </div>
              )}
              {view === 'create_request' && (
                <CreateRequestForm onAddRequest={handleAddRequest}
                  onNavigateHome={() => setView('home')}
                  onNavigateList={() => setView('requests_all')} />
              )}
              {view === 'details_request' && selectedRequest && (
                <RequestDetails request={selectedRequest} readOnly={isArchivedDetails || user.role === 'requester'}
                  onUpdateStatusAndComment={handleUpdateStatusAndComment}
                  onBackToList={() => { setView(isArchivedDetails ? 'requests_archive' : 'requests_all'); setSelectedRequestId(null); setDetailsSource('active'); }} />
              )}
            </div>
          )}
        </main>

        <footer className="py-4.5 relative z-10 text-center">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span>БД: <code className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[#049460] font-mono">data.sqlite</code></span>
            </div>
            <div>© {new Date().getFullYear()} Сервис заявок</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Онлайн</span>
            </div>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }}
            className="fixed inset-y-0 left-0 w-[260px] bg-[#063D31] text-slate-300 z-50 flex flex-col justify-between shadow-2xl md:hidden">
            <div className="p-3 space-y-1 mt-4">
              <button onClick={() => { setView('home'); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs text-slate-300 hover:bg-white/10 rounded-lg"><Home className="w-4 h-4" />Главная</button>
              <button onClick={() => { setView('requests_all'); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs text-slate-300 hover:bg-white/10 rounded-lg"><List className="w-4 h-4" />Все заявки</button>
              <button onClick={() => { setView('requests_mine'); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs text-slate-300 hover:bg-white/10 rounded-lg"><UserCheck className="w-4 h-4" />Мои заявки</button>
              <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs text-red-300 hover:bg-white/10 rounded-lg"><LogOut className="w-4 h-4" />Выйти</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}