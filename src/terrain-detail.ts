import {randomSequence,sampleLine,type Sample,type Point} from './terrain-paths';
import type {terrain} from './navigation.mjs';

type World=ReturnType<typeof terrain>;
type Brush=CanvasRenderingContext2D;
type Random=()=>number;
const TAU=Math.PI*2;

type Palette = {rock:string;shade:string;grass:string;gravel:string;sand:string;water:string;lightWater:string;seed:number};
const palettes:Record<string,Palette>={
  zhaoyao:{rock:'#b4af89',shade:'#626e60',grass:'#9cae73',gravel:'#948d72',sand:'#dfc59a',water:'#488e91',lightWater:'#9acbbb',seed:741},
  tangting:{rock:'#c2bcb0',shade:'#73756b',grass:'#9eab79',gravel:'#aaa397',sand:'#dfcfac',water:'#599e9e',lightWater:'#a4d3c6',seed:1487},
  niuyang:{rock:'#bfa482',shade:'#776957',grass:'#a2aa70',gravel:'#aa9273',sand:'#dec397',water:'#498c81',lightWater:'#a6c9a9',seed:3301},
  qingqiu:{rock:'#aba994',shade:'#626e65',grass:'#91aa84',gravel:'#98a496',sand:'#d6c5a2',water:'#4a8896',lightWater:'#96c9c7',seed:5987},
};
export function paletteFor(world:World):Palette {return palettes[world.id]??palettes.niuyang;}

function ellipse(c:Brush,x:number,y:number,rx:number,ry:number,color:string,angle=0){
  c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);c.fill();
}
function linePath(points:Point[]) {
  const path=new Path2D();path.moveTo(points[0].x,points[0].y);
  for(let i=1;i<points.length;i++)path.lineTo(points[i].x,points[i].y);
  return path;
}
function joinedPath(a:Point[],b:Point[]){const path=linePath(a);for(let i=b.length-1;i>=0;i--)path.lineTo(b[i].x,b[i].y);path.closePath();return path;}
function atOffset(s:Sample,offset:number){return{x:s.x-s.dy*offset,y:s.y+s.dx*offset};}
function sides(samples:Sample[],radius:(s:Sample,i:number)=>number){
  const left:Point[]=[], right:Point[]=[];
  samples.forEach((s,i)=>{const w=radius(s,i);left.push(atOffset(s,w));right.push(atOffset(s,-w));});
  return joinedPath(left,right);
}

