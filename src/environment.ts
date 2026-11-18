import {paintClayGround,clayArt} from './clay';
import {assetPath} from './assets';
import {terrain,segmentDistance} from './navigation.mjs';
export type World=ReturnType<typeof terrain>;
export type Prop={x:number;y:number;height:number;url:string;radius:number};
export function makeEnvironment(id:string,points:{x:number;y:number}[]){
 const world=terrain(id);const props:Prop[]=[];let seed=731+(id.length*97);
 const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const count=id==='zhaoyao'?44:16;
 for(let i=0;i<500&&props.length<count;i++){
  const x=world.bounds.left+rand()*(world.bounds.right-world.bounds.left),y=world.bounds.top+rand()*(world.bounds.bottom-world.bounds.top);
  if(points.some(p=>Math.hypot(x-p.x,y-p.y)<170)||Math.hypot(x-(id==='zhaoyao'?470:180),y-(id==='zhaoyao'?1120:680))<110)continue;
  if(world.river.slice(1).some((p,j)=>segmentDistance({x,y},world.river[j],p)<85))continue;
  props.push({x,y,height:140+rand()*90,url:assetPath(clayArt+'grove.webp'),radius:16});
 }
 world.obstacles=props.map(p=>({x:p.x,y:p.y,r:p.radius}));
 return {world,props};
}
export function paintTerrain(c:CanvasRenderingContext2D,world:World,color='#bdc99d'){
 const {width:w,height:h}=world;paintClayGround(c,w,h,color);
 // Sculpted distant slopes stay outside the playable region.
 for(let i=0;i<9;i++){const x=i*w/8,y=100+(i%3)*27;c.save();c.shadowColor='#35544240';c.shadowBlur=12;c.shadowOffsetY=9;const g=c.createLinearGradient(x-80,0,x+100,190);g.addColorStop(0,'#c7d7af');g.addColorStop(.4,'#7a9f85');g.addColorStop(1,'#547968');c.fillStyle=g;c.beginPath();c.moveTo(x-150,210);c.bezierCurveTo(x-80,50,x-30,20,x,55);c.bezierCurveTo(x+40,45,x+80,y,x+160,210);c.closePath();c.fill();c.restore();}
 if(world.id==='zhaoyao'){c.fillStyle='#70aaa6';c.fillRect(0,0,330,h);c.fillStyle='#e5d1a4';c.fillRect(325,0,30,h);}
 const path=world.id==='zhaoyao'?[[470,1120],[870,1110],[1230,990],[1310,485],[1790,510],[1930,740]]:[[180,680],[300,490],[440,330],[850,350],[970,550],[590,710]];
 c.save();c.strokeStyle='#b7a577';c.lineWidth=52;c.lineJoin='round';c.lineCap='round';c.shadowColor='#66734440';c.shadowBlur=9;c.shadowOffsetY=6;c.beginPath();path.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.shadowColor='transparent';c.strokeStyle='#e5d4a7';c.lineWidth=42;c.stroke();c.strokeStyle='#f1e3bb';c.lineWidth=3;c.stroke();c.restore();
 c.save();c.lineJoin='round';c.lineCap='round';c.beginPath();world.river.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle='#9da879';c.lineWidth=72;c.stroke();c.strokeStyle='#e1cf9c';c.lineWidth=63;c.stroke();c.strokeStyle='#579b97';c.lineWidth=48;c.stroke();c.strokeStyle='#87c7bb';c.lineWidth=25;c.stroke();c.restore();
 for(const bridge of world.bridges){c.save();c.translate(bridge.x,bridge.y);c.shadowColor='#355d4c55';c.shadowBlur=7;c.shadowOffsetY=8;c.fillStyle='#886949';c.beginPath();c.roundRect(-bridge.w/2,-bridge.h/2,bridge.w,bridge.h,8);c.fill();c.shadowColor='transparent';const vertical=bridge.h>bridge.w;const length=vertical?bridge.h:bridge.w;for(let j=-length/2+4;j<length/2;j+=15){c.fillStyle=(j%2)?'#d1ad76':'#c59d68';if(vertical)c.fillRect(-bridge.w/2+5,j,bridge.w-10,11);else c.fillRect(j,-bridge.h/2+5,11,bridge.h-10);}c.restore();}
 // Small clay pebbles along the bank reinforce water/land boundaries.
 for(let i=0;i<world.river.length;i+=Math.max(1,Math.floor(world.river.length/25))){const p=world.river[i];c.fillStyle='#a6ad8d';c.beginPath();c.ellipse(p.x-34,p.y+35,12,7,-.2,0,7);c.fill();c.fillStyle='#d9d5b2';c.beginPath();c.ellipse(p.x-37,p.y+32,8,4,-.2,0,7);c.fill();}
}
export function paintFlow(c:CanvasRenderingContext2D,world:World,time:number,reduced=false){const river=world.river;const segments=river.slice(1).map((p,i)=>Math.hypot(p.x-river[i].x,p.y-river[i].y));const total=segments.reduce((a,b)=>a+b,0);c.fillStyle='#eff8d9b0';for(let i=0;i<12;i++){let distance=((i/12+(reduced?0:time/22000))%1)*total;let n=0;while(n<segments.length-1&&distance>segments[n])distance-=segments[n++];const a=river[n],b=river[n+1],t=distance/(segments[n]||1),x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;if(world.bridges.some(br=>Math.abs(x-br.x)<br.w/2&&Math.abs(y-br.y)<br.h/2))continue;c.beginPath();c.ellipse(x,y,6,2,Math.atan2(b.y-a.y,b.x-a.x),0,7);c.fill();}}
