import { RequestStatus } from './types';
import { getStatusLabel } from './statusLabels';

export const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  new: ['assigned'],
  assigned: ['in_progress'],
  in_progress: ['need_info', 'completed'],
  need_info: ['in_progress'],
  completed: ['awaiting_confirmation'],
  awaiting_confirmation: ['confirmed', 'in_progress'],
  confirmed: ['closed'],
  closed: [],
};

export const ALL_STATUSES: RequestStatus[] = [
  'new',
  'assigned',
  'in_progress',
  'need_info',
  'completed',
  'awaiting_confirmation',
  'confirmed',
  'closed',
];

export function getAllowedTransitions(status: RequestStatus): RequestStatus[] {
  return VALID_TRANSITIONS[status] ?? [];
}

const STATUS_DESCRIPTIONS: Record<RequestStatus, string> = {
  new: 'Поступившее обращение в очереди',
  assigned: 'Заявка назначена сотруднику',
  in_progress: 'Инженер решает инцидент',
  need_info: 'Требуется дополнительная информация от заявителя',
  completed: 'Работа по заявке завершена',
  awaiting_confirmation: 'Заявитель проверяет результат',
  confirmed: 'Заявитель подтвердил выполнение',
  closed: 'Заявка полностью закрыта',
};

export function getStatusOption(status: RequestStatus) {
  return {
    value: status,
    label: getStatusLabel(status),
    desc: STATUS_DESCRIPTIONS[status],
  };
}
