import * as Y from 'https://cdn.jsdelivr.net/npm/yjs@13.6.18/+esm';
import { WebrtcProvider } from 'https://cdn.jsdelivr.net/npm/y-webrtc@10.3.0/+esm';

const TEMPLATES = {
  blank: { name: 'Blank', desc: 'Empty canvas', objects: [] },
  brainstorm: { name: 'Brainstorm', desc: 'Sticky ideas', objects: [
    { id: 't1', type: 'text', x: 40, y: 30, text: 'Brainstorm', fill: '#6366f1', width: 300 },
    { id: 's1', type: 'sticky', x: 40, y: 80, width: 160, height: 120, fill: '#eab308', text: 'Idea 1' },
    { id: 's2', type: 'sticky', x: 220, y: 80, width: 160, height: 120, fill: '#22c55e', text: 'Idea 2' },
    { id: 's3', type: 'sticky', x: 400, y: 80, width: 160, height: 120, fill: '#f97316', text: 'Idea 3' }
  ]},
  orgchart: { name: 'Org Chart', desc: 'Hierarchy', objects: [
    { id: 'o0', type: 'text', x: 280, y: 20, text: 'Organization Chart', fill: '#6366f1', width: 300 },
    { id: 'o1', type: 'rect', x: 300, y: 70, width: 160, height: 60, fill: '#6366f1', stroke: '#6366f1', strokeWidth: 2 },
    { id: 'o1t', type: 'text', x: 310, y: 85, text: 'CEO / Director', fill: '#e8eaed', width: 140 },
    { id: 'o2', type: 'rect', x: 120, y: 180, width: 140, height: 50, fill: '#3b82f6', stroke: '#3b82f6', strokeWidth: 1 },
    { id: 'o2t', type: 'text', x: 130, y: 192, text: 'Engineering', fill: '#e8eaed', width: 120 },
    { id: 'o3', type: 'rect', x: 320, y: 180, width: 140, height: 50, fill: '#22c55e', stroke: '#22c55e', strokeWidth: 1 },
    { id: 'o3t', type: 'text', x: 330, y: 192, text: 'Product', fill: '#e8eaed', width: 120 },
    { id: 'o4', type: 'rect', x: 520, y: 180, width: 140, height: 50, fill: '#eab308', stroke: '#eab308', strokeWidth: 1 },
    { id: 'o4t', type: 'text', x: 530, y: 192, text: 'Ops', fill: '#1a1d24', width: 120 }
  ]},
  kanban: { name: 'Kanban', desc: 'To do · Doing · Done', objects: [
    { id: 'k0', type: 'text', x: 40, y: 20, text: 'Kanban', fill: '#6366f1', width: 200 },
    { id: 'k1', type: 'rect', x: 40, y: 60, width: 180, height: 320, fill: '#3b82f6', stroke: '#3b82f6', strokeWidth: 1 },
    { id: 'k1t', type: 'text', x: 55, y: 70, text: 'To Do', fill: '#e8eaed', width: 150 },
    { id: 'k2', type: 'rect', x: 240, y: 60, width: 180, height: 320, fill: '#eab308', stroke: '#eab308', strokeWidth: 1 },
    { id: 'k2t', type: 'text', x: 255, y: 70, text: 'Doing', fill: '#1a1d24', width: 150 },
    { id: 'k3', type: 'rect', x: 440, y: 60, width: 180, height: 320, fill: '#22c55e', stroke: '#22c55e', strokeWidth: 1 },
    { id: 'k3t', type: 'text', x: 455, y: 70, text: 'Done', fill: '#e8eaed', width: 150 }
  ]}
};

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const COLORS = ['#6366f1', '#ef4444', '#22c55e', '#eab308', '#f97316', '#ec4899', '#06b6d4', '#8b5cf6'];
let userId = localStorage.getItem('cb_uid') || uuid();
localStorage.setItem('cb_uid', userId);
let userName = localStorage.getItem('cb_name') || '';
let userColor = localStorage.getItem('cb_color') || COLORS[Math.floor(Math.random() * COLORS.length)];
localStorage.setItem('cb_color', userColor);
let boardId = new URLSearchParams(location.search).get('board') || '';
let currentTool = 'select', currentColor = '#6366f1', strokeWidth = 3;
let ydoc, yObjects, yComments, provider, awareness, stage, layer, transformer;
let saveTimer = null, isRestoring = false, isLocalDrag = false, clipboard = [];
let theme = localStorage.getItem('cb_theme') || 'dark';
let isDrawing = false, drawingId = null, startPos = null, editingId = null;

