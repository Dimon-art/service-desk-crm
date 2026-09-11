import { RequestStatus } from './types';

export const STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'Новая',
  assigned: 'Назначена',
  in_progress: 'В работе',
  need_info: 'Нужна информация',
  completed: 'Выполнена',
  awaiting_confirmation: 'Ожидает подтверждения',
  confirmed: 'Подтверждена',
  closed: 'Закрыта',
};

export const STATUS_LABELS_PLURAL: Record<RequestStatus, string> = {
  new: 'Новые',
  assigned: 'Назначены',
  in_progress: 'В работе',
  need_info: 'Нужна информация',
  completed: 'Выполнены',
  awaiting_confirmation: 'Ожидают подтверждения',
  confirmed: 'Подтверждены',
  closed: 'Закрытые',
};

export function getStatusLabel(status: RequestStatus, plural = false): string {
  return plural ? STATUS_LABELS_PLURAL[status] : STATUS_LABELS[status];
}
