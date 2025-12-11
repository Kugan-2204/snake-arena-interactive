import React from 'react';
import { SpectatorMode } from '@/components/SpectatorMode';

const SpectatePage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center p-4 py-8">
      <SpectatorMode />
    </div>
  );
};

export default SpectatePage;
