import {assetPath} from './assets';
import {clayArt} from './clay';
import {animalMarkup} from './animal';
export const artSources: Record<string, string> = {
  shengsheng: assetPath('art-v2/shengsheng.png'),
  zhuyu: assetPath(clayArt+'zhuyu.png'),
  migu: assetPath(clayArt+'migu.png'),
  stone: assetPath(clayArt+'stone.png'),
  grove: assetPath(clayArt+'grove.png'),
  traveler: assetPath(clayArt+'traveler.png'),
};

export const artDetails: Record<string, {key:string; name:string; alt:string; traits:string[]; interpretation:string}> = {
  zhuyu: {key:'zhuyu',name:'祝余',alt:'一丛细长带状叶，叶间开着青蓝色小花的祝余',traits:['状如韭 · 细长带状叶','青华 · 青色的花'],interpretation:'依据原文确定叶形与花色；花瓣数量、根系、花序和青色的具体色调属于美术演绎。'},
  migu: {key:'migu',name:'迷榖',alt:'具有锯齿及裂叶、黑色树干纹理和浅色发光花簇的迷榖',traits:['状如榖 · 参考楮的叶形','黑理 · 深黑树皮纹路','华四照 · 花向四方发光'],interpretation:'“榖”参考注文“楮也”呈现锯齿叶与部分裂叶。具体树形、花色、花序与光效为演绎，并非现代植物的鉴定图。'},
  ears: {key:'shengsheng',name:'狌狌',alt:'同一只猿猴形态的狌狌，分别伏行和直立，双耳具有显眼白毛',traits:['状如禺 · 猿猴近似形态','白耳 · 两侧耳部为白色','伏行人走 · 两种行动姿态'],interpretation:'白耳与行动来自原文；毛色、面部和肢体比例为创作。“禺”不直接等同于某个现代物种。'},
  gait: {key:'shengsheng',name:'狌狌 · 行动对照',alt:'左侧狌狌四肢伏行，右侧同一只狌狌直立迈步，均为白耳',traits:['左 · 伏行','右 · 人走'],interpretation:'用两个姿态帮助理解“伏行人走”。步频、停留时间与动作衔接属于游戏演绎。'},
  stone: {key:'stone',name:'山中金玉',alt:'灰绿色粗糙山石，断面带柔和青绿色矿质及少量金色斑点',traits:['多金玉 · 招摇山的物产'],interpretation:'正文只说“多金玉”，未规定矿物种类、晶形或颜色。图中的青绿色断面、金色斑点、岩层与苔藓用于表现山中原石，不是矿物鉴定结论。'},
};

export function specimen(id:string, compact=false) {
  const a=artDetails[id];
  if(a?.key==='shengsheng'&&!compact)return `<figure class="art-plate">${animalMarkup('shengsheng')}<button class="animal-zoom" data-art="${id}">展开互动图鉴 ↗</button></figure>`;
  if(!a) return '<div class="specimen river" aria-hidden="true">≈</div>';
  return `<figure class="art-plate ${compact?'compact':''} ${a.key}"><button class="art-open" data-art="${id}" aria-label="放大查看${a.name}"><img src="${artSources[a.key]}" alt="${a.alt}"/><span class="plate-action">细看图鉴 ↗</span></button><figcaption>${a.traits.map(t=>`<span>${t}</span>`).join('')}</figcaption></figure>`;
}
