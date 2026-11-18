import {assetPath} from './assets';
import './study-plate.css';

type Detail = {name: string; x: number; y: number; zoom: number; prompt: string};
export type Plate = {alt: string; caption: string; details: [Detail, Detail]};

// x/y are percentages of the uncropped square image, measured on each final plate.
const plates: Plate[] = [
  {
    alt: '丹穴山的彩羽大鸟侧身立在岩石上，长尾垂在身后',
    caption: '凤皇的黏土想象图',
    details: [
      {name:'翼羽', x:53, y:46, zoom:2.15, prompt:'看相邻的羽片。哪几种颜色叠在同一侧翅膀上？'},
      {name:'长尾', x:26, y:73, zoom:1.8, prompt:'从身体往后追踪一根长羽，它在哪里弯了一个弯？'},
    ],
  },
  {
    alt: '落日照亮赤色山岭和石间金黄色的纹理，岩阶延伸向山中',
    caption: '天山地景想象图，帝江的形貌见经文',
    details: [
      {name:'岩间色带', x:19, y:63, zoom:2.1, prompt:'在一块岩面上找两种颜色。亮色沿着岩块的哪一面延伸？'},
      {name:'山中小径', x:57, y:63, zoom:2.05, prompt:'用眼睛沿小径向远处走，哪一段会被突出的山岩挡住？'},
    ],
  },
  {
    alt: '海边礁石上有一只衔枝的黑翅鸟，翅膀扬起，脚踩岩面',
    caption: '精卫的黏土想象图',
    details: [
      {name:'鸟喙', x:79, y:43, zoom:2.25, prompt:'从喙尖向外看，鸟带来的东西和岸边的礁石有什么不同？'},
      {name:'立足处', x:45, y:72, zoom:2.15, prompt:'先看足爪，再看看翅膀。它们的颜色一样吗？'},
    ],
  },
  {
    alt: '林地里有一只长耳异兽，头部有弯喙，细长的尾巴向后卷起',
    caption: '犰狳的黏土想象图',
    details: [
      {name:'口鼻', x:84, y:58, zoom:2.3, prompt:'从眼睛沿脸颊看到嘴尖，嘴的末端朝哪个方向弯？'},
      {name:'尾梢', x:23, y:55, zoom:2.15, prompt:'顺着细尾画一个圈，尾巴和背上的毛皮看起来有什么区别？'},
    ],
  },
  {
    alt: '绿茎的枝节处伸出叶子，小黄花和成簇的红果夹在叶间',
    caption: '荀草的局部想象图',
    details: [
      {name:'花簇', x:83, y:62, zoom:2.2, prompt:'看花心周围的边缘，再找旁边的果实，轮廓有什么不同？'},
      {name:'茎节', x:48, y:51, zoom:2, prompt:'沿主茎向上看，叶柄和果梗从哪些位置伸出来？'},
    ],
  },
  {
    alt: '三株树长在红色水流旁，枝头点缀着发亮的浅色圆珠',
    caption: '赤水与三株树的想象图',
    details: [
      {name:'枝头', x:51, y:41, zoom:2.25, prompt:'从枝尖往里看，亮点是独个出现，还是密密地沿着枝条分布？'},
      {name:'水岸', x:56, y:88, zoom:1.9, prompt:'水里的亮纹和岸边石头的纹路，弯曲的方向一样吗？'},
    ],
  },
  {
    alt: '青绿色的灭蒙鸟立在山崖，背羽层叠，红色长尾沿岩面垂下',
    caption: '灭蒙鸟的黏土想象图',
    details: [
      {name:'背羽', x:52, y:39, zoom:2.15, prompt:'留意背上相邻两层羽片，它们是同一种深浅吗？'},
      {name:'尾羽', x:35, y:76, zoom:1.95, prompt:'从尾羽根部看到末端，它们朝几个不同的方向弯曲？'},
    ],
  },
  {
    alt: '一张闭眼的面孔旁绕着赤色鳞片，只取烛阴头部一角',
    caption: '烛阴局部想象图，取闭目一刻',
    details: [
      {name:'眼睑', x:71, y:37, zoom:2, prompt:'看看眼睑弯曲的轮廓，这一刻适合放在哪一句原文旁？'},
      {name:'鳞片', x:23, y:64, zoom:2, prompt:'在相邻的两排鳞片里，能找到互相压住的边缘吗？'},
    ],
  },
  {
    alt: '水边的大树伸出粗壮枝条，右上枝旁露出一轮太阳',
    caption: '扶桑枝头局部，画中只取一轮日',
    details: [
      {name:'上枝', x:82, y:22, zoom:2, prompt:'顺着树枝向亮处找过去。图中这一轮日落在枝的哪一侧？'},
      {name:'临水处', x:60, y:80, zoom:1.9, prompt:'看看靠水的枝干，再回到经文，哪些部分在这个局部画面以外？'},
    ],
  },
  {
    alt: '深色的兕卧在水边，头顶一角上弯，前足收在身前',
    caption: '湘水南岸的兕，黏土想象图',
    details: [
      {name:'头顶', x:75, y:25, zoom:2.1, prompt:'顺着头顶外缘往上看，哪一处伸到了背景之外？'},
      {name:'躯干', x:34, y:52, zoom:2, prompt:'同一片深色的身体上，哪些地方受光，哪些地方藏在阴影里？'},
    ],
  },
  {
    alt: '昆仑远景中，雪峰与绿色山脊层层后退，前景有一段山石台阶',
    caption: '昆仑山地想象图，开明兽的形貌见经文',
    details: [
      {name:'远峰', x:36, y:22, zoom:2.05, prompt:'顺着峰顶的亮线望过去，能分辨出几层前后相叠的山吗？'},
      {name:'岩阶', x:60, y:77, zoom:1.9, prompt:'近处的石阶和远山相比，哪一处能看到更清楚的表面纹路？'},
    ],
  },
  {
    alt: '五彩长尾兽站在林地，长尾向右转弯，尾梢回到前景',
    caption: '驺吾的黏土想象图',
    details: [
      {name:'身侧', x:51, y:36, zoom:2.1, prompt:'沿着身侧三条色纹看，它们的宽度和走向相同吗？'},
      {name:'回转的尾', x:60, y:72, zoom:1.65, prompt:'从尾根到尾梢用眼睛走完全程，哪里能看出这条尾巴的长度？'},
    ],
  },
  {
    alt: '从高处俯看山间的水路，河流在沙岸之间曲折伸向远方',
    caption: '淮水阅读示景，曲岸为画面设计',
    details: [
      {name:'河湾', x:68, y:44, zoom:2, prompt:'从近岸沿弯道往后看，水道经过哪一边又折回来？'},
      {name:'远水', x:77, y:19, zoom:2.15, prompt:'把远处水面和近处河湾比一比，哪里还能分清两边的岸线？'},
    ],
  },
  {
    alt: '苍色的夔在海浪中的礁石上昂首，腹下一足立在石面',
    caption: '流波山夔的黏土想象图',
    details: [
      {name:'额顶', x:66, y:25, zoom:2.1, prompt:'从额头向后沿头顶描一条线，看看轮廓在哪里改变方向。'},
      {name:'足与礁石', x:50, y:73, zoom:2, prompt:'沿腹下往岩面找，哪些地方支撑身体，哪些线条属于背景浪花？'},
    ],
  },
  {
    alt: '两只彩鸟相对，一只立在左侧石台，另一只张翼抬足',
    caption: '鸾鸟与凤鸟的歌舞想象图',
    details: [
      {name:'左侧的鸟', x:26, y:42, zoom:1.95, prompt:'先看头颈和双足，左边的鸟是怎样站在石台上的？'},
      {name:'右侧的鸟', x:75, y:39, zoom:1.85, prompt:'比较两只鸟的翅膀。哪些姿态让这一只显得正在动？'},
    ],
  },
  {
    alt: '两面石壁在谷口相对，左右岩台各立一只黄色守兽',
    caption: '不周山想象图，守兽的具体兽形为美术演绎',
    details: [
      {name:'山口', x:53, y:34, zoom:1.95, prompt:'从两峰之间向远处望，山体在哪一段留下了缺口？'},
      {name:'岩台守兽', x:18, y:57, zoom:2.15, prompt:'记下你看见的轮廓，再查原文，画面中的哪些细节书里确实写了？'},
    ],
  },
  {
    alt: '高大竹竿分节向上生长，竹林旁铺开赤红的水泽',
    caption: '附禺山竹林与封渊的想象图',
    details: [
      {name:'竹节', x:26, y:43, zoom:2.15, prompt:'沿同一根竹竿向上找，相邻的节痕之间是什么形状？'},
      {name:'泽畔', x:74, y:74, zoom:1.9, prompt:'看竹林边缘与水面相接的地方，两种颜色在哪里相遇？'},
    ],
  },
  {
    alt: '紫色枝茎上有绿叶、深色花朵和成簇黄果，呈现建木局部',
    caption: '建木花果局部想象图',
    details: [
      {name:'花心', x:34, y:31, zoom:2.2, prompt:'从花心看到花瓣边缘，亮处与暗处各在什么位置？'},
      {name:'果梗', x:77, y:30, zoom:2, prompt:'从果实沿梗回到枝条，看看三处相接时颜色怎样变化。'},
    ],
  },
];

