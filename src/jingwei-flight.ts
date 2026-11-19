import {cargoValue, DISTANCE, inUpdraft, restoreShore, startFlight, stepFlight, TARGET} from './flight-rules.mjs';
import {flightArtist} from './flight-paint';
import {readSave, writeSave} from './storage.mjs';
import {sound} from './sound';
import './jingwei-flight.css';

const KEY='shanhai-jingwei-shore-v1';
type Phase='dock'|'ready'|'flying'|'paused'|'lost'|'landed'|'complete';
type Cargo='wood'|'stone';
const nameOf=(cargo:string)=>cargo==='wood'?'木枝':'石子';

export function mountFlight(host:HTMLElement, onStudy:()=>void) {
  let shore=restoreShore(readSave(KEY).raw);
  const units=()=>shore.reduce((n,d)=>n+cargoValue(d.cargo),0);
  let phase:Phase=units()>=TARGET?'complete':'dock';
  let flight=startFlight('wood',Math.min(3,units()));
  if(phase==='complete'){flight.x=DISTANCE;flight.result='delivered';}
  let pulseUntil=0,held=false,slow=false,writable=true,pointer:number|null=null;
  let last=0,animation=0,clock=0,dropTime=-2,alive=true;
  host.innerHTML=`<section class="jw"><header class="jw-heading"><div><p class="vol-kicker">北山经 · 发鸠山</p><h1>精卫衔石</h1></div><div class="jw-tools"><button class="vol-alt jw-sound" type="button"></button><div class="jw-shore"><b>东海浅滩</b><span></span></div></div></header>
  <div class="jw-stage"><canvas tabindex="0" aria-label="精卫的飞行海域。按住空格上升，松开滑翔。"></canvas><div class="jw-map" aria-label="航线位置"><span>西山</span><i><b></b></i><span>东海</span></div><div class="jw-wind" hidden>↑ 上升气流</div></div>
  <div class="jw-dock"><div class="jw-message"><h2></h2><p></p></div><div class="jw-actions"></div></div><div class="jw-caption"><span>“常衔西山之木石，以堙于东海。”</span><small>《北山经》 · 风浪、风环与载重为游戏演绎</small></div><p class="jw-save" role="status" hidden>浏览器暂时无法保存，离开后可能丢失本次进度。</p><span class="jw-sr" role="status"></span></section>`;
  const get=<T extends HTMLElement=HTMLElement>(s:string)=>host.querySelector<T>(s)!;
  const canvas=get<HTMLCanvasElement>('canvas'), paint=flightArtist(canvas);
  const actions=get('.jw-actions'),title=get('.jw-message h2'),hint=get('.jw-message p');
  const bar=get('.jw-map b'),wind=get('.jw-wind'),tally=get('.jw-shore span'),announce=get('.jw-sr');
  const abort=new AbortController(),options={signal:abort.signal};
  const soundButton=get<HTMLButtonElement>('.jw-sound');
  const showSound=()=>{soundButton.textContent=sound.enabled?'声音开':'声音关';soundButton.setAttribute('aria-pressed',String(sound.enabled));};
  soundButton.onclick=()=>{if(sound.enabled)sound.mute();else void sound.start();};
  showSound();document.addEventListener('soundchange',showSound,options);
  function button(label:string,run:()=>void,primary=false){
    const b=document.createElement('button');b.type='button';b.className=primary?'vol-main':'vol-alt';b.textContent=label;b.onclick=run;actions.append(b);return b;
  }
  function clearInput(){held=false;pointer=null;pulseUntil=0;}
  function togglePace(){
    slow=!slow;
    const b=actions.querySelector('[data-pace]')!;
    b.textContent=slow?'舒缓速度 ✓':'舒缓速度';b.setAttribute('aria-pressed',String(slow));
  }
  function begin(cargo:Cargo){void sound.autoStart();flight=startFlight(cargo,Math.min(3,units()));clearInput();phase='ready';render();canvas.focus({preventScroll:true});}
  function takeOff(){
    if(phase!=='ready')return;
    phase='flying';last=0;title.textContent='衔'+nameOf(flight.cargo)+'渡海';
    const control=get<HTMLButtonElement>('[data-flight-control]');control.textContent='暂停';control.onclick=pause;
  }
  function pause(){if(phase==='flying'){clearInput();phase='paused';render();}}
  function resume(){phase='flying';last=0;render();canvas.focus({preventScroll:true});}
  function persist(){writable=writeSave(KEY,shore);get('.jw-save').hidden=writable;}
  function render(){
    actions.replaceChildren();
    tally.textContent=Math.min(TARGET,units())+' / '+TARGET;
    wind.hidden=true;
    const message=(a:string,b:string)=>{title.textContent=a;hint.textContent=b;};
    if(phase==='dock'){
      message(shore.length?'再从西山出发':'这趟衔什么出海？','按住画面或空格升高，松开滑翔。木枝轻巧，石子沉。送满四份，就能垒起一片浅滩。');
      button('衔木枝 · 1 份',()=>begin('wood'),true);
      button('衔石子 · 2 份',()=>begin('stone'));
    }else if(phase==='flying'||phase==='ready'){
      message(phase==='ready'?'按住画面或空格起飞':'衔'+nameOf(flight.cargo)+'渡海','按住升高，松开滑翔。越过浪尖，从乌云下方穿行。金色风环可收集。');
      const flap=button('按住扇翅 ↑',()=>{},true);flap.dataset.flap='';flap.style.touchAction='none';
      flap.onclick=e=>{if(e.detail===0){takeOff();pulseUntil=performance.now()+400;}};
      const control=phase==='ready'?button('重新选材',toDock):button('暂停',pause);
      control.dataset.flightControl='';
    }else if(phase==='paused'){
      message('稍歇片刻','继续后，精卫会从刚才的位置向东飞。');
      button('继续飞行',resume,true);
    }else if(phase==='lost'){
      const feedback=flight.result==='cloud'?'撞上低云了。看见乌云时提前松开，从云底滑过去。':flight.result==='wave'?'浪尖打湿了翅膀。看见白色气流时按住扇翅，提前爬高。':'飞得太贴近水面了。按住画面或空格扇翅，松开才会下降。';
      message('精卫回到了岸边',feedback+' 已送达的木石还在。');
      button('再试一次 · '+nameOf(flight.cargo),()=>begin(flight.cargo as Cargo),true);
      button('换一种载重',toDock);
    }else if(phase==='landed'){
      message(nameOf(flight.cargo)+'已落在浅滩上','这趟穿过 '+flight.rings.length+' 个风环。下一趟的风浪会变化，还差 '+(TARGET-units())+' 份木石。');
      button('返回西山取材',toDock,true);
    }else{
      const rings=shore.reduce((n,d)=>n+d.rings,0);
      message('东海，多了一片浅滩',shore.length+' 趟往返，送来'+shore.map(d=>nameOf(d.cargo)).join('、')+'，共穿过 '+rings+' 个风环。');
      button('把精卫记进北山手记',onStudy,true);
      button('再筑一片浅滩',()=>{shore=[];persist();toDock();});
    }
    if(phase==='dock'||phase==='paused'){
      const b=button(slow?'舒缓速度 ✓':'舒缓速度',togglePace);b.dataset.pace='';b.setAttribute('aria-pressed',String(slow));
    }
    announce.textContent=title.textContent+'。'+hint.textContent;
    paint(flight,shore,clock,held,phase==='dock');bar.style.width=Math.min(100,flight.x/DISTANCE*100)+'%';
  }
  function toDock(){phase='dock';flight=startFlight('wood',Math.min(3,units()));render();}
  host.addEventListener('pointerdown',e=>{
    if((phase!=='flying'&&phase!=='ready')||pointer!==null||e.button!==0||!(e.target instanceof Element)||!(e.target===canvas||e.target.closest('[data-flap]')))return;
    e.preventDefault();takeOff();pointer=e.pointerId;held=true;e.target.setPointerCapture(e.pointerId);
  },options);
  const release=(e:PointerEvent)=>{if(e.pointerId===pointer)clearInput();};
  for(const type of ['pointerup','pointercancel','lostpointercapture'] as const)host.addEventListener(type,release,options);
  host.addEventListener('keydown',e=>{
    if((e.code==='Space'||e.code==='Enter')&&(phase==='flying'||phase==='ready')&&(e.target===canvas||(e.target as HTMLElement).closest('[data-flap]'))){e.preventDefault();takeOff();held=true;}
    if(e.code==='KeyP'&&!e.repeat){if(phase==='flying')pause();else if(phase==='paused')resume();}
  },options);
  window.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter')held=false;},options);
  window.addEventListener('blur',pause,options);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();},options);
  function frame(now:number){
    if(!alive)return;
    const dt=last?Math.min((now-last)/1000,.08):0;last=now;
    if(phase==='flying'){
      const elapsed=dt*(slow?.65:1),steps=Math.max(1,Math.ceil(elapsed*120)),rings=flight.rings.length;
      for(let i=0;i<steps;i++)stepFlight(flight,held||now<pulseUntil,elapsed/steps);
      if(flight.result!=='flying'){
        clearInput();
        if(flight.result==='delivered'){
          sound.cue();dropTime=clock;shore.push({cargo:flight.cargo,rings:flight.rings.length});persist();phase=units()>=TARGET?'complete':'landed';
        }else phase='lost';
        render();
        actions.querySelector('button')?.focus({preventScroll:true});
      }else{
        if(rings!==flight.rings.length){sound.cue();title.textContent='穿过风环 · '+flight.rings.length+' / 3';announce.textContent=title.textContent;}
        wind.hidden=!inUpdraft(flight.x,flight.route);
      }
    }
    if(phase!=='paused'&&phase!=='lost')clock+=dt;
    paint(flight,shore,clock,held,phase==='dock',Math.min(1,(clock-dropTime)/.85));
    bar.style.width=Math.min(100,flight.x/DISTANCE*100)+'%';
    animation=requestAnimationFrame(frame);
  }
  render();animation=requestAnimationFrame(frame);
  return ()=>{alive=false;cancelAnimationFrame(animation);abort.abort();};
}
