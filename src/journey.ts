import {openCampaign,openJingwei,openFlight} from './campaign';
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
if(query.get('game')==='flight')openFlight();
else if(['jingwei','fieldnotes'].includes(query.get('game')??''))openJingwei(query.get('site')??'bird');
else {
  const sentence=Number(query.get('sentence'));
  openCampaign(volume,Number.isInteger(passage)&&passage>=1?passage-1:undefined,Number.isInteger(sentence)&&sentence>0?sentence-1:undefined);
}
