const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const CACHE_PREFIX = 'pro_obshenie_api_cache_v1';
const QUEUE_PREFIX = 'pro_obshenie_offline_queue_v1';

const applyHistoryAction = (history = {}, questionId, action) => {
  const used = Array.isArray(history.used) ? history.used : [];
  const skipped = Array.isArray(history.skipped) ? history.skipped : [];

  if (action === 'used') {
    return {
      used: used.includes(questionId) ? used : [...used, questionId],
      skipped: skipped.filter((id) => id !== questionId),
    };
  }

  if (action === 'skipped' && !used.includes(questionId)) {
    return {
      used,
      skipped: skipped.includes(questionId) ? skipped : [...skipped, questionId],
    };
  }

  return { used, skipped };
};

const fingerprint = (value = '') => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
};

const canCacheEndpoint = (endpoint) => (
  endpoint === '/api/profile'
  || endpoint === '/api/groups'
  || /^\/api\/groups\/[^/]+\/question-config$/.test(endpoint)
);

class ApiClient {
  constructor() {
    this.baseURL = API_URL;
    this.token = localStorage.getItem('auth_token');
    this.flushingQueue = false;
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flushOfflineQueue());
      window.addEventListener('focus', () => this.flushOfflineQueue());
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.flushOfflineQueue();
      });
      window.setInterval(() => this.flushOfflineQueue(), 15000);
      if (navigator.onLine) setTimeout(() => this.flushOfflineQueue(), 0);
    }
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setTimeout(() => this.flushOfflineQueue(), 0);
      }
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();
    const config = {
      ...options,
      headers: this.getHeaders(),
    };

    if (method !== 'GET' && typeof navigator !== 'undefined' && !navigator.onLine) {
      const error = new Error('Для этого действия нужно подключение к интернету');
      error.code = 'OFFLINE';
      throw error;
    }

    if (method === 'GET' && typeof navigator !== 'undefined' && !navigator.onLine) {
      const cached = this.readCache(endpoint);
      if (cached !== null) return cached;
      const error = new Error('Нет подключения и сохранённых данных для этого раздела');
      error.code = 'OFFLINE';
      throw error;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const body = await response.json().catch(() => ({ detail: 'Ошибка сети' }));
        const error = new Error(body.detail || `HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      if (method === 'GET') this.writeCache(endpoint, data);
      return data;
    } catch (error) {
      if (method === 'GET' && (!navigator.onLine || error instanceof TypeError)) {
        const cached = this.readCache(endpoint);
        if (cached !== null) return cached;
        const offlineError = new Error('Нет подключения и сохранённых данных для этого раздела');
        offlineError.code = 'OFFLINE';
        throw offlineError;
      }
      throw error;
    }
  }

  // Auth
  async register(email, password, secretQuestion, secretAnswer, name = '') {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, secret_question: secretQuestion, secret_answer: secretAnswer, name }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  logout() {
    const tokenFingerprint = fingerprint(this.token || 'anonymous');
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`${CACHE_PREFIX}:${tokenFingerprint}:`))
      .forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem(`${QUEUE_PREFIX}:${tokenFingerprint}`);
    this.setToken(null);
  }

  getCacheKey(endpoint) {
    return `${CACHE_PREFIX}:${fingerprint(this.token || 'anonymous')}:${endpoint}`;
  }

  getQueueKey() {
    return `${QUEUE_PREFIX}:${fingerprint(this.token || 'anonymous')}`;
  }

  readOfflineQueue() {
    try {
      const queue = JSON.parse(localStorage.getItem(this.getQueueKey()) || '[]');
      return Array.isArray(queue) ? queue : [];
    } catch (error) {
      return [];
    }
  }

  writeOfflineQueue(queue) {
    try {
      if (queue.length === 0) localStorage.removeItem(this.getQueueKey());
      else localStorage.setItem(this.getQueueKey(), JSON.stringify(queue));
    } catch (error) {
      // The action remains reflected in the regular cache if storage is full.
    }
  }

  enqueueOfflineAction(action) {
    const queue = this.readOfflineQueue();
    const dedupeKey = `${action.type}:${action.groupId || ''}:${action.questionId}`;
    const nextQueue = queue.filter((item) => (
      `${item.type}:${item.groupId || ''}:${item.questionId}` !== dedupeKey
    ));
    nextQueue.push({ ...action, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` });
    this.writeOfflineQueue(nextQueue);
  }

  updateCachedQuestionHistory(groupId, history) {
    const endpoint = `/api/groups/${groupId}/question-config`;
    const config = this.readCache(endpoint) || { categories: [] };
    const updated = { ...config, history };
    this.writeCache(endpoint, updated);
    return updated;
  }

  async flushOfflineQueue() {
    if (this.flushingQueue || !this.token || typeof navigator === 'undefined' || !navigator.onLine) return;
    const snapshot = this.readOfflineQueue();
    if (snapshot.length === 0) return;

    this.flushingQueue = true;
    const completed = new Set();
    try {
      for (const action of snapshot) {
        try {
          if (action.type === 'history') {
            const endpoint = `/api/groups/${action.groupId}/question-config`;
            const config = await this.request(endpoint);
            const history = applyHistoryAction(config.history, action.questionId, action.action);
            const saved = await this.request(`/api/groups/${action.groupId}/question-history`, {
              method: 'PUT',
              body: JSON.stringify({ history }),
            });
            this.writeCache(endpoint, saved);
          } else if (action.type === 'mark') {
            const groupQuery = action.groupId ? `&group_id=${action.groupId}` : '';
            await this.request(`/api/questions/${action.questionId}/mark?status=${action.status}${groupQuery}`, {
              method: 'POST',
            });
          }
          completed.add(action.id);
        } catch (error) {
          if (error?.code === 'OFFLINE' || error instanceof TypeError) break;
          completed.add(action.id);
        }
      }
    } finally {
      const currentQueue = this.readOfflineQueue();
      this.writeOfflineQueue(currentQueue.filter((item) => !completed.has(item.id)));
      this.flushingQueue = false;
    }
  }

  readCache(endpoint) {
    if (!canCacheEndpoint(endpoint)) return null;
    try {
      const cached = JSON.parse(localStorage.getItem(this.getCacheKey(endpoint)) || 'null');
      return cached?.data ?? null;
    } catch (error) {
      return null;
    }
  }

  writeCache(endpoint, data) {
    if (!canCacheEndpoint(endpoint)) return;
    try {
      localStorage.setItem(this.getCacheKey(endpoint), JSON.stringify({ data, savedAt: Date.now() }));
    } catch (error) {
      // Storage can be unavailable in private mode or full on older devices.
    }
  }

  updateCachedGroups(update) {
    const groups = this.readCache('/api/groups');
    if (!Array.isArray(groups)) return;
    this.writeCache('/api/groups', update(groups));
  }

  // Profile
  async getProfile() {
    return this.request('/api/profile');
  }

  async updateProfile(profileData) {
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Groups
  async createGroup(name) {
    const group = await this.request('/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    this.updateCachedGroups((groups) => (
      groups.some((item) => item.id === group.id) ? groups : [...groups, group]
    ));
    return group;
  }

  async getGroups() {
    return this.request('/api/groups');
  }

  async setGroupArchived(groupId, archived) {
    const group = await this.request(`/api/groups/${groupId}/archive`, {
      method: 'PUT',
      body: JSON.stringify({ archived }),
    });
    this.updateCachedGroups((groups) => groups.map((item) => (
      item.id === group.id ? group : item
    )));
    return group;
  }

  async deleteGroup(groupId) {
    const result = await this.request(`/api/groups/${groupId}`, {
      method: 'DELETE',
    });
    this.updateCachedGroups((groups) => groups.filter((item) => item.id !== groupId));
    localStorage.removeItem(this.getCacheKey(`/api/groups/${groupId}/question-config`));
    return result;
  }

  async createInvite(groupId) {
    return this.request(`/api/groups/${groupId}/invite`, {
      method: 'POST',
    });
  }

  async joinGroup(inviteCode) {
    const group = await this.request(`/api/groups/join/${inviteCode}`, {
      method: 'POST',
    });
    this.updateCachedGroups((groups) => {
      const exists = groups.some((item) => item.id === group.id);
      return exists
        ? groups.map((item) => item.id === group.id ? group : item)
        : [...groups, group];
    });
    return group;
  }

  async updateMemberRole(groupId, memberId, role) {
    return this.request(`/api/groups/${groupId}/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async getGroupQuestionConfig(groupId) {
    return this.request(`/api/groups/${groupId}/question-config`);
  }

  async updateGroupQuestionCategories(groupId, categories) {
    return this.request(`/api/groups/${groupId}/question-categories`, {
      method: 'PUT',
      body: JSON.stringify({ categories }),
    });
  }

  async updateGroupQuestionHistory(groupId, history) {
    const config = await this.request(`/api/groups/${groupId}/question-history`, {
      method: 'PUT',
      body: JSON.stringify({ history }),
    });
    this.writeCache(`/api/groups/${groupId}/question-config`, config);
    return config;
  }

  async updateGroupQuestionHistoryAction(groupId, questionId, action, history) {
    const saveOffline = () => {
      this.enqueueOfflineAction({ type: 'history', groupId, questionId, action });
      return this.updateCachedQuestionHistory(groupId, history);
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) return saveOffline();

    try {
      return await this.updateGroupQuestionHistory(groupId, history);
    } catch (error) {
      if (error?.code === 'OFFLINE' || error instanceof TypeError) return saveOffline();
      throw error;
    }
  }

  // Questions
  async getNextQuestion(groupId) {
    return this.request(`/api/questions/next/${groupId}`);
  }

  async markQuestion(questionId, status, groupId = null) {
    const saveOffline = () => {
      this.enqueueOfflineAction({ type: 'mark', groupId, questionId, status });
      return { success: true, status, queued: true };
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) return saveOffline();

    try {
      return await this.request(`/api/questions/${questionId}/mark?status=${status}${groupId ? `&group_id=${groupId}` : ''}`, {
        method: 'POST',
      });
    } catch (error) {
      if (error?.code === 'OFFLINE' || error instanceof TypeError) return saveOffline();
      throw error;
    }
  }

  // Admin
  async seedQuestions() {
    return this.request('/api/admin/seed-questions', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
