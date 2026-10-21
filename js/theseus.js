const UP = [
  { id: 'grip', n: 'Stronger Grip', d: '+1 Thread/click', b: 10 },
  { id: 'focus', n: "Hero's Focus", d: '+5% click value', b: 75 },
  { id: 'rhythm', n: 'Battle Rhythm', d: '+50% every 12 clicks', b: 250 },
  { id: 'ariadne', n: "Ariadne's Guidance", d: '+1/sec', b: 25, s: 1 },
  { id: 'path', n: 'Marked Path', d: '+5/sec', b: 200, s: 5 },
  { id: 'memory', n: 'Labyrinth Memory', d: '+15/sec', b: 800, s: 15 },
  { id: 'scouts', n: 'Athenian Scouts', d: '+25/sec', b: 1200, s: 25 },
  { id: 'temple', n: 'Temple Engineers', d: '+100/sec', b: 6000, s: 100 },
  { id: 'oracle', n: 'Oracle of Delphi', d: '+500/sec', b: 30000, s: 500 },
  { id: 'minotaur', n: 'Minotaur Tamer', d: '+2000/sec', b: 120000, s: 2000 }];
const MU = [
  { id: 'divine', n: 'Divine Favor', d: 'x2 Thread/sec', c: 15000 },
  { id: 'golden', n: 'Golden Thread', d: 'x2 Thread/click', c: 12000 },
  { id: 'mastery', n: 'Labyrinth Mastery', d: 'x2 everything', c: 60000 }];
const KEY = 'paradox-theseus', $ = s => document.querySelector(s);
let S = { thread: 0, run: 0, total: 0, clicks: 0, depth: 0, glory: 0, lv: {}, mu: {} };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
UP.forEach(u => S.lv[u.id] = S.lv[u.id] || 0);

const fmt = n => { if (n < 1000) return n < 10 && n % 1 ? n.toFixed(1) : Math.floor(n) + ''; const s = ['K', 'M', 'B', 'T', 'Qa']; let i = -1; while (n >= 1000 && i < s.length - 1) { n /= 1000; i++; } return n.toFixed(1) + s[i]; };
const cost = u => Math.ceil(u.b * 1.15 ** S.lv[u.id]), gm = () => 1 + .1 * S.glory;
const perClick = () => (1 + S.lv.grip) * (1 + .05 * S.lv.focus) * (S.mu.golden ? 2 : 1) * (S.mu.mastery ? 2 : 1) * gm();
const perSec = () => UP.reduce((a, u) => a + (u.s || 0) * S.lv[u.id], 0) * (S.mu.divine ? 2 : 1) * (S.mu.mastery ? 2 : 1) * gm();
const gain = () => Math.floor(Math.sqrt(S.run / 5000));
const give = n => { try { const p = JSON.parse(localStorage.getItem('paradox-profile') || '{}'); p.coins = (p.coins ?? 0) + n; localStorage.setItem('paradox-profile', JSON.stringify(p)); } catch (e) {} };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const add = v => { S.thread += v; S.run += v; S.total += v; };

function row(name, desc, onbuy) {
  const e = document.createElement('button'); e.className = 'row';
  e.innerHTML = `<span><b>${name}</b> <i class="lv"></i><small>${desc}</small></span><em class="cost"></em>`; e.onclick = onbuy; return e;
}
const upRows = UP.map(u => { const e = row(u.n, u.d, () => { const c = cost(u); if (S.thread >= c) { S.thread -= c; S.lv[u.id]++; draw(); } }); $('#up').appendChild(e); return e; });
const muRows = MU.map(m => { const e = row(m.n, m.d, () => { if (!S.mu[m.id] && S.thread >= m.c) { S.thread -= m.c; S.mu[m.id] = 1; draw(); } }); e.querySelector('.lv').remove(); $('#mu').appendChild(e); return e; });

function draw() {
  $('#s-thread').textContent = fmt(S.thread); $('#s-sec').textContent = fmt(perSec()); $('#s-depth').textContent = S.depth; $('#s-glory').textContent = S.glory;
  $('#pc').textContent = '+' + fmt(perClick());
  UP.forEach((u, i) => { const e = upRows[i], c = cost(u); e.querySelector('.lv').textContent = 'Lv' + S.lv[u.id]; e.querySelector('.cost').textContent = '🧵 ' + fmt(c); e.classList.toggle('can', S.thread >= c); });
  MU.forEach((m, i) => { const e = muRows[i], own = S.mu[m.id]; e.querySelector('.cost').textContent = own ? 'Owned' : '🧵 ' + fmt(m.c); e.classList.toggle('owned', !!own); e.classList.toggle('can', !own && S.thread >= m.c); });
  const g = gain(), d = $('#desc'); d.classList.toggle('show', g >= 1); d.textContent = 'Descend deeper: +' + g + ' Glory (resets Thread and upgrades)';
  $('#foot').textContent = 'Auto-saves every 15s · ' + fmt(S.total) + ' total Thread earned';
}

$('#spool').onclick = e => {
  S.clicks++; let v = perClick(); if (S.lv.rhythm && S.clicks % 12 == 0) v *= 1 + .5 * S.lv.rhythm; add(v);
  const b = e.currentTarget, r = b.getBoundingClientRect(), p = document.createElement('span'); p.className = 'pop'; p.textContent = '+' + fmt(v);
  p.style.left = (e.clientX - r.left || r.width / 2) + 'px'; p.style.top = (e.clientY - r.top || r.height / 2) + 'px'; b.appendChild(p); setTimeout(() => p.remove(), 800); draw();
};
$('#desc').onclick = () => {
  const g = gain(); if (g < 1 || !confirm('Descend deeper? You gain ' + g + ' Glory (+' + g * 10 + '% to everything) and lose all Thread, upgrades, and multipliers.')) return;
  S.glory += g; S.depth++; S.thread = S.run = S.clicks = 0; S.mu = {}; UP.forEach(u => S.lv[u.id] = 0); give(g * 5); save(); draw();
};
$('#save').onclick = () => { save(); $('#savetxt').textContent = 'Saved'; setTimeout(() => $('#savetxt').textContent = 'Save', 1200); };

let last = performance.now(); setInterval(() => { const n = performance.now(), v = perSec() * (n - last) / 1000; last = n; if (v > 0) add(v); draw(); }, 100);
setInterval(save, 15000); window.addEventListener('beforeunload', save);
draw(); if (window.lucide) lucide.createIcons();
