import React, { useEffect, useCallback, useReducer, useRef } from 'react';
import { GameState, GameMode, createInitialState, tick, changeDirection, togglePause, restartGame, Direction, GRID_SIZE } from '@/game/snakeLogic';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface SnakeGameProps {
  mode: GameMode;
  onGameOver?: (score: number) => void;
  onScoreChange?: (score: number) => void;
}

type GameAction = 
  | { type: 'TICK' }
  | { type: 'CHANGE_DIRECTION'; direction: Direction }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'RESTART' };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TICK':
      return tick(state);
    case 'CHANGE_DIRECTION':
      return changeDirection(state, action.direction);
    case 'TOGGLE_PAUSE':
      return togglePause(state);
    case 'RESTART':
      return restartGame(state.mode);
    default:
      return state;
  }
}

export function SnakeGame({ mode, onGameOver, onScoreChange }: SnakeGameProps) {
  const [state, dispatch] = useReducer(gameReducer, mode, createInitialState);
  const gameOverTriggered = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset game when mode changes
  useEffect(() => {
    dispatch({ type: 'RESTART' });
    gameOverTriggered.current = false;
  }, [mode]);

  // Game loop
  useEffect(() => {
    if (state.gameOver || state.isPaused) return;

    const speed = Math.max(50, 150 - Math.floor(state.score / 50) * 10);
    const interval = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, speed);

    return () => clearInterval(interval);
  }, [state.gameOver, state.isPaused, state.score]);

  // Handle game over
  useEffect(() => {
    if (state.gameOver && !gameOverTriggered.current) {
      gameOverTriggered.current = true;
      onGameOver?.(state.score);
    }
  }, [state.gameOver, state.score, onGameOver]);

  // Handle score change
  useEffect(() => {
    onScoreChange?.(state.score);
  }, [state.score, onScoreChange]);

  // Keyboard controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const keyMap: Record<string, Direction> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      w: 'up',
      s: 'down',
      a: 'left',
      d: 'right',
    };

    if (keyMap[e.key]) {
      e.preventDefault();
      dispatch({ type: 'CHANGE_DIRECTION', direction: keyMap[e.key] });
    } else if (e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      dispatch({ type: 'TOGGLE_PAUSE' });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus container for keyboard events
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const cellSize = 100 / GRID_SIZE;

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4" tabIndex={0}>
      {/* Score and Controls */}
      <div className="flex items-center justify-between w-full max-w-md px-4">
        <div className="text-xl font-pixel">
          <span className="text-muted-foreground">Score: </span>
          <span className="text-primary text-glow">{state.score}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            disabled={state.gameOver}
            className="border-primary/50 hover:bg-primary/10"
          >
            {state.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              dispatch({ type: 'RESTART' });
              gameOverTriggered.current = false;
            }}
            className="border-accent/50 hover:bg-accent/10"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative w-full max-w-md aspect-square border-2 border-primary/50 rounded-lg overflow-hidden box-glow grid-pattern bg-card">
        {/* Snake */}
        {state.snake.map((segment, index) => (
          <div
            key={`${segment.x}-${segment.y}-${index}`}
            className={`absolute rounded-sm transition-all duration-75 ${
              index === 0 
                ? 'bg-primary box-glow z-10' 
                : 'bg-primary/80'
            }`}
            style={{
              left: `${segment.x * cellSize}%`,
              top: `${segment.y * cellSize}%`,
              width: `${cellSize}%`,
              height: `${cellSize}%`,
              transform: index === 0 ? 'scale(1.1)' : 'scale(0.9)',
            }}
          />
        ))}

        {/* Food */}
        <div
          className="absolute bg-secondary rounded-full animate-food-pulse box-glow-secondary"
          style={{
            left: `${state.food.x * cellSize}%`,
            top: `${state.food.y * cellSize}%`,
            width: `${cellSize}%`,
            height: `${cellSize}%`,
          }}
        />

        {/* Game Over Overlay */}
        {state.gameOver && (
          <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-4 z-20">
            <h2 className="text-3xl font-pixel text-destructive text-glow-secondary animate-pulse-glow">
              GAME OVER
            </h2>
            <p className="text-xl text-muted-foreground">
              Final Score: <span className="text-primary">{state.score}</span>
            </p>
            <Button
              onClick={() => {
                dispatch({ type: 'RESTART' });
                gameOverTriggered.current = false;
              }}
              className="font-pixel"
            >
              Play Again
            </Button>
          </div>
        )}

        {/* Pause Overlay */}
        {state.isPaused && !state.gameOver && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
            <h2 className="text-2xl font-pixel text-accent text-glow-accent animate-float">
              PAUSED
            </h2>
          </div>
        )}
      </div>

      {/* Mode indicator */}
      <div className="text-sm text-muted-foreground">
        Mode: <span className={mode === 'walls' ? 'text-destructive' : 'text-accent'}>{mode === 'walls' ? 'Walls' : 'Pass-Through'}</span>
      </div>

      {/* Controls hint */}
      <div className="text-xs text-muted-foreground text-center">
        <p>Arrow keys or WASD to move</p>
        <p>Space to pause</p>
      </div>
    </div>
  );
}
