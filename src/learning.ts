import {NOTEBOOK_KEY,restoreNotebook,writeNote,finishRecall,escapeHTML} from './notebook.mjs';
import {readSave,writeSave} from './storage.mjs';
import {sound} from './sound';
export let notebook=restoreNotebook(readSave(NOTEBOOK_KEY).raw) as {notes:Record<string,string>;recalls:string[]};
export const noteText=(chapter:string,id:string)=>notebook.notes[`${chapter}:${id}`]??'';
export const safeText=(text:string)=>escapeHTML(text);
export function saveNote(chapter:string,id:string,text:string){const next=writeNote(notebook,`${chapter}:${id}`,text);const ok=writeSave(NOTEBOOK_KEY,next);notebook=next;return ok;}
export const recallDone=(chapter:string)=>notebook.recalls.includes(chapter);
const recallQuestions:Record<string,{q:string;options:string[];answer:number;why:string}[]>={
 zhaoyao:[{q:'手记被风吹乱了。哪组线索应该放回祝余一页？',options:['白耳、伏行人走','韭状叶、青色花','黑纹树干、发光花'],answer:1,why:'祝余对应“其状如韭而青华”。'},{q:'不看地图，你能怎样回到西海营地？',options:['顺水向西','沿水向东','一直向北'],answer:0,why:'招摇之水向西流入海。'}],
 niuyang:[{q:'新手记写着“龟身、鸟首、蛇尾，叫声像歌声”。哪一处需要改？',options:['龟身要改马形','叫声应参照破木声','鸟首应改白耳'],answer:1,why:'旋龟的声音是“如判木”；如谣属于鹿蜀。'},{q:'离开杻阳前，给怪水画一个方向箭头。',options:['向西入海','向南到即翼之泽','向东到宪翼之水'],answer:2,why:'怪水东流注于宪翼之水。'}],
 tangting:[{q:'“水玉，今水晶也”应写在哪一栏？',options:['我刚听到的声音','正文附注的解释','游戏设计的道路'],answer:1,why:'水晶的对应来自注文，晶簇排列则是美术演绎。'},{q:'哪一张观察卡可以放进堂庭山手记？',options:['虎纹赤尾的鹿蜀','白猿与黄金','九尾狐与英水'],answer:1,why:'堂庭正文记有白猿、水玉、黄金和棪木。'}],
 qingqiu:[{q:'有人说“九尾狐一定是白色的，因为游戏这样画”。你会怎样回应？',options:['白色来自原文','原文说狐形九尾，毛色是美术设定','九尾也是游戏编的'],answer:1,why:'区分原文明确特征和画面演绎，是观察的一部分。'},{q:'青丘山的“山阳”和英水去向，哪一组正确？',options:['山北、向东','山南、向西','山南、向南'],answer:2,why:'山阳指山南，英水南流注于即翼之泽。'}],
};
const dialog=document.createElement('dialog');dialog.className='exp-dialog recall-dialog';dialog.setAttribute('aria-label','山行回想');document.body.append(dialog);
export function openRecall(chapter:string,ready:boolean){sound.stopCall();const items=recallQuestions[chapter];let index=0;const answers:number[]=[];
 const render=()=>{if(!ready){dialog.innerHTML='<button class="exp-close" aria-label="关闭回想">×</button><h2>先带回观察记录</h2><p>记录齐全后，再试着离开原文，把线索用到新的情境里。</p>';}
 else if(index===items.length){const next=finishRecall(notebook,chapter,answers,items.map(q=>q.answer));const ok=writeSave(NOTEBOOK_KEY,next);notebook=next;dialog.innerHTML=`<button class="exp-close" aria-label="关闭回想">×</button><small>观察 → 原文 → 回想</small><h2>这座山的线索，串起来了。</h2><p>你已经比较了外形、来源或方向。隔一天再试试，看看还记得哪些依据。</p><p role="status">${ok?'回想完成，已保存在此浏览器。':'本次已完成，但保存失败；请勿关闭页面。'}</p>`;}
 else{const q=items[index];dialog.innerHTML=`<button class="exp-close" aria-label="关闭回想">×</button><small>不看手记 · ${index+1} / ${items.length}</small><h2>${q.q}</h2><div class="exp-quiz">${q.options.map((v,i)=>`<button data-recall="${i}">${v}</button>`).join('')}</div><p class="exp-feedback" role="status">可以修改判断。答错不会扣分。</p>`;dialog.querySelectorAll<HTMLButtonElement>('[data-recall]').forEach(b=>b.onclick=()=>{if(Number(b.dataset.recall)===q.answer){answers.push(q.answer);index++;render();}else{dialog.querySelector('.exp-feedback')!.textContent=q.why;}});}
 dialog.querySelector<HTMLButtonElement>('.exp-close')!.onclick=()=>dialog.close();if(dialog.open){const heading=dialog.querySelector<HTMLElement>('h2')!;heading.tabIndex=-1;heading.focus();}};render();dialog.showModal();}
export const recallOpen=()=>dialog.open;
