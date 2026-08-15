/**
 * Formats time in seconds to HH:MM:SS.ms or MM:SS.ms
 */
export function formatTime(seconds: number, includeMs = true): string {
  if (isNaN(seconds) || seconds < 0) return includeMs ? '00:00:00.00' : '00:00:00';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);

  const pad = (num: number, size = 2) => String(num).padStart(size, '0');

  const timeStr = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return includeMs ? `${timeStr}.${pad(ms)}` : timeStr;
}

/**
 * Parses time string (e.g., "01:02:03.45", "02:03", "12.5") to total seconds
 */
export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const cleanStr = timeStr.trim();
  
  // If numeric only
  if (!cleanStr.includes(':')) {
    const val = parseFloat(cleanStr);
    return isNaN(val) ? 0 : Math.max(0, val);
  }

  const parts = cleanStr.split(':');
  let seconds = 0;

  if (parts.length === 3) {
    // HH:MM:SS.ms
    const hrs = parseFloat(parts[0]) || 0;
    const mins = parseFloat(parts[1]) || 0;
    const secs = parseFloat(parts[2]) || 0;
    seconds = hrs * 3600 + mins * 60 + secs;
  } else if (parts.length === 2) {
    // MM:SS.ms
    const mins = parseFloat(parts[0]) || 0;
    const secs = parseFloat(parts[1]) || 0;
    seconds = mins * 60 + secs;
  }

  return isNaN(seconds) ? 0 : Math.max(0, seconds);
}

/**
 * Formats byte counts into human readable strings (KB, MB, GB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Sanitizes filename and appends clean suffix
 */
export function getOutputFilename(
  originalName: string,
  suffix: string,
  extension: string
): string {
  const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  const sanitized = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${sanitized}_${suffix}.${extension}`;
}
