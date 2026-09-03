const levels = [
  { name: 'The Entrance', detail: '05 ROOMS / 03 CLUES', rooms: 5, clues: 3, suspects: 1 },
  { name: 'The Investigation', detail: '10 ROOMS / 05 CLUES', rooms: 10, clues: 5, suspects: 3 },
  { name: 'The Hidden Floor', detail: '15 ROOMS / PUZZLES', rooms: 15, clues: 7, suspects: 4 },
  { name: 'The Final Mystery', detail: '20 ROOMS / 05 SUSPECTS', rooms: 20, clues: 9, suspects: 5 }
];
const rooms = [
  { id: 'hall', name: 'The Entrance Hall', x: .17, y: .51, clue: 'A muddy footprint points east.', kind: 'start' },
  { id: 'study', name: 'The Study', x: .38, y: .22, clue: 'A torn letter: “Meet me below.”' },
  { id: 'gallery', name: 'Portrait Gallery', x: .63, y: .20, clue: 'One portrait has fresh paint.' },
  { id: 'dining', name: 'Dining Room', x: .40, y: .76, clue: 'The silver clock stopped at 11:17.' },
  { id: 'basement', name: 'The Basement', x: .76, y: .55, clue: 'Hidden evidence: a blackwood button.' }
];
const links = [['hall','study'], ['hall','dining'], ['study','gallery'], ['dining','basement'], ['gallery','basement']];
const state = { level: 0, current: 'hall', found: [], seconds: 402, algorithm: 'BFS', traceTimer: null, sound: true };
const $ = (selector) => document.querySelector(selector);
const canvas = $('#mansionCanvas');
const ctx = canvas.getContext('2d');
const extraNames = ['Library', 'Conservatory', 'Servants\' Quarters', 'West Stair', 'Music Room', 'Winter Garden', 'Observatory', 'Wine Cellar', 'Boiler Room', 'Hidden Archive', 'Red Corridor', 'Chapel', 'Clock Tower', 'East Stair', 'The Vault'];
function activeRooms() {
  const count = levels[state.level].rooms;
  return rooms.concat(extraNames.slice(0, count - rooms.length).map((name, index) => ({ id: `extra-${index}`, name, x: .5 + .38 * Math.cos(index * 2.4), y: .5 + .36 * Math.sin(index * 2.4), clue: `A detail in the ${name.toLowerCase()} shifts the case.` })));
}
function activeLinks() {
  const visible = activeRooms();
  return links.concat(visible.slice(5).map((room, index) => [visible[index === 0 ? 4 : index + 4].id, room.id]));
}

