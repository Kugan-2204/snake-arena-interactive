// Centralized mock API service
// All backend calls are mocked here for easy replacement with real backend later

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

// Mock data storage (simulates database)
const mockUsers: Map<string, User & { password: string }> = new Map();
const mockLeaderboard: LeaderboardEntry[] = [
  { id: '1', username: 'SnakeMaster', score: 2450, mode: 'walls', date: '2024-12-10' },
  { id: '2', username: 'PixelPro', score: 2100, mode: 'pass-through', date: '2024-12-10' },
  { id: '3', username: 'RetroGamer', score: 1890, mode: 'walls', date: '2024-12-09' },
  { id: '4', username: 'NeonNinja', score: 1650, mode: 'pass-through', date: '2024-12-09' },
  { id: '5', username: 'ArcadeKing', score: 1420, mode: 'walls', date: '2024-12-08' },
  { id: '6', username: 'CyberSnake', score: 1200, mode: 'pass-through', date: '2024-12-08' },
  { id: '7', username: 'BitBiter', score: 980, mode: 'walls', date: '2024-12-07' },
  { id: '8', username: 'GridRunner', score: 850, mode: 'pass-through', date: '2024-12-07' },
  { id: '9', username: 'VoidViper', score: 720, mode: 'walls', date: '2024-12-06' },
  { id: '10', username: 'DigitalDragon', score: 600, mode: 'pass-through', date: '2024-12-06' },
];

// Simulated delay for realistic API behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string } | { error: string }> {
    await delay(500);
    
    const user = Array.from(mockUsers.values()).find(u => u.email === email);
    if (!user) {
      return { error: 'User not found' };
    }
    if (user.password !== password) {
      return { error: 'Invalid password' };
    }
    
    const { password: _, ...userWithoutPassword } = user;
    return { 
      user: userWithoutPassword, 
      token: `mock-token-${user.id}` 
    };
  },

  async signup(username: string, email: string, password: string): Promise<{ user: User; token: string } | { error: string }> {
    await delay(500);
    
    const existingEmail = Array.from(mockUsers.values()).find(u => u.email === email);
    if (existingEmail) {
      return { error: 'Email already registered' };
    }
    
    const existingUsername = Array.from(mockUsers.values()).find(u => u.username === username);
    if (existingUsername) {
      return { error: 'Username already taken' };
    }

    const newUser: User & { password: string } = {
      id: `user-${Date.now()}`,
      username,
      email,
      password,
      highScore: 0,
      createdAt: new Date().toISOString(),
    };
    
    mockUsers.set(newUser.id, newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    return { 
      user: userWithoutPassword, 
      token: `mock-token-${newUser.id}` 
    };
  },

  async logout(): Promise<void> {
    await delay(200);
  },

  async getCurrentUser(token: string): Promise<User | null> {
    await delay(300);
    const userId = token.replace('mock-token-', '');
    const user = mockUsers.get(userId);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },
};

// Leaderboard API
export const leaderboardApi = {
  async getLeaderboard(mode?: 'pass-through' | 'walls', limit = 10): Promise<LeaderboardEntry[]> {
    await delay(300);
    let entries = [...mockLeaderboard];
    if (mode) {
      entries = entries.filter(e => e.mode === mode);
    }
    return entries.slice(0, limit).sort((a, b) => b.score - a.score);
  },

  async submitScore(userId: string, username: string, score: number, mode: 'pass-through' | 'walls'): Promise<LeaderboardEntry> {
    await delay(400);
    const entry: LeaderboardEntry = {
      id: `score-${Date.now()}`,
      username,
      score,
      mode,
      date: new Date().toISOString().split('T')[0],
    };
    mockLeaderboard.push(entry);
    return entry;
  },
};

// Active games API (for spectator mode)
export const gamesApi = {
  async getActivePlayers(): Promise<ActivePlayer[]> {
    await delay(300);
    // Return simulated active players
    return [
      {
        id: 'player-1',
        username: 'SnakeMaster',
        score: 340,
        mode: 'walls',
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
        food: { x: 15, y: 12 },
        direction: 'right',
      },
      {
        id: 'player-2',
        username: 'NeonNinja',
        score: 180,
        mode: 'pass-through',
        snake: [{ x: 5, y: 5 }, { x: 5, y: 4 }, { x: 5, y: 3 }],
        food: { x: 12, y: 8 },
        direction: 'down',
      },
      {
        id: 'player-3',
        username: 'RetroGamer',
        score: 560,
        mode: 'walls',
        snake: [{ x: 12, y: 8 }, { x: 11, y: 8 }, { x: 10, y: 8 }, { x: 9, y: 8 }],
        food: { x: 3, y: 15 },
        direction: 'right',
      },
    ];
  },

  async watchPlayer(playerId: string): Promise<ActivePlayer | null> {
    await delay(200);
    const players = await this.getActivePlayers();
    return players.find(p => p.id === playerId) || null;
  },
};
