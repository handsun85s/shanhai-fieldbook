import {assetPath} from './assets';
import {creature, sheetMarkup} from './creatures';
import {sound} from './sound';
import './animal.css';

export function animalMarkup(id: string) {
  const animal = creature(id);
  if (!animal) return '';
  const actionLabel = `点击${animal.name}，${animal.action}`;
  const audioExamples: Record<string, string> = {
    lushu: '如谣 → 真人哼唱', xuangui: '如判木 → 木料裂响', ninefox: '如婴儿 → 婴儿哭声',
  };
  return `<section class="animal-experience" data-animal="${id}" aria-label="${animal.name}互动观察">
    <button type="button" class="animal-stage" aria-label="${actionLabel}">
      <span class="animal-window">
        <span class="animal-hill"></span><span class="animal-shadow"></span>
        ${sheetMarkup(id, 'animal-sheet')}
      </span>
      <span class="detail-locator" aria-hidden="true" hidden>
        ${sheetMarkup(id, 'locator-sheet')}<span class="locator-mark"></span>
      </span>
      <span class="animal-tap">点击它 · ${animal.action}</span>
    </button>
    <div class="trait-buttons" role="group" aria-label="放大观察身体特征">
      ${animal.traits.map((t, i) => `<button type="button" data-trait="${i}" aria-pressed="false">${t.label}</button>`).join('')}
    </div>
    <div class="animal-buttons">
      <button type="button" class="animal-action">${animal.action} ↗</button>
      ${animal.call ? '<button type="button" class="animal-voice">试听声音示例 ♪</button>' : ''}
    </div>
    <p class="animal-status" role="status">点选特征可以放大细看。</p>
    <p class="animal-audio-note">${animal.call
      ? `声音参照：${audioExamples[animal.call]}。<a href="${assetPath('audio-v2/LICENSES.md')}" target="_blank" rel="noopener">录音来源 ↗</a>`
      : '点击动作与姿态变化为游戏演绎。'}</p>
  </section>`;
}

function bindAnimal(el: HTMLElement) {
  const id = el.dataset.animal!;
  const animal = creature(id);
  const stage = el.querySelector<HTMLButtonElement>('.animal-stage')!;
  const sprite = el.querySelector<HTMLElement>('.animal-sheet')!;
  const locator = el.querySelector<HTMLElement>('.detail-locator')!;
  const caption = el.querySelector<HTMLElement>('.animal-tap')!;
  const status = el.querySelector<HTMLElement>('.animal-status')!;
  const traitButtons = Array.from(el.querySelectorAll<HTMLButtonElement>('[data-trait]'));
  const voice = el.querySelector<HTMLButtonElement>('.animal-voice');
  const actionLabel = stage.getAttribute('aria-label')!;
  const actionCaption = caption.textContent!;
  let timer = 0;
  let activeTrait = -1;
  let standing = false;
  let disposed = false;
  let busy = false;
  let voiceRequest = 0;

  const setFrame = (n: number) => sprite.style.setProperty('--frame', String(n));
  const recordObservation = (trait: string) => el.dispatchEvent(new CustomEvent('field-evidence', {
    bubbles: true, detail: {id, trait},
  }));

  function fullView() {
    window.clearInterval(timer);
    stage.classList.remove('is-detail');
    locator.hidden = true;
    stage.setAttribute('aria-label', actionLabel);
    caption.textContent = actionCaption;
    activeTrait = -1;
    traitButtons.forEach(button => button.setAttribute('aria-pressed', 'false'));
    setFrame(id === 'shengsheng' && standing ? 1 : 0);
  }

  function showAction() {
    fullView();
    recordObservation('动作');
    if (id === 'shengsheng') {
      standing = !standing;
      setFrame(standing ? 1 : 0);
      status.textContent = standing ? '人走：两足直立。再点一次比较伏行。' : '伏行：四肢贴近地面。';
      return;
    }
    status.textContent = id === 'fox' ? '留意尾部的姿态变化。尾数见于原文，动作是演绎。'
      : id === 'xuangui' ? '观察脚掌与头颈的变化，寻找龟身、鸟首和蛇状尾。'
      : '对照相邻姿态，看看四肢怎样变化。';
    setFrame(1);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let step = 0;
    timer = window.setInterval(() => {
      step++;
      if (step >= 8) {
        window.clearInterval(timer);
        setFrame(0);
      } else {
        setFrame(step % 2 ? 2 : 1);
      }
    }, id === 'xuangui' ? 360 : 220);
  }

  function inspect(index: number) {
    const trait = animal.traits[index];
    if (trait.comparePoses) {
      showAction();
      return;
    }
    if (activeTrait === index) {
      fullView();
      status.textContent = '已回到全貌。';
      return;
    }
    window.clearInterval(timer);
    standing = false;
    setFrame(0); // Feature coordinates are measured on the first pose.
    activeTrait = index;
    traitButtons.forEach((button, n) => button.setAttribute('aria-pressed', String(n === index)));
    stage.style.setProperty('--detail-x', trait.x + '%');
    stage.style.setProperty('--detail-y', trait.y + '%');
    stage.style.setProperty('--detail-zoom', String(trait.zoom));
    stage.classList.add('is-detail');
    locator.hidden = false;
    caption.textContent = '点图返回全貌';
    stage.setAttribute('aria-label', `${animal.name} · ${trait.label}近观，点击返回全貌`);
    status.textContent = `${trait.label} · 原文「${trait.quote}」。`;
    recordObservation(trait.label);
  }

  stage.onclick = () => {
    if (activeTrait === -1) showAction();
    else {
      fullView();
      status.textContent = '已回到全貌。';
    }
  };
  el.querySelector<HTMLButtonElement>('.animal-action')!.onclick = showAction;
  traitButtons.forEach((button, index) => { button.onclick = () => inspect(index); });
  if (voice) voice.onclick = async () => {
    if (busy) {
      voiceRequest++;
      busy = false;
      sound.stopCall();
      voice.textContent = '试听声音示例 ♪';
      status.textContent = '已停止试听。';
      return;
    }
    const token = ++voiceRequest;
    busy = true;
    voice.textContent = '停止声音 ■';
    status.textContent = '正在加载声音示例…';
    try {
      if (!await sound.start()) throw Error('Audio unavailable');
      if (disposed || token !== voiceRequest) return;
      recordObservation('声音');
      status.textContent = '正在播放原文比喻的录音参照。';
      await sound.call(animal.call!);
      if (!disposed && token === voiceRequest) status.textContent = '播放结束。你听到的声音对应原文哪几个字？';
    } catch {
      if (!disposed && token === voiceRequest) status.textContent = '声音未能加载，可以重试或用文字线索完成。';
    } finally {
      if (!disposed && token === voiceRequest) {
        busy = false;
        voice.textContent = '试听声音示例 ♪';
      }
    }
  };

  return () => {
    disposed = true;
    voiceRequest++;
    window.clearInterval(timer);
    if (busy) sound.stopCall();
  };
}

export function bindAnimals(container: HTMLElement) {
  const cleanups = Array.from(container.querySelectorAll<HTMLElement>('.animal-experience'), bindAnimal);
  return () => cleanups.forEach(cleanup => cleanup());
}
