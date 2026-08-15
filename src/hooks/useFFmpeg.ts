import { useState, useRef, useCallback, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import {
  AudioExportOptions,
  VideoExportOptions,
  GifExportOptions,
  TrimRange,
  ProcessingStatus,
  FFmpegProgress,
} from '../types';
import { getOutputFilename } from '../utils/time';

export function useFFmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState<FFmpegProgress>({ ratio: 0, time: 0 });
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [statusText, setStatusText] = useState<string>('Ready');

  const appendLog = useCallback((msg: string) => {
    setLogMessages((prev) => [...prev.slice(-150), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Initialize and load FFmpeg WebAssembly core
  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current && isLoaded) return ffmpegRef.current;

    setStatus('loading-wasm');
    setStatusText('Loading FFmpeg WebAssembly Core...');
    appendLog('Initializing FFmpeg WASM engine...');

    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on('log', ({ message }) => {
        appendLog(message);
      });

      ffmpeg.on('progress', ({ progress: ratio, time }) => {
        const roundedRatio = Math.min(1, Math.max(0, ratio));
        setProgress({
          ratio: roundedRatio,
          time: time ? time / 1000000 : 0, // convert microseconds to seconds if applicable
        });
      });

      // Load using CDN URLs for high compatibility
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      appendLog('Downloading WebAssembly binaries...');

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setIsLoaded(true);
      setStatus('idle');
      setStatusText('FFmpeg Core Ready');
      appendLog('FFmpeg core loaded successfully.');
      return ffmpeg;
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      setStatus('error');
      setStatusText('Failed to load FFmpeg WASM module. Check internet connection or CORS headers.');
      appendLog(`Error loading FFmpeg: ${(error as Error).message}`);
      throw error;
    }
  }, [isLoaded, appendLog]);

  // Load on mount automatically or when needed
  useEffect(() => {
    loadFFmpeg().catch((err) => console.warn('FFmpeg auto-load deferred:', err));
  }, [loadFFmpeg]);

  /**
   * Process Video Trim or Format Convert
   */
  const processVideo = async (
    inputFile: File,
    range: TrimRange,
    options: VideoExportOptions
  ): Promise<{ blob: Blob; fileName: string; duration: number }> => {
    const ffmpeg = await loadFFmpeg();
    setStatus('reading');
    setStatusText('Reading input video file...');
    setProgress({ ratio: 0, time: 0 });

    const inputName = `input_${Date.now()}.${inputFile.name.split('.').pop() || 'mp4'}`;
    const outputExt = options.format;
    const outputName = getOutputFilename(inputFile.name, `trimmed_${Math.round(range.start)}s-${Math.round(range.end)}s`, outputExt);

    appendLog(`Writing input file (${(inputFile.size / (1024 * 1024)).toFixed(2)} MB) into MEMFS...`);
    await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

    const duration = range.end - range.start;
    const args: string[] = [];

    // Fast seeking before input
    args.push('-ss', range.start.toFixed(3));
    args.push('-to', range.end.toFixed(3));
    args.push('-i', inputName);

    if (options.codecMode === 'copy' && options.format === inputFile.name.split('.').pop()) {
      // Stream copy mode - lightning fast
      appendLog('Using Stream Copy mode (no re-encoding, lossless)...');
      args.push('-c', 'copy');
    } else {
      // Re-encode mode
      appendLog(`Re-encoding video to ${options.format.toUpperCase()}...`);
      
      // Video Codec selection based on format
      if (options.format === 'webm') {
        args.push('-c:v', 'libvpx-vp9');
      } else {
        args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '22');
      }

      // Video Filters array
      const vf: string[] = [];

      // Resolution scaling
      if (options.resolution === '1080p') vf.push('scale=-2:1080');
      else if (options.resolution === '720p') vf.push('scale=-2:720');
      else if (options.resolution === '480p') vf.push('scale=-2:480');

      // Speed adjustments
      if (options.speed !== 1) {
        const pts = (1 / options.speed).toFixed(2);
        vf.push(`setpts=${pts}*PTS`);
      }

      if (vf.length > 0) {
        args.push('-vf', vf.join(','));
      }

      // Frame rate
      if (options.fps !== 'original') {
        args.push('-r', options.fps);
      }

      // Audio handling
      if (options.muteAudio) {
        args.push('-an');
      } else {
        if (options.format === 'webm') {
          args.push('-c:a', 'libopus');
        } else {
          args.push('-c:a', 'aac', '-b:a', '192k');
        }

        if (options.speed !== 1) {
          // Adjust audio tempo to match video speed
          args.push('-filter:a', `atempo=${options.speed}`);
        }
      }
    }

    args.push('-y', outputName);

    setStatus('processing');
    setStatusText('Processing video with FFmpeg...');
    appendLog(`Executing command: ffmpeg ${args.join(' ')}`);

    await ffmpeg.exec(args);

    appendLog('Reading output file from virtual disk...');
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data as Uint8Array], { type: `video/${options.format}` });

    // Clean virtual memory
    try {
      await ffmpeg.unlink(inputName);
      await ffmpeg.unlink(outputName);
    } catch (e) {
      console.warn('Memory cleanup info:', e);
    }

    setStatus('done');
    setStatusText('Export Complete!');
    setProgress({ ratio: 1, time: duration });

    return { blob, fileName: outputName, duration };
  };

  /**
   * Process Audio Extraction
   */
  const extractAudio = async (
    inputFile: File,
    range: TrimRange,
    options: AudioExportOptions
  ): Promise<{ blob: Blob; fileName: string; duration: number }> => {
    const ffmpeg = await loadFFmpeg();
    setStatus('reading');
    setStatusText('Reading video file for audio extraction...');
    setProgress({ ratio: 0, time: 0 });

    const inputName = `input_${Date.now()}.${inputFile.name.split('.').pop() || 'mp4'}`;
    const outputExt = options.format;
    const outputName = getOutputFilename(inputFile.name, `audio_${Math.round(range.start)}s-${Math.round(range.end)}s`, outputExt);

    appendLog('Writing video file into MEMFS...');
    await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

    const duration = range.end - range.start;
    const args: string[] = [
      '-ss', range.start.toFixed(3),
      '-to', range.end.toFixed(3),
      '-i', inputName,
      '-vn', // No video
    ];

    // Audio codec and quality
    if (options.format === 'mp3') {
      args.push('-c:a', 'libmp3lame', '-b:a', options.bitrate);
    } else if (options.format === 'wav') {
      args.push('-c:a', 'pcm_s16le');
    } else if (options.format === 'aac' || options.format === 'm4a') {
      args.push('-c:a', 'aac', '-b:a', options.bitrate);
    }

    // Sample rate
    args.push('-ar', options.sampleRate);

    // Audio Filters (volume, fade in/out)
    const af: string[] = [];

    if (options.volume !== 1) {
      af.push(`volume=${options.volume}`);
    }

    if (options.fadeIn > 0) {
      af.push(`afade=t=in:st=0:d=${options.fadeIn}`);
    }

    if (options.fadeOut > 0) {
      const fadeStart = Math.max(0, duration - options.fadeOut);
      af.push(`afade=t=out:st=${fadeStart.toFixed(2)}:d=${options.fadeOut}`);
    }

    if (af.length > 0) {
      args.push('-af', af.join(','));
    }

    args.push('-y', outputName);

    setStatus('processing');
    setStatusText('Extracting and encoding audio...');
    appendLog(`Executing command: ffmpeg ${args.join(' ')}`);

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    const mimeType = options.format === 'mp3' ? 'audio/mpeg' : options.format === 'wav' ? 'audio/wav' : 'audio/aac';
    const blob = new Blob([data as Uint8Array], { type: mimeType });

    // Memory cleanup
    try {
      await ffmpeg.unlink(inputName);
      await ffmpeg.unlink(outputName);
    } catch (e) {
      console.warn('Memory cleanup info:', e);
    }

    setStatus('done');
    setStatusText('Audio Extraction Complete!');
    setProgress({ ratio: 1, time: duration });

    return { blob, fileName: outputName, duration };
  };

  /**
   * Process Animated GIF Generation
   */
  const exportGif = async (
    inputFile: File,
    range: TrimRange,
    options: GifExportOptions
  ): Promise<{ blob: Blob; fileName: string; duration: number }> => {
    const ffmpeg = await loadFFmpeg();
    setStatus('reading');
    setStatusText('Preparing GIF palette generator...');

    const inputName = `input_${Date.now()}.${inputFile.name.split('.').pop() || 'mp4'}`;
    const outputName = getOutputFilename(inputFile.name, `gif_${Math.round(range.start)}s-${Math.round(range.end)}s`, 'gif');

    await ffmpeg.writeFile(inputName, await fetchFile(inputFile));
    const duration = range.end - range.start;

    // High quality 2-pass palette GIF export
    appendLog('Generating optimized GIF color palette...');
    const paletteName = 'palette.png';
    const filter = `fps=${options.fps},scale=${options.width}:-1:flags=lanczos`;

    await ffmpeg.exec([
      '-ss', range.start.toFixed(3),
      '-to', range.end.toFixed(3),
      '-i', inputName,
      '-vf', `${filter},palettegen`,
      '-y', paletteName,
    ]);

    setStatus('processing');
    setStatusText('Encoding Animated GIF...');
    appendLog('Generating GIF with custom palette...');

    await ffmpeg.exec([
      '-ss', range.start.toFixed(3),
      '-to', range.end.toFixed(3),
      '-i', inputName,
      '-i', paletteName,
      '-filter_complex', `${filter}[x];[x][1:v]paletteuse`,
      '-y', outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data as Uint8Array], { type: 'image/gif' });

    try {
      await ffmpeg.unlink(inputName);
      await ffmpeg.unlink(paletteName);
      await ffmpeg.unlink(outputName);
    } catch (e) {
      console.warn('Memory cleanup:', e);
    }

    setStatus('done');
    setStatusText('GIF Export Complete!');
    return { blob, fileName: outputName, duration };
  };

  const resetStatus = useCallback(() => {
    setStatus('idle');
    setStatusText('Ready');
    setProgress({ ratio: 0, time: 0 });
  }, []);

  return {
    isLoaded,
    status,
    statusText,
    progress,
    logMessages,
    loadFFmpeg,
    processVideo,
    extractAudio,
    exportGif,
    resetStatus,
    clearLogs: () => setLogMessages([]),
  };
}
