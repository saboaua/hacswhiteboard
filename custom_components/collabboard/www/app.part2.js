onst pts=node.points?node.points():(obj.points||[]);
    // konva line absolute position offset
    const dx=node.x(),dy=node.y();
    if(dx||dy){
      const np=[];
      for(let i=0;i<pts.length;i+=2){np.push(pts[i]+dx,pts[i+1]+dy);}
      node.position({x:0,y:0});
      node.points(np);
      updateObject(id,{points:np,x:0,y:0});
    }
  }else{
    updateObject(id,{x:node.x(),y:node.y(),width:node.width?node.width():obj.width,height:node.height?node.height():obj.height});
  }
  isLocalDrag=false;
}
function getSelectedIds(){
  if(!transformer)return[];
  return transformer.nodes().map(n=>n.id()).filter(Boolean);
}
function copySelection(){
  const ids=getSelectedIds();
  if(!ids.length){showToast('Select something first');return;}
  clipboard=ids.map(id=>Object.assign({},yObjects.get(id))).filter(Boolean);
  showToast('Copied '+clipboard.length+' item(s)');
}
function pasteClipboard(){
  if(!clipboard||!clipboard.length||!yObjects){showToast('Nothing to paste');return;}
  isLocalDrag=true;
  ydoc.transact(()=>{
    clipboard.forEach(obj=>{
      const o=Object.assign({},obj);
      o.id=uuid().slice(0,10);
      o.x=(o.x||0)+30;
      o.y=(o.y||0)+30;
      if(o.points){o.points=o.points.map((v,i)=>i%2===0?v+30:v+30);}
      o.createdBy=userId;o.createdAt=Date.now();
      yObjects.set(o.id,o);
    });
  });
  isLocalDrag=false;
  renderAllObjects();
  scheduleSave();
  showToast('Pasted '+clipboard.length+' item(s)');
}
function deleteSelection(){
  const ids=getSelectedIds();
  if(!ids.length)return;
  isLocalDrag=true;
  ydoc.transact(()=>ids.forEach(id=>yObjects.delete(id)));
  transformer.nodes([]);
  isLocalDrag=false;
  renderAllObjects();
  scheduleSave();
}

function onPointerDown(e){if(currentTool==='pan'||e.evt.button===1)return;const pos=getPointerPos();if(!pos)return;if(currentTool==='select'){if(e.target===stage)transformer.nodes([]);return;}if(currentTool==='eraser')return;isDrawing=true;startPos=pos;if(currentTool==='pen')drawingId=createObject('pen',{points:[pos.x,pos.y],stroke:currentColor,strokeWidth});else if(['rect','ellipse','line','arrow'].includes(currentTool))drawingId=createObject(currentTool,{x:pos.x,y:pos.y,width:0,height:0,points:[pos.x,pos.y,pos.x,pos.y],fill:currentColor,stroke:currentColor,strokeWidth});else if(currentTool==='sticky'){const sid=createObject('sticky',{x:pos.x,y:pos.y,width:160,height:140,fill:currentColor==='#ffffff'?'#eab308':currentColor,text:''});isDrawing=false;setTimeout(()=>openEditor(sid),50);}else if(currentTool==='text'){const tid=createObject('text',{x:pos.x,y:pos.y,width:200,text:'',fill:currentColor});isDrawing=false;setTimeout(()=>openEditor(tid),50);}}
function onPointerMove(){if(!isDrawing||!drawingId)return;const pos=getPointerPos();if(!pos||!startPos)return;const obj=yObjects.get(drawingId);if(!obj)return;if(currentTool==='pen')updateObject(drawingId,{points:obj.points.concat([pos.x,pos.y])});else if(['rect','ellipse'].includes(currentTool))updateObject(drawingId,{width:pos.x-startPos.x,height:pos.y-startPos.y});else if(['line','arrow'].includes(currentTool))updateObject(drawingId,{points:[startPos.x,startPos.y,pos.x,pos.y]});}
function onPointerUp(){isDrawing=false;drawingId=null;startPos=null;}

