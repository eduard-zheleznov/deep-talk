const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const CACHE_PREFIX = 'pro_obshenie_api_cache_v1';

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
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
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
    this.setToken(null);
  }

  getCacheKey(endpoint) {
    return `${CACHE_PREFIX}:${fingerprint(this.token || 'anonymous')}:${endpoint}`;
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
    return this.request(`/api/groups/${groupId}/question-history`, {
      method: 'PUT',
      body: JSON.stringify({ history }),
    });
  }

  // Questions
  async getNextQuestion(groupId) {
    return this.request(`/api/questions/next/${groupId}`);
  }

  async markQuestion(questionId, status, groupId = null) {
    return this.request(`/api/questions/${questionId}/mark?status=${status}${groupId ? `&group_id=${groupId}` : ''}`, {
      method: 'POST',
    });
  }

  // Admin
  async seedQuestions() {
    return this.request('/api/admin/seed-questions', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
