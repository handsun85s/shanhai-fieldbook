import './playground.css';
import {assetPath} from './assets';
import {readSave,writeSave} from './storage.mjs';

const styles=[
  {id:'animation',number:'01',name:'清新动画',en:'ANIMATED WILDERNESS',line:'走进一部可以探索的动画。',texture:'明亮色块 · 手绘光影',interface:'轻盈圆角 · 清晰留白',feeling:'开阔、灵动，有冒险的期待',colors:['#266c54','#e4aa43','#80c4d6','#ef6e36']},
  {id:'pixel',number:'02',name:'复古像素',en:'PIXEL EXPEDITION',line:'把山海奇遇，装进像素世界。',texture:'方块颗粒 · 浓郁暮色',interface:'像素边框 · 游戏面板',feeling:'探索感强，像一场经典 RPG',colors:['#222744','#6c82aa','#d183a1','#f7bb57']},
  {id:'clay',number:'03',name:'黏土微缩',en:'LITTLE CLAY WORLD',line:'一座仿佛能捧在手心里的山。',texture:'手塑材质 · 微缩景深',interface:'柔软圆角 · 立体按钮',feeling:'温暖、亲近，像逛一座微缩乐园',colors:['#60786c','#ecba8e','#e0d3ad','#d77855']},
  {id:'paper',number:'04',name:'立体剪纸',en:'PAPER MOUNTAINS',line:'展开纸上山河，走入层层奇境。',texture:'层叠纸艺 · 朱红靛蓝',interface:'纸签叠层 · 错位投影',feeling:'鲜明、戏剧化，有民间艺术的趣味',colors:['#b84432','#163b53','#e9c784','#509eaa']},
] as const;
type Style=typeof styles[number];
const points=[
  {id:'water',name:'怪水',x:31,y:65,icon:'≈'},
  {id:'lushu',name:'鹿蜀',x:66,y:68,icon:'✧'},
  {id:'stone',name:'山石',x:15,y:82,icon:'◇'},
];
const validStyle=(id:string|null)=>styles.find(s=>s.id===id)??styles[0];
let selected:Style=validStyle(new URL(location.href).searchParams.get('style'));
let choice=readSave('shanhai-style-choice-v1').raw;
try {choice=JSON.parse(choice??'null');} catch {choice=null;}
if(!styles.some(s=>s.id===choice))choice=null;
const records=new Set<string>();
let player={x:39,y:84},target:{x:number;y:number;point?:string}|null=null;
let last=0,playing=false,soundGeneration=0;
const keys=new Set<string>();
const audio=new Audio(assetPath('audio-v2/lushu.mp3'));
audio.preload='none';audio.volume=.45;
const root=document.querySelector<HTMLElement>('#style-lab')!;
root.innerHTML=`<header class="lab-header"><a class="lab-brand" href="./"><span class="brand-icon">山</span><span>山海行记<small>视觉风格实验室</small></span></a><span class="edition">ART DIRECTION / 2026</span><a class="return-game" href="./">返回正式游戏 ↗</a></header>
<main class="lab-main"><section class="lab-intro"><div><p class="kicker">同一座山 · 四种视觉方向</p><h1>你想走进，<em>哪一种山海？</em></h1><p class="intro-copy">切换画风，走一小段路，再选一个让你想继续探索的世界。</p></div><button class="overview-button">四款并排看 <span>▦</span></button></section>
<nav class="style-switch" aria-label="选择试玩风格">${styles.map(s=>`<button data-style="${s.id}" aria-pressed="false"><img src="${assetPath(`style-lab/${s.id}.png`)}" alt="" loading="lazy"/><span><small>${s.number} /</small><strong>${s.name}</strong></span><span class="style-check" aria-hidden="true">↗</span></button>`).join('')}</nav>
<section class="playground" aria-label="风格试玩场景"><div class="scene-bar"><span class="scene-title"><b>南山经 · 杻阳山</b><span class="live-dot"></span><small>可互动试玩</small></span><div><button id="restart-walk">回到起点</button><button id="open-notes">手记 <span id="note-count">0 / 3</span></button></div></div>
<div class="scene" tabindex="0" aria-label="试玩地图：点击地面移动，点击观察标记或使用方向键移动"><img class="landscape" alt=""/><div class="scene-shade"></div><div class="art-loading" role="status" hidden>正在展开新的山海…</div><div class="walk-quest"><small>今日小小考察</small><strong>寻找白首赤尾的身影</strong><span>点光标走近，读一条原文。</span><div class="quest-dots"><i></i><i></i><i></i></div></div>
<section class="lab-minimap" aria-label="试玩小地图"><div><b>此刻 · 杻阳山</b><span>全景</span></div><svg viewBox="0 0 100 56" role="img" aria-label="红点是人物当前位置"><path d="M0 0H100V56H0Z" fill="var(--map-land)"/><path d="M100 10Q75 22 50 28T0 45" stroke="var(--map-water)" stroke-width="5" fill="none"/>${points.map(p=>`<circle cx="${p.x}" cy="${p.y*.56}" r="1.7" fill="var(--accent)"/>`).join('')}<circle class="mini-person" r="2.8" fill="#e1563f" stroke="white" stroke-width="1.2"/></svg><p>● <span id="nearby">溪边小径</span></p></section>
<div class="world-points">${points.map(p=>`<button class="world-point" data-point="${p.id}" style="left:${p.x}%;top:${p.y}%" aria-label="走近并观察${p.name}"><span>${p.icon}</span><b>${p.name}</b></button>`).join('')}</div>
<div class="traveler" aria-hidden="true"><span class="traveler-tag">你</span><svg viewBox="0 0 38 54"><ellipse cx="19" cy="49" rx="16" ry="4" fill="#183e3c55"/><path d="M15 35L12 48M23 35L26 48" stroke="#24372e" stroke-width="5" stroke-linecap="round"/><path d="M11 25Q19 19 27 25L29 38H9Z" fill="var(--coat)" stroke="var(--ink)" stroke-width="2"/><circle cx="19" cy="17" r="7" fill="#edbf8f"/><path d="M5 14L18 4 32 14Q18 21 5 14Z" fill="var(--hat)" stroke="var(--ink)" stroke-width="2"/><path d="M28 27L33 47" stroke="#805435" stroke-width="2"/></svg></div>
<div class="destination" hidden></div><div class="scene-caption">点击地面漫游 · 点击光标观察</div></div>
<div class="scene-footer"><div><span class="style-number"></span><div><small class="style-en"></small><h2 class="style-name"></h2></div></div><p class="style-line"></p><div class="swatches" aria-label="风格配色"></div></div></section>
<section class="style-detail"><div><small>01 / 画面质感</small><p id="detail-texture"></p></div><div><small>02 / 界面语言</small><p id="detail-interface"></p></div><div><small>03 / 探险感受</small><p id="detail-feeling"></p></div><button id="choose-style">选这个方向 <span>↗</span></button></section>
<p id="choice-status" class="choice-status" role="status"></p><footer class="lab-foot"><span>这是风格与轻交互样片，正式游戏会在选定后调整。</span><span>场景、兽首山峰、花草与动作均为美术演绎；知识卡片另列原文依据。</span></footer></main>
<dialog class="observation" aria-label="观察卡片"></dialog><dialog class="overview" aria-label="四种风格对比"><div class="dialog-heading"><div><p class="kicker">同一个场景，放在一起看</p><h2>四种山海，各有想象。</h2></div><button aria-label="关闭风格对比">×</button></div><div class="overview-grid">${styles.map(s=>`<button data-compare="${s.id}"><img src="${assetPath(`style-lab/${s.id}.png`)}" alt="${s.name}场景" loading="lazy"/><span><b>${s.number}　${s.name}</b><small>进入试玩 ↗</small></span></button>`).join('')}</div></dialog>`;

