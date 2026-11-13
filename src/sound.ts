// Original synthesized interpretations: no recordings or third-party audio.
class Soundscape {
 ctx:AudioContext|null=null; master:GainNode|null=null; enabled=false; volume=.35;
 async start(){try{if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=0;this.master.connect(this.ctx.destination);const buf=this.ctx.createBuffer(1,this.ctx.sampleRate*3,this.ctx.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const src=this.ctx.createBufferSource();src.buffer=buf;src.loop=true;const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;const g=this.ctx.createGain();g.gain.value=.08;src.connect(filter).connect(g).connect(this.master);src.start();}await this.ctx.resume();this.enabled=true;this.apply();return true;}catch{return false;}}
 apply(){if(this.ctx&&this.master)this.master.gain.setTargetAtTime(this.enabled&&!document.hidden?this.volume:0,this.ctx.currentTime,.15);}
 mute(){this.enabled=false;this.apply();} setVolume(v:number){this.volume=Math.max(0,Math.min(1,v));this.apply();}
 tone(f:number,t:number,length:number,level=.15,type:OscillatorType='sine',end=f){if(!this.ctx||!this.master||!this.enabled)return;const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,c.currentTime+t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),c.currentTime+t+length);g.gain.setValueAtTime(0,c.currentTime+t);g.gain.linearRampToValueAtTime(level,c.currentTime+t+.03);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+t+length);o.connect(g).connect(this.master);o.start(c.currentTime+t);o.stop(c.currentTime+t+length+.03);}
 cue(){this.tone(523,0,.25,.12);this.tone(784,.12,.4,.1);}
 call(kind:string){if(kind==='lushu'){[330,392,440,392,330].forEach((f,i)=>{this.tone(f,i*.3,.5,.17,'sine',f*1.015);this.tone(f*2,i*.3,.5,.035);});}else if(kind==='xuangui'){[0,.22,.55].forEach(t=>{this.tone(180,t,.1,.36,'triangle',65);this.tone(750,t,.06,.12,'triangle',220);});}else if(kind==='ninefox'){[0,.65].forEach(t=>{this.tone(620,t,.55,.13,'sine',390);this.tone(1250,t,.3,.025,'sine',800);});}else this.cue();}
}
export const sound=new Soundscape();
document.addEventListener('visibilitychange',()=>sound.apply());
