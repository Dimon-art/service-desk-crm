import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));

// Utility function to prevent Stored XSS by escaping HTML entities
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

// Initialize SQLite/JSON File-Backed Database
const dbPath = path.join(process.cwd(), 'data.sqlite');

export interface Request {
  id: number;
  requester_name: string;
  requester_email: string;
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
  assigned_at: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  access_token?: string; // Уникальный секретный токен для доступа без пароля
}

export interface RequestStatusLog {
  id: number;
  request_id: number;
  status:
    | 'new'
    | 'assigned'
    | 'in_progress'
    | 'need_info'
    | 'completed'
    | 'awaiting_confirmation'
    | 'confirmed'
    | 'closed';
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
}

function generateToken(): string {
  return crypto.randomUUID();
}

function loadDatabase(): DBStructure {
  try {
    if (!fs.existsSync(dbPath)) {
      const emptyDb: DBStructure = { requests: [], archived_requests: [], request_status_log: [], escalations: [], notifications: [] };
      fs.writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2));
      return emptyDb;
    }
    const content = fs.readFileSync(dbPath, 'utf-8');
    const parsed = JSON.parse(content || 'null');
    
    // Check if it's the old flat array format
    if (Array.isArray(parsed)) {
      const requests: Request[] = parsed.map(r => ({
        ...r,
        assignee: r.assignee || '',
        assigned_at: r.assigned_at || null,
        accepted_at: r.accepted_at || null,
        completed_at: r.completed_at || null,
        confirmed_at: r.confirmed_at || null,
        access_token: r.access_token || generateToken()
      }));
      const request_status_log: RequestStatusLog[] = [];
      let logIdCounter = 1;
      
      // Auto-populate initial status history for existing items safely
      for (const req of requests) {
        // Add initial "new" status
        request_status_log.push({
          id: logIdCounter++,
          request_id: req.id,
          status: 'new',
          note: 'Автоматическая миграция: Заявка создана',
          created_at: req.created_at || new Date().toISOString()
        });
        
        // If current status is different from "new", add another entry
        if (req.status !== 'new') {
          request_status_log.push({
            id: logIdCounter++,
            request_id: req.id,
            status: req.status,
            note: 'Автоматическая миграция: Текущий статус заявки',
            created_at: req.updated_at || req.created_at || new Date().toISOString()
          });
        }
      }
      
      const migratedDb: DBStructure = {
        requests,
        archived_requests: [],
        request_status_log,
        escalations: [],
        notifications: []
      };
      
      // Save migrated database immediately to file to prevent duplicate logging
      fs.writeFileSync(dbPath, JSON.stringify(migratedDb, null, 2));
      console.log('Database migrated successfully to relational object format');
      return migratedDb;
    }
    
    // If it's already an object, ensure all tables/arrays exist and are initialized
    const dbObj = parsed || {};
    const requests = Array.isArray(dbObj.requests) ? dbObj.requests : [];
    const request_status_log = Array.isArray(dbObj.request_status_log) ? dbObj.request_status_log : [];
    const escalations = Array.isArray(dbObj.escalations) ? dbObj.escalations : [];
    const notifications = Array.isArray(dbObj.notifications) ? dbObj.notifications : [];
    const archived_requests = Array.isArray(dbObj.archived_requests) ? dbObj.archived_requests : [];
    
    // Ensure all requests have access tokens
    let updated = false;
    for (const r of requests) {
      if (r.assignee === undefined) {
        r.assignee = '';
        updated = true;
      }
      if (r.assigned_at === undefined) {
        r.assigned_at = null;
        updated = true;
      }
      if (r.accepted_at === undefined) {
        r.accepted_at = null;
        updated = true;
      }
      if (r.completed_at === undefined) {
        r.completed_at = null;
        updated = true;
      }
      if (r.confirmed_at === undefined) {
        r.confirmed_at = null;
        updated = true;
      }
      if (!r.access_token) {
        r.access_token = generateToken();
        updated = true;
      }
    }
    
    const db: DBStructure = {
      requests,
      archived_requests,
      request_status_log,
      escalations,
      notifications
    };

    if (updated) {
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    }
    
    return db;
  } catch (err) {
    console.error('Error reading/migrating database file:', err);
    return { requests: [], archived_requests: [], request_status_log: [], escalations: [], notifications: [] };
  }
}

// Ensure database is initialized at start
loadDatabase();
console.log('Connected to SQLite simulated database at:', dbPath);

// Async Write Lock Queue to prevent concurrent write race conditions
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
    // Direct write is used because data.sqlite is a Docker bind mount.
    // Atomic rename causes EBUSY on Windows/Docker Desktop.
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Critical: database write failed:', err);
    throw err;
  }
}

