export const CAMPAIGN_KEY = 'shanhai-volumes-v1';

export function validVolume(number) {
  return Number.isInteger(number) && number >= 1 && number <= 18;
}

export function blankCampaign() {
  return { current: 1, arrived: [], answers: {}, finale: [] };
}

// Only keep a continuous prefix of correctly answered questions. An interrupted
// walk may be repeated, and arriving alone never earns the chapter seal.
function correctPrefix(values, key) {
  if (!Array.isArray(values)) return [];
  const correct = [];
  for (const answer of key) {
    if (values[correct.length] !== answer) break;
    correct.push(answer);
  }
  return correct;
}

export function restoreCampaign(raw, keys, finalKey) {
  const state = blankCampaign();
  let input;
  try { input = JSON.parse(raw || '{}'); } catch { return state; }
  if (!input || typeof input !== 'object') return state;
  if (validVolume(input.current)) state.current = input.current;
  for (let i = 0; i < keys.length; i++) {
    const volume = i + 1;
    if (!Array.isArray(input.arrived) || !input.arrived.includes(volume)) continue;
    state.arrived.push(volume);
    state.answers[volume] = correctPrefix(input.answers?.[volume], keys[i]);
  }
  if (keys.every((key,i) => state.answers[i + 1]?.length === key.length)) {
    state.finale = correctPrefix(input.finale, finalKey);
  }
  return state;
}

// Progress only moves forward. Merge independent tabs before writing a checkpoint.
export function mergeCampaign(local, other) {
  const result = {current:local.current,arrived:[...new Set([...local.arrived,...other.arrived])],answers:{},finale:local.finale};
  for (const v of result.arrived) {
    const a = local.answers[v] || [], b = other.answers[v] || [];
    result.answers[v] = a.length >= b.length ? [...a] : [...b];
  }
  if (other.finale.length > local.finale.length) result.finale = [...other.finale];
  return result;
}
