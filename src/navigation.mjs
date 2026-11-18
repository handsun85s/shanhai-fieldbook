// One coordinate system drives terrain, collision and navigation. Distances are game units.
export function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y;const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
export function cubic(a,b,c,d,n=36){return Array.from({length:n+1},(_,i)=>{const t=i/n,s=1-t;return{x:s*s*s*a[0]+3*s*s*t*b[0]+3*s*t*t*c[0]+t*t*t*d[0],y:s*s*s*a[1]+3*s*s*t*b[1]+3*s*t*t*c[1]+t*t*t*d[1]};});}
export function terrain(id){
 const big=id==='zhaoyao';
 let river=big?[[1940,570],[1600,700],[1320,900],[1030,850],[820,1020],[500,1040],[280,1100]].map(([x,y])=>({x,y})):id==='qingqiu'?cubic([980,100],[680,300],[1100,500],[900,820]):[...cubic([0,500],[360,490],[470,390],[650,460]),...cubic([650,460],[900,580],[1000,580],[1250,500]).slice(1)];
 const bridgeXs=big?[1230,1650]:id==='qingqiu'?[920]:[300,970];
 const bridges=bridgeXs.map(bx=>{const p=river.reduce((best,p)=>Math.abs(p.x-bx)<Math.abs(best.x-bx)?p:best,river[0]);return{x:p.x,y:p.y,w:id==='qingqiu'?150:90,h:id==='qingqiu'?90:150};});
 // The southbound river also needs a crossing at its northern bend.
 if(id==='qingqiu')bridges.push({x:river[10].x,y:river[10].y,w:155,h:85});
 return {id,width:big?2400:1200,height:big?1500:800,bounds:big?{left:380,right:2150,top:220,bottom:1250}:{left:70,right:1130,top:120,bottom:750},river,waterRadius:24,bridges,obstacles:/** @type {{x:number,y:number,r:number}[]} */([])};
}
export function onBridge(world,p,pad=0){return world.bridges.some(b=>Math.abs(p.x-b.x)<=b.w/2-pad&&Math.abs(p.y-b.y)<=b.h/2-pad);}
export function walkable(world,p,pad=10){const b=world.bounds;if(p.x<b.left||p.x>b.right||p.y<b.top||p.y>b.bottom)return false;if(world.obstacles.some(o=>Math.hypot(p.x-o.x,p.y-o.y)<o.r+pad))return false;if(onBridge(world,p))return true;return !world.river.slice(1).some((v,i)=>segmentDistance(p,world.river[i],v)<world.waterRadius+pad);}
export function nearestWalkable(world,p,step=20){if(walkable(world,p))return{x:p.x,y:p.y};for(let r=step;r<world.width;r+=step){for(let i=0;i<32;i++){const t=i/32*Math.PI*2,q={x:p.x+Math.cos(t)*r,y:p.y+Math.sin(t)*r};if(walkable(world,q))return q;}}return null;}
export function moveSafely(world,p,dx,dy){let q={...p};const n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/5));for(let i=0;i<n;i++){const nx={x:q.x+dx/n,y:q.y+dy/n};if(walkable(world,nx))q=nx;else if(walkable(world,{x:nx.x,y:q.y}))q.x=nx.x;else if(walkable(world,{x:q.x,y:nx.y}))q.y=nx.y;}return q;}
export function clearLine(world,a,b){const n=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/7);for(let i=0;i<=n;i++)if(!walkable(world,{x:a.x+(b.x-a.x)*i/(n||1),y:a.y+(b.y-a.y)*i/(n||1)}))return false;return true;}
export function findPath(world,start,destination,cell=24){
 const s=nearestWalkable(world,start),goal=nearestWalkable(world,destination);if(!s||!goal)return[];
 if(clearLine(world,s,goal))return[goal];
 const b=world.bounds,cols=Math.floor((b.right-b.left)/cell)+1,rows=Math.floor((b.bottom-b.top)/cell)+1;
 const point=n=>({x:b.left+(n%cols)*cell,y:b.top+Math.floor(n/cols)*cell});
 const valid=new Map();const free=n=>{if(n<0||n>=cols*rows)return false;if(!valid.has(n))valid.set(n,walkable(world,point(n)));return valid.get(n);};
 // Connect endpoints to reachable grid cells, rather than rounding into a tree or river.
 const endpoint=p=>{let best=-1,dist=Infinity;for(let n=0;n<cols*rows;n++){const q=point(n),d=Math.hypot(q.x-p.x,q.y-p.y);if(d<dist&&d<cell*4&&free(n)&&clearLine(world,p,q)){best=n;dist=d;}}return best;};
 const first=endpoint(s),last=endpoint(goal);if(first<0||last<0)return[];
 const open=new Set([first]),came=new Map(),g=new Map([[first,0]]),f=new Map([[first,0]]);
 while(open.size){let cur=-1,best=Infinity;for(const n of open){if(f.get(n)<best){best=f.get(n);cur=n;}}if(cur===last){const route=[goal];let n=last;while(n!==first){route.unshift(point(n));n=came.get(n);}route.unshift(point(first));const smooth=[];let from=s;for(let i=0;i<route.length;){let j=route.length-1;while(j>i&&!clearLine(world,from,route[j]))j--;smooth.push(route[j]);from=route[j];i=j+1;}return smooth;}
 open.delete(cur);const cx=cur%cols,cy=Math.floor(cur/cols);
 for(const [ox,oy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const nx=cx+ox,ny=cy+oy,n=ny*cols+nx;if(nx<0||nx>=cols||ny<0||ny>=rows||!free(n)||!clearLine(world,point(cur),point(n)))continue;const score=g.get(cur)+Math.hypot(ox,oy);if(score<(g.get(n)??Infinity)){came.set(n,cur);g.set(n,score);const p=point(n);f.set(n,score+Math.hypot(p.x-goal.x,p.y-goal.y)/cell);open.add(n);}}
 }return[];
}
