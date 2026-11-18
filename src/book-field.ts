import {assetPath} from './assets';
import {drawFrame} from './creatures';
import {groundShadow, scenePixelRatio} from './scene-props';
import {randomSequence} from './terrain-paths';
import {chapterBiome, passageTerrain} from './book-field-terrain.mjs';
import {closeBookLocator,openBookLocator} from './book-locator';
import './book-field.css';

type Point = {x: number; y: number};
type FieldOptions = {volume: number; name: string; place: string; passage?:{index:number;text:string}; onArrive: () => void};
type Stop = 'lookout' | 'study';
const WIDTH = 1000, HEIGHT = 600;
const ink = '#384934';
const atlasURL = assetPath('book-field/landscapes.webp');
const passageArtURL = assetPath('book-field/passage-landscapes.webp');
const walkerURL = assetPath('art-clay-v2/traveler-walk.webp');
const pictures = new Map<string, Promise<HTMLImageElement>>();
const landscapes = [
  {name:'青峰山道',ground:'#b4bc79',sky:'#afc8be',trail:'#d2b888',shadow:'#938459'},
  {name:'海岬沙岸',ground:'#e2b57d',sky:'#9acbc9',trail:'#e8bd87',shadow:'#b08b61'},
  {name:'河泽高岸',ground:'#aab47c',sky:'#a4c7b4',trail:'#cfbc8c',shadow:'#8d9067'},
  {name:'赤岭荒台',ground:'#c88b6c',sky:'#d7b0a0',trail:'#dcab83',shadow:'#986f60'},
  {name:'裸岩水岸',ground:'#bcb4a3',sky:'#b1c6cd',trail:'#c9bda9',shadow:'#7d7a76'},
  {name:'砾石山台',ground:'#c8b7a1',sky:'#b8c8d0',trail:'#dbbea1',shadow:'#96826b'},
  {name:'林间隙地',ground:'#aaa878',sky:'#a2ba8c',trail:'#c1ac79',shadow:'#707857'},
  {name:'山脚遥察',ground:'#c9a082',sky:'#b8cbd0',trail:'#d7b493',shadow:'#957e6c'},
];
// These activities examine the miniature scene. Its forms are not textual claims about a named place.
const lookouts = [
  ['望峰台','沿山脊的轮廓看过去，近处的峰挡住远处的峰。试着找出三层山。'],
  ['山隙','在两座近峰之间找一找，远方露出了一线颜色较浅的山。'],
  ['林缘','对比近树和远树。树冠的纹理在近处清楚，到远处慢慢变淡。'],
  ['树影下','从近处的树根向上看，枝叶间有哪些缝隙让光落到地面？'],
  ['群峰台','把视线从画面左边移向右边，数一数有几条山脊彼此遮挡。'],
  ['临水台','对照赤水上生树的记载，想一想怎样在图上表示树与水的相对位置。'],
  ['石拱岸','看看海崖中的拱洞，能从洞口望见后面的海面吗？'],
  ['山下望台','原句写烛阴居于钟山下。从崖壁底部往上看，留意山脚和山顶的区别。'],
  ['汤谷水畔','从岸边顺着水的轮廓望出去，再从原文找一找扶桑生长的位置。'],
  ['水湾','沿一段水湾从左看到右，看看两岸怎样随着河道转弯。'],
  ['望峰台','先看山脚，再往上找到峰顶。原句把开明兽放在山上还是渊底？'],
  ['曲岸','想象自己在远景里划船，沿同一条水道一直走，哪儿会转弯？'],
  ['望川台','从近岸向远处看，宽水面和窄水道怎样连在一起？'],
  ['听潮岸','远望海中的山。原文把流波山写在东海中，留意陆地和海水的位置。'],
  ['赤岭口','找找轮廓顶端较平的山，再沿山崖望向较低的谷地。'],
  ['斜光坡','看看岩壁的亮面和暗面，光从画面的哪一边照过来？'],
  ['泽畔','从岸边观察远处水面。再翻原文，在竹林的南侧找封渊。'],
  ['河曲台','远景中的水道把一片片陆地分开。试着沿水边描出其中一片的轮廓。'],
] as const;

