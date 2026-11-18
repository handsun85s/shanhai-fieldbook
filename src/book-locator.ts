import {chapters,zoomAt} from './world-data.mjs';
import './book-locator.css';

const W=2300,H=1500;
type Point={x:number;y:number};
type Frame={x:number;y:number;w:number;h:number};
let current:HTMLDialogElement|null=null;

function landDrawing(){
  return `<rect x="-10" y="-10" width="2320" height="1520" fill="#bfd7cf"/>
    <g fill="none" stroke="#8bb6ab" stroke-width="3" opacity=".34">${Array.from({length:10},(_,i)=>
      `<path d="M-20 ${i*172}q130 -29 275 -5t275 0t275 0t275 0t275 0t275 0t275 0t275 0t275 0"/>`).join('')}</g>
    <path d="M438 395Q580 151 893 178T1352 137Q1618 124 1766 351L1868 530 1804 698 1850 923Q1841 1117 1652 1211L1410 1250Q1200 1314 1040 1270L790 1243Q635 1259 519 1074L412 902 458 711 407 583Z" fill="#ddd9b7" stroke="#97ad95" stroke-width="7"/>
    <path d="M669 456Q835 260 1054 296L1432 289Q1621 338 1660 588L1690 864Q1621 1068 1398 1103L1003 1165Q769 1107 664 947L585 713Z" fill="#c8ceaa" stroke="#afbc9e" stroke-width="3"/>
    <g fill="none" stroke="#a8bd9d" stroke-width="4" opacity=".8">
      <path d="M707 664q120-217 243-191t198-105m78 488q177-69 303-35t187-57M730 1007q114 53 188 35"/>
      <path d="M712 685q112-213 240-186t202-111m79 490q182-78 303-40t182-51"/>
    </g>
    <g stroke="#92b9a8" stroke-width="15" fill="none" stroke-linecap="round">
      <path d="M900 545q98 95 246 72t258 57q128 120 375 92"/><path d="M813 871q124-61 227 10t248 10q125-21 223 84t225 11"/>
    </g>`;
}

function nodes(volume:number){
  return chapters.map((c,i)=>{
    const active=c.number===volume;
    return `<g transform="translate(${c.x},${c.y})" class="loc-node${active?' loc-here':''}">
      ${active?'<circle cy="-7" r="100" fill="#b45b3533"/><path d="M-13 -63L0 -42 13 -63Z" fill="#984e32"/><rect x="-61" y="-98" width="122" height="39" rx="19" fill="#984e32"/><text y="-72" class="loc-pin-name">你在这里</text>':''}
      <rect x="-92" y="-39" width="184" height="73" rx="18" fill="${active?'#415f4a':'#f7f0d9'}" stroke="${active?'#a87147':'#9aa58c'}" stroke-width="${active?6:3}"/>
      <text y="-13" class="loc-no">卷 ${String(i+1).padStart(2,'0')}</text><text y="17" class="loc-name">${c.name}</text></g>`;
  }).join('');
}

export function closeBookLocator(){current?.close();}

