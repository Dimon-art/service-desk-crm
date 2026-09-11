/**
 * Роли и права доступа в Service Desk CRM.
 *
 * В учебном MVP аутентификация упрощена:
 * - Менеджер: заголовок x-manager-token: manager или ?token=manager
 * - Заявитель: access_token в URL (?accessToken=)
 * - Исполнитель: логическая роль (поле assignee), отдельного входа нет
 */

export type UserRole = 'guest' | 'requester' | 'executor' | 'manager';

export const ROLES: Record<UserRole, { label: string; description: string }> = {
  guest: {
    label: 'Гость',
    description: 'Может создать заявку и видеть публичные формы без персональных данных.',
  },
  requester: {
    label: 'Заявитель',
    description: 'Сотрудник, создавший обращение. Доступ по секретной ссылке с accessToken.',
  },
  executor: {
    label: 'Исполнитель',
    description: 'Инженер, назначенный на заявку (поле assignee). Работает через панель менеджера.',
  },
  manager: {
    label: 'Менеджер',
    description: 'Полный доступ к активным заявкам, архиву, смене статусов и резервному копированию.',
  },
};

export type Permission =
  | 'create_request'
  | 'view_own_request'
  | 'confirm_request'
  | 'view_active_requests'
  | 'update_request'
  | 'assign_executor'
  | 'close_request'
  | 'view_archive'
  | 'export_backup';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  guest: ['create_request'],
  requester: ['create_request', 'view_own_request', 'confirm_request'],
  executor: ['view_active_requests'],
  manager: [
    'create_request',
    'view_active_requests',
    'update_request',
    'assign_executor',
    'close_request',
    'view_archive',
    'export_backup',
  ],
};

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Заголовки для API-запросов от имени менеджера (панель Service Desk). */
export const MANAGER_API_HEADERS: HeadersInit = {
  'x-manager-token': 'manager',
};
