export const DISTANCE = 1680;
export const TARGET = 4;
export const cargoValue = cargo => cargo === 'stone' ? 2 : 1;

export function restoreShore(raw) {
  let saved;
  try { saved = JSON.parse(raw); } catch { return []; }
  if (!Array.isArray(saved)) return [];
  const shore = [];
  let total = 0;
  for (const delivery of saved) {
    if (!delivery || !['wood', 'stone'].includes(delivery.cargo) || total >= TARGET) break;
    const rings = Number.isInteger(delivery.rings) ? Math.max(0, Math.min(3, delivery.rings)) : 0;
    shore.push({ cargo: delivery.cargo, rings });
    total += cargoValue(delivery.cargo);
  }
  return shore;
}

export function routeFor(load) {
  // All coordinates are in the flight's logical space, independent of screen size.
  /** @type {Array<Array<[number, string]>>} */
  const routes = [
    [[425, 'wave'], [815, 'cloud'], [1240, 'wave']],
    [[410, 'cloud'], [825, 'wave'], [1250, 'cloud']],
    [[440, 'wave'], [760, 'cloud'], [1170, 'cloud']],
    [[410, 'cloud'], [815, 'cloud'], [1250, 'wave']],
  ];
  return routes[Math.min(3, load)].map(([x, kind], i) => ({
    x, kind, width: kind === 'wave' ? 100 : 115,
    ringY: kind === 'wave' ? 143 + i * 5 : 252 - i * 5,
  }));
}

// Heights sampled along each finished clay sprite so visible crests match contact.
const waveProfile=[0,6,9,9,17,19,66,77,80,90,93,93,95,95,93,100,99,95,95,95,93,89,88,82,79,67,64,65,35,20,19,14,0];
const cloudProfile=[26,36,46,53,58,61,60,73,76,80,80,85,90,91,95,98,99,99,97,94,84,84,80,70,69,70,69,64,54,45,41,35,24];
export function silhouette(x, obstacle) {
  const position=(x-obstacle.x+obstacle.width)/(2*obstacle.width)*32;
  if(position<0||position>32)return 0;
  const column=Math.floor(position), fraction=position-column;
  const profile=obstacle.kind==='wave'?waveProfile:cloudProfile;
  return (profile[column]*(1-fraction)+profile[Math.min(32,column+1)]*fraction)/100;
}

export function startFlight(cargo, load) {
  return { cargo, x: 0, y: 206, vy: 0, route: routeFor(load), rings: /** @type {number[]} */ ([]), result: 'flying' };
}

export function inUpdraft(x, route) {
  return route.some(o => o.kind === 'wave' && x > o.x - 222 && x < o.x - 106);
}

export function stepFlight(f, held, dt) {
  if (f.result !== 'flying') return;
  const stone = f.cargo === 'stone';
  const lift = inUpdraft(f.x, f.route) ? 162 : 0;
  // Drag limits the speed. A heavy load sinks faster and climbs more slowly.
  const acceleration = (held ? (stone ? -300 : -393) : (stone ? 370 : 275)) - lift;
  f.vy += (acceleration - 2.7 * f.vy) * dt;
  f.x += 104 * dt;
  f.y += f.vy * dt;
  if (f.y < 22) { f.y = 22; f.vy = Math.max(0, f.vy); }
  if (f.y >= 346) { f.result = 'sea'; return; }
  for (const [i, obstacle] of f.route.entries()) {
    const dx = f.x - obstacle.x;
    if (Math.abs(dx) < 20 && Math.abs(f.y - obstacle.ringY) < 30 && !f.rings.includes(i)) f.rings.push(i);
    const height=silhouette(f.x,obstacle);
    if (height>0 && obstacle.kind === 'wave' && f.y >= 354 - 175*height) f.result = 'wave';
    if (height>0 && obstacle.kind === 'cloud' && f.y <= -9 + 228*height) f.result = 'cloud';
  }
  if (f.x >= DISTANCE && f.result === 'flying') f.result = 'delivered';
}
