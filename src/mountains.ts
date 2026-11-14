export type Observation={id:string;name:string;x:number;y:number;image:string;quote:string;text:string;question:string;options:string[];answer:number;call?:string;caption:string};
export type Mountain={id:string;name:string;subtitle:string;route:string;intro:string;color:string;water:string;points:Observation[]};
const art='/assets/art-v2/';
export const mountains:Mountain[]=[
{id:'tangting',name:'堂庭山',subtitle:'白猿与水玉',route:'招摇之东三百里',intro:'林间白猿、水玉与黄金，是这一山的三条线索。先到林缘，再沿山径观察原石。',color:'#bdcbb0',water:'林中浅溪为场景演绎，原文未规定河道',points:[
{id:'ape',name:'林间白猿',x:440,y:260,image:art+'whiteape.png',quote:'多白猿',text:'正文记载堂庭山多白猿。白色毛发是观察线索；具体姿态、脸部和生活习性并未在这句中交代。',question:'哪一个外形线索最直接对应原文？',options:['白色毛发','九条尾巴','头上长角'],answer:0,caption:'姿态与面部为美术演绎；没有给白猿指定正文未记载的叫声。'},
{id:'crystal',name:'水玉原石',x:850,y:440,image:art+'quartz.png',quote:'多水玉',text:'“水玉”在本页注文中解释为水晶。它和招摇山笼统记载的“金玉”并不是同一层次的描述。',question:'“水玉，今水晶也”出自哪里？',options:['本作配音','原文附注','地图比例尺'],answer:1,caption:'依据注文以水晶形态演绎；晶簇大小、排列和附着岩石为创作，不是古籍原图。'},
{id:'gold',name:'山中物产',x:590,y:650,image:art+'stone.png',quote:'多黄金',text:'堂庭山还记有黄金。金色斑点只是帮助表现这条物产记录；不能凭游戏图片鉴定真实矿物。',question:'哪一项在堂庭山正文中有记载？',options:['黄金','会发光的金树','九尾金兽'],answer:0,caption:'岩石形态、颜色与矿物分布为演绎。'}]},
{id:'niuyang',name:'杻阳山',subtitle:'听歌辨兽，循水寻龟',route:'猿翼之东三百七十里',intro:'树影间传来像歌声的鸣叫，溪边又响起劈木般的声音。用外形和声音两种证据，辨认鹿蜀与旋龟。',color:'#b9c5a0',water:'怪水向东流入宪翼之水 →',points:[
{id:'lushu',name:'鹿蜀',x:440,y:270,image:art+'lushu.png',quote:'其状如马而白首，其文如虎而赤尾，其音如谣',text:'马的形态、白色头部、虎纹和赤尾共同组成鹿蜀的线索。“如谣”在注文中解释为像人的歌声。',question:'哪一组观察同时符合鹿蜀？',options:['马形、白首、虎纹、赤尾','龟身、鸟首、蛇尾','狐形、九尾'],answer:0,call:'lushu',caption:'用真人无词哼唱录音参照注文“如人歌声”；选取的旋律是演绎，不是古代声音的复原。'},
{id:'xuangui',name:'旋龟',x:880,y:490,image:art+'xuangui.png',quote:'其状如龟而鸟首虺尾，其音如判木',text:'旋龟长着龟身、鸟首和蛇状尾。“判木”在注文中解释为破木声。留意它与鹿蜀的声音差别。',question:'旋龟的声音在书里被比作什么？',options:['流水声','歌声','破木声'],answer:2,call:'xuangui',caption:'用真实干树枝断裂声参照注文“如破木声”；木料与具体声音为演绎选择，静音也可读线索。'},
{id:'east',name:'怪水东流',x:590,y:650,image:art+'stone.png',quote:'而东流注于宪翼之水',text:'这里的水向东流，和招摇山西流入海的水不同。读地图时，需要重新看方向，不能沿用上一山的答案。',question:'怪水在原文中向哪里流？',options:['西海','东方的宪翼之水','北方'],answer:1,caption:'河道曲线与落脚石为演绎，东流方向依据正文。'}]},
{id:'qingqiu',name:'青丘山',subtitle:'九尾与南流之水',route:'基山之东三百里',intro:'远远观察九尾狐，分清“看见的外形”和“听见的声音”。再循着英水，读出这座山的方向。',color:'#c4cbb5',water:'英水向南流入即翼之泽 ↓',points:[
{id:'fox',name:'九尾之狐',x:440,y:270,image:art+'ninefox.png',quote:'其状如狐而九尾，其音如婴儿',text:'原文用狐形、九尾与婴儿般的声音描写它。这里远观，不追逐；原文还记其能食人，属于古籍中的危险异兽。',question:'哪一组线索出自青丘山正文？',options:['白耳、伏行','狐形、九尾、声音如婴儿','虎纹、赤尾'],answer:1,call:'ninefox',caption:'用短促婴儿哭声录音参照“如婴儿”；原文未指定哭或笑，哭声是本作选择的演绎。毛色、姿态与点击反应也为创作。'},
{id:'jade',name:'山南之玉',x:850,y:440,image:art+'stone.png',quote:'其阳多玉',text:'山的“阳”通常指山南。青丘山阳面多玉，阴面多青雘。地图用南北标记帮助理解古人的方位语言。',question:'“山阳”在这里指哪一侧？',options:['山南','山北','天空'],answer:0,caption:'原石图仅作物产示意，正文未指定玉石颜色与矿物种。'},
{id:'south',name:'英水南流',x:590,y:650,image:art+'stone.png',quote:'南流注于即翼之泽',text:'英水向南流入即翼之泽。招摇向西、杻阳向东、青丘向南：各山的水流需要分别读原文。',question:'英水的去向是？',options:['向东入海','向西入海','向南到即翼之泽'],answer:2,caption:'水面与地形为演绎；南流方向依据正文。'}]}
];
