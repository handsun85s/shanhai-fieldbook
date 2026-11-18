import {assetPath} from './assets';
import {readSave,writeSave} from './storage.mjs';
// Ambient sound is synthesized. Creature comparisons use licensed recordings.
// Provenance: public/assets/audio-v2/LICENSES.md.
class Soundscape {
 ctx:AudioContext|null=null;master:GainNode|null=null;enabled=false;volume=.3;
 private preferred=true;
 constructor(){try{const p=JSON.parse(readSave('shanhai-sound-v1').raw??'null');if(p&&typeof p.enabled==='boolean')this.preferred=p.enabled;if(p&&typeof p.volume==='number'&&Number.isFinite(p.volume))this.volume=Math.max(0,Math.min(1,p.volume));}catch{}}
 private save(){writeSave('shanhai-sound-v1',{enabled:this.preferred,volume:this.volume});}
 async autoStart(){return this.preferred?this.start():false;}
 private buffers=new Map<string,Promise<AudioBuffer>>();
 private active:AudioBufferSourceNode|null=null;
 private finish:(()=>void)|null=null;
 private generation=0;
 async start(){try{if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=0;const compressor=this.ctx.createDynamicsCompressor();compressor.threshold.value=-12;compressor.knee.value=18;compressor.ratio.value=4;compressor.attack.value=.005;compressor.release.value=.15;this.master.connect(compressor).connect(this.ctx.destination);const buf=this.ctx.createBuffer(1,this.ctx.sampleRate*3,this.ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const src=this.ctx.createBufferSource();src.buffer=buf;src.loop=true;const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;const g=this.ctx.createGain();g.gain.value=.035;src.connect(filter).connect(g).connect(this.master);src.start();}await this.ctx.resume();this.enabled=true;this.preferred=true;this.save();this.apply();document.dispatchEvent(new Event('soundchange'));return true;}catch{return false;}}
 apply(){if(this.ctx&&this.master)this.master.gain.setTargetAtTime(this.enabled&&!document.hidden?this.volume:0,this.ctx.currentTime,.12);}
 mute(){this.enabled=false;this.preferred=false;this.save();this.stopCall();this.apply();document.dispatchEvent(new Event('soundchange'));}
 setVolume(v:number){if(!Number.isFinite(v))return;this.volume=Math.max(0,Math.min(1,v));this.save();this.apply();}
 stopCall(){this.generation++;this.active?.stop();this.active?.disconnect();this.active=null;this.finish?.();this.finish=null;}
 async call(kind:string){if(!['lushu','xuangui','ninefox'].includes(kind))return;if(!this.ctx||!this.master||!this.enabled)throw Error('Audio is not enabled');this.stopCall();const generation=this.generation,ctx=this.ctx;
  if(!this.buffers.has(kind)){const promise=fetch(assetPath(`audio-v2/${kind}.mp3`)).then(r=>{if(!r.ok)throw Error('Audio unavailable');return r.arrayBuffer();}).then(b=>ctx.decodeAudioData(b)).catch(e=>{this.buffers.delete(kind);throw e;});this.buffers.set(kind,promise);}
  const buffer=await this.buffers.get(kind)!;if(generation!==this.generation||!this.enabled||document.hidden)return;
  await new Promise<void>(resolve=>{const src=ctx.createBufferSource();src.buffer=buffer;const envelope=ctx.createGain(),now=ctx.currentTime;envelope.gain.setValueAtTime(0,now);envelope.gain.linearRampToValueAtTime(1,now+.025);envelope.gain.setValueAtTime(1,now+Math.max(.026,buffer.duration-.06));envelope.gain.linearRampToValueAtTime(0,now+buffer.duration);src.connect(envelope).connect(this.master!);this.active=src;this.finish=resolve;src.onended=()=>{src.disconnect();envelope.disconnect();if(this.active===src){this.active=null;this.finish=null;}resolve();};src.start();});
 }
 cue(){if(!this.ctx||!this.master||!this.enabled)return;const c=this.ctx;[523,784].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+i*.12;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.08,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(g).connect(this.master!);o.start(t);o.stop(t+.28);o.onended=()=>{o.disconnect();g.disconnect();};});}
}
export const sound=new Soundscape();
document.addEventListener('visibilitychange',()=>{if(document.hidden)sound.stopCall();sound.apply();});
