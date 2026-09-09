import React, { useMemo, useState } from 'react';
import {
  Inbox,
  Users,
  BarChart3,
  Settings,
  PlusCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  MessageSquare,
  Activity,
  Zap,
  List,
  UserCheck,
} from 'lucide-react';
import { SupportRequest, RequestStatus } from '../types';
import { TEAM_MEMBERS } from '../App';

interface HomeViewProps {
  requests: SupportRequest[];
  globalSearch: string;
  onSelectRequest: (id: number) => void;
  onNavigate: (view: string) => void;
}

const statusConfig: Record<
  RequestStatus,
  { label: string; accent: string; bg: string; text: string; icon: React.ReactNode }
> = {
  new: {
    label: 'Новые',
    accent: '#2589E8',
    bg: '#E0EFFF',
    text: '#2677C2',
    icon: <Zap className="w-4 h-4" />,
  },
  in_progress: {
    label: 'В работе',
    accent: '#E89427',
    bg: '#FFF0D8',
    text: '#B96814',
    icon: <Clock className="w-4 h-4" />,
  },
  need_info: {
    label: 'Требуют ответа',
    accent: '#9A56D8',
    bg: '#F0E2FB',
    text: '#8744B8',
    icon: <MessageSquare className="w-4 h-4" />,
  },
  closed: {
    label: 'Закрыты',
    accent: '#20A76E',
    bg: '#DDF4E7',
    text: '#237F51',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  assigned: {
    label: '?????????',
    accent: '#D99A24',
    bg: '#FFF3D6',
    text: '#9A6812',
    icon: <Clock className="w-4 h-4" />,
  },
  completed: {
    label: '?????????',
    accent: '#4388D6',
    bg: '#E3F0FF',
    text: '#2868A8',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  awaiting_confirmation: {
    label: '??????? ?????????????',
    accent: '#E89427',
    bg: '#FFF0D8',
    text: '#B96814',
    icon: <Clock className="w-4 h-4" />,
  },
  confirmed: {
    label: '????????????',
    accent: '#20A76E',
    bg: '#DDF4E7',
    text: '#237F51',
    icon: <CheckCircle className="w-4 h-4" />,
  },

};

function getRequestValue(request: SupportRequest, keys: string[], fallback = '') {
  const item = request as any;

  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null && String(item[key]).trim() !== '') {
      return String(item[key]);
    }
  }

  return fallback;
}

function formatDate(value: string) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  });
}

