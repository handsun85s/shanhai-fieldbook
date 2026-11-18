import {terrain} from './navigation.mjs';
import {localPoint} from './world-data.mjs';
type Location={id:string;width:number;height:number};
export function localTerrainMarkup(location:Location){
 const world=terrain(location.id),sx=1780/location.width,sy=980/location.height;
 const river=world.river.map(p=>{const q=localPoint({...location,...p});return`${q.x},${q.y}`;}).join(' ');
 return `${location.id==='zhaoyao'?`<rect x="260" y="260" width="${330*sx}" height="980" fill="#86b9b1"/><text x="280" y="1160" font-size="24" fill="#365c57">西海</text>`:''}<polyline points="${river}" fill="none" stroke="#70a8a4" stroke-width="${48*Math.min(sx,sy)}" stroke-linecap="round" stroke-linejoin="round"/>${world.bridges.map(b=>{const p=localPoint({...location,...b});return`<rect x="${p.x-b.w*sx/2}" y="${p.y-b.h*sy/2}" width="${b.w*sx}" height="${b.h*sy}" rx="5" fill="#c19b69" stroke="#876b4e" stroke-width="4"/>`;}).join('')}`;
}
