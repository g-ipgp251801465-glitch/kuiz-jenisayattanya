import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import '@fontsource/outfit/latin-500.css';
import '@fontsource/outfit/latin-600.css';
import '@fontsource/outfit/latin-700.css';
import '@fontsource/outfit/latin-800.css';
import './style.css';
import { Quiz, QUESTIONS } from './game.js';
import { mimi } from './mimi.js';
const originalArt = import.meta.glob('./images/*', {eager:true, query:'?inline', import:'default'});
const originalBackground = originalArt['./images/background-original.png'] || originalArt['./images/background-original.jpg'];
const originalMimi = originalArt['./images/mimi-original.png'] || originalArt['./images/mimi-original.jpg'];
const mimiVisual = originalMimi ? `<img class="mimi original-mimi" src="${originalMimi}" alt="Mimi, rakan robot kucing kamu">` : mimi;
import { playSound, speak, stopSpeech, setSound, onSpeaking, onAudioStatus } from './audio.js';

const icons = {
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  book: '<path d="M12 5v15m0-14C8 3 4 4 3 5v14c3-2 6-1 9 1 3-2 6-3 9-1V5c-3-2-6-1-9 1Z"/>',
  sound: '<path d="m11 5-6 4H2v6h3l6 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 5-6 4H2v6h3l6 4V5Zm5 4 6 6m0-6-6 6"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  cross: '<path d="m6 6 12 12M18 6 6 18"/>',
  home: '<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3V10Z"/>',
  replay: '<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>',
  trophy: '<path d="M8 3h8v8a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 3v6m-4 0h8"/>',
};
const icon = (name, extra = '') => `<svg ${extra} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.star}</svg>`;
const game = new Quiz();
let screen = 'home';
let sound = true;
let revisionTimer;
let reactionTimer;
let celebrationTimer;
let transitionTimer;
let transitioning = false;
let dialogReturnFocus;
const app = document.querySelector('#app');
const instructions = 'Hai, kawan-kawan! Dalam misi ini, kamu perlu membaca setiap ayat dengan teliti. Kemudian, pilih sama ada ayat itu menggunakan kata tanya atau tidak menggunakan kata tanya. Setiap jawapan yang betul mendapat satu markah. Jom kita mulakan!';
const correctLine = 'Yeay! Kamu hebat! Jawapan kamu betul!';
const wrongLine = 'Alaaa... tak mengapa! Jom kita lihat jawapan yang betul!';
const victoryLine = 'Wahhh! Hebatnya kamu! Nampaknya kamu sudah dapat membezakan ayat tanya dengan kata tanya dan tanpa kata tanya! Mimi bangga dengan kamu!';
const revisionLine = 'Alaaa... nampaknya kita perlu ulang kaji sedikit lagi. Jangan risau! Mimi akan teman kamu belajar. Jom cuba sekali lagi!';

