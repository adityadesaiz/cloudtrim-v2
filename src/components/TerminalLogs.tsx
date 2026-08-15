import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2, X } from 'lucide-react';
import { ProcessingStatus } from '../types';

interface TerminalLogsProps {
  logs: string[];
  status: ProcessingStatus;
  statusText: string;
  progressRatio: number;
  onClearLogs: () => void;
  onClose: () => void;
}

export const TerminalLogs: React.FC<TerminalLogsProps> = ({
  logs,
  status,
  statusText,
  progressRatio,
  onClearLogs,
  onClose,
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const percentage = Math.round(progressRatio * 100);

  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900 p-4 shadow-2xl space-y-3">
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-blue-400" />
          <h4 className="text-xs font-mono uppercase tracking-widest text-neutral-200">FFmpeg WASM Process Logs</h4>
          <span className="rounded bg-neutral-800 px-2 py-0.5 font-mono text-[10px] text-neutral-400 border border-white/5">
            {logs.length} entries
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onClearLogs}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar if active */}
      {(status === 'processing' || status === 'loading-wasm' || status === 'reading') && (
        <div className="space-y-1.5 rounded border border-blue-500/30 bg-blue-600/10 p-3 font-mono">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-blue-300">{statusText}</span>
            <span className="text-blue-400">{percentage}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded bg-neutral-950 border border-white/10">
            <div
              className="h-full bg-blue-600 transition-all duration-300 shadow-[0_0_12px_rgba(37,99,235,0.6)]"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Log Stream Output */}
      <div className="h-48 w-full overflow-y-auto rounded border border-white/5 bg-black p-3 font-mono text-[11px] text-neutral-300 space-y-1 leading-relaxed select-text">
        {logs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-neutral-600 italic">
            No FFmpeg logs recorded yet. Start an export or load WASM to see stdout logs.
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="hover:bg-neutral-900 px-1 py-0.5 rounded">
              {log}
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};
