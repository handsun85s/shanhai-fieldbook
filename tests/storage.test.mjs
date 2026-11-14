import test from 'node:test';
import assert from 'node:assert/strict';
import {readSave, writeSave} from '../src/storage.mjs';

test('浏览器禁用存储时仍可开始，写入失败不抛异常', () => {
  const denied = () => { throw new Error('SecurityError'); };
  assert.deepEqual(readSave('progress', denied), {raw:null, ok:false});
  assert.equal(writeSave('progress', {facts:['ears']}, denied), false);
});

test('空间不足保留旧存档，空间恢复后可重试保存', () => {
  let raw = '{"facts":[]}';
  let full = true;
  const storage = () => ({
    getItem: () => raw,
    setItem: (_, value) => { if(full) throw new Error('QuotaExceededError'); raw=value; },
  });
  const progress = {facts:['ears']};
  assert.equal(writeSave('progress', progress, storage), false);
  assert.equal(readSave('progress', storage).raw, '{"facts":[]}');
  full = false;
  assert.equal(writeSave('progress', progress, storage), true);
  assert.deepEqual(JSON.parse(readSave('progress', storage).raw), progress);
});