export function openBookLocator(volume:number,place:string):void{
  if(current?.open)return;
  const chapter=chapters.find(c=>c.number===volume)??chapters[0];
  const dialog=document.createElement('dialog');current=dialog;dialog.className='book-locator';
  dialog.setAttribute('aria-label','十八卷全书定位');
  dialog.innerHTML=`<div class="loc-head"><div><small>山海行记 · 全书定位</small><h2>人物在哪里</h2></div>
    <button type="button" class="loc-close">返回步道 ×</button></div>
    <p class="loc-place"><b></b><span></span></p>
    <div class="loc-frame"><svg class="loc-svg" viewBox="0 0 2300 1500" role="img" tabindex="0" aria-label="十八卷方位示意，可用方向键平移，加减键缩放">
      ${landDrawing()}${nodes(chapter.number)}</svg><span class="loc-north">北 ↑</span></div>
    <div class="loc-tools"><div><button data-zoom="-1" aria-label="缩小全书地图">−</button><output>100%</output><button data-zoom="1" aria-label="放大全书地图">＋</button></div>
      <button data-all>全貌</button><button data-here>定位人物</button></div>
    <p class="loc-note">依篇名方位排布的阅读示意图。拖动平移，滚轮或双指缩放。</p>`;
  const $=<T extends Element>(s:string)=>dialog.querySelector<T>(s)!;
  $('.loc-place b').textContent='卷'+chapter.number+' · '+chapter.name;
  $('.loc-place span').textContent=place;
  const svg=$<SVGSVGElement>('.loc-svg'),out=$<HTMLOutputElement>('output');
  let view:Frame={x:0,y:0,w:W,h:H};
  function apply(next:Frame){
    view={...next,x:Math.max(0,Math.min(W-next.w,next.x)),y:Math.max(0,Math.min(H-next.h,next.y))};
    svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);
    out.value=Math.round(100*W/view.w)+'%';
    $<HTMLButtonElement>('[data-zoom="-1"]').disabled=view.w>=W-.01;
    $<HTMLButtonElement>('[data-zoom="1"]').disabled=view.w<=460.01;
  }
  const center=()=>({x:view.x+view.w/2,y:view.y+view.h/2});
  const locate=()=>{
    const width=svg.clientWidth<520?920:1360, height=width*H/W;
    apply({x:chapter.x-width/2,y:chapter.y-height/2,w:width,h:height});
  };
  const point=(x:number,y:number)=>{
    const matrix=svg.getScreenCTM();
    return matrix?new DOMPoint(x,y).matrixTransform(matrix.inverse()):center();
  };
  const zoom=(factor:number,anchor=center())=>apply(zoomAt(view,factor,anchor));
  $<HTMLButtonElement>('.loc-close').onclick=()=>dialog.close();
  $<HTMLButtonElement>('[data-all]').onclick=()=>apply({x:0,y:0,w:W,h:H});
  $<HTMLButtonElement>('[data-here]').onclick=locate;
  dialog.querySelectorAll<HTMLButtonElement>('[data-zoom]').forEach(b=>b.onclick=()=>zoom(b.dataset.zoom==='1'?1.35:1/1.35));
  svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.15:1/1.15,point(e.clientX,e.clientY));},{passive:false});
  const touches=new Map<number,Point>();
  const midpoint=(a:Point,b:Point)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
  svg.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    svg.setPointerCapture(e.pointerId);touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  });
  svg.addEventListener('pointermove',e=>{
    const last=touches.get(e.pointerId);if(!last)return;
    const previous=[...touches.values()];touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const active=[...touches.values()];
    if(active.length===1){
      const a=point(last.x,last.y),b=point(e.clientX,e.clientY);
      apply({...view,x:view.x+a.x-b.x,y:view.y+a.y-b.y});
    }else if(active.length===2){
      const d0=dist(previous[0],previous[1]),d1=dist(active[0],active[1]);
      if(d0<5||d1<5)return;
      const before=midpoint(previous[0],previous[1]),after=midpoint(active[0],active[1]);
      const anchor=point(before.x,before.y);zoom(d1/d0,anchor);
      const moved=point(after.x,after.y);apply({...view,x:view.x+anchor.x-moved.x,y:view.y+anchor.y-moved.y});
    }
  });
  const release=(e:PointerEvent)=>touches.delete(e.pointerId);
  svg.addEventListener('pointerup',release);svg.addEventListener('pointercancel',release);svg.addEventListener('lostpointercapture',release);
  svg.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.key==='+'||e.key==='=')zoom(1.3);
    else if(e.key==='-')zoom(1/1.3);
    else if(e.key.startsWith('Arrow')){
      const x=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0,y=e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0;
      apply({...view,x:view.x+x*view.w*.11,y:view.y+y*view.h*.11});
    }else return;
    e.preventDefault();
  });
  dialog.addEventListener('keydown',e=>e.stopPropagation());
  dialog.addEventListener('cancel',e=>{e.preventDefault();dialog.close();});
  dialog.addEventListener('close',()=>{
    dialog.remove();if(current===dialog)current=null;
    document.dispatchEvent(new Event('booklocatorclose'));
  },{once:true});
  document.body.append(dialog);dialog.showModal();locate();
}
