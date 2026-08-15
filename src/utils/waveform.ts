/**
 * Extracts normalized peak amplitude samples from a video/audio File or URL using Web Audio API
 */
export async function generateWaveformData(
  mediaSource: File | string,
  samplesCount = 100
): Promise<number[]> {
  try {
    let arrayBuffer: ArrayBuffer;

    if (typeof mediaSource === 'string') {
      const res = await fetch(mediaSource);
      arrayBuffer = await res.arrayBuffer();
    } else {
      arrayBuffer = await mediaSource.arrayBuffer();
    }

    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0); // get left or mono channel
    const blockSize = Math.floor(channelData.length / samplesCount);
    const waveform: number[] = [];

    for (let i = 0; i < samplesCount; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize; j += 4) { // step by 4 for speed
        const val = Math.abs(channelData[start + j] || 0);
        if (val > max) max = val;
      }
      waveform.push(max);
    }

    await audioCtx.close();

    // Normalize values between 0.15 and 1.0
    const maxVal = Math.max(...waveform) || 1;
    return waveform.map((val) => Math.max(0.12, Number((val / maxVal).toFixed(2))));
  } catch (err) {
    console.warn('Waveform generation unavailable or video has no audio channel', err);
    // Return subtle dummy bars fallback
    return Array.from({ length: samplesCount }, (_, i) => 0.2 + Math.sin(i * 0.3) * 0.15 + Math.cos(i * 0.7) * 0.1);
  }
}