function applyTheme() {
  document.documentElement.classList.toggle('light', theme === 'light');
  const b = document.getElementById('theme-btn');
  if (b) b.textContent = theme === 'light' ? 'Switch to Dark' : 'Switch to Light';
}
applyTheme();

function showToast(m, ms = 2200) {
  const t = document.getElementById('toast');
  t.textContent = m; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms);
}

function storageKey() { return 'cb_board_' + boardId; }
function commentsKey() { return 'cb_comments_' + boardId; }

function saveBoardLocal() {
  if (!yObjects || !boardId || isRestoring) return;
  try {
    localStorage.setItem(storageKey(), JSON.stringify(Array.from(yObjects.entries())));
    if (yComments) localStorage.setItem(commentsKey(), JSON.stringify(yComments.toArray()));
    const el = document.getElementById('save-indicator');
    if (el) { el.textContent = 'Saved · ' + new Date().toLocaleTimeString(); el.classList.add('saved'); }
  } catch (e) {}
}
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveBoardLocal, 400); }

function loadBoardLocal() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw && yObjects && yObjects.size === 0) {
      isRestoring = true;
      const entries = JSON.parse(raw);
      ydoc.transact(() => entries.forEach(([id, obj]) => yObjects.set(id, obj)));
      isRestoring = false;
    }
    const cr = localStorage.getItem(commentsKey());
    if (cr && yComments && yComments.length === 0) {
      const arr = JSON.parse(cr);
      ydoc.transact(() => arr.forEach(c => yComments.push([c])));
    }
  } catch (e) {}
}

function updateUsersList() {
  const states = Array.from(awareness.getStates().values());
  const list = document.getElementById('users-list');
  const others = states.filter(s => s.user && s.user.id !== userId);
  document.getElementById('user-count').textContent = '(' + (others.length + 1) + ')';
  list.innerHTML = others.map(s => {
    const u = s.user;
    return '<div class="user-item"><div class="status-dot"></div><div class="avatar" style="background:' + u.color + ';width:18px;height:18px;font-size:9px">' + (u.name||'?')[0] + '</div>' + (u.name||'Anon') + '</div>';
  }).join('') || '<div class="empty-comments">Only you</div>';
}

function updateSelfUI() {
  document.getElementById('self-name').value = userName;
  const a = document.getElementById('self-avatar');
  a.textContent = (userName || 'A')[0].toUpperCase();
  a.style.background = userColor;
}

function renderComments() {
  const list = document.getElementById('comments-list');
  const arr = yComments ? yComments.toArray() : [];
  document.getElementById('comment-count').textContent = '(' + arr.length + ')';
  if (!arr.length) { list.innerHTML = '<div class="empty-comments">No comments yet.</div>'; return; }
  list.innerHTML = arr.map(c => {
    const body = (c.text || '').replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    return '<div class="comment"><div class="comment-header"><div class="comment-avatar" style="background:' + (c.color||'#6366f1') + '">' + (c.name||'?')[0] + '</div><span class="comment-author">' + (c.name||'Anon') + '</span><span class="comment-time">' + new Date(c.at||0).toLocaleTimeString() + '</span></div><div class="comment-body">' + body + '</div></div>';
  }).join('');
  list.scrollTop = list.scrollHeight;
}

function postComment() {
  const input = document.getElementById('comment-input');
  const text = input.value.trim();
  if (!text || !yComments) return;
  yComments.push([{ id: uuid().slice(0, 8), name: userName || 'Anon', color: userColor, text, at: Date.now() }]);
  input.value = '';
  scheduleSave();
}

