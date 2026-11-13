export const FACTS = ['river', 'zhuyu', 'migu', 'ears', 'gait'];
export const SAVE_KEY = 'shanhai-zhaoyao-v1';
export function restore(raw) {
  try { const s = JSON.parse(raw || '{}'); return {version:1, started:s.started === true, facts:FACTS.filter(k=>Array.isArray(s.facts)&&s.facts.includes(k)), completed:s.completed === true && FACTS.every(k=>s.facts?.includes(k)), x:Number.isFinite(s.x)?Math.max(380,Math.min(2150,s.x)):470, y:Number.isFinite(s.y)?Math.max(200,Math.min(1250,s.y)):1120}; }
  catch { return {version:1,started:false,facts:[],completed:false,x:470,y:1120}; }
}
export function record(s, id) { return FACTS.includes(id) ? {...s,facts:[...new Set([...s.facts,id])]} : s; }
export function canFinish(s) { return FACTS.every(k=>s.facts.includes(k)); }
export function finish(s, direction) { return canFinish(s)&&direction==='west'?{...s,completed:true}:s; }
