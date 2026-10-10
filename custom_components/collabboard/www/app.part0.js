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
{ id: 'o1', type: 'rect', x: 300, y: 70, width: 160, height: 60, fill: '#6366f1', stroke: '#6366f1', strokeWidth: 2, text: 'CEO / Director' },
{ id: 'o2', type: 'rect', x: 120, y: 180, width: 140, height: 50, fill: '#3b82f6', stroke: '#3b82f6', strokeWidth: 1, text: 'Engineering' },
{ id: 'o3', type: 'rect', x: 320, y: 180, width: 140, height: 50, fill: '#22c55e', stroke: '#22c55e', strokeWidth: 1, text: 'Product' },
{ id: 'o4', type: 'rect', x: 520, y: 180, width: 140, height: 50, fill: '#eab308', stroke: '#eab308', strokeWidth: 1, text: 'Ops' }
]},
kanban: { name: 'Kanban', desc: 'To do · Doing · Done', objects: [
{ id: 'k0', type: 'text', x: 40, y: 20, text: 'Kanban', fill: '#6366f1', width: 200 },
{ id: 'k1', type: 'rect', x: 40, y: 60, width: 180, height: 320, fill: '#3b82f6', stroke: '#3b82f6', strokeWidth: 1, text: 'To Do' },
{ id: 'k2', type: 'rect', x: 240, y: 60, width: 180, height: 320, fill: '#eab308', stroke: '#eab308', strokeWidth: 1, text: 'Doing' },
{ id: 'k3', type: 'rect', x: 440, y: 60, width: 180, height: 320, fill: '#22c55e', stroke: '#22c55e', strokeWidth: 1, text: 'Done' }
]}
};
function uuid() {
if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
const r = Math.random() * 16 | 0;
return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
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
function updateUndoButtons() {
const u = document.getElementById('undo-btn');
const r = document.getElementById('redo-btn');
if (!undoManager) return;
if (u) u.disabled = !undoManager.canUndo();
if (r) r.disabled = !undoManager.canRedo();
}
function doUndo() {
if (!undoManager || !undoManager.canUndo()) return;
isLocalDrag = true;
undoManager.undo();
isLocalDrag = false;
renderAllObjects();
updateUndoButtons();
scheduleSave();
showToast('Undo');
}
function doRedo() {
if (!undoManager || !undoManager.canRedo()) return;
isLocalDrag = true;
undoManager.redo();
isLocalDrag = false;
renderAllObjects();
updateUndoButtons();
scheduleSave();
showToast('Redo');
}
function updateUsersList() {
if (!awareness) return;
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
docum