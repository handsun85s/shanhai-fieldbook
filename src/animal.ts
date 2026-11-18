import {assetPath} from './assets';
import {sound} from './sound';
import {creature,sheetMarkup} from './creatures';
import './animal.css';
export function animalMarkup(id:string){const a=creature(id);if(!a)return '';return `<section class="animal-experience" data-animal="${id}" aria-label="${a.name}互动观察"><button class="animal-stage" aria-label="点击${a.name}，${a.action}"><span class="animal-hill"></span><span class="animal-shadow"></span>${sheetMarkup(id,'animal-sheet').replace('</span>','<span class="trait-ring" hidden></span></span>')}<span class="animal-tap">点击它 · ${a.action}</span></button><div class="trait-buttons" aria-label="观察身体特征">${a.traits.map((t,i)=>`<button data-trait="${i}" aria-pressed="false">${t.label}</button>`).join('')}</div><div class="animal-buttons"><button class="animal-action">${a.action} ↗</button>${a.call?'<button class="animal-voice">试听声音示例 ♪</button>':''}</div><p class="animal-status" role="status">先点一个特征仔细看，再让它动起来。</p>${a.call?`<p class="animal-audio-note">${id==='lushu'?'如谣 → 真人哼唱':id==='xuangui'?'如判木 → 木料裂响':'如婴儿 → 婴儿哭声'}；是原文比喻的录音参照，不是神兽实录。<a href="${assetPath('audio-v2/LICENSES.md')}" target="_blank" rel="noopener">来源 ↗</a></p>`:'<p class="animal-audio-note">动作是游戏演绎；没有添加正文未指定的叫声。</p>'}</section>`;}
export function bindAnimals(container:HTMLElement){const cleanups:(()=>void)[]=[];
 container.querySelectorAll<HTMLElement>('.animal-experience').forEach(el=>{
 const id=el.dataset.animal!,a=creature(id),stage=el.querySelector<HTMLButtonElement>('.animal-stage')!,sprite=el.querySelector<HTMLElement>('.clay-frame')!,status=el.querySelector<HTMLElement>('.animal-status')!,ring=el.querySelector<HTMLElement>('.trait-ring')!;
 let timer=0,disposed=false,busy=false,standing=false,request=0;
 const frame=(n:number)=>sprite.style.setProperty('--frame',String(n));
 const observed=(trait:string)=>el.dispatchEvent(new CustomEvent('field-evidence',{bubbles:true,detail:{id,trait}}));
 const action=()=>{window.clearInterval(timer);ring.hidden=true;observed('动作');if(id==='shengsheng'){standing=!standing;frame(standing?1:0);status.textContent=standing?'人走：两足直立。再点一次比较伏行。':'伏行：四肢贴近地面。白耳特征仍然保留。';return;}
 status.textContent=id==='fox'?'留意尾部的姿态变化。尾数是原文线索，毛色与动作是演绎。':id==='xuangui'?'看脚掌交替、头颈伸缩；龟身、鸟首、蛇尾保持不变。':'看相邻姿态的四肢变化，再对照身体特征。';
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){frame(1);return;}let i=0;frame(1);timer=window.setInterval(()=>{if(disposed)return;frame(++i%2?2:1);if(i>=8){window.clearInterval(timer);frame(0);}},id==='xuangui'?360:220);};
 stage.onclick=action;el.querySelector<HTMLButtonElement>('.animal-action')!.onclick=action;
 el.querySelectorAll<HTMLButtonElement>('[data-trait]').forEach(b=>b.onclick=()=>{window.clearInterval(timer);frame(0);const t=a.traits[Number(b.dataset.trait)];el.querySelectorAll('[data-trait]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));ring.style.left=t.x+'%';ring.style.top=t.y+'%';ring.hidden=false;status.textContent=`观察：${t.label}。原文对应「${t.quote}」。具体大小和细节为美术设定。`;observed(t.label);if(id==='shengsheng'&&Number(b.dataset.trait)===2)action();});
 const voice=el.querySelector<HTMLButtonElement>('.animal-voice');
 if(voice)voice.onclick=async()=>{if(busy){request++;busy=false;sound.stopCall();voice.textContent='试听声音示例 ♪';status.textContent='已停止。静音也能完成观察。';return;}busy=true;const token=++request;voice.textContent='停止声音 ■';status.textContent='正在加载声音示例…';try{if(!await sound.start())throw Error("Audio unavailable");if(disposed||token!==request)return;observed('声音');status.textContent='正在播放原文比喻的录音参照。';await sound.call(a.call!);if(!disposed&&token===request)status.textContent='播放结束。你听到的声音对应原文哪几个字？';}catch{if(!disposed&&token===request)status.textContent='声音未能加载，可以重试或用文字线索完成。';}finally{if(!disposed&&token===request){busy=false;voice.textContent='试听声音示例 ♪';}}};
 cleanups.push(()=>{disposed=true;request++;window.clearInterval(timer);if(busy)sound.stopCall();});
 });return()=>cleanups.forEach(fn=>fn());}
