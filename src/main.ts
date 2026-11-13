import * as Phaser from 'phaser';
import './style.css';
import {sound} from './sound';
import {openExpeditions,expeditionOpen} from './expeditions';
import {entries, spots, source, stoneEntry} from './content';
import {artSources, artDetails, specimen} from './artwork';
import {restore,record,finish,canFinish,SAVE_KEY} from './progress.mjs';

let storageOK=true;
let raw:string|null=null;
try { raw=localStorage.getItem(SAVE_KEY); } catch {storageOK=false;}
let state=restore(raw);
let modal=false, paused=false, journal=false, mapOpen=false, hintLevel=0, targetId='';
let scene:Trail;
const $=(s:string)=>document.querySelector(s) as HTMLElement;
const app=$('#app');
app.innerHTML=`
<header><a class="brand" href="#" aria-label="山海行记首页"><span class="seal">山海</span><span>山海行记<small>一山一世界，一步一发现</small></span></a><div class="chapter">山经 · 南山经 <span> / </span> 第一回 · 招摇山</div><nav><button id="atlas-btn" aria-label="探索其他山岳">山海舆图</button><div class="sound-controls"><button id="sound-btn" aria-label="开启或关闭声音">开启声音</button><label id="sound-label" for="volume-control">音量</label><input id="volume-control" type="range" min="0" max="100" value="35" aria-label="音量"/></div><button id="map-btn" aria-label="山行图">◈ <span>山行图</span></button><button id="book-btn" aria-label="我的手记">▤ <span>我的手记</span><b id="book-count">0</b></button><button id="pause-btn" aria-label="暂停与设置">Ⅱ</button></nav></header>
<main id="stage"><div id="game" aria-label="招摇山探索地图：方向键移动，E观察，也可点击地面移动" tabindex="0"></div>
<section class="quest"><div class="eyebrow">此行 · 招摇山</div><h1 id="quest-title">循水入山，识万物</h1><p id="quest-text">沿溪流走走，看看山里藏着什么。</p><div class="progress-track"><i id="progress"></i></div><div class="quest-foot"><span id="count">发现 0 / 5</span><button id="hint-btn">给我一点提示 ↗</button></div><p id="hint-text" class="hint" hidden></p></section>
<button id="guide-btn" hidden title="游戏演绎：以迷榖标记营地方向">✧ 迷榖指归</button><div class="compass" aria-label="上北下南左西右东"><span>北</span><div>西 <b>✧</b> 东</div><span>南</span></div>
<div class="location"><span class="location-dot"></span><span id="location">西海岸 · 招摇山麓</span></div>
<div id="prompt" hidden><span id="prompt-name"></span><button id="observe-btn"><kbd>E</kbd> 观察</button></div>
<div id="watch" hidden><span>保持安静，看看它怎样走路</span><div><i id="watch-bar"></i></div></div>
<div class="bottom-bar"><span><kbd>W A S D</kbd> / <kbd>↑ ↓ ← →</kbd> 移动 <em>·</em> 点击地面也能走</span><span class="save-status" id="save-status">进度保存在此设备</span></div>
<div class="touch-controls" aria-label="触控方向键"><button data-dir="up" aria-label="向上">↑</button><div><button data-dir="left" aria-label="向左">←</button><button data-dir="down" aria-label="向下">↓</button><button data-dir="right" aria-label="向右">→</button></div></div>
<div id="toast" role="status" aria-live="polite"></div>
<aside id="journal" hidden aria-label="我的山海手记"></aside><aside id="map" hidden aria-label="招摇山行图"></aside>
<div class="map-zoom" aria-label="地图缩放"><button id="zoom-out" aria-label="缩小地图">−</button><span id="zoom-level">100%</span><button id="zoom-in" aria-label="放大地图">＋</button></div><div id="loading" role="status"><span class="eyebrow">山海行记 · 绘卷将启</span><strong>正在铺开山川草木…</strong><span id="loading-progress">0%</span></div><div id="overlay" hidden></div>
</main>`;

