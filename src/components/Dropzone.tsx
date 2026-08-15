import React, { useState, useRef } from 'react';
import {
  Upload,
  FileVideo,
  Film,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  HardDrive,
  Video,
} from 'lucide-react';
import { MediaFile } from '../types';
import { formatFileSize, formatTime } from '../utils/time';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  currentMedia: MediaFile | null;
  onClearMedia: () => void;
  onLoadSample: () => void;
  isLoadingSample: boolean;
}

const SUPPORTED_FORMATS = [
  'video/mp4',
  'video/webm',
  'video/mkv',
  'video/x-matroska',
  'video/quicktime',
  'video/avi',
  'video/x-msvideo',
];

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelect,
  currentMedia,
  onClearMedia,
  onLoadSample,
  isLoadingSample,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcess = (file: File) => {
    setErrorMsg(null);

    // Basic format check
    const isExtensionValid = /\.(mp4|webm|mkv|mov|avi|m4v)$/i.test(file.name);
    const isMimeValid = SUPPORTED_FORMATS.includes(file.type) || file.type.startsWith('video/');

    if (!isExtensionValid && !isMimeValid) {
      setErrorMsg('Unsupported format. Please upload MP4, WebM, MKV, MOV, or AVI files.');
      return;
    }

    if (file.size > 2 * 1024 * 1024 * 1024) {
      setErrorMsg('File exceeds 2GB browser limit. Larger files may run out of WebAssembly memory.');
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      {!currentMedia ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 sm:p-10 transition-all ${
            isDragOver
              ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_24px_rgba(37,99,235,0.15)] scale-[1.005]'
              : 'border-white/10 bg-neutral-900/90 hover:border-white/20 hover:bg-neutral-900'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/mkv,video/quicktime,video/avi,.mp4,.webm,.mkv,.mov,.avi"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-neutral-800 p-3 border border-white/10 group-hover:border-blue-500/50 group-hover:bg-blue-600/10 transition-colors">
            <Upload className="h-6 w-6 text-blue-400" />
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-white shadow">
              <Video className="h-3 w-3" />
            </div>
          </div>

          <h3 className="mb-1 text-sm sm:text-base font-semibold text-white">
            Drag and drop your video here
          </h3>
          <p className="mb-4 text-center text-xs text-neutral-400">
            or <span className="font-mono text-blue-400 hover:underline">browse files</span> from your computer
          </p>

          {/* Formats Tags */}
          <div className="mb-5 flex flex-wrap justify-center gap-2">
            {['MP4', 'MOV', 'MKV', 'WEBM', 'AVI'].map((fmt) => (
              <span
                key={fmt}
                className="rounded bg-neutral-800 px-2.5 py-1 text-[10px] font-mono text-neutral-300 border border-white/5 uppercase tracking-wider"
              >
                {fmt}
              </span>
            ))}
          </div>

          {/* Sample Loader */}
          <div className="flex items-center space-x-2 border-t border-white/5 pt-4" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs text-neutral-500">No video file on hand?</span>
            <button
              type="button"
              onClick={onLoadSample}
              disabled={isLoadingSample}
              className="flex items-center space-x-1.5 rounded bg-blue-600/10 px-3 py-1 text-xs font-mono uppercase tracking-wider text-blue-400 border border-blue-500/30 hover:bg-blue-600/20 transition-all disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>{isLoadingSample ? 'Generating...' : 'Load Demo Clip'}</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 flex items-center space-x-2 rounded bg-rose-500/10 px-4 py-2 text-xs text-rose-400 border border-rose-500/30 font-mono">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      ) : (
        /* Selected Media Info Banner */
        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-neutral-900 p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-blue-600/10 text-blue-400 border border-blue-500/20">
                <FileVideo className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="truncate text-sm sm:text-base font-semibold text-white">
                    {currentMedia.name}
                  </h4>
                  <span className="shrink-0 rounded bg-green-500/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-green-400 border border-green-500/20">
                    Loaded
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-neutral-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3.5 w-3.5 text-neutral-500" />
                    <span>Duration: {formatTime(currentMedia.duration)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <HardDrive className="h-3.5 w-3.5 text-neutral-500" />
                    <span>Size: {formatFileSize(currentMedia.size)}</span>
                  </span>
                  {currentMedia.width && currentMedia.height && (
                    <span className="flex items-center space-x-1">
                      <Film className="h-3.5 w-3.5 text-neutral-500" />
                      <span>
                        Res: {currentMedia.width}x{currentMedia.height}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded border border-white/10 bg-neutral-800 px-3.5 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:bg-neutral-700 hover:text-white"
              >
                Change File
              </button>
              <button
                onClick={onClearMedia}
                className="rounded border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/20"
              >
                Remove
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/mkv,video/quicktime,video/avi,.mp4,.webm,.mkv,.mov,.avi"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