const $=<T extends HTMLElement=HTMLElement>(s:string)=>root.querySelector<T>(s)!;
const scene=$('.scene'),traveler=$('.traveler'),dest=$('.destination'),card=$<HTMLDialogElement>('.observation'),overview=$<HTMLDialogElement>('.overview');
const landscape=$<HTMLImageElement>('.landscape');
function stopSound(){soundGeneration++;audio.pause();audio.currentTime=0;playing=false;}
function applyStyle(style:Style,changeURL=true){
  selected=style;target=null;keys.clear();stopSound();
  document.body.dataset.style=style.id;
  if(changeURL){const url=new URL(location.href);url.searchParams.set('style',style.id);history.replaceState(null,'',url);}
  document.title=`${style.name} · 山海行记风格试玩`;
  root.querySelectorAll<HTMLButtonElement>('[data-style]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.style===style.id)));
  $('.art-loading').hidden=false;
  landscape.onload=()=>{$('.art-loading').hidden=true;};
  landscape.onerror=()=>{$('.art-loading').textContent='场景暂未加载，请检查网络后刷新。';};
  landscape.alt=`${style.name}演绎的杻阳山：溪流、山石和白首虎纹赤尾的鹿蜀`;
  landscape.src=assetPath(`style-lab/${style.id}.png`);
  if(landscape.complete&&landscape.naturalWidth)$('.art-loading').hidden=true;
  $('.style-number').textContent=style.number;
  $('.style-en').textContent=style.en;$('.style-name').textContent=style.name;$('.style-line').textContent=style.line;
  $('#detail-texture').textContent=style.texture;$('#detail-interface').textContent=style.interface;$('#detail-feeling').textContent=style.feeling;
  $('.swatches').innerHTML=style.colors.map(c=>`<i style="background:${c}"></i>`).join('');
  updateChoice();updatePlayer();
}
function updateChoice(){
  const chosen=styles.find(s=>s.id===choice);
  $('#choose-style').innerHTML=choice===selected.id?'已选这个方向 <span>✓</span>':'选这个方向 <span>↗</span>';
  $('#choose-style').setAttribute('aria-pressed',String(choice===selected.id));
  $('#choice-status').textContent=chosen?`你选了 ${chosen.number} · ${chosen.name}。可以继续比较，也可以把编号告诉我；正式游戏尚未改变。`:'四款的原文与观察点相同。先感受场景，再看卡片和界面是否合你心意。';
}
function updatePlayer(){
  traveler.style.left=`${player.x}%`;traveler.style.top=`${player.y}%`;
  root.querySelector('.mini-person')!.setAttribute('cx',String(player.x));root.querySelector('.mini-person')!.setAttribute('cy',String(player.y*.56));
  const near=points.find(p=>Math.hypot(p.x-player.x,(p.y-player.y)*.56)<7);
  $('#nearby').textContent=near?`${near.name}附近`:'溪边小径';
  dest.hidden=!target;if(target){dest.style.left=`${target.x}%`;dest.style.top=`${target.y}%`;}
}
function refreshNotes(){
  $('#note-count').textContent=`${records.size} / 3`;
  root.querySelectorAll<HTMLElement>('.quest-dots i').forEach((e,i)=>e.classList.toggle('done',i<records.size));
  root.querySelectorAll<HTMLElement>('[data-point]').forEach(e=>e.classList.toggle('recorded',records.has(e.dataset.point!)));
}
const content:Record<string,{title:string;quote:string;text:string;note:string}>={
  lushu:{title:'鹿蜀 · 白首，虎纹，赤尾',quote:'其状如马而白首，其文如虎而赤尾，其音如谣。',text:'把四个特征放在一起看：像马的身体、白色的头、老虎般的纹路，以及红色的尾巴。“如谣”在注文中解释为像人的歌声。',note:'鹿蜀的体态和配色依据这段描述；具体姿态、鬃毛与场景由美术演绎。声音使用真人哼唱录音作为比喻参照。'},
  water:{title:'怪水 · 向东流去',quote:'怪水出焉，而东流注于宪翼之水。',text:'杻阳山的怪水向东，流入宪翼之水。每座山的水流方向需要分别读原文，不能沿用招摇山“西流入海”的答案。',note:'画中溪流与小地图用于风格试玩，弯曲形状和画面透视不表示古籍方位。原文记录的方向为东。'},
  stone:{title:'山中物产 · 赤金与白金',quote:'其阳多赤金，其阴多白金。',text:'杻阳山的正文分别记录山阳与山阴的物产。先留意这两个方位词，不凭石头颜色判断矿物是什么。',note:'画中的山石只作场景示意。具体岩形、孔洞和颜色属于创作，并非古籍图像，也不是现实矿物鉴定依据。'},
};
function showObservation(id:string){
  const entry=content[id];if(!entry)return;
  target=null;keys.clear();stopSound();
  card.innerHTML=`<div class="dialog-heading"><span class="kicker">${selected.number} / ${selected.name} · 山海手记</span><button aria-label="关闭观察卡片">×</button></div>${id==='lushu'?`<div class="creature-portrait" role="img" aria-label="${selected.name}鹿蜀细节" style="background-image:url('${assetPath(`style-lab/${selected.id}.png`)}')"></div>`:''}<div class="card-copy"><small>南山经 · 杻阳山</small><h2>${entry.title}</h2><blockquote>${entry.quote}</blockquote><p>${entry.text}</p>${id==='lushu'?'<div class="card-actions"><button id="look-detail" aria-pressed="false">放大看细节 ＋</button><button id="play-call">听“其音如谣” ♪</button></div><p class="audio-feedback" role="status"></p>':''}<p class="interpretation">${entry.note}</p><div class="card-links"><a href="https://zh.wikisource.org/zh-hans/山海經/南山經" target="_blank" rel="noopener">查阅原文 ↗</a>${id==='lushu'?`<a href="${assetPath('audio-v2/LICENSES.md')}" target="_blank" rel="noopener">录音来源 ↗</a>`:''}</div><button class="record-button">${records.has(id)?'已记入手记 · 继续探索 ✓':'记入手记 →'}</button></div>`;
  card.querySelector<HTMLButtonElement>('[aria-label="关闭观察卡片"]')!.onclick=()=>card.close();
  card.querySelector<HTMLButtonElement>('.record-button')!.onclick=()=>{records.add(id);refreshNotes();card.close();};
  card.querySelector<HTMLButtonElement>('#look-detail')?.addEventListener('click',e=>{const portrait=card.querySelector('.creature-portrait')!;const zoomed=portrait.classList.toggle('zoomed');const button=e.currentTarget as HTMLButtonElement;button.setAttribute('aria-pressed',String(zoomed));button.textContent=zoomed?'回到全身 −':'放大看细节 ＋';});
  const play=card.querySelector<HTMLButtonElement>('#play-call');
  if(play)play.onclick=async()=>{
    const feedback=card.querySelector<HTMLElement>('.audio-feedback')!;
    if(playing){stopSound();play.textContent='听“其音如谣” ♪';feedback.textContent='已停止。';return;}
    playing=true;const generation=++soundGeneration;play.textContent='停止声音 ■';feedback.textContent='正在加载真人哼唱示例…';
    try{await audio.play();if(generation!==soundGeneration){if(!playing)audio.pause();return;}feedback.textContent='正在播放 · 真人哼唱，不是神兽实录。';}
    catch{if(generation===soundGeneration){playing=false;play.textContent='重试声音 ♪';feedback.textContent='声音暂未播放，可点击重试或阅读文字。';}}
  };
  card.showModal();
}
audio.onended=()=>{playing=false;const b=card.querySelector('#play-call');if(b)b.textContent='听“其音如谣” ♪';const feedback=card.querySelector('.audio-feedback');if(feedback)feedback.textContent='播放结束，可以再次试听。';};
card.addEventListener('close',()=>{stopSound();keys.clear();});
root.querySelectorAll<HTMLButtonElement>('[data-style]').forEach(b=>b.onclick=()=>applyStyle(validStyle(b.dataset.style!)));
root.querySelectorAll<HTMLButtonElement>('[data-point]').forEach(b=>b.onclick=()=>{const p=points.find(p=>p.id===b.dataset.point)!;target={x:p.x,y:p.y+4,point:p.id};scene.focus({preventScroll:true});});
scene.addEventListener('click',e=>{if((e.target as Element).closest('button,.walk-quest,.lab-minimap'))return;const r=scene.getBoundingClientRect();target={x:Math.max(6,Math.min(94,(e.clientX-r.left)/r.width*100)),y:Math.max(48,Math.min(94,(e.clientY-r.top)/r.height*100))};scene.focus({preventScroll:true});});
scene.addEventListener('keydown',e=>{if(card.open||overview.open||e.target!==scene)return;const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key)){e.preventDefault();keys.add(key);target=null;}});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();target=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();target=null;stopSound();const b=card.querySelector('#play-call');if(b)b.textContent='听“其音如谣” ♪';}});
$('#restart-walk').onclick=()=>{player={x:39,y:84};target=null;updatePlayer();};
$('#open-notes').onclick=()=>{stopSound();target=null;keys.clear();card.innerHTML=`<div class="dialog-heading"><h2>这段山行的手记</h2><button aria-label="关闭观察卡片">×</button></div><div class="card-copy"><p>切换风格时保留本次记录，方便用同样的内容比较画面。</p>${points.map(p=>`<button class="note-entry" data-note="${p.id}"><span>${records.has(p.id)?'✓':'○'} ${p.name}</span><small>${records.has(p.id)?'重温记录 ↗':'查看线索 ↗'}</small></button>`).join('')}</div>`;card.querySelector<HTMLButtonElement>('[aria-label="关闭观察卡片"]')!.onclick=()=>card.close();card.querySelectorAll<HTMLButtonElement>('[data-note]').forEach(b=>b.onclick=()=>{const id=b.dataset.note!;card.close();showObservation(id);});card.showModal();};
$('.overview-button').onclick=()=>{target=null;keys.clear();stopSound();overview.showModal();};
overview.querySelector<HTMLButtonElement>('[aria-label="关闭风格对比"]')!.onclick=()=>overview.close();
overview.querySelectorAll<HTMLButtonElement>('[data-compare]').forEach(b=>b.onclick=()=>{overview.close();applyStyle(validStyle(b.dataset.compare!));});
$('#choose-style').onclick=()=>{choice=selected.id;const saved=writeSave('shanhai-style-choice-v1',choice);updateChoice();if(!saved)$('#choice-status').textContent=`本次选了 ${selected.number} · ${selected.name}，但浏览器无法保存。请记下编号告诉我。`;};
window.addEventListener('popstate',()=>applyStyle(validStyle(new URL(location.href).searchParams.get('style')),false));
function tick(time:number){
  const dt=Math.min(.05,(time-last)/1000||0);last=time;
  if(!card.open&&!overview.open&&!document.hidden){
    let dx=Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a'));
    let dy=Number(keys.has('arrowdown')||keys.has('s'))-Number(keys.has('arrowup')||keys.has('w'));
    if(target){dx=target.x-player.x;dy=(target.y-player.y)*.56;const length=Math.hypot(dx,dy);if(length<.8){const id=target.point;target=null;if(id)showObservation(id);dx=dy=0;}}
    const length=Math.hypot(dx,dy);if(length){player.x=Math.max(6,Math.min(94,player.x+dx/length*dt*20));player.y=Math.max(48,Math.min(94,player.y+dy/length*dt*20/.56));}
    traveler.classList.toggle('walking',length>0);updatePlayer();
  }
  requestAnimationFrame(tick);
}
applyStyle(selected,false);refreshNotes();requestAnimationFrame(tick);
