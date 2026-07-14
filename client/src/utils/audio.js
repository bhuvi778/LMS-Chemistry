export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const audioCtx = new AudioContext();
    
    // Play a dual-tone chime
    // First tone (G5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5
    gain1.gain.setValueAtTime(0, audioCtx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.4);

    // Second tone (C6) slightly delayed
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.08); // C6
    gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.08);
    gain2.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(audioCtx.currentTime + 0.08);
    osc2.stop(audioCtx.currentTime + 0.5);
  } catch (err) {
    console.warn('Notification sound play blocked or failed:', err);
  }
};

const playToneSequence = (tones = []) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const audioCtx = new AudioContext();
    tones.forEach(({ frequency, start = 0, duration = 0.18, type = 'sine', volume = 0.08 }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime + start);
      gain.gain.setValueAtTime(0, audioCtx.currentTime + start);
      gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + start);
      osc.stop(audioCtx.currentTime + start + duration + 0.02);
    });
  } catch (err) {
    console.warn('Answer sound play blocked or failed:', err);
  }
};

export const playAnswerSound = (isCorrect) => {
  if (isCorrect) {
    playToneSequence([
      { frequency: 659.25, duration: 0.16, volume: 0.07 },
      { frequency: 880, start: 0.12, duration: 0.22, volume: 0.08 },
    ]);
    return;
  }

  playToneSequence([
    { frequency: 220, duration: 0.22, type: 'triangle', volume: 0.07 },
    { frequency: 164.81, start: 0.18, duration: 0.28, type: 'triangle', volume: 0.075 },
  ]);
};
