const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

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
    const config = {
      ...options,
      headers: this.getHeaders(),
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
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
    this.setToken(null);
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
    return this.request('/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getGroups() {
    return this.request('/api/groups');
  }

  async setGroupArchived(groupId, archived) {
    return this.request(`/api/groups/${groupId}/archive`, {
      method: 'PUT',
      body: JSON.stringify({ archived }),
    });
  }

  async createInvite(groupId) {
    return this.request(`/api/groups/${groupId}/invite`, {
      method: 'POST',
    });
  }

  async joinGroup(inviteCode) {
    return this.request(`/api/groups/join/${inviteCode}`, {
      method: 'POST',
    });
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