/** A low outcrop with a continuous cap and folded layers cut into its shaded edge. */
function outcrop(c:Brush,x:number,y:number,w:number,h:number,p:Palette,random:Random){
  const phase=random()*9, count=48, cap:Point[]=[], rim:Point[]=[], base:Point[]=[];
  for(let i=0;i<=count;i++){
    const u=i/count,foot=Math.pow(Math.max(0,Math.sin(u*Math.PI)),.82);
    const profile=.68+.15*Math.sin(u*11+phase)+.1*Math.cos(u*21+phase);
    const low=y+foot*(6*Math.sin(u*13+phase)+5*Math.cos(u*9+phase));
    const high=low-h*foot*profile;
    cap.push({x:x+w*u,y:high});base.push({x:x+w*u,y:low});
    rim.push({x:x+w*u,y:high+h*foot*(.19+.055*Math.sin(u*22+phase))});
  }
  const body=joinedPath(cap,base),crown=joinedPath(cap,rim);
  const rock=c.createLinearGradient(x,y-h,x+w*.35,y+h*.12);rock.addColorStop(0,p.rock);rock.addColorStop(.54,p.rock);rock.addColorStop(1,p.shade);
  c.save();c.shadowColor='#3843373b';c.shadowBlur=10;c.shadowOffsetY=6;c.fillStyle=rock;c.fill(body);c.restore();
  c.save();c.clip(body);
  for(let i=1;i<7;i++){
    const t=i/8;const ledge=rim.map((v,j)=>({x:v.x,y:v.y+(base[j].y-v.y)*t+Math.sin(j*.26+i+phase)*1.6}));
    const path=linePath(ledge);c.lineJoin=c.lineCap='round';c.strokeStyle=i%3===0?'#564d3d68':'#69645148';c.lineWidth=1.2+random()*2;c.stroke(path);
    c.save();c.translate(0,1.8);c.strokeStyle='#f3dfa151';c.lineWidth=1.3;c.stroke(path);c.restore();
  }
  for(let i=0;i<12;i++){
    const j=Math.floor(4+random()*(count-8)),top=rim[j];const length=(base[j].y-top.y)*(.18+random()*.5);
    c.strokeStyle='#515c4e30';c.lineWidth=.8+random();c.beginPath();c.moveTo(top.x,top.y);c.bezierCurveTo(top.x+2,top.y+length*.4,top.x-6,top.y+length*.7,top.x-5,top.y+length);c.stroke();
  }
  const moss=c.createLinearGradient(x,y-h,x+w*.3,y);moss.addColorStop(0,'#d7d3a5');moss.addColorStop(.46,p.grass);moss.addColorStop(1,'#76896b');
  c.fillStyle=moss;c.fill(crown);c.strokeStyle='#dcd9acb0';c.lineWidth=2;c.stroke(linePath(cap));
  c.clip(crown);
  for(let i=0;i<w*.9;i++)ellipse(c,x+random()*w,y-random()*h,.7+random()*2,.65,i%2?'#e9e4b149':'#52705b3d');
  c.restore();
}
export function paintFoothills(c:Brush,world:World){
  const p=paletteFor(world),random=randomSequence(p.seed),w=world.width,high=world.id==='zhaoyao'?205:123;
  c.save();
  const mist=c.createLinearGradient(0,0,0,high*.94);mist.addColorStop(0,'#c4d6caaa');mist.addColorStop(1,'#c4d6ca00');c.fillStyle=mist;c.fillRect(0,0,w,high);
  for(let layer=0;layer<2;layer++){
    for(let x=-95;x<w;){const breadth=(world.id==='tangting'?205:300)+random()*135;
      const y=high*(layer===0?.46:.91)+random()*19;
      outcrop(c,x,y,breadth,high*(.78+random()*.45),p,random);x+=breadth*(.66+random()*.14);
    }
  }
  c.restore();
}

export function paintTrails(c:Brush,world:World,branches:Point[][]){
  const p=paletteFor(world),random=randomSequence(p.seed+17);
  c.save();
  const road=new Path2D();
  const sampleGroups=branches.map(branch=>sampleLine(branch,5));
  for(const group of sampleGroups){
    road.addPath(sides(group,s=>18.5+2.4*Math.sin(s.distance*.018)+1.1*Math.sin(s.distance*.067)));
    for(const tip of [group[0],group[group.length-1]]){const cap=new Path2D();cap.arc(tip.x,tip.y,18,0,-TAU,true);road.addPath(cap);}
  }
  const dust=c.createLinearGradient(0,0,world.width*.28,world.height);dust.addColorStop(0,'#dfceb1');dust.addColorStop(.52,p.sand);dust.addColorStop(1,'#ceb486');
  c.shadowColor='#71633735';c.shadowOffsetY=3;c.shadowBlur=3;c.fillStyle=dust;c.fill(road);c.shadowColor='transparent';
  c.save();c.clip(road);
  for(const samples of sampleGroups){
    for(const s of samples){
      for(let i=0;i<3;i++){
        const side=random()>.5?1:-1,edge=side*(random()>.45?11+random()*11:random()*16);
        const v=atOffset(s,edge);const r=.55+random()*1.55;
        ellipse(c,v.x+random()*3,v.y+random()*3,r*1.6,r*.58,i===0?'#957b534e':'#fbebc961',-.35);
      }
      if(random()<.045){const v=atOffset(s,(random()-.5)*14);c.lineWidth=1;c.strokeStyle='#9d855d50';c.beginPath();c.moveTo(v.x,v.y);c.quadraticCurveTo(v.x+s.dx*4+s.dy,v.y+s.dy*4-s.dx,v.x+s.dx*9,v.y+s.dy*9);c.stroke();}
    }
  }
  c.restore();
  for(const samples of sampleGroups)for(const s of samples){if(random()<.28){const v=atOffset(s,(random()>.5?1:-1)*(20+random()*6));ellipse(c,v.x,v.y,1.2+random()*2.8,1+random(),random()>.5?'#a695735f':'#e5d2a27d',random());}}
  c.restore();
}

