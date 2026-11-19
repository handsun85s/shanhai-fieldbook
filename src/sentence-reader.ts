import {patternReading} from './reading-patterns.mjs';
import {lessons,sentences,sentenceHints} from './sentence-lessons.mjs';
import {escapeHTML as esc} from './notebook.mjs';
import {readSave,writeSave} from './storage.mjs';
import './inquiries.css';


type Book={simplified:string[],passages:string[]};
type Lesson=Record<string,string[][]>;
export function mountSentences(host:HTMLElement,book:Book,volume:number,passage:number,original=false,start=0){
  const simple=sentences(book.simplified[passage-1]), old=sentences(book.passages[passage-1]);
  let at=Math.max(0,Math.min(start,simple.length-1)), reveal=false,word='';
  const lesson=(lessons as Lesson)[volume+'.'+passage];
  function render(){
    host.dataset.sentence=String(at);
    const line=simple[at], entry=lesson?.[at], author=entry&&line.startsWith(entry[0])?entry:undefined;
    const parsed=author?null:patternReading(line);
    const hints=sentenceHints(line), noteKey='shanhai-retell-v1:'+volume+':'+passage+':'+at;
    let saved='';try{const v=JSON.parse(readSave(noteKey).raw??'null');if(typeof v==='string')saved=v;}catch{}
    host.innerHTML=`<section class="sentence-study"><div class="sentence-nav"><strong>逐句读古文</strong><span>第 ${at+1} / ${simple.length} 句</span><button data-prev aria-label="上一句" ${at===0?'disabled':''}>←</button><button data-nextline aria-label="下一句" ${at+1===simple.length?'disabled':''}>→</button></div>
    <blockquote>${esc(original?(old[at]??line):line)}</blockquote>
    ${hints.length?`<div class="sentence-words" aria-label="点词看解释">${hints.map((h,i)=>`<button data-word="${i}" aria-pressed="${word===h.word}">${esc(h.word)}</button>`).join('')}</div><p class="word-meaning" role="status">${esc(hints.find(h=>h.word===word)?.meaning??'点词看它在句子里的作用。')}</p>`:''}
    <details class="sentence-writing" ${saved?'open':''}><summary>我用自己的话说</summary><label>我的白话 <textarea maxlength="260" rows="2" placeholder="谁，在什么地方，做了什么？"></textarea></label><small role="status"></small></details>
    ${author||parsed?`<button class="vol-main" data-meaning aria-expanded="${reveal}">${reveal?'收起白话':'对照这句的白话'}</button>${reveal?`<div class="sentence-meaning"><b>这句话的意思</b><p>${esc(author?.[1]??parsed??'')}</p><b>怎么读出来</b><p>${esc(author?.[2]??'按逗号分开读，依次找行进的方向、地名或当地的物产。这句白话按已核对的常见句式拼读。')}</p></div>`:''}`:`<small>本句可分句读、记下自己的解释。<a href="https://guji.nlc.cn/resource/resourceDetail?id=50" target="_blank" rel="noopener">拓展 · 看国家图书馆的古籍书影 ↗</a></small>`}
    </section>`;
    const q=<T extends HTMLElement=HTMLElement>(s:string)=>host.querySelector<T>(s)!;
    q('[data-prev]').onclick=()=>move(-1);q('[data-nextline]').onclick=()=>move(1);
    host.querySelectorAll<HTMLButtonElement>('[data-word]').forEach(b=>b.onclick=()=>{
      const h=hints[Number(b.dataset.word)];word=h.word;
      q('.word-meaning').textContent=h.meaning;
      host.querySelectorAll('[data-word]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    });
    const change=q<HTMLButtonElement>('[data-meaning]');
    if(change)change.onclick=()=>{reveal=!reveal;render();q('[data-meaning]').focus({preventScroll:true});};
    const input=q<HTMLTextAreaElement>('textarea');input.value=saved;
    input.oninput=()=>{q('.sentence-writing small').textContent=writeSave(noteKey,input.value)?'已保存在这个浏览器':'这次未能保存，请在离开前记下。';};
  }
  function move(delta:number){at+=delta;word='';reveal=false;render();const preferred=host.querySelector<HTMLButtonElement>(delta>0?'[data-nextline]':'[data-prev]');(preferred?.disabled?host.querySelector<HTMLButtonElement>(delta>0?'[data-prev]':'[data-nextline]'):preferred)?.focus({preventScroll:true});}
  render();
}
