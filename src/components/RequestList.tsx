import React, { useState } from 'react';
import { 
  Inbox, 
  Search, 
  SlidersHorizontal, 
  AlertTriangle, 
  MoreHorizontal,
  ChevronRight,
  ArrowLeft,
  Mail,
  User,
  Calendar,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { SupportRequest, RequestStatus } from '../types';
import { TEAM_MEMBERS } from '../App';

interface RequestListProps {
  requests: SupportRequest[];
  mineFilterOnly?: boolean; // Filters strictly for "Р”РјРёС‚СЂРёР№ РџРµС‚СЂРѕРІ"
  onSelectRequest: (id: number) => void;
  onNavigateHome: () => void;
}

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

  // Extend requests deteministically with virtual SLA fields
  const extendedRequests = requests.map(req => {
    // 1. Priority
    let priority: 'Высокий' | 'Средний' | 'Низкий' = 'Средний';
    if (req.id % 3 === 0) priority = 'Высокий';
    else if (req.id % 3 === 2) priority = 'Низкий';

    // 2. Assignee
    const memberIdx = req.id % 4;
    const assignee = TEAM_MEMBERS[memberIdx].name;

    // 3. Display Status
    let displayStatus: RequestStatus | 'on_verification' = req.status;
    if (req.status === 'in_progress' && req.id % 3 === 0) {
      displayStatus = 'on_verification';
    }

    // 4. Overdue
    const createdDate = new Date(req.created_at);
    let deadlineDate = new Date(createdDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const isOverdue = req.status !== 'closed' && req.id % 5 === 0;
    if (isOverdue) {
      deadlineDate = new Date(createdDate.getTime() - 1 * 24 * 60 * 60 * 1000);
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

  // Filter implementation
  const query = localSearch.toLowerCase().trim();
  const filteredRequests = extendedRequests.filter(req => {
    // Global/Mine filter toggle
    if (mineFilterOnly && req.assignee !== 'Р”РјРёС‚СЂРёР№ РџРµС‚СЂРѕРІ') return false;

    // Search query
    const matchesSearch = 
      req.title.toLowerCase().includes(query) ||
      req.requester_name.toLowerCase().includes(query) ||
      req.description.toLowerCase().includes(query) ||
      req.assignee.toLowerCase().includes(query) ||
      req.id.toString() === query;

    // Status
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

    // Priority
    const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;

    // Assignee
    const matchesAssignee = assigneeFilter === 'all' || req.assignee === assigneeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const formatDeadline = (date: Date, isOverdue: boolean) => {
    if (isOverdue) {
      return `РџСЂРѕСЃСЂРѕС‡РµРЅ (${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })})`;
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-5">
      {/* РЁР°РїРєР° СЂР°Р·РґРµР»Р° */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#4D83FF] transition uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Р’РµСЂРЅСѓС‚СЊСЃСЏ РЅР° РіР»Р°РІРЅСѓСЋ
          </button>
          <h2 className="text-base font-extrabold text-[#14213D] uppercase tracking-wider">
            {mineFilterOnly ? 'РњРѕРё РїРµСЂСЃРѕРЅР°Р»СЊРЅС‹Рµ Р·Р°СЏРІРєРё (РСЃРїРѕР»РЅРёС‚РµР»СЊ: Р”РјРёС‚СЂРёР№ РџРµС‚СЂРѕРІ)' : 'Р’СЃРµ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅРЅС‹Рµ Р·Р°СЏРІРєРё'}
          </h2>
          <p className="text-xs text-slate-400 font-light">
            {mineFilterOnly 
              ? 'РЎРїРёСЃРѕРє РёРЅС†РёРґРµРЅС‚РѕРІ, Р·Р°РєСЂРµРїР»РµРЅРЅС‹С… Р·Р° РІР°С€РёРј РїСЂРѕС„РёР»РµРј РёРЅР¶РµРЅРµСЂР°.' 
              : 'РРЅС‚РµРіСЂР°Р»СЊРЅС‹Р№ СЂРµРµСЃС‚СЂ РІС…РѕРґСЏС‰РёС… РѕР±СЂР°С‰РµРЅРёР№ РІ СЃР»СѓР¶Р±Сѓ Service Desk.'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 font-mono bg-[#F6F8FB] border border-slate-200/60 px-3 py-1.5 rounded-lg shrink-0">
          <ShieldAlert className="w-3.5 h-3.5 text-[#4D83FF]" />
          <span>РџРђРќР•Р›Р¬ РњР•РќР•Р”Р–Р•Р Рђ SLA</span>
        </div>
      </div>

      {/* РРЅС‚РµСЂР°РєС‚РёРІРЅС‹Р№ СЂР°Р±РѕС‡РёР№ Р±Р»РѕРє СЂРµРµСЃС‚СЂР° */}
      <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 flex flex-col gap-4">
        
        {/* РџРѕРёСЃРє Рё С„РёР»СЊС‚СЂС‹ */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="РџРѕРёСЃРє РїРѕ С‚РµРјРµ, Р°РІС‚РѕСЂСѓ, РѕРїРёСЃР°РЅРёСЋ РёР»Рё РЅРѕРјРµСЂСѓ Р·Р°СЏРІРєРё..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 focus:border-[#4D83FF] outline-none rounded-lg text-xs text-[#14213D] placeholder:text-slate-400 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-slate-500 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="font-semibold text-[10px] uppercase tracking-wider">Р¤РёР»СЊС‚СЂС‹:</span>
            </div>

            {/* РЎС‚Р°С‚СѓСЃ */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-slate-200/70 text-slate-700 px-2.5 py-1 rounded-lg outline-none focus:border-[#4D83FF] font-medium"
            >
              <option value="all">Р’СЃРµ СЃС‚Р°С‚СѓСЃС‹</option>
              <option value="new">Новые</option>
              <option value="in_progress">В работе</option>
              <option value="need_info">РќСѓР¶РЅР° РёРЅС„РѕСЂРјР°С†РёСЏ</option>
              <option value="on_verification">На проверке</option>
              <option value="closed">Р—Р°РєСЂС‹С‚С‹Рµ</option>
              <option value="overdue">РџСЂРѕСЃСЂРѕС‡РµРЅРЅС‹Рµ</option>
            </select>

            {/* РџСЂРёРѕСЂРёС‚РµС‚ */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="bg-white border border-slate-200/70 text-slate-700 px-2.5 py-1 rounded-lg outline-none focus:border-[#4D83FF] font-medium"
            >
              <option value="all">Р’СЃРµ РїСЂРёРѕСЂРёС‚РµС‚С‹</option>
              <option value="Высокий">Высокий</option>
              <option value="Средний">Средний</option>
              <option value="Низкий">Низкий</option>
            </select>

            {/* РСЃРїРѕР»РЅРёС‚РµР»СЊ (СЃРєСЂС‹С‚Рѕ РµСЃР»Рё С„РёР»СЊС‚СЂ "РњРѕРё Р·Р°СЏРІРєРё") */}
            {!mineFilterOnly && (
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="bg-white border border-slate-200/70 text-slate-700 px-2.5 py-1 rounded-lg outline-none focus:border-[#4D83FF] font-medium"
              >
                <option value="all">Р’СЃРµ РёСЃРїРѕР»РЅРёС‚РµР»Рё</option>
                {TEAM_MEMBERS.map(m => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            )}

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
                РЎР±СЂРѕСЃРёС‚СЊ
              </button>
            )}
          </div>
        </div>

        {/* РЎРµС‚РєР° / РўР°Р±Р»РёС†Р° */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-2">в„– Р·Р°СЏРІРєРё</th>
                <th className="py-3 px-3">РўРµРјР°</th>
                <th className="py-3 px-3">РђРІС‚РѕСЂ</th>
                <th className="py-3 px-3">РћС‚РІРµС‚СЃС‚РІРµРЅРЅС‹Р№</th>
                <th className="py-3 px-3">РџСЂРёРѕСЂРёС‚РµС‚</th>
                <th className="py-3 px-3">РЎС‚Р°С‚СѓСЃ</th>
                <th className="py-3 px-3">РЎСЂРѕРє</th>
                <th className="py-3 px-2 text-right">Р”РµР№СЃС‚РІРёСЏ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#64748B] font-light">
                    Нет заявок в выбранной категории
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => {
                  let badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                  let badgeText = 'Новая';
                  if (req.displayStatus === 'in_progress') {
                    badgeClass = 'bg-amber-50 text-[#E48A19] border-amber-200';
                    badgeText = 'В работе';
                  } else if (req.displayStatus === 'need_info') {
                    badgeClass = 'bg-purple-50 text-[#8457D8] border-purple-200';
                    badgeText = 'Нужна информация';
                  } else if (req.displayStatus === 'on_verification') {
                    badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                    badgeText = 'РџСЂРѕРІРµСЂРєР°';
                  } else if (req.displayStatus === 'closed') {
                    badgeClass = 'bg-emerald-50 text-[#159570] border-emerald-200';
                    badgeText = 'Закрыта';
                  }

                  let priorityDot = 'bg-[#159570]';
                  if (req.priority === 'Высокий') priorityDot = 'bg-[#D84A5A]';
                  else if (req.priority === 'Средний') priorityDot = 'bg-[#E48A19]';

                  return (
                    <tr 
                      key={req.id}
                      className="hover:bg-slate-50/65 transition-colors group cursor-pointer"
                      onClick={() => onSelectRequest(req.id)}
                    >
                      {/* РљР»РёРєР°Р±РµР»СЊРЅС‹Р№ СЃРёРЅРёР№ РЅРѕРјРµСЂ */}
                      <td className="py-3 px-2 font-mono text-[#4D83FF] hover:underline font-extrabold text-[11px]">
                        #{req.id}
                      </td>

                      {/* РўРµРјР° */}
                      <td className="py-3 px-3 max-w-[200px] truncate font-bold text-[#14213D] group-hover:text-[#4D83FF] transition-colors">
                        {req.title}
                      </td>

                      {/* РђРІС‚РѕСЂ */}
                      <td className="py-3 px-3 text-[#64748B]">
                        <div>
                          <span className="font-semibold text-slate-700 block">{req.requester_name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{req.requester_email}</span>
                        </div>
                      </td>

                      {/* РћС‚РІРµС‚СЃС‚РІРµРЅРЅС‹Р№ */}
                      <td className="py-3 px-3 font-semibold text-[#14213D]">
                        {req.assignee}
                      </td>

                      {/* РџСЂРёРѕСЂРёС‚РµС‚ СЃ С†РІРµС‚РЅРѕР№ С‚РѕС‡РєРѕР№ */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#14213D]">
                          <span className={`w-2 h-2 rounded-full ${priorityDot}`} />
                          {req.priority}
                        </span>
                      </td>

                      {/* РЎС‚Р°С‚СѓСЃ */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wider ${badgeClass}`}>
                          {badgeText}
                        </span>
                      </td>

                      {/* РЎСЂРѕРє (РІС‹РґРµР»РµРЅ РєСЂР°СЃРЅС‹Рј РµСЃР»Рё РїСЂРѕСЃСЂРѕС‡РµРЅ) */}
                      <td className={`py-3 px-3 font-semibold ${req.isOverdue ? 'text-[#D84A5A] font-extrabold flex items-center gap-1' : 'text-[#64748B]'}`}>
                        {req.isOverdue && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                        {formatDeadline(req.deadline, req.isOverdue)}
                      </td>

                      {/* Р”РµР№СЃС‚РІРёСЏ */}
                      <td className="py-3 px-2 text-right relative" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => setActiveMenuId(activeMenuId === req.id ? null : req.id)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {activeMenuId === req.id && (
                          <div className="absolute right-2 mt-1 w-32 bg-white border border-slate-100 rounded-lg shadow-lg py-1 z-50 text-left">
                            <button 
                              onClick={() => { onSelectRequest(req.id); setActiveMenuId(null); }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                            >
                              РЈРїСЂР°РІР»РµРЅРёРµ
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
    </div>
  );
}




