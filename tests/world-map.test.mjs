import test from 'node:test';
import assert from 'node:assert/strict';
import {chapters,southRoute,zoomAt,localPoint} from '../src/world-data.mjs';
test('全书入口覆盖十八篇，当前可玩山均可定位，未开放山不被跳过',()=>{assert.equal(chapters.length,18);assert.equal(new Set(chapters.map(c=>c.id)).size,18);assert.deepEqual(southRoute.filter(p=>p.open).map(p=>p.id),['zhaoyao','tangting','niuyang','qingqiu']);assert.equal(southRoute[2].id,'yuanyi');assert.equal(southRoute[2].open,false);});
test('缩放保持指针锚点，并限制极限倍率',()=>{const v={x:0,y:0,w:2300,h:1500},p={x:780,y:500},z=zoomAt(v,2,p);assert.equal((p.x-v.x)/v.w,(p.x-z.x)/z.w);assert.equal((p.y-v.y)/v.h,(p.y-z.y)/z.h);assert.deepEqual(zoomAt(z,.5,p),v);assert.equal(zoomAt(v,100,p).w,460);assert.equal(zoomAt(v,.01,p).w,2300);});
test('不同大小场景使用同一归一化位置，边界保持在山内图范围',()=>{assert.deepEqual(localPoint({x:1200,y:750,width:2400,height:1500}),localPoint({x:600,y:400,width:1200,height:800}));assert.deepEqual(localPoint({x:0,y:0,width:1200,height:800}),{x:260,y:260});});
