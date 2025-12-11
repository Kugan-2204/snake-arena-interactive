import React, { useEffect, useState } from 'react';
import { leaderboardApi, LeaderboardEntry } from '@/services/api';
import { GameMode } from '@/game/snakeLogic';
import { Trophy, Medal, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<GameMode | 'all'>('all');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const data = await leaderboardApi.getLeaderboard(
        filter === 'all' ? undefined : filter,
        10
      );
      setEntries(data);
      setLoading(false);
    };
    fetchLeaderboard();
  }, [filter]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-warning" />;
      case 1:
        return <Medal className="h-5 w-5 text-muted-foreground" />;
      case 2:
        return <Award className="h-5 w-5 text-secondary" />;
      default:
        return <span className="w-5 text-center text-muted-foreground">{index + 1}</span>;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-pixel text-center mb-6 text-primary text-glow">
        LEADERBOARD
      </h2>

      <Tabs defaultValue="all" onValueChange={(v) => setFilter(v as GameMode | 'all')}>
        <TabsList className="w-full mb-4 bg-card border border-border">
          <TabsTrigger value="all" className="flex-1 font-game data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            All
          </TabsTrigger>
          <TabsTrigger value="walls" className="flex-1 font-game data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Walls
          </TabsTrigger>
          <TabsTrigger value="pass-through" className="flex-1 font-game data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Pass-Through
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <LeaderboardList entries={entries} loading={loading} getRankIcon={getRankIcon} />
        </TabsContent>
        <TabsContent value="walls" className="mt-0">
          <LeaderboardList entries={entries} loading={loading} getRankIcon={getRankIcon} />
        </TabsContent>
        <TabsContent value="pass-through" className="mt-0">
          <LeaderboardList entries={entries} loading={loading} getRankIcon={getRankIcon} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  getRankIcon: (index: number) => React.ReactNode;
}

function LeaderboardList({ entries, loading, getRankIcon }: LeaderboardListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-card animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No scores yet. Be the first!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className={`flex items-center gap-4 p-3 rounded-lg border transition-all hover:scale-[1.02] ${
            index === 0
              ? 'bg-warning/10 border-warning/50'
              : index === 1
              ? 'bg-muted/50 border-muted-foreground/30'
              : index === 2
              ? 'bg-secondary/10 border-secondary/30'
              : 'bg-card border-border'
          }`}
        >
          <div className="flex items-center justify-center w-8">
            {getRankIcon(index)}
          </div>
          <div className="flex-1">
            <p className="font-game text-foreground">{entry.username}</p>
            <p className="text-xs text-muted-foreground capitalize">{entry.mode}</p>
          </div>
          <div className="text-right">
            <p className="font-pixel text-primary text-glow">{entry.score}</p>
            <p className="text-xs text-muted-foreground">{entry.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
