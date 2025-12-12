// Pure game logic - easily testable
export type Direction = 'up' | 'down' | 'left' | 'right';
export type GameMode = 'pass-through' | 'walls';

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  nextDirection: Direction;
  score: number;
  gameOver: boolean;
  isPaused: boolean;
  mode: GameMode;
  gridSize: number;
}

export const GRID_SIZE = 20;
export const INITIAL_SNAKE_LENGTH = 3;

export function createInitialState(mode: GameMode): GameState {
  const center = Math.floor(GRID_SIZE / 2);
  const snake: Position[] = [];
  
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    snake.push({ x: center - i, y: center });
  }

  return {
    snake,
    food: generateFood(snake),
    direction: 'right',
    nextDirection: 'right',
    score: 0,
    gameOver: false,
    isPaused: false,
    mode,
    gridSize: GRID_SIZE,
  };
}

export function generateFood(snake: Position[]): Position {
  let food: Position;
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (isPositionOccupied(food, snake));
  return food;
}

export function isPositionOccupied(pos: Position, snake: Position[]): boolean {
  return snake.some(segment => segment.x === pos.x && segment.y === pos.y);
}

export function getNextHeadPosition(head: Position, direction: Direction, gridSize: number, mode: GameMode): Position {
  let newHead: Position;
  
  switch (direction) {
    case 'up':
      newHead = { x: head.x, y: head.y - 1 };
      break;
    case 'down':
      newHead = { x: head.x, y: head.y + 1 };
      break;
    case 'left':
      newHead = { x: head.x - 1, y: head.y };
      break;
    case 'right':
      newHead = { x: head.x + 1, y: head.y };
      break;
  }

  if (mode === 'pass-through') {
    // Wrap around
    newHead.x = (newHead.x + gridSize) % gridSize;
    newHead.y = (newHead.y + gridSize) % gridSize;
  }

  return newHead;
}

export function checkWallCollision(pos: Position, gridSize: number): boolean {
  return pos.x < 0 || pos.x >= gridSize || pos.y < 0 || pos.y >= gridSize;
}

export function checkSelfCollision(head: Position, body: Position[]): boolean {
  // Check collision with body (excluding head)
  return body.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
}

export function isOppositeDirection(dir1: Direction, dir2: Direction): boolean {
  return (
    (dir1 === 'up' && dir2 === 'down') ||
    (dir1 === 'down' && dir2 === 'up') ||
    (dir1 === 'left' && dir2 === 'right') ||
    (dir1 === 'right' && dir2 === 'left')
  );
}

export function changeDirection(state: GameState, newDirection: Direction): GameState {
  if (isOppositeDirection(state.direction, newDirection)) {
    return state;
  }
  return { ...state, nextDirection: newDirection };
}

export function tick(state: GameState): GameState {
  if (state.gameOver || state.isPaused) {
    return state;
  }

  const newDirection = state.nextDirection;
  const head = state.snake[0];
  const newHead = getNextHeadPosition(head, newDirection, state.gridSize, state.mode);

  // Check wall collision in walls mode
  if (state.mode === 'walls' && checkWallCollision(newHead, state.gridSize)) {
    return { ...state, gameOver: true };
  }

  // Check self collision
  if (checkSelfCollision(newHead, state.snake)) {
    return { ...state, gameOver: true };
  }

  // Check if food is eaten
  const ateFood = newHead.x === state.food.x && newHead.y === state.food.y;
  
  const newSnake = [newHead, ...state.snake];
  if (!ateFood) {
    newSnake.pop();
  }

  return {
    ...state,
    snake: newSnake,
    food: ateFood ? generateFood(newSnake) : state.food,
    direction: newDirection,
    score: ateFood ? state.score + 10 : state.score,
  };
}

export function togglePause(state: GameState): GameState {
  if (state.gameOver) return state;
  return { ...state, isPaused: !state.isPaused };
}

export function restartGame(mode: GameMode): GameState {
  return createInitialState(mode);
}
