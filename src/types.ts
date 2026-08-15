export type ExportType = 'video' | 'audio' | 'gif';

export type AudioFormat = 'mp3' | 'wav' | 'aac' | 'm4a';
export type VideoFormat = 'mp4' | 'webm' | 'mkv' | 'mov';
export type VideoCodecMode = 'copy' | 'encode';

export interface MediaFile {
  file: File;
  name: string;
  size: number;
  type: string;
  url: string;
  duration: number;
  width?: number;
  height?: number;
  fps?: number;
  hasAudio?: boolean;
}

export interface TrimRange {
  start: number; // in seconds
  end: number;   // in seconds
}

export interface AudioExportOptions {
  format: AudioFormat;
  bitrate: '128k' | '192k' | '256k' | '320k';
  sampleRate: '44100' | '48000';
  volume: number; // multiplier e.g. 1.0, 1.5, 2.0
  fadeIn: number;  // seconds
  fadeOut: number; // seconds
}

export interface VideoExportOptions {
  format: VideoFormat;
  codecMode: VideoCodecMode;
  resolution: 'original' | '1080p' | '720p' | '480p';
  fps: 'original' | '60' | '30' | '24';
  speed: number; // 0.5, 1, 1.25, 1.5, 2
  muteAudio: boolean;
}

export interface GifExportOptions {
  fps: number; // e.g. 10, 15, 20
  width: number; // e.g. 320, 480, 640
}

export interface ExportJob {
  id: string;
  type: ExportType;
  inputFileName: string;
  outputFileName: string;
  outputUrl: string;
  blob: Blob;
  size: number;
  duration: number;
  createdAt: Date;
  format: string;
  details: string;
}

export type ProcessingStatus = 'idle' | 'loading-wasm' | 'reading' | 'processing' | 'done' | 'error';

export interface FFmpegProgress {
  ratio: number; // 0 to 1
  time: number; // processed seconds
  fps?: number;
}
