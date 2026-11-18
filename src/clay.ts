/** Shared art direction. Pixel sizes serve readability, not ancient measurements. */
export const clayArt = 'art-clay-v1/';
export const travelerHeight = 156;

import {randomSequence} from './terrain-paths';

// One small, seamless matte surface used by all four static backgrounds.
let grain: HTMLCanvasElement | undefined;
function grainTile() {
  if (grain) return grain;
  grain = document.createElement('canvas');
  grain.width = grain.height = 256;
  const g = grain.getContext('2d')!, pixels = g.createImageData(256,256);
  const random = randomSequence(731);
  for (let i=0; i<pixels.data.length; i+=4) {
    const value = random();
    const bright = value > .52;
    pixels.data[i] = bright ? 251 : 70;
    pixels.data[i+1] = bright ? 237 : 75;
    pixels.data[i+2] = bright ? 191 : 47;
    pixels.data[i+3] = Math.round(5+Math.abs(value-.5)*26);
  }
  g.putImageData(pixels,0,0);
  // Shallow pocks and their sunlit lower rims are baked at native pixel scale.
  for(let i=0;i<420;i++) {
    const x=random()*256,y=random()*256,r=.45+random()*1.4;
    g.fillStyle='#57674637';g.beginPath();g.ellipse(x,y,r,r*.48,-.28,0,Math.PI*2);g.fill();
    if(i%3===0){g.fillStyle='#f7ecc045';g.fillRect(x-.6,y+1,r*1.4,.7);}
  }
  return grain;
}

export function paintClayGround(c: CanvasRenderingContext2D, width: number, height: number, color = '#bdc99d') {
  const wash = c.createLinearGradient(0,0,width*.35,height);
  wash.addColorStop(0,'#829e87'); wash.addColorStop(.39,color); wash.addColorStop(.76,color); wash.addColorStop(1,'#c7b993');
  c.fillStyle=wash; c.fillRect(0,0,width,height);
  const random=randomSequence(991);
  const area=width*height;
  // Broad variations imply patches of sun and shallow hollows without adding obstacles.
  for(let i=0;i<area/15000;i++) {
    const x=random()*width, y=random()*height, r=50+random()*135;
    c.save(); c.translate(x,y); c.scale(1,.54); c.rotate((random()-.5)*.5);
    const shade=c.createRadialGradient(-r*.18,-r*.15,0,0,0,r);
    shade.addColorStop(0,i%3?'#54794323':'#fff2b946'); shade.addColorStop(1,i%3?'#54794300':'#fff2b900');
    c.fillStyle=shade; c.fillRect(-r,-r,2*r,2*r); c.restore();
  }
  const pattern=c.createPattern(grainTile(),'repeat');
  if(pattern){c.fillStyle=pattern;c.fillRect(0,0,width,height);}
}
