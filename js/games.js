const G = {}, $ = s => document.querySelector(s), R = n => Math.floor(Math.random() * n);
let T;
const root = $('#game');
const msg = t => { $('#msg').textContent = t; };
function coins(n) {
  if (n <= 0) return;
  try {
    const p = JSON.parse(localStorage.getItem('paradox-profile') || '{}');
    p.coins = (p.coins ?? 0) + n;
    localStorage.setItem('paradox-profile', JSON.stringify(p));
  } catch (e) {}
  $('#msg').textContent += ' · +' + n + ' coins';
}
function swipe(el) {
  let x, y;
  el.ontouchstart = e => { x = e.touches[0].clientX; y = e.touches[0].clientY; };
  el.ontouchend = e => {
    const a = e.changedTouches[0].clientX - x, b = e.changedTouches[0].clientY - y;
    if (Math.abs(a) + Math.abs(b) < 20 || !document.onkeydown) return;
    e.preventDefault();
    document.onkeydown({ key: Math.abs(a) > Math.abs(b) ? (a > 0 ? 'ArrowRight' : 'ArrowLeft') : (b > 0 ? 'ArrowDown' : 'ArrowUp'), preventDefault() {} });
  };
}
function mount(html) {
  clearInterval(T); clearTimeout(T); document.onkeydown = null;
  root.innerHTML = html + '<p id="msg" class="msg"></p><button class="btn" id="again">New game</button>';
  $('#again').onclick = () => G[document.body.dataset.game]();
  const c = root.querySelector('canvas,#b'); if (c) swipe(c);
}

G.snake = () => {
  mount('<canvas id="c" width="300" height="300"></canvas>');
  const x = $('#c').getContext('2d'); let s = [[7, 7], [6, 7], [5, 7]], d = [1, 0], f = [10, 7], sc = 0;
  const draw = () => {
    x.fillStyle = '#0f0f1a'; x.fillRect(0, 0, 300, 300);
    x.fillStyle = '#c15bff'; x.fillRect(f[0] * 20, f[1] * 20, 18, 18);
    x.fillStyle = '#22c55e'; s.forEach(p => x.fillRect(p[0] * 20, p[1] * 20, 18, 18));
  };
  const step = () => {
    const h = [s[0][0] + d[0], s[0][1] + d[1]];
    if (h[0] < 0 || h[1] < 0 || h[0] > 14 || h[1] > 14 || s.some(p => p[0] == h[0] && p[1] == h[1])) {
      clearInterval(T); msg('Game over. Score ' + sc); coins(sc); return;
    }
    s.unshift(h);
    if (h[0] == f[0] && h[1] == f[1]) { sc++; f = [R(15), R(15)]; msg('Score ' + sc); } else s.pop();
    draw();
  };
  document.onkeydown = e => {
    const m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (m) { e.preventDefault(); if (m[0] != -d[0] || m[1] != -d[1]) d = m; }
  };
  msg('Score 0. Use arrow keys or swipe'); draw(); T = setInterval(step, 110);
};

G['2048'] = () => {
  mount('<div id="b" class="b2048"></div>');
  const g = Array(16).fill(0); let sc = 0;
  const add = () => { const e = g.map((v, i) => v ? -1 : i).filter(i => i >= 0); g[e[R(e.length)]] = Math.random() < .9 ? 2 : 4; };
  const draw = () => {
    $('#b').innerHTML = g.map(v => `<i class="t" style="background:${v ? `hsl(${280 - Math.log2(v) * 8} 55% ${Math.max(22, 62 - Math.log2(v) * 4)}%)` : '#1a1a28'}">${v || ''}</i>`).join('');
    msg('Score ' + sc);
  };
  const line = a => {
    const r = a.filter(Boolean);
    for (let i = 0; i < r.length - 1; i++) if (r[i] == r[i + 1]) { r[i] *= 2; sc += r[i]; r.splice(i + 1, 1); }
    while (r.length < 4) r.push(0); return r;
  };
  const over = () => !g.includes(0) && !g.some((v, i) => (i % 4 < 3 && v == g[i + 1]) || (i < 12 && v == g[i + 4]));
  document.onkeydown = e => {
    const dir = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key); if (dir < 0) return;
    e.preventDefault(); const o = g.slice();
    for (let k = 0; k < 4; k++) {
      const idx = [0, 1, 2, 3].map(j => dir < 2 ? k * 4 + j : j * 4 + k); if (dir % 2) idx.reverse();
      const r = line(idx.map(i => g[i])); idx.forEach((i, j) => g[i] = r[j]);
    }
    if (o.some((v, i) => v != g[i])) { add(); draw(); if (over()) { msg('Game over. Score ' + sc); coins(Math.floor(sc / 100)); } }
  };
  add(); add(); draw();
};

