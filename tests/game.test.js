import test from 'node:test';
import assert from 'node:assert/strict';
import { Quiz, QUESTIONS } from '../src/game.js';
for (let score = 0; score <= 5; score++) {
  test(`${score}/5 yields ${score >= 3 ? 'success' : 'revision'} and resets fully`, () => {
    const game = new Quiz();
    for (let i = 0; i < 5; i++) {
      const right = QUESTIONS[i].answer;
      const selected = i < score ? right : right === 'dengan' ? 'tanpa' : 'dengan';
      assert.equal(game.question.sentence, QUESTIONS[i].sentence);
      game.answer(selected);
      const once = game.score;
      assert.equal(game.answer(right), null);
      assert.equal(game.score, once);
      assert.equal(game.next(), true);
    }
    assert.equal(game.score, score);
    assert.equal(game.finished, true);
    assert.equal(game.success, score >= 3);
    assert.equal(game.next(), false);
    game.reset();
    assert.deepEqual({index:game.index,score:game.score,selection:game.selection,finished:game.finished}, {index:0,score:0,selection:null,finished:false});
  });
}
test('exact question wording and classification', () => {
  assert.deepEqual(QUESTIONS.map(q => q.sentence), ['Apakah fungsi komputer?', 'Kamu menggunakan komputer?', 'Di manakah bilik komputer?', 'Komputer itu milik kamu?', 'Siapakah yang menggunakan komputer itu?']);
  assert.deepEqual(QUESTIONS.map(q => q.answer), ['dengan','tanpa','dengan','tanpa','dengan']);
});
test('unanswered questions cannot be skipped; invalid answers do not score', () => {
  const game = new Quiz(); assert.equal(game.next(),false); assert.equal(game.answer('unknown'),null); assert.equal(game.score,0); assert.equal(game.selection,null);
});
