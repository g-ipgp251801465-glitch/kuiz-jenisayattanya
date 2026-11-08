let enabled = true;
let context;
let voices = [];
let activeEffects = [];
let speechGeneration = 0;
let speakingHandler = () => {};
const synth = window.speechSynthesis;
function loadVoices() { voices = synth?.getVoices() || []; }
loadVoices();
synth?.addEventListener('voiceschanged', loadVoices);
export function onSpeaking(handler) { speakingHandler = handler; }
export function stopSpeech() { speechGeneration++; synth?.cancel(); speakingHandler(false); }
function stopEffects() {
  for (const oscillator of activeEffects) { try { oscillator.stop(); } catch {} }
  activeEffects = [];
}
export function setSound(value) { enabled = value; if (!value) { stopSpeech(); stopEffects(); context?.suspend(); } else context?.resume(); }
export function playSound(type) {
  if (!enabled) return;
  stopEffects();
  try {
    context ||= new (window.AudioContext || window.webkitAudioContext)();
    context.resume();
    const patterns = { start: [392, 523, 659, 784], correct: [523, 659, 784, 1047], wrong: [392, 349, 330], next: [523, 698], victory: [523, 659, 784, 659, 784, 1047], revision: [392, 494, 523] };
    (patterns[type] || patterns.next).forEach((frequency, i) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      const time = context.currentTime + i * .12;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(.065, time + .015);
      gain.gain.exponentialRampToValueAtTime(.001, time + .32);
      oscillator.connect(gain); gain.connect(context.destination);
      activeEffects.push(oscillator);
      oscillator.onended = () => {
        oscillator.disconnect(); gain.disconnect();
        activeEffects = activeEffects.filter(item => item !== oscillator);
      };
      oscillator.start(time); oscillator.stop(time + .35);
    });
  } catch { /* Visible dialogue remains available without audio hardware. */ }
}
export function speak(text) {
  stopSpeech();
  if (!enabled || !synth || !window.SpeechSynthesisUtterance) return;
  const generation = speechGeneration;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ms-MY'; utterance.rate = .88; utterance.pitch = 1.15; utterance.volume = .8;
  const malay = voices.filter(v => /^ms([_-]|$)/i.test(v.lang));
  utterance.voice = malay.find(v => /female|yasmin|yasmine|gadis|wanita/i.test(v.name)) || malay[0] || null;
  utterance.onstart = () => { if (generation === speechGeneration) speakingHandler(true); };
  utterance.onend = utterance.onerror = () => { if (generation === speechGeneration) speakingHandler(false); };
  synth.speak(utterance);
}
