import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Scissors,
  BookmarkPlus,
  Maximize2,
  FastForward,
  Rewind,
  ListRestart,
} from 'lucide-react';
import { MediaFile, TrimRange } from '../types';
import { formatTime, parseTimeToSeconds } from '../utils/time';
import { generateWaveformData } from '../utils/waveform';

interface VideoTrimmerProps {
  media: MediaFile;
  trimRange: TrimRange;
  onTrimChange: (range: TrimRange) => void;
}

export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({
  media,
  trimRange,
  onTrimChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoopClip, setIsLoopClip] = useState(false);
  const [startInput, setStartInput] = useState(formatTime(trimRange.start, true));
  const [endInput, setEndInput] = useState(formatTime(trimRange.end, true));
  const [activeDraggingHandle, setActiveDraggingHandle] = useState<'start' | 'end' | 'playhead' | null>(null);

  // Sync text inputs when trimRange changes externally
  useEffect(() => {
    setStartInput(formatTime(trimRange.start, true));
    setEndInput(formatTime(trimRange.end, true));
  }, [trimRange]);

  // Load Waveform on media change
  useEffect(() => {
    let isMounted = true;
    generateWaveformData(media.file, 120).then((peaks) => {
      if (isMounted) setWaveformData(peaks);
    });
    return () => {
      isMounted = false;
    };
  }, [media]);

  // Video Time update listener & auto trim loop/stop check
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // If playback exceeds end time
    if (time >= trimRange.end) {
      if (isLoopClip) {
        videoRef.current.currentTime = trimRange.start;
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        videoRef.current.currentTime = trimRange.end;
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      // If outside trim range, seek to start point
      if (currentTime < trimRange.start || currentTime >= trimRange.end) {
        videoRef.current.currentTime = trimRange.start;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const playTrimmedClip = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = trimRange.start;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Adjust Start or End time precisely
  const adjustTime = (type: 'start' | 'end', deltaSeconds: number) => {
    if (type === 'start') {
      const newStart = Math.max(0, Math.min(trimRange.end - 0.1, trimRange.start + deltaSeconds));
      onTrimChange({ ...trimRange, start: Number(newStart.toFixed(3)) });
      if (videoRef.current) videoRef.current.currentTime = newStart;
    } else {
      const newEnd = Math.min(media.duration, Math.max(trimRange.start + 0.1, trimRange.end + deltaSeconds));
      onTrimChange({ ...trimRange, end: Number(newEnd.toFixed(3)) });
      if (videoRef.current) videoRef.current.currentTime = newEnd;
    }
  };

  const setStartToCurrent = () => {
    const newStart = Math.min(trimRange.end - 0.1, currentTime);
    onTrimChange({ ...trimRange, start: Number(newStart.toFixed(3)) });
  };

  const setEndToCurrent = () => {
    const newEnd = Math.max(trimRange.start + 0.1, currentTime);
    onTrimChange({ ...trimRange, end: Number(newEnd.toFixed(3)) });
  };

  // Text input submission
  const handleStartInputCommit = () => {
    const parsed = parseTimeToSeconds(startInput);
    const validStart = Math.max(0, Math.min(trimRange.end - 0.1, parsed));
    onTrimChange({ ...trimRange, start: validStart });
    setStartInput(formatTime(validStart, true));
  };

  const handleEndInputCommit = () => {
    const parsed = parseTimeToSeconds(endInput);
    const validEnd = Math.min(media.duration, Math.max(trimRange.start + 0.1, parsed));
    onTrimChange({ ...trimRange, end: validEnd });
    setEndInput(formatTime(validEnd, true));
  };

  // Dragging logic on the range timeline slider
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderTrackRef.current) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const clickRatio = clickX / rect.width;
    const targetSeconds = clickRatio * media.duration;

    // Determine nearest handle or playhead
    const distStart = Math.abs(targetSeconds - trimRange.start);
    const distEnd = Math.abs(targetSeconds - trimRange.end);
    const distPlayhead = Math.abs(targetSeconds - currentTime);

    let handle: 'start' | 'end' | 'playhead' = 'playhead';
    if (distStart < distEnd && distStart < distPlayhead) handle = 'start';
    else if (distEnd < distStart && distEnd < distPlayhead) handle = 'end';

    setActiveDraggingHandle(handle);

    if (handle === 'playhead') {
      if (videoRef.current) videoRef.current.currentTime = targetSeconds;
    } else if (handle === 'start') {
      const newStart = Math.max(0, Math.min(trimRange.end - 0.1, targetSeconds));
      onTrimChange({ ...trimRange, start: newStart });
      if (videoRef.current) videoRef.current.currentTime = newStart;
    } else {
      const newEnd = Math.min(media.duration, Math.max(trimRange.start + 0.1, targetSeconds));
      onTrimChange({ ...trimRange, end: newEnd });
      if (videoRef.current) videoRef.current.currentTime = newEnd;
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!activeDraggingHandle || !sliderTrackRef.current) return;
      const rect = sliderTrackRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const targetSeconds = (clickX / rect.width) * media.duration;

      if (activeDraggingHandle === 'start') {
        const newStart = Math.max(0, Math.min(trimRange.end - 0.1, targetSeconds));
        onTrimChange({ ...trimRange, start: newStart });
        if (videoRef.current) videoRef.current.currentTime = newStart;
      } else if (activeDraggingHandle === 'end') {
        const newEnd = Math.min(media.duration, Math.max(trimRange.start + 0.1, targetSeconds));
        onTrimChange({ ...trimRange, end: newEnd });
        if (videoRef.current) videoRef.current.currentTime = newEnd;
      } else if (activeDraggingHandle === 'playhead') {
        if (videoRef.current) videoRef.current.currentTime = targetSeconds;
      }
    };

    const handleMouseUp = () => {
      setActiveDraggingHandle(null);
    };

    if (activeDraggingHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDraggingHandle, media.duration, trimRange, onTrimChange]);

  const selectedDuration = Math.max(0, trimRange.end - trimRange.start);
  const startPercent = (trimRange.start / media.duration) * 100;
  const endPercent = (trimRange.end / media.duration) * 100;
  const playheadPercent = (currentTime / media.duration) * 100;

  return (
    <div className="space-y-6">
      {/* Video Player Box */}
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-neutral-900 shadow-2xl">
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={media.url}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            className="h-full w-full object-contain"
          />

          {/* Overlay Play button on video click */}
          <button
            onClick={togglePlay}
            className="group absolute inset-0 flex items-center justify-center bg-black/10 transition-all hover:bg-black/20"
          >
            {!isPlaying && (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/90 text-white shadow-[0_0_24px_rgba(37,99,235,0.5)] backdrop-blur-md transition-transform group-hover:scale-110">
                <Play className="h-7 w-7 translate-x-0.5 fill-current" />
              </div>
            )}
          </button>
        </div>

        {/* Video Control Bar */}
        <div className="flex flex-wrap items-center justify-between border-t border-white/10 bg-neutral-900 px-4 py-3 gap-3">
          {/* Left Play/Pause Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow"
              title="Play/Pause (Space)"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5 fill-current" />}
            </button>

            <button
              onClick={playTrimmedClip}
              className="flex items-center space-x-1.5 rounded border border-white/10 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:border-blue-500/50 hover:bg-neutral-700 hover:text-white transition-all"
              title="Play only the selected range"
            >
              <Scissors className="h-3.5 w-3.5 text-blue-400" />
              <span>Play Selection</span>
            </button>

            <button
              onClick={() => setIsLoopClip(!isLoopClip)}
              className={`rounded border px-2.5 py-1.5 text-xs font-medium transition-all ${
                isLoopClip
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-white/5 bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
              title="Toggle loop selection"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={toggleMute}
              className="rounded border border-white/5 bg-neutral-800 p-1.5 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          {/* Current Time Display */}
          <div className="flex items-center space-x-2 font-mono text-xs text-neutral-300">
            <span className="text-blue-400 font-semibold">{formatTime(currentTime)}</span>
            <span className="text-neutral-600">/</span>
            <span>{formatTime(media.duration)}</span>
          </div>

          {/* Speed presets */}
          <div className="flex items-center space-x-1">
            <span className="text-[10px] font-mono text-neutral-500 uppercase mr-1">Speed:</span>
            {[0.5, 1, 1.5, 2].map((rate) => (
              <button
                key={rate}
                onClick={() => handleSpeedChange(rate)}
                className={`rounded px-2 py-0.5 text-[11px] font-mono transition-colors ${
                  playbackRate === rate
                    ? 'bg-blue-600 font-bold text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Dual-Handle Visual Range Timeline Slider */}
      <div className="rounded-lg border border-white/10 bg-neutral-900 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scissors className="h-4 w-4 text-blue-400" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400">Trim Range Timeline</h3>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-neutral-400 font-mono text-[11px]">Selected:</span>
            <span className="rounded bg-blue-600/10 px-2.5 py-1 font-mono font-bold text-blue-400 border border-blue-500/30">
              {formatTime(selectedDuration)}
            </span>
          </div>
        </div>

        {/* Visual Timeline Track */}
        <div
          ref={sliderTrackRef}
          onMouseDown={handleTimelineMouseDown}
          className="relative h-20 w-full cursor-pointer rounded bg-neutral-950 border border-white/10 overflow-hidden select-none"
        >
          {/* Audio Waveform Background Bars */}
          <div className="absolute inset-0 flex items-center justify-between px-1 opacity-40">
            {waveformData.map((peak, idx) => (
              <div
                key={idx}
                className="w-1 rounded-full bg-neutral-600 transition-all"
                style={{ height: `${peak * 100}%` }}
              />
            ))}
          </div>

          {/* Dimmed Out Unselected Start Region */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-neutral-950/80 border-r border-blue-500/50 backdrop-blur-[2px]"
            style={{ width: `${startPercent}%` }}
          />

          {/* Selected Active Trim Interval Highlight */}
          <div
            className="absolute top-0 bottom-0 bg-blue-500/10 border-y-2 border-blue-500"
            style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
          />

          {/* Dimmed Out Unselected End Region */}
          <div
            className="absolute top-0 bottom-0 right-0 bg-neutral-950/80 border-l border-blue-500/50 backdrop-blur-[2px]"
            style={{ width: `${100 - endPercent}%` }}
          />

          {/* Playhead Vertical Line */}
          <div
            className="absolute top-0 bottom-0 z-20 w-0.5 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] pointer-events-none"
            style={{ left: `${playheadPercent}%` }}
          >
            <div className="h-2 w-2 -translate-x-[3px] rounded-full bg-amber-400 shadow" />
          </div>

          {/* Left Handle (Start Time) */}
          <div
            className="absolute top-0 bottom-0 z-30 flex w-4 -translate-x-1/2 cursor-col-resize items-center justify-center group"
            style={{ left: `${startPercent}%` }}
          >
            <div className="flex h-full w-3.5 items-center justify-center rounded-l bg-blue-600 shadow-xl group-hover:bg-blue-500 transition-colors">
              <div className="h-6 w-0.5 rounded-full bg-white/80" />
            </div>
            <div className="absolute -top-7 rounded bg-blue-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white shadow opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(trimRange.start, false)}
            </div>
          </div>

          {/* Right Handle (End Time) */}
          <div
            className="absolute top-0 bottom-0 z-30 flex w-4 -translate-x-1/2 cursor-col-resize items-center justify-center group"
            style={{ left: `${endPercent}%` }}
          >
            <div className="flex h-full w-3.5 items-center justify-center rounded-r bg-blue-600 shadow-xl group-hover:bg-blue-500 transition-colors">
              <div className="h-6 w-0.5 rounded-full bg-white/80" />
            </div>
            <div className="absolute -top-7 rounded bg-blue-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white shadow opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(trimRange.end, false)}
            </div>
          </div>
        </div>

        {/* Fine Tuning Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Start Time Fine Controls */}
          <div className="rounded border border-white/5 bg-neutral-950/60 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Start Time</span>
              <button
                onClick={setStartToCurrent}
                className="text-[11px] font-mono text-blue-400 hover:text-blue-300 hover:underline"
              >
                Set frame ({formatTime(currentTime, false)})
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                onBlur={handleStartInputCommit}
                onKeyDown={(e) => e.key === 'Enter' && handleStartInputCommit()}
                className="w-full rounded border border-white/10 bg-neutral-800 px-3 py-1.5 font-mono text-xs text-white focus:border-blue-500 focus:outline-none"
                placeholder="00:00:00.00"
              />
              <div className="flex space-x-1 shrink-0">
                <button
                  onClick={() => adjustTime('start', -1)}
                  className="rounded bg-neutral-800 border border-white/5 px-2 py-1 text-[11px] font-mono text-neutral-300 hover:bg-neutral-700"
                  title="Subtract 1 second"
                >
                  -1s
                </button>
                <button
                  onClick={() => adjustTime('start', -0.1)}
                  className="rounded bg-neutral-800 border border-white/5 px-2 py-1 text-[11px] font-mono text-neutral-300 hover:bg-neutral-700"
                  title="Subtract 0.1s"
                >
                  -0.1s
                </button>
                <button
                  onClick={() => adjustTime('start', 0.1)}
                  className="rounded bg-neutral-800 border border-white/5 px-2 py-1 text-[11px] font-mono text-neutral-300 hover:bg-neutral-700"
                  title="Add 0.1s"
                >
                  +0.1s
                </button>
                <button
                  onClick={() => adjustTime('start', 1)}
                  className="rounded bg-neutral-800 border border-white/5 px-2 py-1 text-[11px] font-mono text-neutral-300 hover:bg-neutral-700"
                  title="Add 1 second"
                >
                  +1s
                </button>
              </div>
            </div>
          </div>

          {/* End Time Fine Controls */}
          <div className="rounded border border-white/5 bg-neutral-950/60 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">End Time</span>
              <button
                onClick={setEndToCurrent}
                className="text-[11px] font-mono text-blue-400 hover:text-blue-300 hover:underline"
              >
                Set frame ({formatTime(currentTime, false)})
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
                onBlur={handleEndInputCommit}
                onKeyDown={(e) => e.key === 'Enter' && handleEndInputCommit()}
                className="w-full rounded border border-white/10 bg-neutral-800 px-3 py-1.5 font-mono text-xs text-white focus:border-blue-500 focus:outline-none"
                placeholder="00:00:00.00"
              />
              <div className="flex space-x-1 shrink-0">
                <button
                  onClick={() => adjustTime('end', -1)}
                  className="rounded bg-neutral-800 border border-white/5 px-2 py-1 text-[11px] font-mono text-neutral-300 hover:bg-neutral-700"
                  title="Subtract 1 second"
                >
                  -1s
                </button>
                <button
                  onClick={() => adjustTime('end', -0.1)}
                  className="rounded bg-neutral-800 border border-white/5 px-2 py-1 text-[11px] font-mono text-neutral-300 hover:bg-neutral-700"
                  title="Subtract 0.1s"
                >
                  -0.1s
                </button>
                <button
                  onClick={() => adjustTime('end', 0.1)}
                  className="rounded bg-neutral-800 border border-white/5 px-2 py-1 text-[11px] font-mono text-neutral-300 hover:bg-neutral-700"
                  title="Add 0.1s"
                >
                  +0.1s
                </button>
                <button
                  onClick={() => adjustTime('end', 1)}
                  className="rounded bg-neutral-800 border border-white/5 px-2 py-1 text-[11px] font-mono text-neutral-300 hover:bg-neutral-700"
                  title="Add 1 second"
                >
                  +1s
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
