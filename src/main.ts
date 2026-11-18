import {openCampaign,campaignOpen} from './campaign';
import {openComparison,comparisonOpen} from './comparison';
import {createMinimap} from './minimap';
import {contactShadow, fieldLabel, footAnchor, groundShadow, groveShape, paintCamp, scenePixelRatio} from './scene-props';
import {groundSpecimensURL, paintGroundSpecimens} from './ground-specimens';
import * as Phaser from 'phaser';
import './style.css';
import {travelerHeight} from './clay';
import {makeEnvironment,paintTerrain,type World} from './environment';
import {findPath,moveSafely,nearestWalkable} from './navigation.mjs';
import {mountObservation} from './observation';
import {openRecall,recallOpen,noteText,safeText} from './learning';
import {sound} from './sound';
import {openWorldMap,worldMapOpen,setWorldLocation} from './worldmap';
import {animalMarkup,bindAnimals} from './animal';
import {openExpeditions,expeditionOpen,goExpedition} from './expeditions';
import {entries, spots, source, stoneEntry} from './content';
import {artSources, artDetails, specimen} from './artwork';
import {restore,record,finish,canFinish,SAVE_KEY} from './progress.mjs';

import {readSave,writeSave} from './storage.mjs';
import './clay.css';
import './evidence.css';
const saved=readSave(SAVE_KEY);
let storageOK=saved.ok;
const raw=saved.raw;
let state=restore(raw);
let modal=false, paused=false, journal=false, mapOpen=false, hintLevel=0, targetId='';
let scene:Trail;
const $=(s:string)=>document.querySelector(s) as HTMLElement;
const app=$('#app');
app.innerHTML=`
<header><a class="brand" href="#" aria-label="山海行记首页"><span class="seal">山海</span><span>山海行记<small>黏土山海 · 一步一发现</small></span></a><div class="chapter">山经 · 南山经 <span> / </span> 第一回 · 招摇山</div><nav><button id="world-btn" aria-label="山海经全书地图">全书地图</button><button id="atlas-btn" aria-label="探索其他山岳">山海舆图</button><div class="sound-controls"><button id="sound-btn" aria-label="开启或关闭声音">开启声音</button><label id="sound-label" for="volume-control">音量</label><input id="volume-control" type="range" min="0" max="100" value="${Math.round(sound.volume*100)}" aria-label="音量"/></div><button id="map-btn" aria-label="山行图">◈ <span>山行图</span></button><button id="book-btn" aria-label="我的手记">▤ <span>我的手记</span><b id="book-count">0</b></button><button id="pause-btn" aria-label="暂停与设置">Ⅱ</button></nav></header>
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

const trailMini=createMinimap($('#stage'),{id:'zhaoyao',name:'招摇山',width:2400,height:1500,points:spots},()=>{scene?.stop();openWorldMap('local');});
$('#save-status').textContent=storageOK?'进度保存在此浏览器':'当前无法保存 · 请勿关闭页面';
$('#world-btn').onclick=()=>{scene?.stop();openWorldMap();};
document.addEventListener('worldmapclose',()=>scene?.stop());
document.addEventListener('comparisonclose',()=>scene?.stop());
document.addEventListener('campaignopen',()=>scene?.stop());
document.addEventListener('campaignclose',()=>scene?.stop());
document.addEventListener('localmaptravel',e=>{const d=(e as CustomEvent).detail;if(d.mountain!=='zhaoyao'||expeditionOpen)return;const p=spots.find(p=>p.name===d.point);if(p){scene.stop();targetId=p.id;scene.markTarget();scene.walkTo(p.x,p.y+70);toast('已规划路线 · 会从桥上过河');}});
document.addEventListener('worldtravel',e=>{scene?.stop();if($('#overlay').classList.contains('intro-overlay')){$('#overlay').classList.remove('intro-overlay');state.started=true;persist();closeModal();}goExpedition((e as CustomEvent).detail);});
$('#atlas-btn').onclick=()=>{scene?.stop();openExpeditions();};
function refreshSound(){$('#sound-btn').textContent=sound.enabled?'声音：开':'开启声音';$('#sound-btn').setAttribute('aria-pressed',String(sound.enabled));}
$('#sound-btn').onclick=async()=>{if(sound.enabled)sound.mute();else if(!await sound.start())toast('声音未能启动，请再次点击。');refreshSound();};
$('#volume-control').oninput=e=>sound.setVolume(Number((e.target as HTMLInputElement).value)/100);
document.addEventListener('soundchange',refreshSound);
const artDialog=document.createElement('dialog');
artDialog.className='art-detail';artDialog.setAttribute('aria-label','山海图鉴细节');document.body.append(artDialog);
let cleanupArt=()=>{};
artDialog.addEventListener('close',()=>{cleanupArt();sound.stopCall();scene?.stop();});
function showArt(id:string){const a=artDetails[id];if(!a)return;scene?.stop();cleanupArt();
if(a.key==='shengsheng'){artDialog.innerHTML=`<div class="detail-heading"><div><span class="eyebrow">山海图鉴 · 点击观察</span><h2>${a.name}</h2></div><button class="detail-close" aria-label="关闭图鉴">×</button></div>${animalMarkup('shengsheng')}<p class="detail-note">${a.interpretation}</p>`;cleanupArt=bindAnimals(artDialog);artDialog.querySelector<HTMLButtonElement>('.detail-close')!.onclick=()=>artDialog.close();artDialog.showModal();return;}

artDialog.innerHTML=`<div class="detail-heading"><div><span class="eyebrow">山海图鉴 · 黏土草木</span><h2>${a.name}</h2></div><button class="detail-close" aria-label="关闭图鉴">×</button></div><div class="detail-canvas" tabindex="0" aria-label="图像查看区域，放大后可以滚动查看"><img src="${artSources[a.key]}" alt="${a.alt}"/></div><div class="detail-tools"><span>原文线索 · ${a.traits.join(' / ')}</span><div><button class="detail-minus" aria-label="缩小插图">−</button><output>100%</output><button class="detail-plus" aria-label="放大插图">＋</button></div></div><p class="detail-note"><b>依据与演绎</b>${a.interpretation} <a href="${source}" target="_blank" rel="noopener">查阅原文 ↗</a></p>`;
let zoom=1;const scale=(amount:number)=>{zoom=Phaser.Math.Clamp(zoom+amount,1,3);const img=artDialog.querySelector('img')!;img.style.width=zoom*100+'%';img.style.height=zoom*100+'%';artDialog.querySelector('output')!.textContent=Math.round(zoom*100)+'%';};
artDialog.querySelector<HTMLButtonElement>('.detail-close')!.onclick=()=>artDialog.close();
artDialog.querySelector<HTMLButtonElement>('.detail-plus')!.onclick=()=>scale(.5);
artDialog.querySelector<HTMLButtonElement>('.detail-minus')!.onclick=()=>scale(-.5);
artDialog.showModal();}
document.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-art]');if(b)showArt(b.dataset.art!);});
function persist(){if(scene?.player){state.x=Math.round(scene.player.x);state.y=Math.round(scene.player.y);}storageOK=writeSave(SAVE_KEY,state);$('#save-status').textContent=storageOK?'进度已保存 · 此设备':'当前无法保存 · 请勿关闭页面';}
let toastTimer:ReturnType<typeof setTimeout>;
function toast(text:string){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3600);}
function gain(id:string){const isNew=!state.facts.includes(id);state=record(state,id);persist();updateUI();if(isNew)sound.cue();if(isNew)toast(`手记添一笔 · ${entries.find(e=>e.id===id)?.title}`);}
function updateUI(){const n=state.facts.length;scene?.refreshMarkers();$('#guide-btn').hidden=!state.facts.includes('migu');$('#count').textContent=`发现 ${n} / 5`;$('#book-count').textContent=String(n);$('#progress').style.width=`${n*20}%`;$('#quest-title').textContent=state.completed?'此山已识，余兴未尽':canFinish(state)?'循水归去，完成山行':'循水入山，识万物';$('#quest-text').textContent=state.completed?'手记已经收好。你可以继续漫步，重看每一处发现。':canFinish(state)?'回到西边的海岸营地，把今天的发现带回家。':'辨认两种草木，观察狌狌，再读懂水流的方向。'; if(journal)renderJournal();if(mapOpen)renderMap();}
let focusBefore:HTMLElement|null=null;
let cleanupObservation=()=>{};
function openModal(html:string){focusBefore=document.activeElement as HTMLElement;modal=true;scene?.stop();cleanupObservation();$('#overlay').innerHTML=html;cleanupObservation=bindAnimals($('#overlay'));$('#overlay').hidden=false;$('#overlay').setAttribute('role','dialog');$('#overlay').setAttribute('aria-modal','true');$('#overlay').setAttribute('aria-label','考察对话');setTimeout(()=>$('#overlay').querySelector<HTMLButtonElement>('button')?.focus(),0);}
function closeModal(){cleanupObservation();sound.stopCall();modal=false;$('#overlay').hidden=true;$('#overlay').innerHTML='';scene?.stop();focusBefore?.focus();}
function note(id:string){const e=id==='stone'?stoneEntry:entries.find(e=>e.id===id)!;openModal(`<section class="dialog discovery"><div class="eyebrow">山海手记 · ${e.tag}</div><button class="close" aria-label="关闭">×</button>${specimen(id)}<h2>${e.title}</h2><blockquote>${e.quote}</blockquote><p>${e.text}</p><div class="annotation"><b>原文与演绎</b>${e.note}</div><button class="primary done">收好手记，继续山行 →</button></section>`);$('#overlay .close').onclick=closeModal;$('#overlay .done').onclick=closeModal;}
const questions:Record<string,{title:string,desc:string,options:string[],correct:number,feedback:string[]}>={
 zhuyu:{title:'溪边的草，会是祝余吗？',desc:'俯身看：这一丛叶子细长，花呈青色。手册上哪一条描述与它吻合？',options:['像韭菜，开青色的花','宽大的圆叶，结红色的果','黑色树纹，花光照向四方'],correct:0,feedback:['','再看看叶子：它们细长，眼前开的是花，没有红果。','这一条更像是在描述一棵树。眼前是一丛草。']},
 migu:{title:'古木为什么在发光？',desc:'走近树干，你看见一道道深黑的纹理；枝头花朵散出柔光。请给这次观察选一条依据。',options:['白色的耳朵','黑色纹理，花向四方发光','像韭菜的叶子，青色的花'],correct:1,feedback:['这是动物的特征。把注意力放回树干和花朵。','','这棵树有木质树干，并不是溪边那丛草。']},
 river:{title:'这条水，要去哪里？',desc:'看看水面：细小的白色波纹沿河向左移动。山行图上方为北。水流会把你带向哪边的海？',options:['东边 →','北边 ↑','西边 ←'],correct:2,feedback:['东在右边，和眼前的水流相反。再看一会儿白色波纹。','北在上方。观察水流整体向哪一侧汇去。','']},
 ears:{title:'树后的身影，有什么不同？',desc:'你挪到林间空处，终于看清它的头部。请把真正观察到的特征记下来。',options:['头上长角','耳朵是白色的','身后有九条尾巴'],correct:1,feedback:['头顶没有角。注意它脸侧那一对白色的部位。','','目前看到的身体没有九尾。先记录清晰可见的耳朵。']}
};
function quiz(id:string,known=false){const q=questions[id],e=entries.find(e=>e.id===id)!;openModal('<section class="dialog evidence-dialog"></section>');cleanupObservation=mountObservation($('#overlay .dialog'),{id,name:e.title,image:artDetails[id]?artSources[artDetails[id].key]:undefined,animalId:id==='ears'?'shengsheng':undefined,quote:e.quote,text:e.text,question:q.title,options:q.options,answer:q.correct,caption:e.note},'zhaoyao',known,()=>gain(id),closeModal);}

function interact(id:string){if(modal||paused||journal||mapOpen)return;if(id==='stone'){note('stone');return;}if(id==='camp'){if(state.completed){showEnding();return;}if(canFinish(state)){returnQuiz();return;}openModal(`<section class="dialog"><div class="eyebrow">西海岸 · 营地</div><h2>带着好奇心，出发吧。</h2><p>沿小路走进山里。靠近发光的小标记，按 E 或点「观察」。你会遇见两种奇妙草木，也会看见林间的狌狌。</p><p>山行图可查看位置；迷路时，可以打开提示。发现会自动写入手记。</p><button class="primary done">继续入山 →</button></section>`);$('#overlay .done').onclick=closeModal;return;}if(state.facts.includes(id)){if(questions[id])quiz(id,true);else note(id);return;}if(id==='gait'){if(!state.facts.includes('ears')){toast('先到北侧的林间空处，看清它的外形，再来观察行动。');targetId='ears';scene.markTarget();return;}scene.watching=true;scene.watchTime=0;scene.stop();toast('站在静观石旁保持不动，观察三秒。');return;}quiz(id);}
function returnQuiz(){openModal(`<section class="dialog"><div class="eyebrow">归来 · 最后一笔</div><h2>你怎样找回了海岸？</h2><p>把今天读懂的方向记进手册。招摇山的水，向哪边流入海？</p><div class="answers"><button data-return="east">向东，逆着刚才看到的水流</button><button data-return="west">向西，顺着水流走向海岸</button></div><p class="feedback" role="status">想一想观水石旁的白色波纹。</p></section>`);document.querySelectorAll<HTMLButtonElement>('[data-return]').forEach(b=>b.onclick=()=>{if(b.dataset.return==='west'){state=finish(state,'west');persist();updateUI();showEnding();}else{$('#overlay .feedback').textContent='再回想一下：水向地图左侧汇去，左侧是西。';}});}
function showEnding(){openModal(`<section class="dialog ending"><div class="eyebrow">南山经 · 第一回</div><div class="end-seal">山行<br>已记</div><h2>一座山，五次发现。</h2><p>你识出了祝余与迷榖，看清了狌狌的白耳和行动，也顺着西流的水回到了海岸。</p><div class="end-stats"><span><b>5</b>条观察记录</span><span><b>1</b>段山海旅程</span></div><p class="muted">下次读到这些文字，你会想起自己走过的山路。</p><button class="primary done">留在山中，再走走 →</button><button class="secondary read">翻开招摇山手记</button><button class="secondary more-volumes">前往十八卷远行 →</button></section>`);$('#overlay .done').onclick=closeModal;$('#overlay .read').onclick=()=>{closeModal();toggleJournal(true);};$('#overlay .more-volumes').onclick=()=>openCampaign();}
function intro(){openModal(`<div class="clay-intro-art" aria-hidden="true"><img class="coast-panorama" src="${import.meta.env.BASE_URL}assets/art-clay-detail/zhaoyao-coast.webp" alt="" fetchpriority="high"/></div><section class="intro"><div class="eyebrow">给每一位好奇的山海旅人 · 10+</div><div class="intro-title"><span>山海</span><span>行记<i>壹</i></span></div><div class="intro-sub">招 摇 山 · 循 水 识 万 物</div><p>从招摇山出发，去十八卷里寻访山川万物。<br>辨一株草，观一只兽，<br>把亲眼见到的线索，写成自己的山海手记。</p><button class="primary start">${state.started?'继续我的山行':'展开山海，启程'} <span>↗</span></button><button class="intro-volumes" type="button">十八卷远行 · 全书主线 ↗</button><div class="intro-meta">自由探索 · 无战斗 · 轻柔环境声（可静音）</div><div class="intro-note">取材《山海经》通行十八卷<br>地景与互动为游戏演绎，知识可查原文。<br>黏土山海 · 人物尺寸为可读性设计。</div></section>`);$('#overlay').classList.add('intro-overlay');$('#overlay .intro-volumes').onclick=()=>openCampaign();$('#overlay .start').onclick=()=>{void sound.autoStart().then(refreshSound);state.started=true;persist();$('#overlay').classList.remove('intro-overlay');closeModal();$('#game').focus();};}
function renderJournal(){const el=$('#journal');el.innerHTML=`<div class="panel-top"><div><div class="eyebrow">FIELD NOTES · ${state.facts.length} / 5</div><h2>我的山海手记</h2></div><button class="close-panel" aria-label="关闭手记">×</button></div><p class="panel-intro">每一次辨认，都留下一条依据。</p><div class="journal-entries">${entries.map((e,i)=>`<article class="${state.facts.includes(e.id)?'recorded':'unseen'}"><span class="entry-num">0${i+1}</span><div><small>${e.tag}</small><h3>${state.facts.includes(e.id)?e.title:'尚待观察'}</h3>${state.facts.includes(e.id)?`${specimen(e.id,true)}<blockquote>${e.quote}</blockquote><p>${e.text}</p>${noteText('zhaoyao',e.id)?`<p class="note-quote">我的发现：${safeText(noteText('zhaoyao',e.id))}</p>`:''}<details><summary>原文与游戏演绎</summary><p>${e.note}</p></details>`:'<p>走近山中，留意草木、水流与林间的身影。</p>'}</div></article>`).join('')}</div><button class="recall-link" id="zhaoyao-recall">山行回想：不看手记再试试 ↗</button><button class="compare-entry" id="journal-compare">跨山线索对照：把发现连起来 ↗</button><section class="journal-extra"><div class="eyebrow">山中补记 · 随时翻阅</div><h3>山石 · 多金玉</h3>${specimen('stone',true)}<p>原文只有“多金玉”三个字。看山石的同时，也留意文字没有告诉我们的部分。</p></section><footer><a href="${source}" target="_blank" rel="noopener">查阅《南山经》原文 ↗</a><p>本作参考含注文的在线文本，手记中引文摘自正文；释义由本作重新撰写。地图比例与生物互动为演绎。</p></footer>`;el.querySelector<HTMLButtonElement>('.close-panel')!.onclick=()=>toggleJournal(false);el.querySelector<HTMLButtonElement>('#journal-compare')!.onclick=()=>{toggleJournal(false);scene.stop();openComparison();};el.querySelector<HTMLButtonElement>('#zhaoyao-recall')!.onclick=()=>{toggleJournal(false);scene.stop();openRecall('zhaoyao',canFinish(state));};}
function toggleJournal(value=!journal){journal=value;mapOpen=false;$('#map').hidden=true;$('#journal').hidden=!value;scene?.stop();if(value)renderJournal();$('#book-btn').setAttribute('aria-expanded',String(value));}
function renderMap(){const el=$('#map');el.innerHTML=`<div class="panel-top"><div><div class="eyebrow">招摇山 · 示意地图</div><h2>山行图</h2></div><button class="close-panel" aria-label="关闭山行图">×</button></div><p class="panel-intro">上北下南，左西右东。点击地点，标记方向。</p><div class="mini-map"><svg viewBox="0 0 2400 1500" role="img" aria-label="海在西侧，水从东侧山中流向海"><rect width="2400" height="1500" fill="#c8d1ba"/><path d="M0 0H320 Q400 500 280 1500H0Z" fill="#83aaa7"/><path d="M1940 570L1600 700 1320 900 1030 850 820 1020 500 1040 280 1100" fill="none" stroke="#83aaa7" stroke-width="55"/>${scene.world.bridges.map(b=>`<rect x="${b.x-b.w/2}" y="${b.y-b.h/2}" width="${b.w}" height="${b.h}" rx="8" fill="#bd9668"/>`).join('')}<text x="90" y="650">西海</text>${spots.map(s=>`<circle cx="${s.x}" cy="${s.y}" r="30" fill="${state.facts.includes(s.id)?'#476b4e':'#c37c49'}"/><text x="${s.x}" y="${s.y-65}" text-anchor="middle">${s.name}</text>`).join('')}<circle cx="${Math.round(scene?.player.x??470)}" cy="${Math.round(scene?.player.y??1120)}" r="38" fill="#e8bb69" stroke="#fff7dc" stroke-width="14"/></svg><div class="map-legend">金色圆点 · 你的位置</div></div><div class="map-destinations">${spots.map(s=>`<button data-target="${s.id}"><span>${s.icon} ${s.name}</span><span>${s.id==='camp'?'营地':state.facts.includes(s.id)?'已记录':'待观察'} ↗</span></button>`).join('')}</div><p class="muted">按原文的方向关系绘制；道路、位置与距离为游戏设计。</p>`;el.querySelector<HTMLButtonElement>('.close-panel')!.onclick=()=>{mapOpen=false;el.hidden=true;};el.querySelectorAll<HTMLButtonElement>('[data-target]').forEach(b=>b.onclick=()=>{targetId=b.dataset.target!;mapOpen=false;el.hidden=true;scene.markTarget();const point=spots.find(p=>p.id===targetId)!;scene.walkTo(point.x,point.y+40);toast('已规划路线 · 会从桥上过河');});}
$('#book-btn').onclick=()=>{if(!modal&&!paused)toggleJournal();};
$('#map-btn').onclick=()=>{if(modal||paused)return;mapOpen=!mapOpen;journal=false;$('#journal').hidden=true;$('#map').hidden=!mapOpen;scene.stop();if(mapOpen)renderMap();};
$('#hint-btn').onclick=()=>{hintLevel++;const id=canFinish(state)?'camp':['zhuyu','river','migu','ears','gait'].find(k=>!state.facts.includes(k))!;const sp=spots.find(s=>s.id===id)!;const hints:Record<string,string>={zhuyu:'溪边有一丛青色花朵。看一看它细长的叶子。',river:'水面上的白色波纹正在移动。和右上角的方向标对照一下。',migu:'向山中走，找到发光的古木。看看树干上的纹理。',ears:'林间的身影靠近北边。绕到能看清头部的位置。',gait:'到狌狌南侧的静观石，按观察，再停步三秒。',camp:'水向西流入海。向地图左下方的海岸营地走。'};$('#hint-text').hidden=false;$('#hint-text').textContent=hints[id]+(hintLevel>1?' 已为你标记方向。':' 再点一次，可标记位置。');if(hintLevel>1){targetId=sp.id;scene.markTarget();}};
$('#observe-btn').onclick=()=>scene?.near&&interact(scene.near.id);
$('#guide-btn').onclick=()=>{if(modal||paused||journal||mapOpen)return;targetId='camp';scene.markTarget();toast('迷榖为你指向营地 · “佩之不迷”的游戏演绎');};
function pauseMenu(){if(modal)return;paused=true;scene?.stop();persist();openModal(`<section class="dialog"><div class="eyebrow">山行小憩</div><h2>歇一歇，山还在这里。</h2><p>当前进度${storageOK?'已保存在此设备。':'无法写入浏览器，请保持页面开启。'}</p><button class="primary resume">继续探索 →</button><button class="secondary motion">${reduced?'开启':'减少'}动态效果</button><button class="secondary restart">重新开始这次考察</button><p class="muted">人物大小按操作可读性设计，不代表古籍中的真实比例。<br>操作：方向键 / WASD 移动，E 观察，J 手记，M 地图，Esc 暂停或关闭面板。也可以点击地面移动。</p></section>`);$('#overlay .resume').onclick=()=>{paused=false;closeModal();};$('#overlay .motion').onclick=()=>{reduced=!reduced;$('#overlay .motion').textContent=`${reduced?'开启':'减少'}动态效果`;};$('#overlay .restart').onclick=()=>{openModal(`<section class="dialog"><h2>重新写一本手记？</h2><p>这会清除当前设备上的五项发现和位置。其他内容不受影响。</p><button class="primary cancel">保留进度</button><button class="secondary reset">清除并重新出发</button></section>`);$('#overlay .cancel').onclick=()=>{paused=false;closeModal();};$('#overlay .reset').onclick=()=>{state=restore(null);state.started=true;scene.player.setPosition(470,1120);scene.stop();targetId='';hintLevel=0;$('#hint-text').hidden=true;scene.markTarget();persist();updateUI();paused=false;closeModal();};};}
$('#zoom-in').onclick=()=>scene?.zoomMap(.15);$('#zoom-out').onclick=()=>scene?.zoomMap(-.15);
$('#pause-btn').onclick=pauseMenu;$('.brand').onclick=e=>{e.preventDefault();if(!modal&&!expeditionOpen&&!worldMapOpen)pauseMenu();};
document.addEventListener('keydown',e=>{if(artDialog.open||expeditionOpen||worldMapOpen||campaignOpen()||comparisonOpen()||recallOpen()||['TEXTAREA','INPUT'].includes((e.target as HTMLElement)?.tagName))return;if(e.key==='Tab'&&modal){const items=[...$('#overlay').querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')];const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}return;}if(e.key==='Escape'){if(modal){if($('#overlay').classList.contains('intro-overlay'))return;paused=false;closeModal();}else if(journal)toggleJournal(false);else if(mapOpen){mapOpen=false;$('#map').hidden=true;}else pauseMenu();return;}if(modal||paused)return;if(e.key.toLowerCase()==='j')toggleJournal();if(e.key.toLowerCase()==='m')$('#map-btn').click();if(e.key.toLowerCase()==='e'&&scene?.near)interact(scene.near.id);});
window.addEventListener('blur',()=>{scene?.stop();});document.addEventListener('visibilitychange',()=>{if(document.hidden){persist();if(!modal&&!expeditionOpen&&!campaignOpen())pauseMenu();}});
let reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch={up:false,down:false,left:false,right:false};
document.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach(b=>{const d=b.dataset.dir as keyof typeof touch;b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touch[d]=true;};b.onpointerup=b.onpointercancel=()=>{touch[d]=false;};b.onlostpointercapture=()=>{touch[d]=false;};});

function makeLandscape(gameScene:Trail){
 const env=makeEnvironment('zhaoyao',spots);gameScene.world=env.world;
 const tex = gameScene.textures.createCanvas('land', env.world.width, env.world.height)!;
 const c = tex.context;
 paintTerrain(c,env.world);
 if (gameScene.textures.exists('groundSpecimens')) {
   const sheet = gameScene.textures.get('groundSpecimens').getSourceImage() as HTMLImageElement;
   paintGroundSpecimens(c, env.world, sheet, spots);
 }
 // The shelter sits on the dry, southern bank beyond the river mouth.
 const shelterTexture = gameScene.textures.createCanvas('coastal-shelter', 192, 112)!;
 paintCamp(shelterTexture.context, 88, 88);
 shelterTexture.refresh();
 const shelter = gameScene.add.image(414, 1205, 'coastal-shelter');
 shelter.setOrigin(88/192,88/112).setDepth(shelter.y);
 gameScene.world.obstacles.push({x:414,y:1195,r:29});
 gameScene.foliage.push(shelter);
 const plant = (key: string, x: number, y: number, height: number) => {
   const image = gameScene.textures.get(key).getSourceImage() as HTMLImageElement;
   const shape = key === 'grove' ? groveShape(x,y) : {flip: false, width: 1};
   const width = height * image.width / image.height * shape.width;
   const sprite = gameScene.add.image(x,y,key).setOrigin(.5,footAnchor(key));
   sprite.setDisplaySize(width,height).setFlipX(shape.flip).setDepth(y);
   groundShadow(c, x, y, width * (key === 'grove' || key === 'migu' ? .57 : .62));
   gameScene.foliage.push(sprite);
 };
 env.props.forEach(p => plant('grove',p.x,p.y,p.height));
 plant('zhuyu',870,1135,190);
 plant('zhuyu',956,1140,105);
 plant('migu',1310,510,370);
 plant('stone',1610,1090,210);
 gameScene.world.obstacles.push({x:1310,y:510,r:24},{x:1610,y:1090,r:32});
 tex.refresh();
}

class Trail extends Phaser.Scene {
world!:World;route:{x:number;y:number}[]=[];travelerSprite!:Phaser.GameObjects.Image;foliage:Phaser.GameObjects.Image[]=[];player!:Phaser.GameObjects.Container;beast!:Phaser.GameObjects.Container;markers:Phaser.GameObjects.Container[]=[];keys!:Record<string,Phaser.Input.Keyboard.Key>;near:(typeof spots)[number]|null=null;destination:Phaser.Math.Vector2|null=null;watching=false;watchTime=0;targetMark!:Phaser.GameObjects.Graphics;trail!:Phaser.GameObjects.Graphics;lastSave=0;targetText!:Phaser.GameObjects.Text;flow:Phaser.GameObjects.Arc[]=[];
private density = 1;
private mapZoom = 1;
private narrowViewport?: boolean;
constructor(){super('Trail');}
preload(){
 this.load.on('progress',(n:number)=>{$('#loading-progress').textContent=Math.round(n*100)+'%';});
 for(const [key,url] of Object.entries(artSources))this.load.image(key,url);
 this.load.image('groundSpecimens',groundSpecimensURL);
}
zoomMap(amount:number) {
 if(modal||paused||artDialog.open)return;
 this.mapZoom = Phaser.Math.Clamp(this.mapZoom+amount,.65,1.6);
 this.updateCameraZoom();
}
private updateCameraZoom() {
 this.cameras.main.setZoom(this.mapZoom * this.density);
 $('#zoom-level').textContent = Math.round(this.mapZoom * 100) + '%';
}
create(){if(Object.keys(artSources).some(key=>!this.textures.exists(key))){$('#loading').innerHTML='<strong>绘卷还没加载完整</strong><p>请检查网络后再试一次。</p><button class="primary" id="retry-art">重新加载</button>';$('#retry-art').onclick=()=>location.reload();return;}$('#loading').hidden=true;scene=this;for(const key of ['shengsheng','travelerWalk']){const poses=this.textures.get(key),img=poses.getSourceImage() as HTMLImageElement;for(let i=0;i<3;i++)poses.add('pose'+i,0,i*img.width/3,0,img.width/3,img.height);}makeLandscape(this);const safe=nearestWalkable(this.world,{x:state.x,y:state.y});if(safe){state.x=safe.x;state.y=safe.y;}this.add.image(0,0,'land').setOrigin(0);this.cameras.main.setBounds(0,100,2400,1300);
 this.trail=this.add.graphics();this.targetMark=this.add.graphics();
 this.textures.addCanvas('contact-shadow', contactShadow);
 for (const spot of spots) {
   const key = 'field-label-' + spot.id;
   const blank = fieldLabel(spot.name, false);
   this.textures.addCanvas(key, blank);
   this.textures.addCanvas(key + '-recorded', fieldLabel(spot.name, true));
   const label = this.add.image(0,0,key).setScale(.5);
   const labelX = spot.x + (spot.id==='camp' ? 36 : 0);
   const marker = this.add.container(labelX,spot.y + 93,[label]).setDepth(1600);
   this.markers.push(marker);
 }
 this.player=this.add.container(state.x,state.y);
 const shadow=this.add.image(4,0,'contact-shadow').setDisplaySize(65,15);
 const traveler=this.add.image(0,0,'travelerWalk','pose0').setOrigin(.5,footAnchor('player'));
 this.travelerSprite=traveler;
 traveler.setScale(travelerHeight/traveler.height);
 this.player.add([shadow,traveler]);
 this.player.setDepth(this.player.y);
 for(const [x,y] of [[1249,298],[1347,260],[1380,339]]){const glow=this.add.circle(x,y,14,0xfff3b5,.16).setDepth(2);if(!reduced)this.tweens.add({targets:glow,alpha:.06,scale:1.6,duration:1800,yoyo:true,repeat:-1});}
 this.beast=this.add.container(1810,557);this.drawBeast(false);this.beast.setDepth(this.beast.y);
 this.targetText=this.add.text(0,0,'',{fontFamily:'Microsoft YaHei',fontSize:'15px',color:'#fff6dd',backgroundColor:'#345748',padding:{x:10,y:8}}).setDepth(2100).setOrigin(.5).setVisible(false);
 const kb=this.input.keyboard!;this.keys=kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string,Phaser.Input.Keyboard.Key>;
 this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(modal||paused||journal||mapOpen||expeditionOpen||worldMapOpen||campaignOpen()||comparisonOpen()||recallOpen()||!state.started)return;const world=this.cameras.main.getWorldPoint(p.x,p.y);this.walkTo(world.x,world.y);this.trail.clear();this.trail.lineStyle(2,0xf6efcf,.9);if(this.destination)this.trail.strokeCircle(this.destination.x,this.destination.y,12);});
 this.cameras.main.startFollow(this.player,true,.08,.08);this.resize();this.scale.on('resize',()=>this.resize());updateUI();intro();
 const url=new URL(window.location.href),requested=url.searchParams.get('mountain');
 if(requested&&['zhaoyao','tangting','niuyang','qingqiu'].includes(requested)){
   url.searchParams.delete('mountain');history.replaceState(history.state,'',url);
   document.dispatchEvent(new CustomEvent('worldtravel',{detail:requested}));
 }
}
drawBeast(upright: boolean) {
 this.beast.removeAll(true);
 const width = upright ? 77 : 135;
 const shadow = this.add.image(5,0,'contact-shadow').setDisplaySize(width,width*.22);
 const sprite = this.add.image(0,0,'shengsheng',upright?'pose1':'pose0');
 sprite.setOrigin(.5,footAnchor('shengsheng')).setDisplaySize(220,220);
 this.beast.add([shadow,sprite]);
}
refreshMarkers() {
 spots.forEach((spot,i)=>{
   const label=this.markers[i]?.first as Phaser.GameObjects.Image | undefined;
   label?.setTexture('field-label-'+spot.id+(state.facts.includes(spot.id)?'-recorded':''));
 });
}
resize() {
 const host = $('#game');
 const {clientWidth: w,clientHeight: h} = host;
 if(!w || !h)return;
 this.density = scenePixelRatio(w,h);
 if(this.narrowViewport !== (w<650)) {
   this.narrowViewport = w<650;
   this.mapZoom = this.narrowViewport ? .85 : 1;
 }
 const width = Math.round(w*this.density), height = Math.round(h*this.density);
 if(this.scale.width!==width || this.scale.height!==height)this.scale.setGameSize(width,height);
 this.updateCameraZoom();
}
walkTo(x:number,y:number){this.route=findPath(this.world,{x:this.player.x,y:this.player.y},{x,y});const next=this.route.shift();this.destination=next?new Phaser.Math.Vector2(next.x,next.y):null;if(!next)toast('这里暂时走不到，试试附近地面。');}
stop(){this.route=[];this.destination=null;this.trail?.clear();Object.keys(touch).forEach(k=>touch[k as keyof typeof touch]=false);if(this.keys)Object.values(this.keys).forEach(k=>k.reset());}
markTarget(){this.targetMark.clear();const s=spots.find(s=>s.id===targetId);if(s){this.targetMark.lineStyle(3,0xffe5a0,.85);this.targetMark.strokeCircle(s.x,s.y,64);}this.targetText?.setVisible(!!s);}
update(time:number,delta:number){if(!this.player)return;const dt=Math.min(delta,50)/1000;const blocked=modal||paused||journal||mapOpen||artDialog.open||expeditionOpen||worldMapOpen||campaignOpen()||comparisonOpen()||recallOpen()||!state.started;
 let dx=0,dy=0;if(!blocked){dx=Number(this.keys.D.isDown||this.keys.RIGHT.isDown||touch.right)-Number(this.keys.A.isDown||this.keys.LEFT.isDown||touch.left);dy=Number(this.keys.S.isDown||this.keys.DOWN.isDown||touch.down)-Number(this.keys.W.isDown||this.keys.UP.isDown||touch.up);if(dx||dy){this.destination=null;this.route=[];}else if(this.destination){const dist=Phaser.Math.Distance.Between(this.player.x,this.player.y,this.destination.x,this.destination.y);if(dist<7){const next=this.route.shift();this.destination=next?new Phaser.Math.Vector2(next.x,next.y):null;if(!next)this.trail.clear();}else{dx=(this.destination.x-this.player.x)/dist;dy=(this.destination.y-this.player.y)/dist;}}const len=Math.hypot(dx,dy);if(len){const step=moveSafely(this.world,{x:this.player.x,y:this.player.y},dx/len*235*dt,dy/len*235*dt);this.player.setPosition(step.x,step.y);if(dx)this.travelerSprite.setFlipX(dx<0);}}
 this.travelerSprite.setFrame('pose'+((dx||dy)&&!reduced?[0,1,0,2][Math.floor(time/150)%4]:0));
 this.player.setDepth(this.player.y);
 for (const plant of this.foliage) {
   const dy = plant.y - this.player.y, dx = this.player.x - plant.x;
   // The tent occupies a tapered 80px of its padded texture. Its ropes and
   // transparent roof corners do not hide the traveller.
   const tentSection = 1 - dy/80;
   const behind = plant.texture.key==='coastal-shelter'
     ? dy>0 && dy<80 && dx>-18-42*tentSection && dx<24+38*tentSection
     : dy>0 && dy<plant.displayHeight && Math.abs(dx)<plant.displayWidth*.4;
   plant.setAlpha(behind ? .36 : 1);
 }
 this.near=spots.find(s=>Math.hypot(this.player.x-s.x,this.player.y-s.y)<105)??null;
 $('#prompt').hidden=!this.near||blocked||this.watching;if(this.near){$('#prompt-name').textContent=this.near.name;$('#observe-btn').innerHTML=`<kbd>E</kbd> ${this.near.id==='camp'?(canFinish(state)?'完成考察':'停步'):(state.facts.includes(this.near.id)?'重温':'观察')}`;}
 const bx=1810+(reduced?0:Math.sin(time/1400)*25);this.beast.x=bx;const behindBeast=this.player.y<this.beast.y&&this.player.y>this.beast.y-140&&Math.abs(this.player.x-bx)<52;this.beast.setAlpha(behindBeast ? .55 : 1);const upright=reduced?false:Math.sin(time/1000)>0;if(this.beast.getData('up')!==upright){this.drawBeast(upright);this.beast.setData('up',upright);}
 if(this.watching&&!blocked){if(dx||dy||this.near?.id!=='gait'){this.watchTime=0;this.watching=false;toast('脚步惊动了它。再按观察，停下来看看。');}else{this.watchTime+=dt;$('#watch-bar').style.width=`${Math.min(100,this.watchTime/3*100)}%`;if(this.watchTime>=3){this.watching=false;gain('gait');note('gait');}}}
 $('#watch').hidden=!this.watching||blocked;
 // Surface glints follow the river centreline.
 // Animated surface ripples travel from the headwater toward the western sea.
 if(!this.flow.length){for(let i=0;i<14;i++)this.flow.push(this.add.circle(0,0,2,0xf3f5d9,.7).setScale(4,1).setDepth(1));}
 const river=this.world.river;this.flow.forEach((p,i)=>{const at=((reduced?i/14:time/19000+i/14)%1)*(river.length-1),n=Math.floor(at),t=at-n,a=river[n],b=river[n+1];p.setPosition(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t);p.setVisible(!this.world.bridges.some(br=>Math.abs(p.x-br.x)<br.w/2&&Math.abs(p.y-br.y)<br.h/2));});
 const target=spots.find(s=>s.id===targetId);if(target){const cam=this.cameras.main,dist=Math.hypot(target.x-this.player.x,target.y-this.player.y),angle=Math.atan2(target.y-this.player.y,target.x-this.player.x);this.targetText.setPosition(this.player.x+Math.cos(angle)*120,this.player.y+Math.sin(angle)*120-40);this.targetText.setText(`${target.name} ${dist<105?'· 已到达':['→','↘','↓','↙','←','↖','↑','↗'][(Math.round(angle/(Math.PI/4))+8)%8]}`);this.targetText.setVisible(!blocked);if(dist<70){targetId='';this.targetMark.clear();this.targetText.setVisible(false);}void cam;}
 if(!expeditionOpen)setWorldLocation({id:'zhaoyao',name:'招摇山',area:this.near?.name??(this.player.x<650?'西海岸 · 招摇山麓':this.player.x>1650?'深林 · 狌狌出没处':this.player.y<700?'山中 · 迷榖古木':'溪谷 · 循水小径'),x:this.player.x,y:this.player.y,width:2400,height:1500,points:spots});
 $('#location').textContent=this.player.x<650?'西海岸 · 招摇山麓':this.player.x>1650?'深林 · 狌狌出没处':this.player.y<700?'山中 · 迷榖古木':'溪谷 · 循水小径';
 trailMini.element.hidden=modal||paused||journal||mapOpen||artDialog.open||expeditionOpen||worldMapOpen||campaignOpen()||comparisonOpen()||recallOpen()||!state.started;
 if(!expeditionOpen)trailMini.update(this.player.x,this.player.y,this.near?.name??$('#location').textContent!,state.facts);
 if(time-this.lastSave>4500&&!blocked){persist();this.lastSave=time;}
}
}
const gameHost = $('#game');
const startDensity = scenePixelRatio(gameHost.clientWidth, gameHost.clientHeight);
new Phaser.Game({
 type:Phaser.AUTO, parent:gameHost, backgroundColor:'#b8c9ac',
 scale:{mode:Phaser.Scale.FIT, width:Math.round(gameHost.clientWidth*startDensity), height:Math.round(gameHost.clientHeight*startDensity)},
 scene:Trail, render:{antialias:true}, audio:{noAudio:true}, input:{keyboard:true}
});
window.addEventListener('beforeunload',persist);
