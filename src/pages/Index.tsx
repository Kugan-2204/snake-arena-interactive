import React, { useState } from 'react';
import { SnakeGame } from '@/components/SnakeGame';
import { GameMode } from '@/game/snakeLogic';
import { useAuth } from '@/contexts/AuthContext';
import { leaderboardApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Zap, Shield } from 'lucide-react';

const Index = () => {
  const [mode, setMode] = useState<GameMode>('walls');
  const { user } = useAuth();

  const handleGameOver = async (score: number) => {
    if (user && score > 0) {
      try {
        await leaderboardApi.submitScore(user.id, user.username, score, mode);
        toast.success(`Score of ${score} submitted!`);
      } catch (error) {
        toast.error('Failed to submit score');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 py-8">
      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-pixel text-primary text-glow animate-pulse-glow mb-2">
        SNAKE
      </h1>
      <p className="text-muted-foreground mb-8 text-center">
        Classic arcade game with a neon twist
      </p>

      {/* Mode Selector */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={mode === 'walls' ? 'default' : 'outline'}
          onClick={() => setMode('walls')}
          className="font-game"
        >
          <Shield className="h-4 w-4 mr-2" />
          Walls
        </Button>
        <Button
          variant={mode === 'pass-through' ? 'default' : 'outline'}
          onClick={() => setMode('pass-through')}
          className="font-game"
        >
          <Zap className="h-4 w-4 mr-2" />
          Pass-Through
        </Button>
      </div>

      {/* Game */}
      <SnakeGame mode={mode} onGameOver={handleGameOver} />

      {/* Login prompt for guests */}
      {!user && (
        <p className="mt-6 text-sm text-muted-foreground text-center">
          <a href="/auth" className="text-accent hover:underline">Login</a> to save your scores to the leaderboard!
        </p>
      )}
    </div>
  );
};

export default Index;
