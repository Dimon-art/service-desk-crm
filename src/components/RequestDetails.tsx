import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  MessageSquare,
  Save,
  Check,
  Clock,
  Terminal,
  Activity,
  UserCheck
} from 'lucide-react';
import { SupportRequest, RequestStatus } from '../types';
import { ALL_STATUSES, getAllowedTransitions, getStatusOption } from '../lifecycle';

const EXECUTORS = [
  'Дмитрий Петров',
  'Алексей Иванов',
  'Мария Сидорова',
  'Елена Козлова',
];
interface RequestDetailsProps {
  request: SupportRequest;
  onUpdateStatusAndComment: (id: number, status: RequestStatus, comment: string, assignee?: string) => Promise<SupportRequest>;
  onBackToList: () => void;
  readOnly?: boolean;
}

export default function RequestDetails({
  request,
  onUpdateStatusAndComment,
  onBackToList,
  readOnly = false,
}: RequestDetailsProps) {
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus>(request.status);
  const [commentText, setCommentText] = useState(request.manager_comment || '');
  const [selectedAssignee, setSelectedAssignee] = useState(request.assignee || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedStatus(request.status);
    setCommentText(request.manager_comment || '');
    setSelectedAssignee(request.assignee || '');
  }, [request.id, request.status, request.manager_comment, request.assignee]);

  const hasChanges =
    selectedStatus !== request.status ||
    commentText !== (request.manager_comment || '') ||
    selectedAssignee !== (request.assignee || '');

  const handleSave = async () => {
    if (selectedStatus === 'assigned' && !selectedAssignee) {
      setError('Пожалуйста, выберите исполнителя.');
      return;
    }
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await onUpdateStatusAndComment(request.id, selectedStatus, commentText, selectedAssignee);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Не удалось обновить заявку');
    } finally {
      setIsSaving(false);
    }
  };

  const STATUS_STYLES: Record<RequestStatus, { colorClass: string; activeClass: string }> = {
    new: {
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
      activeClass: 'bg-[#4D83FF] border-[#4D83FF] text-white shadow-md ring-4 ring-blue-50',
    },
    assigned: {
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      activeClass: 'bg-indigo-600 border-indigo-600 text-white shadow-md ring-4 ring-indigo-50',
    },
    in_progress: {
      colorClass: 'bg-amber-50 text-[#E48A19] border-amber-200',
      activeClass: 'bg-[#E48A19] border-[#E48A19] text-white shadow-md ring-4 ring-amber-50',
    },
    need_info: {
      colorClass: 'bg-purple-50 text-[#8457D8] border-purple-200',
      activeClass: 'bg-[#8457D8] border-[#8457D8] text-white shadow-md ring-4 ring-purple-50',
    },
    completed: {
      colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
      activeClass: 'bg-teal-600 border-teal-600 text-white shadow-md ring-4 ring-teal-50',
    },
    awaiting_confirmation: {
      colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
      activeClass: 'bg-orange-600 border-orange-600 text-white shadow-md ring-4 ring-orange-50',
    },
    confirmed: {
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-md ring-4 ring-emerald-50',
    },
    closed: {
      colorClass: 'bg-emerald-50 text-[#159570] border-emerald-200',
      activeClass: 'bg-[#159570] border-[#159570] text-white shadow-md ring-4 ring-emerald-50',
    },
  };

  const allowedNext = getAllowedTransitions(request.status);
  const availableStatusOptions = ALL_STATUSES
    .filter((status) => status === request.status || allowedNext.includes(status))
    .map((status) => ({
      ...getStatusOption(status),
      ...STATUS_STYLES[status],
    }));

  let priority = 'Средний';
  let priorityDot = 'bg-[#E48A19]';

  if (request.id % 3 === 0) {
    priority = 'Высокий';
    priorityDot = 'bg-[#D84A5A]';
  } else if (request.id % 3 === 2) {
    priority = 'Низкий';
    priorityDot = 'bg-[#4D83FF]';
  }

  const assignee = request.assignee || 'Не назначен';

  const isOverdue = request.status !== 'closed' && request.id % 5 === 0;

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const currentStatusOption = {
    ...getStatusOption(request.status),
    ...STATUS_STYLES[request.status],
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToList}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#4D83FF] transition uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Вернуться к списку
        </button>

        <div className="text-xs text-slate-400 font-extrabold font-mono flex items-center gap-2">
          <span>ЗАЯВКА ID: #{request.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-7 space-y-5 shadow-md">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1.5">
                <span className="font-mono text-[10px] font-extrabold px-2.5 py-1 rounded bg-[#F6F8FB] border border-slate-200/60 text-slate-500">
                  ОБРАЩЕНИЕ #{request.id}
                </span>

                <h2 className="text-base font-extrabold text-[#14213D] leading-tight uppercase tracking-wider">
                  {request.title}
                </h2>
              </div>

              <div className="flex-shrink-0">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border tracking-wider uppercase ${
                    currentStatusOption?.colorClass ||
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {currentStatusOption?.label || request.status}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-slate-300" />
                <span>Детали инцидента</span>
              </div>

              <div className="bg-[#F6F8FB] border border-slate-100/80 rounded-xl p-4 text-xs text-[#14213D] leading-relaxed font-light whitespace-pre-wrap">
                {request.description}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
              <div className="bg-[#F6F8FB] border border-slate-100 p-3 rounded-xl space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase block">
                  Автор обращения
                </span>

                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-[#14213D]">
                    {request.requester_name}
                  </span>
                </div>

                <span className="text-[10px] text-slate-400 block font-mono truncate">
                  {request.requester_email}
                </span>
              </div>

              <div className="bg-[#F6F8FB] border border-slate-100 p-3 rounded-xl space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase block">
                  Владелец SLA / Инженер
                </span>

                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-[#14213D]">
                    {assignee}
                  </span>
                </div>

                <span className="text-[10px] text-slate-400 block">
                  IT поддержка Service Desk
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-4 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Зарегистрировано: {formatDate(request.created_at)}
                </span>
              </div>

              {request.updated_at && (
                <span>
                  Изменено: {formatDate(request.updated_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 space-y-5 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                <Activity className="w-4.5 h-4.5 text-[#4D83FF]" />

                <h3 className="text-xs font-bold text-[#14213D] uppercase tracking-wider">
                  {readOnly ? 'Архивная карточка (только просмотр)' : 'Резолюция и статус'}
                </h3>
              </div>

              {readOnly && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  Заявка закрыта и хранится в архиве. Редактирование недоступно.
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-[#D84A5A] rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              {!readOnly && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Переход состояния SLA
                    </label>

                    <div className="grid grid-cols-1 gap-1.5">
                      <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Исполнитель
                        </label>
                        <select
                          value={selectedAssignee}
                          onChange={(e) => {
                            setSelectedAssignee(e.target.value);
                            if (selectedStatus === 'new' && e.target.value) {
                              setSelectedStatus('assigned');
                            }
                          }}
                          disabled={isSaving}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
                        >
                          <option value="">Не назначен</option>
                          {EXECUTORS.map((member) => (
                            <option key={member} value={member}>
                              {member}
                            </option>
                          ))}
                        </select>
                      </div>
                      {availableStatusOptions.map((opt) => {
                        const isSelected = selectedStatus === opt.value;

                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSelectedStatus(opt.value)}
                            className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? opt.activeClass
                                : 'bg-[#F6F8FB] border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold">{opt.label}</span>
                              {isSelected && <Check className="w-4 h-4" />}
                            </div>
                            <p
                              className={`text-[10px] mt-0.5 ${
                                isSelected ? 'text-white/80' : 'text-slate-400'
                              }`}
                            >
                              {opt.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Служебное примечание менеджера
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <textarea
                        rows={4}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Укажите причину изменения статуса или решение инцидента..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-[#4D83FF] rounded-xl outline-none focus:bg-white text-xs text-[#14213D] resize-none transition font-medium"
                      />
                    </div>
                  </div>
                </>
              )}

              {readOnly && request.manager_comment && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Комментарий менеджера
                  </label>
                  <div className="bg-slate-50 border rounded-xl p-4 text-xs whitespace-pre-wrap">
                    {request.manager_comment}
                  </div>
                </div>
              )}
            </div>

            {!readOnly && (
              <div className="pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#4D83FF] hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {isSaving ? 'Сохранение...' : saveSuccess ? 'Сохранено!' : 'Применить изменения'}
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#172033] border border-slate-800 rounded-2xl p-5 text-slate-300 space-y-3.5 shadow-sm text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-white">
              <Terminal className="w-4 h-4 text-[#4D83FF]" />

              <span className="font-bold uppercase tracking-wider text-[10px]">
                Мониторинг SLA
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                <span className="text-slate-400 font-semibold">
                  Приоритет:
                </span>

                <span className="inline-flex items-center gap-1 font-bold text-white">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${priorityDot}`}
                  />
                  {priority}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-800/50 pb-1.5">
                <span className="text-slate-400 font-semibold">
                  Нарушение SLA:
                </span>

                <span
                  className={`font-bold ${
                    isOverdue ? 'text-[#D84A5A]' : 'text-emerald-500'
                  }`}
                >
                  {isOverdue ? 'Да (Просрочено)' : 'Нет (В лимите)'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">
                  Запись в БД:
                </span>

                <span className="font-mono text-slate-400">
                  SQLite Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




