export const NOTEBOOK_KEY='shanhai-evidence-v1';
export const CHAPTERS=['zhaoyao','tangting','niuyang','qingqiu'];
export function restoreNotebook(raw){let s;try{s=JSON.parse(raw||'{}');}catch{s={};}const notes={};if(s?.notes&&typeof s.notes==='object'&&!Array.isArray(s.notes))for(const [k,v]of Object.entries(s.notes))if(/^(zhaoyao|tangting|niuyang|qingqiu):[a-z]+$/.test(k)&&typeof v==='string')notes[k]=v.slice(0,160);return{notes,recalls:CHAPTERS.filter(k=>Array.isArray(s?.recalls)&&s.recalls.includes(k))};}
export function writeNote(state,key,text){if(!/^(zhaoyao|tangting|niuyang|qingqiu):[a-z]+$/.test(key)||typeof text!=='string')return state;return{...state,notes:{...state.notes,[key]:text.slice(0,160)}};}
export function finishRecall(state,chapter,answers,correct){if(!CHAPTERS.includes(chapter)||!Array.isArray(answers)||answers.length!==correct.length||!answers.every((v,i)=>v===correct[i]))return state;return{...state,recalls:[...new Set([...state.recalls,chapter])]};}
export function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
