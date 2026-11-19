import {chapters, southRoute} from './world-data.mjs';
import {studies} from './chapter-studies';
import {mountBookField} from './book-field';
import {mountBookReader} from './book-reader';
import {mountStudyPlate} from './study-plate';
import {mountSouthStop,southStopDone} from './south-stops';
import {CAMPAIGN_KEY, mergeCampaign, restoreCampaign, validVolume} from './campaign-progress.mjs';
import {readSave, writeSave} from './storage.mjs';
import {escapeHTML} from './notebook.mjs';
import {sound} from './sound';
import {assetPath} from './assets';
import {bindPassageHelp} from './passage-help';
import {mountInquiries} from './inquiries';
import {mountFlight} from './jingwei-flight';
import './campaign.css';

type Save = {current:number;arrived:number[];answers:Record<number,number[]>;finale:number[]};
const taskKeys = studies.map(study=>study.tasks.map(task=>task.answer));
// In the closing exercise the player files evidence from three different regions.
const closingCases = [
  {volume:3, candidates:[6,3,8], clue:'白喙赤足，常常衔着木枝和小石飞向东海。'},
  {volume:14, candidates:[14,10,7], clue:'生活在流波山，形貌像牛，只有一足。'},
  {volume:18, candidates:[5,9,18], clue:'青色的叶、紫色的茎，开黑花，结黄果。'},
];
const finalKey=closingCases.map(c=>c.candidates.indexOf(c.volume));
const dialog=document.createElement('dialog');
dialog.className='volume-game';
dialog.setAttribute('aria-label','山海行记 · 十八卷远行');
document.body.append(dialog);
const initial=readSave(CAMPAIGN_KEY);
const restore=(raw:string|null)=>restoreCampaign(raw,taskKeys,finalKey) as Save;
let state=restore(initial.raw), writable=initial.ok, filter='全部', originalGlyphs=false;
let cleanup=()=>{}, returnFocus:HTMLElement|null=null;
const $=<T extends HTMLElement=HTMLElement>(selector:string)=>dialog.querySelector<T>(selector)!;
const listen=(selector:string,fn:()=>void)=>dialog.querySelector<HTMLButtonElement>(selector)?.addEventListener('click',fn);
const id=(n:number)=>String(n).padStart(2,'0');
const cover=(n:number)=>assetPath('book-plates/'+id(n)+'.webp');
const esc=escapeHTML;
const finished=(v:number)=>state.answers[v]?.length===taskKeys[v-1].length;
const seals=()=>chapters.filter(c=>finished(c.number)).length;
const nextVolume=(v:number)=>chapters.find(c=>c.number>v&&!finished(c.number))?.number??chapters.find(c=>!finished(c.number))?.number;
export const campaignOpen=()=>dialog.open;
function save(){
  const other=readSave(CAMPAIGN_KEY);
  if(other.ok)state=mergeCampaign(state,restore(other.raw)) as Save;
  writable=writeSave(CAMPAIGN_KEY,state);
  const warning=dialog.querySelector<HTMLElement>('.vol-save');
  if(warning)warning.hidden=writable;
}
function shell(title:string,content:string,back?:()=>void){
  cleanup();cleanup=()=>{};
  dialog.innerHTML=`<div class="vol-bar"><div class="vol-identity"><i aria-hidden="true">山海</i><b>山海行记</b><span>/</span><strong>${esc(title)}</strong></div><div class="vol-controls">${back?'<button data-back>← 返回</button>':''}<button data-close aria-label="离开十八卷远行">关闭 ×</button></div></div><p class="vol-save" role="status" ${writable?'hidden':''}>此浏览器暂时无法保存。你可以继续玩，关闭页面前请留意进度。</p><div class="vol-content">${content}</div>`;
  dialog.scrollTop=0;
  listen('[data-close]',()=>dialog.close());
  if(back)listen('[data-back]',back);
  const head=dialog.querySelector<HTMLElement>('h1,h2');
  if(head&&dialog.open){head.tabIndex=-1;head.focus({preventScroll:true});}
}
function status(v:number){
  if(finished(v))return '已盖卷印';
  if(state.arrived.includes(v))return '已到站 · 继续考察';
  return '进入考察';
}
function catalog(){
  const count=seals(),v=state.current,chapter=chapters[v-1],study=studies[v-1];
  const visible=chapters.filter(c=>filter==='全部'||c.group===filter);
  shell('十八卷远行',`<div class="vol-hero"><div class="vol-hero-copy"><p class="vol-kicker">我的山海手记</p><h1>十八卷远行</h1><p>走进山川，观察异兽和草木。每卷找回两条有出处的线索，集齐十八枚卷印后回营合卷。</p><div class="vol-meter" aria-label="已收集卷印 ${count} 枚"><i style="width:${count/18*100}%"></i></div><strong class="vol-tally">${count} / 18 枚卷印</strong><div class="vol-actions"><button class="vol-main" data-current>${count===18?(state.finale.length===3?'重看通关手记':'回营合卷'):(state.arrived.includes(v)?'继续':'启程')+' · '+chapter.name} →</button><button class="vol-alt" data-flight>山野考察 · 逐句读古文 ↗</button></div></div><img src="${cover(v)}" alt="${esc(study.place)}黏土图版" fetchpriority="high"></div><div class="vol-index"><h2>选一卷出发</h2><div class="vol-filters" role="group" aria-label="按篇类筛选">${['全部','山经','海外','海内','大荒'].map(g=>`<button data-group="${g}" aria-pressed="${g===filter}">${g}</button>`).join('')}</div></div><div class="vol-grid">${visible.map(c=>`<button class="vol-card" data-volume="${c.number}"><img src="${cover(c.number)}" alt="" loading="lazy"><span><small>卷 ${id(c.number)} · ${c.group}</small><strong>${c.name}</strong><em>${esc(studies[c.number-1].place)}</em><b>${finished(c.number)?'✓ ':''}${status(c.number)} ↗</b></span></button>`).join('')}</div>`);
  listen('[data-flight]',openJingwei);
  listen('[data-current]',()=>count===18?finale():chapterView(v));
  dialog.querySelectorAll<HTMLButtonElement>('[data-volume]').forEach(b=>b.onclick=()=>chapterView(Number(b.dataset.volume)));
  dialog.querySelectorAll<HTMLButtonElement>('[data-group]').forEach(b=>b.onclick=()=>{
    filter=b.dataset.group!; catalog();
    const active=$<HTMLButtonElement>('[data-group][aria-pressed="true"]');active.focus();active.scrollIntoView({block:'nearest'});
  });
}
function chapterView(v:number){
  const study=studies[v-1],chapter=chapters[v-1];
  state.current=v;save();
  const visited=state.arrived.includes(v);
  shell(chapter.name,`<div class="vol-chapter"><img class="vol-front" src="${cover(v)}" alt="${esc(study.place)}黏土图版"><div class="vol-brief"><p class="vol-kicker">卷 ${id(v)} · ${chapter.name}</p><h1>${esc(study.place)}</h1><p>${esc(study.lead)}</p><div class="vol-actions"><button class="vol-main" data-go>${v===3&&!visited?'考察精卫与发鸠山':finished(v)?'翻阅卷印':visited?'接着核对线索':'走进考察地'} →</button>${v===3&&visited?'<button class="vol-alt" data-flight>回到发鸠山考察</button>':''}<button class="vol-alt" data-reader>翻阅本卷全文</button>${visited||v===3?'<button class="vol-link" data-walk>'+ (visited?'再走一次小径':'沿小径步行考察')+'</button>':''}</div></div></div>`,catalog);
  if(v===1){
    const section=document.createElement('section');
    section.className='vol-south';
    section.innerHTML='<h2>南山首段 · 九处山行</h2><p>从招摇至箕尾，经文依次写出九个山名，篇末总数作十山。可以沿具名地点逐一寻访。</p><div class="vol-south-route">'+southRoute.map((s,i)=>`<button data-stop="${i}"><small>${String(i+1).padStart(2,'0')}</small><strong>${s.name}</strong><span> ${!s.open&&southStopDone(i)?'✓ 已获山印':s.open?'自由行山':i===2||i===5?'山脚考察':'山中考察'} ↗</span></button>`).join('')+'</div>';
    $('.vol-content').append(section);
    section.querySelectorAll<HTMLButtonElement>('[data-stop]').forEach(b=>b.onclick=()=>{
      const index=Number(b.dataset.stop), stop=southRoute[index];
      if(stop.open){dialog.close();document.dispatchEvent(new CustomEvent('worldtravel',{detail:stop.id}));}
      else southStop(index);
    });
  }
  listen('[data-flight]',openJingwei);
  listen('[data-go]',()=>v===3&&!visited?openJingwei():finished(v)?seal(v):visited?studyView(v):field(v));
  listen('[data-reader]',()=>reader(v));
  listen('[data-walk]',()=>field(v));
}
function field(v:number){
  const study=studies[v-1];
  shell(chapters[v-1].name,`<div class="vol-head"><p class="vol-kicker">卷 ${id(v)} · 寻访</p><h2>${esc(study.place)}</h2></div><div class="vol-field-host"></div>`,()=>chapterView(v));
  cleanup=mountBookField($('.vol-field-host'),{volume:v,name:chapters[v-1].name,place:study.place,onArrive:()=>{
    if(!state.arrived.includes(v))state.arrived.push(v);
    state.current=v;save();studyView(v);
  }});
}
function reader(v:number,passage?:number,back=()=>chapterView(v),sentence?:number){
  state.current=v;save();
  shell('全书原文','<div class="vol-reader-host"></div>',back);
  cleanup=mountBookReader($('.vol-reader-host'),v,passage,back,sentence);
}
function southStop(index:number){
  state.current=1;save();
  shell('南山首段','<div class="vol-south-host"></div>',()=>chapterView(1));
  cleanup=mountSouthStop($('.vol-south-host'),index,()=>chapterView(1),()=>reader(1,index,()=>southStop(index)));
}
function studyView(v:number){
  const study=studies[v-1], step=state.answers[v]?.length??0;
  if(step>=study.tasks.length){seal(v);return;}
  const task=study.tasks[step];
  shell(chapters[v-1].name,`<div class="vol-head"><p class="vol-kicker">卷 ${id(v)} · ${chapters[v-1].name}</p><h2>${esc(study.place)}</h2></div><div class="vol-study"><div class="vol-plate-host"></div><section class="vol-evidence"><p class="vol-kicker">原文摘录</p><blockquote>${esc(study.quote)}</blockquote><a href="${esc(study.source)}" target="_blank" rel="noopener">核对本卷底本 ↗</a><div class="vol-question"><small>线索 ${step+1} / ${study.tasks.length}</small><h3>${esc(task.prompt)}</h3><div class="vol-choices">${task.options.map((o,i)=>`<button data-choice="${i}">${esc(o)}</button>`).join('')}</div><p class="vol-feedback" role="status"></p><button class="vol-main" data-next hidden>${step+1===study.tasks.length?'收下卷印':'下一条线索'} →</button></div></section></div>`,()=>chapterView(v));
  const stopPlate=mountStudyPlate($('.vol-plate-host'),v);
  const help=document.createElement('details');help.className='book-sentences';
  help.innerHTML='<summary>逐句读这一段 · 对照白话</summary><div data-help-body></div>';
  $('.vol-question').before(help);
  const stopHelp=bindPassageHelp(help,v,study.passageIndex+1,study.simpleQuote);
  cleanup=()=>{stopPlate();stopHelp();};
  const quote=$<HTMLQuoteElement>('.vol-evidence blockquote');
  const toggle=document.createElement('button');
  toggle.className='vol-link';
  const updateQuote=()=>{
    quote.textContent=originalGlyphs?study.quote:study.simpleQuote;
    toggle.textContent=originalGlyphs?'切换简体':'查看底本字形';
    toggle.setAttribute('aria-pressed',String(originalGlyphs));
  };
  toggle.onclick=()=>{originalGlyphs=!originalGlyphs;updateQuote();};
  quote.after(toggle);updateQuote();
  if(v===14){
    const soundNote=document.createElement('div');
    soundNote.className='vol-thunder';
    soundNote.innerHTML=`<strong>「其声如雷」</strong><span>听一段远处的雷声，再读夔的声音比喻。</span><audio controls preload="none" aria-label="试听远雷实地录音" src="${assetPath('audio-v2/kui.mp3')}"></audio><a href="https://freesound.org/people/Fission9/sounds/581124/" target="_blank" rel="noopener">Fission9 的实地录音 ↗</a>`;
    $('.vol-question').before(soundNote);
    const audio=soundNote.querySelector('audio')!;
    audio.volume=sound.volume;
    const pauseHidden=()=>{if(document.hidden)audio.pause();};
    document.addEventListener('visibilitychange',pauseHidden);
    const stopPlate=cleanup;
    cleanup=()=>{document.removeEventListener('visibilitychange',pauseHidden);audio.pause();audio.removeAttribute('src');audio.load();stopPlate();};
  }
  const fullText=document.createElement('button');
  fullText.className='vol-link';fullText.textContent='翻到原文这一段';
  $('.vol-evidence>a').after(fullText);
  fullText.onclick=()=>reader(v,study.passageIndex,()=>studyView(v));
  let correct=false;
  const buttons=[...dialog.querySelectorAll<HTMLButtonElement>('[data-choice]')];
  buttons.forEach((b,index)=>b.onclick=()=>{
    if(correct)return;
    if(index!==task.answer){
      b.dataset.result='retry';$('.vol-feedback').textContent='再读一遍引文。'+task.explain;return;
    }
    correct=true;
    b.dataset.result='correct';buttons.forEach(o=>o.disabled=true);
    (state.answers[v]??=[])[step]=index;save();
    $('.vol-feedback').textContent='找到了。'+task.explain;
    const next=$<HTMLButtonElement>('[data-next]');next.hidden=false;next.focus({preventScroll:true});
  });
  listen('[data-next]',()=>studyView(v));
}
function seal(v:number){
  const study=studies[v-1],next=nextVolume(v),count=seals();
  shell('我的卷印',`<section class="vol-seal-page"><div class="vol-stamp">${chapters[v-1].name.replace('经','')}<br>已访</div><p class="vol-kicker">我的卷印 · ${count} / 18</p><h2>${esc(study.place)}</h2><p>你已找齐这一站的两条线索。</p><ol class="vol-notes">${study.tasks.map(t=>`<li>${esc(t.explain)}</li>`).join('')}</ol><div class="vol-actions"><button class="vol-main" data-forward>${next?'前往'+chapters[next-1].name:'回营合卷'} →</button><button class="vol-alt" data-reader>翻阅本卷全文</button><button class="vol-link" data-hub>回十八卷目录</button></div></section>`,catalog);
  listen('[data-forward]',()=>next?chapterView(next):finale());listen('[data-reader]',()=>reader(v));listen('[data-hub]',catalog);
}
function finale(){
  if(seals()!==18){catalog();return;}
  const step=state.finale.length;
  if(step===closingCases.length){
    shell('归营手记',`<section class="vol-ending"><div class="vol-stamp">山海<br>合卷</div><p class="vol-kicker">十八卷远行 · 通关</p><h1>山海已行，手记成册。</h1><p>从丹穴山的凤皇，到九丘间的建木，你把十八卷里的发现带回了营地。</p><div class="vol-album">${chapters.map(c=>`<button data-review="${c.number}" aria-label="重看${c.name}卷印"><img src="${cover(c.number)}" alt=""><span>${c.name}</span></button>`).join('')}</div><button class="vol-main" data-hub>翻回十八卷目录 →</button></section>`,catalog);
    dialog.querySelectorAll<HTMLButtonElement>('[data-review]').forEach(b=>b.onclick=()=>seal(Number(b.dataset.review)));listen('[data-hub]',catalog);return;
  }
  const q=closingCases[step];
  shell('归营合卷',`<section class="vol-seal-page"><p class="vol-kicker">归营整理 · ${step+1} / 3</p><h2>这条记录属于哪一站？</h2><p>${q.clue}</p><div class="vol-final-choices">${q.candidates.map((v,i)=>`<button data-last="${i}"><img src="${cover(v)}" alt=""><strong>${esc(studies[v-1].place)}</strong><small>${chapters[v-1].name}</small></button>`).join('')}</div><p role="status" class="vol-feedback"></p></section>`,catalog);
  dialog.querySelectorAll<HTMLButtonElement>('[data-last]').forEach(b=>b.onclick=()=>{
    const answer=Number(b.dataset.last);
    if(answer!==finalKey[step]){$('.vol-feedback').textContent='这条线索还没有归位，看看其他两站。';return;}
    state.finale[step]=answer;save();finale();
  });
}
dialog.addEventListener('keydown',e=>{if(e.key!=='Escape')e.stopPropagation();});
dialog.addEventListener('cancel',e=>{e.preventDefault();dialog.close();});
dialog.addEventListener('close',()=>{if(dialog.open)return;cleanup();cleanup=()=>{};dialog.replaceChildren();document.dispatchEvent(new Event('campaignclose'));if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
export function openCampaign(volume?:number,passage?:number,sentence?:number){
  if(!dialog.open){returnFocus=document.activeElement as HTMLElement;dialog.showModal();sound.stopCall();document.dispatchEvent(new Event('campaignopen'));}
  if(volume&&validVolume(volume)){if(passage!==undefined)reader(volume,passage,()=>chapterView(volume),sentence);else chapterView(volume);}
  else catalog();
}
export function openJingwei(site='bird'){
  if(!dialog.open)openCampaign();
  shell('山野考察','<div class="inquiry-host"></div>',catalog);
  cleanup=mountInquiries($('.inquiry-host'),site,openFlight,()=>{
    if(!state.arrived.includes(3))state.arrived.push(3);
    state.current=3;save();studyView(3);
  });
}
export function openFlight(){
  if(!dialog.open)openCampaign();
  state.current=3;save();
  shell('北山经 · 飞行挑战','<div class="jw-host"></div>',()=>openJingwei());
  cleanup=mountFlight($('.jw-host'),()=>{
    if(!state.arrived.includes(3))state.arrived.push(3);
    state.current=3;save();openJingwei('routes');
  });
}
export function openSouthStop(index:number){
  if(!southRoute[index]||southRoute[index].open)return;
  if(!dialog.open){returnFocus=document.activeElement as HTMLElement;dialog.showModal();sound.stopCall();document.dispatchEvent(new Event('campaignopen'));}
  southStop(index);
}
