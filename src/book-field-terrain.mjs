const sceneStops = [
  ['望峰台','沿近峰的轮廓看看，哪些山脊被它挡在后面？'],
  ['听潮岸','沿海边的泡沫找出陆地与水面的交界。站在岸上观察海中的礁岛。'],
  ['曲水台','沿同一条水道从左看到右，留意河弯两岸和水中的沙洲。'],
  ['赤岩台','顺着岩壁上的横纹看过去，观察近处和远处的岩层。'],
  ['岩岸','看水从裸露的石面之间经过。试着分清岩岸、浅潭和更远的山地。'],
  ['裸岩台','先看近处的石砾，再远望山脊，对照经文关于地表的记载。'],
  ['林间空地','从近树的枝叶望向林隙，看一看哪些地方能透进光线。'],
  ['山脚望台','留在山脚，沿岩壁向上望。用原句线索判断这里为什么适合远观。'],
];
export function chapterBiome(volume) {
  if(volume<=5)return 0;
  if(volume<=9)return 1;
  return volume<=13||volume===18?2:3;
}

// Match phrases present in the passage, leaving unspecified scenery explicitly editorial.
// A river's direction of flow does not prescribe the direction of the walk.
export function passageTerrain(volume,index,text) {
  const bare=text.match(/无草木|草木不生|不生草木|无(?:草而无木|草无木)/);
  const forbidden=text.match(/不可以上|不可(?:以)?登|不可(?:得|以)?上/);
  const dry=text.match(/无水|无川泽/);
  const wet=text.match(/多水(?=[，。；、]|$)|有水(?:焉|曰)|居水中|以水络之|生赤水上|水出焉|水出(?:于|其中)|[江河淮湘]水|流注于|有(?:大)?泽|之泽|之渊/);
  const sea=text.match(/临(?:于)?[东西南北]?海|[东西南北]海之(?:中|滨|渚)|海中|处于[东西南北]海/);
  const forest=text.match(/竹林|松林|之林|多(?:怪木|松柏|柘木|梓枏|竹|松|木)|有(?:一)?木焉|其木多/);
  const desert=text.match(/流沙|沙漠|沙石|赤石|丹粟/);
  const mountain=text.match(/之山|有山焉|有山名曰/);
  let biome=chapterBiome(volume), clue='';
  if(bare||dry){
    biome=wet&&!dry?4:5;clue=(bare??dry)[0];
  }else if(forbidden){
    biome=7;clue=forbidden[0];
  }else if(sea){
    biome=1;clue=sea[0];
  }else if(forest){
    biome=6;clue=forest[0];
  }else if(wet){
    biome=2;clue=wet[0];
  }else if(desert){
    biome=3;clue=desert[0];
  }else if(mountain){
    biome=0;clue=mountain[0];
  }
  let seed=(volume*2003+index)*7919;
  for(const character of text)seed=(Math.imul(seed,31)+character.codePointAt(0))>>>0;
  const [lookout,discovery]=sceneStops[biome];
  const direction=text.match(/^(?:又|复)?[向往]?([东西])(?:行|[一二三四五六七八九十百千])/);
  const startRight=direction?direction[1]==='西':seed%2===0;
  return {
    biome,seed,startRight,
    floor:biome===7?437:biome===6?368:biome===4||biome===5?294:255,
    lookout:forbidden?'山脚望台':lookout,
    discovery:forbidden?'从山脚远望山体。原句写着“'+forbidden[0]+'”，这段步道留在山下。':discovery,
    notice:forbidden?'原句有“'+forbidden[0]+'”，请沿山脚平地远观。':
      clue?'循原句“'+clue+'”布置的地景示意。点击平地或路旗前行。':'本段步道采用卷内地景示意。到站后可以对照原句。',
    remote:Boolean(forbidden),
  };
}
