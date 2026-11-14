// Obtain storage lazily: even accessing localStorage can throw in restricted browsers.
export function readSave(key, getStorage = () => globalThis.localStorage) {
  try {
    return { raw: getStorage().getItem(key), ok: true };
  } catch {
    return { raw: null, ok: false };
  }
}

export function writeSave(key, value, getStorage = () => globalThis.localStorage) {
  try {
    getStorage().setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
