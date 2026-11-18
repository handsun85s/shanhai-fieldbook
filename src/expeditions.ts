import {openComparison,comparisonOpen} from './comparison';
import {createMinimap} from './minimap';
import {assetPath} from './assets';
import {clayArt,travelerHeight} from './clay';
import {mountains,type Mountain,type Observation} from './mountains';
import {restoreExp,addObservation,EXP_KEY} from './expedition-progress.mjs';
import {readSave,writeSave} from './storage.mjs';
import {sound} from './sound';
import {openWorldMap,worldMapOpen,setWorldLocation} from './worldmap';
import {source} from './content';
import {creature,creatureURL,sheetMarkup,drawFrame,creatureFolder} from './creatures';
import {makeEnvironment,paintTerrain,paintFlow} from './environment';
import {findPath,moveSafely,nearestWalkable} from './navigation.mjs';
import {mountObservation} from './observation';
import {openRecall,recallOpen,recallDone,noteText,safeText} from './learning';
import './expeditions.css';
import './evidence.css';
export let expeditionOpen=false;
const saved=readSave(EXP_KEY);let storageOK=saved.ok;
let progress:Record<string,string[]>=restoreExp(saved.raw,mountains);
const root=document.createElement('section');root.id='expedition';root.hidden=true;root.setAttribute('aria-label','南山经山岳探索');document.body.append(root);
const dialog=document.createElement('dialog');dialog.className='exp-dialog';dialog.setAttribute('aria-label','山中观察');document.body.append(dialog);
let mountain:Mountain|null=null,raf=0,loadGeneration=0,x=180,y=680;
let walkToPoint=(name:string)=>{};
let route:{x:number;y:number}[]=[];const keys=new Set<string>();let cleanup=()=>{};
const pictures=new Map<string,HTMLImageElement>();
async function loadPicture(url:string){const old=pictures.get(url);if(old?.complete&&old.naturalWidth)return old;const img=new Image();img.decoding='async';await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(Error('图片加载失败'));img.src=url;});pictures.set(url,img);return img;}
const $=<T extends HTMLElement>(s:string)=>root.querySelector<T>(s)!;
function stop(){route=[];keys.clear();}
function closeCard(){cleanup();cleanup=()=>{};sound.stopCall();stop();}
dialog.addEventListener('close',closeCard);
document.addEventListener('worldmapclose',stop);
document.addEventListener('comparisonclose',stop);
document.addEventListener('localmaptravel',e=>{const d=(e as CustomEvent).detail;if(mountain?.id===d.mountain)walkToPoint(d.point);});
document.addEventListener('soundchange',()=>{const b=root.querySelector('#exp-sound');if(b)b.textContent=sound.enabled?'静音':'开启声音';});
function save(){storageOK=writeSave(EXP_KEY,progress);return storageOK?'发现已保存 · 此浏览器':'无法保存 · 请勿关闭页面';}
function end(){walkToPoint=()=>{};loadGeneration++;cancelAnimationFrame(raf);closeCard();dialog.close();root.hidden=true;expeditionOpen=false;mountain=null;}
export function goExpedition(id:string){if(id==='zhaoyao'){end();return;}const next=mountains.find(m=>m.id===id);if(next){expeditionOpen=true;root.hidden=false;void enter(next);}}
export function openExpeditions(){walkToPoint=()=>{};loadGeneration++;cancelAnimationFrame(raf);closeCard();dialog.close();expeditionOpen=true;root.hidden=false;mountain=null;
 root.innerHTML=`<div class="exp-shell"><div class="exp-top"><div><small>南山经 · 黏土山海</small><h1>山海舆图</h1></div><div class="exp-top-actions"><button class="exp-world">全书地图 ↗</button><button class="exp-return">返回招摇山 ×</button></div></div><p>观察外形，核对原文，留下自己的发现。记录齐全后，试试不用手记的“山行回想”。</p><button class="compare-entry" id="atlas-compare">跨山线索对照 · 比外形、听声音、辨方向 ↗</button><div class="mountain-cards">${mountains.map((m,i)=>`<button data-mountain="${m.id}"><span class="mountain-no">0${i+2}</span>${sheetMarkup(m.points[0].id)}<small>${m.route}</small><h2>${m.name}</h2><p>${m.subtitle}</p><span>${progress[m.id].length} / ${m.points.length} 条记录 · ${recallDone(m.id)?'回想已完成':'进入山中 →'}</span></button>`).join('')}</div><p class="exp-foot">当前开放堂庭、杻阳、青丘；途中还有未制作山岳，选山不代表原文直接相邻。<a href="${source}" target="_blank" rel="noopener">核对原文 ↗</a></p></div>`;
 $('#atlas-compare').onclick=openComparison;$('.exp-world').onclick=()=>openWorldMap();$('.exp-return').onclick=end;root.querySelectorAll<HTMLButtonElement>('[data-mountain]').forEach(b=>b.onclick=()=>void enter(mountains.find(m=>m.id===b.dataset.mountain)!));
}
async function enter(m:Mountain){
 walkToPoint=()=>{};const generation=++loadGeneration;cancelAnimationFrame(raf);closeCard();dialog.close();mountain=m;x=180;y=680;
 const {world,props}=makeEnvironment(m.id,m.points);if(m.id==='tangting'){props.push({x:1020,y:300,height:220,url:assetPath(creatureFolder+'yanwood.webp'),radius:18});world.obstacles.push({x:1020,y:300,r:18});}
 const spawn=nearestWalkable(world,{x,y});if(spawn){x=spawn.x;y=spawn.y;}
 root.innerHTML=`<div class="exp-top exp-hud"><div><small>${m.route}</small><h1>${m.name} <span>${m.subtitle}</span></h1></div><div><button id="exp-world">全书地图</button><button id="exp-book">山中手记</button><button id="exp-atlas">换一座山</button><button id="exp-home">招摇山</button></div></div><div class="exp-field"><canvas aria-label="${m.name}探索地图，方向键或点击地面移动" tabindex="0"></canvas><div class="exp-task"><button class="task-toggle" aria-label="收起探索任务" aria-expanded="true">收起</button><b>此山 · 寻找依据</b><p>${m.intro}</p><span id="exp-count"></span><div class="exp-destinations">${m.points.map(p=>`<button data-walk="${p.id}" disabled>${p.name} ↗</button>`).join('')}<button id="exp-recall">山行回想 ↗</button></div></div><button id="exp-observe" hidden></button><div class="exp-water">${m.water}</div><div class="exp-touch" aria-label="探险方向键"><button data-key="arrowup" aria-label="向上走">↑</button><div><button data-key="arrowleft" aria-label="向左走">←</button><button data-key="arrowdown" aria-label="向下走">↓</button><button data-key="arrowright" aria-label="向右走">→</button></div></div><div class="exp-load" role="status"><h2>正在布置${m.name}…</h2><p>草木、异兽与小径正在就位。</p></div></div><div class="exp-bottom"><span>点地面寻路 · 从桥上过河</span><button id="exp-sound">${sound.enabled?'静音':'开启声音'}</button><span id="exp-save" role="status">${save()}</span></div>`;
 $('#exp-world').onclick=()=>{stop();openWorldMap();};$('#exp-atlas').onclick=openExpeditions;$('#exp-home').onclick=end;$('#exp-book').onclick=book;$('#exp-recall').onclick=()=>{stop();openRecall(m.id,progress[m.id].length===m.points.length);};
 $('#exp-sound').onclick=async()=>{if(sound.enabled)sound.mute();else await sound.start();};
 $('.task-toggle').onclick=()=>{const collapsed=$('.exp-task').classList.toggle('collapsed');$('.task-toggle').textContent=collapsed?'展开':'收起';$('.task-toggle').setAttribute('aria-expanded',String(!collapsed));$('.task-toggle').setAttribute('aria-label',collapsed?'展开探索任务':'收起探索任务');};
 root.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key!);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.key!);});
 const mini=createMinimap($('.exp-field'),{id:m.id,name:m.name,width:world.width,height:world.height,points:m.points},()=>{stop();openWorldMap('local');});
 const travelerURL=assetPath(creatureFolder+'traveler-walk.webp');const urls=[travelerURL,...props.map(p=>p.url),...m.points.map(p=>creature(p.id)?creatureURL(p.id):p.image)];
 try{await Promise.all([...new Set(urls)].map(loadPicture));}catch{if(generation!==loadGeneration)return;$('.exp-load').innerHTML='<h2>有些素材还没加载好</h2><p>检查网络后重试，记录不会丢失。</p><button id="exp-retry">重新加载</button>';$('#exp-retry').onclick=()=>void enter(m);return;}
 if(generation!==loadGeneration)return;$('.exp-load').hidden=true;
 const backdrop=document.createElement('canvas');backdrop.width=world.width;backdrop.height=world.height;paintTerrain(backdrop.getContext('2d')!,world,m.color);
 const canvas=$<HTMLCanvasElement>('canvas'),c=canvas.getContext('2d')!;let camera={x:0,y:0,zoom:1},last=0,lastHUD=0,facing=1;
 const walk=(destination:{x:number;y:number})=>{route=findPath(world,{x,y},destination);$('#exp-save').textContent=!storageOK?'无法保存 · 请勿关闭页面':route.length?'已规划路线 · 会从桥上过河':'这里暂时走不到，试试附近的地面。';};
 walkToPoint=name=>{const p=m.points.find(p=>p.name===name);if(p)walk({x:p.x,y:p.y+70});};
 root.querySelectorAll<HTMLButtonElement>('[data-walk]').forEach(b=>{b.disabled=false;b.onclick=()=>{const p=m.points.find(p=>p.id===b.dataset.walk)!;walk({x:p.x,y:p.y+70});};});
 canvas.onclick=e=>{if(dialog.open||worldMapOpen||comparisonOpen()||recallOpen())return;const r=canvas.getBoundingClientRect();walk({x:(e.clientX-r.left)/camera.zoom+camera.x,y:(e.clientY-r.top)/camera.zoom+camera.y});};
 const draw=(time:number)=>{if(generation!==loadGeneration)return;raf=requestAnimationFrame(draw);if(time-last<32)return;const dt=Math.min(.05,last?(time-last)/1000:0);last=time;if(document.hidden)return;const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(2,devicePixelRatio||1);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}const z=Math.max(w<600?.8:1,w/world.width,h/world.height);camera={x:Math.max(0,Math.min(world.width-w/z,x-w/z/2)),y:Math.max(0,Math.min(world.height-h/z,y-h/z*.62)),zoom:z};
 let moving=false;if(!dialog.open&&!worldMapOpen&&!comparisonOpen()&&!recallOpen()){let dx=Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a')),dy=Number(keys.has('arrowdown')||keys.has('s'))-Number(keys.has('arrowup')||keys.has('w'));if(dx||dy)route=[];else if(route.length){dx=route[0].x-x;dy=route[0].y-y;if(Math.hypot(dx,dy)<5){route.shift();dx=dy=0;}}const len=Math.hypot(dx,dy);if(len){const distance=Math.min(200*dt,route.length?len:200*dt),next=moveSafely(world,{x,y},dx/len*distance,dy/len*distance);moving=Math.hypot(next.x-x,next.y-y)>.1;if(dx)facing=dx<0?-1:1;x=next.x;y=next.y;}}
 c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=m.color;c.fillRect(0,0,w,h);c.save();c.scale(z,z);c.translate(-camera.x,-camera.y);c.drawImage(backdrop,0,0);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;paintFlow(c,world,time,reduced);
 if(route.length){c.strokeStyle='#fff9db';c.setLineDash([5,9]);c.lineWidth=2;c.beginPath();c.moveTo(x,y);route.forEach(p=>c.lineTo(p.x,p.y));c.stroke();c.setLineDash([]);}
 const objects=[...props.map(p=>({...p,id:'',frame:0,flip:false,frames:1})),...m.points.map(p=>({x:p.x,y:p.y,height:p.id==='fox'?220:200,url:creature(p.id)?creatureURL(p.id):p.image,radius:0,id:p.id,frame:!reduced&&creature(p.id)&&Math.hypot(x-p.x,y-p.y)<240&&time%7000<1900?1+Math.floor(time/300)%2:0,flip:false,frames:creature(p.id)?3:1})),{x,y,height:travelerHeight,url:travelerURL,radius:0,id:'player',frame:moving&&!reduced?[0,1,0,2][Math.floor(time/150)%4]:0,flip:facing<0,frames:3}];
 for(const o of objects.sort((a,b)=>a.y-b.y)){if(o.x<camera.x-250||o.x>camera.x+w/z+250||o.y<camera.y-10||o.y>camera.y+h/z+300)continue;const img=pictures.get(o.url)!;const width=o.height*(img.naturalWidth/o.frames)/img.naturalHeight;const behind=o.id!=='player'&&y<o.y&&y>o.y-o.height&&Math.abs(x-o.x)<width*.4;c.globalAlpha=behind?.35:1;c.fillStyle='#36523e22';c.beginPath();c.ellipse(o.x,o.y-2,o.id==='player'?24:width*.25,8,0,0,7);c.fill();drawFrame(c,img,o.x,o.y,o.height,o.frame,o.flip,o.frames);}c.globalAlpha=1;
 for(const p of m.points){c.fillStyle=progress[m.id].includes(p.id)?'#587856':'#fff6dc';c.beginPath();c.arc(p.x,p.y+30,12,0,7);c.fill();c.fillStyle='#fff6ddee';c.beginPath();c.roundRect(p.x-60,p.y+47,120,28,7);c.fill();c.fillStyle='#375440';c.textAlign='center';c.font='14px Microsoft YaHei';c.fillText(p.name,p.x,p.y+66);}c.restore();
 if(time-lastHUD>100){lastHUD=time;const near=m.points.find(p=>Math.hypot(x-p.x,y-(p.y+60))<100),area=near?.name??'山间小径';setWorldLocation({id:m.id,name:m.name,area,x,y,width:world.width,height:world.height,points:m.points});mini.update(x,y,area,progress[m.id]);mini.element.hidden=dialog.open||worldMapOpen||comparisonOpen()||recallOpen();const button=$<HTMLButtonElement>('#exp-observe');button.hidden=!near||dialog.open||worldMapOpen||comparisonOpen()||recallOpen();if(near){button.textContent=`${near.name} · ${progress[m.id].includes(near.id)?'重温':'停步观察'} [E]`;button.onclick=()=>observe(near);}$('#exp-count').textContent=`已记录 ${progress[m.id].length} / ${m.points.length}${progress[m.id].length===m.points.length?' · 可以开始回想':''}`;}
 };raf=requestAnimationFrame(draw);canvas.focus();
}
function observe(p:Observation){closeCard();const m=mountain!;cleanup=mountObservation(dialog,p,m.id,progress[m.id].includes(p.id),()=>{progress=addObservation(progress,m.id,p.id,mountains);$('#exp-save').textContent=save();sound.cue();},()=>dialog.close());if(!dialog.open)dialog.showModal();}
function book(){closeCard();const m=mountain!;dialog.innerHTML=`<button class="exp-close" aria-label="关闭手记">×</button><small>${m.name} · ${progress[m.id].length}/${m.points.length}</small><h2>本山手记</h2>${m.points.map(p=>`<article><h3>${progress[m.id].includes(p.id)?p.name:'尚待观察'}</h3>${progress[m.id].includes(p.id)?`<blockquote>${p.quote}</blockquote><p>${p.text}</p>${noteText(m.id,p.id)?`<p class="note-quote">我的发现：${safeText(noteText(m.id,p.id))}</p>`:''}<button data-review="${p.id}">重看插图与我的发现 ↗</button>`:'<p>沿山径走近标记，留下一条依据。</p>'}</article>`).join('')}<button class="exp-book-compare">跨山线索对照 ↗</button><button class="recall-link">${recallDone(m.id)?'再做一次':'开始'}山行回想 ↗</button>${m.id==='tangting'?'<p class="exp-foot">场景中的红果树取材“多棪木”；附注把其果比作红色的奈。树形、叶片和具体大小是演绎。</p>':''}`;dialog.querySelector<HTMLButtonElement>('.exp-close')!.onclick=()=>dialog.close();dialog.querySelectorAll<HTMLButtonElement>('[data-review]').forEach(b=>b.onclick=()=>observe(m.points.find(p=>p.id===b.dataset.review)!));dialog.querySelector<HTMLButtonElement>('.exp-book-compare')!.onclick=()=>{dialog.close();stop();openComparison();};dialog.querySelector<HTMLButtonElement>('.recall-link')!.onclick=()=>{dialog.close();openRecall(m.id,progress[m.id].length===m.points.length);};if(!dialog.open)dialog.showModal();}
document.addEventListener('keydown',e=>{if(!expeditionOpen||dialog.open||worldMapOpen||comparisonOpen()||recallOpen()||!mountain)return;if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(e.key.toLowerCase())){e.preventDefault();keys.add(e.key.toLowerCase());}if(e.key.toLowerCase()==='e')root.querySelector<HTMLButtonElement>('#exp-observe:not([hidden])')?.click();});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>{keys.clear();if(document.hidden)sound.stopCall();});
