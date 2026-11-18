import {paintClayGround,clayArt} from './clay';
import {assetPath} from './assets';
import {terrain,segmentDistance} from './navigation.mjs';
import {terrainPaths,randomSequence,sampleLine,type Point} from './terrain-paths';
import {paintFoothills,paintRiver,paintTrails,paintBridge,paletteFor} from './terrain-detail';
export {terrainPaths} from './terrain-paths';

export type World=ReturnType<typeof terrain>;
export type Prop={x:number;y:number;height:number;url:string;radius:number};
export function makeEnvironment(id:string,points:Point[]){
  const world=terrain(id),props:Prop[]=[];
  const rand=randomSequence(731+id.length*97),paths=terrainPaths(world);
  const count=id==='zhaoyao'?44:16;
  for(let i=0;i<500&&props.length<count;i++){
    const x=world.bounds.left+rand()*(world.bounds.right-world.bounds.left);
    const y=world.bounds.top+rand()*(world.bounds.bottom-world.bounds.top);
    if(points.some(p=>Math.hypot(x-p.x,y-p.y)<170)||Math.hypot(x-(id==='zhaoyao'?470:180),y-(id==='zhaoyao'?1120:680))<110)continue;
    if(world.river.slice(1).some((p,j)=>segmentDistance({x,y},world.river[j],p)<85))continue;
    props.push({x,y,height:140+rand()*90,url:assetPath(clayArt+'grove.webp'),radius:16});
  }
  // Preserve existing groves, removing only trunks that would obstruct a path.
  const visible=props.filter(prop=>!paths.some(path=>path.some((p,i)=>i>0&&segmentDistance(prop,path[i-1],p)<33)));
  world.obstacles=visible.map(p=>({x:p.x,y:p.y,r:p.radius}));
  return {world,props:visible};
}

function paintWestSea(c:CanvasRenderingContext2D,height:number){
  const coast=(y:number)=>318+8*Math.sin(y/103)+6*Math.cos(y/57)+3*Math.sin(y/21)+42*Math.exp(-((y-1090)**2)/1050);
  function shorePath(offset:number){
    const path=new Path2D();
    for(let y=-8;y<=height+8;y+=8){const x=coast(y)+offset;if(y===-8)path.moveTo(x,y);else path.lineTo(x,y);}
    return path;
  }
  function band(offset:number,fill:string|CanvasGradient){const path=shorePath(offset);path.lineTo(0,height+8);path.lineTo(0,-8);path.closePath();c.fillStyle=fill;c.fill(path);}
  const random=randomSequence(1160);
  c.save();
  const sand=c.createLinearGradient(278,0,359,0);sand.addColorStop(0,'#a5b6a3');sand.addColorStop(.5,'#c9bea0');sand.addColorStop(1,'#dcceab');
  band(30,sand);const sea=c.createLinearGradient(0,0,333,45);sea.addColorStop(0,'#528f97');sea.addColorStop(.63,'#71a9aa');sea.addColorStop(.92,'#91beb1');sea.addColorStop(1,'#b8c9af');band(0,sea);
  for(let y=1;y<height;y+=3){const x=coast(y),offset=random()*33;
    c.fillStyle=random()>.45?'#9d8e705a':'#f7e9bd7a';c.fillRect(x+offset,y,1+random()*2,1);
    if(random()>.45)continue;
    const a=x-9-random()*270,k=6+random()*20;
    c.strokeStyle=random()>.5?'#c0dfce66':'#3f858b3d';c.lineWidth=.8+random()*1.3;c.beginPath();c.moveTo(a,y);c.quadraticCurveTo(a+k*.6,y-2.5,a+k,y-.3);c.stroke();
  }
  c.lineCap='round';
  // Tidal foam breaks at the opening where the western river meets the sea.
  const foamClip=new Path2D();foamClip.rect(0,0,380,1055);foamClip.rect(0,1129,380,height-1129);c.clip(foamClip);
  for(const offset of [0,-6,-17,-35]){c.strokeStyle=offset===0?'#f9f0d6bf':'#d1eacb6e';c.lineWidth=offset===0?2.4:1.25;c.setLineDash(offset===0?[13,2,18,6]:[15,9,3,17]);c.stroke(shorePath(offset));}
  c.setLineDash([]);c.restore();
}

/** Terrain detail is painted once onto the scene's world-sized backing canvas. */
export function paintTerrain(c:CanvasRenderingContext2D,world:World,color='#bdc99d'){
  c.save();paintClayGround(c,world.width,world.height,color);paintFoothills(c,world);
  if(world.id==='zhaoyao')paintWestSea(c,world.height);
  paintTrails(c,world,terrainPaths(world));paintRiver(c,world);
  world.bridges.forEach((bridge,index)=>paintBridge(c,bridge,paletteFor(world).seed+index));c.restore();
}

const flowSamples=new WeakMap<World,ReturnType<typeof sampleLine>>();
export function paintFlow(c:CanvasRenderingContext2D,world:World,time:number,reduced=false){
  let samples=flowSamples.get(world);
  if(!samples){samples=sampleLine(world.river,5);flowSamples.set(world,samples);}
  c.save();c.lineCap='round';
  const last=samples.length-1;
  for(let i=0;i<12;i++){
    const offset=((i/12+(reduced?0:time/22000))%1)*last,index=Math.floor(offset),t=offset-index;
    const a=samples[index],b=samples[index+1];const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
    if(world.bridges.some(br=>Math.abs(x-br.x)<br.w/2+8&&Math.abs(y-br.y)<br.h/2+8))continue;
    const lane=(i%3-1)*4,lx=x-a.dy*lane,ly=y+a.dx*lane;
    c.strokeStyle='#e2eed4c0';c.lineWidth=1.7;c.beginPath();c.moveTo(lx-5*a.dx,ly-5*a.dy);c.quadraticCurveTo(lx+a.dy,ly-a.dx,lx+5*a.dx,ly+5*a.dy);c.stroke();
  }
  c.restore();
}