function bankStone(c:Brush,x:number,y:number,size:number,p:Palette,random:Random){
  const rot=random()*.8-.4,rx=size,ry=size*(.48+random()*.23);
  c.save();c.translate(x,y);c.rotate(rot);ellipse(c,rx*.22,ry*.56,rx*1.12,ry*.9,'#4e63532d');
  const skin=c.createLinearGradient(-rx*.5,-ry,rx*.5,ry);skin.addColorStop(0,'#e6dabc');skin.addColorStop(.44,p.gravel);skin.addColorStop(1,p.shade);
  c.fillStyle=skin;c.beginPath();c.moveTo(-rx,0);c.bezierCurveTo(-rx*.9,-ry*.75,-rx*.15,-ry*1.18,rx*.45,-ry*.8);c.bezierCurveTo(rx*1.1,-ry*.3,rx*1.04,ry*.48,rx*.72,ry*.75);c.bezierCurveTo(rx*.22,ry*1.15,-rx*.95,ry*.81,-rx,0);c.fill();
  if(size>5){c.strokeStyle='#f3e8cd86';c.lineWidth=1;c.beginPath();c.moveTo(-rx*.77,-ry*.23);c.quadraticCurveTo(-rx*.58,-ry*.85,rx*.14,-ry*.82);c.stroke();}
  c.restore();
}
export function paintRiver(c:Brush,world:World){
  const p=paletteFor(world),random=randomSequence(p.seed+8),samples=sampleLine(world.river,4),w=world.waterRadius;
  const ripple=(s:Sample)=>.9*Math.sin(s.distance*.051)+.5*Math.sin(s.distance*.13);
  // The final stretch opens into the sea below the western walking boundary.
  const estuary=world.id==='zhaoyao';
  const radius=(s:Sample)=>w+ripple(s)+(estuary?Math.max(0,Math.min(1,(381-s.x)/98))*14:0);
  const softenMouth=(color:string)=>{
    if(!estuary)return color;
    const gradient=c.createLinearGradient(282,0,365,0);
    gradient.addColorStop(0,color.slice(0,7)+'00');gradient.addColorStop(.25,color.slice(0,7)+'00');gradient.addColorStop(1,color);
    return gradient;
  };
  c.save();c.lineJoin=c.lineCap='round';
  const bank=sides(samples,s=>radius(s)+9);
  c.fillStyle=softenMouth('#9d957c');c.fill(bank);c.fillStyle=softenMouth(p.sand);c.fill(sides(samples,s=>radius(s)+7));
  const wet=sides(samples,radius);const water=estuary?c.createLinearGradient(280,0,world.width,0):c.createLinearGradient(0,0,world.width,world.height);
  water.addColorStop(0,estuary?p.lightWater+'00':p.lightWater);if(estuary)water.addColorStop(.04,p.lightWater);water.addColorStop(.37,p.water);water.addColorStop(.85,p.lightWater);water.addColorStop(1,p.water);c.fillStyle=water;c.fill(wet);
  c.save();c.clip(wet);
  for(const s of samples){
    if(estuary&&s.x<312)continue;
    if(random()<.5){const n=atOffset(s,(random()-.5)*w*1.85);ellipse(c,n.x,n.y,1+random()*4,.9+random()*1.9,random()>.45?'#315d5f23':'#deddb833',Math.atan2(s.dy,s.dx));}
    if(random()<.22){const offset=(random()-.5)*w*1.5,pt=atOffset(s,offset),length=4+random()*15;c.strokeStyle=random()>.5?'#c7e5d34d':'#346e742a';c.lineWidth=.8+random()*.7;c.beginPath();c.moveTo(pt.x,pt.y);c.quadraticCurveTo(pt.x+s.dx*length*.5-s.dy*2,pt.y+s.dy*length*.5+s.dx*2,pt.x+s.dx*length,pt.y+s.dy*length);c.stroke();}
  }
  for(const side of [-1,1]){
    const edge=samples.map(s=>atOffset(s,side*(radius(s)-1)));c.strokeStyle=softenMouth(side<0?'#315d6270':'#d7e7cda0');c.lineWidth=side<0?2.8:1.4;c.stroke(linePath(edge));
  }
  c.restore();
  // Gravel bars fall along the local bank normal, including the southbound river.
  for(const s of samples){if((estuary&&s.x<348)||random()>.19)continue;const side=random()>.55?1:-1;
    const cluster=1+Math.floor(random()*4);
    for(let i=0;i<cluster;i++){const v=atOffset(s,side*(radius(s)+3+random()*13));const jitter=(random()-.5)*17;bankStone(c,v.x+s.dx*jitter,v.y+s.dy*jitter,1.5+Math.pow(random(),2)*6,p,random);}
  }
  c.restore();
}