function drawMansion() {
  const width = canvas.clientWidth, height = canvas.clientHeight, ratio = window.devicePixelRatio || 1;
  if (canvas.width !== width * ratio || canvas.height !== height * ratio) { canvas.width = width * ratio; canvas.height = height * ratio; }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#e8e1d4'; ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#d2cabc'; ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  for (let y = 0; y < height; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  const point = room => ({ x: room.x * width, y: room.y * height });
  const visibleRooms = activeRooms();
  activeLinks().forEach(([a, b]) => { const from = point(visibleRooms.find(room => room.id === a)), to = point(visibleRooms.find(room => room.id === b)); ctx.strokeStyle = '#879099'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); ctx.setLineDash([]); });
  visibleRooms.forEach(room => { const { x, y } = point(room); const isCurrent = room.id === state.current; const isFound = state.found.includes(room.id); const radius = visibleRooms.length > 10 ? (isCurrent ? 20 : 13) : (isCurrent ? 29 : 24); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = isCurrent ? '#e36f55' : '#f4f0e8'; ctx.fill(); ctx.strokeStyle = isCurrent ? '#bc4b38' : '#53616b'; ctx.lineWidth = 2; ctx.stroke(); if (room.clue && !isFound) { ctx.fillStyle = '#f2c96d'; ctx.fillRect(x + radius - 2, y - radius, 10, 10); ctx.strokeStyle = '#14202b'; ctx.strokeRect(x + radius - 2, y - radius, 10, 10); } ctx.fillStyle = isCurrent ? '#fff9ed' : '#14202b'; ctx.font = `500 ${visibleRooms.length > 10 ? 8 : 11}px DM Mono`; ctx.textAlign = 'center'; ctx.fillText(room.name.replace('The ', '').replace(' Room', ''), x, y + radius + 15); });
  ctx.textAlign = 'left'; ctx.fillStyle = '#bc4b38'; ctx.font = '500 10px DM Mono'; ctx.fillText('N', 14, 23); ctx.beginPath(); ctx.moveTo(18, 29); ctx.lineTo(18, 43); ctx.strokeStyle = '#bc4b38'; ctx.stroke();
}
function renderLevels() { $('#levelList').innerHTML = levels.map((level, index) => `<div class="level ${index === state.level ? 'active' : ''}" data-level="${index}"><span class="level-number">0${index + 1}</span><span class="level-name">${level.name}</span><span class="level-detail">${level.detail.split(' / ')[0]}</span></div>`).join(''); document.querySelectorAll('.level').forEach(item => item.addEventListener('click', () => selectLevel(Number(item.dataset.level)))); }
function selectLevel(level) { state.level = level; state.current = 'hall'; state.found = []; renderLevels(); updateUI(); drawMansion(); }
function updateUI() { const activeLevel = levels[state.level]; $('#currentRoom').textContent = activeRooms().find(room => room.id === state.current).name; $('#clueCount').textContent = `${state.found.length} / ${activeLevel.clues}`; $('#mapCount').textContent = `01 — ${String(activeLevel.rooms).padStart(2, '0')} ROOMS`; $('#clueList').innerHTML = activeRooms().slice(0, Math.min(3, activeLevel.clues)).map((room, index) => `<div class="clue ${state.found.includes(room.id) ? 'found' : ''}"><small>CLUE 0${index + 1} ${state.found.includes(room.id) ? '/ FOUND' : '/ UNKNOWN'}</small>${state.found.includes(room.id) ? room.clue : 'Evidence undiscovered'}</div>`).join(''); }
function moveTo(room) { state.current = room.id; if (room.clue && !state.found.includes(room.id)) state.found.push(room.id); updateUI(); drawMansion(); }
function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function tick() { if (state.seconds > 0) state.seconds--; $('#timer').textContent = formatTime(state.seconds); if (state.seconds === 0) showResult('⏰ TIME\'S UP', 'The mansion is locked down. CASE UNSOLVED.'); }
canvas.addEventListener('click', event => { const rect = canvas.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height; const clicked = activeRooms().find(room => Math.hypot(room.x - x, room.y - y) < .07); if (clicked) moveTo(clicked); });