G.memory = () => {
  const e = ['🍎', '🚀', '🐱', '⚡', '🎲', '🌙', '🍕', '👾'], d = [...e, ...e].sort(() => Math.random() - .5);
  let a = null, lock = 0, m = 0, mv = 0;
  mount('<div id="b" class="mem">' + d.map((v, i) => `<button data-i="${i}">?</button>`).join('') + '</div>');
  $('#b').onclick = ev => {
    const b = ev.target.closest('button'); if (!b || lock || b.disabled || b === a) return;
    b.textContent = d[b.dataset.i]; if (!a) { a = b; return; }
    mv++;
    if (d[a.dataset.i] == d[b.dataset.i]) {
      a.disabled = b.disabled = true; a = null;
      if (++m == 8) { msg('Done in ' + mv + ' moves'); coins(Math.max(1, 20 - mv)); }
    } else { lock = 1; const p = a; a = null; T = setTimeout(() => { p.textContent = b.textContent = '?'; lock = 0; }, 700); }
  };
  msg('Match the pairs');
};

G['reaction-time'] = () => {
  mount('<button id="r" class="big">Click to start</button>');
  let st = 0, state = 0; const r = $('#r');
  r.onclick = () => {
    if (state == 0) {
      state = 1; r.className = 'big wait'; r.textContent = 'Wait for green...';
      T = setTimeout(() => { state = 2; st = performance.now(); r.className = 'big go'; r.textContent = 'Click now!'; }, 1000 + R(3000));
    } else if (state == 1) { clearTimeout(T); state = 0; r.className = 'big'; r.textContent = 'Too soon. Click to try again'; }
    else { const ms = Math.round(performance.now() - st); state = 0; r.className = 'big'; r.textContent = ms + ' ms. Click to try again'; msg(''); coins(ms < 300 ? 5 : 1); }
  };
  msg('Click when the box turns green');
};

G['whack-a-mole'] = () => {
  mount('<div id="b" class="moles">' + '<button></button>'.repeat(9) + '</div>');
  const h = [...document.querySelectorAll('#b button')]; let sc = 0, n = 43, cur = -1;
  h.forEach((b, i) => b.onclick = () => { if (i == cur) { sc++; cur = -1; b.textContent = ''; msg('Score ' + sc); } });
  T = setInterval(() => {
    h.forEach(b => b.textContent = '');
    if (--n < 0) { clearInterval(T); cur = -1; msg('Time up. Score ' + sc); coins(sc); return; }
    cur = R(9); h[cur].textContent = '🐹'; msg('Score ' + sc);
  }, 700);
  msg('Tap the moles for 30 seconds');
};

G['tic-tac-toe'] = () => {
  mount('<div id="b" class="ttt">' + '<button></button>'.repeat(9) + '</div>');
  const b = [...document.querySelectorAll('#b button')], g = Array(9).fill(''),
    L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const win = p => L.some(l => l.every(i => g[i] == p)), set = (i, p) => { g[i] = p; b[i].textContent = p; };
  const find = p => { for (const l of L) { const e = l.filter(i => !g[i]); if (e.length == 1 && l.filter(i => g[i] == p).length == 2) return e[0]; } return -1; };
  const end = () => {
    if (win('X')) { msg('You win!'); coins(10); return 1; }
    if (win('O')) { msg('Bot wins'); return 1; }
    if (!g.includes('')) { msg('Draw'); coins(2); return 1; } return 0;
  };
  b.forEach((el, i) => el.onclick = () => {
    if (g[i] || win('X') || win('O')) return; set(i, 'X'); if (end()) return;
    let m = find('O'); if (m < 0) m = find('X'); if (m < 0 && !g[4]) m = 4;
    if (m < 0) { const e = g.map((v, k) => v ? -1 : k).filter(k => k >= 0); m = e[R(e.length)]; }
    set(m, 'O'); end();
  });
  msg('You are X. Bot is O');
};

(G[document.body.dataset.game] || (() => {}))();
