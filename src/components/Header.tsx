import React from 'react';
import { Scissors, ShieldCheck, Sparkles, Terminal } from 'lucide-react';
import { ProcessingStatus } from '../types';

interface HeaderProps {
  status: ProcessingStatus;
  statusText: string;
  onToggleTerminal: () => void;
  showTerminal: boolean;
  onLoadSample: () => void;
  isLoadingSample: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  statusText,
  onToggleTerminal,
  showTerminal,
  onLoadSample,
  isLoadingSample,
}) => {
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-white/10 bg-neutral-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo & Brand Title */}
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]">
            <Scissors className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold tracking-tight text-white">
              CloudTrim <span className="text-blue-500 font-mono text-xs">v2.4</span>
            </h1>
            <span className="hidden sm:inline-block rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400 border border-white/5 uppercase tracking-wider">
              WASM Core
            </span>
          </div>
        </div>

        {/* Status Badge & Actions */}
        <div className="flex items-center space-x-3">
          {/* Sample Video Button */}
          <button
            onClick={onLoadSample}
            disabled={isLoadingSample}
            className="flex items-center space-x-1.5 rounded border border-white/10 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:bg-neutral-700 hover:text-white disabled:opacity-50"
            title="Load an interactive 10-second generated video to test trimming"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">
              {isLoadingSample ? 'Generating Demo...' : 'Load Demo Clip'}
            </span>
            <span className="sm:hidden">Demo</span>
          </button>

          {/* Terminal Toggle */}
          <button
            onClick={onToggleTerminal}
            className={`flex items-center space-x-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-all ${
              showTerminal
                ? 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                : 'border-white/10 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden md:inline font-mono text-[11px]">FFmpeg Logs</span>
          </button>

          {/* Status Indicator */}
          <div className="hidden lg:flex items-center space-x-2 rounded border border-white/5 bg-neutral-950/60 px-3 py-1.5 text-xs">
            <div
              className={`h-2 w-2 rounded-full ${
                status === 'processing'
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse'
                  : status === 'error'
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                  : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
              }`}
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              {statusText}
            </span>
          </div>

          {/* Privacy badge */}
          <div className="flex items-center space-x-1.5 rounded bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">100% Private</span>
          </div>
        </div>
      </div>
    </header>
  );
};