function translation(position: number, zoom: number) {
  return Math.max(1 - zoom, Math.min(0, .5 - position / 100 * zoom)) * 100;
}

export function mountStudyPlate(host: HTMLElement, volume: number): () => void {
  const plate = plates[volume - 1];
  if (!plate) return () => {};
  return mountAnnotatedPlate(host, plate, assetPath('book-plates/' + String(volume).padStart(2, '0') + '.webp'));
}

export function mountAnnotatedPlate(host: HTMLElement, plate: Plate, url: string, onInspect?: () => void): () => void {
  const figure = document.createElement('figure');
  figure.className = 'study-plate';
  figure.innerHTML = `<div class="study-plate-frame"><img alt=""/></div>
    <figcaption><span class="study-plate-caption"></span>
      <div class="study-plate-tools" role="group" aria-label="图版取景"></div>
      <p class="study-plate-prompt" aria-live="polite"></p>
    </figcaption>`;
  const frame = figure.querySelector<HTMLElement>('.study-plate-frame')!;
  const picture = frame.querySelector('img')!;
  picture.alt = plate.alt;
  figure.querySelector('.study-plate-caption')!.textContent = plate.caption;
  const tools = figure.querySelector<HTMLElement>('.study-plate-tools')!;
  const prompt = figure.querySelector<HTMLElement>('.study-plate-prompt')!;
  const pins: HTMLButtonElement[] = [];
  const controls: HTMLButtonElement[] = [];
  const events = new AbortController();

  function select(index: number) {
    const detail = plate.details[index];
    controls.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index + 1)));
    pins.forEach(button => button.hidden = !!detail);
    picture.style.transform = detail
      ? `translate(${translation(detail.x, detail.zoom)}%, ${translation(detail.y, detail.zoom)}%) scale(${detail.zoom})`
      : 'none';
    prompt.textContent = detail?.prompt ?? '点图上的圆点，或选下方的部位，放大观察。';
    if (detail) onInspect?.();
  }

  for (const [index, label] of ['全图', ...plate.details.map(detail => detail.name)].entries()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => select(index - 1), {signal: events.signal});
    tools.append(button);
    controls.push(button);
  }
  plate.details.forEach((detail, index) => {
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'study-plate-pin';
    pin.textContent = String(index + 1);
    pin.title = detail.name;
    pin.setAttribute('aria-label', '放大' + detail.name);
    pin.tabIndex = -1; // The labeled controls below provide the same keyboard targets.
    pin.style.left = detail.x + '%';
    pin.style.top = detail.y + '%';
    pin.addEventListener('click', () => {
      select(index);
      controls[index + 1].focus({preventScroll: true});
    }, {signal: events.signal});
    frame.append(pin);
    pins.push(pin);
    controls[index + 1].dataset.pin = String(index + 1);
  });
  picture.addEventListener('error', () => {
    frame.hidden = true;
    tools.hidden = true;
    prompt.textContent = '图版暂时没有载入，仍可阅读经文并完成考察。';
  }, {signal: events.signal});
  picture.decoding = 'async';
  picture.loading = 'lazy';
  picture.src = url;
  select(-1);
  host.append(figure);

  return () => {
    events.abort();
    figure.remove();
  };
}
