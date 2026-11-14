import {test} from 'node:test';
import assert from 'node:assert/strict';
import {restore,record,finish,canFinish,FACTS} from '../src/progress.mjs';
test('伪装成字符串的证据不能恢复为已完成',()=>{const s=restore(JSON.stringify({completed:true,facts:FACTS.join(',')}));assert.deepEqual(s.facts,[]);assert.equal(s.completed,false);});
test('损坏存档安全恢复，坐标与未知知识被过滤',()=>{assert.equal(restore('{bad').started,false); const s=restore('{"x":99999,"y":-50,"facts":["fake","ears","ears"],"completed":true}');assert.equal(s.x,2150);assert.equal(s.y,200);assert.deepEqual(s.facts,['ears']);assert.equal(s.completed,false);});
test('重复观察不增加进度，未知记录不能解锁归途',()=>{let s=restore(null); s=record(record(s,'ears'),'ears');s=record(s,'fake');assert.equal(s.facts.length,1);assert.equal(canFinish(s),false);assert.equal(finish(s,'west').completed,false);});
test('五项证据与正确方向共同完成考察，存档往返保留完成状态',()=>{let s=restore(null);for(const f of FACTS)s=record(s,f);assert.equal(finish(s,'east').completed,false);s=finish(s,'west');assert.equal(s.completed,true);assert.deepEqual(restore(JSON.stringify(s)).facts,FACTS);assert.equal(restore(JSON.stringify(s)).completed,true);});
