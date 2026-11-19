import test from 'node:test';
import assert from 'node:assert/strict';
import {cargoValue, inUpdraft, restoreShore, routeFor, startFlight, stepFlight} from '../src/flight-rules.mjs';

function simulate(flight, steering) {
  for(let i=0;i<2500 && flight.result==='flying';i++)stepFlight(flight,steering(flight),1/120);
  return flight;
}
test('both loads can complete each crossing and pass through all three wind rings',()=>{
  for(let load=0;load<4;load++)for(const cargo of ['wood','stone']){
    const flight=simulate(startFlight(cargo,load),f=>{
      const next=f.route.find(o=>o.x+28>f.x);
      return f.y+f.vy*.22>(next?.ringY??210);
    });
    assert.equal(flight.result,'delivered',cargo+' at '+load);
    assert.deepEqual(flight.rings,[0,1,2]);
  }
});

test('constant or absent flapping loses the crossing, and a high wave blocks level flight',()=>{
  assert.equal(simulate(startFlight('wood',0),()=>false).result,'sea');
  assert.equal(simulate(startFlight('wood',0),()=>true).result,'cloud');
  assert.equal(simulate(startFlight('wood',0),f=>f.y+f.vy*.22>207).result,'wave');
});

test('stone sinks faster, light wood climbs faster and an updraft helps the climb',()=>{
  for(const held of [true,false]){
    const wood=startFlight('wood',0),stone=startFlight('stone',0);
    for(let i=0;i<30;i++){stepFlight(wood,held,1/120);stepFlight(stone,held,1/120);}
    assert.ok(wood.y<stone.y);
  }
  assert.equal(inUpdraft(260,routeFor(0)),true);
  assert.equal(inUpdraft(100,routeFor(0)),false);
  const wind=startFlight('stone',0),calm=startFlight('stone',0);
  wind.x=260;
  stepFlight(wind,true,.01);stepFlight(calm,true,.01);
  assert.ok(wind.vy<calm.vy);
});

test('restoring a shore preserves delivery order, caps ring counts, and stops when the target is reached',()=>{
  const saved=[{cargo:'wood',rings:1},{cargo:'stone',rings:12},{cargo:'stone',rings:2},{cargo:'wood',rings:3}];
  assert.deepEqual(restoreShore(JSON.stringify(saved)),[saved[0],{cargo:'stone',rings:3},saved[2]]);
  assert.deepEqual(restoreShore('broken'),[]);
  assert.deepEqual(restoreShore('[{"cargo":"other"}]'),[]);
  assert.equal(cargoValue('stone'),2);
});
