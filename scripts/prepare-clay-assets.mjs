import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const report=[];
for(const [source,target] of [['design/clay-v2','public/assets/art-clay-v2'],['public/assets/art-clay-v1','public/assets/art-clay-v1']]){
 await fs.mkdir(target,{recursive:true});
 for(const name of await fs.readdir(source)){
  if(!name.endsWith('.png'))continue;
  const input=path.join(source,name),output=path.join(target,name.replace('.png','.webp'));
  const meta=await sharp(input).metadata();
  const result=await sharp(input).webp({lossless:true,effort:6}).toFile(output);
  if(result.width!==meta.width||result.height!==meta.height)throw Error('Unexpected dimensions '+name);
  report.push({file:output,width:result.width,height:result.height,before:(await fs.stat(input)).size,after:result.size,alpha:meta.hasAlpha});
 }
}
await fs.writeFile('docs/clay-asset-sizes.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({files:report.length,before:report.reduce((s,r)=>s+r.before,0),after:report.reduce((s,r)=>s+r.after,0)}));
