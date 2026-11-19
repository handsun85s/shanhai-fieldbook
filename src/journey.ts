import {openCampaign,openJingwei} from './campaign';
import {southRoute} from './world-data.mjs';
import './journey.css';

// The direct link opens the book without first downloading the free-roam engine.
const home = new URL(import.meta.env.BASE_URL, location.href);
let leaving = false;
document.addEventListener('worldtravel',event=>{
  const destination=(event as CustomEvent).detail;
  if(!southRoute.some(stop=>stop.open&&stop.id===destination))return;
  leaving=true;
  home.searchParams.set('mountain',destination);
  location.assign(home.href);
});
document.addEventListener('campaignclose',()=>{if(!leaving)location.assign(home.href);});
const query=new URLSearchParams(location.search);
const volume=Number(query.get('volume'));
const passage=Number(query.get('passage'));
if(query.get('game')==='jingwei')openJingwei();
else openCampaign(volume,Number.isInteger(passage)&&passage>=1?passage-1:undefined);
