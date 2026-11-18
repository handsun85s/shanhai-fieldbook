import assert from 'node:assert/strict';
import test from 'node:test';
import {restoreCampaign,mergeCampaign} from '../src/campaign-progress.mjs';

const answers=Array.from({length:18},()=>[1,2]), final=[1,0,2];
const restored=value=>restoreCampaign(JSON.stringify(value),answers,final);

test('到站后逐条恢复正确证据，错答和手填完成标志不能盖印',()=>{
  const state=restored({current:-1,arrived:[1,2,1],answers:{1:[1,0],2:[0,2],3:[1,2]},finale:final,finished:true});
  assert.deepEqual(state,{current:1,arrived:[1,2],answers:{1:[1],2:[]},finale:[]});
  assert.equal(restored({current:18}).current,18);
});

test('十八卷核对后才可继续归营，错误归档保留已答部分',()=>{
  const complete={arrived:answers.map((_,i)=>i+1),answers:Object.fromEntries(answers.map((key,i)=>[i+1,key]))};
  assert.deepEqual(restored({...complete,finale:[1,2,2]}).finale,[1]);
  assert.deepEqual(restored({...complete,finale:final}).finale,final);
  assert.deepEqual(restored({...complete,arrived:complete.arrived.slice(0,17),finale:final}).finale,[]);
});

test('合并已保存的进度，另一页较早的答案不会覆盖较长的记录',()=>{
  const a=restored({current:1,arrived:[1],answers:{1:[1,2]}});
  const b=restored({current:14,arrived:[1,14],answers:{1:[1],14:[1]}});
  const merged=mergeCampaign(b,a);
  assert.equal(merged.current,14);assert.deepEqual(merged.answers,{1:[1,2],14:[1]});
});