function applyTemplate(key) {
  const tpl = TEMPLATES[key];
  if (!tpl || !yObjects) return;
  if (yObjects.size > 0 && !confirm('Replace board with "' + tpl.name + '" template?')) return;
  ydoc.transact(() => {
    Array.from(yObjects.keys()).forEach(k => yObjects.delete(k));
    (tpl.objects || []).forEach(obj => {
      const o = Object.assign({}, obj);
      o.createdBy = userId; o.createdAt = Date.now();
      yObjects.set(o.id, o);
    });
  });
  document.getElementById('template-modal').style.display = 'none';
  scheduleSave();
  showToast('Template: ' + tpl.name);
  setTimeout(renderAllObjects, 50);
}

function initBoard(id) {
  boardId = id || uuid().slice(0, 8);
  const url = new URL(location.href);
  url.searchParams.set('board', boardId);
  history.replaceState({}, '', url);
  document.getElementById('board-id-display').textContent = boardId;
  document.getElementById('share-link').value = location.href;
  ydoc = new Y.Doc();
  yObjects = ydoc.getMap('objects');
  yComments = ydoc.getArray('comments');
  provider = new WebrtcProvider('collabboard-' + boardId, ydoc, { signaling: ['wss://signaling.yjs.dev'] });
  awareness = provider.awareness;
  awareness.setLocalStateField('user', { id: userId, name: userName, color: userColor });
  awareness.on('change', updateUsersList);
  updateUsersList();
  yObjects.observe(() => { if (!isLocalDrag) renderAllObjects(); scheduleSave(); });
  yComments.observe(() => { renderComments(); scheduleSave(); });
  loadBoardLocal();
  setTimeout(() => { renderAllObjects(); renderComments(); }, 300);
}

function initStage() {
  const wrap = document.getElementById('canvas-wrap');
  stage = new Konva.Stage({ container: 'stage-container', width: wrap.clientWidth, height: wrap.clientHeight });
  layer = new Konva.Layer();
  stage.add(layer);
  transformer = new Konva.Transformer({ rotateEnabled: false, borderStroke: '#6366f1', anchorStroke: '#6366f1', anchorSize: 8 });
  layer.add(transformer);
  transformer.on('transformstart dragstart', () => { isLocalDrag = true; });
  transformer.on('transformend', () => {
    transformer.nodes().forEach(node => {
      const id = node.id();
      const obj = yObjects.get(id);
      if (!obj) return;
      isLocalDrag = true;
      const scaleX = node.scaleX(), scaleY = node.scaleY();
      if (obj.type === 'rect' || obj.type === 'sticky') {
        updateObject(id, { x: node.x(), y: node.y(), width: Math.max(10, (obj.width || node.width()) * scaleX), height: Math.max(10, (obj.height || node.height()) * scaleY) });
        node.scale({ x: 1, y: 1 });
      } else if (obj.type === 'text') {
        updateObject(id, { x: node.x(), y: node.y(), width: Math.max(40, (obj.width || 200) * scaleX) });
        node.scale({ x: 1, y: 1 });
      } else if (obj.type === 'ellipse') {
        const w = Math.max(10, Math.abs((obj.width || 0) * scaleX)), h = Math.max(10, Math.abs((obj.height || 0) * scaleY));
        updateObject(id, { x: node.x() - w / 2, y: node.y() - h / 2, width: w, height: h });
        node.scale({ x: 1, y: 1 });
      } else {
        updateObject(id, { x: node.x(), y: node.y() });
      }
      isLocalDrag = false;
    });
    scheduleSave();
    renderAllObjects();
  });
  stage.on('mousedown touchstart', onPointerDown);
  stage.on('mousemove touchmove', onPointerMove);
  stage.on('mouseup touchend', onPointerUp);
  stage.on('wheel', e => {
    e.evt.preventDefault();
    const scaleBy = 1.08, oldScale = stage.scaleX(), pointer = stage.getPointerPosition();
    const mp = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    const ns = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const c = Math.max(0.1, Math.min(5, ns));
    stage.scale({ x: c, y: c });
    stage.position({ x: pointer.x - mp.x * c, y: pointer.y - mp.y * c });
    stage.batchDraw();
    document.getElementById('zoom-label').textContent = Math.round(c * 100) + '%';
  });
  window.addEventListener('resize', () => { stage.width(wrap.clientWidth); stage.height(wrap.clientHeight); });
}