app.innerHTML = `<main class="game-shell">
  <header class="topbar">
    <button class="brand" data-action="home" aria-label="Kembali ke halaman utama"><span class="brand-symbol">${icon('star')}</span><span>Misi Bahasa<span class="brand-dot">.</span></span></button>
    <div class="topbar-right"><span class="year-badge">BAHASA MELAYU <i></i> TAHUN 4</span><button class="icon-button" id="sound" data-action="sound" aria-label="Matikan bunyi" aria-pressed="true">${icon('sound')}<span>BUNYI HIDUP</span></button><button class="sound-test" data-action="test-sound">Uji bunyi</button></div>
  </header>
  <div class="workspace">
    <section class="scene" aria-label="Bilik hologram Mimi">
      <div class="scene-orbit orbit-one"></div><div class="scene-orbit orbit-two"></div>
      <div class="stars" aria-hidden="true">${Array.from({length: 22}, (_,i) => `<i style="--x:${(i*37+11)%98}%;--y:${(i*23+7)%87}%;--delay:${i*.29}s"></i>`).join('')}</div>
      <div class="room-grid"></div><div class="ceiling-ring"></div><div class="ceiling-crystal"><span></span></div>
      <span class="float-symbol symbol-one" aria-hidden="true">?</span><span class="float-symbol symbol-two" aria-hidden="true">?</span><span class="float-symbol symbol-three" aria-hidden="true">✧</span>
      <div class="holo-tile tile-one" aria-hidden="true">${icon('book')}</div><div class="holo-tile tile-two" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="5" width="22" height="16" rx="2"/><path d="m2 26 3-5h22l3 5H2Zm11-2h6"/></svg></div>
      <div class="scene-heading"><span class="live-dot"></span> RAKAN MISI KAMU</div>
      <div class="mimi-stage"><div class="mimi-aura"></div>${mimiVisual}<div class="reaction-badge" aria-hidden="true"></div><div class="platform"><span></span></div></div>
      <div class="crystals crystals-left" aria-hidden="true"><i></i><i></i><i></i></div><div class="crystals crystals-right" aria-hidden="true"><i></i><i></i></div>
      <div class="mimi-name"><span>Mimi</span><span class="online-dot"></span></div>
      <div class="speech-bubble" id="mimi-dialogue" aria-live="polite">Hai, kawan! Sedia untuk<br>misi yang menyeronokkan? <span>✦</span></div>
      <div class="scene-caption">Belajar bersama. Hebat bersama.</div>
    </section>
    <section class="content" id="content" aria-label="Misi ayat tanya"></section>
  </div>
  <footer class="footer"><span><span class="tiny-star">✧</span> Setiap soalan, satu langkah lebih hebat.</span><span>Direka untuk minda ingin tahu <span class="footer-spark">✦</span></span></footer>
</main>
<dialog id="dialog"><button class="dialog-close icon-button" data-action="close" aria-label="Tutup">${icon('cross')}</button><div id="dialog-content"></div></dialog>
<div class="particles" aria-hidden="true"></div><div id="audio-status" role="status"></div>`;
if (originalBackground) {
  document.querySelector('.workspace').style.backgroundImage = `url("${originalBackground}")`;
  document.querySelector('.workspace').classList.add('original-background');
}
if (originalMimi) document.querySelector('.scene').classList.add('original-character');
const content = document.querySelector('#content');
const dialogue = document.querySelector('#mimi-dialogue');
const scene = document.querySelector('.scene');
const dialog = document.querySelector('#dialog');
onSpeaking(active => scene.classList.toggle('speaking', active));
onAudioStatus(status => {
  const notice = document.querySelector('#audio-status');
  notice.textContent = status === 'blocked' ? 'Bunyi belum dapat dimainkan. Tekan “Uji bunyi” dan semak kelantangan peranti.' : '';
});
function setMood(mood = '') { scene.classList.remove('happy', 'surprised', 'sad'); if (mood) scene.classList.add(mood); }
function say(text, voice = true) { dialogue.textContent = text; if (voice) speak(text); }
function focusContent() { content.querySelector('h1, h2')?.focus({preventScroll: true}); }
function progress() {
  return `<div class="quiz-top"><span class="eyebrow">MISI SEDANG BERLANGSUNG</span><div class="score-chip">${icon('star')}<span>MARKAH <strong>${game.score}<small> / 5</small></strong></span></div></div>
  <div class="progress-row"><span>SOALAN <strong>${game.index + 1}</strong> / 5</span><div class="progress-track" aria-label="Soalan ${game.index + 1} daripada 5">${QUESTIONS.map((_, i) => `<span class="${i < game.index ? 'done' : i === game.index ? 'current' : ''}"></span>`).join('')}</div></div>`;
}
function resetEffects() {
  clearTimeout(revisionTimer); clearTimeout(reactionTimer); clearTimeout(celebrationTimer); clearTimeout(transitionTimer);
  transitioning = false;
  document.querySelector('.particles').replaceChildren();
  document.querySelector('.reaction-badge').replaceChildren();
}
function home() {
  content.classList.remove('answered');
  resetEffects(); stopSpeech(); game.reset(); screen = 'home'; setMood();
  say('Hai, kawan! Sedia untuk misi yang menyeronokkan?', false);
  content.innerHTML = `<div class="home-content enter"><div class="eyebrow"><span class="eyebrow-line"></span> JOM BELAJAR BERSAMA MIMI</div>
    <h1 tabindex="-1">MISI KENALI<br>JENIS <span class="gradient-text">AYAT<br>TANYA!</span><span class="heading-spark" aria-hidden="true">✧</span></h1>
    <p class="intro">Baca, fikir dan pilih! Kenali jenis ayat tanya<br class="desktop-break"> dalam misi ringkas yang menyeronokkan.</p>
    <div class="mission-facts"><span><i class="fact-icon purple">${icon('book')}</i><b>5 soalan</b></span><span><i class="fact-icon pink">${icon('star')}</i><b>5 markah</b></span><span><i class="fact-icon teal">${icon('trophy')}</i><b>1 misi hebat!</b></span></div>
    <div class="home-actions"><button class="button secondary" data-action="instructions">${icon('book')} ARAHAN</button><button class="button primary" data-action="start">MULA MISI ${icon('arrow')}</button></div>
    <div class="home-note"><span class="mini-dots"><i></i><i></i><i></i></span> Satu jawapan betul, satu markah. Kamu pasti boleh!</div>
  </div>`;
}
function start() {
  resetEffects(); stopSpeech(); game.reset(); screen = 'quiz'; setMood('happy');
  playSound('start'); question(); say('Jom kita mulakan! Baca ayat dan pilih jenis ayat tanya.'); focusContent();
}
function question() {
  const q = game.question;
  content.classList.remove('answered');
  content.innerHTML = `<div class="quiz-content enter">${progress()}
    <h2 class="question-heading" tabindex="-1">Baca ayat di bawah.</h2><p class="question-hint">Ayat ini termasuk dalam jenis ayat tanya yang mana?</p>
    <div class="sentence-panel"><span class="quote-mark" aria-hidden="true">“</span><p>${q.sentence}</p><span class="sentence-corner" aria-hidden="true">✦</span></div>
    <div class="answers"><button class="answer" data-answer="dengan"><span class="answer-letter">A</span><span class="answer-text">Ayat Tanya dengan Kata Tanya</span><span class="answer-radio"></span></button><button class="answer" data-answer="tanpa"><span class="answer-letter">B</span><span class="answer-text">Ayat Tanya Tanpa Kata Tanya</span><span class="answer-radio"></span></button></div>
    <div id="feedback" aria-live="polite"><div class="choice-note">${icon('check')} Pilih satu jawapan yang paling tepat.</div></div>
  </div>`;
}
function answer(choice) {
  const correct = game.answer(choice);
  if (correct === null) return;
  const q = game.question;
  content.classList.add('answered');
  stopSpeech(); playSound(correct ? 'correct' : 'wrong'); setMood(correct ? 'happy' : 'surprised');
  for (const button of content.querySelectorAll('[data-answer]')) {
    button.disabled = true;
    if (button.dataset.answer === q.answer) { button.classList.add('correct'); button.querySelector('.answer-radio').innerHTML = icon('check'); }
    else if (button.dataset.answer === choice) { button.classList.add('incorrect'); button.querySelector('.answer-radio').innerHTML = icon('cross'); }
  }
  content.querySelector('.score-chip strong').innerHTML = `${game.score}<small> / 5</small>`;
  document.querySelector('#feedback').innerHTML = `<div class="feedback ${correct ? 'is-correct' : 'is-wrong'}"><div class="feedback-icon">${icon(correct ? 'check' : 'cross')}</div><div><strong>${correct ? 'Betul! Syabas, kawan!' : 'Tak mengapa, mari belajar!'}</strong><p class="correct-label">Ayat Tanya ${q.answer === 'dengan' ? 'dengan' : 'tanpa'} Kata Tanya</p><p>${q.explanation}</p></div></div><button class="button primary next-button" data-action="next">${game.index === 4 ? 'LIHAT KEPUTUSAN' : 'SOALAN SETERUSNYA'} ${icon('arrow')}</button>`;
  const badge = document.querySelector('.reaction-badge');
  badge.className = `reaction-badge ${correct ? 'positive' : 'negative'}`;
  badge.innerHTML = icon(correct ? 'check' : 'cross');
  clearTimeout(reactionTimer);
  reactionTimer = setTimeout(() => badge.replaceChildren(), 1700);
  say(correct ? correctLine : wrongLine);
  if (correct) celebrate(22);
}
function next() {
  if (transitioning || game.selection === null || game.finished) return;
  transitioning = true;
  content.querySelector('[data-action="next"]').disabled = true;
  content.firstElementChild.classList.add('leave');
  stopSpeech();
  transitionTimer = setTimeout(() => {
    transitioning = false;
    if (!game.next()) return;
    setMood();
    clearTimeout(reactionTimer);
    document.querySelector('.reaction-badge').replaceChildren();
    if (game.finished) ending();
    else { playSound('next'); question(); say('Bagus! Jom teruskan. Baca ayat dengan teliti.', false); }
    focusContent();
  }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 170);
}
function ending() {
  content.classList.remove('answered');
  screen = 'result'; const success = game.success;
  setMood(success ? 'happy' : 'sad'); playSound(success ? 'victory' : 'revision');
  say(success ? victoryLine : revisionLine);
  if (success) celebrate(65);
  else revisionTimer = setTimeout(() => setMood(), 2000);
  content.innerHTML = `<div class="result-content enter ${success ? 'success-ending' : 'revision-ending'}"><div class="eyebrow">${success ? '✦ MISI SELESAI ✦' : 'SETIAP CUBAAN MEMBANTU KITA BELAJAR'}</div>
  ${success ? `<div class="trophy-badge">${icon('trophy')}<span>✧</span><i>✦</i></div><h2 tabindex="-1">TAHNIAH!<br><span class="gradient-text">KAMU HEBAT!</span></h2><p class="result-subtitle">MISI BERJAYA!</p>` : `<h2 tabindex="-1">JOM ULANG KAJI<br><span class="gradient-text">BERSAMA MIMI!</span></h2>`}
  <div class="result-score"><span>MARKAH KAMU</span><strong>${game.score}<small> / 5</small></strong><div class="result-stars">${QUESTIONS.map((_, i) => `<span class="${i < game.score ? 'earned' : ''}">${icon('star')}</span>`).join('')}</div></div>
  ${success ? `<p class="result-note">Hebat! Kamu sudah kenal kedua-dua jenis ayat tanya.<br>Teruskan belajar dan mencuba!</p>` : `<div class="revision-cards"><article><span class="revision-letter">A</span><h3>AYAT TANYA<br>DENGAN KATA TANYA</h3><strong>Apakah fungsi komputer?</strong><p>Penerangan: Ayat ini menggunakan kata tanya 'apakah'.</p></article><article><span class="revision-letter">B</span><h3>AYAT TANYA<br>TANPA KATA TANYA</h3><strong>Kamu menggunakan komputer?</strong><p>Penerangan: Ayat ini tidak menggunakan kata tanya. Pertanyaan disampaikan melalui intonasi dan diakhiri dengan tanda soal (?).</p></article></div>`}
  <div class="result-actions"><button class="button ${success ? 'secondary' : 'primary'}" data-action="start">${icon('replay')} CUBA LAGI</button>${success ? `<button class="button primary" data-action="continue">TERUSKAN MISI ${icon('arrow')}</button>` : ''}</div></div>`;
}
function celebrate(count) {
  clearTimeout(celebrationTimer);
  const particles = document.querySelector('.particles');
  particles.innerHTML = Array.from({length:count}, (_,i) => `<i style="--x:${(i*41+9)%100}%;--delay:${(i%9)*.07}s;--color:${['#a486e6','#62d8d4','#ffc572','#f08ac7'][i%4]};--turn:${i*57}deg"></i>`).join('');
  celebrationTimer = setTimeout(() => particles.replaceChildren(), 3500);
}
function showDialog(html, voice) {
  dialogReturnFocus = document.activeElement;
  document.querySelector('#dialog-content').innerHTML = html;
  dialog.showModal();
  if (voice) speak(voice);
}
function closeDialog() { dialog.close(); stopSpeech(); dialogReturnFocus?.focus(); }
dialog.addEventListener('cancel', stopSpeech);
dialog.addEventListener('close', () => { if (dialogReturnFocus?.isConnected) dialogReturnFocus.focus(); });
dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if (event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) closeDialog(); } });
app.addEventListener('click', handleClick);
function handleClick(event) {
  const answerButton = event.target.closest('[data-answer]');
  if (answerButton) { answer(answerButton.dataset.answer); return; }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'start') { if (dialog.open) closeDialog(); start(); }
  if (action === 'next') next();
  if (action === 'home') {
    if (screen === 'quiz') showDialog(`<div class="modal-icon">${icon('home')}</div><h2>Kembali ke halaman utama?</h2><p>Kemajuan misi ini akan ditetapkan semula. Kamu boleh mula semula bila-bila masa.</p><div class="modal-actions"><button class="button secondary" data-action="close">SAMBUNG MISI</button><button class="button primary" data-action="confirm-home">HALAMAN UTAMA</button></div>`);
    else home();
  }
  if (action === 'confirm-home') { closeDialog(); home(); }
  if (action === 'instructions') showDialog(`<div class="modal-icon">${icon('book')}</div><span class="eyebrow">PANDUAN MISI</span><h2>Jom kenali ayat tanya!</h2><p>${instructions}</p><div class="instruction-steps"><span><b>1</b> Baca ayat</span><span><b>2</b> Pilih jenis ayat</span><span><b>3</b> Lihat penerangan</span></div><button class="button primary" data-action="start">MULA MISI ${icon('arrow')}</button><small class="voice-note">Suara Mimi menggunakan pertuturan peranti. Jika suara tidak tersedia, baca dialog pada skrin.</small>`, instructions);
  if (action === 'close') closeDialog();
  if (action === 'sound') {
    sound = !sound; setSound(sound);
    const button = document.querySelector('#sound'); button.innerHTML = icon(sound ? 'sound' : 'mute') + `<span>${sound ? 'BUNYI HIDUP' : 'BUNYI MATI'}</span>`; button.setAttribute('aria-pressed', String(sound)); button.setAttribute('aria-label', sound ? 'Matikan bunyi' : 'Hidupkan bunyi');
    if (sound) playSound('next');
  }
  if (action === 'test-sound') {
    stopSpeech();
    if (!sound) document.querySelector('#sound').click();
    playSound('correct');
  }
  if (action === 'continue') {
    const NEXT_ACTIVITY_URL = window.NEXT_ACTIVITY_URL || '';
    let url;
    try { url = new URL(NEXT_ACTIVITY_URL); } catch { /* Show friendly message. */ }
    if (url && ['https:', 'http:'].includes(url.protocol)) window.location.assign(url.href);
    else showDialog(`<div class="modal-icon">${icon('star')}</div><h2>Misi seterusnya akan tiba!</h2><p>Pautan misi seterusnya belum tersedia. Kamu boleh cuba lagi bersama Mimi sementara menunggu. Jumpa lagi, kawan!</p><button class="button primary" data-action="close">BAIK, MIMI! ${icon('check')}</button>`);
  }
}
home();
function fitLandscape() {
  document.documentElement.style.setProperty('--compact-scale', String(Math.min(1, window.innerHeight / 800)));
}
fitLandscape();
window.addEventListener('resize', fitLandscape);
