import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {restoreCampaign} from '../src/campaign-progress.mjs';
import {chapters} from '../src/world-data.mjs';

// Node 22 releases prior to 22.18 do not load .ts without a flag. Transpile
// the same self-contained study array consumed by the game for those runners.
const source = await readFile(new URL('../src/chapter-studies.ts', import.meta.url), 'utf8');
const {outputText} = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext}});
const {studies} = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

test('十八站摘录逐字对应所在卷的固定底本、段号和简体段落', async () => {
  assert.equal(studies.length, chapters.length);
  for (const [index, study] of studies.entries()) {
    const id = String(index + 1).padStart(2, '0');
    const book = JSON.parse(await readFile(new URL('../public/book/' + id + '.json', import.meta.url), 'utf8'));
    assert.equal(study.source, book.source);
    assert.ok(Number.isInteger(study.passageIndex) && study.passageIndex >= 0);
    for (const [passages, excerpt] of [[book.passages, study.quote], [book.simplified, study.simpleQuote]]) {
      // The bird and its neighboring mountain in chapter seven span two successive entries.
      const first = passages[study.passageIndex], pair = first + (passages[study.passageIndex + 1] ?? '');
      const start = pair.indexOf(excerpt);
      assert.ok(excerpt.length > 0 && start >= 0 && start < first.length, study.place + ' 引文须落在所指的段落');
    }
  }
});

test('十八站各有两条独立证据，每站两答均正确且已到达才能获得该站卷印', () => {
  const keys = studies.map(s => s.tasks.map(t => t.answer));
  const prompts = new Set();
  for (const [i, study] of studies.entries()) {
    const volume = i + 1;
    assert.equal(study.tasks.length, 2);
    for (const t of study.tasks) {
      assert.equal(t.options.length, 3);
      assert.equal(new Set(t.options).size, 3);
      assert.ok(Number.isInteger(t.answer) && t.answer >= 0 && t.answer < t.options.length);
      assert.ok(t.prompt && t.explain && !prompts.has(t.prompt));
      prompts.add(t.prompt);
    }
    const restore = (arrived, answers) => restoreCampaign(JSON.stringify({arrived, answers:{[volume]:answers}}), keys, []);
    assert.deepEqual(restore([], keys[i]).answers[volume], undefined);
    const wrongSecond = (keys[i][1] + 1) % 3;
    assert.deepEqual(restore([volume], [keys[i][0], wrongSecond]).answers[volume], [keys[i][0]]);
    assert.deepEqual(restore([volume], keys[i]).answers[volume], keys[i]);
  }
  assert.equal(prompts.size, 36);
});
