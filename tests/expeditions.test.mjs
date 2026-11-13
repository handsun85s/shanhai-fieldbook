import {test} from 'node:test';import assert from 'node:assert/strict';
import {restoreExp,addObservation} from '../src/expedition-progress.mjs';
const mountains=[{id:'one',points:[{id:'a'},{id:'b'}]},{id:'two',points:[{id:'c'}]}];
test('山岳存档过滤未知记录与损坏数据',()=>{assert.deepEqual(restoreExp('{bad',mountains),{one:[],two:[]});assert.deepEqual(restoreExp('{"one":["a","a","fake"],"two":true}',mountains),{one:['a'],two:[]});});
test('各山进度隔离且重复观察不会重复计数',()=>{let s=restoreExp(null,mountains);s=addObservation(s,'one','a',mountains);s=addObservation(s,'one','a',mountains);s=addObservation(s,'two','a',mountains);assert.deepEqual(s,{one:['a'],two:[]});s=addObservation(s,'two','c',mountains);assert.deepEqual(restoreExp(JSON.stringify(s),mountains),s);});