export default function HomeView({
  requests,
  globalSearch,
  onSelectRequest,
  onNavigate,
}: HomeViewProps) {
  const [showRecent, setShowRecent] = useState(true);

  const filteredRequests = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();

    if (!query) return requests;

    return requests.filter((request) => {
      const title = getRequestValue(request, ['title', 'name']);
      const description = getRequestValue(request, ['description', 'text']);
      const id = String(request.id);

      return (
        title.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query) ||
        id.includes(query)
      );
    });
  }, [requests, globalSearch]);

  const statusCounts = useMemo(() => {
    return {
      new: requests.filter((r) => r.status === 'new').length,
      in_progress: requests.filter((r) => r.status === 'in_progress').length,
      need_info: requests.filter((r) => r.status === 'need_info').length,
      closed: requests.filter((r) => r.status === 'closed').length,
      overdue: requests.filter((r) => {
        const item = r as any;
        const deadline = item.deadline || item.due_date || item.sla_deadline;

        if (!deadline || r.status === 'closed') return false;

        const date = new Date(deadline);
        return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
      }).length,
    };
  }, [requests]);

  const recentRequests = filteredRequests.slice(0, 6);

  const activityItems = useMemo(() => {
    return requests
      .slice(0, 4)
      .map((request) => ({
        id: request.id,
        title: getRequestValue(request, ['title', 'name'], `Заявка #${request.id}`),
        status: statusConfig[request.status]?.label || 'Новая',
        date: formatDate(
          getRequestValue(request, ['updated_at', 'created_at', 'date', 'createdAt'])
        ),
      }));
  }, [requests]);

  const teamActive = TEAM_MEMBERS.filter((member) => member.status === 'online').length;

  const statCards = [
    {
      label: 'Всего заявок',
      value: requests.length,
      icon: <Inbox className="w-5 h-5" />,
      action: () => setShowRecent(true),
      footer: 'Открыть список заявок',
    },
    {
      label: 'Активность команды',
      value: activityItems.length || teamActive,
      icon: <Users className="w-5 h-5" />,
      action: () => onNavigate('team'),
      footer: 'Событий по текущим заявкам',
    },
    {
      label: 'Аналитика',
      value: `${statusCounts.in_progress + statusCounts.need_info}`,
      icon: <BarChart3 className="w-5 h-5" />,
      action: () => onNavigate('analytics'),
      footer: 'Перейти к аналитике',
    },
  ];

  const statusCards = [
    { key: 'new' as const, count: statusCounts.new },
    { key: 'in_progress' as const, count: statusCounts.in_progress },
    { key: 'need_info' as const, count: statusCounts.need_info },
    { key: 'closed' as const, count: statusCounts.closed },
  ];

  return (
    <div className="min-h-full bg-[#EEF7F3] text-[#17221F]">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-4">

        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto_174px] items-center gap-5 min-h-[132px] px-6 py-5 rounded-xl bg-gradient-to-r from-[#DFF6EC] to-[#ECFBF5]">
          <div>
            <h1 className="m-0 mb-2 text-[28px] leading-tight font-bold tracking-[-0.8px] text-[#17221F]">
              Сервис заявок
            </h1>
            <p className="max-w-[500px] m-0 text-[14px] leading-5 text-[#4C665E]">
              Управляйте обращениями, контролируйте сроки и помогайте команде быстрее решать задачи.
            </p>
          </div>

          <button
            onClick={() => onNavigate('create')}
            className="inline-flex items-center justify-center gap-2 min-w-[150px] h-[40px] px-4 rounded-lg bg-[#049460] hover:bg-[#078454] text-white text-[15px] font-bold shadow-[0_5px_11px_rgba(4,148,96,0.20)] transition"
          >
            <PlusCircle className="w-4 h-4" />
            Создать заявку
          </button>

          <div className="hidden xl:block p-2.5 rounded-[9px] bg-white shadow-[0_5px_15px_rgba(9,58,42,0.09)]">
            <h3 className="m-0 mb-2 text-[15px] font-bold">Быстрые действия</h3>

            <button
              onClick={() => onNavigate('list')}
              className="w-full flex items-center gap-2 h-[29px] px-2 rounded-md text-left text-[13px] font-medium text-[#3E4E49] hover:bg-[#EEF5F2]"
            >
              <List className="w-4 h-4" />
              Все заявки
            </button>

            <button
              onClick={() => onNavigate('requests_mine')}
              className="w-full flex items-center gap-2 h-[29px] px-2 rounded-md text-left text-[13px] font-medium text-[#3E4E49] hover:bg-[#EEF5F2]"
            >
              <UserCheck className="w-4 h-4" />
              Мои заявки
            </button>

            <button
              onClick={() => onNavigate('analytics')}
              className="w-full flex items-center gap-2 h-[29px] px-2 rounded-md text-left text-[13px] font-medium text-[#3E4E49] hover:bg-[#EEF5F2]"
            >
              <BarChart3 className="w-4 h-4" />
              Аналитика
            </button>
          </div>
        </section>

        <div className="mt-4">
          <h2 className="m-0 mb-2 text-lg font-bold tracking-[-0.25px]">
            Статус заявок
          </h2>

          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {statusCards.map(({ key, count }) => {
              const config = statusConfig[key];

              return (
                <article
                  key={key}
                  className="relative min-h-[96px] overflow-hidden px-[15px] pt-[13px] pb-[12px] rounded-[10px] bg-white shadow-[0_5px_15px_rgba(9,58,42,0.09)]"
                >
                  <div
                    className="absolute left-0 top-0 w-1 h-full"
                    style={{ backgroundColor: config.accent }}
                  />

                  <div className="flex items-center justify-between text-sm font-bold text-[#2C3835]">
                    <span>{config.label}</span>
                    <span style={{ color: config.accent }}>{config.icon}</span>
                  </div>

                  <strong className="block mt-2 text-[26px] leading-none font-bold text-[#1B2925]">
                    {count}
                  </strong>
                </article>
              );
            })}

            <article className="relative min-h-[96px] overflow-hidden px-[15px] pt-[13px] pb-[12px] rounded-[10px] bg-white shadow-[0_5px_15px_rgba(9,58,42,0.09)]">
              <div className="absolute left-0 top-0 w-1 h-full bg-[#E65A56]" />

              <div className="flex items-center justify-between text-sm font-bold text-[#2C3835]">
                <span>Просрочены</span>
                <AlertTriangle className="w-4 h-4 text-[#E65A56]" />
              </div>

              <strong className="block mt-2 text-[26px] leading-none font-bold text-[#1B2925]">
                {statusCounts.overdue}
              </strong>
            </article>
          </section>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_270px] gap-3 mt-3">
          <section className="rounded-[10px] bg-white shadow-[0_5px_15px_rgba(9,58,42,0.09)] overflow-hidden">
            <div className="flex items-center justify-between min-h-[66px] px-5 border-b border-[#E7EEEB]">
              <h2 className="m-0 text-xl font-bold tracking-[-0.3px]">
                Последние заявки
              </h2>

              <button
                onClick={() => setShowRecent((value) => !value)}
                className="inline-flex items-center gap-2 h-[34px] px-3 rounded-md border border-[#DFE8E4] bg-white text-[#52615C] text-[13px] font-semibold hover:bg-[#F5F9F7] transition"
              >
                {showRecent ? 'Скрыть список' : 'Открыть список'}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showRecent ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {!showRecent ? (
              <button
                onClick={() => setShowRecent(true)}
                className="w-full min-h-[112px] flex items-center justify-center gap-2 px-6 text-[15px] font-semibold text-[#173C5A] hover:bg-[#F8FBFA] transition"
              >
                {requests.length > 0
                  ? 'Нажмите, чтобы открыть последние заявки'
                  : 'Создайте первую заявку, чтобы начать работу'}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                {recentRequests.length === 0 ? (
                  <div className="min-h-[112px] flex items-center justify-center px-6 text-[15px] font-semibold text-[#173C5A]">
                    Создайте первую заявку, чтобы начать работу
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-[#83908B]">Заявка</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-[#83908B]">Клиент</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-[#83908B]">Статус</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-[#83908B]">Дата</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentRequests.map((request) => {
                          const config = statusConfig[request.status];
                          const title = getRequestValue(
                            request,
                            ['title', 'name'],
                            `Заявка #${request.id}`
                          );
                          const client = getRequestValue(
                            request,
                            ['customer_name', 'client_name', 'customer', 'client', 'email'],
                            'Клиент'
                          );
                          const date = formatDate(
                            getRequestValue(request, [
                              'updated_at',
                              'created_at',
                              'date',
                              'createdAt',
                            ])
                          );

                          return (
                            <tr
                              key={request.id}
                              onClick={() => onSelectRequest(request.id)}
                              className="cursor-pointer hover:bg-[#F8FBFA] transition"
                            >
                              <td className="px-5 py-3.5 border-b border-[#EDF2EF] text-sm font-bold text-[#1D2D28]">
                                #{request.id} В· {title}
                              </td>
                              <td className="px-5 py-3.5 border-b border-[#EDF2EF] text-sm text-[#33413C]">
                                {client}
                              </td>
                              <td className="px-5 py-3.5 border-b border-[#EDF2EF]">
                                <span
                                  className="inline-flex items-center min-h-6 px-2.5 rounded-full text-xs font-bold"
                                  style={{
                                    backgroundColor: config?.bg || '#EEF2F0',
                                    color: config?.text || '#52615C',
                                  }}
                                >
                                  {config?.label || request.status}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 border-b border-[#EDF2EF] text-sm text-[#52615C]">
                                {date}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>

          <aside className="grid grid-rows-[auto_auto] gap-4">
            <section className="rounded-[10px] bg-white shadow-[0_5px_15px_rgba(9,58,42,0.09)] p-5">
              <h2 className="m-0 mb-4 text-lg font-bold">
                Активность команды
              </h2>

              {activityItems.length === 0 ? (
                <div className="text-sm text-[#83908B]">
                  Пока нет активности по заявкам
                </div>
              ) : (
                <div className="space-y-3">
                  {activityItems.slice(0, 3).map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => onSelectRequest(item.id)}
                      className="w-full grid grid-cols-[28px_1fr] items-center gap-3 text-left"
                    >
                      <span className="w-7 h-7 rounded-full bg-[#DDEAE5] flex items-center justify-center">
                        {index === 1 ? (
                          <Activity className="w-3.5 h-3.5 text-[#147458]" />
                        ) : (
                          <Users className="w-3.5 h-3.5 text-[#6F7D78]" />
                        )}
                      </span>

                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-[#33413C]">
                          {item.title}
                        </span>
                        <span className="block mt-1 text-[11px] text-[#83908B]">
                          {item.status} В· {item.date}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[10px] bg-white shadow-[0_5px_15px_rgba(9,58,42,0.09)] p-5 min-h-[108px]">
              <h2 className="m-0 mb-4 text-lg font-bold">Аналитика</h2>

              <div className="flex items-end gap-2 h-[47px]">
                {[statusCounts.new, statusCounts.in_progress, statusCounts.need_info, statusCounts.closed, statusCounts.overdue].map(
                  (value, index) => {
                    const max = Math.max(
                      statusCounts.new,
                      statusCounts.in_progress,
                      statusCounts.need_info,
                      statusCounts.closed,
                      statusCounts.overdue,
                      1
                    );

                    const height = Math.max(18, (value / max) * 100);

                    return (
                      <button
                        key={index}
                        onClick={() => onNavigate('analytics')}
                        className={`flex-1 rounded-t ${index === 3 ? 'bg-[#198564]' : 'bg-[#91D4BB]'} hover:opacity-80 transition`}
                        style={{ height: `${height}%` }}
                        aria-label="Открыть аналитику"
                      />
                    );
                  }
                )}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </div>
  );
}