const graphNodes = [{ id: 'H', x: .12, y: .52 }, { id: 'S', x: .32, y: .2 }, { id: 'D', x: .32, y: .8 }, { id: 'G', x: .55, y: .2 }, { id: 'B', x: .55, y: .8 }, { id: 'T', x: .83, y: .52 }];
const graphLinks = [[0,1],[0,2],[1,3],[2,4],[3,5],[4,5]]; let traceStep = 0; let traceOrder = [0, 1, 2, 3, 4, 5];
function drawGraph() { const graph = $('#graphCanvas'), width = graph.clientWidth, height = graph.clientHeight, ratio = window.devicePixelRatio || 1; graph.width = width * ratio; graph.height = height * ratio; const graphCtx = graph.getContext('2d'); graphCtx.setTransform(ratio, 0, 0, ratio, 0, 0); graphCtx.fillStyle = '#e9e2d5'; graphCtx.fillRect(0,0,width,height); graphLinks.forEach(([a,b]) => { const from=graphNodes[a], to=graphNodes[b]; graphCtx.strokeStyle='#a7aaa4'; graphCtx.lineWidth=2; graphCtx.beginPath(); graphCtx.moveTo(from.x*width,from.y*height); graphCtx.lineTo(to.x*width,to.y*height); graphCtx.stroke(); }); graphNodes.forEach((node,index) => { const visited = traceOrder.slice(0, traceStep + 1).includes(index); graphCtx.beginPath(); graphCtx.arc(node.x*width,node.y*height, visited ? 17 : 13, 0, Math.PI*2); graphCtx.fillStyle = index === 5 && visited ? '#a7d9c7' : visited ? '#e36f55' : '#f4f0e8'; graphCtx.fill(); graphCtx.strokeStyle='#14202b'; graphCtx.stroke(); graphCtx.fillStyle='#14202b'; graphCtx.font='500 11px DM Mono'; graphCtx.textAlign='center'; graphCtx.fillText(node.id, node.x*width, node.y*height+4); }); }
async function runTrace() { clearInterval(state.traceTimer); traceStep = 0; $('#statVisited').textContent = '0'; $('#statEdges').textContent = '0'; drawGraph(); try { const response = await fetch(`/api/algorithm?name=${encodeURIComponent(state.algorithm)}`); const result = await response.json(); traceOrder = result.visited.map(node => ['hall','study','dining','gallery','basement'].indexOf(node)); $('#statPath').textContent = result.path_length; $('#statEdges').textContent = result.edges_checked; } catch (error) { traceOrder = [0, 1, 2, 3, 4]; } state.traceTimer = setInterval(() => { traceStep++; $('#statVisited').textContent = Math.min(traceStep + 1, traceOrder.length); $('#statTime').textContent = `${(traceStep * .4).toFixed(1)} ms`; drawGraph(); if (traceStep >= traceOrder.length - 1) clearInterval(state.traceTimer); }, 400); }
function openModal(id) { $(`#${id}`).classList.remove('hidden'); if (id === 'labModal') { setTimeout(() => { drawGraph(); runTrace(); }, 30); } }
function closeModal(id) { $(`#${id}`).classList.add('hidden'); }
function showResult(title, message) { $('#accuseResult').innerHTML = `<h3>${title}</h3><p>${message}</p>`; $('#accuseResult').classList.remove('hidden'); openModal('accuseModal'); }
$('#labButton').addEventListener('click', () => openModal('labModal')); $('#replayButton').addEventListener('click', runTrace); $('#accuseButton').addEventListener('click', () => openModal('accuseModal')); document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeModal(button.dataset.close))); document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.addEventListener('click', event => { if (event.target === backdrop) closeModal(backdrop.id); })); $('#soundToggle').addEventListener('click', event => { state.sound = !state.sound; event.currentTarget.textContent = state.sound ? '◒' : '○'; });
$('#suspectGrid').innerHTML = [{name:'Eleanor Voss', role:'THE HEIRESS', icon:'♢', correct:false},{name:'Dr. Elias Reed', role:'THE PHYSICIAN', icon:'✚', correct:true},{name:'Arthur Bell', role:'THE GROUNDSKEEPER', icon:'⌂', correct:false}].map(suspect => `<button class="suspect" data-correct="${suspect.correct}"><span class="portrait">${suspect.icon}</span><span><b>${suspect.name}</b><small>${suspect.role}</small></span></button>`).join(''); document.querySelectorAll('.suspect').forEach(button => button.addEventListener('click', () => button.dataset.correct === 'true' ? showResult('🎉 CASE SOLVED!', `You found the hidden evidence and identified the real culprit.<br><br>Score: ${700 + state.found.length * 80}<br>Rooms explored: ${state.found.length + 1}<br>Clues found: ${state.found.length}`) : showResult('❌ WRONG SUSPECT', 'The real culprit escaped.<br><br>CASE FAILED.')));
document.querySelectorAll('.algorithm-tab').forEach(tab => tab.addEventListener('click', () => { document.querySelectorAll('.algorithm-tab').forEach(item => item.classList.remove('active')); tab.classList.add('active'); state.algorithm = tab.dataset.algorithm; $('#statAlgorithm').textContent = state.algorithm; $('#statPath').textContent = state.algorithm === 'DFS' ? '7' : state.algorithm === 'A*' ? '5' : '5'; runTrace(); }));
window.addEventListener('resize', () => { drawMansion(); if (!$('#labModal').classList.contains('hidden')) drawGraph(); }); renderLevels(); updateUI(); drawMansion(); setInterval(tick, 1000);