function getPointerPos() {
  const p = stage.getPointerPosition();
  if (!p) return null;
  return stage.getAbsoluteTransform().copy().invert().point(p);
}

function createObject(type, attrs) {
  const id = uuid().slice(0, 10);
  yObjects.set(id, { id, type, ...attrs, createdBy: userId, createdAt: Date.now() });
  return id;
}

function updateObject(id, ch) {
  const o = yObjects.get(id);
  if (o) {
    const was = isLocalDrag;
    if (isDrawing) isLocalDrag = true;
    yObjects.set(id, { ...o, ...ch });
    if (isDrawing) { isLocalDrag = was; renderAllObjects(); }
  }
}

function renderAllObjects() {
  if (!layer) return;
  const selectedIds = transformer ? transformer.nodes().map(n => n.id()).filter(Boolean) : [];
  transformer.nodes([]);
  layer.find('Line, Rect, Ellipse, Arrow, Text, Group').forEach(n => { if (n !== transformer) n.destroy(); });
  Array.from(yObjects.entries()).forEach(([id, obj]) => {
    let node;
    if (obj.type === 'pen' && obj.points) node = new Konva.Line({ id, points: obj.points, stroke: obj.stroke, strokeWidth: obj.strokeWidth || 3, lineCap: 'round', lineJoin: 'round', tension: 0.4, draggable: currentTool === 'select' });
    else if (obj.type === 'rect') node = new Konva.Rect({ id, x: obj.x, y: obj.y, width: obj.width, height: obj.height, fill: (obj.fill || '#6366f1') + '33', stroke: obj.stroke || obj.fill, strokeWidth: obj.strokeWidth || 2, cornerRadius: 4, draggable: currentTool === 'select' });
    else if (obj.type === 'ellipse') node = new Konva.Ellipse({ id, x: obj.x + (obj.width || 0) / 2, y: obj.y + (obj.height || 0) / 2, radiusX: Math.abs((obj.width || 0) / 2), radiusY: Math.abs((obj.height || 0) / 2), fill: (obj.fill || '#6366f1') + '33', stroke: obj.stroke || obj.fill, strokeWidth: obj.strokeWidth || 2, draggable: currentTool === 'select' });
    else if (obj.type === 'line' || obj.type === 'arrow') node = new Konva.Arrow({ id, points: obj.points || [obj.x, obj.y, obj.x + (obj.width || 0), obj.y + (obj.height || 0)], stroke: obj.stroke || '#6366f1', strokeWidth: obj.strokeWidth || 3, fill: obj.stroke || '#6366f1', pointerLength: obj.type === 'arrow' ? 12 : 0, pointerWidth: obj.type === 'arrow' ? 10 : 0, draggable: currentTool === 'select' });
    else if (obj.type === 'text') node = new Konva.Text({ id, x: obj.x, y: obj.y, text: obj.text || 'Text', fontSize: obj.fontSize || 18, fontFamily: 'Inter', fill: obj.fill || (theme === 'light' ? '#1a1d24' : '#e8eaed'), draggable: currentTool === 'select', width: obj.width || 200 });
    else if (obj.type === 'sticky') {
      const g = new Konva.Group({ id, x: obj.x, y: obj.y, draggable: currentTool === 'select' });
      g.add(new Konva.Rect({ width: obj.width || 160, height: obj.height || 140, fill: obj.fill || '#eab308', shadowColor: 'black', shadowBlur: 6, shadowOpacity: 0.2, cornerRadius: 2 }));
      g.add(new Konva.Text({ text: obj.text || 'Sticky', fontSize: 15, fontFamily: 'Caveat', fill: '#1a1d24', width: (obj.width || 160) - 14, padding: 8 }));
      node = g;
    }
    if (node) {
      node.on('click tap', e => {
        if (currentTool === 'eraser') { yObjects.delete(id); return; }
        if (currentTool !== 'select') return;
        const shift = e.evt && (e.evt.shiftKey || e.evt.metaKey);
        if (shift) {
          const cur = transformer.nodes().slice();
          const i = cur.indexOf(node);
          if (i >= 0) cur.splice(i, 1); else cur.push(node);
          transformer.nodes(cur);
        } else transformer.nodes([node]);
        layer.batchDraw();
      });
      if (obj.type === 'text' || obj.type === 'sticky') node.on('dblclick dbltap', () => openEditor(id));
      node.on('dragstart', () => { isLocalDrag = true; });
      node.on('dragend', () => { syncNodeToY(node, id, obj.type); isLocalDrag = false; scheduleSave(); });
      layer.add(node);
    }
  });
  if (selectedIds.length) {
    const nodes = selectedIds.map(id => layer.findOne('#' + id)).filter(Boolean);
    if (nodes.length) transformer.nodes(nodes);
  }
  layer.batchDraw();
}

