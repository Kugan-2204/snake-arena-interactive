import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi, leaderboardApi, gamesApi, User } from './api';

describe('API Service', () => {
  describe('authApi', () => {
    describe('signup', () => {
      it('should create a new user', async () => {
        const result = await authApi.signup('testuser', 'test@example.com', 'password123');
        expect('user' in result).toBe(true);
        if ('user' in result) {
          expect(result.user.username).toBe('testuser');
          expect(result.user.email).toBe('test@example.com');
          expect(result.token).toBeDefined();
        }
      });

      it('should fail with duplicate email', async () => {
        await authApi.signup('user1', 'duplicate@example.com', 'password123');
        const result = await authApi.signup('user2', 'duplicate@example.com', 'password123');
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toBe('Email already registered');
        }
      });

      it('should fail with duplicate username', async () => {
        await authApi.signup('duplicateuser', 'email1@example.com', 'password123');
        const result = await authApi.signup('duplicateuser', 'email2@example.com', 'password123');
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toBe('Username already taken');
        }
      });
    });

    describe('login', () => {
      it('should login with correct credentials', async () => {
        await authApi.signup('loginuser', 'login@example.com', 'password123');
        const result = await authApi.login('login@example.com', 'password123');
        expect('user' in result).toBe(true);
        if ('user' in result) {
          expect(result.user.email).toBe('login@example.com');
        }
      });

      it('should fail with wrong password', async () => {
        await authApi.signup('wrongpass', 'wrongpass@example.com', 'password123');
        const result = await authApi.login('wrongpass@example.com', 'wrongpassword');
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toBe('Invalid password');
        }
      });

      it('should fail with non-existent user', async () => {
        const result = await authApi.login('nonexistent@example.com', 'password123');
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toBe('User not found');
        }
      });
    });

    describe('getCurrentUser', () => {
      it('should return user for valid token', async () => {
        const signupResult = await authApi.signup('tokenuser', 'token@example.com', 'password123');
        if ('token' in signupResult) {
          const user = await authApi.getCurrentUser(signupResult.token);
          expect(user).not.toBeNull();
          expect(user?.username).toBe('tokenuser');
        }
      });

      it('should return null for invalid token', async () => {
        const user = await authApi.getCurrentUser('invalid-token');
        expect(user).toBeNull();
      });
    });
  });

  describe('leaderboardApi', () => {
    describe('getLeaderboard', () => {
      it('should return leaderboard entries', async () => {
        const entries = await leaderboardApi.getLeaderboard();
        expect(Array.isArray(entries)).toBe(true);
        expect(entries.length).toBeGreaterThan(0);
      });

      it('should filter by mode', async () => {
        const wallsEntries = await leaderboardApi.getLeaderboard('walls');
        wallsEntries.forEach(entry => {
          expect(entry.mode).toBe('walls');
        });
      });

      it('should respect limit', async () => {
        const entries = await leaderboardApi.getLeaderboard(undefined, 5);
        expect(entries.length).toBeLessThanOrEqual(5);
      });

      it('should return sorted by score descending', async () => {
        const entries = await leaderboardApi.getLeaderboard();
        for (let i = 1; i < entries.length; i++) {
          expect(entries[i - 1].score).toBeGreaterThanOrEqual(entries[i].score);
        }
      });
    });

    describe('submitScore', () => {
      it('should add a new score entry', async () => {
        const entry = await leaderboardApi.submitScore('user-1', 'TestPlayer', 1000, 'walls');
        expect(entry.username).toBe('TestPlayer');
        expect(entry.score).toBe(1000);
        expect(entry.mode).toBe('walls');
      });
    });
  });

  describe('gamesApi', () => {
    describe('getActivePlayers', () => {
      it('should return active players', async () => {
        const players = await gamesApi.getActivePlayers();
        expect(Array.isArray(players)).toBe(true);
        expect(players.length).toBeGreaterThan(0);
      });

      it('should return players with required properties', async () => {
        const players = await gamesApi.getActivePlayers();
        players.forEach(player => {
          expect(player.id).toBeDefined();
          expect(player.username).toBeDefined();
          expect(player.score).toBeDefined();
          expect(player.mode).toBeDefined();
          expect(player.snake).toBeDefined();
          expect(player.food).toBeDefined();
          expect(player.direction).toBeDefined();
        });
      });
    });

    describe('watchPlayer', () => {
      it('should return player data for valid id', async () => {
        const players = await gamesApi.getActivePlayers();
        if (players.length > 0) {
          const player = await gamesApi.watchPlayer(players[0].id);
          expect(player).not.toBeNull();
          expect(player?.id).toBe(players[0].id);
        }
      });

      it('should return null for invalid id', async () => {
        const player = await gamesApi.watchPlayer('invalid-id');
        expect(player).toBeNull();
      });
    });
  });
});
