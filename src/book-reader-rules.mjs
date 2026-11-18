const directions = [['東','东'], ['西','西'], ['南','南'], ['北','北'], ['東南','东南'], ['西北','西北'], ['西南','西南'], ['東北','东北']];
const beasts = [['狐','狐'], ['鹿','鹿'], ['羊','羊'], ['馬','马'], ['龜','龟'], ['牛','牛']];
const colors = [['白','白'], ['青','青'], ['赤','赤'], ['黃','黄'], ['黑','黑'], ['紫','紫'], ['灰','灰']];
const place = [['青丘','青丘'], ['招搖','招摇'], ['少室','少室'], ['玉山','玉山']];
const features = [
  {label:'名称', pattern:/名(?:曰|为|叫)([\p{Script=Han}]{1,8})(?=[，。、；：]|$)/dgu, extra:place},
  {label:'形态', pattern:/(?:其状如|状若|其为鸟|其为兽)([\p{Script=Han}]{1,4}?)(?=[而，。、；]|$)/dgu, extra:beasts},
  {label:'外形', pattern:/([赤白青黄黑玄])(?=尾|首|耳|目|足|鸟|蛇|身|喙|羽|毛)/dgu, extra:colors},
  {label:'水流方向', pattern:/(东北|东南|西北|西南|东|西|南|北)(?=流)/dgu, extra:directions},
  {label:'地名', pattern:/(?:曰|名曰)([\p{Script=Han}]{1,6}?)(?=之山)/dgu, extra:place},
  {label:'方位', pattern:/(东北|东南|西北|西南|东|西|南|北)(?=海|望|陬|至)/dgu, extra:directions},
  {label:'物产', pattern:/(?:其上多|其下多|其中多|多)([\p{Script=Han}]{1,4})(?=[，。；、]|$)/dgu,
    extra:[['青玉','青玉'],['白玉','白玉'],['丹粟','丹粟'],['黃金','黄金']]},
  {label:'线索', pattern:/^([\p{Script=Han}]{1,9}?)(?=在|出|之国|之山|国在)/dgu, extra:place},
  {label:'行进方向', pattern:/(东北|东南|西北|西南|东|西|南|北)(?=(?:[一二三四五六七八九十百千]+里|水?行))/dgu, extra:directions, fallback:true}
];

function randomOrder(items, seed) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function originalSlice(original, simplified, start, end) {
  const glyphs = Array.from(original);
  const left = Array.from(simplified.slice(0, start)).length;
  const right = left + Array.from(simplified.slice(start, end)).length;
  return glyphs.slice(left, right).join('');
}

function candidates(original, simplified) {
  const slots = [];
  for (const feature of features) {
    if(feature.fallback && slots.length)continue;
    const match = simplified.matchAll(feature.pattern).next().value;
    if (!match) continue;
    const [start,end] = match.indices[1];
    slots.push({label:feature.label,start,end,simple:match[1],
      original:originalSlice(original,simplified,start,end),extra:feature.extra});
  }
  if (!slots.length) {
    // A short independent statement still has a legible sentence with a blank.
    const match = /[\p{Script=Han}]+/u.exec(simplified);
    const glyphs = Array.from(match[0]);
    const offset = glyphs.length >= 4 ? 1 : 0;
    const start = match.index + glyphs.slice(0,offset).join('').length;
    const simple = glyphs.slice(offset, offset + Math.min(3,Math.max(1,glyphs.length-1))).join('');
    const end = start + simple.length;
    slots.push({label:'原句',start,end,simple,original:originalSlice(original,simplified,start,end),extra:place});
  }
  return slots;
}

const challengeCache = new WeakMap();
export function buildChallenges(book,volume) {
  const cached = challengeCache.get(book);
  if(cached) return cached;
  const entries = book.passages.map((p,i) => candidates(p,book.simplified[i]));
  const pool = entries.flat();
  const result = entries.map((slots,i) => {
    const seed = volume * 17311 + i * 3023;
    const slot = slots[(i + volume) % slots.length];
    const matched = {original:slot.original,simple:slot.simple};
    const options = [matched];
    const neighbors = pool.filter(e => e.label === slot.label).map(({original,simple}) => ({original,simple}));
    const backup = slot.extra.map(([original,simple]) => ({original,simple}));
    for (const candidate of [...randomOrder(neighbors,seed),...randomOrder(backup,seed)]) {
      if (!book.simplified[i].includes(candidate.simple) && !book.passages[i].includes(candidate.original) &&
        !options.some(o => o.simple === candidate.simple || o.original === candidate.original)) options.push(candidate);
      if (options.length === 3) break;
    }
    const shuffled = randomOrder(options,seed^0xabf23);
    const text = book.simplified[i];
    const left = Math.max(...['。','；','！','？'].map(p => text.lastIndexOf(p,slot.start - 1))) + 1;
    const ending = text.slice(slot.end).search(/[。；！？]/u);
    const right = ending < 0 ? text.length : slot.end + ending + 1;
    const span = (start,end) => ({simple:text.slice(start,end),original:originalSlice(book.passages[i],text,start,end)});
    return {label:slot.label,before:span(left,slot.start),after:span(slot.end,right),options:shuffled,answer:shuffled.indexOf(matched)};
  });
  challengeCache.set(book,result);
  return result;
}

export const readerStorage = 'shanhai-reader-1';
export function awardKey(volume,index) { return readerStorage + ':leaf:' + volume + ':' + index; }

export function searchable(value) {
  return value.normalize('NFKC').replace(/猨/gu,'猿').replace(/[穀榖]/gu,'谷')
    .replace(/鳳[凰皇]|凤[凰皇]/gu,'凤皇')
    .replace(/[\p{P}\s]/gu,'');
}

export function excerptForMatch(original,simple,display,term) {
  const source=[simple,original].find(text=>searchable(text).includes(term));
  if(!source)return null;
  const normalized=searchable(source);
  const matchStart=[...normalized.slice(0,normalized.indexOf(term))].length;
  let offset=0, seen=0;
  // Strip punctuation for searching, then count back into the printed sentence.
  for(const char of source) {
    if(seen>=matchStart)break;
    seen += [...searchable(char)].length;
    offset++;
  }
  const chars=[...display], start=Math.max(0,offset-10), end=Math.min(chars.length,offset+Math.max(25,[...term].length));
  return (start?'…':'')+chars.slice(start,end).join('')+(end<chars.length?'…':'');
}
