export const EXP_KEY='shanhai-expeditions-v1';
export function restoreExp(raw, mountains){try{const s=JSON.parse(raw||'{}');return Object.fromEntries(mountains.map(m=>[m.id,m.points.map(p=>p.id).filter(id=>Array.isArray(s[m.id])&&s[m.id].includes(id))]));}catch{return Object.fromEntries(mountains.map(m=>[m.id,[]]));}}
export function addObservation(state,mountain,id,mountains){const m=mountains.find(m=>m.id===mountain);if(!m?.points.some(p=>p.id===id))return state;return {...state,[mountain]:[...new Set([...(state[mountain]||[]),id])]};}
