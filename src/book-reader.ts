import {chapters} from './world-data.mjs';
import {escapeHTML as escape} from './notebook.mjs';
import {readSave,writeSave} from './storage.mjs';
import {awardKey,buildChallenges,excerptForMatch,readerStorage,searchable} from './book-reader-rules.mjs';
import {mountBookField} from './book-field';
import {assetPath} from './assets';
import {mountSentences} from './sentence-reader';
import './book-reader.css';

type Book = {title:string; source:string; passages:string[]; simplified:string[]};
type Script = 'original' | 'simple';
type Result = {volume:number; index:number; excerpt:string};
type TextPair = Record<Script,string>;
const books = new Map<number,Book>();
const sessionAwards = new Set<string>();
const lastRead = new Map<number,number>();
const volumeNames = chapters.map(chapter=>chapter.name);
const sourceNotes = 'https://github.com/handsun85s/shanhai-fieldbook/blob/main/docs/book-sources.md';
const clueSearches = [
  {name:'鸟兽', words:['有兽焉','有鸟焉','其状如狐','其状如马']},
  {name:'草木', words:['有草焉','有木焉','其木多','其草多']},
  {name:'金玉石', words:['多白玉','多金玉','多黄金','多水玉','多美石']},
  {name:'水流', words:['流注于','流入于','水出焉']},
  {name:'声音', words:['其音如','其声如','其鸣如','其音若']}
];
type ClueSearch = typeof clueSearches[number];

export async function loadVolume(volume:number,signal:AbortSignal) {
  const cached=books.get(volume);
  if(cached) return cached;
  const id=String(volume).padStart(2,'0');
  const response=await fetch(import.meta.env.BASE_URL+'book/'+id+'.json',{signal});
  if(!response.ok) throw new Error('HTTP '+response.status);
  const book:Book=await response.json();
  if(book.title!==volumeNames[volume-1] || !Array.isArray(book.passages) || !book.passages.length ||
    !Array.isArray(book.simplified) || book.passages.length!==book.simplified.length ||
    !book.passages.every(p=>typeof p==='string'&&p.length>0) ||
    !book.simplified.every(p=>typeof p==='string'&&p.length>0) ||
    !/^https:\/\/zh\.wikisource\.org\/w\/index\.php\?oldid=\d+$/.test(book.source)) throw new Error('Edition mismatch');
  books.set(volume,book);
  return book;
}

const readPosition=(v:number)=>lastRead.get(v)??Number(readSave(readerStorage+':position:'+v).raw);
const textAt=(b:Book,i:number,script:Script)=>script==='simple'?b.simplified[i]:b.passages[i];
const clampIndex=(i:number,n:number)=>Number.isInteger(i)?Math.max(0,Math.min(n-1,i)):0;

