import {assetPath} from './assets';
import {DISTANCE, silhouette, startFlight} from './flight-rules.mjs';

type Flight = ReturnType<typeof startFlight>;
export function flightArtist(canvas:HTMLCanvasElement) {
  const ctx=canvas.getContext('2d')!;
  const image=(name:string)=>{const img=new Image();img.src=assetPath('jingwei-flight/'+name+'.webp');return img;};
  const coast=image('coast'), bird=image('bird'), wave=image('wave'), cloud=image('cloud');
  function ellipse(x:number,y:number,rx:number,ry:number,color:string) {
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  }
  function cargo(x:number,y:number,kind:string,size:number) {
    ctx.save();ctx.translate(x,y);ctx.scale(size,size);
    if(kind==='stone'){ellipse(0,0,7,5,'#594f4a');ellipse(-1,-2,5,3,'#ac9c84');}
    else{ctx.lineCap='round';ctx.strokeStyle='#683e29';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-8,3);ctx.lineTo(10,-3);ctx.moveTo(1,0);ctx.lineTo(4,-7);ctx.stroke();}
    ctx.restore();
  }
  return (f:Flight, shore:{cargo:string}[], time:number, held:boolean, preview:boolean,drop=1)=>{
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const dpr=Math.min(devicePixelRatio||1,2);
    const px=Math.round(rect.width*dpr), py=Math.round(rect.height*dpr);
    if(canvas.width!==px||canvas.height!==py){canvas.width=px;canvas.height=py;}
    const h=410,w=rect.width*h/rect.height;
    ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);
    ctx.clearRect(0,0,w,h);
    const bx=Math.min(w*.24,178), world=(n:number)=>bx+n-f.x;
    if(coast.complete&&coast.naturalWidth){
      // A slow pan keeps the horizon still enough to judge the incoming waves.
      const iw=coast.naturalWidth,ih=coast.naturalHeight;
      const scale=Math.max(w*1.11/iw,h/ih);
      ctx.drawImage(coast,-(iw*scale-w)*(.09+.83*f.x/DISTANCE),-(ih*scale-h)*.77,iw*scale,ih*scale);
    }else{const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#73a8a3');g.addColorStop(.8,'#ffcc95');g.addColorStop(1,'#36848b');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
    const gradient=ctx.createLinearGradient(0,347,0,h);gradient.addColorStop(0,'#277e84a8');gradient.addColorStop(1,'#244e5eeb');
    ctx.fillStyle=gradient;ctx.fillRect(0,350,w,60);
    for(const [i,o] of f.route.entries()){
      const x=world(o.x);
      if(x<-130||x>w+250)continue;
      if(o.kind==='wave'){
        const windX=x-164;
        ctx.save();ctx.lineCap='round';ctx.strokeStyle='#f8ffdfce';ctx.lineWidth=2;
        for(let j=0;j<4;j++){const wx=windX+(j%2)*26-15, wy=110+(j*67-time*35%68);ctx.beginPath();ctx.moveTo(wx-4,wy+20);ctx.quadraticCurveTo(wx+10,wy+7,wx+4,wy);ctx.lineTo(wx-2,wy+8);ctx.moveTo(wx+4,wy);ctx.lineTo(wx+12,wy+7);ctx.stroke();}
        ctx.restore();
      }
      const isWave=o.kind==='wave',art=isWave?wave:cloud;
      if(art.complete&&art.naturalWidth){
        ctx.drawImage(art,x-o.width,isWave?185:-16,2*o.width,isWave?175:228);
      }else{
        ctx.beginPath();ctx.moveTo(x-o.width,isWave?360:0);
        for(let k=-o.width;k<=o.width;k+=2){
          const height=silhouette(o.x+k,o);
          ctx.lineTo(x+k,isWave?360-175*height:-16+228*height);
        }
        ctx.lineTo(x+o.width,isWave?360:0);ctx.closePath();ctx.fillStyle=isWave?'#478f92':'#738792';ctx.fill();
      }
      if(!f.rings.includes(i)){
        const y=o.ringY;
        ctx.save();ctx.shadowColor='#71431c';ctx.shadowBlur=4;ctx.strokeStyle='#845323';ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(x,y,11,22,0,0,Math.PI*2);ctx.stroke();
        ctx.strokeStyle='#ffe292';ctx.lineWidth=5;ctx.stroke();ctx.restore();
      }
    }
    // Shorelines and delivered cargo stay anchored to the world as the camera advances.
    for(const [pos,landing] of [[world(-76),false],[world(DISTANCE+70),true]] as const){
      if(pos< -190||pos>w+160)continue;
      ellipse(pos,369,124,48,'#705f51');ellipse(pos-12,349,111,32,'#a79470');ellipse(pos+8,336,72,19,'#c9af82');
      if(landing)shore.forEach((item,i)=>{
        const endX=pos-64+i*25,endY=326-(i%2)*6;
        if(i===shore.length-1&&drop<1){
          cargo(bx+39+(endX-bx-39)*drop,f.y+4+(endY-f.y-4)*drop*drop,item.cargo,1+drop);
        }else cargo(endX,endY,item.cargo,2.2);
      });
    }
    const y=f.y+(preview?Math.sin(time*2)*4:0);
    ctx.save();ctx.translate(bx,y);ctx.rotate(Math.max(-.21,Math.min(.2,f.vy*.0013)));
    if(bird.complete&&bird.naturalWidth){
      const sw=bird.naturalWidth/2,sh=bird.naturalHeight,frame=(held||preview)?Math.floor(time*5)%2:1;
      ctx.drawImage(bird,frame*sw,0,sw,sh,-49,-65,98,130);
    }else{ellipse(0,0,20,11,'#293139');ellipse(13,-8,10,9,'#34343b');ctx.fillStyle='#ffecd0';ctx.fillRect(20,-9,9,3);}
    if(f.result!=='delivered')cargo(39,4,f.cargo,1);
    ctx.restore();
  };
}