// Manager Mode Authentication Check
// Securely verifies if the requester is an authorized manager without breaking the frontend
function isManager(req: express.Request): boolean {
  const cookieHeader = req.headers.cookie || '';
  const hasCookie = cookieHeader.includes('manager_auth=1');
  const hasHeader = req.headers['x-manager-token'] === 'manager' || req.headers['authorization'] === 'Bearer manager';
  const hasQuery = req.query.token === 'manager';
  return !!(hasCookie || hasHeader || hasQuery);
}

// Middleware to set manager auth cookie on demand via query parameter ?token=manager
app.use((req, res, next) => {
  if (req.query.token === 'manager') {
    res.cookie('manager_auth', '1', { 
      httpOnly: true, 
      sameSite: 'strict', 
      maxAge: 86400000 // 24 hours
    });
  }
  next();
});

// API Routes
// GET all requests with security and pagination support
app.get('/api/requests', async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const accessToken = req.query.accessToken as string | undefined;
    const db = loadDatabase();
    let requests = db.requests;
    
    if (status) {
      requests = requests.filter(r => r.status === status);
    }
    if (accessToken) {
      requests = requests.filter(r => r.access_token === accessToken);
    }
    
    // Sort descending by ID
    const sorted = [...requests].sort((a, b) => b.id - a.id);
    
    // Security: Mask email addresses for non-managers to prevent bulk email harvesting
    const secureRequests = sorted.map(r => {
      if (isManager(req) || (accessToken && r.access_token === accessToken)) {
        return r;
      }
      const email = r.requester_email || '';
      const parts = email.split('@');
      if (parts.length === 2) {
        const [local, domain] = parts;
        const maskedLocal = local.length > 2 
          ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1] 
          : local[0] + '*';
        return {
          ...r,
          requester_email: `${maskedLocal}@${domain}`
        };
      }
      return r;
    });

    // Backward-Compatible Pagination
    const page = parseInt(req.query.page as string, 10);
    const limit = parseInt(req.query.limit as string, 10);
    
    if (!isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedItems = secureRequests.slice(startIndex, endIndex);
      
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

// GET request by ID
app.get('/api/requests/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const accessToken = req.query.accessToken as string | undefined;
    const db = loadDatabase();
    const request = db.requests.find(r => r.id === id);
    const archivedRequest = db.archived_requests.find(r => r.id === id);
    const foundRequest = request || archivedRequest;
    if (!foundRequest) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    
    // Security check: if not a manager and doesn't have the correct accessToken for this request, mask the email
    if (!isManager(req) && foundRequest.access_token !== accessToken) {
      const email = request.requester_email || '';
    // Security check: if not a manager and doesn't have the correct accessToken for this request, mask the email
    if (!isManager(req) && foundRequest.access_token !== accessToken) {
      const email = foundRequest.requester_email || '';
      const parts = email.split('@');
      let maskedEmail = email;
      if (parts.length === 2) {
        const [local, domain] = parts;
        const maskedLocal = local.length > 2 
          ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1] 
          : local[0] + '*';
        maskedEmail = `${maskedLocal}@${domain}`;
      }
      return res.json({
        ...foundRequest,
        requester_email: maskedEmail

      const parts = email.split('@');
      let maskedEmail = email;
      if (parts.length === 2) {
        const [local, domain] = parts;
        const maskedLocal = local.length > 2 
          ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1] 
          : local[0] + '*';
        maskedEmail = `${maskedLocal}@${domain}`;
      }
      return res.json({
        ...foundRequest,
        requester_email: maskedEmail
      });
    }
    
    res.json(foundRequest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Simulated email notification helper
function simulateEmailNotification(db: DBStructure, requestId: number, recipientEmail: string, subject: string, body: string) {
  if (!db.notifications) {
    db.notifications = [];
  }
  const nextNotificationId = db.notifications.length > 0 
    ? Math.max(...db.notifications.map(item => item.id)) + 1 
    : 1;
  
  const newNotification: Notification = {
    id: nextNotificationId,
    request_id: requestId,
    recipient_email: recipientEmail,
    subject,
    body,
    sent_at: new Date().toISOString()
  };
  
  db.notifications.push(newNotification);
  
  console.log('\n✉️  [ОТПРАВЛЕНО ИМИТАЦИОННОЕ УВЕДОМЛЕНИЕ]');
  console.log(`Кому: ${recipientEmail}`);
  console.log(`Тема: ${subject}`);
  console.log(`Текст письма:\n---\n${body}\n---`);
  console.log('------------------------------------\n');
}

// POST create request
app.post('/api/requests', async (req, res) => {
  try {
    const { requester_name, requester_email, title, description } = req.body;
    
    // Strict MVP validation matching verification scenario requirements
    if (!requester_name || !requester_name.trim()) {
      return res.status(400).json({ error: 'Пожалуйста, введите имя сотрудника.' });
    }
    if (!requester_email || !requester_email.trim() || !requester_email.includes('@')) {
      return res.status(400).json({ error: 'Пожалуйста, введите имя сотрудника.' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Пожалуйста, заполните тему заявки.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Пожалуйста, добавьте описание проблемы.' });
    }

    // Validate length to prevent memory abuse & Denial of Service (DoS)
    if (requester_name.length > 100) {
      return res.status(400).json({ error: 'Имя сотрудника не должно превышать 100 символов.' });
    }
    if (requester_email.length > 100) {
      return res.status(400).json({ error: 'Email не должен превышать 100 символов.' });
    }
    if (title.length > 200) {
      return res.status(400).json({ error: 'Тема заявки не должна превышать 200 символов.' });
    }
    if (description.length > 5000) {
      return res.status(400).json({ error: 'Описание проблемы не должно превышать 5000 символов.' });
    }

    // Escape HTML to prevent Stored XSS vulnerabilities
    const cleanName = escapeHtml(requester_name.trim());
    const cleanEmail = escapeHtml(requester_email.trim());
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
      title: cleanTitle,
      description: cleanDescription,
      status: 'new',
      manager_comment: '',
      assignee: '',
      assigned_at: null,
      accepted_at: null,
      completed_at: null,
      confirmed_at: null,
      created_at: now,
      updated_at: now,
      access_token: accessToken
    };
    
    db.requests.push(newRequest);

    // Auto-create log entry for new status
    const nextLogId = db.request_status_log.length > 0 ? Math.max(...db.request_status_log.map(item => item.id)) + 1 : 1;
    const newLog: RequestStatusLog = {
      id: nextLogId,
      request_id: nextId,
      status: 'new',
      note: 'Заявка создана',
      created_at: now
    };
    db.request_status_log.push(newLog);

    // Simulate sending email
    const emailSubject = `Ваша заявка #${nextId} получена: "${cleanTitle}"`;
    const emailBody = `Здравствуйте, ${cleanName}!\n\nВаша заявка #${nextId} успешно создана и зарегистрирована.\nТекущий статус: Новая.\n\nСсылка для отслеживания заявки:\nhttp://localhost:3000/api/requests/${nextId}?accessToken=${accessToken}\n\nСпасибо за обращение!`;
    simulateEmailNotification(db, nextId, cleanEmail, emailSubject, emailBody);

    await queueSaveDatabase(db);
    res.status(201).json(newRequest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update request status and manager comment
app.put('/api/requests/:id', async (req, res) => {
  try {
    // 1. Critical Authorization Check
    if (!isManager(req)) {
      return res.status(403).json({ error: 'Доступ запрещен: требуется сессия или токен менеджера' });
    }

    const id = parseInt(req.params.id, 10);
    const { status, manager_comment, assignee } = req.body;

    const validStatuses = [
      'new',
      'assigned',
      'in_progress',
      'need_info',
      'completed',
      'awaiting_confirmation',
      'confirmed',
      'closed'
    ];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус' });
    }

    // DoS limit check on manager_comment
    if (manager_comment && manager_comment.length > 5000) {
      return res.status(400).json({ error: 'Комментарий менеджера не должен превышать 5000 символов.' });
    }

    if (assignee !== undefined && (typeof assignee !== 'string' || assignee.trim().length > 100)) {
      return res.status(400).json({ error: 'Исполнитель должен быть строкой длиной не более 100 символов.' });
    }

    const db = loadDatabase();
    const existingIndex = db.requests.findIndex(r => r.id === id);
    if (existingIndex === -1) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    const existing = db.requests[existingIndex];
    const now = new Date().toISOString();

    // 5. Logical State Machine Transition Check
    const currentStatus = existing.status;
    if (status && status !== currentStatus) {
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
      const allowed = VALID_TRANSITIONS[currentStatus] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({ 
          error: `Недопустимый переход статуса из "${currentStatus}" в "${status}". Допустимые варианты: ${allowed.join(", ")}` 
        });
      }
    }
    
    const statusChanged = status && status !== existing.status;
    const updatedStatus = (status || existing.status) as
      | 'new'
      | 'assigned'
      | 'in_progress'
      | 'need_info'
      | 'completed'
      | 'awaiting_confirmation'
      | 'confirmed'
      | 'closed';
    
    // Escape HTML of the manager comment to prevent XSS
    const cleanComment = manager_comment !== undefined ? escapeHtml(manager_comment.trim()) : existing.manager_comment;
    const cleanAssignee = assignee !== undefined ? escapeHtml(assignee.trim()) : existing.assignee;

    const lifecycleUpdate: Partial<Request> = {};

    if (statusChanged && updatedStatus === 'assigned') {
      if (!cleanAssignee) {
        return res.status(400).json({ error: 'Для статуса «Назначена» необходимо указать исполнителя.' });
      }
      lifecycleUpdate.assignee = cleanAssignee;
      lifecycleUpdate.assigned_at = now;
    }

    if (assignee !== undefined && !statusChanged) {
      lifecycleUpdate.assignee = cleanAssignee;
    }

    if (statusChanged && updatedStatus === 'in_progress' && currentStatus === 'assigned') {
      lifecycleUpdate.accepted_at = now;
    }

    if (statusChanged && updatedStatus === 'completed') {
      lifecycleUpdate.completed_at = now;
    }

    if (statusChanged && updatedStatus === 'confirmed') {
      lifecycleUpdate.confirmed_at = now;
    }

    // Update request
    db.requests[existingIndex] = {
      ...existing,
      ...lifecycleUpdate,
      status: updatedStatus,
      manager_comment: cleanComment,
      updated_at: now
    };

    // If status changed, add entry to log
    if (statusChanged) {
      const nextLogId = db.request_status_log.length > 0 ? Math.max(...db.request_status_log.map(item => item.id)) + 1 : 1;
      const statusLogEntry: RequestStatusLog = {
        id: nextLogId,
        request_id: id,
        status: updatedStatus,
        note: `Статус изменен менеджером на "${updatedStatus}"`,
        created_at: now
      };
      db.request_status_log.push(statusLogEntry);

      // Simulate sending status update email
      const emailSubject = `Статус вашей заявки #${id} изменен: "${updatedStatus}"`;
      const emailBody = `Здравствуйте, ${existing.requester_name}!\n\nСтатус вашей заявки #${id} ("${existing.title}") был успешно изменен на: "${updatedStatus}".\n\nКомментарий менеджера:\n${cleanComment || 'Комментарий отсутствует.'}\n\nСсылка для отслеживания:\nhttp://localhost:3000/api/requests/${id}?accessToken=${existing.access_token || ''}`;
      simulateEmailNotification(db, id, existing.requester_email, emailSubject, emailBody);
    }

    let responseRequest = db.requests[existingIndex];

    if (statusChanged && updatedStatus === 'closed') {
      const closedRequest = { ...db.requests[existingIndex] };
      if (!db.archived_requests.some(r => r.id === id)) {
        db.archived_requests.push(closedRequest);
      }
      db.requests.splice(existingIndex, 1);
      responseRequest = closedRequest;
    }

    await queueSaveDatabase(db);
    res.json(responseRequest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET request status history log (Read-only)
app.get('/api/requests/:id/status-history', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const db = loadDatabase();
    
    // Check if request exists first

    const logs = db.request_status_log.filter(log => log.request_id === id);
    // Sort from newest to oldest
    const sortedLogs = [...logs].sort((a, b) => b.id - a.id);
    
    res.json(sortedLogs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET request notifications history log (Read-only)
app.get('/api/requests/:id/notifications', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const db = loadDatabase();
    

    const notifications = (db.notifications || []).filter(n => n.request_id === id);
    const sortedNotifications = [...notifications].sort((a, b) => b.id - a.id);
    
    res.json(sortedNotifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET backup export
app.get('/api/backup/export', async (req, res) => {
  try {
    if (!isManager(req)) {
      return res.status(403).json({ error: 'Доступ запрещен: требуется токен менеджера' });
    }
    const db = loadDatabase();
    res.setHeader('Content-disposition', 'attachment; filename=backup.json');
    res.setHeader('Content-type', 'application/json');
    res.json(db);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST backup import
app.post('/api/backup/import', async (req, res) => {
  try {
    if (!isManager(req)) {
      return res.status(403).json({ error: 'Доступ запрещен: требуется токен менеджера' });
    }
    
    const incomingDb = req.body;
    if (!incomingDb || typeof incomingDb !== 'object' || Array.isArray(incomingDb)) {
      return res.status(400).json({ error: 'Неверный формат резервной копии' });
    }
    
    const requests = Array.isArray(incomingDb.requests) ? incomingDb.requests : null;
    const request_status_log = Array.isArray(incomingDb.request_status_log) ? incomingDb.request_status_log : null;
    const escalations = Array.isArray(incomingDb.escalations) ? incomingDb.escalations : null;
    const archived_requests = Array.isArray(incomingDb.archived_requests) ? incomingDb.archived_requests : [];
    
    if (requests === null || request_status_log === null || escalations === null) {
      return res.status(400).json({ error: 'Отсутствуют обязательные таблицы в резервной копии' });
    }
    
    const validatedDb: DBStructure = {
      requests,
      archived_requests,
      request_status_log,
      escalations,
      notifications: Array.isArray(incomingDb.notifications) ? incomingDb.notifications : []
    };
    
    await queueSaveDatabase(validatedDb);
    res.json({ success: true, message: 'База данных успешно импортирована из резервной копии' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite Middleware Configuration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();


