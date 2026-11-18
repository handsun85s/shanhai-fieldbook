import {assetPath} from './assets';
export const creatureFolder='art-clay-v2/';
export type CreatureID='lushu'|'shengsheng'|'xuangui'|'fox'|'ape';
type Trait={label:string;quote:string;x:number;y:number};
export const creatures:Record<CreatureID,{name:string;file:string;frames:number;call?:string;action:string;traits:Trait[]}>={
 lushu:{name:'鹿蜀',file:'lushu',frames:3,call:'lushu',action:'观察踏步',traits:[{label:'白色头部',quote:'白首',x:82,y:30},{label:'虎纹身躯',quote:'其文如虎',x:51,y:52},{label:'红色尾巴',quote:'赤尾',x:19,y:56}]},
 shengsheng:{name:'狌狌',file:'shengsheng',frames:3,action:'伏行 / 人走',traits:[{label:'看白耳',quote:'而白耳',x:76,y:35},{label:'看猿猴形态',quote:'其状如禺',x:50,y:53},{label:'比较两种姿态',quote:'伏行人走',x:50,y:70}]},
 xuangui:{name:'旋龟',file:'xuangui',frames:3,call:'xuangui',action:'观察缓行',traits:[{label:'龟身',quote:'其状如龟',x:50,y:52},{label:'鸟首',quote:'鸟首',x:82,y:48},{label:'蛇状尾',quote:'虺尾',x:20,y:60}]},
 fox:{name:'九尾狐',file:'fox',frames:3,call:'ninefox',action:'观察尾部变化',traits:[{label:'狐的形态',quote:'其状如狐',x:72,y:64},{label:'逐条数尾巴',quote:'而九尾',x:45,y:35}]},
 ape:{name:'白猿',file:'whiteape',frames:3,action:'观察抬手与转头',traits:[{label:'白色毛发',quote:'多白猿',x:50,y:52},{label:'猿的形态',quote:'多白猿',x:75,y:38}]},
};
export function creature(id:string){return creatures[id as CreatureID];}
export function creatureURL(id:string){const a=creature(id);return a?assetPath(creatureFolder+a.file+'.webp'):'';}
export function sheetMarkup(id:string,cls=''){const a=creature(id);return a?`<span class="clay-frame ${cls}" role="img" aria-label="${a.name}黏土插图" style="background-image:url('${creatureURL(id)}');--frame:0"></span>`:'';}
export function drawFrame(c:CanvasRenderingContext2D,image:HTMLImageElement,x:number,y:number,height:number,frame=0,flip=false,frames=3){if(!image.complete||!image.naturalWidth)return;const fw=image.naturalWidth/frames,width=height*fw/image.naturalHeight;c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.drawImage(image,fw*Math.min(frames-1,Math.max(0,frame)),0,fw,image.naturalHeight,-width/2,-height,width,height);c.restore();}
