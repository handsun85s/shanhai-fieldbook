import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chapters} from '../src/world-data.mjs';
import {awardKey,buildChallenges,excerptForMatch,searchable} from '../src/book-reader-rules.mjs';

const volumes = await Promise.all(chapters.map(async (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return JSON.parse(await readFile(new URL('../public/book/' + number + '.json', import.meta.url), 'utf8'));
}));

test('十八卷段序固定，简体与底本按段对应，保留罕字', () => {
  const all = volumes.flatMap(v => v.passages);
  assert.equal(all.length, 868);
  assert.equal(all.join('').match(/\p{Script=Han}/gu).length, 31213);
  for (const [index, v] of volumes.entries()) {
    assert.equal(v.title, chapters[index].name);
    assert.match(v.source, /^https:\/\/zh\.wikisource\.org\/w\/index\.php\?oldid=\d+$/);
    assert.equal(v.simplified.length, v.passages.length);
    assert.equal(new Set(v.passages).size, v.passages.length);
    for (const [i, p] of v.passages.entries()) {
      assert.ok(p.length && v.simplified[i].length);
      assert.doesNotMatch(p, /[{}<>[\]�【】]|\[\[|Category:|待詔太常屬臣望校治|<\/?ref/);
    }
  }
  assert.match(volumes[0].passages[0], /麗𪊨/u);
  assert.match(volumes[0].simplified[0], /丽𪊨/u);
  assert.match(volumes[17].simplified.at(-1), /洪水滔天/);
  // Reader bookmarks and awards refer to these exact edition and passage positions.
  assert.equal(createHash('sha256').update(JSON.stringify(volumes)).digest('hex'),
    '5ad291e044497180f351254f4fbad85c8d5262137786bd9796c0167f53af0ade');
});

test('868 个复原题在两种字形中均可答、有原句可查、段落收集键互不覆盖', () => {
  const keys = new Set();
  for (const [v,book] of volumes.entries()) {
    for (const [i,task] of buildChallenges(book,v+1).entries()) {
      keys.add(awardKey(v+1,i));
      for (const form of ['original','simple']) {
        const options = task.options.map(opt => opt[form]);
        assert.equal(new Set(options).size,3);
        const phrase = task.before[form] + options[task.answer] + task.after[form];
        const paragraph = form === 'original' ? book.passages[i] : book.simplified[i];
        assert.ok(paragraph.includes(phrase));
        assert.ok(options.filter((_,j) => j !== task.answer).every(o => !paragraph.includes(o)));
      }
    }
  }
  assert.equal(keys.size,868);
  assert.equal(searchable('猨翼'),searchable('猿翼'));
  assert.equal(searchable('迷穀'),searchable('迷榖'));
  assert.equal(searchable('凤凰'),searchable('鳳皇'));
  assert.match(excerptForMatch(volumes[0].passages[0],volumes[0].simplified[0],volumes[0].passages[0],'丽𪊨'),/麗𪊨/u);
});