function syncNodeToY(node, id, type) {
  if (!yObjects || !id) return;
  const obj = yObjects.get(id);
  if (!obj) return;
  isLocalDrag = true;
  if (type === 'ellipse') {
    const rx = node.radiusX(), ry = node.radiusY();
    updateObject(id, { x: node.x() - rx, y: node.y() - ry, width: rx * 2, height: ry * 2 });
  } else if (type === 'pen' || type === 'line' || type === 'arrow') {
    const pts = node.points ? node.points() : (obj.points || []);
    const dx = node.x(), dy = node.y();
    if (dx || dy) {
      const np = [];
      for (let i = 0; i < pts.length; i += 2) np.push(pts[i] + dx, pts[i + 1] + dy);
      node.position({ x: 0, y: 0 });
      node.points(np);
      updateObject(id, { points: np, x: 0, y: 0 });
    }
  } else {
    updateObject(id, { x: node.x(), y: node.y(), width: node.width ? node.width() : obj.width, height: node.height ? node.height() : obj.height });
  }
  isLocalDrag = false;
}

function getSelectedIds() {
  if (!transformer) return [];
  return transformer.nodes().map(n => n.id()).filter(Boolean);
}
function copySelection() {
  const ids = getSelectedIds();
  if (!ids.length) { showToast('Select something first'); return; }
  clipboard = ids.map(id => Object.assign({}, yObjects.get(id))).filter(Boolean);
  showToast('Copied ' + clipboard.length + ' item(s)');
}
function pasteClipboard() {
  if (!clipboard || !clipboard.length || !yObjects) { showToast('Nothing to paste'); return; }
  isLocalDrag = true;
  ydoc.transact(() => {
    clipboard.forEach(obj => {
      const o = Object.assign({}, obj);
      o.id = uuid().slice(0, 10);
      o.x = (o.x || 0) + 30; o.y = (o.y || 0) + 30;
      if (o.points) o.points = o.points.map((v, i) => v + 30);
      o.createdBy = userId; o.createdAt = Date.now();
      yObjects.set(o.id, o);
    });
  });
  isLocalDrag = false;
  renderAllObjects();
  scheduleSave();
  showToast('Pasted ' + clipboard.length + ' item(s)');
}
function deleteSelection() {
  const ids = getSelectedIds();
  if (!ids.length) return;
  isLocalDrag = true;
  ydoc.transact(() => ids.forEach(id => yObjects.delete(id)));
  transformer.nodes([]);
  isLocalDrag = false;
  renderAllObjects();
  scheduleSave();
}

