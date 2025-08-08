(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const nextCanvas = document.getElementById('next');
  const nctx = nextCanvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const linesEl = document.getElementById('lines');
  const levelEl = document.getElementById('level');
  const toast = document.getElementById('toast');

  const COLS = 10, ROWS = 20;
  const BLOCK = Math.floor(canvas.width / COLS);
  canvas.height = BLOCK * ROWS;

  const COLORS = ['#4DD7FA','#F9D423','#7EF7D4','#FF6B6B','#C86BFA','#4ECDC4','#5AC0FF'];
  const GRID_BG = 'rgba(255,255,255,0.05)';
  const SHAPES = {I:[[1,1,1,1]],O:[[1,1],[1,1]],S:[[0,1,1],[1,1,0]],Z:[[1,1,0],[0,1,1]],T:[[1,1,1],[0,1,0]],J:[[1,0,0],[1,1,1]],L:[[0,0,1],[1,1,1]]};
  const PIECES = Object.keys(SHAPES);

  function randomPiece(){const key = PIECES[Math.floor(Math.random()*PIECES.length)];return { key, matrix: SHAPES[key].map(r=>r.slice()), color: COLORS[PIECES.indexOf(key)] };}
  function rotate(matrix){return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());}

  const state = {grid:Array.from({length: ROWS}, () => Array(COLS).fill(null)),current:null,next:randomPiece(),x:0,y:0,score:0,lines:0,level:1,dropInterval:900,dropAcc:0,running:false,paused:false,particles:[]};

  function newPiece(){state.current = state.next; state.next = randomPiece(); state.x = Math.floor((COLS - state.current.matrix[0].length)/2); state.y = 0; if (collide()) gameOver();}
  function collide(xOff=0,yOff=0,mat=state.current.matrix){for(let y=0;y<mat.length;y++){for(let x=0;x<mat[y].length;x++){if(!mat[y][x]) continue; const ny=y+state.y+yOff, nx=x+state.x+xOff; if(nx<0||nx>=COLS||ny>=ROWS) return true; if(ny>=0&&state.grid[ny][nx]) return true;}} return false;}
  function merge(){const m=state.current.matrix; for(let y=0;y<m.length;y++){for(let x=0;x<m[y].length;x++){if(!m[y][x]) continue; const gy=y+state.y, gx=x+state.x; if(gy>=0) state.grid[gy][gx]=state.current.color;}}}
  function clearLines(){let lines=0; for(let y=ROWS-1;y>=0;y--){if(state.grid[y].every(c=>c)){explodeRow(y); state.grid.splice(y,1); state.grid.unshift(Array(COLS).fill(null)); lines++; y++;}} if(lines>0){const scores=[0,100,300,500,800]; state.score+=scores[lines]*state.level; state.lines+=lines; scoreEl.textContent=state.score; linesEl.textContent=state.lines; const newLevel=1+Math.floor(state.lines/10); if(newLevel>state.level){state.level=newLevel; levelEl.textContent=state.level; state.dropInterval=Math.max(120,900-(state.level-1)*80); showToast('Level '+state.level);}}}
  function explodeRow(y){for(let x=0;x<COLS;x++){const color=state.grid[y][x]||'#ffffff'; for(let i=0;i<10;i++){state.particles.push({x:(x+0.5)*BLOCK,y:(y+0.5)*BLOCK,vx:(Math.random()-0.5)*4,vy:-Math.random()*4-1,life:30,color});}}}
  function drawParticles(){for(let i=state.particles.length-1;i>=0;i--){const p=state.particles[i]; ctx.globalAlpha=Math.max(0,p.life/30); ctx.fillStyle=p.color; ctx.fillRect(p.x,p.y,3,3); ctx.globalAlpha=1; p.x+=p.vx; p.y+=p.vy; p.vy+=0.12; p.life--; if(p.life<=0) state.particles.splice(i,1);}}
  function drawGrid(){ctx.clearRect(0,0,canvas.width,canvas.height); ctx.strokeStyle=GRID_BG; ctx.lineWidth=1; for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*BLOCK+0.5,0);ctx.lineTo(x*BLOCK+0.5,canvas.height);ctx.stroke();} for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*BLOCK+0.5);ctx.lineTo(canvas.width,y*BLOCK+0.5);ctx.stroke();} for(let y=0;y<ROWS;y++){for(let x=0;x<COLS;x++){const c=state.grid[y][x]; if(!c) continue; drawBlock(x,y,c);}} if(state.current){const m=state.current.matrix; for(let y=0;y<m.length;y++){for(let x=0;x<m[y].length;x++){if(!m[y][x]) continue; drawBlock(state.x+x,state.y+y,state.current.color);}} let gy=state.y; while(!collide(0,gy-state.y+1)) gy++; ctx.globalAlpha=0.25; for(let y=0;y<m.length;y++){for(let x=0;x<m[y].length;x++){if(!m[y][x]) continue; drawBlock(state.x+x,gy+y,state.current.color);}} ctx.globalAlpha=1;} drawParticles();}
  function drawBlock(x,y,color){const px=x*BLOCK, py=y*BLOCK, r=6; ctx.fillStyle=color; roundRect(ctx,px+1,py+1,BLOCK-2,BLOCK-2,r,true,false); const g=ctx.createLinearGradient(px,py,px,py+BLOCK); g.addColorStop(0,'rgba(255,255,255,0.35)'); g.addColorStop(0.4,'rgba(255,255,255,0.08)'); g.addColorStop(1,'rgba(0,0,0,0.15)'); ctx.fillStyle=g; roundRect(ctx,px+1,py+1,BLOCK-2,BLOCK-2,r,true,false); ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=1; roundRect(ctx,px+1,py+1,BLOCK-2,BLOCK-2,r,false,true);}
  function roundRect(ctx,x,y,w,h,r,fill,stroke){if(typeof r==='number') r={tl:r,tr:r,br:r,bl:r}; ctx.beginPath(); ctx.moveTo(x+r.tl,y); ctx.lineTo(x+w-r.tr,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r.tr); ctx.lineTo(x+w,y+h-r.br); ctx.quadraticCurveTo(x+w,y+h,x+w-r.br,y+h); ctx.lineTo(x+r.bl,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r.bl); ctx.lineTo(x,y+r.tl); ctx.quadraticCurveTo(x,y,x+r.tl,y); if(fill) ctx.fill(); if(stroke) ctx.stroke();}
  let lastTime=0;
  function update(time=0){if(!state.running||state.paused) return; const dt=time-lastTime; lastTime=time; state.dropAcc+=dt; if(state.dropAcc>state.dropInterval) softDrop(); drawGrid(); requestAnimationFrame(update);}
  function softDrop(){if(!state.current) return; if(!collide(0,1)) state.y++; else {merge(); clearLines(); newPiece();} state.dropAcc=0;}
  function hardDrop(){if(!state.current) return; while(!collide(0,1)) state.y++; merge(); clearLines(); newPiece(); state.dropAcc=0;}
  function move(dir){if(!state.current) return; if(!collide(dir,0)) state.x+=dir;}
  function rotateCurrent(){if(!state.current) return; const rotated=rotate(state.current.matrix); if(!collide(0,0,rotated)) state.current.matrix=rotated; else if(!collide(-1,0,rotated)){state.x-=1; state.current.matrix=rotated;} else if(!collide(1,0,rotated)){state.x+=1; state.current.matrix=rotated;}}
  function startGame(){Object.assign(state,{grid:Array.from({length:ROWS},()=>Array(COLS).fill(null)),score:0,lines:0,level:1,dropInterval:900,particles:[]}); scoreEl.textContent=0; linesEl.textContent=0; levelEl.textContent=1; state.running=true; state.paused=false; state.next=randomPiece(); newPiece(); lastTime=performance.now(); state.dropAcc=0; requestAnimationFrame(update);}
  function pauseGame(){state.paused=!state.paused; document.getElementById('pause').textContent=state.paused?'Resume':'Pause'; if(!state.paused){lastTime=performance.now(); requestAnimationFrame(update);}}
  function restartGame(){startGame();}
  function gameOver(){state.running=false; showToast('Game Over');}
  function drawNext(){nctx.clearRect(0,0,nextCanvas.width,nextCanvas.height); const piece=state.next; const m=piece.matrix; const bw=Math.floor(Math.min(nextCanvas.width,nextCanvas.height)/Math.max(m.length,m[0].length)); const offX=Math.floor((nextCanvas.width - bw*m[0].length)/2); const offY=Math.floor((nextCanvas.height - bw*m.length)/2); for(let y=0;y<m.length;y++){for(let x=0;x<m[y].length;x++){if(!m[y][x]) continue; nctx.fillStyle=piece.color; nctx.strokeStyle='rgba(0,0,0,0.25)'; nctx.lineWidth=1; roundRect(nctx,offX+x*bw+1,offY+y*bw+1,bw-2,bw-2,6,true,true);}}}
  setInterval(drawNext, 120);
  function showToast(text){toast.textContent=text; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),900);}
  document.getElementById('start').addEventListener('click', startGame);
  document.getElementById('pause').addEventListener('click', pauseGame);
  document.getElementById('restart').addEventListener('click', restartGame);
  document.getElementById('btn-left').addEventListener('click', ()=>move(-1));
  document.getElementById('btn-right').addEventListener('click', ()=>move(1));
  document.getElementById('btn-rotate').addEventListener('click', rotateCurrent);
  document.getElementById('btn-down').addEventListener('click', softDrop);
  document.getElementById('btn-drop').addEventListener('click', hardDrop);
  window.addEventListener('keydown', e => {if(!state.running) return; if(e.key==='ArrowLeft') move(-1); else if(e.key==='ArrowRight') move(1); else if(e.key==='ArrowUp') rotateCurrent(); else if(e.key==='ArrowDown') softDrop(); else if(e.key===' ') hardDrop();});
  let touchStart=null, touchMoved=false;
  canvas.addEventListener('touchstart', e => {const t=e.changedTouches[0]; touchStart={x:t.clientX,y:t.clientY,time:Date.now()}; touchMoved=false;}, {passive:true});
  canvas.addEventListener('touchmove', e => {if(!touchStart) return; const t=e.changedTouches[0]; const dx=t.clientX - touchStart.x; if(Math.abs(dx)>18){move(dx>0?1:-1); touchStart.x=t.clientX; touchMoved=true;}}, {passive:true});
  canvas.addEventListener('touchend', e => {const t=e.changedTouches[0]; const dy=t.clientY - touchStart.y; const dt=Date.now() - touchStart.time; const tap=!touchMoved && Math.abs(dy)<10 && dt<220; const rect=canvas.getBoundingClientRect(); const topHalf=t.clientY - rect.top < rect.height/2; if(tap){ if(topHalf) rotateCurrent(); else softDrop(); } else { if(dy>26) softDrop(); if(dy<-50) hardDrop(); } touchStart=null;}, {passive:true});
  drawGrid(); drawNext();
})();