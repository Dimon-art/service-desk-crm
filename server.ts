import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

// ---------- HTML escape ----------
function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ---------- Password hashing (scrypt, built-in) ----------
function hashPassword(password: string, salt?: string): string {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, s, 64).toString('hex');
  return `${s}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
  } catch {
    return false;
  }
}

// ---------- Paths & types ----------
const dbPath = path.join(process.cwd(), 'data.sqlite');

export type Role = 'manager' | 'executor' | 'requester';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: Role;
  name: string;
  created_at: string;
}

export interface Session {
  token: string;
  user_id: number;
  created_at: string;
  expires_at: string;
}

export interface Request {
  id: number;
  requester_name: string;
  requester_email: string;
  requester_id?: number | null;
  title: string;
  description: string;
  status:
    | 'new'
    | 'assigned'
    | 'in_progress'
    | 'need_info'
    | 'completed'
    | 'awaiting_confirmation'
    | 'confirmed'
    | 'closed';
  manager_comment: string;
  assignee: string;
  assignee_id?: number | null;
  assigned_at: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  access_token?: string;
}

export interface RequestStatusLog {
  id: number;
  request_id: number;
  status: Request['status'];
  note?: string;
  created_at: string;
}

export interface Escalation {
  id: number;
  request_id: number;
  type: string;
  status: string;
  manager_note?: string;
  created_at: string;
  resolved_at: string | null;
}

export interface Notification {
  id: number;
  request_id: number;
  recipient_email: string;
  subject: string;
  body: string;
  sent_at: string;
}

export interface DBStructure {
  requests: Request[];
  archived_requests: Request[];
  request_status_log: RequestStatusLog[];
  escalations: Escalation[];
  notifications?: Notification[];
  users?: User[];
  sessions?: Session[];
}

function generateToken(): string {
  return crypto.randomUUID();
}

// ---------- DB I/O ----------
function loadDatabase(): DBStructure {
  try {
    if (!fs.existsSync(dbPath)) {
      const emptyDb: DBStructure = {
        requests: [],
        archived_requests: [],
        request_status_log: [],
        escalations: [],
        notifications: [],
        users: [],
        sessions: [],
      };
      fs.writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2));
      return emptyDb;
    }
    const content = fs.readFileSync(dbPath, 'utf-8');
    const parsed = JSON.parse(content || 'null');

    let db: DBStructure;
    if (Array.isArray(parsed)) {
      db = {
        requests: parsed.map(r => ({
          ...r,
          assignee: r.assignee || '',
          assigned_at: r.assigned_at || null,
          accepted_at: r.accepted_at || null,
          completed_at: r.completed_at || null,
          confirmed_at: r.confirmed_at || null,
          access_token: r.access_token || generateToken(),
        })),
        archived_requests: [],
        request_status_log: [],
        escalations: [],
        notifications: [],
        users: [],
        sessions: [],
      };
    } else {
      db = {
        requests: Array.isArray(parsed?.requests) ? parsed.requests : [],
        archived_requests: Array.isArray(parsed?.archived_requests) ? parsed.archived_requests : [],
        request_status_log: Array.isArray(parsed?.request_status_log) ? parsed.request_status_log : [],
        escalations: Array.isArray(parsed?.escalations) ? parsed.escalations : [],
        notifications: Array.isArray(parsed?.notifications) ? parsed.notifications : [],
        users: Array.isArray(parsed?.users) ? parsed.users : [],
        sessions: Array.isArray(parsed?.sessions) ? parsed.sessions : [],
      };
    }

    // Normalize requests
    for (const r of db.requests) {
      if (r.assignee === undefined) r.assignee = '';
      if (r.assignee_id === undefined) r.assignee_id = null;
      if (r.requester_id === undefined) r.requester_id = null;
      if (r.assigned_at === undefined) r.assigned_at = null;
      if (r.accepted_at === undefined) r.accepted_at = null;
      if (r.completed_at === undefined) r.completed_at = null;
      if (r.confirmed_at === undefined) r.confirmed_at = null;
      if (!r.access_token) r.access_token = generateToken();
    }

    return db;
  } catch (err) {
    console.error('Error reading database:', err);
    return { requests: [], archived_requests: [], request_status_log: [], escalations: [], notifications: [], users: [], sessions: [] };
  }
}

let writeQueue: Promise<void> = Promise.resolve();

function queueSaveDatabase(db: DBStructure): Promise<void> {
  return new Promise((resolve, reject) => {
    writeQueue = writeQueue.then(() => {
      try {
        saveDatabase(db);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

function saveDatabase(db: DBStructure) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Critical: database write failed:', err);
    throw err;
  }
}

// ---------- Bootstrap: создаём админа при первом старте ----------
function ensureDefaultUsers(db: DBStructure): DBStructure {
  if (!db.users) db.users = [];
  if (!db.sessions) db.sessions = [];

  if (db.users.length === 0) {
    const adminPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
    const admin: User = {
      id: 1,
      email: adminEmail,
      password_hash: hashPassword(adminPassword),
      role: 'manager',
      name: 'Администратор',
      created_at: new Date().toISOString(),
    };
    db.users.push(admin);
    saveDatabase(db);
    console.log('\n===========================================');
    console.log('🔐 СОЗДАН АККАУНТ РУКОВОДИТЕЛЯ');
    console.log('Email: ', adminEmail);
    console.log('Пароль:', adminPassword);
    console.log('Сохраните и смените при необходимости.');
    console.log('===========================================\n');
  }

  return db;
}

// ---------- Sessions ----------
function parseSessionToken(req: express.Request): string | null {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  return match ? match[1] : null;
}

function getCurrentUser(req: express.Request): User | null {
  const token = parseSessionToken(req);
  if (!token) return null;
  const db = loadDatabase();
  const session = (db.sessions || []).find(s => s.token === token);
  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) return null;
  const user = (db.users || []).find(u => u.id === session.user_id);
  return user || null;
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Требуется вход' });
  (req as any).user = user;
  next();
}

function requireManager(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getCurrentUser(req);
  if (!user || user.role !== 'manager') {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  (req as any).user = user;
  next();
}

// ---------- Auth routes ----------
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });

    const db = loadDatabase();
    const user = (db.users || []).find(u => u.email === String(email).toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = crypto.randomUUID();
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (!db.sessions) db.sessions = [];
    db.sessions.push({
      token,
      user_id: user.id,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
    });
    await queueSaveDatabase(db);

    res.cookie('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400000,
    });

    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/logout', async (req, res) => {
  try {
    const token = parseSessionToken(req);
    if (token) {
      const db = loadDatabase();
      db.sessions = (db.sessions || []).filter(s => s.token !== token);
      await queueSaveDatabase(db);
    }
    res.clearCookie('session');
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/me', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Не авторизован' });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

// ---------- Users management (manager only) ----------
app.get('/api/users', requireManager, (_req, res) => {
  const db = loadDatabase();
  const users = (db.users || []).map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, created_at: u.created_at }));
  res.json(users);
});

app.post('/api/users', requireManager, async (req, res) => {
  try {
    const { email, password, name, role } = req.body || {};
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Заполните email, пароль, имя и роль' });
    }
    if (!['manager', 'executor', 'requester'].includes(role)) {
      return res.status(400).json({ error: 'Недопустимая роль' });
    }
    const cleanEmail = String(email).toLowerCase().trim();
    if (password.length < 6) return res.status(400).json({ error: 'Пароль минимум 6 символов' });

    const db = loadDatabase();
    if (!db.users) db.users = [];
    if (db.users.some(u => u.email === cleanEmail)) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    const nextId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    const user: User = {
      id: nextId,
      email: cleanEmail,
      password_hash: hashPassword(password),
      role,
      name: escapeHtml(String(name).trim()),
      created_at: new Date().toISOString(),
    };
    db.users.push(user);
    await queueSaveDatabase(db);
    res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', requireManager, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const me = (req as any).user as User;
    if (id === me.id) return res.status(400).json({ error: 'Нельзя удалить самого себя' });

    const db = loadDatabase();
    db.users = (db.users || []).filter(u => u.id !== id);
    db.sessions = (db.sessions || []).filter(s => s.user_id !== id);
    await queueSaveDatabase(db);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Requests: helper ----------
function canSeeRequest(user: User | null, req: Request, accessToken?: string): boolean {
  if (user?.role === 'manager') return true;
  if (user?.role === 'executor' && (req.assignee_id === user.id || req.assignee === user.name)) return true;
  if (user?.role === 'requester' && req.requester_email === user.email) return true;
  if (!user && accessToken && req.access_token === accessToken) return true;
  return false;
}

// ---------- GET /api/requests ----------
app.get('/api/requests', async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const accessToken = req.query.accessToken as string | undefined;
    const user = getCurrentUser(req);
    const db = loadDatabase();
    let requests = db.requests;

    if (status) requests = requests.filter(r => r.status === status);

    // Filter by role
    if (user?.role === 'manager') {
      // all
    } else if (user?.role === 'executor') {
      requests = requests.filter(r => r.assignee_id === user.id || r.assignee === user.name);
    } else if (user?.role === 'requester') {
      requests = requests.filter(r => r.requester_email === user.email);
    } else if (accessToken) {
      requests = requests.filter(r => r.access_token === accessToken);
    } else {
      return res.status(401).json({ error: 'Требуется вход или токен доступа' });
    }

    const sorted = [...requests].sort((a, b) => b.id - a.id);

    // Mask email for non-managers
    const secureRequests = sorted.map(r => {
      if (user?.role === 'manager' || (accessToken && r.access_token === accessToken)) return r;
      if (user?.role === 'requester' && r.requester_email === user.email) return r;
      const email = r.requester_email || '';
      const parts = email.split('@');
      if (parts.length === 2) {
        const [local, domain] = parts;
        const maskedLocal = local.length > 2
          ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
          : local[0] + '*';
        return { ...r, requester_email: `${maskedLocal}@${domain}` };
      }
      return r;
    });

    const page = parseInt(req.query.page as string, 10);
    const limit = parseInt(req.query.limit as string, 10);
    if (!isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
      const startIndex = (page - 1) * limit;
      const paginatedItems = secureRequests.slice(startIndex, startIndex + limit);
      res.setHeader('X-Total-Count', secureRequests.length.toString());
      res.setHeader('X-Total-Pages', Math.ceil(secureRequests.length / limit).toString());
      res.setHeader('X-Current-Page', page.toString());
      return res.json(paginatedItems);
    }

    res.json(secureRequests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- GET archived (manager only) ----------
app.get('/api/archived-requests', requireManager, async (req, res) => {
  try {
    const q = (req.query.q as string | undefined)?.toLowerCase().trim();
    const db = loadDatabase();
    let archived = [...db.archived_requests];
    if (q) {
      archived = archived.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.requester_name.toLowerCase().includes(q) ||
        (r.assignee || '').toLowerCase().includes(q) ||
        r.id.toString() === q
      );
    }
    const sorted = archived.sort((a, b) => b.id - a.id);
    res.json(sorted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- GET request by id ----------
app.get('/api/requests/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const accessToken = req.query.accessToken as string | undefined;
    const user = getCurrentUser(req);
    const db = loadDatabase();
    const foundRequest = db.requests.find(r => r.id === id) || db.archived_requests.find(r => r.id === id);
    if (!foundRequest) return res.status(404).json({ error: 'Заявка не найдена' });

    if (!canSeeRequest(user, foundRequest, accessToken)) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    res.json(foundRequest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Simulated email ----------
function simulateEmailNotification(db: DBStructure, requestId: number, recipientEmail: string, subject: string, body: string) {
  if (!db.notifications) db.notifications = [];
  const nextNotificationId = db.notifications.length > 0 ? Math.max(...db.notifications.map(item => item.id)) + 1 : 1;
  db.notifications.push({
    id: nextNotificationId,
    request_id: requestId,
    recipient_email: recipientEmail,
    subject,
    body,
    sent_at: new Date().toISOString(),
  });
  console.log('\n✉️  [ИМИТАЦИЯ ПИСЬМА]', recipientEmail, '|', subject);
}

// ---------- POST create request (public + logged) ----------
app.post('/api/requests', async (req, res) => {
  try {
    const { requester_name, requester_email, title, description } = req.body || {};
    const user = getCurrentUser(req);

    if (!requester_name || !requester_name.trim()) return res.status(400).json({ error: 'Введите имя.' });
    if (!requester_email || !requester_email.trim() || !requester_email.includes('@')) {
      return res.status(400).json({ error: 'Введите корректный email.' });
    }
    if (!title || !title.trim()) return res.status(400).json({ error: 'Заполните тему.' });
    if (!description || !description.trim()) return res.status(400).json({ error: 'Добавьте описание.' });

    if (requester_name.length > 100) return res.status(400).json({ error: 'Имя до 100 символов.' });
    if (requester_email.length > 100) return res.status(400).json({ error: 'Email до 100 символов.' });
    if (title.length > 200) return res.status(400).json({ error: 'Тема до 200 символов.' });
    if (description.length > 5000) return res.status(400).json({ error: 'Описание до 5000 символов.' });

    const cleanName = escapeHtml(requester_name.trim());
    const cleanEmail = escapeHtml(requester_email.trim()).toLowerCase();
    const cleanTitle = escapeHtml(title.trim());
    const cleanDescription = escapeHtml(description.trim());

    const db = loadDatabase();
    const now = new Date().toISOString();
    const nextId = db.requests.length > 0 ? Math.max(...db.requests.map(item => item.id)) + 1 : 1;
    const accessToken = generateToken();

    const newRequest: Request = {
      id: nextId,
      requester_name: cleanName,
      requester_email: cleanEmail,
      requester_id: user?.id ?? null,
      title: cleanTitle,
      description: cleanDescription,
      status: 'new',
      manager_comment: '',
      assignee: '',
      assignee_id: null,
      assigned_at: null,
      accepted_at: null,
      completed_at: null,
      confirmed_at: null,
      created_at: now,
      updated_at: now,
      access_token: accessToken,
    };

    db.requests.push(newRequest);

    const nextLogId = db.request_status_log.length > 0 ? Math.max(...db.request_status_log.map(item => item.id)) + 1 : 1;
    db.request_status_log.push({
      id: nextLogId,
      request_id: nextId,
      status: 'new',
      note: 'Заявка создана',
      created_at: now,
    });

    simulateEmailNotification(
      db,
      nextId,
      cleanEmail,
      `Ваша заявка #${nextId} получена: "${cleanTitle}"`,
      `Здравствуйте, ${cleanName}!\n\nЗаявка #${nextId} создана.\nТокен доступа: ${accessToken}\n`,
    );

    await queueSaveDatabase(db);
    res.status(201).json(newRequest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- PUT update request (manager or assigned executor) ----------
app.put('/api/requests/:id', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user as User;
    const id = parseInt(req.params.id, 10);
    const { status, manager_comment, assignee, assignee_id } = req.body || {};

    const validStatuses = ['new', 'assigned', 'in_progress', 'need_info', 'completed', 'awaiting_confirmation', 'confirmed', 'closed'];
    if (status && !validStatuses.includes(status)) return res.status(400).json({ error: 'Недопустимый статус' });
    if (manager_comment && manager_comment.length > 5000) return res.status(400).json({ error: 'Комментарий до 5000 символов.' });

    const db = loadDatabase();
    const idx = db.requests.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Заявка не найдена' });
    const existing = db.requests[idx];

    // Access check
    const isManagerUser = user.role === 'manager';
    const isAssignedExecutor = user.role === 'executor' && (existing.assignee_id === user.id || existing.assignee === user.name);
    if (!isManagerUser && !isAssignedExecutor) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    // Executor limited transitions
    if (!isManagerUser && status) {
      const executorAllowed: Record<string, string[]> = {
        assigned: ['in_progress'],
        in_progress: ['completed', 'need_info'],
        need_info: ['in_progress'],
      };
      const allowed = executorAllowed[existing.status] || [];
      if (status !== existing.status && !allowed.includes(status)) {
        return res.status(403).json({ error: `Исполнитель не может перевести заявку из "${existing.status}" в "${status}"` });
      }
    }

    // Manager transitions
    if (isManagerUser && status && status !== existing.status) {
      const VALID_TRANSITIONS: Record<string, string[]> = {
        new: ['assigned'],
        assigned: ['in_progress'],
        in_progress: ['need_info', 'completed'],
        need_info: ['in_progress'],
        completed: ['awaiting_confirmation'],
        awaiting_confirmation: ['confirmed', 'in_progress'],
        confirmed: ['closed'],
        closed: [],
      };
      const allowed = VALID_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({ error: `Недопустимый переход из "${existing.status}" в "${status}". Разрешено: ${allowed.join(', ')}` });
      }
    }

    const now = new Date().toISOString();
    const statusChanged = status && status !== existing.status;
    const updatedStatus = (status || existing.status) as Request['status'];

    const cleanComment = manager_comment !== undefined ? escapeHtml(String(manager_comment).trim()) : existing.manager_comment;
    const cleanAssignee = assignee !== undefined ? escapeHtml(String(assignee).trim()) : existing.assignee;
    const newAssigneeId = assignee_id !== undefined ? assignee_id : existing.assignee_id;

    const lifecycleUpdate: Partial<Request> = {};

    if (isManagerUser && statusChanged && updatedStatus === 'assigned') {
      if (!cleanAssignee) return res.status(400).json({ error: 'Для статуса «Назначена» укажите исполнителя.' });
      lifecycleUpdate.assignee = cleanAssignee;
      lifecycleUpdate.assignee_id = newAssigneeId ?? null;
      lifecycleUpdate.assigned_at = now;
    }
    if (isManagerUser && assignee !== undefined && !statusChanged) {
      lifecycleUpdate.assignee = cleanAssignee;
      lifecycleUpdate.assignee_id = newAssigneeId ?? null;
    }
    if (statusChanged && updatedStatus === 'in_progress' && existing.status === 'assigned') {
      lifecycleUpdate.accepted_at = now;
    }
    if (statusChanged && updatedStatus === 'completed') lifecycleUpdate.completed_at = now;
    if (statusChanged && updatedStatus === 'confirmed') lifecycleUpdate.confirmed_at = now;

    db.requests[idx] = {
      ...existing,
      ...lifecycleUpdate,
      status: updatedStatus,
      manager_comment: cleanComment,
      updated_at: now,
    };

    if (statusChanged) {
      const nextLogId = db.request_status_log.length > 0 ? Math.max(...db.request_status_log.map(item => item.id)) + 1 : 1;
      db.request_status_log.push({
        id: nextLogId,
        request_id: id,
        status: updatedStatus,
        note: `Статус изменён на "${updatedStatus}" (${user.name})`,
        created_at: now,
      });

      simulateEmailNotification(
        db, id, existing.requester_email,
        `Статус заявки #${id}: "${updatedStatus}"`,
        `Комментарий: ${cleanComment || '—'}\n`,
      );
    }

    let responseRequest = db.requests[idx];

    if (statusChanged && updatedStatus === 'closed') {
      const closed = { ...db.requests[idx] };
      if (!db.archived_requests.some(r => r.id === id)) db.archived_requests.push(closed);
      db.requests.splice(idx, 1);
      responseRequest = closed;
    }

    await queueSaveDatabase(db);
    res.json(responseRequest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Requester response (via access_token) ----------
app.post('/api/requests/:id/requester-response', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { accessToken, decision, comment } = req.body || {};
    if (!accessToken) return res.status(400).json({ error: 'Требуется токен доступа' });
    if (!['confirmed', 'rejected'].includes(decision)) return res.status(400).json({ error: 'decision: confirmed или rejected' });

    const db = loadDatabase();
    const idx = db.requests.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Заявка не найдена' });
    const existing = db.requests[idx];
    if (existing.access_token !== accessToken) return res.status(403).json({ error: 'Неверный токен' });
    if (existing.status !== 'awaiting_confirmation') return res.status(400).json({ error: `Статус должен быть awaiting_confirmation` });

    const now = new Date().toISOString();
    const newStatus: Request['status'] = decision === 'confirmed' ? 'confirmed' : 'in_progress';
    const cleanComment = comment !== undefined ? escapeHtml(String(comment).trim()) : existing.manager_comment;

    db.requests[idx] = { ...existing, status: newStatus, manager_comment: cleanComment, updated_at: now };
    if (newStatus === 'confirmed') db.requests[idx].confirmed_at = now;

    const nextLogId = db.request_status_log.length > 0 ? Math.max(...db.request_status_log.map(i => i.id)) + 1 : 1;
    db.request_status_log.push({
      id: nextLogId,
      request_id: id,
      status: newStatus,
      note: decision === 'confirmed' ? 'Заявитель подтвердил' : 'Заявитель вернул в работу',
      created_at: now,
    });

    await queueSaveDatabase(db);
    res.json(db.requests[idx]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Status history ----------
app.get('/api/requests/:id/status-history', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const db = loadDatabase();
    const logs = db.request_status_log.filter(l => l.request_id === id).sort((a, b) => b.id - a.id);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Notifications ----------
app.get('/api/requests/:id/notifications', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const db = loadDatabase();
    const list = (db.notifications || []).filter(n => n.request_id === id).sort((a, b) => b.id - a.id);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Backup ----------
app.get('/api/backup/export', requireManager, async (_req, res) => {
  const db = loadDatabase();
  res.setHeader('Content-disposition', 'attachment; filename=backup.json');
  res.setHeader('Content-type', 'application/json');
  res.json(db);
});

app.post('/api/backup/import', requireManager, async (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
      return res.status(400).json({ error: 'Неверный формат' });
    }
    const db: DBStructure = {
      requests: Array.isArray(incoming.requests) ? incoming.requests : [],
      archived_requests: Array.isArray(incoming.archived_requests) ? incoming.archived_requests : [],
      request_status_log: Array.isArray(incoming.request_status_log) ? incoming.request_status_log : [],
      escalations: Array.isArray(incoming.escalations) ? incoming.escalations : [],
      notifications: Array.isArray(incoming.notifications) ? incoming.notifications : [],
      users: Array.isArray(incoming.users) ? incoming.users : [],
      sessions: Array.isArray(incoming.sessions) ? incoming.sessions : [],
    };
    await queueSaveDatabase(db);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Bootstrap ----------
{
  const db = loadDatabase();
  ensureDefaultUsers(db);
  console.log('DB ready:', dbPath);
}

// ---------- Vite / static ----------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Server on :${PORT}`));
}

startServer();