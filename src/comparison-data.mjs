export const COMPARISON_KEY='shanhai-comparison-v1';
export const investigations=[
 {id:'creatures',title:'谁在鸣叫？',intro:'把外形和声音两类线索配给同一只神兽。可以试听，也可以只读文字。',choices:[['lushu','鹿蜀'],['xuangui','旋龟'],['fox','九尾狐']],items:[
  {id:'wood',text:'线索甲：像木料破裂的声音',audio:'xuangui',answer:'xuangui',quote:'其音如判木',why:'旋龟的“判木”，注文解释为破木声。'},
  {id:'horse',text:'线索乙：马形、白首、虎纹、赤尾',answer:'lushu',quote:'其状如马而白首，其文如虎而赤尾',why:'四个特征共同指向鹿蜀，不能只凭名字判断。'},
  {id:'infant',text:'线索丙：声音像婴儿',audio:'ninefox',answer:'fox',quote:'其状如狐而九尾，其音如婴儿',why:'九尾狐的声音比作婴儿。哭声只是本作选用的参照。'},
  {id:'turtle',text:'线索丁：龟身、鸟首、蛇状尾',answer:'xuangui',quote:'其状如龟而鸟首虺尾',why:'这些是旋龟的外形线索，与破木般的声音属于同一只兽。'},
  {id:'song',text:'线索戊：像人的歌声',audio:'lushu',answer:'lushu',quote:'其音如谣',why:'鹿蜀的“如谣”，注文解释为如人歌声。'},
  {id:'tails',text:'线索己：狐的形态，九条尾巴',answer:'fox',quote:'其状如狐而九尾',why:'尾数是正文线索，具体毛色并没有在这句中指定。'}]},
 {id:'rivers',title:'同是山水，去向相同吗？',intro:'上北下南，左西右东。分别给三条水选择箭头，不要把上一座山的方向带到下一座。',choices:[['east','向东 →'],['south','向南 ↓'],['west','向西 ←']],items:[
  {id:'qingqiu',text:'青丘山 · 英水 → 即翼之泽',answer:'south',quote:'南流注于即翼之泽',why:'英水向南流。'},
  {id:'zhaoyao',text:'招摇山 · 山中之水 → 海',answer:'west',quote:'而西流注于海',why:'招摇之水向西入海，可帮助你找到西海营地。'},
  {id:'niuyang',text:'杻阳山 · 怪水 → 宪翼之水',answer:'east',quote:'而东流注于宪翼之水',why:'怪水向东流。三山不能共用同一个方向答案。'}]},
 {id:'sources',title:'这句话从哪里来？',intro:'古书正文、后人的注文与游戏创作，提供的是不同层次的信息。把每句话放回对应的一栏。',choices:[['art','游戏演绎'],['text','古籍正文'],['comment','本页注文']],items:[
  {id:'crystal',text:'“水玉，今水晶也”',answer:'comment',quote:'正文：多水玉；注文：水玉，今水晶也。',why:'把水玉解释为水晶的是注文。'},
  {id:'foxcolor',text:'九尾狐在游戏里呈奶白色和橙色',answer:'art',quote:'正文：其状如狐而九尾。',why:'正文在这里说明形态和尾数，画面配色是美术设定。'},
  {id:'ears',text:'狌狌“其状如禺而白耳”',answer:'text',quote:'其状如禺而白耳',why:'白耳直接出现在正文中。'},
  {id:'bridge',text:'从木桥过河，在静观石旁等待三秒',answer:'art',quote:'桥的位置、观察点和等待时长为游戏设计。',why:'操作规则不是古籍记载的动物习性或真实地形。'},
  {id:'gold',text:'堂庭山“多黄金”',answer:'text',quote:'多棪木，多白猿，多水玉，多黄金',why:'黄金是正文列出的物产；画面里的矿石纹路仍是演绎。'}]},
];
export function assessInvestigation(id,answers){const activity=investigations.find(a=>a.id===id);if(!activity)return{complete:false,correct:0,total:0};const correct=activity.items.filter(i=>answers?.[i.id]===i.answer).length;return{complete:correct===activity.items.length,correct,total:activity.items.length};}
export function restoreComparisons(raw){let data;try{data=JSON.parse(raw||'{}');}catch{data={};}const state={};for(const activity of investigations){const candidate=data?.[activity.id],answers={};for(const item of activity.items){const value=candidate?.answers?.[item.id];if(activity.choices.some(c=>c[0]===value))answers[item.id]=value;}state[activity.id]={answers,checked:candidate?.checked===true&&assessInvestigation(activity.id,answers).complete};}return state;}
