import React, { useState } from 'react';
import { 
  Inbox, 
  Zap, 
  Play, 
  Info, 
  Check, 
  CheckCircle, 
  AlertTriangle, 
  PlusCircle, 
  List, 
  Search, 
  User, 
  SlidersHorizontal, 
  MoreHorizontal, 
  Clock, 
  ArrowRight,
  MessageSquare,
  Users,
  Activity,
  ChevronRight,
  Database,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { SupportRequest, RequestStatus } from '../types';
import { TEAM_MEMBERS } from '../App';

interface HomeViewProps {
  requests: SupportRequest[];
  globalSearch: string;
  onSelectRequest: (id: number) => void;
  onNavigate: (view: string) => void;
}

export default function HomeView({ requests, globalSearch, onSelectRequest, onNavigate }: HomeViewProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all' | 'overdue'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'Высокий' | 'Средний' | 'Низкий'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Computed virtual extensions for requests
  const extendedRequests = requests.map(req => {
    // 1. Priority
    let priority: 'Высокий' | 'Средний' | 'Низкий' = 'Средний';
    if (req.id % 3 === 0) priority = 'Высокий';
    else if (req.id % 3 === 2) priority = 'Низкий';

    // 2. Assignee
    const memberIdx = req.id % 4;
    const assignee = TEAM_MEMBERS[memberIdx].name;

    // 3. Status overrides (virtual "На проверке")
    let displayStatus: RequestStatus | 'on_verification' = req.status;
    if (req.status === 'in_progress' && req.id % 3 === 0) {
      displayStatus = 'on_verification';
    }

    // 4. Overdue (virtual deadline)
    const createdDate = new Date(req.created_at);
    let deadlineDate = new Date(createdDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days after creation
    const isOverdue = req.status !== 'closed' && req.id % 5 === 0;
    if (isOverdue) {
      deadlineDate = new Date(createdDate.getTime() - 1 * 24 * 60 * 60 * 1000); // overdue by 1 day
    }

    return {
      ...req,
      priority,
      assignee,
      displayStatus,
      deadline: deadlineDate,
      isOverdue
    };
  });

  // KPI Calculations
  const totalCount = extendedRequests.length;
  const newCount = extendedRequests.filter(r => r.displayStatus === 'new').length;
  const inProgressCount = extendedRequests.filter(r => r.displayStatus === 'in_progress').length;
  const needInfoCount = extendedRequests.filter(r => r.displayStatus === 'need_info').length;
  const onVerificationCount = extendedRequests.filter(r => r.displayStatus === 'on_verification').length;
  const closedCount = extendedRequests.filter(r => r.displayStatus === 'closed').length;
  const overdueCount = extendedRequests.filter(r => r.isOverdue).length;

  // Search filter implementation
  const effectiveQuery = (localSearch || globalSearch).toLowerCase().trim();
  const filteredRequests = extendedRequests.filter(req => {
    // Search
    const matchesSearch = 
      req.title.toLowerCase().includes(effectiveQuery) ||
      req.requester_name.toLowerCase().includes(effectiveQuery) ||
      req.description.toLowerCase().includes(effectiveQuery) ||
      req.assignee.toLowerCase().includes(effectiveQuery) ||
      req.id.toString() === effectiveQuery;

    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'overdue') {
      matchesStatus = req.isOverdue;
    } else if (statusFilter !== 'all') {
      if (statusFilter === 'in_progress') {
        matchesStatus = req.displayStatus === 'in_progress';
      } else {
        matchesStatus = req.displayStatus === statusFilter;
      }
    }

    // Priority filter
    const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;

    // Assignee filter
    const matchesAssignee = assigneeFilter === 'all' || req.assignee === assigneeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  // Format deadline date cleanly
  const formatDeadline = (date: Date, isOverdue: boolean) => {
    if (isOverdue) {
      return `Просрочен (${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })})`;
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Human friendly relative time
  const formatCreatedTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Simulated activity feed based on current requests
  const activityFeed = extendedRequests.slice(0, 4).map((req, idx) => {
    const timeText = idx === 0 ? '5 мин. назад' : idx === 1 ? '45 мин. назад' : idx === 2 ? '2 часа назад' : 'Вчера';
    if (req.status === 'closed') {
      return {
        id: req.id,
        text: `Инцидент #${req.id} закрыт инженером ${req.assignee}`,
        subtext: req.title,
        time: timeText,
        type: 'closed'
      };
    } else if (req.status === 'in_progress') {
      return {
        id: req.id,
        text: `${req.assignee} принял в работу обращение #${req.id}`,
        subtext: req.title,
        time: timeText,
        type: 'in_progress'
      };
    } else {
      return {
        id: req.id,
        text: `Зарегистрирована новая заявка #${req.id} от ${req.requester_name}`,
        subtext: req.title,
        time: timeText,
        type: 'new'
      };
    }
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Заголовок страницы и аккуратный верхний информационный блок */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-md border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#14213D]">
            Сервис заявок
          </h1>
          <p className="text-xs text-[#64748B] font-light max-w-xl">
            Контролируйте обращения, сроки и нагрузку команды. Мониторинг инцидентов и обработка заявок Service Desk.
          </p>
        </div>

        {/* Две основные кнопки */}
        <div className="flex flex-wrap gap-2.5 relative z-10 shrink-0">
          <button
            onClick={() => onNavigate('create')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#4D83FF] hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-500/10"
          >
            <PlusCircle className="w-4 h-4" />
            + Создать заявку
          </button>
          <button
            onClick={() => onNavigate('list')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-[#14213D] border border-slate-200/60 font-bold rounded-xl text-xs transition-all"
          >
            <List className="w-4 h-4 text-slate-500" />
            Открыть список заявок
          </button>
        </div>
      </div>

      {/* 2. Статистика (под заголовком, компактные карточки) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Карточка 1: Всего заявок */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/80 hover:border-[#4D83FF]/30 transition group flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide">Всего</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#4D83FF] flex items-center justify-center">
              <Inbox className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#14213D] tracking-tight leading-none">{totalCount}</div>
            <span className="text-[9px] text-slate-400 font-medium block mt-1">Всего в реестре</span>
          </div>
        </div>

        {/* Карточка 2: Новые */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/80 hover:border-[#4D83FF]/30 transition group flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wide">Новые</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-blue-600 tracking-tight leading-none">{newCount}</div>
            <span className="text-[9px] text-slate-400 font-medium block mt-1">Ожидают разбора</span>
          </div>
        </div>

        {/* Карточка 3: В работе */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/80 hover:border-[#E48A19]/30 transition group flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">В работе</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <Play className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-600 tracking-tight leading-none">{inProgressCount}</div>
            <span className="text-[9px] text-slate-400 font-medium block mt-1">В процессе решения</span>
          </div>
        </div>

        {/* Карточка 4: Нужна информация */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/80 hover:border-purple-100 transition group flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wide">Инфо</span>
            <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center">
              <Info className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-purple-600 tracking-tight leading-none">{needInfoCount}</div>
            <span className="text-[9px] text-slate-400 font-medium block mt-1">Ждем ответа автора</span>
          </div>
        </div>

        {/* Карточка 5: На проверке */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/80 hover:border-indigo-100 transition group flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">Проверка</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-indigo-600 tracking-tight leading-none">{onVerificationCount}</div>
            <span className="text-[9px] text-slate-400 font-medium block mt-1">Тестирование L2</span>
          </div>
        </div>

        {/* Карточка 6: Закрыты */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/80 hover:border-emerald-100 transition group flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Закрыты</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600 tracking-tight leading-none">{closedCount}</div>
            <span className="text-[9px] text-slate-400 font-medium block mt-1">Завершено успешно</span>
          </div>
        </div>

        {/* Карточка 7: Просрочены (выделена светлым красным оттенком) */}
        <div className="bg-red-50 rounded-2xl p-4 shadow-sm border border-red-200/60 hover:border-red-300 transition group flex flex-col justify-between h-[105px] text-red-900">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-[#D84A5A] uppercase tracking-wide">Просрочены</span>
            <div className="w-6 h-6 rounded-lg bg-[#D84A5A]/10 text-[#D84A5A] flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#D84A5A] tracking-tight leading-none">{overdueCount}</div>
            <span className="text-[9px] text-red-500/80 font-semibold block mt-1">Нарушен SLA</span>
          </div>
        </div>
      </div>

      {/* 3. Двухколонный рабочий блок (Таблица + Правая колонка) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Левая колонка (Таблица заявок) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-md border border-slate-100 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-[#14213D] uppercase tracking-wider">
                Последние заявки
              </h3>
              <p className="text-xs text-[#64748B] font-light">
                Список обращений с фильтрацией по статусу, исполнителю и критичности.
              </p>
            </div>
            
            {/* Локальная строка поиска */}
            <div className="relative w-full sm:w-56 shrink-0">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск по заявкам..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 focus:border-[#4D83FF] outline-none rounded-lg text-xs text-[#14213D] placeholder:text-slate-400 transition"
              />
            </div>
          </div>

          {/* Фильтры по статусу, приоритету и исполнителю */}
          <div className="flex flex-wrap items-center gap-2 bg-[#F6F8FB]/80 p-3 rounded-xl border border-slate-100 text-xs">
            <div className="flex items-center gap-1 text-slate-500 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="font-semibold text-[10px] uppercase tracking-wider">Фильтры:</span>
            </div>

            {/* Статус */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-slate-200/70 text-slate-700 px-2.5 py-1 rounded-lg outline-none focus:border-[#4D83FF] font-medium"
            >
              <option value="all">Все статусы</option>
              <option value="new">Новые</option>
              <option value="in_progress">В работе</option>
              <option value="need_info">Нужна информация</option>
              <option value="on_verification">На проверке</option>
              <option value="closed">Закрытые</option>
              <option value="overdue">Просроченные</option>
            </select>

            {/* Приоритет */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="bg-white border border-slate-200/70 text-slate-700 px-2.5 py-1 rounded-lg outline-none focus:border-[#4D83FF] font-medium"
            >
              <option value="all">Все приоритеты</option>
              <option value="Высокий">Высокий приоритет</option>
              <option value="Средний">Средний приоритет</option>
              <option value="Низкий">Низкий приоритет</option>
            </select>

            {/* Исполнитель */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="bg-white border border-slate-200/70 text-slate-700 px-2.5 py-1 rounded-lg outline-none focus:border-[#4D83FF] font-medium"
            >
              <option value="all">Все исполнители</option>
              {TEAM_MEMBERS.map(m => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>

            {/* Очистить фильтры */}
            {(statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all' || localSearch) && (
              <button 
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setAssigneeFilter('all');
                  setLocalSearch('');
                }}
                className="text-[10px] text-[#D84A5A] hover:underline font-bold uppercase ml-auto"
              >
                Сбросить
              </button>
            )}
          </div>

          {/* Таблица */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-2">№</th>
                  <th className="py-3 px-3">Тема</th>
                  <th className="py-3 px-3">Автор</th>
                  <th className="py-3 px-3">Ответственный</th>
                  <th className="py-3 px-3">Приоритет</th>
                  <th className="py-3 px-3">Статус</th>
                  <th className="py-3 px-3">Срок</th>
                  <th className="py-3 px-2 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#64748B] font-light">
                      Нет заявок, соответствующих критериям фильтрации
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map(req => {
                    // Badge styling
                    let badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                    let badgeText = 'Новая';
                    if (req.displayStatus === 'in_progress') {
                      badgeClass = 'bg-amber-50 text-[#E48A19] border-amber-200';
                      badgeText = 'В работе';
                    } else if (req.displayStatus === 'need_info') {
                      badgeClass = 'bg-purple-50 text-[#8457D8] border-purple-200';
                      badgeText = 'Ожидание';
                    } else if (req.displayStatus === 'on_verification') {
                      badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                      badgeText = 'Проверка';
                    } else if (req.displayStatus === 'closed') {
                      badgeClass = 'bg-emerald-50 text-[#159570] border-emerald-200';
                      badgeText = 'Закрыта';
                    }

                    // Priority point styling
                    let priorityDot = 'bg-[#159570]'; // низкий
                    if (req.priority === 'Высокий') priorityDot = 'bg-[#D84A5A]';
                    else if (req.priority === 'Средний') priorityDot = 'bg-[#E48A19]';

                    return (
                      <tr 
                        key={req.id}
                        className="hover:bg-slate-50/65 transition-colors group cursor-pointer"
                        onClick={() => onSelectRequest(req.id)}
                      >
                        {/* Кликабельный синий номер */}
                        <td className="py-3 px-2 font-mono text-[#4D83FF] hover:underline font-extrabold text-[11px]">
                          #{req.id}
                        </td>
                        
                        {/* Тема */}
                        <td className="py-3 px-3 max-w-[180px] truncate font-bold text-[#14213D] group-hover:text-[#4D83FF] transition-colors">
                          {req.title}
                        </td>

                        {/* Автор */}
                        <td className="py-3 px-3 text-[#64748B]">
                          {req.requester_name}
                        </td>

                        {/* Ответственный */}
                        <td className="py-3 px-3 font-semibold text-[#14213D]">
                          {req.assignee}
                        </td>

                        {/* Приоритет с цветной точкой */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-[#14213D]">
                            <span className={`w-2 h-2 rounded-full ${priorityDot}`} />
                            {req.priority}
                          </span>
                        </td>

                        {/* Статус (badge) */}
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wider ${badgeClass}`}>
                            {badgeText}
                          </span>
                        </td>

                        {/* Срок (красный если просрочен) */}
                        <td className={`py-3 px-3 font-semibold ${req.isOverdue ? 'text-[#D84A5A] font-extrabold flex items-center gap-1' : 'text-[#64748B]'}`}>
                          {req.isOverdue && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                          {formatDeadline(req.deadline, req.isOverdue)}
                        </td>

                        {/* Меню действий «⋯» */}
                        <td className="py-3 px-2 text-right relative" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setActiveMenuId(activeMenuId === req.id ? null : req.id)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {activeMenuId === req.id && (
                            <div className="absolute right-2 mt-1 w-36 bg-white border border-slate-100 rounded-lg shadow-lg py-1 z-50 text-left">
                              <button 
                                onClick={() => { onSelectRequest(req.id); setActiveMenuId(null); }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                              >
                                Открыть
                              </button>
                              <button 
                                onClick={() => { onNavigate('create'); setActiveMenuId(null); }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-[#4D83FF] font-semibold"
                              >
                                Клон-форма
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Правая колонка (Последняя активность & Быстрые действия) */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Блок «Последняя активность» */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 space-y-4">
            <h3 className="text-xs font-bold text-[#14213D] uppercase tracking-wider pb-2.5 border-b border-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#4D83FF]" />
              Последняя активность
            </h3>
            
            <div className="space-y-4">
              {activityFeed.length === 0 ? (
                <p className="text-[11px] text-slate-400 font-light">Активность пока отсутствует</p>
              ) : (
                activityFeed.map((act, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-[#4D83FF]" />
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-[11px] leading-relaxed font-bold text-[#14213D]">
                        {act.text}
                      </p>
                      <p className="text-[10px] text-[#64748B] truncate">
                        {act.subtext}
                      </p>
                      <span className="text-[9px] text-slate-400 font-mono block">
                        {act.time}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Блок «Быстрые действия» */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 space-y-3.5">
            <h3 className="text-xs font-bold text-[#14213D] uppercase tracking-wider pb-2.5 border-b border-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#4D83FF]" />
              Быстрые действия
            </h3>

            <div className="grid grid-cols-1 gap-2 text-xs">
              <button 
                onClick={() => onNavigate('create')}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50/40 border border-slate-100 hover:border-[#4D83FF]/30 transition group"
              >
                <span className="font-bold text-[#14213D] group-hover:text-[#4D83FF] transition block">Создать заявку</span>
                <span className="text-[10px] text-slate-400">Открыть форму регистрации обращения</span>
              </button>
              <button 
                onClick={() => onNavigate('requests_mine')}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50/40 border border-slate-100 hover:border-[#4D83FF]/30 transition group"
              >
                <span className="font-bold text-[#14213D] group-hover:text-[#4D83FF] transition block">Открыть мои заявки</span>
                <span className="text-[10px] text-slate-400">Показать назначенные на меня обращения</span>
              </button>
              <button 
                onClick={() => { setStatusFilter('overdue'); }}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-red-50/30 border border-slate-100 hover:border-red-300/30 transition group"
              >
                <span className="font-bold text-[#D84A5A] block">Показать просроченные</span>
                <span className="text-[10px] text-slate-400">Включить фильтрацию по нарушениям SLA</span>
              </button>
              <button 
                onClick={() => onNavigate('analytics')}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50/40 border border-slate-100 hover:border-[#4D83FF]/30 transition group"
              >
                <span className="font-bold text-[#14213D] group-hover:text-[#4D83FF] transition block">Посмотреть аналитику</span>
                <span className="text-[10px] text-slate-400">Перейти к графикам эффективности SLA</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
