import * as Y from 'https://cdn.jsdelivr.net/npm/yjs@13.6.18/+esm';
import { WebrtcProvider } from 'https://cdn.jsdelivr.net/npm/y-webrtc@10.3.0/+esm';
const TEMPLATES = {
blank: { name: 'Blank', desc: 'Empty canvas', objects: [] },
brainstorm: { name: 'Brainstorm', desc: 'Sticky ideas', objects: [
{ id: 't1', type: 'text', x: 40, y: 30, text: 'Brainstorm', fill: '#6366f1', width: 300 },
{ id: 's1', type: 'sticky', x: 40, y: 80, width: 160, height: 120, fill: '#eab308', text: 'Idea 1' },
{ id: 's2', type: 'sticky', x: 220, y: 80, width: 160, height: 120, fill: '#22c55e', text: 'Idea 2' },
{ id: 's3', type: 'sticky', x: 400, y: 80, width: 160, height: 120, fill: '#ec4899', text: 'Idea 3' }
]},
kanban: { name: 'Kanban', desc: 'To do / Doing / Done', objects: [
{ id: 'k1', type: 'text', x: 40, y: 20, text: 'To Do', fill: '#ef4444', width: 160 },
{ id: 'k2', type: 'text', x: 240, y: 20, text: 'Doing', fill: '#eab308', width: 160 },
{ id: 'k3', type: 'text', x: 440, y: 20, text: 'Done', fill: '#22c55e', width: 160 },
{ id: 'kb1', type: 'rect', x: 30, y: 50, width: 180, height: 400, fill: '#ef4444', text: '' },
{ id: 'kb2', type: 'rect', x: 230, y: 50, width: 180, height: 400, fill: '#eab308', text: '' },
{ id: 'kb3', type: 'rect', x: 430, y: 50, width: 180, height: 400, fill: '#22c55e', text: '' }
]},
orgchart: { name: 'Org Chart', desc: 'Hierarchy boxes', objects: [
{ id: 'o1', type: 'rect', x: 280, y: 30, width: 160, height: 60, fill: '#6366f1', text: 'CEO' },
{ id: 'o2', type: 'rect', x: 80, y: 140, width: 140, height: 50, fill: '#06b6d4', text: 'Eng' },
{ id: 'o3', type: 'rect', x: 280, y: 140, width: 140, height: 50, fill: '#06b6d4', text: 'Product' },
{ id: 'o4', type: 'rect', x: 480, y: 140, width: 140, height: 50, fill: '#06b6d4', text: 'Sales' },
{ id: 'ol1', type: 'line', x: 360, y: 90, width: 0, height: 50, points: [360, 90, 360, 140], stroke: '#9aa0a6' },
{ id: 'ol2', type: 'line', x: 150, y: 140, width: 420, height: 0, points: [150, 140, 550, 140], stroke: '#9aa0a6' }
]},
meeting: { name: 'Meeting Notes', desc: 'Agenda + actions', objects: [
{ id: 'm1', type: 'text', x: 40, y: 20, text: 'Meeting Notes', fill: '#6366f1', width: 300 },
{ id: 'm2', type: 'sticky', x: 40, y: 70, width: 200, height: 160, fill: '#eab308', text: 'Agenda\n- Item 1\n- Item 2' },
{ id: 'm3', type: 'sticky', x: 260, y: 70, width: 200, height: 160, fill: '#22c55e', text: 'Action items\n- Owner: task' }
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
let editorTextColor = null;
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
