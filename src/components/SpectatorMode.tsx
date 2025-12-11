import React, { useEffect, useState, useRef } from 'react';
import { gamesApi, ActivePlayer } from '@/services/api';
import { GRID_SIZE } from '@/game/snakeLogic';
import { Eye, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SpectatorMode() {
  const [players, setPlayers] = useState<ActivePlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<ActivePlayer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      const data = await gamesApi.getActivePlayers();
      setPlayers(data);
      setLoading(false);
    };
    fetchPlayers();
    
    // Refresh player list periodically
    const interval = setInterval(fetchPlayers, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && players.length === 0) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Loading active players...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-pixel text-center mb-6 text-primary text-glow flex items-center justify-center gap-3">
        <Eye className="h-6 w-6" />
        SPECTATOR MODE
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Player List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span>Active Players ({players.length})</span>
          </div>

          {players.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 border border-border rounded-lg bg-card">
              No active players at the moment
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <Button
                  key={player.id}
                  variant={selectedPlayer?.id === player.id ? 'default' : 'outline'}
                  className="w-full justify-between h-auto py-3"
                  onClick={() => setSelectedPlayer(player)}
                >
                  <div className="text-left">
                    <p className="font-game">{player.username}</p>
                    <p className="text-xs text-muted-foreground capitalize">{player.mode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-pixel text-sm">{player.score}</p>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Live Game View */}
        <div>
          {selectedPlayer ? (
            <LiveGameView player={selectedPlayer} />
          ) : (
            <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-card">
              <p className="text-muted-foreground text-center px-4">
                Select a player to watch their game
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface LiveGameViewProps {
  player: ActivePlayer;
}

function LiveGameView({ player }: LiveGameViewProps) {
  const [gameState, setGameState] = useState(player);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Simulate live game updates
  useEffect(() => {
    setGameState(player);

    // Simulate snake movement
    intervalRef.current = setInterval(() => {
      setGameState((prev) => {
        const head = prev.snake[0];
        let newHead = { ...head };

        switch (prev.direction) {
          case 'up':
            newHead.y = (head.y - 1 + GRID_SIZE) % GRID_SIZE;
            break;
          case 'down':
            newHead.y = (head.y + 1) % GRID_SIZE;
            break;
          case 'left':
            newHead.x = (head.x - 1 + GRID_SIZE) % GRID_SIZE;
            break;
          case 'right':
            newHead.x = (head.x + 1) % GRID_SIZE;
            break;
        }

        // Check if food is eaten
        const ateFood = newHead.x === prev.food.x && newHead.y === prev.food.y;
        const newSnake = [newHead, ...prev.snake];
        if (!ateFood) newSnake.pop();

        // Random direction change occasionally
        const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];
        const possibleDirs = directions.filter(d => {
          if (d === 'up' && prev.direction === 'down') return false;
          if (d === 'down' && prev.direction === 'up') return false;
          if (d === 'left' && prev.direction === 'right') return false;
          if (d === 'right' && prev.direction === 'left') return false;
          return true;
        });
        const newDir = Math.random() > 0.8 
          ? possibleDirs[Math.floor(Math.random() * possibleDirs.length)]
          : prev.direction;

        return {
          ...prev,
          snake: newSnake,
          food: ateFood
            ? { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) }
            : prev.food,
          score: ateFood ? prev.score + 10 : prev.score,
          direction: newDir,
        };
      });
    }, 200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [player.id]);

  const cellSize = 100 / GRID_SIZE;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-game text-foreground">{gameState.username}</p>
          <p className="text-xs text-muted-foreground capitalize">{gameState.mode} mode</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Score</p>
          <p className="font-pixel text-primary text-glow">{gameState.score}</p>
        </div>
      </div>

      <div className="relative aspect-square border-2 border-accent/50 rounded-lg overflow-hidden box-glow-accent grid-pattern bg-card">
        {/* Snake */}
        {gameState.snake.map((segment, index) => (
          <div
            key={`${segment.x}-${segment.y}-${index}`}
            className={`absolute rounded-sm transition-all duration-100 ${
              index === 0 ? 'bg-accent box-glow-accent z-10' : 'bg-accent/70'
            }`}
            style={{
              left: `${segment.x * cellSize}%`,
              top: `${segment.y * cellSize}%`,
              width: `${cellSize}%`,
              height: `${cellSize}%`,
              transform: index === 0 ? 'scale(1.1)' : 'scale(0.85)',
            }}
          />
        ))}

        {/* Food */}
        <div
          className="absolute bg-secondary rounded-full animate-food-pulse box-glow-secondary"
          style={{
            left: `${gameState.food.x * cellSize}%`,
            top: `${gameState.food.y * cellSize}%`,
            width: `${cellSize}%`,
            height: `${cellSize}%`,
          }}
        />

        {/* Live indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 px-2 py-1 rounded text-xs">
          <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span className="text-destructive">LIVE</span>
        </div>
      </div>
    </div>
  );
}
