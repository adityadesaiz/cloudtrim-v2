/**
 * Generates an interactive 10-second MP4/WebM video with animated graphics and audio tone
 * directly in the browser via HTML5 Canvas and MediaRecorder API.
 */
export async function createSampleVideoFile(): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d')!;

      // Web Audio synth for background tune
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(dest);
      osc.start();

      // Combine Canvas video stream + Audio stream
      const canvasStream = canvas.captureStream(30);
      const combinedTracks = [...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()];
      const combinedStream = new MediaStream(combinedTracks);

      const mimeType = MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        osc.stop();
        audioCtx.close();
        const blob = new Blob(chunks, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `sample_countdown_demo.${ext}`, { type: mimeType });
        resolve(file);
      };

      mediaRecorder.start();

      let frame = 0;
      const totalFrames = 30 * 10; // 10 seconds at 30 fps

      const draw = () => {
        if (frame >= totalFrames) {
          mediaRecorder.stop();
          return;
        }

        const elapsedSec = (frame / 30).toFixed(1);
        const progress = frame / totalFrames;

        // Dynamic background gradient
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#1e1b4b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Rotating colorful circle
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2 - 20);
        ctx.rotate((frame * Math.PI) / 60);

        ctx.strokeStyle = `hsl(${(frame * 3) % 360}, 80%, 60%)`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, 70, 0, Math.PI * 1.5);
        ctx.stroke();

        ctx.restore();

        // Pulsing audio synth tone shift
        const freq = 300 + Math.sin(frame * 0.1) * 200;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        // Overlay Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎬 FFmpeg Trimmer Demo', canvas.width / 2, 80);

        ctx.font = 'bold 54px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`00:00:0${Math.floor(Number(elapsedSec))}`, canvas.width / 2, canvas.height / 2 + 10);

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`Frame ${frame} / ${totalFrames} (${elapsedSec}s)`, canvas.width / 2, canvas.height - 50);

        // Progress bar
        ctx.fillStyle = '#334155';
        ctx.fillRect(80, canvas.height - 30, canvas.width - 160, 8);
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(80, canvas.height - 30, (canvas.width - 160) * progress, 8);

        frame++;
        requestAnimationFrame(draw);
      };

      draw();
    } catch (err) {
      reject(err);
    }
  });
}
