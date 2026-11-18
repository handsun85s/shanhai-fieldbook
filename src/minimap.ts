import './minimap.css';
import {terrain as buildTerrain} from './navigation.mjs';

type Point = {id:string; name:string; x:number; y:number};
type MapConfig = {id:string; name:string; width:number; height:number; points:Point[]};

// Use the scene's own world units, so camera zoom never changes the reported location.
export function createMinimap(host:HTMLElement, config:MapConfig, expand:()=>void) {
  const {id,name,width,height,points}=config;
  const radius=width*.014;
  const world=buildTerrain(id);
  const terrain=`${id==='zhaoyao'?'<rect width="330" height="1500" fill="#88ada8"/>':''}<polyline points="${world.river.map(p=>p.x+','+p.y).join(' ')}" class="trail-mini-water"/>${world.bridges.map(b=>`<rect x="${b.x-b.w/2}" y="${b.y-b.h/2}" width="${b.w}" height="${b.h}" rx="10" fill="#c8a472"><title>木桥 · 游戏演绎</title></rect>`).join('')}`;
  const road=id==='zhaoyao'?'M470 1120L870 1110 1230 990 1310 485 1790 510 1930 740':'M180 680L300 490 440 330 850 350 970 550 590 710';
  const el=document.createElement('section');
  el.className='trail-minimap';
  el.setAttribute('aria-label',`${name}实时小地图`);
  el.innerHTML=`<div class="trail-mini-heading"><strong>${name}</strong><span>北 ↑</span></div>
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="人物与观察点位置，上北下南左西右东">
      <rect width="${width}" height="${height}" fill="#d4d9ba"/>
      ${terrain}<path d="${road}" fill="none" stroke="#f7edcf" stroke-width="${width*.018}"/>
      ${points.map((p,i)=>`<g class="trail-mini-point" data-point="${p.id}"><title>${p.name}</title><circle cx="${p.x}" cy="${p.y}" r="${radius}"/><text x="${p.x}" y="${p.y-radius*1.8}" text-anchor="middle" font-size="${radius*2.3}">${p.id==='camp'?'营':i+1}</text></g>`).join('')}
      <g class="trail-mini-player"><circle r="${radius*2.3}" fill="#a4472e" opacity=".18"/><circle r="${radius*1.2}" fill="#a4472e" stroke="#fff9e7" stroke-width="${radius*.5}"/><path d="M0 ${-radius*.7}L${radius*.55} ${radius*.45}H${-radius*.55}Z" fill="#fff9e7"/></g>
    </svg>
    <div class="trail-mini-legend"><span>🔴 你的位置</span><span>● 已记 ○ 待察</span></div>
    <p class="trail-mini-area"></p><button type="button">展开地图 ↗</button>`;
  host.append(el);
  el.querySelector('button')!.onclick=expand;
  const player=el.querySelector<SVGGElement>('.trail-mini-player')!;
  const area=el.querySelector<HTMLElement>('.trail-mini-area')!;
  const markers=[...el.querySelectorAll<SVGGElement>('[data-point]')];
  let previousPosition='',previousRecords='',previousArea='';
  return {
    element:el,
    update(x:number,y:number,nearby:string,records:string[]) {
      const position=`translate(${Math.round(Math.max(0,Math.min(width,x)))} ${Math.round(Math.max(0,Math.min(height,y)))})`;
      if(position!==previousPosition){player.setAttribute('transform',position);previousPosition=position;}
      if(nearby!==previousArea){area.textContent=nearby;area.title=nearby;player.setAttribute('aria-label',`你在${nearby}`);previousArea=nearby;}
      const key=records.join(',');
      if(key!==previousRecords){markers.forEach(marker=>marker.classList.toggle('recorded',records.includes(marker.dataset.point!)));previousRecords=key;}
    },
  };
}
