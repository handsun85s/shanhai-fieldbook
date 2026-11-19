import {inquiries, matchesProof, restoreInquiries} from './field-inquiries.mjs';
import {assetPath} from './assets';
import {escapeHTML as esc} from './notebook.mjs';
import {readSave,writeSave} from './storage.mjs';
import {loadVolume} from './book-reader';
import {mountSentences} from './sentence-reader';
import {sentences} from './sentence-lessons.mjs';
import './inquiries.css';

const key='shanhai-field-inquiries-v1';
const bookNames:Record<number,string>={1:'南山经',3:'北山经',5:'中山经'};
type Site=typeof inquiries[number];
type Page='site'|'transfer'|'journal';
const extra:Record<string,[string,string,string,string]>={
  bird:['同一个“首”，怎么会有两个意思？','“文首”写鸟的头；“南山经之首”写一列山的开头。试把“头部”和“开头”互换，看哪一句说不通。','对读招摇山第一句','journey.html?volume=1&passage=1'],
  routes:['向东流，就一定流进东海吗？','同在《北山经》，少山的清漳之水向东流入浊漳之水。一条河可以先汇入另一条河。制图时，箭头方向和汇入地点要分别标。','对读少山水系','journey.html?volume=3&passage=66'],
  plants:['“华”写的是花，“实”写的是果','招摇山的“青华”把颜色给了花。青要山的“黄华赤实”却连写两种颜色、两个部位。读植物图签时，可分别记录茎、花、果。','对读青要山的荀草','journey.html?volume=5&passage=28'],
  slopes:['为什么叫山阳和山阴？','在中国传统地理用语里，山的南坡一般称阳，北坡一般称阴。古人把日照经验带进了方位词。标坡向时，应先定南北，再读物产。','香港教育局《阴与阳》','https://www.edb.gov.hk/attachment/tc/curriculum-development/kla/pshe/references-and-resources/chinese-history/exploring_chinese_historical_figures_in_short_stories/Article_T1.pdf']
};
export function mountInquiries(host:HTMLElement,first:string,onFlight:()=>void,onStudy:()=>void){
  let site=inquiries.find(s=>s.id===first)??inquiries[0];
  let page:Page='site',state=restoreInquiries(readSave(key).raw), writable=true;
  let pin=0, picks:number[]=[], version=0;
  const abort=new AbortController();
  const q=<T extends HTMLElement=HTMLElement>(s:string)=>host.querySelector<T>(s)!;
  const bind=(s:string,fn:(b:HTMLButtonElement)=>void)=>host.querySelectorAll<HTMLButtonElement>(s).forEach(b=>b.onclick=()=>fn(b));
  const record=()=>state[site.id], recorded=(s:Site)=>state[s.id].labels.filter(n=>n!==null).length;
  const total=()=>inquiries.filter(s=>state[s.id].proof.length).length;
  const ref=(s:{volume:number,passage:number})=>bookNames[s.volume]+' · 第 '+s.passage+' 段';
  function save(){
    const other=restoreInquiries(readSave(key).raw);
    for(const s of inquiries){
      const here=state[s.id],there=other[s.id];
      here.labels=here.labels.map((n,i)=>n??there.labels[i]);
      if(there.proof.length)here.proof=there.proof;
    }
    writable=writeSave(key,state);
  }
  function visit(s:Site){site=s;page='site';pin=Math.max(0,record().labels.findIndex(n=>n===null));picks=[];render();}
  function pinButton(i:number){
    const p=site.points[i],known=record().labels[i]!==null;
    return `<button class="iq-pin pin-${i}" data-pin="${i}" aria-pressed="${i===pin}"><i>${known?'✓':i+1}</i>${esc(p.label)}</button>`;
  }
  function figure(){
    const pins=site.points.map((_,i)=>pinButton(i));
    let art='';
    if(site.id==='bird')art=`<div class="iq-bird"><img src="${assetPath(site.art)}" alt="鸟的头顶有卷纹，浅色嘴衔着树枝，红脚抓住岩石">${pins.join('')}</div>`;
    if(site.id==='plants')art=`<div class="iq-pair">${['zhuyu','migu'].map((n,i)=>`<div><img src="${assetPath('art-clay-v1/'+n+'.webp')}" alt="${i?'迷谷树':'祝余草'}的黏土标本">${pins[i]}</div>`).join('')}</div><div class="iq-lower">${pins[2]}</div>`;
    if(site.id==='slopes')art=`<div class="iq-slope"><b>北 ↑</b><div>${pins[0]}<em>${record().labels[0]===null?'待放置': '白金'}</em></div><strong>杻阳山脊</strong><div>${pins[1]}<em>${record().labels[1]===null?'待放置':'赤金'}</em></div><b>南 ↓</b></div><div class="iq-lower">${pins[2]}</div>`;
    if(site.id==='routes')art=`<div class="iq-water"><h3>精卫衔木石</h3><div class="iq-line"><span>${pins[0]}<b>${record().labels[0]===null?'取材地待定':'西山'}</b></span><i>→</i><span>${pins[1]}<b>${record().labels[1]===null?'目的地待定':'东海'}</b></span></div><h3>漳水</h3><div class="iq-line"><span><b>发鸠山</b><small>发源地</small></span><i>→</i><span>${pins[2]}<b>${record().labels[2]===null?'流向待定':'向东入河'}</b></span></div></div>`;
    return `<figure class="iq-figure">${art}<figcaption>${esc(site.caption)}</figcaption></figure>`;
  }
  function panel(){
    const p=site.points[pin],known=record().labels[pin]!==null;
    return `<article class="iq-panel"><small>现场图注 · ${pin+1} / 3</small><h2>${esc(p.ask)}</h2>
      <blockquote>${esc(p.quote)}${site.id==='routes'&&pin===0?' …… 常衔西山之木石，以堙于东海。':''}</blockquote>
      <button class="vol-link" data-read-line>拆开这句读 →</button><div class="iq-options">${p.options.map((v:string,i:number)=>`<button data-label="${i}" ${known?'disabled':''} class="${known&&i===p.answer?'right':''}">${esc(v)}</button>`).join('')}</div>
      <p class="iq-feedback" role="status">${known?esc(p.reason):''}</p>
      ${known?`<button class="vol-main" data-advance>${recorded(site)===3?'换一处验证 →':'去看下一处 →'}</button>`:''}</article>`;
  }
  function transfer(){
    const t=site.transfer,done=record().proof.length>0;
    return `<article class="iq-transfer"><small>${esc(t.place)} · 新材料</small><h2>${esc(t.claim)}</h2>
    <div class="iq-evidence">${t.pieces.map((v,i)=>`<button data-piece="${i}" aria-pressed="${(done?t.key:picks).includes(i)}" ${done?'disabled':''}>${esc(v)}</button>`).join('')}</div>
    <p class="iq-feedback" role="status">${done?esc(t.why):'任选两条证据，可点回取消。'}</p>
    ${done?'<button class="vol-main" data-journal>翻开我的考察手记 →</button>':'<button class="vol-main" data-check disabled>用这两条作证</button>'}</article>`;
  }
  function journal(){
    return `<article class="iq-notes"><h2>我的考察手记</h2><p>已完成 ${total()} / 4 项异地验证。</p>${inquiries.map(s=>`<section><h3>${esc(s.title)} <small>${recorded(s)} / 3</small></h3>${s.points.map((p,i)=>state[s.id].labels[i]!==null?`<p><b>${esc(p.label)}</b>　${esc(p.options[p.answer])}<br><q>${esc(p.quote)}</q></p>`:'').join('')}${state[s.id].proof.length?`<p><b>异地验证 · ${esc(s.transfer.place)}</b><br>${esc(s.transfer.why)}</p>`:''}<button data-visit="${s.id}" class="vol-alt">${recorded(s)?'回看现场':'去考察'} →</button></section>`).join('')}</article>`;
  }
  function render(){
    const token=++version;
    const transferMode=page==='transfer',s=transferMode?site.transfer.source:site.source, ext=extra[site.id];
    host.innerHTML=`<section class="iq"><header><div><p class="vol-kicker">山海行记 · 山野考察</p><h1>${page==='journal'?'山野手记':esc(site.title)}</h1></div><button class="vol-alt" data-journal>我的手记 · ${total()}/4</button></header>
      <nav aria-label="选择考察地点">${inquiries.map(x=>`<button data-visit="${x.id}" aria-pressed="${page!=='journal'&&x===site}"><small>${esc(x.place)}</small><strong>${esc(x.kind)}</strong></button>`).join('')}</nav>
      ${page==='journal'?journal():`<p class="iq-lead">${esc(site.visit)}</p><div class="iq-work">${figure()}${transferMode?transfer():panel()}</div>
      <details class="iq-reading"><summary>逐句读古文 · ${ref(s)}</summary><div class="iq-readhost"></div></details>
      <details class="iq-extra"><summary>字词手册与拓展 · ${esc(ext[0])}</summary><p>${esc(site.glossary)}</p><h3>${esc(ext[0])}</h3><p>${esc(ext[1])}</p><a href="${ext[3]}" target="_blank" rel="noopener">${esc(ext[2])} ↗</a></details>
      <div class="iq-foot"><span>${ref(s)} · 经文据中文维基文库</span>${site.id==='bird'||site.id==='routes'?'<button class="vol-link" data-flight>体验精卫飞行 →</button>':''}</div>`}
      ${writable?'':'<p role="status">浏览器未能保存，本次考察可继续。</p>'}</section>`;
    bind('[data-visit]',b=>visit(inquiries.find(x=>x.id===b.dataset.visit)!));
    bind('[data-journal]',()=>{page='journal';render();});
    bind('[data-pin]',b=>{pin=Number(b.dataset.pin);page='site';render();q('.iq-panel h2').setAttribute('tabindex','-1');q('.iq-panel h2').focus({preventScroll:false});});
    bind('[data-flight]',onFlight);
    if((site.id==='routes'||site.id==='bird')&&record().proof.length&&page!=='journal'){
      const button=document.createElement('button');button.className='vol-main';button.textContent='把考察带回北山卷印 →';button.onclick=onStudy;q('.iq-foot').append(button);
    }
    bind('[data-read-line]',()=>{const d=q<HTMLDetailsElement>('.iq-reading');d.open=true;d.scrollIntoView({block:'nearest'});});
    bind('[data-advance]',()=>{const next=record().labels.findIndex(n=>n===null);if(next<0){page='transfer';picks=[];}else pin=next;render();});
    bind('[data-label]',b=>{
      const p=site.points[pin],answer=Number(b.dataset.label);
      if(answer!==p.answer){b.classList.add('retry');q('.iq-feedback').textContent=p.hint;return;}
      record().labels[pin]=answer;save();render();q('[data-advance]').focus({preventScroll:true});
    });
    bind('[data-piece]',b=>{
      const i=Number(b.dataset.piece);
      if(picks.includes(i))picks=picks.filter(x=>x!==i);else if(picks.length<2)picks.push(i);else{q('.iq-feedback').textContent='已选两条，先点掉一条再换。';return;}
      b.setAttribute('aria-pressed',String(picks.includes(i)));q<HTMLButtonElement>('[data-check]').disabled=picks.length!==2;
      q('.iq-feedback').textContent='已选 '+picks.length+' / 2 条证据。';
    });
    bind('[data-check]',()=>{
      if(!matchesProof(picks,site.transfer.key)){q('.iq-feedback').textContent=site.transfer.hint;return;}
      record().proof=[...picks];save();render();q('.iq-transfer [data-journal]').focus({preventScroll:true});
    });
    const reading=q<HTMLDetailsElement>('.iq-reading');
    if(reading)reading.ontoggle=async()=>{
      if(!reading.open||q('.iq-readhost').childElementCount)return;
      const box=q('.iq-readhost');box.textContent='正在翻到原文……';
      try{
        const book=await loadVolume(s.volume,abort.signal);
        if(abort.signal.aborted||version!==token)return;
        const match=transferMode?site.transfer.pieces[site.transfer.key[0]]:site.points[pin].quote.split('，')[0];
        const at=sentences(book.simplified[s.passage-1]).findIndex(line=>line.includes(match.replace(/。$/u,'')));
        mountSentences(box,book,s.volume,s.passage,false,Math.max(0,at));
        const a=document.createElement('a');a.href=book.source;a.target='_blank';a.rel='noopener';a.textContent='核对本卷底本 ↗';box.append(a);
      }catch{if(!abort.signal.aborted&&version===token)box.textContent='原文载入失败。收起后再展开可重试。';}
    };
  }
  visit(site);return ()=>{version++;abort.abort();};
}
