import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authApi, leaderboardApi, gamesApi } from './api';

// Mock global fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('API Service Client', () => {
  beforeEach(() => {
    fetchMock.mockClear();
  });

  describe('authApi', () => {
    describe('signup', () => {
      it('should call signup endpoint', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: '1', username: 'test' }, token: 'abc' }),
        });

        const result = await authApi.signup('test', 'test@example.com', 'pass');

        expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/auth/signup', expect.any(Object));
        expect('user' in result).toBe(true);
      });

      it('should handle errors', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: false,
          json: async () => ({ detail: 'Error message' }),
        });

        const result = await authApi.signup('test', 'test@example.com', 'pass');
        expect('error' in result).toBe(true);
      });
    });

    describe('login', () => {
      it('should call login endpoint', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: '1', username: 'test' }, token: 'abc' }),
        });

        const result = await authApi.login('test@example.com', 'pass');
        expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/auth/login', expect.any(Object));
        expect('user' in result).toBe(true);
      });
    });
  });

  describe('leaderboardApi', () => {
    describe('getLeaderboard', () => {
      it('should fetch leaderboard', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ([]),
        });

        await leaderboardApi.getLeaderboard();
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/leaderboard/'));
      });
    });
  });

  describe('gamesApi', () => {
    describe('getActivePlayers', () => {
      it('should fetch active players', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ([]),
        });

        await gamesApi.getActivePlayers();
        expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/games/active');
      });
    });
  });
});
