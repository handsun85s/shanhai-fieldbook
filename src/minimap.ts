import './minimap.css';

type Point = {id:string; name:string; x:number; y:number};
type MapConfig = {id:string; name:string; width:number; height:number; points:Point[]};

// Use the scene's own world units, so camera zoom never changes the reported location.
export function createMinimap(host:HTMLElement, config:MapConfig, expand:()=>void) {
  const {id,name,width,height,points}=config;
  const radius=width*.014;
  const terrain=id==='zhaoyao'
    ? '<path d="M0 0H320Q400 500 280 1500H0Z" fill="#88ada8"/><path d="M1940 570L1600 700 1320 900 1030 850 820 1020 500 1040 280 1100" class="trail-mini-water"/>'
    : id==='qingqiu'
      ? '<path d="M980 100C680 300 1100 500 900 820" class="trail-mini-water"/>'
      : '<path d="M0 500C360 490 470 390 650 460S1000 580 1250 500" class="trail-mini-water"/>';
  const road=id==='zhaoyao'
    ? 'M470 1120L870 1110 1120 890 1310 485 1790 510 1930 740'
    : 'M180 680C230 480 280 320 440 330S950 260 880 530Q900 720 590 710';
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
