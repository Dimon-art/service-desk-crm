import React, { useState, useEffect } from 'react';
import { 
  Home, 
  PlusCircle, 
  List, 
  Server, 
  AlertCircle, 
  Inbox, 
  Activity, 
  CheckCircle, 
  Bell, 
  Settings, 
  Users, 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  MoreHorizontal, 
  UserCheck, 
  Search, 
  ChevronRight, 
  ArrowLeft, 
  MessageSquare, 
  Calendar, 
  Mail, 
  User, 
  Zap, 
  Check, 
  BookOpen, 
  ShieldCheck, 
  Database,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SupportRequest, CreateRequestInput, RequestStatus } from './types';
import HomeView from './components/HomeView.redesign';
import CreateRequestForm from './components/CreateRequestForm';
import RequestList from './components/RequestList';
import RequestDetails from './components/RequestDetails';

// Mock list of team members for display (deterministic selection based on request ID)
export const TEAM_MEMBERS = [
  { name: 'Дмитрий Петров', role: 'Ведущий инженер', email: 'd.petrov@servicedesk.ru', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', status: 'online' },
  { name: 'Алексей Иванов', role: 'Инженер поддержки L2', email: 'a.ivanov@servicedesk.ru', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80', status: 'online' },
  { name: 'Мария Сидорова', role: 'Специалист поддержки L1', email: 'm.sidorova@servicedesk.ru', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', status: 'away' },
  { name: 'Елена Козлова', role: 'Диспетчер обращений', email: 'e.kozlova@servicedesk.ru', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80', status: 'offline' }
];

export default function App() {
  const [view, setView] = useState<'home' | 'requests_all' | 'requests_mine' | 'team' | 'analytics' | 'settings' | 'create_request' | 'details_request'>('home');
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [notifications, setNotifications] = useState<{ id: number; text: string; time: string; read: boolean }[]>([
    { id: 1, text: 'Создана новая заявка #1 "масло моторное"', time: '10 мин. назад', read: false },
    { id: 2, text: 'Статус заявки #1 изменен на "В работе"', time: '5 мин. назад', read: false },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch all requests from backend on startup
  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/requests', {
        headers: { 'x-manager-token': 'manager' }
      });
      if (!response.ok) {
        throw new Error('Ошибка при загрузке заявок с сервера');
      }
      const data = await response.json();
      setRequests(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Handle request creation
  const handleAddRequest = async (input: CreateRequestInput): Promise<SupportRequest> => {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      let errMsg = 'Ошибка при создании заявки';
      try {
        const errData = await response.json();
        errMsg = errData.error || errMsg;
      } catch {
        errMsg = `Ошибка сервера (${response.status})`;
      }
      throw new Error(errMsg);
    }

    const created: SupportRequest = await response.json();
    setRequests((prev) => [created, ...prev]);
    // Add real notification
    setNotifications(prev => [
      { id: Date.now(), text: `Создана новая заявка #${created.id} "${created.title}"`, time: 'Только что', read: false },
      ...prev
    ]);
    return created;
  };

  // Handle request status & comment updates
  const handleUpdateStatusAndComment = async (
    id: number,
    status: RequestStatus,
    comment: string
  ): Promise<SupportRequest> => {
    const response = await fetch(`/api/requests/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-manager-token': 'manager'
      },
      body: JSON.stringify({ status, manager_comment: comment }),
    });

    if (!response.ok) {
      let errMsg = 'Ошибка при обновлении заявки';
      try {
        const errData = await response.json();
        errMsg = errData.error || errMsg;
      } catch {
        errMsg = `Ошибка сервера (${response.status})`;
      }
      throw new Error(errMsg);
    }

    const updated: SupportRequest = await response.json();
    setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    // Add real notification
    setNotifications(prev => [
      { id: Date.now(), text: `Статус заявки #${id} изменен на "${status === 'in_progress' ? 'В работе' : status === 'need_info' ? 'Ожидание' : status === 'closed' ? 'Закрыта' : 'Новая'}"`, time: 'Только что', read: false },
      ...prev
    ]);
    return updated;
  };

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

  const handleNotificationClick = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex text-[#14213D] antialiased font-sans select-none overflow-x-hidden">
      
      {/* 1. Слева: тёмный боковой сайдбар шириной 240 px */}
      <aside className="w-[260px] bg-[#063D31] text-slate-300 flex-col justify-between shrink-0 hidden md:flex border-r border-slate-800 relative z-20">
        <div className="flex flex-col">
          {/* Логотип */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#049460] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-sm leading-tight block">
                Сервис заявок
              </span>
              <span className="text-[10px] text-slate-400 block font-semibold tracking-wider uppercase">
                Service Desk CRM
              </span>
            </div>
          </div>

          {/* Навигационное меню */}
          <div className="px-3 py-4 space-y-6">
            <div>
              <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Управление обращениями
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => { setView('home'); setSelectedRequestId(null); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    view === 'home'
                      ? 'bg-[#0F6C53] text-white shadow-md shadow-emerald-900/10 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Главная</span>
                </button>
                <button
                  onClick={() => { setView('requests_all'); setSelectedRequestId(null); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    view === 'requests_all'
                      ? 'bg-[#0F6C53] text-white shadow-md shadow-emerald-900/10 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>Все заявки</span>
                </button>
                <button
                  onClick={() => { setView('requests_mine'); setSelectedRequestId(null); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    view === 'requests_mine'
                      ? 'bg-[#0F6C53] text-white shadow-md shadow-emerald-900/10 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Мои заявки</span>
                </button>
                <button
                  onClick={() => { setView('team'); setSelectedRequestId(null); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    view === 'team'
                      ? 'bg-[#0F6C53] text-white shadow-md shadow-emerald-900/10 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Команда</span>
                </button>
                <button
                  onClick={() => { setView('analytics'); setSelectedRequestId(null); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    view === 'analytics'
                      ? 'bg-[#0F6C53] text-white shadow-md shadow-emerald-900/10 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Аналитика</span>
                </button>
                <button
                  onClick={() => { setView('settings'); setSelectedRequestId(null); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    view === 'settings'
                      ? 'bg-[#0F6C53] text-white shadow-md shadow-emerald-900/10 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Настройки</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Профиль пользователя в нижней части сайдбара */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                className="w-9 h-9 rounded-full object-cover border border-[#049460]"
                alt="Аватар менеджера" 
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#172033]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs text-white block truncate">
                Дмитрий Петров
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                Ведущий инженер
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Справа: Основная контентная область с атмосферной панорамой Абу-Даби */}
      <div className="city-bg-container flex-1 min-h-screen flex flex-col relative overflow-x-hidden">
        {/* Темно-синий overlay с прозрачностью 70-82% */}
        <div className="absolute inset-0 bg-[#0F172A]/78 backdrop-blur-[1.5px] pointer-events-none" />

        {/* Шапка (Top Bar) с полупрозрачным размытием */}
        <header className="sticky top-0 z-30 bg-white/95 border-b border-slate-100 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm relative">
          
          {/* Заголовок страницы и гамбургер на мобильных */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 md:hidden"
            >
              <Inbox className="w-5 h-5 text-[#049460]" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-[#14213D] leading-tight flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-1.5 h-3 bg-[#049460] rounded-full inline-block" />
                {view === 'home' && 'Главная'}
                {view === 'requests_all' && 'Все входящие обращения'}
                {view === 'requests_mine' && 'Мои персональные заявки'}
                {view === 'team' && 'Команда Service Desk'}
                {view === 'analytics' && 'Статистический мониторинг'}
                {view === 'settings' && 'Конфигурация SLA'}
                {view === 'create_request' && 'Регистрация инцидента'}
                {view === 'details_request' && 'Панель обработки инцидента'}
              </h2>
            </div>
          </div>

          {/* Строка глобального поиска, уведомления, профиль и кнопка «+ Создать заявку» */}
          <div className="flex items-center gap-3.5">
            {/* Строка поиска */}
            <div className="relative hidden lg:block w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Глобальный поиск..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 focus:border-[#049460] outline-none rounded-lg text-xs text-slate-900 placeholder:text-slate-400 transition focus:bg-white"
              />
            </div>

            {/* Уведомления */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-600 relative transition-all"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D84A5A] rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2.5 w-72 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 p-1.5 text-xs"
                  >
                    <div className="p-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-[#14213D]">Уведомления ({unreadNotificationsCount})</span>
                      <button 
                        onClick={handleMarkAllNotificationsAsRead}
                        className="text-[10px] text-[#049460] hover:underline font-semibold"
                      >
                        Прочитать все
                      </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto py-1 space-y-1">
                      {notifications.map(notif => (
                        <div 
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif.id)}
                          className={`p-2 rounded-lg cursor-pointer transition ${notif.read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className={`font-medium ${notif.read ? 'text-slate-600' : 'text-slate-800 font-semibold'}`}>{notif.text}</span>
                            <span className="text-[9px] text-slate-400 shrink-0 font-mono">{notif.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Профиль для мобильных */}
            <div className="flex items-center gap-2 border-l border-slate-200/80 pl-3">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                className="w-8 h-8 rounded-lg object-cover border border-[#049460]/30 hidden sm:block"
                alt="Профиль" 
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => { setView('create_request'); setSelectedRequestId(null); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#049460] hover:bg-[#078454] text-white font-bold rounded-lg text-xs transition shadow-md shadow-blue-500/20"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Создать заявку</span>
              </button>
            </div>
          </div>
        </header>

        {/* Мобильное меню навигации */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="fixed inset-y-0 left-0 w-[260px] bg-[#063D31] text-slate-300 z-50 flex flex-col justify-between shadow-2xl md:hidden"
            >
              <div>
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8.5 h-8.5 rounded-lg bg-[#049460] flex items-center justify-center text-white font-bold">
                      СЗ
                    </div>
                    <span className="font-bold text-white text-sm">Сервис заявок</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="p-3 space-y-1">
                  <button
                    onClick={() => { setView('home'); setSelectedRequestId(null); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                      view === 'home' ? 'bg-[#049460] text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>Главная</span>
                  </button>
                  <button
                    onClick={() => { setView('requests_all'); setSelectedRequestId(null); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                      view === 'requests_all' ? 'bg-[#049460] text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span>Все заявки</span>
                  </button>
                  <button
                    onClick={() => { setView('requests_mine'); setSelectedRequestId(null); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                      view === 'requests_mine' ? 'bg-[#049460] text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Мои заявки</span>
                  </button>
                  <button
                    onClick={() => { setView('team'); setSelectedRequestId(null); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                      view === 'team' ? 'bg-[#049460] text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Команда</span>
                  </button>
                  <button
                    onClick={() => { setView('analytics'); setSelectedRequestId(null); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                      view === 'analytics' ? 'bg-[#049460] text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Аналитика</span>
                  </button>
                  <button
                    onClick={() => { setView('settings'); setSelectedRequestId(null); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                      view === 'settings' ? 'bg-[#049460] text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Настройки</span>
                  </button>
                </div>
              </div>
              <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                    className="w-8 h-8 rounded-full object-cover" 
                    alt="Дмитрий" 
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="font-bold text-xs text-white block">Дмитрий Петров</span>
                    <span className="text-[10px] text-slate-400 block">Администратор</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Рабочее пространство (Main Workspace) */}
        <main className="flex-grow p-4 sm:p-6 relative z-10">
          
          {/* Сообщение об ошибке соединения */}
          {error && (
            <div className="bg-[#D84A5A]/10 border border-[#D84A5A]/30 text-[#D84A5A] rounded-xl p-4 mb-6 flex gap-3 items-start backdrop-blur-md">
              <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold">Проблема синхронизации с базой:</span> {error}. Проверьте соединение с SQLite БД.
                <button
                  onClick={fetchRequests}
                  className="ml-3 underline font-bold text-red-700 hover:text-red-900"
                >
                  Повторить соединение
                </button>
              </div>
            </div>
          )}

          {/* Индикатор загрузки БД */}
          {isLoading && requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-9 h-9 border-3 border-[#049460] border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-xs font-semibold tracking-wide drop-shadow-md">
                Инициализация Service Desk SQLite БД...
              </p>
            </div>
          ) : (
            <div>
              {view === 'home' && (
                <HomeView
                  requests={requests}
                  globalSearch={globalSearch}
                  onSelectRequest={(id) => {
                    setSelectedRequestId(id);
                    setView('details_request');
                  }}
                  onNavigate={(v) => {
                    if (v === 'create') setView('create_request');
                    else if (v === 'list') setView('requests_all');
                    else setView(v as any);
                  }}
                />
              )}

              {view === 'requests_all' && (
                <RequestList
                  requests={requests}
                  onSelectRequest={(id) => {
                    setSelectedRequestId(id);
                    setView('details_request');
                  }}
                  onNavigateHome={() => setView('home')}
                />
              )}

              {view === 'requests_mine' && (
                <RequestList
                  requests={requests}
                  mineFilterOnly={true} // special filter
                  onSelectRequest={(id) => {
                    setSelectedRequestId(id);
                    setView('details_request');
                  }}
                  onNavigateHome={() => setView('home')}
                />
              )}

              {view === 'team' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                    <h3 className="text-base font-bold text-[#14213D] mb-2 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#049460]" />
                      Инженерный состав команды
                    </h3>
                    <p className="text-xs text-[#64748B] mb-6 font-light">
                      Текущий статус инженеров Service Desk, количество обрабатываемых тикетов и персональный SLA.
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {TEAM_MEMBERS.map((member, idx) => {
                        const memberRequests = requests.filter(r => r.status !== 'closed' && r.id % 4 === idx).length;
                        const score = 4.7 + (idx * 0.1);
                        return (
                          <div key={idx} className="bg-[#F6F8FB]/50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between hover:border-[#049460]/30 transition group">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img src={member.avatar} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" alt={member.name} referrerPolicy="no-referrer" />
                                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                  member.status === 'online' ? 'bg-emerald-500' : member.status === 'away' ? 'bg-amber-400' : 'bg-slate-300'
                                }`} />
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-[#14213D] group-hover:text-[#049460] transition">{member.name}</h4>
                                <p className="text-[10px] text-slate-400 font-medium">{member.role}</p>
                              </div>
                            </div>
                            <div className="mt-5 pt-3 border-t border-slate-200/50 space-y-1.5 text-[10px] text-slate-500 font-semibold uppercase">
                              <div className="flex justify-between">
                                <span>Активных задач:</span>
                                <span className="font-bold text-[#14213D]">{memberRequests} шт.</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Степень SLA:</span>
                                <span className="font-bold text-emerald-600">{score.toFixed(1)} / 5.0</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Почта:</span>
                                <span className="font-mono lowercase text-[9px] text-slate-400 font-normal">{member.email}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {view === 'analytics' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                    <h3 className="text-base font-bold text-[#14213D] mb-1 uppercase tracking-wider flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#049460]" />
                      Аналитика производительности SLA
                    </h3>
                    <p className="text-xs text-[#64748B] mb-6">
                      Количественный анализ зарегистрированных обращений, распределение нагрузки по статусам и критичности.
                    </p>
                    <div className="p-4 bg-[#F6F8FB]/50 rounded-xl border border-slate-100 flex flex-col justify-center items-center h-64 text-center">
                      <Clock className="w-10 h-10 text-[#049460] mb-2 animate-pulse" />
                      <span className="font-bold text-xs text-[#14213D]">Интерактивная статистика</span>
                      <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                        Всего обработано обращений: {requests.length}. Нагрузка на инженеров распределена равномерно. Среднее время закрытия инцидента — 2.4 часа.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {view === 'settings' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                    <h3 className="text-base font-bold text-[#14213D] mb-1 uppercase tracking-wider flex items-center gap-2">
                      <Settings className="w-5 h-5 text-[#049460]" />
                      Настройки SLA и Конфигурация системы
                    </h3>
                    <p className="text-xs text-[#64748B] mb-6">
                      Настройка рабочих регламентов, лимитов памяти, правил автоназначения исполнителей и шаблонов почтовых сообщений.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-6 text-xs">
                      <div className="space-y-4">
                        <h4 className="font-bold text-xs text-[#14213D] uppercase tracking-wide border-b border-slate-100 pb-1.5">Регламент критичности (SLA)</h4>
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center bg-[#F6F8FB] p-2.5 rounded-lg border border-slate-100">
                            <div>
                              <span className="font-bold text-[#14213D] block">Высокий приоритет</span>
                              <span className="text-[10px] text-slate-400">Реакция диспетчера до 15 минут</span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-red-100 text-[#D84A5A] font-bold text-[10px]">Решено</span>
                          </div>
                          <div className="flex justify-between items-center bg-[#F6F8FB] p-2.5 rounded-lg border border-slate-100">
                            <div>
                              <span className="font-bold text-[#14213D] block">Средний приоритет</span>
                              <span className="text-[10px] text-slate-400">Реакция диспетчера до 1 часа</span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-[#E48A19] font-bold text-[10px]">Решено</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-bold text-xs text-[#14213D] uppercase tracking-wide border-b border-slate-100 pb-1.5">Инфраструктура хранения</h4>
                        <div className="space-y-2 text-[11px] text-slate-500 font-medium uppercase">
                          <div className="flex justify-between items-center p-2 border-b border-slate-100">
                            <span>Тип СУБД:</span>
                            <span className="font-bold text-[#14213D]">SQLite (data.sqlite)</span>
                          </div>
                          <div className="flex justify-between items-center p-2 border-b border-slate-100">
                            <span>Режим очереди транзакций:</span>
                            <span className="font-bold text-emerald-600">Mutex Active</span>
                          </div>
                          <div className="flex justify-between items-center p-2">
                            <span>Размер пула памяти:</span>
                            <span className="font-bold text-[#14213D]">128 MB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {view === 'create_request' && (
                <CreateRequestForm
                  onAddRequest={handleAddRequest}
                  onNavigateHome={() => setView('home')}
                  onNavigateList={() => setView('requests_all')}
                />
              )}

              {view === 'details_request' && selectedRequest && (
                <RequestDetails
                  request={selectedRequest}
                  onUpdateStatusAndComment={handleUpdateStatusAndComment}
                  onBackToList={() => {
                    setView('requests_all');
                    setSelectedRequestId(null);
                  }}
                />
              )}
            </div>
          )}
        </main>

        {/* Скромный брендированный футер */}
        <footer className="py-4.5 relative z-10 text-center">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span>База данных: <code className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[#049460] font-mono lowercase font-normal">data.sqlite</code></span>
            </div>
            <div>
              <span>© {new Date().getFullYear()} Сервис заявок • Все права защищены</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Атомарная SQLite запись стабильна</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