export function paintBridge(c:Brush,bridge:World['bridges'][number],seed:number){
  const random=randomSequence(seed);
  c.save();c.translate(bridge.x,bridge.y);
  if(bridge.w>bridge.h)c.rotate(Math.PI/2);
  const w=Math.min(bridge.w,bridge.h),h=Math.max(bridge.w,bridge.h),left=-w/2,top=-h/2;
  c.shadowColor='#27433866';c.shadowBlur=5;c.shadowOffsetX=3;c.shadowOffsetY=7;
  c.fillStyle='#796046';c.beginPath();c.roundRect(left+1,top,w-2,h,6);c.fill();c.shadowColor='transparent';
  const boards=Math.round(h/15),step=h/boards;
  for(let i=0;i<boards;i++){
    const y=top+step*i,grainOffset=random()*6;
    const wood=c.createLinearGradient(0,y,0,y+step);wood.addColorStop(0,'#e3c394');wood.addColorStop(.16,i%3?'#cfac7c':'#c8a277');wood.addColorStop(.8,i%3?'#b49269':'#b08a60');wood.addColorStop(1,'#8f714e');
    c.fillStyle=wood;c.beginPath();c.roundRect(left+random()*2,y+.4,w-1-random()*2,step-1.15,2.1);c.fill();
    for(let j=0;j<3;j++){
      const k=y+2+j*(step-4)/3, x1=left+3+random()*12, x2=w/2-3-random()*15;
      c.strokeStyle=j===1?'#77593c6b':'#e6c79a9b';c.lineWidth=.7+random()*.6;c.beginPath();c.moveTo(x1,k);c.bezierCurveTo(-w*.16,k+grainOffset,w*.22,k-grainOffset,x2,k+.7);c.stroke();
    }
    if(i%4===1){const k=(random()-.5)*w*.55;ellipse(c,k,y+step*.59,4.8,1.75,'#93714c');ellipse(c,k,y+step*.5,3,1,'#c4a176');}
    for(const side of [-1,1]){const pin=side*(w*.5-6);ellipse(c,pin,y+step*.52,1.65,1.5,'#6e573f');ellipse(c,pin-.3,y+step*.45,1,.65,'#e3c38f');}
  }
  c.restore();
}