let editingId=null;
function closeEditor(save){
  const ed=document.getElementById('inline-editor');
  if(ed.style.display==='none')return;
  if(save&&editingId&&yObjects){
    const obj=yObjects.get(editingId);
    if(obj){
      const text=ed.value;
      updateObject(editingId,{text});
    }
  }
  ed.style.display='none';
  editingId=null;
}
function openEditor(id){
  const obj=yObjects.get(id);if(!obj)return;
  const node=layer.findOne('#'+id);if(!node)return;
  editingId=id;
  const ed=document.getElementById('inline-editor');
  const box=node.getClientRect({relativeTo:stage});
  const scale=stage.scaleX();
  ed.style.display='block';
  ed.style.left=(box.x*scale+stage.x())+'px';
  ed.style.top=(box.y*scale+stage.y())+'px';
  ed.style.width=Math.max(120,(box.width||200)*scale)+'px';
  ed.style.minHeight=Math.max(40,(box.height||40)*scale)+'px';
  ed.value=obj.text||'';
  ed.className='inline-editor'+(obj.type==='sticky'?' sticky-edit':'');
  ed.focus();
}

document.querySelectorAll('.tool-btn[data-tool]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.tool-btn[data-tool]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentTool=btn.dataset.tool;if(currentTool!=='select'&&transformer)transformer.nodes([]);renderAllObjects();}));
document.querySelectorAll('.color-swatch').forEach(s=>s.addEventListener('click',()=>{document.querySelectorAll('.color-swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');currentColor=s.dataset.color;}));
document.getElementById('stroke-width').addEventListener('input',e=>{strokeWidth=+e.target.value;});
document.getElementById('copy-link-btn').addEventListener('click',()=>{navigator.clipboard.writeText(document.getElementById('share-link').value);showToast('Link copied');});
document.getElementById('new-board-btn').addEventListener('click',()=>{if(confirm('Start a new empty board?')){location.search='?board='+uuid().slice(0,8);}});
document.getElementById('clear-btn').addEventListener('click',()=>{if(confirm('Clear all objects?')){isLocalDrag=true;ydoc.transact(()=>Array.from(yObjects.keys()).forEach(k=>yObjects.delete(k)));isLocalDrag=false;transformer.nodes([]);renderAllObjects();scheduleSave();}});
document.getElementById('theme-btn').addEventListener('click',()=>{theme=theme==='light'?'dark':'light';localStorage.setItem('cb_theme',theme);applyTheme();renderAllObjects();});
document.getElementById('templates-btn').addEventListener('click',()=>{document.getElementById('template-modal').style.display='flex';});
document.getElementById('tpl-cancel').addEventListener('click',()=>{document.getElementById('template-modal').style.display='none';});
document.getElementById('comment-send').addEventListener('click',postComment);
document.getElementById('comment-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();postComment();}});
document.getElementById('inline-editor').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeEditor(false);}if(e.key==='Enter'&&!e.shiftKey&&editingId){const obj=yObjects&&yObjects.get(editingId);if(obj&&obj.type==='text'){e.preventDefault();closeEditor(true);}}});
document.getElementById('inline-editor').addEventListener('blur',()=>closeEditor(true));
document.getElementById('export-png-btn').addEventListener('click',()=>{if(!stage)return;const uri=stage.toDataURL({pixelRatio:2});const a=document.createElement('a');a.href=uri;a.download='collabboard-'+boardId+'.png';a.click();});
document.getElementById('zoom-in').addEventListener('click',()=>{const c=Math.min(5,stage.scaleX()*1.2);stage.scale({x:c,y:c});stage.batchDraw();document.getElementById('zoom-label').textContent=Math.round(c*100)+'%';});
document.getElementById('zoom-out').addEventListener('click',()=>{const c=Math.max(.1,stage.scaleX()/1.2);stage.scale({x:c,y:c});stage.batchDraw();document.getElementById('zoom-label').textContent=Math.round(c*100)+'%';});
document.getElementById('zoom-fit').addEventListener('click',()=>{stage.scale({x:1,y:1});stage.position({x:0,y:0});stage.batchDraw();document.getElementById('zoom-label').textContent='100%';});

window.addEventListener('keydown',e=>{
  const tag=(e.target&&e.target.tagName||'').toLowerCase();
  if(tag==='input'||tag==='textarea')return;
  if((e.ctrlKey||e.metaKey)&&e.key==='c'){e.preventDefault();copySelection();}
  if((e.ctrlKey||e.metaKey)&&e.key==='v'){e.preventDefault();pasteClipboard();}
  if((e.ctrlKey||e.metaKey)&&e.key==='a'&&currentTool==='select'){
    e.preventDefault();
    if(layer){const nodes=layer.find('Line,Rect,Ellipse,Arrow,Text,Group').filter(n=>n!==transformer);transformer.nodes(nodes);layer.batchDraw();}
  }
  if((e.key==='Delete'||e.key==='Backspace')&&currentTool==='select'){e.preventDefault();deleteSelection();}
});

window.addEventListener('beforeunload',()=>saveBoardLocal());
