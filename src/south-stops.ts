import {assetPath} from './assets';
import {mountAnnotatedPlate, type Plate} from './study-plate';
import {readSave, writeSave} from './storage.mjs';
import type {Study} from './chapter-studies';

type SouthStop = {
  name: string;
  location: string;
  lead: string;
  plate: Plate;
  quote: string;
  simpleQuote: string;
  tasks: Study['tasks'];
};

// Keys are zero-based passage indices in volume one, including the two mountains
// marked 不可以上. The observer stays below both of those mountains.
const stops: Record<number, SouthStop> = {
  2: {
    name: '猿翼山', location: '山脚水边',
    lead: '从堂庭向东来到猿翼山。停在山脚，隔水看山，再分清书中哪些东西有名字、哪些只写了一个“怪”字。',
    plate: {
      alt: '从猿翼山脚向山中望去，溪水绕过浅色岩石，岸上可见形状奇异的树木。',
      caption: '山脚遥察 · 水与白玉的地景想象图',
      details: [
        {name:'近水处', x:52, y:83, zoom:1.85, prompt:'在水里找游动的轮廓，哪些轮廓会被水面的光影遮住？'},
        {name:'山脚岩面', x:18, y:63, zoom:2, prompt:'留意光照下的浅色石面。书中用哪个词记录这座山的物产？'},
      ],
    },
    quote: '又東三百八十里，曰猨翼之山，其中多怪獸，水多怪魚，多白玉，多腹虫，多怪蛇，多怪木，不可以上。',
    simpleQuote: '又东三百八十里，曰猨翼之山，其中多怪兽，水多怪鱼，多白玉，多腹虫，多怪蛇，多怪木，不可以上。',
    tasks: [
      {prompt:'准备在手记里画水中的鱼。原文给了哪条线索？',options:['白身赤尾', '只写“怪鱼”，没有写鱼的具体样子', '蛇尾有翼'],answer:1,explain:'“水多怪魚”标出了水里有什么；形状、颜色和叫声都没有接着写。'},
      {prompt:'走到山脚，选择与这段文字相合的考察记录。',options:['登顶辨认怪木种类','到山顶数清全部怪蛇','留在山脚遥察，记下“不可以上”'],answer:2,explain:'叙述在“不可以上”收住了。玩家从山脚看这座山，也能记下文中列举的东西。'},
    ],
  },
  4: {
    name: '柢山', location: '岸上石滩',
    lead: '在常人的想象中，鱼生活在水里。在柢山，读到“陵居”两个字，得换个地方找鯥。',
    plate: {
      alt: '柢山石滩上的鯥，轮廓像牛，身侧有翼，长尾在岩面上弯曲。',
      caption: '陆居的鯥 · 黏土想象图',
      details: [
        {name:'侧翼', x:38, y:47, zoom:2, prompt:'先从背部找到身侧，鱼身的轮廓在哪里向外展开？'},
        {name:'尾部', x:84, y:67, zoom:1.85, prompt:'沿身体找到尾梢，弯曲的轮廓让你想起哪种动物？'},
      ],
    },
    quote: '又東三百里柢山，多水，無草木。有魚焉，其狀如牛，陵居，蛇尾有翼，其羽在魼下，其音如留牛，其名曰鯥',
    simpleQuote: '又东三百里柢山，多水，无草木。有鱼焉，其状如牛，陵居，蛇尾有翼，其羽在魼下，其音如留牛，其名曰鯥',
    tasks: [
      {prompt:'想看“陵居”的鯥，应把观察点放在哪里？', options:['池底', '树冠', '陆地上'], answer:2, explain:'书称它为鱼，却又明写“陵居”，说它生活在陆地上。柢山“多水”是地点的特征。'},
      {prompt:'哪一对形貌能从鯥的同一句原文里直接找到？', options:['蛇尾、有翼', '鸟首、九尾', '白耳、赤足'], answer:0, explain:'“蛇尾有翼”给出两处可画的特征，“其狀如牛”再说明整体轮廓。'},
    ],
  },
  5: {
    name: '亶爰山', location: '山脚望台',
    lead: '在山脚远远观察名叫“类”的兽。它的名字只有一个字，形貌线索也只用了短短一句。',
    plate: {
      alt: '亶爰山脚遥望的狸形异兽，颈边生有长毛，立在石地上。',
      caption: '山脚遥察 · 类的黏土想象图',
      details: [
        {name:'颈边长毛', x:63, y:46, zoom:2.15, prompt:'从耳边往肩部看，哪一圈毛比身躯上的毛更长？'},
        {name:'身形', x:48, y:56, zoom:1.55, prompt:'看看整只兽的轮廓，再在原文中找一个用来比拟它的字。'},
      ],
    },
    quote: '又東四百里，曰亶爰之山，多水，無草木，不可以上。有獸焉，其狀如狸而有髦，其名曰類',
    simpleQuote: '又东四百里，曰亶爰之山，多水，无草木，不可以上。有兽焉，其状如狸而有髦，其名曰类',
    tasks: [
      {prompt:'哪一栏能同时写下“类”的整体形貌和局部特征？', options:['形状像狸，长着髦毛', '形状像羊，眼在背上', '形状像虎，长着九首'], answer:0, explain:'“其狀如狸”是整体的比喻，“而有髦”补上长毛这处局部。'},
      {prompt:'为这次遥察选一条与正文相合的地点说明。', options:['草木繁茂，从密林向山顶走', '多水、无草木，停在山脚远望', '山上无水，在海中划船观察'], answer:1, explain:'“多水，無草木，不可以上”先后写了环境和登山的限制。山脚望台是游戏安排的观察位置。'},
    ],
  },
  6: {
    name: '基山', location: '两坡之间',
    lead: '山的两面记着不同的物产。先分辨坡面，再循“其阳”“其阴”两个词给观察记录定位。',
    plate: {
      alt: '基山相对的两个坡面，一侧透出玉石，另一侧有盘曲奇木。',
      caption: '基山两坡 · 玉石与怪木的想象图',
      details: [
        {name:'玉石坡', x:27, y:62, zoom:1.95, prompt:'在岩面里找出质地有别的一处。哪种纹理让这块石头醒目？'},
        {name:'林木坡', x:73, y:49, zoom:1.85, prompt:'沿着一株树从根看到枝，哪里能看到转折或分叉？'},
      ],
    },
    quote: '又東三百里，曰基山，其陽多玉，其陰多怪木。有獸焉，其狀如羊，九尾四耳，其目在背，其名曰猼訑',
    simpleQuote: '又东三百里，曰基山，其阳多玉，其阴多怪木。有兽焉，其状如羊，九尾四耳，其目在背，其名曰猼訑',
    tasks: [
      {prompt:'给两张坡面物产卡贴签，怎样才能与正文相合？', options:['阳面和阴面都只写玉','阳面记怪木，阴面记玉','阳面记玉，阴面记怪木'], answer:2, explain:'“其陽多玉，其陰多怪木”两小句格式一样，各自对应一面山坡。'},
      {prompt:'同伴在基山读到“九尾”，就把兽画成了狐狸。再看哪个细节能辨认它？', options:['形状像羊，眼在背上','头白、尾红','形状像狐，有四足'], answer:0, explain:'原文另写了“其狀如羊”“其目在背”。用不止一条特征，才不会把猼訑和青丘的狐画混。'},
    ],
  },
  8: {
    name: '箕尾山', location: '东海岸',
    lead: '山路来到海边。把“山临哪片海”和“山里的水流向哪里”各记一行。',
    plate: {
      alt: '箕尾山的岩坡向海伸出，沙石铺在水边，浪花沿岸卷起。',
      caption: '箕尾山临海的想象图，汸水流向见经文',
      details: [
        {name:'沙石滩', x:32, y:45, zoom:1.95, prompt:'在浪线旁找两块大小不同的石头，石缝里还能看到什么？'},
        {name:'海与山尾', x:57, y:29, zoom:1.75, prompt:'寻找山体的边缘，在哪一段能同时看到山尾和海面？'},
      ],
    },
    quote: '又東三百五十里，曰箕尾之山，其尾踆於東海，多沙石。汸水出焉，而南流注於淯，其中多白玉。',
    simpleQuote: '又东三百五十里，曰箕尾之山，其尾踆于东海，多沙石。汸水出焉，而南流注于淯，其中多白玉。',
    tasks: [
      {prompt:'给山尾的景物配图，哪一组都有原文依据？', options:['西海、竹林', '东海、沙石', '北海、赤色水泽'], answer:1, explain:'“其尾踆於東海，多沙石”把海的方位与山尾的物产写在了一起。'},
      {prompt:'汸水从这里流出，哪条箭头是按正文画的？', options:['向东流入东海', '向北流入赤水', '向南流入淯'], answer:2, explain:'“而南流注於淯”同时写明流向与所注之水。山尾面临东海，和汸水的去向是两条线索。'},
    ],
  },
};

