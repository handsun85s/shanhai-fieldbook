const direction='(东北|西北|东南|西南|东|西|南|北)';
const count='([一二三四五六七八九十百千有又]+)';
const name='([\\p{Script=Han}]{1,8})';
const rx=(pattern)=>new RegExp('^'+pattern+'$','u');
const route=rx('又?'+direction+count+'里');
const mountain=rx('曰'+name+'之山');
const spring=rx(name+'(?:之水|水)出焉');
const outlet=rx('而?'+direction+'流注[于於]'+name);
const products=['金玉','白玉','青碧','赤金','白金','黄金','玉','金','银','铁','铜','水玉','石','石英','沙石','怪石','美石','文石','丹粟','青雘','白垩','石涅','琈之玉','㻬琈之玉','松柏','竹','桂','桑','竹箭','怪木','草木','怪兽','白猿','虎豹','青雄黄','水'];
const locations=new Map([['其上','山上'],['其下','山下'],['其阳','山的南坡'],['其阴','山的北坡'],['其中','这里面'],['','这里']]);
const simple=new Map([['无草木','没有草木'],['多水','水很多'],['不可以上','不可登上这座山'],['无水','没有水'],['无兽','没有兽类'],['无草','没有草'],['无木','没有树木']]);
function glossClause(clause){
  if(simple.has(clause))return simple.get(clause);
  let match=route.exec(clause);
  if(match)return (clause.startsWith('又')?'再':'')+'向'+match[1]+'走'+match[2]+'里';
  match=mountain.exec(clause);if(match)return '这座山叫'+match[1]+'山';
  match=spring.exec(clause);if(match)return match[1]+'水从这里发源';
  match=outlet.exec(clause);if(match)return '向'+match[1]+'流，汇入'+match[2];
  const goods=/^(其上|其下|其阳|其阴|其中)?多(.+)$/u.exec(clause);
  if(goods&&products.includes(goods[2]))return locations.get(goods[1]??'')+'多有'+goods[2];
  return null;
}
export function patternReading(line){
  const clauses=line.replace(/[。！？]$/u,'').split(/[，；]/u);
  const gloss=clauses.map(glossClause);
  if(gloss.some(v=>!v))return null;
  return gloss.join('，')+'。';
}
