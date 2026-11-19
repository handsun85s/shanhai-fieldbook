import {loadVolume} from './book-reader';
import {mountSentences} from './sentence-reader';
import {sentences} from './sentence-lessons.mjs';

export function bindPassageHelp(details:HTMLDetailsElement,volume:number,passage:number,quote:string){
  const abort=new AbortController();
  const box=details.querySelector<HTMLElement>('[data-help-body]')!;
  let ready=false;
  details.ontoggle=async()=>{
    if(!details.open||ready)return;
    box.textContent='正在翻到原文……';
    try{
      const book=await loadVolume(volume,abort.signal);
      if(abort.signal.aborted)return;
      const words=quote.replace(/[「」“”]/gu,'').split(/[，。；、]/u).filter(Boolean);
      const lines=sentences(book.simplified[passage-1]);
      const index=lines.findIndex(line=>words.some(w=>line.includes(w)));
      mountSentences(box,book,volume,passage,false,Math.max(0,index));ready=true;
    }catch{if(!abort.signal.aborted)box.textContent='原文载入失败。收起后再展开可重试。';}
  };
  return ()=>abort.abort();
}