function picture(url: string) {
  let pending = pictures.get(url);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve,reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => { pictures.delete(url); reject(new Error('地景素材暂时无法读取')); };
      image.src = url;
    });
    pictures.set(url,pending);
  }
  return pending;
}
const clamp = (v:number, lo:number, hi:number) => Math.max(lo,Math.min(hi,v));
const distance = (a:Point,b:Point) => Math.hypot(a.x-b.x,a.y-b.y);
// Specific chapter stations override the broad regional illustration when the
// scene is explicitly placed in woodland, at the foot of a mountain or in water.
const studyScenery:Record<number,number> = {3:6,4:6,6:2,8:7,9:2,11:0,14:1,17:2};
function makeRoute(seed:number, mirror:boolean, floor:number) {
  const random = randomSequence(seed);
  const point = (x:number,y:number) => ({x:mirror?WIDTH-x:x,y:floor+(y-255)*(HEIGHT-floor)/(HEIGHT-255)});
  const nodes = [
    point(90,455+random()*55), point(240+random()*60,390+random()*35),
    point(475+random()*65,298+random()*38), point(700+random()*38,375+random()*45),
    point(443+random()*74,475+random()*40), point(890,320+random()*75),
  ];
  const sections = [[0,1],[1,2],[2,3],[1,4],[4,3],[3,5]].map(([from,to])=>{
    const a=nodes[from],b=nodes[to],indices=[from];
    for(let step=1;step<7;step++){
      const t=step/7, smooth=t*t*(3-2*t);
      indices.push(nodes.length);
      nodes.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*smooth});
    }
    indices.push(to);
    return indices;
  });
  const edges=sections.flatMap(section=>section.slice(1).map((end,i)=>[section[i],end]));
  return {nodes,sections,edges};
}
// Find the short route from either branch, including a player halfway along an edge.
function waypoints(nodes:Point[], connections:number[][], position:Point, end:number) {
  const edges = connections.map(([i,j]) => {
    const a=nodes[i],b=nodes[j],dx=b.x-a.x,dy=b.y-a.y;
    const t=clamp(((position.x-a.x)*dx+(position.y-a.y)*dy)/(dx*dx+dy*dy),0,1);
    const projection={x:a.x+t*dx,y:a.y+t*dy};
    return {i,j,projection,d:distance(position,projection)};
  });
  const nearest = edges.reduce((a,b)=>a.d<b.d?a:b);
  const itinerary = (start:number):Point[] => {
    const queue=[{index:start,visited:[start],total:0}];
    while(queue.length){
      queue.sort((a,b)=>a.total-b.total);
      const step=queue.shift()!;
      if(step.index===end)return step.visited.map(i=>nodes[i]);
      for(const [a,b] of connections){
        const next=step.index===a?b:step.index===b?a:-1;
        if(next>=0&&!step.visited.includes(next))queue.push({index:next,visited:[...step.visited,next],total:step.total+distance(nodes[step.index],nodes[next])});
      }
    }
    return [];
  };
  const options=[nearest.i,nearest.j].map(i=>[nearest.projection,...itinerary(i)]);
  const length=(route:Point[])=>route.reduce((sum,p,i)=>sum+(i?distance(p,route[i-1]):0),0);
  return length(options[0])<length(options[1])?options[0]:options[1];
}