function onPointerDown(e) {
  if (currentTool === 'pan' || e.evt.button === 1) return;
  const pos = getPointerPos();
  if (!pos) return;
  if (currentTool === 'select') { if (e.target === stage) transformer.nodes([]); return; }
  if (currentTool === 'eraser') return;
  isDrawing = true; startPos = pos;
  if (currentTool === 'pen') drawingId = createObject('pen', { points: [pos.x, pos.y], stroke: currentColor, strokeWidth });
  else if (['rect', 'ellipse', 'line', 'arrow'].includes(currentTool)) drawingId = createObject(currentTool, { x: pos.x, y: pos.y, width: 0, height: 0, points: [pos.x, pos.y, pos.x, pos.y], fill: currentColor, stroke: currentColor, strokeWidth });
  else if (currentTool === 'sticky') { const sid = createObject('sticky', { x: pos.x, y: pos.y, width: 160, height: 140, fill: currentColor === '#ffffff' ? '#eab308' : currentColor, text: '' }); isDrawing = false; setTimeout(() => openEditor(sid), 50); }
  else if (currentTool === 'text') { const tid = createObject('text', { x: pos.x, y: pos.y, width: 200, text: '', fill: currentColor }); isDrawing = false; setTimeout(() => openEditor(tid), 50); }
}
function onPointerMove() {
  if (!isDrawing || !drawingId) return;
  const pos = getPointerPos();
  if (!pos || !startPos) return;
  const obj = yObjects.get(drawingId);
  if (!obj) return;
  if (currentTool === 'pen') updateObject(drawingId, { points: obj.points.concat([pos.x, pos.y]) });
  else if (['rect', 'ellipse'].includes(currentTool)) updateObject(drawingId, { width: pos.x - startPos.x, height: pos.y - startPos.y });
  else if (['line', 'arrow'].includes(currentTool)) updateObject(drawingId, { points: [startPos.x, startPos.y, pos.x, pos.y] });
}
function onPointerUp() { isDrawing = false; drawingId = null; startPos = null; }

function closeEditor(save) {
  const ed = document.getElementById('inline-editor');
  if (ed.style.display === 'none') return;
  if (save && editingId && yObjects) {
    const obj = yObjects.get(editingId);
    if (obj) updateObject(editingId, { text: ed.value });
  }
  ed.style.display = 'none';
  editingId = null;
}
function openEditor(id) {
  const obj = yObjects.get(id); if (!obj) return;
  const node = layer.findOne('#' + id); if (!node) return;
  editingId = id;
  const ed = document.getElementById('inline-editor');
  const box = node.getClientRect({ relativeTo: stage });
  const scale = stage.scaleX();
  ed.style.display = 'block';
  ed.style.left = (box.x * scale + stage.x()) + 'px';
  ed.style.top = (box.y * scale + stage.y()) + 'px';
  ed.style.width = Math.max(120, (box.width || 200) * scale) + 'px';
  ed.style.minHeight = Math.max(40, (box.height || 40) * scale) + 'px';
  ed.value = obj.text || '';
  ed.className = 'inline-editor' + (obj.type === 'sticky' ? ' sticky-edit' : '');
  ed.focus();
}

