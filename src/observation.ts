import {bindPassageHelp} from './passage-help';
import {animalMarkup,bindAnimals} from './animal';
import {noteText,saveNote,safeText} from './learning';
import {source} from './content';
export type EvidenceCard={id:string;name:string;image?:string;animalId?:string;quote:string;text:string;question:string;options:string[];answer:number;caption:string};
export function mountObservation(host:HTMLElement,p:EvidenceCard,chapter:string,known:boolean,record:()=>void,close:()=>void){
 let inspected=known,level=0,recorded=known;
 const animal=animalMarkup(p.animalId??p.id),water=['river','east','south'].includes(p.id);
 host.innerHTML=`<button class="exp-close" aria-label="关闭观察">×</button><small>山中考察 · <span class="evidence-step">${known?'已记录':'1 观察'}</span></small><h2>${p.name}</h2>${animal|| (water?`<div class="water-study" aria-label="上北下南，水流向${p.id==='river'?'西':p.id==='south'?'南':'东'}"><span>北</span><strong>${p.id==='river'?'←':p.id==='south'?'↓':'→'}</strong><small>观察水流的方向 · 上北下南</small></div>`:`<div class="plant-study"><img class="exp-specimen" src="${p.image}" alt="${p.name}美术演绎"/><button class="inspect-detail">放大细看 ↗</button></div>`)}
 <p class="inspect-status" role="status">${known?'可以重看，也可以补充自己的发现。':animal?'先点击一个身体特征或观察动作，再核对原文。':'先观察画面，再读原文：哪些是你看见的？'}</p>
 <details class="book-sentences"><summary>读懂这条线索的古文</summary><div data-help-body></div></details>
 <button class="evidence-next primary" ${!inspected&&animal?'disabled':''}>${known?'重看原文与笔记':'继续：对照原文 →'}</button>
 <section class="evidence-source" hidden><small>2 原文与判断</small><blockquote>${p.quote}</blockquote><p>${p.text}</p><div class="exp-quiz">${known?'<p>✓ 这条依据已经记录。</p>':`<h3>${p.question}</h3>${p.options.map((v,i)=>`<button data-answer="${i}">${v}</button>`).join('')}`}</div><button class="evidence-hint" ${known?'hidden':''}>给我一点提示</button><p class="exp-feedback" role="status"></p><div class="evidence-match" hidden></div></section>
 <section class="personal-note" ${known?'':'hidden'}><label>3 用自己的话记一句 <small>可选 · 最多 160 字</small><textarea maxlength="160" rows="3" placeholder="我看到了……，原文写的是……"></textarea></label><button class="save-note">保存我的发现</button><p class="note-feedback" role="status"></p></section>
 <p class="exp-foot">${p.caption}</p><a href="${source}" target="_blank" rel="noopener">查阅《南山经》原文 ↗</a>`;
 const $=<T extends HTMLElement>(s:string)=>host.querySelector<T>(s)!;
 const sites:Record<string,number>={zhaoyao:1,tangting:2,niuyang:4,qingqiu:8};
 const stopHelp=bindPassageHelp($<HTMLDetailsElement>('.book-sentences'),1,sites[chapter]??1,p.quote);
 $('.exp-close').onclick=close;const cleanup=bindAnimals(host);
 const observe=()=>{inspected=true;$<HTMLButtonElement>('.evidence-next').disabled=false;$('.inspect-status').textContent='已经留意到线索。现在看看原文怎样描述。';};
 host.addEventListener('field-evidence',observe);
 const detail=host.querySelector<HTMLButtonElement>('.inspect-detail');if(detail)detail.onclick=()=>{host.querySelector('.plant-study')!.classList.toggle('is-zoomed');detail.textContent=host.querySelector('.is-zoomed')?'恢复全貌 ↙':'放大细看 ↗';observe();};
 $('.evidence-next').onclick=()=>{if(animal&&!inspected)return;$('.evidence-source').hidden=false;$('.evidence-next').hidden=true;$('.evidence-step').textContent=known?'重看依据':'2 对照原文';$('.evidence-source').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});};
 const textarea=$<HTMLTextAreaElement>('.personal-note textarea');textarea.value=noteText(chapter,p.id);
 $('.save-note').onclick=()=>{$('.note-feedback').textContent=saveNote(chapter,p.id,textarea.value)?'你的发现已保存。':'暂时无法保存，请保留页面或复制这句话。';};
 $('.evidence-hint').onclick=()=>{level++;$('.exp-feedback').textContent=level===1?'把问题拆成外形、声音、方向或来源，先找它在问哪一类。':level===2?`留意原文中的「${p.quote}」。画面没有证明的细节不要加进去。`:p.text;};
 const match=()=>{const choices=[p.quote,'画面中的具体大小、颜色和姿态','这条小路和桥的位置'];const offset=p.id.length%3;const values=choices.slice(offset).concat(choices.slice(0,offset));$('.evidence-match').hidden=false;$('.exp-quiz').hidden=true;$('.evidence-match').innerHTML=`<h3>哪一条是支持你判断的原文依据？</h3>${values.map((v,i)=>`<button data-evidence-choice="${i}">${safeText(v)}</button>`).join('')}`;host.querySelectorAll<HTMLButtonElement>('[data-evidence-choice]').forEach(b=>b.onclick=()=>{if(values[Number(b.dataset.evidenceChoice)]!==p.quote){$('.exp-feedback').textContent='这项属于美术或关卡设计。再找一句书里实际写下的文字。';return;}if(!recorded){recorded=true;record();}$('.evidence-match').innerHTML='<p>✓ 观察与原文对应，已写入手记。</p>';$('.evidence-step').textContent='3 留下发现';$('.personal-note').hidden=false;$('.evidence-hint').hidden=true;$('.exp-feedback').textContent='可以补一句自己的发现，然后继续探索。';});};
 host.querySelectorAll<HTMLButtonElement>('[data-answer]').forEach(b=>b.onclick=()=>{if(Number(b.dataset.answer)===p.answer){$('.exp-feedback').textContent='判断吻合。再找出支持它的原文。';match();}else{$('.exp-feedback').textContent='还不吻合。再观察一次，或点提示找出关键字。';}});
 return()=>{stopHelp();cleanup();host.removeEventListener('field-evidence',observe);};
}