$('#atlas-btn').onclick=()=>{scene?.stop();openExpeditions();};
function refreshSound(){$('#sound-btn').textContent=sound.enabled?'声音：开':'开启声音';$('#sound-btn').setAttribute('aria-pressed',String(sound.enabled));}
$('#sound-btn').onclick=async()=>{if(sound.enabled)sound.mute();else if(!await sound.start())toast('声音未能启动，请再次点击。');refreshSound();};
$('#volume-control').oninput=e=>sound.setVolume(Number((e.target as HTMLInputElement).value)/100);
document.addEventListener('soundchange',refreshSound);
const artDialog=document.createElement('dialog');
artDialog.className='art-detail';artDialog.setAttribute('aria-label','山海图鉴细节');document.body.append(artDialog);
artDialog.addEventListener('close',()=>scene?.stop());
function showArt(id:string){const a=artDetails[id];if(!a)return;scene?.stop();
artDialog.innerHTML=`<div class="detail-heading"><div><span class="eyebrow">山海图鉴 · 工笔淡彩</span><h2>${a.name}</h2></div><button class="detail-close" aria-label="关闭图鉴">×</button></div><div class="detail-canvas" tabindex="0" aria-label="图像查看区域，放大后可以滚动查看"><img src="${artSources[a.key]}" alt="${a.alt}"/></div><div class="detail-tools"><span>原文线索 · ${a.traits.join(' / ')}</span><div><button class="detail-minus" aria-label="缩小插图">−</button><output>100%</output><button class="detail-plus" aria-label="放大插图">＋</button></div></div><p class="detail-note"><b>依据与演绎</b>${a.interpretation} <a href="${source}" target="_blank" rel="noopener">查阅原文 ↗</a></p>`;
let zoom=1;const scale=(amount:number)=>{zoom=Phaser.Math.Clamp(zoom+amount,1,3);const img=artDialog.querySelector('img')!;img.style.width=zoom*100+'%';img.style.height=zoom*100+'%';artDialog.querySelector('output')!.textContent=Math.round(zoom*100)+'%';};
artDialog.querySelector<HTMLButtonElement>('.detail-close')!.onclick=()=>artDialog.close();
artDialog.querySelector<HTMLButtonElement>('.detail-plus')!.onclick=()=>scale(.5);
artDialog.querySelector<HTMLButtonElement>('.detail-minus')!.onclick=()=>scale(-.5);
artDialog.showModal();}
document.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-art]');if(b)showArt(b.dataset.art!);});
function persist(){if(scene){state.x=Math.round(scene.player.x);state.y=Math.round(scene.player.y);}try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}$('#save-status').textContent=storageOK?'进度已保存 · 此设备':'当前无法保存 · 请勿关闭页面';}
let toastTimer:ReturnType<typeof setTimeout>;
function toast(text:string){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3600);}
function gain(id:string){const isNew=!state.facts.includes(id);state=record(state,id);persist();updateUI();if(isNew)sound.cue();if(isNew)toast(`手记添一笔 · ${entries.find(e=>e.id===id)?.title}`);}
function updateUI(){const n=state.facts.length;$('#guide-btn').hidden=!state.facts.includes('migu');$('#count').textContent=`发现 ${n} / 5`;$('#book-count').textContent=String(n);$('#progress').style.width=`${n*20}%`;$('#quest-title').textContent=state.completed?'此山已识，余兴未尽':canFinish(state)?'循水归去，完成山行':'循水入山，识万物';$('#quest-text').textContent=state.completed?'手记已经收好。你可以继续漫步，重看每一处发现。':canFinish(state)?'回到西边的海岸营地，把今天的发现带回家。':'辨认两种草木，观察狌狌，再读懂水流的方向。'; if(journal)renderJournal();if(mapOpen)renderMap();}
let focusBefore:HTMLElement|null=null;
function openModal(html:string){focusBefore=document.activeElement as HTMLElement;modal=true;scene?.stop();$('#overlay').innerHTML=html;$('#overlay').hidden=false;$('#overlay').setAttribute('role','dialog');$('#overlay').setAttribute('aria-modal','true');$('#overlay').setAttribute('aria-label','考察对话');setTimeout(()=>$('#overlay').querySelector<HTMLButtonElement>('button')?.focus(),0);}
function closeModal(){modal=false;$('#overlay').hidden=true;$('#overlay').innerHTML='';scene?.stop();focusBefore?.focus();}
function note(id:string){const e=id==='stone'?stoneEntry:entries.find(e=>e.id===id)!;openModal(`<section class="dialog discovery"><div class="eyebrow">山海手记 · ${e.tag}</div><button class="close" aria-label="关闭">×</button>${specimen(id)}<h2>${e.title}</h2><blockquote>${e.quote}</blockquote><p>${e.text}</p><div class="annotation"><b>原文与演绎</b>${e.note}</div><button class="primary done">收好手记，继续山行 →</button></section>`);$('#overlay .close').onclick=closeModal;$('#overlay .done').onclick=closeModal;}
const questions:Record<string,{title:string,desc:string,options:string[],correct:number,feedback:string[]}>={
 zhuyu:{title:'溪边的草，会是祝余吗？',desc:'俯身看：这一丛叶子细长，花呈青色。手册上哪一条描述与它吻合？',options:['像韭菜，开青色的花','宽大的圆叶，结红色的果','黑色树纹，花光照向四方'],correct:0,feedback:['','再看看叶子：它们细长，眼前开的是花，没有红果。','这一条更像是在描述一棵树。眼前是一丛草。']},
 migu:{title:'古木为什么在发光？',desc:'走近树干，你看见一道道深黑的纹理；枝头花朵散出柔光。请给这次观察选一条依据。',options:['白色的耳朵','黑色纹理，花向四方发光','像韭菜的叶子，青色的花'],correct:1,feedback:['这是动物的特征。把注意力放回树干和花朵。','','这棵树有木质树干，并不是溪边那丛草。']},
 river:{title:'这条水，要去哪里？',desc:'看看水面：细小的白色波纹沿河向左移动。山行图上方为北。水流会把你带向哪边的海？',options:['东边 →','北边 ↑','西边 ←'],correct:2,feedback:['东在右边，和眼前的水流相反。再看一会儿白色波纹。','北在上方。观察水流整体向哪一侧汇去。','']},
 ears:{title:'树后的身影，有什么不同？',desc:'你挪到林间空处，终于看清它的头部。请把真正观察到的特征记下来。',options:['头上长角','耳朵是白色的','身后有九条尾巴'],correct:1,feedback:['头顶没有角。注意它脸侧那一对白色的部位。','','目前看到的身体没有九尾。先记录清晰可见的耳朵。']}
};
function quiz(id:string){const q=questions[id];openModal(`<section class="dialog"><div class="eyebrow">停步观察 · ${spots.find(s=>s.id===id)?.name}</div><button class="close" aria-label="关闭观察">×</button>${specimen(id)}<h2>${q.title}</h2><p>${q.desc}</p><div class="answers">${q.options.map((s,i)=>`<button data-choice="${i}"><span>${'一二三'[i]}</span>${s}</button>`).join('')}</div><p class="feedback" role="status">判断可以修改。看看哪条线索最有依据。</p></section>`);$('#overlay .close').onclick=closeModal;document.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.choice);if(n===q.correct){gain(id);note(id);}else{$('#overlay .feedback').textContent=q.feedback[n];b.classList.add('wrong');b.disabled=true;}});}
function interact(id:string){if(modal||paused||journal||mapOpen)return;if(id==='stone'){note('stone');return;}if(id==='camp'){if(state.completed){showEnding();return;}if(canFinish(state)){returnQuiz();return;}openModal(`<section class="dialog"><div class="eyebrow">西海岸 · 营地</div><h2>带着好奇心，出发吧。</h2><p>沿小路走进山里。靠近发光的小标记，按 E 或点「观察」。你会遇见两种奇妙草木，也会看见林间的狌狌。</p><p>山行图可查看位置；迷路时，可以打开提示。发现会自动写入手记。</p><button class="primary done">继续入山 →</button></section>`);$('#overlay .done').onclick=closeModal;return;}if(state.facts.includes(id)){note(id);return;}if(id==='gait'){if(!state.facts.includes('ears')){toast('先到北侧的林间空处，看清它的外形，再来观察行动。');targetId='ears';scene.markTarget();return;}scene.watching=true;scene.watchTime=0;scene.stop();toast('站在静观石旁保持不动，观察三秒。');return;}quiz(id);}
function returnQuiz(){openModal(`<section class="dialog"><div class="eyebrow">归来 · 最后一笔</div><h2>你怎样找回了海岸？</h2><p>把今天读懂的方向记进手册。招摇山的水，向哪边流入海？</p><div class="answers"><button data-return="east">向东，逆着刚才看到的水流</button><button data-return="west">向西，顺着水流走向海岸</button></div><p class="feedback" role="status">想一想观水石旁的白色波纹。</p></section>`);document.querySelectorAll<HTMLButtonElement>('[data-return]').forEach(b=>b.onclick=()=>{if(b.dataset.return==='west'){state=finish(state,'west');persist();updateUI();showEnding();}else{$('#overlay .feedback').textContent='再回想一下：水向地图左侧汇去，左侧是西。';}});}
function showEnding(){openModal(`<section class="dialog ending"><div class="eyebrow">南山经 · 第一回</div><div class="end-seal">山行<br>已记</div><h2>一座山，五次发现。</h2><p>你识出了祝余与迷榖，看清了狌狌的白耳和行动，也顺着西流的水回到了海岸。</p><div class="end-stats"><span><b>5</b>条观察记录</span><span><b>1</b>段山海旅程</span></div><p class="muted">下次读到这些文字，你会想起自己走过的山路。</p><button class="primary done">留在山中，再走走 →</button><button class="secondary read">翻开完整手记</button></section>`);$('#overlay .done').onclick=closeModal;$('#overlay .read').onclick=()=>{closeModal();toggleJournal(true);};}
function intro(){openModal(`<section class="intro"><div class="eyebrow">给每一位好奇的山海旅人 · 10+</div><div class="intro-title"><span>山海</span><span>行记<i>壹</i></span></div><div class="intro-sub">招 摇 山 · 循 水 识 万 物</div><p>古书里的一座山，正等你走进去。<br>辨一株草，观一只兽，<br>把亲眼见到的线索，写成自己的山海手记。</p><button class="primary start">${state.started?'继续我的山行':'展开山海，启程'} <span>↗</span></button><div class="intro-meta">自由探索 · 无战斗 · 轻柔环境声（可静音）</div><div class="intro-note">取材《山海经·南山经》<br>地景与互动为游戏演绎，知识可查原文。</div></section>`);$('#overlay').classList.add('intro-overlay');$('#overlay .start').onclick=()=>{void sound.start().then(refreshSound);state.started=true;persist();$('#overlay').classList.remove('intro-overlay');closeModal();$('#game').focus();};}
function renderJournal(){const el=$('#journal');el.innerHTML=`<div class="panel-top"><div><div class="eyebrow">FIELD NOTES · ${state.facts.length} / 5</div><h2>我的山海手记</h2></div><button class="close-panel" aria-label="关闭手记">×</button></div><p class="panel-intro">每一次辨认，都留下一条依据。</p><div class="journal-entries">${entries.map((e,i)=>`<article class="${state.facts.includes(e.id)?'recorded':'unseen'}"><span class="entry-num">0${i+1}</span><div><small>${e.tag}</small><h3>${state.facts.includes(e.id)?e.title:'尚待观察'}</h3>${state.facts.includes(e.id)?`${specimen(e.id,true)}<blockquote>${e.quote}</blockquote><p>${e.text}</p><details><summary>原文与游戏演绎</summary><p>${e.note}</p></details>`:'<p>走近山中，留意草木、水流与林间的身影。</p>'}</div></article>`).join('')}</div><section class="journal-extra"><div class="eyebrow">山中补记 · 随时翻阅</div><h3>山石 · 多金玉</h3>${specimen('stone',true)}<p>原文只有“多金玉”三个字。看山石的同时，也留意文字没有告诉我们的部分。</p></section><footer><a href="${source}" target="_blank" rel="noopener">查阅《南山经》原文 ↗</a><p>本作参考含注文的在线文本，手记中引文摘自正文；释义由本作重新撰写。地图比例与生物互动为演绎。</p></footer>`;el.querySelector<HTMLButtonElement>('.close-panel')!.onclick=()=>toggleJournal(false);}
function toggleJournal(value=!journal){journal=value;mapOpen=false;$('#map').hidden=true;$('#journal').hidden=!value;scene?.stop();if(value)renderJournal();$('#book-btn').setAttribute('aria-expanded',String(value));}
function renderMap(){const el=$('#map');el.innerHTML=`<div class="panel-top"><div><div class="eyebrow">招摇山 · 示意地图</div><h2>山行图</h2></div><button class="close-panel" aria-label="关闭山行图">×</button></div><p class="panel-intro">上北下南，左西右东。点击地点，标记方向。</p><div class="mini-map"><svg viewBox="0 0 2400 1500" role="img" aria-label="海在西侧，水从东侧山中流向海"><rect width="2400" height="1500" fill="#c8d1ba"/><path d="M0 0H320 Q400 500 280 1500H0Z" fill="#83aaa7"/><path d="M1940 570L1600 700 1320 900 1030 850 820 1020 500 1040 280 1100" fill="none" stroke="#83aaa7" stroke-width="55"/><text x="90" y="650">西海</text>${spots.map(s=>`<circle cx="${s.x}" cy="${s.y}" r="30" fill="${state.facts.includes(s.id)?'#476b4e':'#c37c49'}"/><text x="${s.x}" y="${s.y-65}" text-anchor="middle">${s.name}</text>`).join('')}<circle cx="${Math.round(scene?.player.x??470)}" cy="${Math.round(scene?.player.y??1120)}" r="38" fill="#e8bb69" stroke="#fff7dc" stroke-width="14"/></svg><div class="map-legend">金色圆点 · 你的位置</div></div><div class="map-destinations">${spots.map(s=>`<button data-target="${s.id}"><span>${s.icon} ${s.name}</span><span>${s.id==='camp'?'营地':state.facts.includes(s.id)?'已记录':'待观察'} ↗</span></button>`).join('')}</div><p class="muted">按原文的方向关系绘制；道路、位置与距离为游戏设计。</p>`;el.querySelector<HTMLButtonElement>('.close-panel')!.onclick=()=>{mapOpen=false;el.hidden=true;};el.querySelectorAll<HTMLButtonElement>('[data-target]').forEach(b=>b.onclick=()=>{targetId=b.dataset.target!;mapOpen=false;el.hidden=true;scene.markTarget();toast('已标记方向 · 走近后可以观察');});}
$('#book-btn').onclick=()=>{if(!modal&&!paused)toggleJournal();};
$('#map-btn').onclick=()=>{if(modal||paused)return;mapOpen=!mapOpen;journal=false;$('#journal').hidden=true;$('#map').hidden=!mapOpen;scene.stop();if(mapOpen)renderMap();};
$('#hint-btn').onclick=()=>{hintLevel++;const id=canFinish(state)?'camp':['zhuyu','river','migu','ears','gait'].find(k=>!state.facts.includes(k))!;const sp=spots.find(s=>s.id===id)!;const hints:Record<string,string>={zhuyu:'溪边有一丛青色花朵。看一看它细长的叶子。',river:'水面上的白色波纹正在移动。和右上角的方向标对照一下。',migu:'向山中走，找到发光的古木。看看树干上的纹理。',ears:'林间的身影靠近北边。绕到能看清头部的位置。',gait:'到狌狌南侧的静观石，按观察，再停步三秒。',camp:'水向西流入海。向地图左下方的海岸营地走。'};$('#hint-text').hidden=false;$('#hint-text').textContent=hints[id]+(hintLevel>1?' 已为你标记方向。':' 再点一次，可标记位置。');if(hintLevel>1){targetId=sp.id;scene.markTarget();}};
$('#observe-btn').onclick=()=>scene?.near&&interact(scene.near.id);
$('#guide-btn').onclick=()=>{if(modal||paused||journal||mapOpen)return;targetId='camp';scene.markTarget();toast('迷榖为你指向营地 · “佩之不迷”的游戏演绎');};
function pauseMenu(){if(modal)return;paused=true;scene?.stop();persist();openModal(`<section class="dialog"><div class="eyebrow">山行小憩</div><h2>歇一歇，山还在这里。</h2><p>当前进度${storageOK?'已保存在此设备。':'无法写入浏览器，请保持页面开启。'}</p><button class="primary resume">继续探索 →</button><button class="secondary motion">${reduced?'开启':'减少'}动态效果</button><button class="secondary restart">重新开始这次考察</button><p class="muted">操作：方向键 / WASD 移动，E 观察，J 手记，M 地图，Esc 暂停或关闭面板。也可以点击地面移动。</p></section>`);$('#overlay .resume').onclick=()=>{paused=false;closeModal();};$('#overlay .motion').onclick=()=>{reduced=!reduced;$('#overlay .motion').textContent=`${reduced?'开启':'减少'}动态效果`;};$('#overlay .restart').onclick=()=>{openModal(`<section class="dialog"><h2>重新写一本手记？</h2><p>这会清除当前设备上的五项发现和位置。其他内容不受影响。</p><button class="primary cancel">保留进度</button><button class="secondary reset">清除并重新出发</button></section>`);$('#overlay .cancel').onclick=()=>{paused=false;closeModal();};$('#overlay .reset').onclick=()=>{state=restore(null);state.started=true;scene.player.setPosition(470,1120);scene.stop();targetId='';hintLevel=0;$('#hint-text').hidden=true;scene.markTarget();persist();updateUI();paused=false;closeModal();};};}
$('#zoom-in').onclick=()=>scene?.zoomMap(.15);$('#zoom-out').onclick=()=>scene?.zoomMap(-.15);
$('#pause-btn').onclick=pauseMenu;$('.brand').onclick=e=>{e.preventDefault();if(!modal&&!expeditionOpen)pauseMenu();};
document.addEventListener('keydown',e=>{if(artDialog.open||expeditionOpen)return;if(e.key==='Tab'&&modal){const items=[...$('#overlay').querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')];const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}return;}if(e.key==='Escape'){if(modal){if($('#overlay').classList.contains('intro-overlay'))return;paused=false;closeModal();}else if(journal)toggleJournal(false);else if(mapOpen){mapOpen=false;$('#map').hidden=true;}else pauseMenu();return;}if(modal||paused)return;if(e.key.toLowerCase()==='j')toggleJournal();if(e.key.toLowerCase()==='m')$('#map-btn').click();if(e.key.toLowerCase()==='e'&&scene?.near)interact(scene.near.id);});
window.addEventListener('blur',()=>{scene?.stop();});document.addEventListener('visibilitychange',()=>{if(document.hidden){persist();if(!modal&&!expeditionOpen)pauseMenu();}});
let reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch={up:false,down:false,left:false,right:false};
document.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach(b=>{const d=b.dataset.dir as keyof typeof touch;b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touch[d]=true;};b.onpointerup=b.onpointercancel=()=>{touch[d]=false;};b.onlostpointercapture=()=>{touch[d]=false;};});

function makeLandscape(gameScene:Phaser.Scene){
const tex=gameScene.textures.createCanvas('land',2400,1500)!;const c=tex.context;let seed=731;
const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const poly=(pts:number[][],fill:string)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();};
c.fillStyle='#cdd5ba';c.fillRect(0,0,2400,1500);
const bg=c.createLinearGradient(0,0,1800,1500);bg.addColorStop(0,'#8da895');bg.addColorStop(.5,'#d7dbbd');bg.addColorStop(1,'#b3c5a7');c.fillStyle=bg;c.fillRect(0,0,2400,1500);
for(let layer=0;layer<3;layer++){c.beginPath();c.moveTo(270,430);for(let i=0;i<10;i++){const x=300+i*250,y=70+layer*65+rand()*65;c.bezierCurveTo(x-60,y+130,x-10,y-45,x+60,y);c.bezierCurveTo(x+130,y+15,x+160,y+125,x+250,y+70);}c.lineTo(2600,500);c.lineTo(250,500);c.closePath();const wash=c.createLinearGradient(0,70,0,500);wash.addColorStop(0,['#8caaa2','#76968b','#608276'][layer]);wash.addColorStop(1,'#b9c8ab00');c.fillStyle=wash;c.fill();}
for(let i=0;i<160;i++){const x=350+rand()*2000,y=180+rand()*250;c.strokeStyle='#375e4b13';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x-5,y+15,x-20,y+35,x-18,y+55);c.stroke();}
// Broad ink-wash slopes at the edge; the walkable clearing stays legible.
for(let i=0;i<34;i++){c.fillStyle=`rgba(69,105,78,${.02+rand()*.025})`;c.beginPath();c.ellipse(700+rand()*1900,500+rand()*1000,100+rand()*230,40+rand()*100,rand()*3,0,Math.PI*2);c.fill();}
c.beginPath();c.moveTo(0,0);c.lineTo(340,0);c.bezierCurveTo(400,400,250,550,325,850);c.bezierCurveTo(300,1100,300,1300,265,1500);c.lineTo(0,1500);c.closePath();c.fillStyle='#83aaa7';c.fill();
c.strokeStyle='#e0dec0';c.lineWidth=20;c.beginPath();c.moveTo(340,0);c.bezierCurveTo(400,400,250,550,325,850);c.bezierCurveTo(300,1100,300,1300,265,1500);c.stroke();
for(let i=0;i<46;i++){const x=rand()*240,y=rand()*1500;c.strokeStyle='#b2c9bc';c.lineWidth=1.2;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+25,y+5,x+55,y);c.stroke();}
const river=[[1940,570],[1600,700],[1320,900],[1030,850],[820,1020],[500,1040],[280,1100]];
const line=(pts:number[][],color:string,width:number)=>{const draw=pts.length>4?new Phaser.Curves.Spline(pts.map(([x,y])=>new Phaser.Math.Vector2(x,y))).getPoints(150).map(p=>[p.x,p.y]):pts;c.beginPath();draw.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();};
line(river,'#e2dfbe',69);line(river,'#79a7a2',48);line(river,'#a0c3b2',27);
line([[470,1120],[720,1210],[900,1150],[1120,990],[1230,770],[1250,540],[1480,530],[1710,620],[1930,740]],'#d4bc8d',48);
line([[470,1120],[720,1210],[900,1150],[1120,990],[1230,770],[1250,540],[1480,530],[1710,620],[1930,740]],'#e6d5ad',33);
// Stepping stones across the creek.
for(let i=0;i<5;i++){c.fillStyle=i%2?'#a7ae97':'#c4c4a8';c.beginPath();c.ellipse(1220+i*7,820+i*17,20,10,-.2,0,7);c.fill();}
function tree(x:number,y:number,scale:number){const img=gameScene.textures.get('grove').getSourceImage() as HTMLImageElement;const h=245*scale,w=h*img.width/img.height;c.globalAlpha=.85;c.drawImage(img,x-w/2,y-h+15,w,h);c.globalAlpha=1;}
const riverCurve=new Phaser.Curves.Spline(river.map(([x,y])=>new Phaser.Math.Vector2(x,y)));const bank=riverCurve.getPoints(70);
for(let i=0;i<95;i++){const x=400+rand()*1950,y=280+rand()*1120;if(spots.some(s=>Math.hypot(s.x-x,s.y-y)<160))continue;if(bank.some(p=>Math.hypot(p.x-x,p.y-(y-80))<130))continue;if(y>950&&x<1150)continue;if(x>1170&&x<1390&&y<930)continue;if(y>450&&y<800&&x>1400&&x<2050)continue;tree(x,y,.6+rand()*.7);}
for(let i=0;i<1200;i++){const x=380+rand()*2000,y=300+rand()*1150;c.strokeStyle=rand()>.5?'#7f976b44':'#fbf0c655';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y-5);c.moveTo(x,y);c.lineTo(x+2,y-7);c.stroke();}
// Camp: a little canvas tent, flag and a warm fire ring.
poly([[407,1147],[455,1078],[512,1147]],'#a06f45');poly([[455,1078],[470,1147],[512,1147]],'#e9ca91');poly([[435,1147],[455,1105],[470,1147]],'#4c5c49');line([[528,1145],[528,1050]],'#6c7255',4);poly([[530,1051],[565,1061],[530,1078]],'#ad5f40');
// Hand-painted specimens share the same source image as the field guide.
const paint=(key:string,x:number,y:number,height:number)=>{const img=gameScene.textures.get(key).getSourceImage() as HTMLImageElement;const w=height*img.width/img.height;c.drawImage(img,x-w/2,y-height,w,height);};
paint('zhuyu',870,1135,190);paint('zhuyu',956,1140,105);
paint('migu',1310,510,370);
paint('stone',1610,1090,230);
for(const [x,y] of [[1120,890],[1930,740]]){poly([[x-32,y+12],[x-41,y-8],[x-12,y-27],[x+20,y-20],[x+36,y+6],[x+21,y+18]],'#8c9f8c');line([[x-30,y-9],[x-10,y-21],[x+18,y-15]],'#d0d4b9',3);}
c.font='28px Georgia, serif';c.fillStyle='#3a655e99';c.save();c.translate(140,650);c.rotate(-.07);c.fillText('西',0,0);c.fillText('海',0,45);c.restore();
// Subtle paper grain, deterministic across loads.
for(let i=0;i<24000;i++){c.fillStyle=rand()>.5?'#fff8de0a':'#344d3608';c.fillRect(rand()*2400,rand()*1500,1+rand()*2,1);}
tex.refresh();
}

