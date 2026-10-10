import * as Y from 'https://cdn.jsdelivr.net/npm/yjs@13.6.18/+esm';
import { WebrtcProvider } from 'https://cdn.jsdelivr.net/npm/y-webrtc@10.3.0/+esm';
const TEMPLATES = {
blank: { name: 'Blank', desc: 'Empty canvas', objects: [] },
brainstorm: { name: 'Brainstorm', desc: 'Sticky ideas', objects: [
{ id: 't1', type: 'text', x: 40, y: 30, text: 'Brainstorm', fill: '#6366f1', width: 300 },
{ id: 's1', type: 'sticky', x: 40, y: 80, width: 160, height: 120, fill: '#eab308', text: 'Idea 1' },
{ id: 's2', type: 'sticky', x: 220, y: 80, width: 160, height: 120, fill: '#22c55e', text: 'Idea 2' },
{ id: 's3', type: 'sticky', x: 400, y: 80, width: 160, height: 120, fill: '#06b6d4', text: 'Idea 3' }
]},
kanban: { name: 'Kanban', desc: 'To Do / Doing / Done', objects: [
{ id: 'h1', type: 'text', x: 40, y: 20, text: 'To Do', fill: '#ef4444', width: 180 },
{ id: 'h2', type: 'text', x: 260, y: 20, text: 'Doing', fill: '#eab308', width: 180 },
{ id: 'h3', type: 'text', x: 480, y: 20, text: 'Done', fill: '#22c55e', width: 180 },
{ id: 'r1', type: 'rect', x: 30, y: 50, width: 200, height: 400, fill: '#ef4444', stroke: '#ef4444', text: '' },
{ id: 'r2', type: 'rect', x: 250, y: 50, width: 200, height: 400, fill: '#eab308', stroke: '#eab308', text: '' },
{ id: 'r3', type: 'rect', x: 470, y: 50, width: 200, height: 400, fill: '#22c55e', stroke: '#22c55e', text: '' }
]},
swot: { name: 'SWOT', desc: 'Strengths Weaknesses Opportunities Threats', objects: [
{ id: 't1', type: 'text', x: 40, y: 20, text: 'SWOT Analysis', fill: '#6366f1', width: 300 },
{ id: 'r1', type: 'rect', x: 30, y: 60, width: 280, height: 200, fill: '#22c55e', stroke: '#22c55e', text: 'Strengths' },
{ id: 'r2', type: 'rect', x: 330, y: 60, width: 280, height: 200, fill: '#ef4444', stroke: '#ef4444', text: 'Weaknesses' },
{ id: 'r3', type: 'rect', x: 30, y: 280, width: 280, height: 200, fill: '#06b6d4', stroke: '#06b6d4', text: 'Opportunities' },
{ id: 'r4', type: 'rect', x: 330, y: 280, width: 280, height: 200, fill: '#f97316', stroke: '#f97316', text: 'Threats' }
]},
orgchart: { name: 'Org Chart', desc: 'Simple hierarchy', objects: [
{ id: 'ceo', type: 'rect', x: 280, y: 40, width: 160, height: 60, fill: '#6366f1', stroke: '#6366f1', text: 'CEO' },
{ id: 'm1', type: 'rect', x: 80, y: 160, width: 140, height: 50, fill: '#8b5cf6', stroke: '#8b5cf6', text: 'Manager A' },
{ id: 'm2', type: 'rect', x: 300, y: 160, width: 140, height: 50, fill: '#8b5cf6', stroke: '#8b5cf6', text: 'Manager B' },
{ id: 'm3', type: 'rect', x: 520, y: 160, width: 140, height: 50, fill: '#8b5cf6', stroke: '#8b5cf6', text: 'Manager C' },
{ id: 'a1', type: 'arrow', x: 0, y: 0, points: [360, 100, 150, 160], stroke: '#94a3b8', strokeWidth: 2 },
{ id: 'a2', type: 'arrow', x: 0, y: 0, points: [360, 100, 370, 160], stroke: '#94a3b8', strokeWidth: 2 },
{ id: 'a3', type: 'arrow', x: 0, y: 0, points: [360, 100, 590, 160], stroke: '#94a3b8', strokeWidth: 2 }
]},
mindmap: { name: 'Mind Map', desc: 'Central topic + branches', objects: [
{ id: 'c', type: 'ellipse', x: 300, y: 200, width: 140, height: 80, fill: '#6366f1', stroke: '#6366f1', text: 'Topic' },
{ id: 'b1', type: 'ellipse', x: 80, y: 80, width: 120, height: 60, fill: '#22c55e', stroke: '#22c55e', text: 'Branch 1' },
{ id: 'b2', type: 'ellipse', x: 520, y: 80, width: 120, height: 60, fill: '#eab308', stroke: '#eab308', text: 'Branch 2' },
{ id: 'b3', type: 'ellipse', x: 80, y: 320, width: 120, height: 60, fill: '#ec4899', stroke: '#ec4899', text: 'Branch 3' },
{ id: 'b4', type: 'ellipse', x: 520, y: 320, width: 120, height: 60, fill: '#06b6d4', stroke: '#06b6d4', text: 'Branch 4' }
]}
};
function uuid() {
if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
const r = Math.random() * 16 | 0;
const v = c === 'x' ? r : (r & 0x3 | 0x8);
return v.toString(16);
});
}
const COLORS = ['#6366f1','#ef4444','#22c55e','#eab308','#f97316','#ec4899','#06b6d4','#8b5cf6'];
let userId = localStorage.getItem('cb_uid') || uuid(); localStorage.setItem('cb_uid', userId);
let userName = localStorage.getItem('cb_name') || '';
let userColor = localStorage.getItem('cb_color') || COLORS[Math.floor(Math.random()*COLORS.length)]; localStorage.setItem('cb_color', userColor);
let boardId = new URLSearchParams(location.search).get('board') || '';
let currentTool = 'select', currentColor = '#6366f1', strokeWidth = 3;
let ydoc, yObjects, yComments, provider, awareness, stage, layer, transformer, undoManager;
let saveTimer = null, isRestoring = false, isLocalDrag = false, clipboard = [];
let theme = localStorage.getItem('cb_theme') || 'dark';
let isDrawing = false, drawingId = null, startPos = null, editingId = null;
let ctxTargetIds = [];
let editorTextColor = null;
function applyTheme() {
document.documentElement.classList.toggle('light', theme === 'light');
const b = document.getElementById('theme-btn');
if (b) b.textContent = theme === 'light' ? 'Switch to Dark' : 'Switch to Light';
}
applyTheme();
function showToast(m, ms = 2200) {
const t = document.getElementById('toast');
if (!t) return;
t.textContent = m; t.classList.add('show');
setTimeout(() => t.classList.remove('show'), ms);
}
function storageKey() { return 'cb_board_' + boardId; }
function commentsKey() { return 'cb_comments_' + boardId; }
function scheduleSave() {
clearTimeout(saveTimer);
saveTimer = setTimeout(saveBoardLocal, 400);
}
function saveBoardLocal() {
if (!yObjects || !boardId) return;
try {
const objs = {};
yObjects.forEach((v, k) => { objs[k] = v; });
localStorage.setItem(storageKey(), JSON.stringify(objs));
if (yComments) localStorage.setItem(commentsKey(), JSON.stringify(yComments.toArray()));
} catch (e) {}
}
function loadBoardLocal() {
if (!boardId) return;
try {
const raw = localStorage.getItem(storageKey());
if (raw) {
const objs = JSON.parse(raw);
isRestoring = true;
ydoc.transact(() => {
Object.entries(objs).forEach(([id, o]) => yObjects.set(id, o));
});
isRestoring = false;
}
const cRaw = localStorage.getItem(commentsKey());
if (cRaw && yComments) {
const arr = JSON.parse(cRaw);
if (Array.isArray(arr) && arr.length) {
isRestoring = true;
ydoc.transact(() => { arr.forEach(c => yComments.push([c])); });
isRestoring = false;
}
}
} catch (e) {}
}
function createObject(type, props) {
const id = uuid();
const obj = { type, ...props };
ydoc.transact(() => yObjects.set(id, obj));
scheduleSave();
return id;
}
function updateObject(id, patch) {
const o = yObjects.get(id);
if (!o) return;
ydoc.transact(() => yObjects.set(id, { ...o, ...patch }));
scheduleSave();
}
function getSelectedIds() {
if (!transformer) return [];
return transformer.nodes().map(n => n.id()).filter(Boolean);
}
function textFillForBg(fill) {
if (!fill) return '#e8eaed';
const hex = (fill + '').replace('#', '');
if (hex.length < 6) return '#1a1d24';
const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
return lum > 0.55 ? '#1a1d24' : '#e8eaed';
}
function shapeTextColor(obj) {
if (obj.textColor) return obj.textColor;
if (obj.type === 'sticky') return '#1a1d24';
return textFillForBg(obj.fill);
}
function applyTextColorToSelection(color) {
const ids = (ctxTargetIds && ctxTargetIds.length) ? ctxTargetIds : getSelectedIds();
if (!ids.length || !yObjects) { showToast('Select a shape first'); return; }
isLocalDrag = true;
ydoc.transact(() => {
ids.forEach(id => {
const o = yObjects.get(id);
if (!o) return;
if (o.type === 'text') yObjects.set(id, { ...o, fill: color });
else if (['rect', 'ellipse', 'sticky'].includes(o.type)) yObjects.set(id, { ...o, textColor: color });
});
});
isLocalDrag = false;
renderAllObjects();
scheduleSave();
showToast('Text color set');
}
function renderAllObjects() {
if (!layer || !yObjects) return;
const selectedIds = transformer ? transformer.nodes().map(n => n.id()).filter(Boolean) : [];
transformer.nodes([]);
layer.find('Line, Rect, Ellipse, Arrow, Text, Group').forEach(n => { if (n !== transformer) n.destroy(); });
Array.from(yObjects.entries()).forEach(([id, obj]) => {
let node;
if (obj.type === 'pen' && obj.points) {
node = new Konva.Line({ id, points: obj.points, stroke: obj.stroke, strokeWidth: obj.strokeWidth || 3, lineCap: 'round', lineJoin: 'round', tension: 0.4, draggable: currentTool === 'select' });
} else if (obj.type === 'rect') {
const g = new Konva.Group({ id, x: obj.x, y: obj.y, draggable: currentTool === 'select' });
const w = obj.width || 100, h = obj.height || 60;
g.add(new Konva.Rect({ width: w, height: h, fill: (obj.fill || '#6366f1') + '33', stroke: obj.stroke || obj.fill || '#6366f1', strokeWidth: obj.strokeWidth || 2, cornerRadius: 4 }));
if (obj.text) {
g.add(new Konva.Text({ text: obj.text, fontSize: 14, fontFamily: 'Inter', fill: shapeTextColor(obj), width: Math.max(20, w - 12), padding: 6, align: 'center', verticalAlign: 'middle', height: Math.max(20, h - 4) }));
}
node = g;
} else if (obj.type === 'ellipse') {
const g = new Konva.Group({ id, x: obj.x, y: obj.y, draggable: currentTool === 'select' });
const w = obj.width || 100, h = obj.height || 60;
g.add(new Konva.Ellipse({ x: w / 2, y: h / 2, radiusX: Math.abs(w / 2), radiusY: Math.abs(h / 2), fill: (obj.fill || '#6366f1') + '33', stroke: obj.stroke || obj.fill || '#6366f1', strokeWidth: obj.strokeWidth || 2 }));
if (obj.text) {
g.add(new Konva.Text({ text: obj.text, fontSize: 14, fontFamily: 'Inter', fill: shapeTextColor(obj), width: Math.max(20, w - 16), x: 8, y: h / 2 - 10, align: 'center' }));
}
node = g;
} else if (obj.type === 'line' || obj.type === 'arrow') {
node = new Konva.Arrow({ id, points: obj.points || [obj.x, obj.y, obj.x + (obj.width || 0), obj.y + (obj.height || 0)], stroke: obj.stroke || '#6366f1', strokeWidth: obj.strokeWidth || 3, fill: obj.stroke || '#6366f1', pointerLength: obj.type === 'arrow' ? 12 : 0, pointerWidth: obj.type === 'arrow' ? 10 : 0, draggable: currentTool === 'select' });
} else if (obj.type === 'text') {
node = new Konva.Text({ id, x: obj.x, y: obj.y, text: obj.text || 'Text', fontSize: obj.fontSize || 18, fontFamily: 'Inter', fill: obj.fill || (theme === 'light' ? '#1a1d24' : '#e8eaed'), draggable: currentTool === 'select', width: obj.width || 200 });
} else if (obj.type === 'sticky') {
const g = new Konva.Group({ id, x: obj.x, y: obj.y, draggable: currentTool === 'select' });
g.add(new Konva.Rect({ width: obj.width || 160, height: obj.height || 140, fill: obj.fill || '#eab308', shadowColor: 'black', shadowBlur: 6, shadowOpacity: 0.2, cornerRadius: 2 }));
g.add(new Konva.Text({ text: obj.text || 'Sticky', fontSize: 15, fontFamily: 'Caveat', fill: shapeTextColor(obj), width: (obj.width || 160) - 14, padding: 8 }));
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
if (obj.type === 'text' || obj.type === 'sticky' || obj.type === 'rect' || obj.type === 'ellipse') {
node.on('dblclick dbltap', () => openEditor(id));
}
node.on('dragstart', () => { isLocalDrag = true; hideContextMenu(); });
node.on('dragend', () => { syncNodeToY(node, id, obj.type); isLocalDrag = false; scheduleSave(); });
node.on('transformend', () => { syncNodeToY(node, id, obj.type); isLocalDrag = false; scheduleSave(); });
layer.add(node);
}
});
if (selectedIds.length) {
const nodes = selectedIds.map(id => layer.findOne('#' + id)).filter(Boolean);
transformer.nodes(nodes);
}
layer.batchDraw();
}
function syncNodeToY(node, id, type) {
if (!node || !yObjects) return;
const o = yObjects.get(id);
if (!o) return;
const patch = { x: node.x(), y: node.y() };
if (type === 'rect' || type === 'ellipse' || type === 'sticky') {
const shape = node.findOne('Rect') || node.findOne('Ellipse');
if (shape) {
if (type === 'ellipse') {
patch.width = (shape.radiusX() || 50) * 2;
patch.height = (shape.radiusY() || 30) * 2;
} else {
patch.width = shape.width();
patch.height = shape.height();
}
}
} else if (type === 'text') {
patch.width = node.width();
} else if (type === 'line' || type === 'arrow' || type === 'pen') {
patch.points = node.points();
}
const scaleX = node.scaleX(), scaleY = node.scaleY();
if (scaleX !== 1 || scaleY !== 1) {
if (patch.width) patch.width *= scaleX;
if (patch.height) patch.height *= scaleY;
node.scale({ x: 1, y: 1 });
}
updateObject(id, patch);
}
function getPointerPos() {
if (!stage) return null;
const p = stage.getPointerPosition();
if (!p) return null;
const scale = stage.scaleX();
return { x: (p.x - stage.x()) / scale, y: (p.y - stage.y()) / scale };
}
function doUndo() { if (undoManager) undoManager.undo(); }
function doRedo() { if (undoManager) undoManager.redo(); }
function copySelection() {
const ids = getSelectedIds();
if (!ids.length) return;
clipboard = ids.map(id => ({ ...yObjects.get(id) })).filter(Boolean);
showToast('Copied ' + clipboard.length);
}
function pasteClipboard() {
if (!clipboard.length) return;
const offset = 30;
isLocalDrag = true;
ydoc.transact(() => {
clipboard.forEach(o => {
const id = uuid();
const copy = { ...o, x: (o.x || 0) + offset, y: (o.y || 0) + offset };
if (copy.points) copy.points = copy.points.map((v, i) => i % 2 === 0 ? v + offset : v + offset);
yObjects.set(id, copy);
});
});
isLocalDrag = false;
renderAllObjects();
scheduleSave();
showToast('Pasted');
}
function duplicateSelection() { copySelection(); pasteClipboard(); }
function deleteSelection() {
const ids = getSelectedIds();
if (!ids.length) return;
isLocalDrag = true;
ydoc.transact(() => ids.forEach(id => yObjects.delete(id)));
isLocalDrag = false;
transformer.nodes([]);
renderAllObjects();
scheduleSave();
}
function bringToFront() {
const ids = getSelectedIds();
if (!ids.length) return;
isLocalDrag = true;
ydoc.transact(() => {
ids.forEach(id => {
const o = yObjects.get(id);
if (o) { yObjects.delete(id); yObjects.set(id, o); }
});
});
isLocalDrag = false;
renderAllObjects();
scheduleSave();
}
function sendToBack() {
const ids = getSelectedIds();
if (!ids.length) return;
isLocalDrag = true;
const all = Array.from(yObjects.entries());
ydoc.transact(() => {
ids.forEach(id => yObjects.delete(id));
ids.forEach(id => {
const found = all.find(([k]) => k === id);
if (found) yObjects.set(found[0], found[1]);
});
all.filter(([k]) => !ids.includes(k)).forEach(([k, v]) => yObjects.set(k, v));
});
isLocalDrag = false;
renderAllObjects();
scheduleSave();
}
function showContextMenu(x, y, ids) {
const menu = document.getElementById('ctx-menu');
if (!menu) return;
ctxTargetIds = ids || [];
const hasSel = ctxTargetIds.length > 0;
const first = hasSel ? yObjects.get(ctxTargetIds[0]) : null;
const canEdit = first && ['text', 'sticky', 'rect', 'ellipse'].includes(first.type);
['edit','copy','duplicate','delete','bring-front','send-back','paste'].forEach(act => {
const el = menu.querySelector('[data-act="' + act + '"]');
if (el) el.style.display = (act === 'paste' ? (clipboard && clipboard.length) : (act === 'edit' ? canEdit : hasSel)) ? '' : 'none';
});
const colorBlock = document.getElementById('ctx-text-colors');
const colorLabel = document.getElementById('ctx-text-color-label');
const toolbarColorBtn = menu.querySelector('[data-act="apply-toolbar-text-color"]');
const showColor = canEdit;
if (colorBlock) colorBlock.style.display = showColor ? '' : 'none';
if (colorLabel) colorLabel.style.display = showColor ? '' : 'none';
if (toolbarColorBtn) toolbarColorBtn.style.display = showColor ? '' : 'none';
if (showColor && colorBlock) {
const cur = (first && (first.textColor || (first.type === 'text' ? first.fill : null))) || currentColor;
colorBlock.querySelectorAll('.ctx-color').forEach(b => b.classList.toggle('active', b.dataset.textColor === cur));
}
menu.style.left = Math.min(x, window.innerWidth - 200) + 'px';
menu.style.top = Math.min(y, window.innerHeight - 320) + 'px';
menu.classList.add('show');
}
function hideContextMenu() {
const menu = document.getElementById('ctx-menu');
if (menu) menu.classList.remove('show');
ctxTargetIds = [];
}
function onPointerDown(e) {
hideContextMenu();
if (currentTool === 'pan' || e.evt.button === 1) return;
if (e.evt.button === 2) return;
const pos = getPointerPos();
if (!pos) return;
if (currentTool === 'select') { if (e.target === stage) transformer.nodes([]); return; }
if (currentTool === 'eraser') return;
isDrawing = true; startPos = pos;
if (currentTool === 'pen') drawingId = createObject('pen', { points: [pos.x, pos.y], stroke: currentColor, strokeWidth });
else if (['rect', 'ellipse', 'line', 'arrow'].includes(currentTool)) drawingId = createObject(currentTool, { x: pos.x, y: pos.y, width: 0, height: 0, points: [pos.x, pos.y, pos.x, pos.y], fill: currentColor, stroke: currentColor, strokeWidth, text: '' });
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
function onPointerUp() {
const finishedId = drawingId;
const tool = currentTool;
isDrawing = false; drawingId = null; startPos = null;
if (finishedId && (tool === 'rect' || tool === 'ellipse')) {
const obj = yObjects.get(finishedId);
if (obj && Math.abs(obj.width || 0) > 20 && Math.abs(obj.height || 0) > 20) {
setTimeout(() => openEditor(finishedId), 80);
}
}
}
function closeEditor(save) {
const wrap = document.getElementById('editor-wrap');
if (!wrap || (!wrap.classList.contains('show') && wrap.style.display === 'none')) return;
if (save && editingId && yObjects) {
const obj = yObjects.get(editingId);
if (obj) {
const ed = document.getElementById('inline-editor');
const color = editorTextColor || currentColor;
const patch = { text: ed ? ed.value : '' };
if (['rect', 'ellipse', 'sticky'].includes(obj.type)) patch.textColor = color;
if (obj.type === 'text') patch.fill = color;
updateObject(editingId, patch);
}
}
wrap.classList.remove('show');
wrap.style.display = 'none';
editingId = null;
editorTextColor = null;
}
function setEditorColorUI(color) {
editorTextColor = color;
const bar = document.getElementById('editor-colors');
if (bar) bar.querySelectorAll('.ed-color').forEach(b => b.classList.toggle('active', b.dataset.edColor === color));
const picker = document.getElementById('ed-color-picker');
if (picker && color && color.startsWith('#')) picker.value = color.length === 7 ? color : '#e8eaed';
}
function openEditor(id) {
const obj = yObjects.get(id); if (!obj) return;
const node = layer.findOne('#' + id); if (!node) return;
editingId = id;
const wrap = document.getElementById('editor-wrap');
const ed = document.getElementById('inline-editor');
if (!wrap || !ed) return;
const box = node.getClientRect({ relativeTo: stage });
const scale = stage.scaleX();
wrap.classList.add('show');
wrap.style.display = 'flex';
wrap.style.left = (box.x * scale + stage.x()) + 'px';
wrap.style.top = (box.y * scale + stage.y()) + 'px';
ed.style.width = Math.max(120, (box.width || 200) * scale) + 'px';
ed.style.minHeight = Math.max(40, (box.height || 40) * scale) + 'px';
ed.value = obj.text || '';
ed.className = 'inline-editor' + (obj.type === 'sticky' ? ' sticky-edit' : '');
const curColor = obj.textColor || (obj.type === 'text' ? obj.fill : null) || currentColor;
setEditorColorUI(curColor);
ed.focus();
ed.select();
}
function initStage() {
const container = document.getElementById('stage-container');
if (!container) throw new Error('stage-container missing');
stage = new Konva.Stage({ container: 'stage-container', width: container.clientWidth || 800, height: container.clientHeight || 600 });
layer = new Konva.Layer();
stage.add(layer);
transformer = new Konva.Transformer({ rotateEnabled: true, borderStroke: '#6366f1', anchorStroke: '#6366f1', anchorSize: 8, padding: 4 });
layer.add(transformer);
stage.on('mousedown touchstart', onPointerDown);
stage.on('mousemove touchmove', onPointerMove);
stage.on('mouseup touchend', onPointerUp);
stage.on('contextmenu', e => {
e.evt.preventDefault();
const pos = stage.getPointerPosition();
showContextMenu(pos.x, pos.y, getSelectedIds());
});
stage.on('wheel', e => {
e.evt.preventDefault();
const old = stage.scaleX();
const pointer = stage.getPointerPosition();
const mousePointTo = { x: (pointer.x - stage.x()) / old, y: (pointer.y - stage.y()) / old };
const direction = e.evt.deltaY > 0 ? -1 : 1;
const newScale = Math.max(0.1, Math.min(5, old * (1 + direction * 0.1)));
stage.scale({ x: newScale, y: newScale });
stage.position({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
stage.batchDraw();
const zl = document.getElementById('zoom-label');
if (zl) zl.textContent = Math.round(newScale * 100) + '%';
});
window.addEventListener('resize', () => {
if (stage && container) {
stage.width(container.clientWidth);
stage.height(container.clientHeight);
stage.batchDraw();
}
});
}
function initBoard(bid) {
boardId = bid || uuid().slice(0, 8);
if (!location.search.includes('board=')) {
history.replaceState(null, '', '?board=' + boardId);
}
const _bid = document.getElementById('board-id-display') || document.getElementById('board-id-label');
if (_bid) _bid.textContent = boardId;
const sl = document.getElementById('share-link');
if (sl) sl.value = location.href;
ydoc = new Y.Doc();
yObjects = ydoc.getMap('objects');
yComments = ydoc.getArray('comments');
undoManager = new Y.UndoManager([yObjects, yComments]);
provider = new WebrtcProvider('collabboard-' + boardId, ydoc, { signaling: ['wss://signaling.yjs.dev'] });
awareness = provider.awareness;
awareness.setLocalStateField('user', { id: userId, name: userName || 'Anon', color: userColor });
awareness.on('change', updateUsersUI);
updateUsersUI();
updateSelfUI();
yObjects.observe(() => { if (!isLocalDrag && !isRestoring) renderAllObjects(); });
yComments.observe(() => { if (!isRestoring) renderComments(); });
loadBoardLocal();
renderAllObjects();
renderComments();
showToast('Board: ' + boardId);
}
function updateUsersUI() {
if (!awareness) return;
const states = Array.from(awareness.getStates().values());
const list = document.getElementById('users-list');
const others = states.filter(s => s.user && s.user.id !== userId);
const uc = document.getElementById('user-count');
if (uc) uc.textContent = '(' + (others.length + 1) + ')';
if (list) list.innerHTML = others.map(s => {
const u = s.user;
return '<div class="user-item"><div class="status-dot"></div><div class="avatar" style="background:' + u.color + ';width:18px;height:18px;font-size:9px">' + (u.name||'?')[0] + '</div>' + (u.name||'Anon') + '</div>';
}).join('') || '<div class="empty-comments">Only you</div>';
}
function updateSelfUI() {
const sn = document.getElementById('self-name');
if (sn) sn.value = userName;
const a = document.getElementById('self-avatar');
if (a) { a.textContent = (userName || 'A')[0].toUpperCase(); a.style.background = userColor; }
}
function renderComments() {
const list = document.getElementById('comments-list');
if (!list) return;
const arr = yComments ? yComments.toArray() : [];
const cc = document.getElementById('comment-count');
if (cc) cc.textContent = '(' + arr.length + ')';
list.innerHTML = arr.map(c => {
const time = new Date(c.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
return '<div class="comment-item"><div class="comment-meta"><span class="comment-user" style="color:' + c.color + '">' + (c.user||'') + '</span><span class="comment-time">' + time + '</span></div><div class="comment-text">' + (c.text||'').replace(/</g,'<') + '</div></div>';
}).join('') || '<div class="empty-comments">No comments yet</div>';
list.scrollTop = list.scrollHeight;
}
function postComment() {
const input = document.getElementById('comment-input');
const text = (input && input.value || '').trim();
if (!text || !yComments) return;
yComments.push([{ id: uuid(), user: userName || 'Anon', color: userColor, text, ts: Date.now() }]);
if (input) input.value = '';
renderComments();
scheduleSave();
}
// Event listeners
document.getElementById('join-btn').addEventListener('click', () => {
try {
userName = (document.getElementById('name-input').value || '').trim() || 'Anon';
localStorage.setItem('cb_name', userName);
try { updateSelfUI(); } catch (_) {}
const bid = (document.getElementById('board-input').value || '').trim();
document.getElementById('join-modal').style.display = 'none';
initStage();
initBoard(bid || boardId || undefined);
} catch (err) {
console.error('Join failed', err);
alert('Join failed: ' + (err && err.message ? err.message : err));
}
});
if (userName) {
const ni = document.getElementById('name-input');
if (ni) ni.value = userName;
}
const qBoard = new URLSearchParams(location.search).get('board');
if (qBoard && userName) {
document.getElementById('join-modal').style.display = 'none';
initStage();
initBoard(qBoard);
}
document.getElementById('ctx-menu').addEventListener('click', e => {
const btn = e.target.closest('[data-act]');
if (!btn) return;
const act = btn.dataset.act;
if (ctxTargetIds.length && transformer) {
const nodes = ctxTargetIds.map(id => layer.findOne('#' + id)).filter(Boolean);
if (nodes.length) transformer.nodes(nodes);
}
hideContextMenu();
if (act === 'edit' && ctxTargetIds[0]) openEditor(ctxTargetIds[0]);
else if (act === 'copy') copySelection();
else if (act === 'duplicate') duplicateSelection();
else if (act === 'paste') pasteClipboard();
else if (act === 'delete') deleteSelection();
else if (act === 'bring-front') bringToFront();
else if (act === 'send-back') sendToBack();
else if (act === 'apply-toolbar-text-color') applyTextColorToSelection(currentColor);
});
const ctxColorsEl = document.getElementById('ctx-text-colors');
if (ctxColorsEl) {
ctxColorsEl.addEventListener('click', e => {
const b = e.target.closest('[data-text-color]');
if (!b) return;
e.stopPropagation();
applyTextColorToSelection(b.dataset.textColor);
hideContextMenu();
});
}
document.addEventListener('click', e => {
if (!e.target.closest('#ctx-menu')) hideContextMenu();
});
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
const themeBtn = document.getElementById('theme-btn');
if (themeBtn) themeBtn.addEventListener('click', () => {
theme = theme === 'dark' ? 'light' : 'dark';
localStorage.setItem('cb_theme', theme);
applyTheme();
renderAllObjects();
});
const undoBtn = document.getElementById('undo-btn');
if (undoBtn) undoBtn.addEventListener('click', doUndo);
const redoBtn = document.getElementById('redo-btn');
if (redoBtn) redoBtn.addEventListener('click', doRedo);
const tplBtn = document.getElementById('templates-btn') || document.getElementById('template-btn') || document.getElementById('tpl-btn');
if (tplBtn) tplBtn.addEventListener('click', () => {
const grid = document.getElementById('tpl-grid');
if (!grid) return;
grid.innerHTML = Object.entries(TEMPLATES).map(([k, t]) =>
'<div class="tpl-card" data-tpl="' + k + '"><h3>' + t.name + '</h3><p>' + t.desc + '</p></div>'
).join('');
document.getElementById('template-modal').style.display = 'flex';
grid.querySelectorAll('.tpl-card').forEach(card => {
card.onclick = () => {
const tpl = TEMPLATES[card.dataset.tpl];
if (!tpl || !yObjects) return;
isLocalDrag = true;
ydoc.transact(() => {
Array.from(yObjects.keys()).forEach(id => yObjects.delete(id));
tpl.objects.forEach(o => {
const id = o.id || uuid();
const copy = { ...o };
delete copy.id;
yObjects.set(id, copy);
});
});
isLocalDrag = false;
renderAllObjects();
scheduleSave();
document.getElementById('template-modal').style.display = 'none';
showToast('Template: ' + tpl.name);
};
});
});
const tplCancel = document.getElementById('tpl-cancel');
if (tplCancel) tplCancel.addEventListener('click', () => { document.getElementById('template-modal').style.display = 'none'; });
const commentSend = document.getElementById('comment-send');
if (commentSend) commentSend.addEventListener('click', postComment);
const commentInput = document.getElementById('comment-input');
if (commentInput) commentInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(); } });
const inlineEd = document.getElementById('inline-editor');
if (inlineEd) {
inlineEd.addEventListener('keydown', e => {
if (e.key === 'Escape') { e.preventDefault(); closeEditor(false); }
if (e.key === 'Enter' && !e.shiftKey && editingId) {
const obj = yObjects && yObjects.get(editingId);
if (obj && (obj.type === 'text' || obj.type === 'rect' || obj.type === 'ellipse')) { e.preventDefault(); closeEditor(true); }
}
});
inlineEd.addEventListener('blur', e => {
const related = e.relatedTarget;
if (related && related.closest && related.closest('#editor-wrap')) return;
setTimeout(() => {
const active = document.activeElement;
if (active && active.closest && active.closest('#editor-wrap')) return;
closeEditor(true);
}, 150);
});
}
const edColors = document.getElementById('editor-colors');
if (edColors) {
edColors.addEventListener('mousedown', e => e.preventDefault());
edColors.addEventListener('click', e => {
const b = e.target.closest('[data-ed-color]');
if (!b) return;
e.preventDefault();
setEditorColorUI(b.dataset.edColor);
});
}
const edPicker = document.getElementById('ed-color-picker');
if (edPicker) {
edPicker.addEventListener('mousedown', e => e.preventDefault());
edPicker.addEventListener('input', () => setEditorColorUI(edPicker.value));
edPicker.addEventListener('change', () => setEditorColorUI(edPicker.value));
}
const exportBtn = document.getElementById('export-png-btn');
if (exportBtn) exportBtn.addEventListener('click', () => {
if (!stage) return;
const uri = stage.toDataURL({ pixelRatio: 2 });
const a = document.createElement('a'); a.href = uri; a.download = 'collabboard-' + boardId + '.png'; a.click();
});
const zoomIn = document.getElementById('zoom-in');
if (zoomIn) zoomIn.addEventListener('click', () => { if (!stage) return; const c = Math.min(5, stage.scaleX() * 1.2); stage.scale({ x: c, y: c }); stage.batchDraw(); document.getElementById('zoom-label').textContent = Math.round(c * 100) + '%'; });
const zoomOut = document.getElementById('zoom-out');
if (zoomOut) zoomOut.addEventListener('click', () => { if (!stage) return; const c = Math.max(0.1, stage.scaleX() / 1.2); stage.scale({ x: c, y: c }); stage.batchDraw(); document.getElementById('zoom-label').textContent = Math.round(c * 100) + '%'; });
const zoomFit = document.getElementById('zoom-fit');
if (zoomFit) zoomFit.addEventListener('click', () => { if (!stage) return; stage.scale({ x: 1, y: 1 }); stage.position({ x: 0, y: 0 }); stage.batchDraw(); document.getElementById('zoom-label').textContent = '100%'; });
window.addEventListener('keydown', e => {
const tag = (e.target && e.target.tagName || '').toLowerCase();
if (tag === 'input' || tag === 'textarea') return;
if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); doUndo(); }
if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); doRedo(); }
if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); copySelection(); }
if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); pasteClipboard(); }
if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); duplicateSelection(); }
if ((e.key === 'Delete' || e.key === 'Backspace') && currentTool === 'select') { e.preventDefault(); deleteSelection(); }
});
window.addEventListener('beforeunload', () => saveBoardLocal());
const selfName = document.getElementById('self-name');
if (selfName) selfName.addEventListener('change', e => {
userName = e.target.value.trim() || 'Anon';
localStorage.setItem('cb_name', userName);
updateSelfUI();
if (awareness) awareness.setLocalStateField('user', { id: userId, name: userName, color: userColor });
});
const copyLink = document.getElementById('copy-link-btn');
if (copyLink) copyLink.addEventListener('click', () => {
const sl = document.getElementById('share-link');
if (sl && sl.value) { navigator.clipboard.writeText(sl.value); showToast('Link copied'); }
});
