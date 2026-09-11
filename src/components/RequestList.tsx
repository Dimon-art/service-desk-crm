import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  AlertTriangle,
  MoreHorizontal,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';
import { SupportRequest, RequestStatus } from '../types';
import { TEAM_MEMBERS } from '../App';
import { getStatusLabel, STATUS_LABELS_PLURAL } from '../statusLabels';
import { ALL_STATUSES } from '../lifecycle';

interface RequestListProps {
  requests: SupportRequest[];
  mineFilterOnly?: boolean;
  onSelectRequest: (id: number) => void;
  onNavigateHome: () => void;
}

const STATUS_BADGE_CLASS: Record<RequestStatus, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  assigned: 'bg-orange-50 text-orange-700 border-orange-200',
  in_progress: 'bg-amber-50 text-[#E48A19] border-amber-200',
  need_info: 'bg-purple-50 text-[#8457D8] border-purple-200',
  completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  awaiting_confirmation: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-teal-50 text-teal-700 border-teal-200',
  closed: 'bg-emerald-50 text-[#159570] border-emerald-200',
};

export default function RequestList({
  requests,
  mineFilterOnly = false,
  onSelectRequest,
  onNavigateHome,
}: RequestListProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all' | 'overdue'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'Высокий' | 'Средний' | 'Низкий'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const extendedRequests = requests.map((req) => {
    let priority: 'Высокий' | 'Средний' | 'Низкий' = 'Средний';
    if (req.id % 3 === 0) priority = 'Высокий';
    else if (req.id % 3 === 2) priority = 'Низкий';

    const assignee = req.assignee?.trim() || 'Не назначен';
    const createdDate = new Date(req.created_at);
    let deadlineDate = new Date(createdDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const isOverdue = req.status !== 'closed' && req.id % 5 === 0;
    if (isOverdue) {
      deadlineDate = new Date(createdDate.getTime() - 1 * 24 * 60 * 60 * 1000);
    }

    return { ...req, priority, assignee, deadline: deadlineDate, isOverdue };
  });

  const query = localSearch.toLowerCase().trim();
  const filteredRequests = extendedRequests.filter((req) => {
    if (mineFilterOnly && req.assignee !== 'Дмитрий Петров') return false;

    const matchesSearch =
      req.title.toLowerCase().includes(query) ||
      req.requester_name.toLowerCase().includes(query) ||
      req.description.toLowerCase().includes(query) ||
      req.assignee.toLowerCase().includes(query) ||
      req.id.toString() === query;

    let matchesStatus = true;
    if (statusFilter === 'overdue') {
      matchesStatus = req.isOverdue;
    } else if (statusFilter !== 'all') {
      matchesStatus = req.status === statusFilter;
    }

    const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'all' || req.assignee === assigneeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const formatDeadline = (date: Date, isOverdue: boolean) => {
    if (isOverdue) {
      return `Просрочен (${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })})`;
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#4D83FF] transition uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Вернуться на главную
          </button>
          <h2 className="text-base font-extrabold text-[#14213D] uppercase tracking-wider">
            {mineFilterOnly
              ? 'Мои персональные заявки (Исполнитель: Дмитрий Петров)'
              : 'Все зарегистрированные заявки'}
          </h2>
          <p className="text-xs text-slate-400 font-light">
            {mineFilterOnly
              ? 'Список инцидентов, закрепленных за вашим профилем инженера.'
              : 'Интегральный реестр входящих обращений в службу Service Desk.'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 font-mono bg-[#F6F8FB] border px-3 py-1.5 rounded-lg">
          <ShieldAlert className="w-3.5 h-3.5 text-[#4D83FF]" />
          <span>ПАНЕЛЬ МЕНЕДЖЕРА SLA</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по теме, автору, описанию или номеру заявки..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg text-xs"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus | 'all' | 'overdue')}
              className="border rounded-lg px-2.5 py-1"
            >
              <option value="all">Все статусы</option>
              {ALL_STATUSES.map((status) => (
                <option key={status} value={status}>{STATUS_LABELS_PLURAL[status]}</option>
              ))}
              <option value="overdue">Просроченные</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
              className="border rounded-lg px-2.5 py-1"
            >
              <option value="all">Все приоритеты</option>
              <option value="Высокий">Высокий</option>
              <option value="Средний">Средний</option>
              <option value="Низкий">Низкий</option>
            </select>
            {!mineFilterOnly && (
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="border rounded-lg px-2.5 py-1"
              >
                <option value="all">Все исполнители</option>
                {TEAM_MEMBERS.map((m) => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-slate-400 uppercase text-[10px]">
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
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Нет заявок в выбранной категории
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50 cursor-pointer border-b border-slate-50"
                    onClick={() => onSelectRequest(req.id)}
                  >
                    <td className="py-3 px-2 font-mono text-[#4D83FF] font-bold">#{req.id}</td>
                    <td className="py-3 px-3 font-bold truncate max-w-[200px]">{req.title}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold">{req.requester_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{req.requester_email}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold">{req.assignee}</td>
                    <td className="py-3 px-3">{req.priority}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${STATUS_BADGE_CLASS[req.status]}`}>
                        {getStatusLabel(req.status)}
                      </span>
                    </td>
                    <td className={`py-3 px-3 ${req.isOverdue ? 'text-[#D84A5A] font-bold' : ''}`}>
                      {req.isOverdue && <AlertTriangle className="w-3.5 h-3.5 inline" />}
                      {formatDeadline(req.deadline, req.isOverdue)}
                    </td>
                    <td className="py-3 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setActiveMenuId(req.id)} className="p-1">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {activeMenuId === req.id && (
                        <button
                          onClick={() => { onSelectRequest(req.id); setActiveMenuId(null); }}
                          className="block w-full text-left px-3 py-1 hover:bg-slate-50"
                        >
                          Управление
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
