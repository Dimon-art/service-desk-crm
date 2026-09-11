import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Inbox,
  Clock,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { SupportRequest } from '../types';
import { getStatusLabel } from '../statusLabels';

interface RequesterViewProps {
  requestId: number;
  accessToken: string;
}

export default function RequesterView({ requestId, accessToken }: RequesterViewProps) {
  const [request, setRequest] = useState<SupportRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/requests/${requestId}?accessToken=${encodeURIComponent(accessToken)}`
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Не удалось загрузить заявку');
        }

        const data: SupportRequest = await response.json();
        setRequest(data);
        setComment(data.manager_comment || '');
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки заявки');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [requestId, accessToken]);

  const handleDecision = async (decision: 'confirmed' | 'rejected') => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/requests/${requestId}/requester-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, decision, comment }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Не удалось отправить ответ');
      }

      const updated: SupportRequest = await response.json();
      setRequest(updated);
      setSuccessMessage(
        decision === 'confirmed'
          ? 'Спасибо! Вы подтвердили выполнение работ. Менеджер закроет заявку.'
          : 'Заявка возвращена в работу. Исполнитель продолжит решение проблемы.'
      );
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки ответа');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#049460]" />
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-md">
          <AlertCircle className="w-10 h-10 text-[#D84A5A] mx-auto mb-4" />
          <h1 className="text-lg font-bold mb-2">Заявка недоступна</h1>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!request) return null;

  const canConfirm = request.status === 'awaiting_confirmation' && !successMessage;

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#14213D]">
      <header className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#049460] flex items-center justify-center text-white">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold">Сервис заявок</h1>
            <p className="text-[10px] text-slate-400 uppercase">Портал заявителя • #{request.id}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-5">
        <div className="bg-white rounded-2xl p-6 shadow-md border space-y-4">
          <div className="flex justify-between gap-4">
            <h2 className="font-extrabold">{request.title}</h2>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-700 border">
              {getStatusLabel(request.status)}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap bg-slate-50 p-4 rounded-xl">{request.description}</p>
          {request.manager_comment && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mb-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Комментарий исполнителя
              </div>
              {request.manager_comment}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            Создана: {new Date(request.created_at).toLocaleString('ru-RU')}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">{error}</div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 text-emerald-800 rounded-xl p-4 text-sm flex gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {successMessage}
          </div>
        )}

        {canConfirm && (
          <div className="bg-white rounded-2xl p-6 shadow-md border space-y-4">
            <h3 className="font-bold">Подтвердите результат работ</h3>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ваш комментарий (необязательно)..."
              className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm resize-none"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDecision('confirmed')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#049460] text-white font-bold rounded-xl text-sm disabled:opacity-60"
              >
                <CheckCircle className="w-4 h-4" />
                Да, проблема решена
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDecision('rejected')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border font-bold rounded-xl text-sm disabled:opacity-60"
              >
                <XCircle className="w-4 h-4 text-[#D84A5A]" />
                Нет, вернуть в работу
              </button>
            </div>
          </div>
        )}

        {!canConfirm && !successMessage && request.status !== 'awaiting_confirmation' && (
          <p className="text-sm text-slate-500 text-center bg-slate-50 rounded-xl p-4">
            {request.status === 'confirmed'
              ? 'Вы уже подтвердили выполнение. Ожидайте закрытия заявки менеджером.'
              : 'Подтверждение результата пока недоступно для текущего статуса.'}
          </p>
        )}
      </main>
    </div>
  );
}
