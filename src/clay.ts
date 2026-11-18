/** Shared art direction. Pixel sizes serve readability, not ancient measurements. */
export const clayArt = 'art-clay-v1/';
export const travelerHeight = 156;

const grounds = new Map<string, HTMLCanvasElement>();
export function paintClayGround(c: CanvasRenderingContext2D, width: number, height: number, color = '#bdc99d') {
  let ground = grounds.get(color);
  if (!ground) {
    ground = document.createElement('canvas');
    ground.width = 1200; ground.height = 800;
    const g = ground.getContext('2d')!;
    const wash = g.createLinearGradient(0, 0, 0, 800);
    wash.addColorStop(0, '#789b83'); wash.addColorStop(.38, color); wash.addColorStop(1, '#d1c69d');
    g.fillStyle = wash; g.fillRect(0, 0, 1200, 800);
    let seed = 731;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    // Tiny hand-pressed clay flecks, baked once rather than rendered every frame.
    for (let i = 0; i < 5000; i++) {
      const x = rand() * 1200, y = rand() * 800, r = 1 + rand() * 3;
      g.fillStyle = '#6f80531b'; g.beginPath(); g.ellipse(x, y + 1.4, r * 1.3, r * .65, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = i % 3 ? '#e9e3b526' : '#55765420'; g.beginPath(); g.ellipse(x, y, r, r * .6, -.3, 0, Math.PI * 2); g.fill();
    }
    grounds.set(color, ground);
  }
  c.drawImage(ground, 0, 0, width, height);
}
