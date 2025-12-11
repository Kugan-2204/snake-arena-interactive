import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  tick,
  changeDirection,
  checkWallCollision,
  checkSelfCollision,
  getNextHeadPosition,
  isOppositeDirection,
  isPositionOccupied,
  togglePause,
  restartGame,
  GRID_SIZE,
  INITIAL_SNAKE_LENGTH,
  GameState,
  Position,
} from './snakeLogic';

describe('Snake Game Logic', () => {
  describe('createInitialState', () => {
    it('should create initial state with correct snake length', () => {
      const state = createInitialState('walls');
      expect(state.snake.length).toBe(INITIAL_SNAKE_LENGTH);
    });

    it('should set correct mode', () => {
      const wallsState = createInitialState('walls');
      expect(wallsState.mode).toBe('walls');

      const passThroughState = createInitialState('pass-through');
      expect(passThroughState.mode).toBe('pass-through');
    });

    it('should start with score 0', () => {
      const state = createInitialState('walls');
      expect(state.score).toBe(0);
    });

    it('should not be game over initially', () => {
      const state = createInitialState('walls');
      expect(state.gameOver).toBe(false);
    });

    it('should start moving right', () => {
      const state = createInitialState('walls');
      expect(state.direction).toBe('right');
    });
  });

  describe('getNextHeadPosition', () => {
    const head: Position = { x: 10, y: 10 };

    it('should move up correctly', () => {
      const newHead = getNextHeadPosition(head, 'up', GRID_SIZE, 'walls');
      expect(newHead).toEqual({ x: 10, y: 9 });
    });

    it('should move down correctly', () => {
      const newHead = getNextHeadPosition(head, 'down', GRID_SIZE, 'walls');
      expect(newHead).toEqual({ x: 10, y: 11 });
    });

    it('should move left correctly', () => {
      const newHead = getNextHeadPosition(head, 'left', GRID_SIZE, 'walls');
      expect(newHead).toEqual({ x: 9, y: 10 });
    });

    it('should move right correctly', () => {
      const newHead = getNextHeadPosition(head, 'right', GRID_SIZE, 'walls');
      expect(newHead).toEqual({ x: 11, y: 10 });
    });

    it('should wrap around in pass-through mode', () => {
      const edgeHead: Position = { x: 0, y: 0 };
      const newHead = getNextHeadPosition(edgeHead, 'left', GRID_SIZE, 'pass-through');
      expect(newHead.x).toBe(GRID_SIZE - 1);
    });

    it('should not wrap around in walls mode', () => {
      const edgeHead: Position = { x: 0, y: 0 };
      const newHead = getNextHeadPosition(edgeHead, 'left', GRID_SIZE, 'walls');
      expect(newHead.x).toBe(-1);
    });
  });

  describe('checkWallCollision', () => {
    it('should detect left wall collision', () => {
      expect(checkWallCollision({ x: -1, y: 10 }, GRID_SIZE)).toBe(true);
    });

    it('should detect right wall collision', () => {
      expect(checkWallCollision({ x: GRID_SIZE, y: 10 }, GRID_SIZE)).toBe(true);
    });

    it('should detect top wall collision', () => {
      expect(checkWallCollision({ x: 10, y: -1 }, GRID_SIZE)).toBe(true);
    });

    it('should detect bottom wall collision', () => {
      expect(checkWallCollision({ x: 10, y: GRID_SIZE }, GRID_SIZE)).toBe(true);
    });

    it('should not detect collision for valid position', () => {
      expect(checkWallCollision({ x: 10, y: 10 }, GRID_SIZE)).toBe(false);
    });
  });

  describe('checkSelfCollision', () => {
    it('should detect collision with body', () => {
      const snake: Position[] = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 },
        { x: 3, y: 6 },
        { x: 4, y: 6 },
        { x: 5, y: 6 },
        { x: 5, y: 5 }, // Collision point
      ];
      expect(checkSelfCollision(snake[0], snake)).toBe(true);
    });

    it('should not detect collision for valid snake', () => {
      const snake: Position[] = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 },
      ];
      expect(checkSelfCollision(snake[0], snake)).toBe(false);
    });
  });

  describe('isOppositeDirection', () => {
    it('should identify opposite directions', () => {
      expect(isOppositeDirection('up', 'down')).toBe(true);
      expect(isOppositeDirection('down', 'up')).toBe(true);
      expect(isOppositeDirection('left', 'right')).toBe(true);
      expect(isOppositeDirection('right', 'left')).toBe(true);
    });

    it('should not identify non-opposite directions', () => {
      expect(isOppositeDirection('up', 'left')).toBe(false);
      expect(isOppositeDirection('up', 'right')).toBe(false);
      expect(isOppositeDirection('down', 'left')).toBe(false);
    });
  });

  describe('changeDirection', () => {
    it('should change direction when not opposite', () => {
      const state = createInitialState('walls');
      const newState = changeDirection(state, 'up');
      expect(newState.nextDirection).toBe('up');
    });

    it('should not change to opposite direction', () => {
      const state = createInitialState('walls');
      const newState = changeDirection(state, 'left');
      expect(newState.nextDirection).toBe('right'); // Should stay right
    });
  });

  describe('tick', () => {
    it('should move snake forward', () => {
      const state = createInitialState('walls');
      const originalHead = { ...state.snake[0] };
      const newState = tick(state);
      expect(newState.snake[0].x).toBe(originalHead.x + 1);
    });

    it('should not move when paused', () => {
      let state = createInitialState('walls');
      state = togglePause(state);
      const originalSnake = [...state.snake];
      const newState = tick(state);
      expect(newState.snake).toEqual(originalSnake);
    });

    it('should not move when game over', () => {
      let state = createInitialState('walls');
      state = { ...state, gameOver: true };
      const originalSnake = [...state.snake];
      const newState = tick(state);
      expect(newState.snake).toEqual(originalSnake);
    });

    it('should increase score when eating food', () => {
      let state = createInitialState('walls');
      // Place food directly in front of snake
      state = { ...state, food: { x: state.snake[0].x + 1, y: state.snake[0].y } };
      const newState = tick(state);
      expect(newState.score).toBe(10);
    });

    it('should grow snake when eating food', () => {
      let state = createInitialState('walls');
      const originalLength = state.snake.length;
      state = { ...state, food: { x: state.snake[0].x + 1, y: state.snake[0].y } };
      const newState = tick(state);
      expect(newState.snake.length).toBe(originalLength + 1);
    });

    it('should end game on wall collision in walls mode', () => {
      let state = createInitialState('walls');
      // Move snake to edge
      state = {
        ...state,
        snake: [{ x: GRID_SIZE - 1, y: 10 }, { x: GRID_SIZE - 2, y: 10 }, { x: GRID_SIZE - 3, y: 10 }],
        direction: 'right',
        nextDirection: 'right',
      };
      const newState = tick(state);
      expect(newState.gameOver).toBe(true);
    });

    it('should wrap around in pass-through mode', () => {
      let state = createInitialState('pass-through');
      state = {
        ...state,
        snake: [{ x: GRID_SIZE - 1, y: 10 }, { x: GRID_SIZE - 2, y: 10 }, { x: GRID_SIZE - 3, y: 10 }],
        direction: 'right',
        nextDirection: 'right',
      };
      const newState = tick(state);
      expect(newState.gameOver).toBe(false);
      expect(newState.snake[0].x).toBe(0);
    });
  });

  describe('togglePause', () => {
    it('should toggle pause state', () => {
      const state = createInitialState('walls');
      expect(state.isPaused).toBe(false);
      const pausedState = togglePause(state);
      expect(pausedState.isPaused).toBe(true);
      const unpausedState = togglePause(pausedState);
      expect(unpausedState.isPaused).toBe(false);
    });

    it('should not toggle when game over', () => {
      let state = createInitialState('walls');
      state = { ...state, gameOver: true };
      const newState = togglePause(state);
      expect(newState.isPaused).toBe(false);
    });
  });

  describe('restartGame', () => {
    it('should reset game state', () => {
      const state = restartGame('walls');
      expect(state.score).toBe(0);
      expect(state.gameOver).toBe(false);
      expect(state.snake.length).toBe(INITIAL_SNAKE_LENGTH);
    });
  });

  describe('isPositionOccupied', () => {
    it('should detect occupied position', () => {
      const snake: Position[] = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
      expect(isPositionOccupied({ x: 5, y: 5 }, snake)).toBe(true);
    });

    it('should detect unoccupied position', () => {
      const snake: Position[] = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
      expect(isPositionOccupied({ x: 10, y: 10 }, snake)).toBe(false);
    });
  });
});
