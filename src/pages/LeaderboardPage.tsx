import React from 'react';
import { Leaderboard } from '@/components/Leaderboard';

const LeaderboardPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center p-4 py-8">
      <Leaderboard />
    </div>
  );
};

export default LeaderboardPage;
