// Coordinates are an editorial layout, never modern longitude/latitude.
export const bookSource='https://zh.wikisource.org/zh-hans/山海經';
export const chapters=[
 ['south','南山经','山经',1140,1010],['west','西山经','山经',760,735],['north','北山经','山经',1140,490],['east','东山经','山经',1510,735],['middle','中山经','山经',1140,735],
 ['outer-s','海外南经','海外',1140,1245],['outer-w','海外西经','海外',345,735],['outer-n','海外北经','海外',1140,255],['outer-e','海外东经','海外',1940,735],
 ['inner-s','海内南经','海内',880,1090],['inner-w','海内西经','海内',570,915],['inner-n','海内北经','海内',880,415],['inner-e','海内东经','海内',1720,915],
 ['wild-e','大荒东经','大荒',2170,735],['wild-s','大荒南经','大荒',1530,1390],['wild-w','大荒西经','大荒',130,735],['wild-n','大荒北经','大荒',1530,100],
 ['inner','海内经','海内',1410,1090],
].map(([id,name,group,x,y],i)=>({id:String(id),name:String(name),group:String(group),x:Number(x),y:Number(y),number:i+1,source:bookSource+'/'+String(name).replace('经','經')}));
export const southRoute=[
 {id:'zhaoyao',name:'招摇山',x:240,y:700,li:0,open:true,note:'临于西海之上；丽𪊨之水西流入海。'},
 {id:'tangting',name:'堂庭山',x:470,y:700,li:300,open:true,note:'招摇以东三百里，多白猿、水玉、黄金。'},
 {id:'yuanyi',name:'猿翼山',x:710,y:700,li:380,open:false,note:'堂庭以东三百八十里；正文称不可以上。'},
 {id:'niuyang',name:'杻阳山',x:950,y:700,li:370,open:true,note:'猿翼以东三百七十里；鹿蜀、旋龟与东流的怪水。'},
 {id:'di',name:'柢山',x:1190,y:700,li:300,open:false,note:'杻阳以东三百里，多水，无草木。'},
 {id:'danyuan',name:'亶爰山',x:1430,y:700,li:400,open:false,note:'柢山以东四百里，多水，无草木。'},
 {id:'ji',name:'基山',x:1670,y:700,li:300,open:false,note:'亶爰以东三百里，阳多玉，阴多怪木。'},
 {id:'qingqiu',name:'青丘山',x:1910,y:700,li:300,open:true,note:'基山以东三百里；九尾狐，英水南流入即翼之泽。'},
 {id:'jiwei',name:'箕尾山',x:2150,y:700,li:350,open:false,note:'青丘以东三百五十里，临东海。'},
];
export function zoomAt(view,factor,point){const width=Math.max(460,Math.min(2300,view.w/factor)),ratio=width/view.w;return {x:point.x-(point.x-view.x)*ratio,y:point.y-(point.y-view.y)*ratio,w:width,h:width*1500/2300};}
export function localPoint(location){return {x:260+location.x/location.width*1780,y:260+location.y/location.height*980};}
