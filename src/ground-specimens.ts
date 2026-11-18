import { assetPath } from './assets';
import type { World } from './environment';
import { terrainPaths, randomSequence } from './terrain-paths';
import { segmentDistance } from './navigation.mjs';

export const groundSpecimensURL = assetPath('art-clay-detail/understory.webp');
type Point = { x: number; y: number };

// The sheet holds six 512px square cells. Use the visible base of each cutout
// to anchor it in the scene and keep the transparent padding out of the shadow.
const baseFractions = [0.92, 0.88, 0.92, 0.80, 0.80, 0.81];
const mountainFlora: Record<string, number[]> = {
  zhaoyao: [0, 0, 5, 1, 3],
  tangting: [5, 1, 0, 5, 1],
  niuyang: [3, 4, 0, 1, 3],
  qingqiu: [4, 4, 5, 1, 3],
};

function distanceToLine(point: Point, line: Point[]) {
  let distance = Infinity;
  for (let index = 1; index < line.length; index++) {
    distance = Math.min(distance, segmentDistance(point, line[index - 1], line[index]));
  }
  return distance;
}

export function paintGroundSpecimens(
  ctx: CanvasRenderingContext2D,
  world: World,
  image: HTMLImageElement,
  observationPoints: Point[],
) {
  const cell = image.naturalWidth / 3;
  if (!cell || image.naturalHeight !== cell * 2) return;
  const paths = terrainPaths(world);
  const variants = mountainFlora[world.id];
  if (!variants) return;

  const seed = Array.from(String(world.id)).reduce((sum, char) => sum * 31 + char.charCodeAt(0), 87);
  const random = randomSequence(seed);

  // Distribute small colonies once per mountain. Wetland reeds only grow
  // along the bank, and empty intervals between colonies preserve the path.
  const features: { x: number; y: number; size: number; tile: number; facing: number; width: number }[] = [];
  const target = world.id === 'zhaoyao' ? 100 : 36;
  const spawn = world.id === 'zhaoyao' ? {x: 470, y: 1120} : {x: 180, y: 680};
  for (let attempt = 0; attempt < target * 24 && features.length < target; attempt++) {
    const x = (world.id === 'zhaoyao' ? 358 : 0) + random() * (world.width - (world.id === 'zhaoyao' ? 358 : 0));
    const y = 194 + random() * (world.height - 194);
    const point = { x, y };
    if (Math.hypot(spawn.x - x, spawn.y - y) < 76) continue;
    const riverDistance = distanceToLine(point, world.river);
    if (riverDistance < 50 || paths.some(path => distanceToLine(point, path) < 60)) continue;
    if (world.bridges.some(b => Math.abs(b.x - x) < b.w / 2 + 28 && Math.abs(b.y - y) < b.h / 2 + 28)) continue;
    if (observationPoints.some(p => Math.hypot(p.x - x, p.y - y) < 100)) continue;
    const treeDistance = world.obstacles.reduce((nearest, p) => Math.min(nearest, Math.hypot(p.x - x, p.y - y) - p.r), Infinity);
    if (treeDistance < 20) continue;
    if (features.some(f => Math.hypot(f.x - x, f.y - y) < 85)) continue;
    const bank = riverDistance < 95;
    let tile = variants[Math.floor(random() * variants.length)];
    if (bank) tile = random() < 0.58 ? 2 : 3;
    else if (treeDistance < 110 && random() < .65) tile = random() < .65 ? 0 : 5;
    const size = 27 + random() * (tile === 2 || tile === 0 ? 50 : 41);
    features.push({ x, y, size, tile, facing: random() < .5 ? -1 : 1, width: .87 + random() * .22 });
  }

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  for (const { x, y, size, tile, facing, width } of features.sort((a, b) => a.y - b.y)) {
    const shadow = ctx.createRadialGradient(x, y, 0, x, y, size * 0.44);
    shadow.addColorStop(0, '#34452e59');
    shadow.addColorStop(1, '#34452e00');
    ctx.save();
    ctx.translate(0, y * 0.72);
    ctx.scale(1, 0.28);
    ctx.fillStyle = shadow;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
    ctx.restore();
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing * width, 1);
    ctx.drawImage(image, (tile % 3) * cell, Math.floor(tile / 3) * cell, cell, cell,
      -size / 2, -size * baseFractions[tile], size, size);
    ctx.restore();
  }
  ctx.restore();
}
