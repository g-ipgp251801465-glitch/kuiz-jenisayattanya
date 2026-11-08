export const QUESTIONS = Object.freeze([
  { sentence: 'Apakah fungsi komputer?', answer: 'dengan', explanation: "Ayat ini menggunakan kata tanya 'apakah' untuk menanyakan sesuatu perkara." },
  { sentence: 'Kamu menggunakan komputer?', answer: 'tanpa', explanation: 'Ayat ini tidak menggunakan kata tanya. Pertanyaan disampaikan melalui intonasi dan diakhiri dengan tanda soal (?).' },
  { sentence: 'Di manakah bilik komputer?', answer: 'dengan', explanation: "Ayat ini menggunakan kata tanya 'di manakah' untuk menanyakan tempat." },
  { sentence: 'Komputer itu milik kamu?', answer: 'tanpa', explanation: 'Ayat ini tidak menggunakan kata tanya. Pertanyaan disampaikan melalui intonasi dan diakhiri dengan tanda soal (?).' },
  { sentence: 'Siapakah yang menggunakan komputer itu?', answer: 'dengan', explanation: "Ayat ini menggunakan kata tanya 'siapakah' untuk menanyakan orang." },
]);
export class Quiz {
  constructor() { this.reset(); }
  reset() { this.index = 0; this.score = 0; this.selection = null; this.finished = false; }
  get question() { return QUESTIONS[this.index]; }
  get success() { return this.score >= 3; }
  answer(choice) {
    if (this.selection !== null || this.finished || !['dengan', 'tanpa'].includes(choice)) return null;
    this.selection = choice;
    const correct = choice === this.question.answer;
    if (correct) this.score++;
    return correct;
  }
  next() {
    if (this.selection === null || this.finished) return false;
    if (this.index === QUESTIONS.length - 1) this.finished = true;
    else { this.index++; this.selection = null; }
    return true;
  }
}
