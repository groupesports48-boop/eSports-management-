import {
  User,
  MatchSchedule,
  WhatsAppGroup,
  MatchResult,
  AppNotification,
  ExtractedOcrData,
  MatchType,
  MatchResultStatus,
  PlayerRole,
} from '../types';

const TOKEN_KEY = 'destroyed_esports_token';

const BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_APP_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  ''
).replace(/\/$/, '');

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
      ? endpoint
      : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data as T;
  },

  // Auth
  auth: {
    async signup(payload: { fullName: string; email: string; password: string; confirmPassword?: string }) {
      const data = await api.request<{ user: User; token: string }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      api.setToken(data.token);
      return data;
    },

    async login(payload: { email: string; password: string }) {
      const data = await api.request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      api.setToken(data.token);
      return data;
    },

    async me() {
      return api.request<{ user: User }>('/api/auth/me');
    },

    async logout() {
      try {
        await api.request('/api/auth/logout', { method: 'POST' });
      } finally {
        api.clearToken();
      }
    },
  },

  // Matches
  matches: {
    async list() {
      return api.request<MatchSchedule[]>('/api/matches');
    },

    async create(payload: {
      name?: string;
      matchDate: string;
      matchTime: string;
      matchType: MatchType;
      whatsappGroupId?: string;
      whatsappUrl?: string;
      notes?: string;
    }) {
      return api.request<MatchSchedule>('/api/matches', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async update(id: string, payload: Partial<MatchSchedule>) {
      return api.request<MatchSchedule>(`/api/matches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },

    async delete(id: string) {
      return api.request<{ success: boolean }>(`/api/matches/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // WhatsApp Groups
  whatsapp: {
    async list() {
      return api.request<WhatsAppGroup[]>('/api/whatsapp-groups');
    },

    async create(payload: { name: string; url: string; note?: string }) {
      return api.request<WhatsAppGroup>('/api/whatsapp-groups', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async update(id: string, payload: { name?: string; url?: string; note?: string }) {
      return api.request<WhatsAppGroup>(`/api/whatsapp-groups/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },

    async delete(id: string) {
      return api.request<{ success: boolean }>(`/api/whatsapp-groups/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Match History / Results
  results: {
    async list() {
      return api.request<MatchResult[]>('/api/results');
    },

    async create(payload: {
      matchDate: string;
      matchTime?: string;
      matchType: MatchType;
      result: MatchResultStatus;
      placement?: number;
      kills?: number;
      damage?: number;
      notes?: string;
      screenshotUrl?: string;
      matchScheduleId?: string;
      entryFee?: number;
      prizeMoney?: number;
      extraExpenses?: number;
      expenseNotes?: string;
    }) {
      return api.request<MatchResult>('/api/results', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async update(id: string, payload: Partial<MatchResult>) {
      return api.request<MatchResult>(`/api/results/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },

    async delete(id: string) {
      return api.request<{ success: boolean }>(`/api/results/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Profit & Loss Financial Records
  profitLoss: {
    async update(
      id: string,
      payload: {
        entryFee?: number;
        prizeMoney?: number;
        extraExpenses?: number;
        expenseNotes?: string;
      }
    ) {
      return api.request<MatchResult>(`/api/profit-loss/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
  },

  // Profile
  profile: {
    async get() {
      return api.request<User>('/api/profile');
    },

    async update(payload: {
      fullName?: string;
      ign?: string;
      bio?: string;
      role?: PlayerRole;
      avatarUrl?: string;
      bannerUrl?: string;
    }) {
      return api.request<User>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
  },

  // Notifications
  notifications: {
    async list() {
      return api.request<AppNotification[]>('/api/notifications');
    },

    async markRead() {
      return api.request<{ success: boolean }>('/api/notifications/read', {
        method: 'POST',
      });
    },

    async clear() {
      return api.request<{ success: boolean }>('/api/notifications', {
        method: 'DELETE',
      });
    },
  },

  // OCR
  ocr: {
    async analyze(imageBase64: string, mimeType: string = 'image/png') {
      return api.request<{
        success?: boolean;
        fallback?: boolean;
        message?: string;
        extracted: ExtractedOcrData;
      }>('/api/ocr/analyze', {
        method: 'POST',
        body: JSON.stringify({ imageBase64, mimeType }),
      });
    },
  },
};
