import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chapterBiome,passageTerrain} from '../src/book-field-terrain.mjs';

const read=n=>JSON.parse(fs.readFileSync(new URL('../public/book/'+String(n).padStart(2,'0')+'.json',import.meta.url)));

test('南山经的水石、禁登和无水记录各自形成合适的观察地景',()=>{
  const passages=read(1).simplified;
  const visit=name=>{
    const index=passages.findIndex(p=>p.includes(name));
    assert.notEqual(index,-1);
    return passageTerrain(1,index,passages[index]);
  };
  assert.equal(visit('柢山').biome,4);
  assert.equal(visit('亶爰之山').biome,4);
  assert.equal(visit('亶爰之山').remote,true);
  assert.equal(visit('不可以上').biome,7);
  assert.equal(visit('咸阴之山').biome,5);
  assert.notEqual(visit('堂庭之山').biome,2,'多水玉记物产，不能匹配成多水');
  for(const noun of ['水玉','水马','水碧'])assert.notEqual(passageTerrain(1,0,'其中多'+noun+'。').biome,2);
});

test('每段步道分种子，可重现，河流流向不干扰行路方向',()=>{
  const seeds=new Set();
  for(let volume=1;volume<=18;volume++){
    const passages=read(volume).simplified;
    for(const [index,passage] of passages.entries()){
      const terrain=passageTerrain(volume,index,passage);
      assert.deepEqual(terrain,passageTerrain(volume,index,passage));
      assert.ok(!seeds.has(terrain.seed),'route collides at '+volume+'/'+index);
      assert.ok(terrain.biome>=0&&terrain.biome<8);
      if(passage.includes('无草木'))assert.ok([4,5].includes(terrain.biome));
      seeds.add(terrain.seed);
    }
  }
  assert.equal(passageTerrain(1,0,'又东三百里。其水西流。').startRight,false);
  assert.equal(passageTerrain(1,0,'又西三百里。其水东流。').startRight,true);
  assert.deepEqual([3,7,11,15,18].map(chapterBiome),[0,1,2,3,2]);
});
