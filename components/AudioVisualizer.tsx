'use client';

import React from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isRecording }) => {
  if (!isRecording) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 h-12 px-4 py-2 bg-rose-950/40 border border-rose-500/30 rounded-xl my-3">
      <div className="w-1.5 bg-rose-500 rounded-full wave-bar-1" />
      <div className="w-1.5 bg-rose-400 rounded-full wave-bar-2" />
      <div className="w-1.5 bg-red-400 rounded-full wave-bar-3" />
      <div className="w-1.5 bg-amber-400 rounded-full wave-bar-4" />
      <div className="w-1.5 bg-rose-500 rounded-full wave-bar-5" />
      <div className="w-1.5 bg-rose-400 rounded-full wave-bar-6" />
      <div className="w-1.5 bg-red-400 rounded-full wave-bar-7" />
      <div className="w-1.5 bg-rose-500 rounded-full wave-bar-8" />
      <span className="text-xs font-bold text-rose-300 ml-3 animate-pulse tracking-wide">
        本部長の回答を録音中（話しかけてください）...
      </span>
    </div>
  );
};
