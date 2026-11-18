// Foot contact as a fraction of the full image, including the transparent margins.
// Values were measured on the opaque silhouette across all three poses.
const feet: Record<string, number> = {
  grove: .921, migu: .977, stone: .931, zhuyu: .980, shengsheng: .934,
  player: .978, fox: .924, lushu: .845, xuangui: .751, ape: .917,
  crystal: .946, yanwood: .972
};

export function footAnchor(id: string) {
  return feet[id] ?? feet.stone;
}

// Keep labels and transparent contours sharp on high-density screens without
// allocating a full 2x framebuffer for a desktop monitor.
export function scenePixelRatio(width: number, height: number) {
  const budget = Math.sqrt(4_000_000 / Math.max(1, width * height));
  return Math.max(1, Math.min(2, window.devicePixelRatio || 1, budget));
}

export function groveShape(x: number, y: number) {
  const seed = Math.abs(Math.floor(x * 7 + y * 11));
  return { flip: seed % 4 === 1, width: .89 + (seed % 23) / 100 };
}

function makeContactShadow() {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 48;
  const c = canvas.getContext('2d')!;
  c.scale(1, .25);
  const light = c.createRadialGradient(90, 92, 2, 96, 96, 95);
  light.addColorStop(0, 'rgba(51,47,33,.48)');
  light.addColorStop(.27, 'rgba(58,60,38,.36)');
  light.addColorStop(.58, 'rgba(65,69,43,.19)');
  light.addColorStop(1, 'rgba(70,70,42,0)');
  c.fillStyle = light;
  c.fillRect(0, 0, 192, 192);
  return canvas;
}

export const contactShadow = makeContactShadow();

export function groundShadow(c: CanvasRenderingContext2D, x: number, y: number, width: number) {
  const height = Math.max(8, width * .22);
  c.drawImage(contactShadow, x - width * .42, y - height * .4, width, height);
}

// Bake high-resolution clay labels once. Both renderers display the same plate.
export function fieldLabel(name: string, recorded: boolean) {
  const canvas = document.createElement('canvas');
  const width = Math.max(68, name.length * 16 + 35);
  const height = 32;
  canvas.width = width * 2;
  canvas.height = height * 2;
  const c = canvas.getContext('2d')!;
  c.scale(2, 2);
  c.lineWidth = 1;
  c.fillStyle = '#57553c70';
  c.beginPath();
  c.roundRect(1, 4, width - 2, 26, 10);
  c.fill();
  const enamel = c.createLinearGradient(0, 2, 0, 27);
  enamel.addColorStop(0, '#fdf2d8');
  enamel.addColorStop(.73, '#f2e2bc');
  enamel.addColorStop(1, '#dfceaa');
  c.fillStyle = enamel;
  c.strokeStyle = '#c6ad80';
  c.beginPath();
  c.roundRect(1, 1, width - 2, 26, 10);
  c.fill();
  c.stroke();
  c.beginPath();
  c.arc(14, 14, 5, 0, Math.PI * 2);
  c.strokeStyle = '#557663';
  if (recorded) {
    c.fillStyle = '#557663';
    c.fill();
  } else {
    c.stroke();
  }
  c.font = '600 15px "Microsoft YaHei", sans-serif';
  c.textBaseline = 'middle';
  c.fillStyle = '#344b3e';
  c.fillText(name, 25, 14);
  return canvas;
}

// A small waxed-canvas shelter at the western landing. Painted once into the terrain.
export function paintCamp(c: CanvasRenderingContext2D, x: number, y: number) {
  c.save();
  c.translate(x, y);
  groundShadow(c, 2, 0, 158);
  const panel = (vertices: number[][], top: string, bottom: string) => {
    const color = c.createLinearGradient(-22, -80, 12, 2);
    color.addColorStop(0, top);
    color.addColorStop(1, bottom);
    c.fillStyle = color;
    c.strokeStyle = '#795e3e';
    c.lineWidth = 1.4;
    c.lineJoin = 'round';
    c.beginPath();
    vertices.forEach(([px,py], i) => i ? c.lineTo(px,py) : c.moveTo(px,py));
    c.closePath();
    c.fill();
    c.stroke();
  };
  const cord = (points: number[][], color: string, width: number) => {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.beginPath();
    points.forEach(([px,py], i) => i ? c.lineTo(px,py) : c.moveTo(px,py));
    c.stroke();
  };
  panel([[-62,-13],[-20,-79],[26,-68],[65,5],[24,8]], '#d6aa70', '#a66c43');
  panel([[-20,-79],[26,-68],[-7,4],[-62,-13]], '#ecd6a1', '#caa775');
  panel([[-7,4],[26,-68],[65,5],[31,9]], '#c69a62', '#957347');
  panel([[4,4],[26,-55],[48,6]], '#504737', '#302f27');
  panel([[-7,4],[26,-68],[18,-18],[4,4]], '#fae5b1', '#ba854f');
  panel([[26,-68],[65,5],[54,-4],[37,-40]], '#eed19b', '#b18151');
  for (let i=1; i<5; i++) {
    const bx=-62+i*11;
    cord([[bx,-13+i*3.4],[bx+13,-35+i*3],[bx+41,-79+i*2.6]], '#8d704f65', 1.4);
    cord([[bx+2,-14+i*3.4],[bx+17,-42+i*3]], '#f8e8c48f', 1);
  }
  cord([[-20,-78],[0,-72],[26,-68]], '#f8e4b5', 3.3);
  cord([[25,-68],[34,-72]], '#805d36', 4);
  cord([[-20,-79],[-34,-65],[-75,-8]], '#947851', 1.3);
  cord([[27,-67],[48,-47],[83,6]], '#886d49', 1.5);
  cord([[-76,-12],[-73,-4]], '#70533c', 3.7);
  cord([[82,1],[85,10]], '#70533c', 3.7);
  // A rolled sleeping mat with two bindings and a coiled end.
  c.translate(-42, -1);
  c.rotate(.16);
  groundShadow(c, -4, 8, 42);
  const reed = c.createLinearGradient(0,-8,0,8);
  reed.addColorStop(0,'#b1884d');
  reed.addColorStop(.32,'#e0c58a');
  reed.addColorStop(1,'#98723f');
  c.fillStyle=reed;
  c.beginPath(); c.roundRect(-19,-7,38,15,6); c.fill();
  cord([[-9,-6],[-10,7]],'#83633e',2);
  cord([[6,-6],[5,7]],'#83633e',2);
  c.strokeStyle='#795e3c';
  c.lineWidth=1;
  for(const radius of [5.7,3.2,1.3]) {
    c.beginPath(); c.ellipse(15,0,radius*.6,radius,0,0,Math.PI*2); c.stroke();
  }
  c.restore();
}