const progressKey = (index: number) => 'shanhai-south-stop-v1-' + index;
// If storage is full or disabled, keep this visit usable across screens until
// the page is closed. A later successful write folds it into the normal save.
const pendingProgress = new Map<number, {seen: boolean; answered: number}>();

function readProgress(index: number, stop: SouthStop) {
  const result = readSave(progressKey(index));
  const pending = pendingProgress.get(index);
  const progress = {ok:result.ok && !pending, seen:pending?.seen ?? false, answered:pending?.answered ?? 0};
  if (!result.raw) return progress;
  try {
    const record = JSON.parse(result.raw);
    if (record?.seen !== true || !Array.isArray(record.answers)) return progress;
    progress.seen = true;
    let valid = 0;
    while (valid < stop.tasks.length && record.answers[valid] === stop.tasks[valid].answer) valid++;
    progress.answered = Math.max(progress.answered, valid);
  } catch { /* A damaged entry can be replaced by the next successful observation. */ }
  return progress;
}

export function southStopDone(index: number): boolean {
  const stop = stops[index];
  return !!stop && readProgress(index, stop).answered === stop.tasks.length;
}

export function mountSouthStop(host: HTMLElement, index: number, onBack: () => void, onRead: () => void): () => void {
  const stop = stops[index];
  if (!stop) throw new Error('未知的南山考察段落');
  const key = progressKey(index);
  const root = document.createElement('section');
  root.innerHTML = `<div class="vol-head"><p class="vol-kicker"></p><h2></h2><p class="south-lead"></p></div>
    <div class="vol-study"><div class="south-plate"></div><section class="vol-evidence"></section></div>`;
  root.querySelector('.vol-kicker')!.textContent = '南山首段 · ' + stop.location;
  root.querySelector('h2')!.textContent = stop.name;
  root.querySelector('.south-lead')!.textContent = stop.lead;
  host.append(root);
  const panel = root.querySelector<HTMLElement>('.vol-evidence')!;
  const events = new AbortController();
  let seen = false;
  let answered = 0;
  let writable = true;
  let useOriginal = false;

  function mergeSaved() {
    const progress = readProgress(index, stop);
    writable = progress.ok;
    seen ||= progress.seen;
    answered = Math.max(answered, progress.answered);
  }
  function persist() {
    mergeSaved();
    writable = writeSave(key, {seen, answers:stop.tasks.slice(0, answered).map(t => t.answer)});
    if (writable) pendingProgress.delete(index);
    else pendingProgress.set(index, {seen, answered});
  }
  function notice() {
    const message = document.createElement('p');
    message.className = 'vol-save';
    message.hidden = writable;
    message.textContent = '暂时无法保存。这次山中考察仍可继续。';
    panel.append(message);
  }
  function button(label: string, style: string, click: () => void) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = style;
    b.textContent = label;
    b.addEventListener('click', click);
    return b;
  }
  function show(seekFocus = false) {
    panel.replaceChildren();
    const heading = document.createElement('h3');
    if (!seen) {
      heading.textContent = '就地观察';
      const prompt = document.createElement('p');
      prompt.className = 'vol-feedback';
      prompt.textContent = '点图中一个部位近看，也可以展开文字描述。观察后再核对原文。';
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = '读图版描述';
      const description = document.createElement('p');
      description.textContent = stop.plate.alt;
      details.append(summary, description, button('已观察，核对原文', 'vol-alt', observe));
      panel.append(heading, prompt, details);
    } else {
      const quote = document.createElement('blockquote');
      quote.textContent = useOriginal ? stop.quote : stop.simpleQuote;
      quote.lang = useOriginal ? 'zh-Hant' : 'zh-Hans';
      const rubric = document.createElement('p');
      rubric.className = 'vol-kicker';
      rubric.textContent = '《南山经》原文';
      const scriptSwitch = button(useOriginal ? '看简体' : '看底本文字', 'vol-link', () => {
        useOriginal = !useOriginal;
        quote.textContent = useOriginal ? stop.quote : stop.simpleQuote;
        quote.lang = useOriginal ? 'zh-Hant' : 'zh-Hans';
        scriptSwitch.textContent = useOriginal ? '看简体' : '看底本文字';
      });
      panel.append(rubric, quote, scriptSwitch);
      if (answered >= stop.tasks.length) {
        heading.textContent = stop.name + ' · 山印已收';
        panel.append(heading);
        const notes = document.createElement('ol');
        notes.className = 'vol-notes';
        for (const task of stop.tasks) {
          const item = document.createElement('li');
          item.textContent = task.explain;
          notes.append(item);
        }
        const actions = document.createElement('div');
        actions.className = 'vol-actions';
        actions.append(button('翻到本山全文 →', 'vol-main', onRead), button('返回', 'vol-alt', onBack));
        panel.append(notes, actions);
      } else {
        const task = stop.tasks[answered];
        const count = document.createElement('small');
        count.textContent = '原文查证 ' + (answered + 1) + ' / ' + stop.tasks.length;
        heading.textContent = task.prompt;
        const choices = document.createElement('div');
        choices.className = 'vol-choices';
        const feedback = document.createElement('p');
        feedback.className = 'vol-feedback';
        feedback.setAttribute('role', 'status');
        const next = button(answered === stop.tasks.length - 1 ? '查看山印 →' : '下一条线索 →', 'vol-main', () => show(true));
        next.hidden = true;
        task.options.forEach((label, choice) => {
          const answer = button(label, '', () => {
            if (choice !== task.answer) {
              answer.dataset.result = 'retry';
              feedback.textContent = '再读读这句。' + task.explain;
              return;
            }
            choices.querySelectorAll('button').forEach(b => b.disabled = true);
            answer.dataset.result = 'correct';
            answered++;
            persist();
            panel.querySelector<HTMLElement>('.vol-save')!.hidden = writable;
            feedback.textContent = '找到了。' + task.explain;
            next.hidden = false;
            next.focus({preventScroll:true});
          });
          choices.append(answer);
        });
        panel.append(count, heading, choices, feedback, next);
      }
    }
    notice();
    if (seekFocus) { heading.tabIndex = -1; heading.focus({preventScroll:true}); }
  }
  function observe() {
    if (seen) return;
    seen = true;
    persist();
    show();
  }
  mergeSaved();
  show();
  const unmount = mountAnnotatedPlate(root.querySelector('.south-plate')!, stop.plate,
    assetPath('book-plates/south-' + index + '.webp'), observe);
  window.addEventListener('storage', e => {
    if (e.key !== key) return;
    const before = [seen, answered].join(',');
    mergeSaved();
    if (before !== [seen, answered].join(',')) show();
  }, {signal:events.signal});
  return () => { events.abort(); unmount(); root.remove(); };
}