class Trail extends Phaser.Scene {
player!:Phaser.GameObjects.Container;beast!:Phaser.GameObjects.Container;markers:Phaser.GameObjects.Container[]=[];keys!:Record<string,Phaser.Input.Keyboard.Key>;near:(typeof spots)[number]|null=null;destination:Phaser.Math.Vector2|null=null;watching=false;watchTime=0;targetMark!:Phaser.GameObjects.Graphics;trail!:Phaser.GameObjects.Graphics;lastSave=0;targetText!:Phaser.GameObjects.Text;flow:Phaser.GameObjects.Arc[]=[];
constructor(){super('Trail');}
preload(){this.load.on('progress',(n:number)=>{$('#loading-progress').textContent=Math.round(n*100)+'%';});for(const [key,url] of Object.entries(artSources))this.load.image(key,url);}
zoomMap(amount:number){if(modal||paused||artDialog.open)return;this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom+amount,.65,1.6));$('#zoom-level').textContent=Math.round(this.cameras.main.zoom*100)+'%';}
create(){if(Object.keys(artSources).some(key=>!this.textures.exists(key))){$('#loading').innerHTML='<strong>绘卷还没加载完整</strong><p>请检查网络后再试一次。</p><button class="primary" id="retry-art">重新加载</button>';$('#retry-art').onclick=()=>location.reload();return;}$('#loading').hidden=true;scene=this;const poses=this.textures.get('shengsheng');poses.add('crawl',0,0,0,1000,887);poses.add('upright',0,1050,0,650,887);makeLandscape(this);this.add.image(0,0,'land').setOrigin(0);this.cameras.main.setBounds(0,100,2400,1300);
 this.trail=this.add.graphics();this.targetMark=this.add.graphics();
 for(const sp of spots){const g=this.add.graphics();g.fillStyle(0xf6efd5,.95);g.fillCircle(0,0,16);g.lineStyle(1.5,0x6d7f62,.9);g.strokeCircle(0,0,16);const t=this.add.text(0,0,sp.icon,{fontFamily:'Georgia',fontSize:'19px',color:'#52664e'}).setOrigin(.5);const label=this.add.text(0,26,sp.name,{fontFamily:'Microsoft YaHei, sans-serif',fontSize:'16px',color:'#344d40',backgroundColor:'#e9e8cfbb',padding:{x:9,y:5}}).setOrigin(.5,0);const ct=this.add.container(sp.x,sp.y+42,[g,t,label]);ct.setDepth(1600);this.markers.push(ct);}
 this.player=this.add.container(state.x,state.y);const shadow=this.add.ellipse(0,7,44,15,0x304d38,.17);const traveler=this.add.image(0,8,'traveler').setOrigin(.5,1);traveler.setScale(108/traveler.height);this.player.add([shadow,traveler]);this.player.setDepth(1800);
 for(const [x,y] of [[1249,298],[1347,260],[1380,339]]){const glow=this.add.circle(x,y,14,0xfff3b5,.16).setDepth(2);if(!reduced)this.tweens.add({targets:glow,alpha:.06,scale:1.6,duration:1800,yoyo:true,repeat:-1});}
 this.beast=this.add.container(1810,557);this.drawBeast(false);this.beast.setDepth(1700);
 this.targetText=this.add.text(0,0,'',{fontFamily:'Microsoft YaHei',fontSize:'15px',color:'#fff6dd',backgroundColor:'#345748',padding:{x:10,y:8}}).setDepth(2100).setOrigin(.5).setVisible(false);
 const kb=this.input.keyboard!;this.keys=kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string,Phaser.Input.Keyboard.Key>;
 this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(modal||paused||journal||mapOpen||expeditionOpen||!state.started)return;const world=this.cameras.main.getWorldPoint(p.x,p.y);this.destination=new Phaser.Math.Vector2(Phaser.Math.Clamp(world.x,380,2150),Phaser.Math.Clamp(world.y,220,1250));this.trail.clear();this.trail.lineStyle(2,0xf6efcf,.9);this.trail.strokeCircle(this.destination.x,this.destination.y,12);});
 this.cameras.main.startFollow(this.player,true,.08,.08);this.resize();this.scale.on('resize',()=>this.resize());updateUI();intro();
}
drawBeast(upright:boolean){this.beast.removeAll(true);const shadow=this.add.ellipse(0,4,upright?83:145,23,0x375144,.17);const sprite=this.add.image(0,8,'shengsheng',upright?'upright':'crawl').setOrigin(.5,1).setScale(.24);this.beast.add([shadow,sprite]);}
resize(){const w=this.scale.width;this.cameras.main.setZoom(w<650?.85:1);$('#zoom-level').textContent=Math.round(this.cameras.main.zoom*100)+'%';}
stop(){this.destination=null;this.trail?.clear();Object.keys(touch).forEach(k=>touch[k as keyof typeof touch]=false);if(this.keys)Object.values(this.keys).forEach(k=>k.reset());}
markTarget(){this.targetMark.clear();const s=spots.find(s=>s.id===targetId);if(s){this.targetMark.lineStyle(3,0xffe5a0,.85);this.targetMark.strokeCircle(s.x,s.y,64);}this.targetText?.setVisible(!!s);}
update(time:number,delta:number){if(!this.player)return;const dt=Math.min(delta,50)/1000;const blocked=modal||paused||journal||mapOpen||artDialog.open||expeditionOpen||!state.started;
 let dx=0,dy=0;if(!blocked){dx=Number(this.keys.D.isDown||this.keys.RIGHT.isDown||touch.right)-Number(this.keys.A.isDown||this.keys.LEFT.isDown||touch.left);dy=Number(this.keys.S.isDown||this.keys.DOWN.isDown||touch.down)-Number(this.keys.W.isDown||this.keys.UP.isDown||touch.up);if(dx||dy)this.destination=null;else if(this.destination){const dist=Phaser.Math.Distance.Between(this.player.x,this.player.y,this.destination.x,this.destination.y);if(dist<7){this.destination=null;this.trail.clear();}else{dx=(this.destination.x-this.player.x)/dist;dy=(this.destination.y-this.player.y)/dist;}}const len=Math.hypot(dx,dy);if(len){this.player.x=Phaser.Math.Clamp(this.player.x+dx/len*235*dt,380,2150);this.player.y=Phaser.Math.Clamp(this.player.y+dy/len*235*dt,220,1250);this.player.setScale(dx<0?-1:1,1);}}
 this.near=spots.find(s=>Math.hypot(this.player.x-s.x,this.player.y-s.y)<105)??null;
 $('#prompt').hidden=!this.near||blocked||this.watching;if(this.near){$('#prompt-name').textContent=this.near.name;$('#observe-btn').innerHTML=`<kbd>E</kbd> ${this.near.id==='camp'?(canFinish(state)?'完成考察':'停步'):(state.facts.includes(this.near.id)?'重温':'观察')}`;}
 const bx=1810+(reduced?0:Math.sin(time/1400)*25);this.beast.x=bx;const upright=reduced?false:Math.sin(time/1000)>0;if(this.beast.getData('up')!==upright){this.drawBeast(upright);this.beast.setData('up',upright);}
 if(this.watching&&!blocked){if(dx||dy||this.near?.id!=='gait'){this.watchTime=0;this.watching=false;toast('脚步惊动了它。再按观察，停下来看看。');}else{this.watchTime+=dt;$('#watch-bar').style.width=`${Math.min(100,this.watchTime/3*100)}%`;if(this.watchTime>=3){this.watching=false;gain('gait');note('gait');}}}
 $('#watch').hidden=!this.watching||blocked;
 this.trail.lineStyle(1,0xffffff,.1);
 // Animated surface ripples travel from the headwater toward the western sea.
 if(!this.flow.length){for(let i=0;i<14;i++)this.flow.push(this.add.circle(0,0,2,0xf3f5d9,.7).setScale(4,1).setDepth(1));}
 const curve=this.registry.get('riverCurve') as Phaser.Curves.Spline|undefined;
 const water=curve??new Phaser.Curves.Spline([[1940,570],[1600,700],[1320,900],[1030,850],[820,1020],[500,1040],[280,1100]].map(([x,y])=>new Phaser.Math.Vector2(x,y)));if(!curve)this.registry.set('riverCurve',water);
 this.flow.forEach((p,i)=>{const at=water.getPoint((reduced?i/14:time/19000+i/14)%1);p.setPosition(at.x,at.y);});
 const target=spots.find(s=>s.id===targetId);if(target){const cam=this.cameras.main,dist=Math.hypot(target.x-this.player.x,target.y-this.player.y),angle=Math.atan2(target.y-this.player.y,target.x-this.player.x);this.targetText.setPosition(this.player.x+Math.cos(angle)*120,this.player.y+Math.sin(angle)*120-40);this.targetText.setText(`${target.name} ${dist<105?'· 已到达':['→','↘','↓','↙','←','↖','↑','↗'][(Math.round(angle/(Math.PI/4))+8)%8]}`);this.targetText.setVisible(!blocked);if(dist<70){targetId='';this.targetMark.clear();this.targetText.setVisible(false);}void cam;}
 $('#location').textContent=this.player.x<650?'西海岸 · 招摇山麓':this.player.x>1650?'深林 · 狌狌出没处':this.player.y<700?'山中 · 迷榖古木':'溪谷 · 循水小径';
 if(time-this.lastSave>4500&&!blocked){persist();this.lastSave=time;}
}
}
new Phaser.Game({type:Phaser.AUTO,parent:'game',backgroundColor:'#b8c9ac',scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},scene:Trail,render:{antialias:true},audio:{noAudio:true},input:{keyboard:true}});
window.addEventListener('beforeunload',persist);
