import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { VideoTrimmer } from './components/VideoTrimmer';
import { ExportControls } from './components/ExportControls';
import { DownloadManager } from './components/DownloadManager';
import { TerminalLogs } from './components/TerminalLogs';
import { useFFmpeg } from './hooks/useFFmpeg';
import { createSampleVideoFile } from './utils/sampleVideo';
import {
  MediaFile,
  TrimRange,
  ExportJob,
  VideoExportOptions,
  AudioExportOptions,
  GifExportOptions,
} from './types';
import { AlertTriangle, Sparkles, ShieldCheck, Zap, Info, Keyboard } from 'lucide-react';

export default function App() {
  const [currentMedia, setCurrentMedia] = useState<MediaFile | null>(null);
  const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: 10 });
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const {
    status,
    statusText,
    progress,
    logMessages,
    processVideo,
    extractAudio,
    exportGif,
    resetStatus,
    clearLogs,
  } = useFFmpeg();

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Handle selected video file
  const handleFileSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const videoElem = document.createElement('video');
    videoElem.src = url;

    videoElem.onloadedmetadata = () => {
      const duration = videoElem.duration || 10;
      const media: MediaFile = {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        duration,
        width: videoElem.videoWidth,
        height: videoElem.videoHeight,
      };

      setCurrentMedia(media);
      setTrimRange({ start: 0, end: Number(duration.toFixed(3)) });
      showToast(`Loaded ${file.name}`);
    };

    videoElem.onerror = () => {
      showToast('Error reading video file metadata. Trying fallback format...', 'error');
      // Fallback media object if metadata load fails
      const fallbackMedia: MediaFile = {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        duration: 10,
      };
      setCurrentMedia(fallbackMedia);
      setTrimRange({ start: 0, end: 10 });
    };
  }, []);

  // Handle demo sample video generation
  const handleLoadSample = async () => {
    try {
      setIsLoadingSample(true);
      showToast('Generating interactive 10s demo video canvas...');
      const sampleFile = await createSampleVideoFile();
      handleFileSelect(sampleFile);
    } catch (err) {
      console.error('Failed to create sample video:', err);
      showToast('Could not generate sample video.', 'error');
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleClearMedia = () => {
    if (currentMedia?.url) {
      URL.revokeObjectURL(currentMedia.url);
    }
    setCurrentMedia(null);
    setTrimRange({ start: 0, end: 10 });
    resetStatus();
  };

  // Export handlers
  const handleExportVideo = async (options: VideoExportOptions) => {
    if (!currentMedia) return;
    try {
      const result = await processVideo(currentMedia.file, trimRange, options);
      const outputUrl = URL.createObjectURL(result.blob);

      const job: ExportJob = {
        id: `job_${Date.now()}`,
        type: 'video',
        inputFileName: currentMedia.name,
        outputFileName: result.fileName,
        outputUrl,
        blob: result.blob,
        size: result.blob.size,
        duration: result.duration,
        createdAt: new Date(),
        format: options.format.toUpperCase(),
        details: options.codecMode === 'copy' ? 'Stream Copy (Lossless)' : `Re-encoded (${options.resolution}, ${options.fps}fps)`,
      };

      setJobs((prev) => [job, ...prev]);
      showToast(`Trimmed video ready: ${result.fileName}`);
    } catch (err) {
      console.error(err);
      showToast(`Export failed: ${(err as Error).message}`, 'error');
    }
  };

  const handleExportAudio = async (options: AudioExportOptions) => {
    if (!currentMedia) return;
    try {
      const result = await extractAudio(currentMedia.file, trimRange, options);
      const outputUrl = URL.createObjectURL(result.blob);

      const job: ExportJob = {
        id: `job_${Date.now()}`,
        type: 'audio',
        inputFileName: currentMedia.name,
        outputFileName: result.fileName,
        outputUrl,
        blob: result.blob,
        size: result.blob.size,
        duration: result.duration,
        createdAt: new Date(),
        format: options.format.toUpperCase(),
        details: `${options.bitrate} @ ${options.sampleRate}Hz (Vol: ${options.volume}x)`,
      };

      setJobs((prev) => [job, ...prev]);
      showToast(`Audio extracted: ${result.fileName}`);
    } catch (err) {
      console.error(err);
      showToast(`Audio extraction failed: ${(err as Error).message}`, 'error');
    }
  };

  const handleExportGif = async (options: GifExportOptions) => {
    if (!currentMedia) return;
    try {
      const result = await exportGif(currentMedia.file, trimRange, options);
      const outputUrl = URL.createObjectURL(result.blob);

      const job: ExportJob = {
        id: `job_${Date.now()}`,
        type: 'gif',
        inputFileName: currentMedia.name,
        outputFileName: result.fileName,
        outputUrl,
        blob: result.blob,
        size: result.blob.size,
        duration: result.duration,
        createdAt: new Date(),
        format: 'GIF',
        details: `${options.fps} FPS @ ${options.width}px width`,
      };

      setJobs((prev) => [job, ...prev]);
      showToast(`GIF generated: ${result.fileName}`);
    } catch (err) {
      console.error(err);
      showToast(`GIF export failed: ${(err as Error).message}`, 'error');
    }
  };

  const handleRemoveJob = (id: string) => {
    setJobs((prev) => {
      const target = prev.find((j) => j.id === id);
      if (target?.outputUrl) {
        URL.revokeObjectURL(target.outputUrl);
      }
      return prev.filter((j) => j.id !== id);
    });
  };

  const handleClearAllJobs = () => {
    jobs.forEach((j) => {
      if (j.outputUrl) URL.revokeObjectURL(j.outputUrl);
    });
    setJobs([]);
  };

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-neutral-200 antialiased selection:bg-blue-600 selection:text-white pb-16 flex flex-col justify-between">
      <div>
        {/* App Header */}
        <Header
          status={status}
          statusText={statusText}
          onToggleTerminal={() => setShowTerminal(!showTerminal)}
          showTerminal={showTerminal}
          onLoadSample={handleLoadSample}
          isLoadingSample={isLoadingSample}
        />

        {/* Toast Notification */}
        {toastMsg && (
          <div
            className={`fixed bottom-14 right-6 z-50 flex items-center space-x-2 rounded border px-4 py-2.5 shadow-2xl backdrop-blur-md transition-all font-mono text-xs ${
              toastMsg.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/30'
                : 'bg-neutral-900/90 text-blue-300 border-blue-500/40'
            }`}
          >
            <Info className="h-4 w-4 shrink-0 text-blue-400" />
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* Main App Container */}
        <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
          {/* Top Dropzone / Selected Media Header */}
          <Dropzone
            onFileSelect={handleFileSelect}
            currentMedia={currentMedia}
            onClearMedia={handleClearMedia}
            onLoadSample={handleLoadSample}
            isLoadingSample={isLoadingSample}
          />

          {/* FFmpeg Logs Terminal Panel */}
          {showTerminal && (
            <TerminalLogs
              logs={logMessages}
              status={status}
              statusText={statusText}
              progressRatio={progress.ratio}
              onClearLogs={clearLogs}
              onClose={() => setShowTerminal(false)}
            />
          )}

          {/* Trimming & Export Layout Grid */}
          {currentMedia && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Video Trimmer & Player */}
              <div className="lg:col-span-7 space-y-6">
                <VideoTrimmer
                  media={currentMedia}
                  trimRange={trimRange}
                  onTrimChange={setTrimRange}
                />
              </div>

              {/* Right Column: Export Controls & Settings */}
              <div className="lg:col-span-5 space-y-6">
                <ExportControls
                  onExportVideo={handleExportVideo}
                  onExportAudio={handleExportAudio}
                  onExportGif={handleExportGif}
                  status={status}
                  progressRatio={progress.ratio}
                />

                {/* Download Manager for Processed Files */}
                <DownloadManager
                  jobs={jobs}
                  onRemoveJob={handleRemoveJob}
                  onClearAllJobs={handleClearAllJobs}
                />
              </div>
            </div>
          )}

          {/* Feature Highlights Footer Banner */}
          {!currentMedia && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="rounded-lg border border-white/5 bg-neutral-900/60 p-5 space-y-2">
                <div className="flex h-9 w-9 items-center justify-center rounded bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <Zap className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-white">Client-Side WASM Engine</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Powered by FFmpeg WebAssembly. All video trimming and audio extraction runs directly inside your browser.
                </p>
              </div>

              <div className="rounded-lg border border-white/5 bg-neutral-900/60 p-5 space-y-2">
                <div className="flex h-9 w-9 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-white">100% Private & Local</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Your video files never leave your device or upload to external cloud servers. Zero data collection.
                </p>
              </div>

              <div className="rounded-lg border border-white/5 bg-neutral-900/60 p-5 space-y-2">
                <div className="flex h-9 w-9 items-center justify-center rounded bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-white">Lossless & Custom Export</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Fast Stream Copy or full re-encoding. Extract MP3, WAV, AAC audio or generate animated GIFs.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Sleek Bottom Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 h-10 border-t border-white/10 bg-black/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between font-mono text-[11px] text-neutral-400">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-neutral-300">SYSTEM: READY</span>
          </span>
          <span className="hidden sm:inline text-neutral-600">|</span>
          <span className="hidden sm:inline text-neutral-500">FFmpeg.WASM SharedArrayBuffer Enabled</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>PORT: 3000</span>
          <span className="text-neutral-600">|</span>
          <span className="text-blue-400 font-bold">SLEEK UI</span>
        </div>
      </footer>
    </div>
  );
}