document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentTool = btn.dataset.tool;
  if (currentTool !== 'select' && transformer) transformer.nodes([]);
  renderAllObjects();
}));
document.querySelectorAll('.color-swatch').forEach(s => s.addEventListener('click', () => {
  document.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('active'));
  s.classList.add('active');
  currentColor = s.dataset.color;
}));
const sw = document.getElementById('stroke-width');
if (sw) sw.addEventListener('input', e => { strokeWidth = +e.target.value; });
document.getElementById('copy-link-btn').addEventListener('click', () => { navigator.clipboard.writeText(document.getElementById('share-link').value); showToast('Link copied'); });
document.getElementById('new-board-btn').addEventListener('click', () => { if (confirm('Start a new empty board?')) location.search = '?board=' + uuid().slice(0, 8); });
document.getElementById('clear-btn').addEventListener('click', () => {
  if (confirm('Clear all objects?')) {
    isLocalDrag = true;
    ydoc.transact(() => Array.from(yObjects.keys()).forEach(k => yObjects.delete(k)));
    isLocalDrag = false; transformer.nodes([]); renderAllObjects(); scheduleSave();
  }
});
document.getElementById('theme-btn').addEventListener('click', () => {
  theme = theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('cb_theme', theme); applyTheme(); renderAllObjects();
});
document.getElementById('templates-btn').addEventListener('click', () => {
  const grid = document.getElementById('tpl-grid');
  grid.innerHTML = Object.entries(TEMPLATES).map(([k, t]) =>
    '<div class="tpl-card" data-tpl="' + k + '"><h3>' + t.name + '</h3><p>' + t.desc + '</p></div>'
  ).join('');
  grid.querySelectorAll('.tpl-card').forEach(c => c.addEventListener('click', () => applyTemplate(c.dataset.tpl)));
  document.getElementById('template-modal').style.display = 'flex';
});
document.getElementById('tpl-cancel').addEventListener('click', () => { document.getElementById('template-modal').style.display = 'none'; });
document.getElementById('comment-send').addEventListener('click', postComment);
document.getElementById('comment-input').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(); } });
document.getElementById('inline-editor').addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.preventDefault(); closeEditor(false); }
  if (e.key === 'Enter' && !e.shiftKey && editingId) {
    const obj = yObjects && yObjects.get(editingId);
    if (obj && obj.type === 'text') { e.preventDefault(); closeEditor(true); }
  }
});
document.getElementById('inline-editor').addEventListener('blur', () => closeEditor(true));
document.getElementById('export-png-btn').addEventListener('click', () => {
  if (!stage) return;
  const uri = stage.toDataURL({ pixelRatio: 2 });
  const a = document.createElement('a'); a.href = uri; a.download = 'collabboard-' + boardId + '.png'; a.click();
});
document.getElementById('zoom-in').addEventListener('click', () => { const c = Math.min(5, stage.scaleX() * 1.2); stage.scale({ x: c, y: c }); stage.batchDraw(); document.getElementById('zoom-label').textContent = Math.round(c * 100) + '%'; });
document.getElementById('zoom-out').addEventListener('click', () => { const c = Math.max(0.1, stage.scaleX() / 1.2); stage.scale({ x: c, y: c }); stage.batchDraw(); document.getElementById('zoom-label').textContent = Math.round(c * 100) + '%'; });
document.getElementById('zoom-fit').addEventListener('click', () => { stage.scale({ x: 1, y: 1 }); stage.position({ x: 0, y: 0 }); stage.batchDraw(); document.getElementById('zoom-label').textContent = '100%'; });

window.addEventListener('keydown', e => {
  const tag = (e.target && e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); copySelection(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); pasteClipboard(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'a' && currentTool === 'select') {
    e.preventDefault();
    if (layer) { const nodes = layer.find('Line,Rect,Ellipse,Arrow,Text,Group').filter(n => n !== transformer); transformer.nodes(nodes); layer.batchDraw(); }
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && currentTool === 'select') { e.preventDefault(); deleteSelection(); }
});
window.addEventListener('beforeunload', () => saveBoardLocal());

document.getElementById('self-name').addEventListener('change', e => {
  userName = e.target.value.trim() || 'Anon';
  localStorage.setItem('cb_name', userName);
  updateSelfUI();
  if (awareness) awareness.setLocalStateField('user', { id: userId, name: userName, color: userColor });
});

document.getElementById('join-btn').addEventListener('click', () => {
  userName = document.getElementById('name-input').value.trim() || 'Anon';
  localStorage.setItem('cb_name', userName);
  updateSelfUI();
  const bid = document.getElementById('board-input').value.trim();
  document.getElementById('join-modal').style.display = 'none';
  initStage();
  initBoard(bid || boardId || undefined);
});

if (userName) {
  document.getElementById('name-input').value = userName;
}
const qBoard = new URLSearchParams(location.search).get('board');
if (qBoard && userName) {
  document.getElementById('join-modal').style.display = 'none';
  initStage();
  initBoard(qBoard);
}
