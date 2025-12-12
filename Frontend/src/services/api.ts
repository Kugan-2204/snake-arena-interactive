export interface User {
  id: string;
  username: string;
  email: string;
  highScore: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  mode: 'pass-through' | 'walls';
  date: string;
}

export interface ActivePlayer {
  id: string;
  username: string;
  score: number;
  mode: 'pass-through' | 'walls';
  snake: { x: number; y: number }[];
  food: { x: number; y: number };
  direction: 'up' | 'down' | 'left' | 'right';
}

// In production (single container), API is relative. In dev, we can use env var or localhost.
const API_Base = import.meta.env.VITE_API_URL || '';

const getHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string } | { error: string }> {
    try {
      const response = await fetch(`${API_Base}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.detail || 'Login failed' };
      }
      return data;
    } catch (error) {
      return { error: 'Network error' };
    }
  },

  async signup(username: string, email: string, password: string): Promise<{ user: User; token: string } | { error: string }> {
    try {
      const response = await fetch(`${API_Base}/auth/signup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.detail || 'Signup failed' };
      }
      return data;
    } catch (error) {
      return { error: 'Network error' };
    }
  },

  async logout(token: string): Promise<void> {
    try {
      await fetch(`${API_Base}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(token),
      });
    } catch (e) {
      console.error(e);
    }
  },

  async getCurrentUser(token: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_Base}/auth/me`, {
        headers: getHeaders(token),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      return null;
    }
  },
};

// Leaderboard API
export const leaderboardApi = {
  async getLeaderboard(mode?: 'pass-through' | 'walls', limit = 10): Promise<LeaderboardEntry[]> {
    const url = new URL(`${API_Base}/leaderboard/`);
    if (mode) url.searchParams.append('mode', mode);
    url.searchParams.append('limit', limit.toString());

    const response = await fetch(url.toString());
    if (!response.ok) return [];
    return await response.json();
  },

  async submitScore(token: string, score: number, mode: 'pass-through' | 'walls'): Promise<LeaderboardEntry> {
    const response = await fetch(`${API_Base}/leaderboard/`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ score, mode }),
    });
    if (!response.ok) throw new Error('Failed to submit score');
    return await response.json();
  },
};

// Active games API (for spectator mode)
export const gamesApi = {
  async getActivePlayers(): Promise<ActivePlayer[]> {
    const response = await fetch(`${API_Base}/games/active`);
    if (!response.ok) return [];
    return await response.json();
  },

  async watchPlayer(playerId: string): Promise<ActivePlayer | null> {
    const response = await fetch(`${API_Base}/games/active/${playerId}`);
    if (!response.ok) return null;
    return await response.json();
  },
};
