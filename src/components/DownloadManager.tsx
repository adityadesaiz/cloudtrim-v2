import React from 'react';
import {
  Download,
  Trash2,
  FileCheck,
  Film,
  Music,
  ExternalLink,
  Sparkles,
  Play,
  HardDrive,
  Clock,
} from 'lucide-react';
import { ExportJob } from '../types';
import { formatFileSize, formatTime } from '../utils/time';

interface DownloadManagerProps {
  jobs: ExportJob[];
  onRemoveJob: (id: string) => void;
  onClearAllJobs: () => void;
}

export const DownloadManager: React.FC<DownloadManagerProps> = ({
  jobs,
  onRemoveJob,
  onClearAllJobs,
}) => {
  if (jobs.length === 0) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900 p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <FileCheck className="h-4 w-4 text-green-400" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-white">Exported Downloads</h3>
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-[10px] font-mono text-green-400 border border-green-500/20">
            {jobs.length} Ready
          </span>
        </div>

        <button
          onClick={onClearAllJobs}
          className="text-xs font-mono text-neutral-400 hover:text-rose-400 transition-colors flex items-center space-x-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded border border-white/5 bg-neutral-950 p-4 transition-all hover:border-white/15"
          >
            {/* Left Info & Preview */}
            <div className="flex items-start space-x-3.5 min-w-0 flex-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-blue-600/10 text-blue-400 border border-blue-500/20 mt-1 sm:mt-0">
                {job.type === 'audio' ? (
                  <Music className="h-4 w-4 text-blue-400" />
                ) : (
                  <Film className="h-4 w-4 text-blue-400" />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="truncate font-mono text-xs font-bold text-white">
                    {job.outputFileName}
                  </span>
                  <span className="shrink-0 rounded bg-blue-600/10 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-blue-400 border border-blue-500/20">
                    {job.format}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-neutral-400">
                  <span className="flex items-center space-x-1">
                    <HardDrive className="h-3.5 w-3.5 text-neutral-500" />
                    <span className="text-neutral-200 font-medium">{formatFileSize(job.size)}</span>
                  </span>

                  <span className="flex items-center space-x-1">
                    <Clock className="h-3.5 w-3.5 text-neutral-500" />
                    <span>Duration: {formatTime(job.duration, false)}</span>
                  </span>

                  <span className="text-neutral-500 text-[11px]">{job.details}</span>
                </div>

                {/* Inline Media Player for Preview */}
                <div className="pt-2">
                  {job.type === 'audio' ? (
                    <audio controls src={job.outputUrl} className="h-8 w-full max-w-md rounded bg-neutral-900 border border-white/10" />
                  ) : job.type === 'gif' ? (
                    <img
                      src={job.outputUrl}
                      alt="Exported GIF"
                      className="h-24 w-auto rounded border border-white/10 object-cover"
                    />
                  ) : (
                    <video
                      controls
                      src={job.outputUrl}
                      className="h-28 w-auto rounded border border-white/10 object-cover"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
              <a
                href={job.outputUrl}
                download={job.outputFileName}
                className="flex items-center space-x-1.5 rounded bg-blue-600 px-4 py-2 text-xs font-mono font-bold uppercase text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>Save File</span>
              </a>

              <button
                onClick={() => onRemoveJob(job.id)}
                className="rounded border border-white/10 bg-neutral-800 p-2 text-neutral-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                title="Remove and free browser memory"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