export function mountBookReader(host:HTMLElement, initialVolume:number, initialPassage:number|undefined, onBack:()=>void, initialSentence?:number) {
  const abort=new AbortController();
  let volume=initialVolume, index=0, book:Book, completed=new Set<number>();
  let guided=initialSentence;
  let script:Script=readSave(readerStorage+':script').raw==='"original"'?'original':'simple';
  let activeRequest=0, searchRequest=0, resultPage=0, results:Result[]=[];
  let selectedClue:ClueSearch|undefined;
  let collecting=false, saved=true, answered=false;
  let closeField:(()=>void)|undefined;
  const pageSize=8;
  const $=<T extends HTMLElement=HTMLElement>(query:string)=>host.querySelector<T>(query)!;

  host.innerHTML=`<section class="book-desk"><div class="book-tools">
    <details class="book-lookup"><summary>查找经文</summary><form class="book-search">
    <label>关键词<input type="search" maxlength="80" placeholder="如：青丘、精卫、建木" autocomplete="off"></label>
    <label>范围<select aria-label="查找范围"><option value="volume">本卷</option><option value="all">全书十八卷</option></select></label>
    <button type="submit">查找</button></form>
    <div class="book-clues" role="group" aria-label="按线索找全书经文字词"><strong>按线索找</strong>
      ${clueSearches.map((c,i)=>`<button data-clue="${i}" aria-pressed="false">${c.name}</button>`).join('')}</div>
    <div class="book-results" aria-live="polite"></div></details>
    <div class="book-script" role="group" aria-label="经文字形"><button data-script="simple">简体</button><button data-script="original">底本原字</button></div>
    </div><article class="book-leaf"></article></section>`;

  function syncScripts(){
    host.querySelectorAll<HTMLButtonElement>('[data-script]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.script===script)));
  }
  function renderVolumeProgress(){
    const output=host.querySelector<HTMLElement>('.book-collection');
    if(output)output.textContent=completed.size===book.passages.length?'✓ 全卷经文已集齐':`已收录 ${completed.size} / ${book.passages.length} 段`;
    const bar=host.querySelector<HTMLProgressElement>('.book-progress');
    if(bar)bar.value=completed.size;
  }
  function renderLeaf(focus=false){
    syncScripts();
    const length=book.passages.length, p=textAt(book,index,script);
    const headline=`卷 ${volume} · ${book.title}`;
    const last=index===length-1, first=index===0;
    const goLabel=last&&volume<18?'进入下一卷 →':'下一段 →';
    $('.book-leaf').innerHTML=`<div class="book-page-head"><div><span class="book-folio">经文书页</span>
      <h2 tabindex="-1">${escape(headline)}</h2></div><span class="book-count">第 ${index+1} / ${length} 段</span></div>
      <div class="book-collection-line"><progress class="book-progress" max="${length}" value="${completed.size}" aria-label="本卷经文收集进度"></progress>
      <span class="book-collection"></span></div>
      <div class="book-reading"><p class="book-original" lang="${script==='simple'?'zh-Hans':'zh-Hant'}">${escape(p)}</p></div>
      ${volume===1&&index===7?`<details class="book-river-plate"><summary>水中补记 · 看赤鱬</summary><figure>
      <img loading="lazy" src="${assetPath('book-plates/south-7.webp')}" alt="赤鱬的黏土图版，鱼身上有一张人面">
      <figcaption>青丘的英水里有赤鱬。鱼形、人面据本段经文，配色与面容为美术设想。</figcaption></figure></details>`:''}
      <details class="book-sentences"><summary>逐句读古文 · 查词与白话</summary><div data-sentences></div></details>
      <div class="book-evidence"></div>
      <div class="book-paging"><button data-page="-1" ${first&&volume===1?'disabled':''}>${first&&volume>1?'← 上一卷末段':'← 上一段'}</button>
      <form class="book-jump"><label>跳至 <input type="number" aria-label="输入本卷段号" inputmode="numeric" min="1" max="${length}" required value="${index+1}"> 段</label><button>前往</button></form>
      <button data-page="1" ${last&&volume===18?'disabled':''}>${goLabel}</button></div>
      <footer class="book-attribution">经文录入与标点来自中文维基文库。<a href="${escape(book.source)}" target="_blank" rel="noopener">核对本卷底本 ↗</a>
      <a href="${sourceNotes}" target="_blank" rel="noopener">整理与署名 ↗</a></footer>`;
    const sentenceBox=$<HTMLDetailsElement>('.book-sentences');
    const start=guided??0;
    sentenceBox.ontoggle=()=>{if(sentenceBox.open&&!sentenceBox.querySelector('.sentence-study'))mountSentences(sentenceBox.querySelector('[data-sentences]')!,book,volume,index+1,script==='original',start);};
    if(guided!==undefined){guided=undefined;sentenceBox.open=true;}
    renderVolumeProgress();
    renderEvidence();
    $('.book-jump').onsubmit=e=>{
      e.preventDefault();
      const number=$<HTMLInputElement>('.book-jump input').valueAsNumber;
      if(Number.isInteger(number)&&number>=1&&number<=length)move(volume,number-1);
    };
    host.querySelectorAll<HTMLButtonElement>('[data-page]').forEach(b=>b.onclick=()=>{
      const target=index+Number(b.dataset.page);
      if(target<0)void openVolume(volume-1,Infinity);
      else if(target>=length)void openVolume(volume+1,0);
      else move(volume,target);
    });
    if(focus) $('.book-page-head h2').focus({preventScroll:true});
  }
  function renderEvidence(){
    const panel=$('.book-evidence');
    if(!collecting) {
      panel.innerHTML=`<div class="book-study-actions"><button class="book-walk">走入这段山海 →</button><button class="book-start">${completed.has(index)?'✓ 已收录 · 再试原句复原':'原句复原 · 收录这一段'}</button></div>`;
      $('.book-walk').onclick=startField;
      $('.book-start').onclick=()=>{collecting=true;answered=false;renderLeaf();$('.book-choice button').focus();};
      return;
    }
    const task=buildChallenges(book,volume)[index];
    const before=task.before[script], after=task.after[script];
    $('.book-reading').innerHTML=`<details><summary>翻看本段原文</summary><p class="book-original">${escape(textAt(book,index,script))}</p></details>`;
    panel.innerHTML=`<section class="book-trial"><div class="book-trial-top"><strong>原句复原</strong><button data-read>返回阅读</button></div>
      <p>读读前后文，把缺少的${task.label==='原句'?'字词':task.label}放回去。</p>
      <p class="book-quote">${escape(before)}<mark>${answered?escape(task.options[task.answer][script]):'　？　'}</mark>${escape(after)}</p>
      <div class="book-choice">${task.options.map((option:TextPair,i:number)=>`<button data-option="${i}" ${answered?'disabled':''}>${escape(option[script])}</button>`).join('')}</div>
      <p class="book-response" role="status">${answered?'✓ 已收录。原句写作「'+escape(before+task.options[task.answer][script]+after)+'」':''}</p>
      ${answered&&!saved?'<p>本次收录已记在当前页面，浏览器存储暂时无法写入。</p>':''}</section>`;
    $('[data-read]').onclick=()=>{collecting=false;renderLeaf();$('.book-start').focus();};
    host.querySelectorAll<HTMLButtonElement>('[data-option]').forEach(b=>b.onclick=()=>{
      if(Number(b.dataset.option)!==task.answer){
        b.disabled=true;
        $('.book-response').textContent='再试一次。点「翻看本段原文」，找一找缺字前后的线索。';
        return;
      }
      answered=true;
      const key=awardKey(volume,index);
      sessionAwards.add(key); completed.add(index);
      saved=writeSave(key,true);
      renderVolumeProgress();
      renderEvidence();
      $('.book-response').setAttribute('tabindex','-1');$('.book-response').focus({preventScroll:true});
    });
  }
  function exitField(){
    closeField?.();closeField=undefined;
    $('.book-tools').hidden=false;
  }
  function startField(){
    const p=book.simplified[index];
    const place=p.match(/(?:其首曰|[，。]曰|有山名曰|里)([\p{Script=Han}]{1,7}?之山|[\p{Script=Han}]{1,5}?山)(?=[，。；])/u)?.[1]??`第${index+1}段观察处`;
    $('.book-tools').hidden=true;
    $('.book-leaf').innerHTML=`<div class="book-field-bar"><div><span class="book-folio">${escape(book.title)} · 第${index+1}段</span><h2>${escape(place)}</h2></div><button data-stop-walk>← 返回阅读</button></div><div class="book-passage-field"></div>`;
    $('[data-stop-walk]').onclick=()=>{exitField();renderLeaf(true);};
    const options={volume,name:book.title,place,passage:{index,text:p},onArrive:()=>{
      exitField();collecting=true;answered=false;renderLeaf();$('.book-choice button').focus();
    }};
    closeField=mountBookField($('.book-passage-field'),options);
  }
  function move(v:number,target:number){
    if(v!==volume){void openVolume(v,target);return;}
    index=clampIndex(target,book.passages.length);
    lastRead.set(v,index);writeSave(readerStorage+':position:'+v,index);
    collecting=false;answered=false;
    renderLeaf(true);
  }
  async function openVolume(v:number,target?:number){
    if(!Number.isInteger(v)||v<1||v>18)return;
    if(closeField)exitField();
    const request=++activeRequest;
    $('.book-leaf').innerHTML='<p role="status">正在展开经文…</p>';
    try {
      const loaded=await loadVolume(v,abort.signal);
      if(abort.signal.aborted||request!==activeRequest)return;
      volume=v;book=loaded;completed=new Set();
      book.passages.forEach((_,i)=>{const key=awardKey(v,i);if(sessionAwards.has(key)||readSave(key).raw==='true')completed.add(i);});
      move(v,target===Infinity?book.passages.length-1:target??readPosition(v));
    } catch {
      if(abort.signal.aborted||request!==activeRequest)return;
      $('.book-leaf').innerHTML='<p role="alert">这一卷未能载入。</p><div class="book-retry"><button data-retry>重新载入</button><button data-return>返回考察</button></div>';
      $('[data-retry]').onclick=()=>void openVolume(v,target);$('[data-return]').onclick=onBack;
    }
  }

  function renderResults(){
    const panel=$('.book-results');
    if(!results.length){panel.textContent='没有找到这组字。可以试试更短的关键词。';return;}
    const pageStart=resultPage*pageSize,visible=results.slice(pageStart,pageStart+pageSize);
    const hint=selectedClue?'全书经文字词「'+selectedClue.words.join('」「')+'」 · ':'';
    panel.innerHTML=`<p>${escape(hint)}找到 ${results.length} 段 · 正在显示 ${pageStart+1}–${pageStart+visible.length}</p>
      <ul>${visible.map((r,i)=>`<li><button data-hit="${i}"><b>${escape(volumeNames[r.volume-1])} · 第${r.index+1}段</b><span>${escape(r.excerpt)}</span></button></li>`).join('')}</ul>
      ${results.length>pageSize?`<div class="book-result-paging"><button data-results-prev ${resultPage===0?'disabled':''}>上一组</button><button data-results-next ${pageStart+pageSize>=results.length?'disabled':''}>下一组</button></div>`:''}`;
    panel.querySelectorAll<HTMLButtonElement>('[data-hit]').forEach(b=>b.onclick=()=>{
      const hit=visible[Number(b.dataset.hit)];
      $<HTMLDetailsElement>('.book-lookup').open=false;
      void openVolume(hit.volume,hit.index);
    });
    const prev=panel.querySelector<HTMLButtonElement>('[data-results-prev]');
    const next=panel.querySelector<HTMLButtonElement>('[data-results-next]');
    if(prev)prev.onclick=()=>{resultPage--;renderResults();};
    if(next)next.onclick=()=>{resultPage++;renderResults();};
  }
  async function search(clue?:ClueSearch){
    selectedClue=clue;
    host.querySelectorAll<HTMLButtonElement>('[data-clue]').forEach(b=>
      b.setAttribute('aria-pressed',String(clue===clueSearches[Number(b.dataset.clue)])));
    if(clue){
      $<HTMLInputElement>('.book-search input').value='';
      $<HTMLSelectElement>('.book-search select').value='all';
    }
    const term=searchable($<HTMLInputElement>('.book-search input').value);
    const panel=$('.book-results');
    const run=++searchRequest;
    if(!clue&&!term){panel.textContent='输入要找的地名、动物名，或原句里的几个字。';return;}
    const scope=$<HTMLSelectElement>('.book-search select').value;
    const volumes=scope==='all'?volumeNames.map((_,i)=>i+1):[volume];
    panel.textContent='正在查找经文…';
    try {
      const loaded=await Promise.all(volumes.map(v=>loadVolume(v,abort.signal)));
      if(abort.signal.aborted||run!==searchRequest)return;
      results=[];
      for(const [j,b] of loaded.entries())b.passages.forEach((original,i)=>{
        const word=clue?clue.words.find(w=>b.simplified[i].includes(w)):term;
        if(!word)return;
        const excerpt=excerptForMatch(original,b.simplified[i],textAt(b,i,script),word);
        if(excerpt)results.push({volume:volumes[j],index:i,excerpt});
      });
      resultPage=0;renderResults();
    } catch {
      if(abort.signal.aborted||run!==searchRequest)return;
      panel.innerHTML='<p>有经卷尚未载入。</p><button data-search-again>重新查找</button>';
      $('[data-search-again]').onclick=()=>void search(clue);
    }
  }
  $('.book-search').onsubmit=e=>{e.preventDefault();void search();};
  host.querySelectorAll<HTMLButtonElement>('[data-clue]').forEach(b=>
    b.onclick=()=>void search(clueSearches[Number(b.dataset.clue)]));
  host.querySelectorAll<HTMLButtonElement>('[data-script]').forEach(b=>b.onclick=()=>{
    const openReader=host.querySelector<HTMLElement>('.book-sentences[open] [data-sentences]');
    if(openReader)guided=Number(openReader.dataset.sentence??0);
    script=b.dataset.script==='original'?'original':'simple';writeSave(readerStorage+':script',script);
    syncScripts();if(book&&$('.book-leaf').querySelector('.book-page-head'))renderLeaf();
    if($<HTMLDetailsElement>('.book-lookup').open&&(selectedClue||$<HTMLInputElement>('.book-search input').value.trim()))void search(selectedClue);
  });
  const onStorage=(event:StorageEvent)=>{
    if(!book||!event.key?.startsWith(readerStorage+':leaf:'+volume+':')||event.newValue!=='true')return;
    const i=Number(event.key.split(':').at(-1));
    if(Number.isInteger(i)&&i>=0&&i<book.passages.length){
      completed.add(i);renderVolumeProgress();if(i===index&&!collecting&&host.querySelector('.book-evidence'))renderEvidence();
    }
  };
  window.addEventListener('storage',onStorage);
  syncScripts();
  void openVolume(initialVolume,initialPassage);
  return ()=>{abort.abort();closeField?.();window.removeEventListener('storage',onStorage);};
}
