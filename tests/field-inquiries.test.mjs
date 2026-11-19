import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inquiries,restoreInquiries,matchesProof} from '../src/field-inquiries.mjs';
import {patternReading} from '../src/reading-patterns.mjs';
import {lessons,sentences,sentenceHints} from '../src/sentence-lessons.mjs';
const book=v=>JSON.parse(readFileSync(new URL('../public/book/'+String(v).padStart(2,'0')+'.json',import.meta.url)));

test('every field label and transfer fragment points to its own passage, with two different supporting pieces',()=>{
  for(const s of inquiries){
    for(const [ref,quotes] of [[s.source,s.points.map(p=>p.quote)],[s.transfer.source,s.transfer.pieces]]){
      const text=book(ref.volume).simplified[ref.passage-1];
      for(const quote of quotes)assert.ok(text.includes(quote),s.id+' '+quote);
    }
    assert.equal(new Set(s.transfer.key).size,2);
    for(const p of s.points)assert.ok(p.options[p.answer]);
  }
});
test('only supported findings and a complete proof are restored',()=>{
  const site=inquiries[0],labels=site.points.map(p=>p.answer),proof=site.transfer.key;
  assert.deepEqual(restoreInquiries(JSON.stringify({bird:{labels,proof}})).bird,{labels,proof});
  assert.deepEqual(restoreInquiries(JSON.stringify({bird:{labels:[false],proof}})).bird,{labels:[null,null,null],proof:[]});
  assert.deepEqual(restoreInquiries('{').bird.labels,[null,null,null]);
  assert.equal(matchesProof([proof[0],proof[0]],proof),false);
});
test('all authored lessons cover every sentence in the cited passage and align with its opening words',()=>{
  for(const [ref,rows] of Object.entries(lessons)){
    const [v,p]=ref.split('.').map(Number),b=book(v);
    const lines=sentences(b.simplified[p-1]);
    assert.equal(lines.length,rows.length,ref);
    for(const [i,[start,meaning,method]] of rows.entries()){
      assert.ok(lines[i].startsWith(start),ref+' '+start);assert.ok(meaning.length>5&&method.length>5);
    }
  }
  const studies=readFileSync(new URL('../src/chapter-studies.ts',import.meta.url),'utf8');
  [...studies.matchAll(/passageIndex: (\d+)/gu)].forEach(([_,index],i)=>assert.ok(lessons[(i+1)+'.'+(Number(index)+1)]));
});
test('regular sentences are glossed only when every clause is covered',()=>{
  assert.equal(patternReading('汾水出焉，而西流注于河。'),'汾水从这里发源，向西流，汇入河。');
  assert.equal(patternReading('又东三百里，曰堂庭之山，多白猿。'),'再向东走三百里，这座山叫堂庭山，这里多有白猿。');
  assert.equal(patternReading('漳水出焉，未释一物。'),null);
});
test('the sentence reader preserves all text and alignment across both scripts in eighteen volumes',()=>{
  for(let v=1;v<=18;v++){
    const b=book(v);
    b.passages.forEach((line,i)=>{
      assert.equal(sentences(line).join(''),line);
      assert.equal(sentences(line).length,sentences(b.simplified[i]).length);
    });
  }
  assert.deepEqual(sentenceHints('漳水出焉，东流注于河。').map(h=>h.word),['出焉','注于']);
});
