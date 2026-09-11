import React, { useState } from 'react';
import { Search, ArrowLeft, Archive, ShieldAlert } from 'lucide-react';
import { SupportRequest } from '../types';
import { getStatusLabel } from '../statusLabels';

interface ArchiveListProps {
  requests: SupportRequest[];
  isLoading?: boolean;
  onSelectRequest: (id: number) => void;
  onNavigateHome: () => void;
}

export default function ArchiveList({
  requests,
  isLoading = false,
  onSelectRequest,
  onNavigateHome,
}: ArchiveListProps) {
  const [localSearch, setLocalSearch] = useState('');

  const query = localSearch.toLowerCase().trim();
  const filtered = requests.filter((req) => {
    if (!query) return true;
    return (
      req.title.toLowerCase().includes(query) ||
      req.requester_name.toLowerCase().includes(query) ||
      (req.assignee || '').toLowerCase().includes(query) ||
      req.id.toString() === query
    );
  });

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return value;
    }
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
          <h2 className="text-base font-extrabold text-[#14213D] uppercase tracking-wider flex items-center gap-2">
            <Archive className="w-4 h-4 text-[#049460]" />
            Архив закрытых заявок
          </h2>
          <p className="text-xs text-slate-400 font-light">
            Заявки со статусом «Закрыта» из таблицы archived_requests. Доступ только для менеджера.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 font-mono bg-[#F6F8FB] border px-3 py-1.5 rounded-lg">
          <ShieldAlert className="w-3.5 h-3.5 text-[#4D83FF]" />
          <span>ТОЛЬКО МЕНЕДЖЕР</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 space-y-4">
        <div className="relative max-w-lg">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по теме, автору, исполнителю или номеру..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg text-xs"
          />
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">Загрузка архива...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-2">№</th>
                  <th className="py-3 px-3">Тема</th>
                  <th className="py-3 px-3">Автор</th>
                  <th className="py-3 px-3">Исполнитель</th>
                  <th className="py-3 px-3">Закрыта</th>
                  <th className="py-3 px-3">Статус</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      {requests.length === 0
                        ? 'Архив пуст — закрытые заявки появятся здесь'
                        : 'Ничего не найдено по запросу'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50 cursor-pointer border-b border-slate-50"
                      onClick={() => onSelectRequest(req.id)}
                    >
                      <td className="py-3 px-2 font-mono text-[#4D83FF] font-bold">#{req.id}</td>
                      <td className="py-3 px-3 font-bold truncate max-w-[220px]">{req.title}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold">{req.requester_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{req.requester_email}</div>
                      </td>
                      <td className="py-3 px-3">{req.assignee?.trim() || 'Не назначен'}</td>
                      <td className="py-3 px-3 text-slate-500">{formatDate(req.updated_at)}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded border text-[9px] font-bold uppercase bg-emerald-50 text-[#159570] border-emerald-200">
                          {getStatusLabel(req.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[10px] text-slate-400 border-t pt-3">
          Всего в архиве: {requests.length} · Показано: {filtered.length}
        </p>
      </div>
    </div>
  );
}