function paintBackground(ctx:CanvasRenderingContext2D, biome:number, seed:number, nodes:Point[], sections:number[][], crop:number, image?:HTMLImageElement) {
  const palette=landscapes[biome];
  if(image){
    const w=image.naturalWidth/2,h=image.naturalHeight/2,cell=biome%4;
    const offset=(seed%599)/599;
    ctx.drawImage(image,(cell%2)*w+w*crop*offset,Math.floor(cell/2)*h+h*crop*.5,w*(1-crop),h*(1-crop),0,0,WIDTH,HEIGHT);
  } else {
    const wash=ctx.createLinearGradient(0,0,0,HEIGHT);
    wash.addColorStop(0,palette.sky);wash.addColorStop(.35,palette.sky);
    wash.addColorStop(.39,palette.ground);wash.addColorStop(1,palette.ground);
    ctx.fillStyle=wash;ctx.fillRect(0,0,WIDTH,HEIGHT);
  }
  const random=randomSequence(seed*1531);
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  ctx.lineWidth=20;ctx.strokeStyle=palette.trail;ctx.globalAlpha=.45;
  ctx.beginPath();
  for(const section of sections){
    section.forEach((index,i)=>{const p=nodes[index];if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});
  }
  ctx.stroke();
  for(const section of sections)for(let index=1;index<section.length;index++){
    const a=section[index-1],b=section[index];
    const p=nodes[a],q=nodes[b],len=distance(p,q);
    const nx=-(q.y-p.y)/len,ny=(q.x-p.x)/len;
    // Sparse exposed-clay grains keep the track embedded in the photographic surface.
    for(let i=0;i<len*1.4;i++) {
      const t=random(),offset=(random()-.5)*28,rx=p.x+(q.x-p.x)*t+nx*offset,ry=p.y+(q.y-p.y)*t+ny*offset;
      ctx.globalAlpha=.22+random()*.25;ctx.fillStyle=i%4?palette.trail:palette.shadow;
      ctx.beginPath();ctx.ellipse(rx,ry,1+random()*2,.4+random()*.9,0,0,2*Math.PI);ctx.fill();
    }
  }
  ctx.restore();
}

function marker(ctx:CanvasRenderingContext2D, point:Point, name:string, destination:boolean, scale:number) {
  const color=destination?'#a95234':'#476657';
  groundShadow(ctx,point.x+24,point.y-6,44);
  ctx.save();ctx.translate(point.x+24,point.y-6);ctx.scale(scale,scale);
  ctx.lineCap='round';ctx.lineWidth=5;ctx.strokeStyle='#795f44';
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-55);ctx.stroke();
  ctx.lineWidth=1.5;ctx.strokeStyle='#dac297';ctx.beginPath();ctx.moveTo(-1,-3);ctx.lineTo(-1,-54);ctx.stroke();
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-55);ctx.quadraticCurveTo(15,-59,29,-52);
  ctx.lineTo(23,-42);ctx.lineTo(29,-34);ctx.quadraticCurveTo(15,-41,0,-35);ctx.fill();
  ctx.fillStyle='#fff1c7';ctx.beginPath();ctx.arc(11,-46,3,0,Math.PI*2);ctx.fill();
  ctx.font='600 17px "Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  const text=name.length>14?name.slice(0,13)+'…':name,width=Math.max(66,ctx.measureText(text).width+22);
  const originX=point.x+24;
  const labelX=(clamp(originX,6+width*scale/2,WIDTH-6-width*scale/2)-originX)/scale;
  ctx.shadowColor='#413c2650';ctx.shadowBlur=5;ctx.shadowOffsetY=3;
  ctx.fillStyle='#fff6df';ctx.beginPath();ctx.roundRect(labelX-width/2,8,width,27,7);ctx.fill();
  ctx.shadowColor='transparent';ctx.fillStyle=ink;ctx.fillText(text,labelX,22);ctx.restore();
}

