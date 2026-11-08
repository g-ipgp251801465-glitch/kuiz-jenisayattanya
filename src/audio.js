import startUrl from './sounds/start.wav?inline';
import correctUrl from './sounds/correct.wav?inline';
import wrongUrl from './sounds/wrong.wav?inline';
import nextUrl from './sounds/next.wav?inline';
import victoryUrl from './sounds/victory.wav?inline';
import revisionUrl from './sounds/revision.wav?inline';

const clips = {start:startUrl, correct:correctUrl, wrong:wrongUrl, next:nextUrl, victory:victoryUrl, revision:revisionUrl};
let enabled = true;
let voices = [];
let activeEffect;
let effectFinished = Promise.resolve();
let speechGeneration = 0;
let speakingHandler = () => {};
let statusHandler = () => {};
let context;
const synth = window.speechSynthesis;
function loadVoices() { voices = synth?.getVoices() || []; }
loadVoices();
synth?.addEventListener('voiceschanged', loadVoices);
export function onSpeaking(handler) { speakingHandler = handler; }
export function onAudioStatus(handler) { statusHandler = handler; }
export function stopSpeech() { speechGeneration++; synth?.cancel(); speakingHandler(false); }
function stopEffect() { activeEffect?.stop(); activeEffect = undefined; }
export function setSound(value) {
  enabled = value;
  if (!value) { stopSpeech(); stopEffect(); }
}
export function playSound(type) {
  if (!enabled) return Promise.resolve();
  stopEffect();
  const url = clips[type] || clips.next;
  const audio = new Audio(url);
  audio.preload = 'auto';
  audio.volume = .8;
  let complete;
  let timer;
  let source;
  effectFinished = new Promise(resolve => { complete = resolve; });
  const handle = { stop() { audio.pause(); audio.removeAttribute('src'); try { source?.stop(); } catch {} finish(); } };
  activeEffect = handle;
  function finish() {
    clearTimeout(timer);
    if (activeEffect === handle) activeEffect = undefined;
    complete();
  }
  audio.addEventListener('playing', () => statusHandler('playing'), {once:true});
  audio.addEventListener('ended', finish, {once:true});
  // Begin native media playback inside the actual answer-button gesture.
  // Speech waits for this clip, so mobile TTS cannot mask or duck the chime.
  const playback = audio.play();
  playback.catch(async () => {
    if (activeEffect !== handle || !enabled) return;
    try {
      context ||= new (window.AudioContext || window.webkitAudioContext)();
      await context.resume();
      const bytes = Uint8Array.from(atob(url.split(',')[1]), ch => ch.charCodeAt(0));
      const buffer = await context.decodeAudioData(bytes.buffer);
      if (activeEffect !== handle || !enabled) return;
      source = context.createBufferSource();
      source.buffer = buffer;
      const gain = context.createGain(); gain.gain.value = .8;
      source.connect(gain).connect(context.destination);
      source.onended = () => { source.disconnect(); gain.disconnect(); finish(); };
      source.start(); statusHandler('playing');
    } catch { statusHandler('blocked'); finish(); }
  });
  // Recover if a browser never reports an ended/error event.
  timer = setTimeout(finish, 4500);
  return effectFinished;
}
export function speak(text) {
  stopSpeech();
  if (!enabled || !synth || !window.SpeechSynthesisUtterance) return;
  const generation = speechGeneration;
  effectFinished.then(() => {
    if (!enabled || generation !== speechGeneration) return;
    loadVoices();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ms-MY'; utterance.rate = .88; utterance.pitch = 1.15; utterance.volume = .8;
    const malay = voices.filter(v => /^ms([_-]|$)/i.test(v.lang));
    utterance.voice = malay.find(v => /female|yasmin|yasmine|gadis|wanita/i.test(v.name)) || malay[0] || null;
    utterance.onstart = () => { if (generation === speechGeneration) speakingHandler(true); };
    utterance.onend = utterance.onerror = () => { if (generation === speechGeneration) speakingHandler(false); };
    synth.speak(utterance);
  });
}
