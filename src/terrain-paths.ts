import type {terrain} from './navigation.mjs';

type World = ReturnType<typeof terrain>;
export type Point = { x: number; y: number };
export type Sample = Point & { dx: number; dy: number; distance: number };
const paths = new WeakMap<World, Point[][]>();

/** Round a bend by cutting its corners, preserving both ends of every branch. */
function roundBends(points: Point[]): Point[] {
  const result = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    for (const t of [.22, .78]) result.push({ x: a.x + (b.x-a.x)*t, y: a.y + (b.y-a.y)*t });
  }
  result.push(points[points.length - 1]);
  return result;
}

export function terrainPaths(world: World): Point[][] {
  const cached = paths.get(world);
  if (cached) return cached;
  const [a, b] = world.bridges;
  let branches: number[][][];
  if (world.id === 'zhaoyao') {
    branches = [
      [[470,1155],[620,1180],[835,1135],[955,1120],[1080,980],[1210,1005],[a.x,a.y+95],[a.x,a.y-95],[1360,680],[1310,550],[1510,490],[1790,565]],
      [[1310,550],[1480,540],[b.x,b.y-95],[b.x,b.y+95],[1755,825],[1930,800]],
      [[1135,980],[1290,1060],[1460,1100],[1610,1120]],
    ];
  } else if (world.id === 'qingqiu') {
    branches = [
      [[180,680],[290,645],[350,480],[440,340],[540,335],[620,425],[775,465],[820,505]],
      [[300,625],[445,680],[590,710]],
      [[540,335],[675,279],[b.x-85,b.y],[b.x+85,b.y],[1020,213],[a.x+85,a.y],[a.x-85,a.y],[733,195]],
    ];
  } else {
    branches = [
      [[180,680],[230,625],[a.x,a.y+85],[a.x,a.y-85],[440,335],[570,335],[745,374],[845,420],[b.x,b.y-85],[b.x,b.y+85],[805,690],[590,710]],
      [[230,625],[325,684],[485,710],[590,710]],
    ];
  }
  const result = branches.map(branch => roundBends(roundBends(branch.map(([x,y]) => ({x,y})))));
  paths.set(world,result);
  return result;
}

/** Constant spacing keeps texture density the same on a long straight and a fine Bézier. */
export function sampleLine(line: Point[], spacing: number): Sample[] {
  const samples: Sample[] = [];
  let travelled = 0, next = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i-1], b = line[i], length = Math.hypot(b.x-a.x,b.y-a.y);
    if (!length) continue;
    const dx = (b.x-a.x)/length, dy = (b.y-a.y)/length;
    while (next < travelled+length) {
      const offset = next-travelled;
      samples.push({x:a.x+dx*offset,y:a.y+dy*offset,dx,dy,distance:next});
      next += spacing;
    }
    travelled += length;
    if (i===line.length-1) samples.push({...b,dx,dy,distance:travelled});
  }
  return samples;
}

export function randomSequence(seed: number) {
  return () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0) / 4294967296);
}
