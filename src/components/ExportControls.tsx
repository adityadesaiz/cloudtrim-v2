import React, { useState } from 'react';
import {
  Scissors,
  Music,
  Image as ImageIcon,
  Zap,
  Settings2,
  Sliders,
  Volume2,
  Gauge,
  Film,
  Download,
  Check,
} from 'lucide-react';
import {
  ExportType,
  VideoFormat,
  AudioFormat,
  VideoExportOptions,
  AudioExportOptions,
  GifExportOptions,
  ProcessingStatus,
} from '../types';

interface ExportControlsProps {
  onExportVideo: (options: VideoExportOptions) => void;
  onExportAudio: (options: AudioExportOptions) => void;
  onExportGif: (options: GifExportOptions) => void;
  status: ProcessingStatus;
  progressRatio: number;
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  onExportVideo,
  onExportAudio,
  onExportGif,
  status,
  progressRatio,
}) => {
  const [activeTab, setActiveTab] = useState<ExportType>('video');

  // Video Options State
  const [videoOptions, setVideoOptions] = useState<VideoExportOptions>({
    format: 'mp4',
    codecMode: 'copy',
    resolution: 'original',
    fps: 'original',
    speed: 1,
    muteAudio: false,
  });

  // Audio Options State
  const [audioOptions, setAudioOptions] = useState<AudioExportOptions>({
    format: 'mp3',
    bitrate: '192k',
    sampleRate: '44100',
    volume: 1.0,
    fadeIn: 0,
    fadeOut: 0,
  });

  // GIF Options State
  const [gifOptions, setGifOptions] = useState<GifExportOptions>({
    fps: 15,
    width: 480,
  });

  const isProcessing = status === 'processing' || status === 'reading' || status === 'loading-wasm';

  const handleStartExport = () => {
    if (activeTab === 'video') {
      onExportVideo(videoOptions);
    } else if (activeTab === 'audio') {
      onExportAudio(audioOptions);
    } else {
      onExportGif(gifOptions);
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900 p-5 shadow-xl space-y-5">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center space-x-2">
          <Settings2 className="h-5 w-5 text-blue-400" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-white">Export & Conversion Settings</h3>
        </div>
      </div>

      {/* Export Mode Tabs */}
      <div className="grid grid-cols-3 gap-2 rounded bg-neutral-950 p-1 border border-white/5">
        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center justify-center space-x-2 rounded py-2 text-xs font-mono uppercase tracking-wider transition-all ${
            activeTab === 'video'
              ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Scissors className="h-3.5 w-3.5" />
          <span>Trim Video</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center justify-center space-x-2 rounded py-2 text-xs font-mono uppercase tracking-wider transition-all ${
            activeTab === 'audio'
              ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Music className="h-3.5 w-3.5" />
          <span>Extract Audio</span>
        </button>

        <button
          onClick={() => setActiveTab('gif')}
          className={`flex items-center justify-center space-x-2 rounded py-2 text-xs font-mono uppercase tracking-wider transition-all ${
            activeTab === 'gif'
              ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span>Export GIF</span>
        </button>
      </div>

      {/* Tab 1: Video Settings */}
      {activeTab === 'video' && (
        <div className="space-y-4 text-xs font-sans">
          {/* Codec Mode Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Processing Engine Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVideoOptions({ ...videoOptions, codecMode: 'copy' })}
                className={`flex flex-col items-start p-3 rounded border text-left transition-all ${
                  videoOptions.codecMode === 'copy'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                    : 'border-white/5 bg-neutral-950 text-neutral-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-semibold text-white">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>Stream Copy (Fast)</span>
                </div>
                <span className="mt-1 text-[11px] text-neutral-400">
                  Instant slice without re-encoding. Keeps original quality.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVideoOptions({ ...videoOptions, codecMode: 'encode' })}
                className={`flex flex-col items-start p-3 rounded border text-left transition-all ${
                  videoOptions.codecMode === 'encode'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                    : 'border-white/5 bg-neutral-950 text-neutral-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-semibold text-white">
                  <Sliders className="h-3.5 w-3.5 text-blue-400" />
                  <span>Re-encode (Custom)</span>
                </div>
                <span className="mt-1 text-[11px] text-neutral-400">
                  Allows resolution scaling, speed adjustments & format conversion.
                </span>
              </button>
            </div>
          </div>

          {/* Format selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-neutral-400 font-mono text-[10px] uppercase block mb-1">Output Format</label>
              <select
                value={videoOptions.format}
                onChange={(e) => setVideoOptions({ ...videoOptions, format: e.target.value as VideoFormat })}
                className="w-full rounded border border-white/10 bg-neutral-800 px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
              >
                <option value="mp4">MP4 (H.264 / AAC)</option>
                <option value="webm">WebM (VP9 / Opus)</option>
                <option value="mkv">MKV (Matroska)</option>
              </select>
            </div>

            {videoOptions.codecMode === 'encode' && (
              <>
                <div>
                  <label className="text-neutral-400 font-mono text-[10px] uppercase block mb-1">Resolution</label>
                  <select
                    value={videoOptions.resolution}
                    onChange={(e) =>
                      setVideoOptions({ ...videoOptions, resolution: e.target.value as VideoExportOptions['resolution'] })
                    }
                    className="w-full rounded border border-white/10 bg-neutral-800 px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="original">Original Size</option>
                    <option value="1080p">1080p (Full HD)</option>
                    <option value="720p">720p (HD)</option>
                    <option value="480p">480p (SD)</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 font-mono text-[10px] uppercase block mb-1">Frame Rate (FPS)</label>
                  <select
                    value={videoOptions.fps}
                    onChange={(e) =>
                      setVideoOptions({ ...videoOptions, fps: e.target.value as VideoExportOptions['fps'] })
                    }
                    className="w-full rounded border border-white/10 bg-neutral-800 px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="original">Original FPS</option>
                    <option value="60">60 FPS</option>
                    <option value="30">30 FPS</option>
                    <option value="24">24 FPS</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {videoOptions.codecMode === 'encode' && (
            <div className="flex items-center justify-between rounded border border-white/5 bg-neutral-950/60 p-3">
              <label className="text-neutral-300 font-medium flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={videoOptions.muteAudio}
                  onChange={(e) => setVideoOptions({ ...videoOptions, muteAudio: e.target.checked })}
                  className="rounded border-white/10 bg-neutral-800 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs">Mute Audio Track in Output</span>
              </label>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-neutral-400 font-mono text-[10px] uppercase">Speed:</span>
                <select
                  value={videoOptions.speed}
                  onChange={(e) => setVideoOptions({ ...videoOptions, speed: parseFloat(e.target.value) })}
                  className="rounded border border-white/10 bg-neutral-800 px-2 py-1 text-white font-mono text-xs"
                >
                  <option value="0.5">0.5x Slow</option>
                  <option value="1">1.0x Normal</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x Fast</option>
                  <option value="2">2.0x Fast</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Extract Audio Settings */}
      {activeTab === 'audio' && (
        <div className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-neutral-400 font-mono text-[10px] uppercase block mb-1">Audio Format</label>
              <select
                value={audioOptions.format}
                onChange={(e) => setAudioOptions({ ...audioOptions, format: e.target.value as AudioFormat })}
                className="w-full rounded border border-white/10 bg-neutral-800 px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
              >
                <option value="mp3">MP3 (Universal)</option>
                <option value="wav">WAV (Lossless)</option>
                <option value="aac">AAC (M4A)</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-400 font-mono text-[10px] uppercase block mb-1">Audio Bitrate</label>
              <select
                value={audioOptions.bitrate}
                onChange={(e) => setAudioOptions({ ...audioOptions, bitrate: e.target.value as AudioExportOptions['bitrate'] })}
                className="w-full rounded border border-white/10 bg-neutral-800 px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
              >
                <option value="128k">128 kbps (Standard)</option>
                <option value="192k">192 kbps (High Quality)</option>
                <option value="256k">256 kbps (Very High)</option>
                <option value="320k">320 kbps (Max Quality)</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-400 font-mono text-[10px] uppercase block mb-1">Sample Rate</label>
              <select
                value={audioOptions.sampleRate}
                onChange={(e) =>
                  setAudioOptions({ ...audioOptions, sampleRate: e.target.value as AudioExportOptions['sampleRate'] })
                }
                className="w-full rounded border border-white/10 bg-neutral-800 px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
              >
                <option value="44100">44.1 kHz (CD Quality)</option>
                <option value="48000">48.0 kHz (Studio/Video)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded border border-white/5 bg-neutral-950/60 p-3">
            <div>
              <label className="text-neutral-400 font-mono text-[10px] uppercase block mb-1">Volume Boost: {audioOptions.volume}x</label>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={audioOptions.volume}
                onChange={(e) => setAudioOptions({ ...audioOptions, volume: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-mono text-[10px] uppercase block mb-1">Fade In: {audioOptions.fadeIn}s</label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={audioOptions.fadeIn}
                onChange={(e) => setAudioOptions({ ...audioOptions, fadeIn: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-mono text-[10px] uppercase block mb-1">Fade Out: {audioOptions.fadeOut}s</label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={audioOptions.fadeOut}
                onChange={(e) => setAudioOptions({ ...audioOptions, fadeOut: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: GIF Settings */}
      {activeTab === 'gif' && (
        <div className="grid grid-cols-2 gap-4 text-xs font-sans">
          <div>
            <label className="text-neutral-400 font-mono text-[10px] uppercase block mb-1">Frame Rate (FPS)</label>
            <select
              value={gifOptions.fps}
              onChange={(e) => setGifOptions({ ...gifOptions, fps: parseInt(e.target.value) })}
              className="w-full rounded border border-white/10 bg-neutral-800 px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="10">10 FPS (Smaller size)</option>
              <option value="15">15 FPS (Smooth default)</option>
              <option value="20">20 FPS (High detail)</option>
            </select>
          </div>

          <div>
            <label className="text-neutral-400 font-mono text-[10px] uppercase block mb-1">Max GIF Width</label>
            <select
              value={gifOptions.width}
              onChange={(e) => setGifOptions({ ...gifOptions, width: parseInt(e.target.value) })}
              className="w-full rounded border border-white/10 bg-neutral-800 px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="320">320px (Compact)</option>
              <option value="480">480px (Standard)</option>
              <option value="640">640px (Large)</option>
            </select>
          </div>
        </div>
      )}

      {/* Primary Export CTA Button */}
      <div className="pt-2">
        <button
          onClick={handleStartExport}
          disabled={isProcessing}
          className="relative flex w-full items-center justify-center space-x-2 rounded bg-blue-600 px-6 py-3 text-xs font-mono uppercase tracking-wider font-bold text-white shadow-[0_0_16px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
        >
          {isProcessing ? (
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>
                Processing with FFmpeg ({Math.round(progressRatio * 100)}%)...
              </span>
            </div>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>
                {activeTab === 'video'
                  ? 'Export Trimmed Video'
                  : activeTab === 'audio'
                  ? 'Extract Audio File'
                  : 'Generate Animated GIF'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