export function mountBookField(host:HTMLElement, opts:FieldOptions):()=>void {
  const volume=clamp(Math.round(opts.volume)||1,1,18);
  const passage=opts.passage;
  const terrain=passage?passageTerrain(volume,passage.index,passage.text):undefined;
  const biome=terrain?.biome??studyScenery[volume]??chapterBiome(volume);
  const floor=terrain?.floor??(biome===7?437:biome===6?368:255);
  const seed=terrain?.seed??volume*2689;
  const mirror=terrain?.startRight??[2,3,7,11,16].includes(volume);
  const [lookout,discovery]=terrain?[terrain.lookout,terrain.discovery]:lookouts[volume-1];
  const place=terrain?.remote?'山脚遥察点':opts.place;
  const crop=terrain?(.015+(seed%17)*.004):0;
  const {nodes,sections,edges}=makeRoute(seed,mirror,floor),position={...nodes[0]};
  const shell=document.createElement('section');
  shell.className='book-field';
  shell.setAttribute('aria-label',opts.name+'考察步道');
  shell.innerHTML=`<div class="bf-scene"><canvas class="bf-view" tabindex="0"></canvas>
    <div class="bf-minimap"><div class="bf-map-caption"><strong>步道小图</strong><span>北 ↑</span></div>
    <svg viewBox="0 0 1000 425" preserveAspectRatio="none" aria-hidden="true"></svg>
    <div class="bf-map-key"><i></i>你的位置 <b>⚑</b>考察点</div><button type="button" class="bf-locate" aria-label="展开全书定位">全书定位 ↗</button></div></div>
    <div class="bf-dock"><div class="bf-info"><strong class="bf-where"></strong>
    <p class="bf-message" aria-live="polite"></p></div>
    <div class="bf-actions"><button class="bf-look" type="button"></button><button class="bf-go" type="button"></button></div></div>`;
  host.append(shell);
  const get=<T extends Element>(s:string)=>shell.querySelector<T>(s)!;
  const canvas=get<HTMLCanvasElement>('.bf-view');
  const ctx=canvas.getContext('2d');
  const go=get<HTMLButtonElement>('.bf-go'),look=get<HTMLButtonElement>('.bf-look');
  const where=get<HTMLElement>('.bf-where'),message=get<HTMLElement>('.bf-message');
  canvas.setAttribute('aria-label',opts.name+'步道。方向键或 WASD 移动，靠近小旗按 E 观察。也可以用下方按钮前往。');
  where.textContent=opts.name+' · '+landscapes[biome].name;
  message.textContent=terrain?.notice??'点击地面行走，或选一面路旗前往。场景为地景示意。';
  look.textContent='探访'+lookout;
  go.textContent='前往'+place;
  const svg=get<SVGSVGElement>('.bf-minimap svg');
  const routePath=sections.map(section=>section.map((i,j)=>`${j?'L':'M'}${nodes[i].x} ${nodes[i].y-180}`).join('')).join('');
  svg.innerHTML=`<rect width="1000" height="425" fill="#dedcc0"/>
    <path d="${routePath}" stroke="#fbf5d9" stroke-width="28" stroke-linecap="round" fill="none"/>
    <circle cx="${nodes[2].x}" cy="${nodes[2].y-180}" r="24" fill="#587967"/>
    <path d="M${nodes[5].x} ${nodes[5].y-162}v-64l56 14-56 17" fill="#965d37" stroke="#775132" stroke-width="10"/>
    <circle class="bf-player-pin" r="29" stroke="#fff6db" stroke-width="12" fill="#ad4c39"/></svg>`;
  const pin=get<SVGCircleElement>('.bf-player-pin');
  const ground=document.createElement('canvas');
  ground.width=WIDTH;ground.height=HEIGHT;
  const groundCtx=ground.getContext('2d');
  if(groundCtx)paintBackground(groundCtx,biome,seed,nodes,sections,crop);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const keys=new Set<string>();
  let alive=true,mapOpen=false,frame=0,last=0,pace=0,facing=nodes[5].x>position.x?1:-1;
  let route:Point[]=[],target:Stop|null=null,arrived=false,near:Stop|null=null;
  let walker:HTMLImageElement|undefined;
  let camera={left:0,w:WIDTH,xScale:1,yScale:1};
  const events=new AbortController(),listen={signal:events.signal};
  const locate=get<HTMLButtonElement>('.bf-locate');
  locate.addEventListener('click',()=>{
    if(mapOpen||arrived)return;
    mapOpen=true;keys.clear();cancelAnimationFrame(frame);frame=0;last=0;
    const context=passage?`第 ${passage.index+1} 段`+(/^第\d+段观察处$/.test(opts.place)?'':' · '+opts.place):opts.place;
    const local=at('study')?place:at('lookout')?lookout:landscapes[biome].name;
    openBookLocator(volume,context+' / '+local);
  },listen);
  document.addEventListener('booklocatorclose',()=>{
    if(!mapOpen||!alive)return;
    mapOpen=false;last=0;locate.focus({preventScroll:true});schedule();
  },listen);
  const setMessage=(value:string)=>{if(message.textContent!==value)message.textContent=value;};
  function at(stop:Stop){return distance(position,nodes[stop==='study'?5:2])<65;}
  function finish(){
    if(!alive||arrived)return;
    arrived=true;route=[];target=null;keys.clear();
    go.disabled=true;look.disabled=true;opts.onArrive();
  }
  function observe(){
    near='lookout';target=null;route=[];keys.clear();go.textContent='前往'+place;
    where.textContent=lookout+' · 地景观察';
    setMessage(discovery);look.textContent='再看'+lookout;
  }
  function visit(stop:Stop){
    if(!alive||arrived)return;
    if(at(stop)){if(stop==='study')finish();else observe();return;}
    const node=nodes[stop==='study'?5:2];
    if(target===stop||!ctx||reduced.matches) {
      Object.assign(position,node);target=null;route=[];schedule();
      if(stop==='study')finish();else observe();
      return;
    }
    target=stop;keys.clear();route=waypoints(nodes,edges,position,stop==='study'?5:2);
    where.textContent=opts.name+' · 行走中';
    setMessage('沿步道前往'+(stop==='study'?place:lookout)+'。');
    go.textContent=stop==='study'?'直接到站':'前往'+place;
    look.textContent=stop==='lookout'?'直接到路标':'探访'+lookout;
    schedule();
  }
  go.addEventListener('click',()=>visit('study'),listen);
  look.addEventListener('click',()=>visit('lookout'),listen);
  function nearUpdate(){
    const here:Stop|null=at('study')?'study':at('lookout')?'lookout':null;
    if(near===here)return;
    near=here;
    if(target)return;
    go.textContent=here==='study'?'进入考察点':'前往'+place;
    look.textContent=here==='lookout'?'观察'+lookout:'探访'+lookout;
    if(here){where.textContent=here==='study'?place:lookout;setMessage('已到达小旗旁。按 E 或点击下方按钮。');}
    else{where.textContent=opts.name+' · '+landscapes[biome].name;setMessage('沿小路走向旗标，也可以点击地面自由走动。');}
  }
  function draw(moving:boolean){
    if(!ctx)return;
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(w<1||h<1)return;
    const density=scenePixelRatio(w,h);
    if(canvas.width!==Math.round(w*density)||canvas.height!==Math.round(h*density)){canvas.width=Math.round(w*density);canvas.height=Math.round(h*density);}
    const viewWidth=Math.min(WIDTH,w*HEIGHT/h);
    camera={left:clamp(position.x-viewWidth*.5,0,WIDTH-viewWidth),w:viewWidth,xScale:w/viewWidth,yScale:h/HEIGHT};
    ctx.setTransform(density*camera.xScale,0,0,density*camera.yScale,-camera.left*density*camera.xScale,0);
    ctx.drawImage(ground,0,0);
    const player=()=>{
      const size=Math.max(60/camera.yScale,93+(position.y-245)*.105);
      groundShadow(ctx,position.x,position.y,47);
      if(walker)drawFrame(ctx,walker,position.x,position.y+size*.022,size,!moving||reduced.matches?0:[0,1,0,2][Math.floor(pace/19)%4],facing<0);
      else {ctx.fillStyle='#ac5438';ctx.strokeStyle='#fff0c9';ctx.lineWidth=3;ctx.beginPath();ctx.arc(position.x,position.y-9,10,0,Math.PI*2);ctx.fill();ctx.stroke();}
    };
    const signScale=Math.max(1,.70/camera.yScale);
    const objects=[{y:position.y,paint:player},{y:nodes[2].y-6,paint:()=>marker(ctx,nodes[2],lookout,false,signScale)},
      {y:nodes[5].y-6,paint:()=>marker(ctx,nodes[5],place,true,signScale)}];
    objects.sort((a,b)=>a.y-b.y).forEach(obj=>obj.paint());
    pin.setAttribute('cx',String(position.x));pin.setAttribute('cy',String(position.y-180));
  }
  function tick(now:number) {
    frame=0;
    if(!alive||mapOpen||arrived||document.hidden)return;
    const dt=Math.min(.06,(now-(last||now))/1000);last=now;
    let dx=Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a'));
    let dy=Number(keys.has('arrowdown')||keys.has('s'))-Number(keys.has('arrowup')||keys.has('w'));
    let step=dt*(target?262:212);
    if(!dx&&!dy&&route.length){
      const next=route[0];dx=next.x-position.x;dy=next.y-position.y;
      const remaining=distance(next,position);
      if(remaining<=step){step=remaining;route.shift();}
    }
    const length=Math.hypot(dx,dy),moved=length>0&&step>0;
    if(moved){position.x=clamp(position.x+dx/length*step,27,WIDTH-27);position.y=clamp(position.y+dy/length*step,floor,HEIGHT-29);if(Math.abs(dx)>.05)facing=Math.sign(dx);pace+=step;}
    nearUpdate();draw(moved);
    if(target&&!route.length){
      const end=target;target=null;
      if(end==='study'){finish();return;}
      go.textContent='前往'+place;observe();draw(false);
    }
    if(route.length||keys.size)schedule();else{last=0;if(moved)draw(false);}
  }
  function schedule(){if(alive&&!mapOpen&&!arrived&&!frame)frame=requestAnimationFrame(tick);}
  function stopWalking(){
    keys.clear();route=[];target=null;last=0;
    go.textContent=at('study')?'进入考察点':'前往'+place;
    look.textContent=at('lookout')?'观察'+lookout:'探访'+lookout;
  }
  canvas.addEventListener('click',e=>{
    if(arrived)return;
    canvas.focus({preventScroll:true});
    const rect=canvas.getBoundingClientRect();
    const p={x:camera.left+(e.clientX-rect.left)/camera.xScale,y:(e.clientY-rect.top)/camera.yScale};
    for(const stop of ['lookout','study'] as const){
      const n=nodes[stop==='study'?5:2];
      const scale=Math.max(1,.70/camera.yScale);
      const halfWidth=Math.max(52,(stop==='study'?place:lookout).length*9+11);
      if(Math.abs(p.x-(n.x+24))<halfWidth*scale&&p.y>n.y-6-67*scale&&p.y<n.y+36*scale){visit(stop);return;}
    }
    if(p.y<floor-8){setMessage(terrain?.remote?'原句提醒不可以上。请点击山脚平地或遥察路旗。':'远处是地景。点击脚下的平地或路旗可以前进。');return;}
    stopWalking();route=[{x:clamp(p.x,27,WIDTH-27),y:clamp(p.y,floor,HEIGHT-29)}];schedule();
  },listen);
  const controls=['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'];
  canvas.addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey||e.isComposing||arrived)return;
    const key=e.key.toLowerCase();
    if(key==='e'||key===' '){
      e.preventDefault();e.stopPropagation();
      if(!e.repeat&&near)visit(near);
    } else if(controls.includes(key)){
      e.preventDefault();e.stopPropagation();if(target)stopWalking();
      if(!keys.has(key)){
        const dx=key==='arrowright'||key==='d'?1:key==='arrowleft'||key==='a'?-1:0;
        const dy=key==='arrowdown'||key==='s'?1:key==='arrowup'||key==='w'?-1:0;
        position.x=clamp(position.x+dx*4,27,WIDTH-27);position.y=clamp(position.y+dy*4,floor,HEIGHT-29);
        if(dx)facing=dx;
      }
      route=[];keys.add(key);schedule();
    }
  },listen);
  canvas.addEventListener('keyup',e=>{const key=e.key.toLowerCase();if(controls.includes(key)){keys.delete(key);e.stopPropagation();schedule();}},listen);
  canvas.addEventListener('blur',()=>{keys.clear();},listen);
  document.addEventListener('visibilitychange',()=>{keys.clear();last=0;if(!document.hidden)schedule();},listen);
  const resize=new ResizeObserver(schedule);resize.observe(canvas);
  void picture(biome>=4?passageArtURL:atlasURL).then(image=>{if(alive&&groundCtx){paintBackground(groundCtx,biome,seed,nodes,sections,crop,image);schedule();}}).catch(()=>{});
  void picture(walkerURL).then(image=>{if(alive){walker=image;schedule();}}).catch(()=>{});
  schedule();
  return ()=>{alive=false;cancelAnimationFrame(frame);resize.disconnect();events.abort();keys.clear();if(mapOpen)closeBookLocator();shell.remove();};
}
