// Polished games: Pong, Minesweeper, Space Invaders. Needs games.js and games2.js loaded first.

/* ---------- PONG ---------- */
G.pong = () => {
  const W = 480, H = 320, ph = 64, [c, x] = stage(W, H); P = [];
  let py = H / 2, ay = H / 2, ps = 0, as = 0, bx = W / 2, by = H / 2, vx = 0, vy = 0, tr = [], keys = {}, over = 0, hold = 700;
  const serve = d => { bx = W / 2; by = H / 2; const a = (Math.random() - .5) * .8; vx = Math.cos(a) * .3 * d; vy = Math.sin(a) * .3; tr = []; hold = 800; };
  const bounce = (p, d) => { const o = (by - p) / (ph / 2), sp = Math.min(.75, Math.hypot(vx, vy) * 1.07), a = o * .9; vx = Math.cos(a) * sp * d; vy = Math.sin(a) * sp; bx = d > 0 ? 34 : W - 34; burst(bx, by, '#c15bff', 8); beep(400, .04); };
  serve(1);
  c.onpointermove = e => { const r = c.getBoundingClientRect(); py = (e.clientY - r.top) * H / r.height; };
  document.onkeydown = e => { keys[e.key] = 1; if (e.key.startsWith('Arrow')) e.preventDefault(); }; document.onkeyup = e => keys[e.key] = 0;
  msg('Move the mouse, drag, or use W/S or arrow keys. First to 7 wins');
  loop(dt => {
    if (keys.ArrowUp || keys.w) py -= .4 * dt; if (keys.ArrowDown || keys.s) py += .4 * dt; py = Math.max(ph / 2, Math.min(H - ph / 2, py));
    if (!over) {
      const mx = .2 * dt; ay += Math.max(-mx, Math.min(mx, (vx > 0 ? by : H / 2) - ay)); ay = Math.max(ph / 2, Math.min(H - ph / 2, ay));
      if (hold > 0) hold -= dt; else {
        bx += vx * dt; by += vy * dt; tr.push([bx, by]); if (tr.length > 10) tr.shift();
        if (by < 7 || by > H - 7) { vy = -vy; by = Math.max(7, Math.min(H - 7, by)); beep(250, .03); }
        if (vx < 0 && bx < 33 && bx > 16 && Math.abs(by - py) < ph / 2 + 7) bounce(py, 1);
        if (vx > 0 && bx > W - 33 && bx < W - 16 && Math.abs(by - ay) < ph / 2 + 7) bounce(ay, -1);
        if (bx < -10 || bx > W + 10) {
          const d = bx < 0 ? -1 : 1; if (d < 0) as++; else ps++; beep(160, .25, 'sawtooth');
          if (ps == 7 || as == 7) { over = 1; msg(ps > as ? 'You win!' : 'Bot wins'); coins(ps > as ? 10 : 1); } else { msg('You ' + ps + ' - ' + as + ' Bot'); serve(d); }
        }
      }
    }
    x.fillStyle = '#0b0b14'; x.fillRect(0, 0, W, H); x.fillStyle = 'rgba(255,255,255,.12)'; for (let y = 6; y < H; y += 20) x.fillRect(W / 2 - 1, y, 2, 10);
    x.font = '700 56px Roboto'; x.textAlign = 'center'; x.fillStyle = 'rgba(255,255,255,.1)'; x.fillText(ps, W / 2 - 60, 70); x.fillText(as, W / 2 + 60, 70); x.textAlign = 'left';
    x.shadowColor = '#c15bff'; x.shadowBlur = 14; x.fillStyle = '#e9b8ff'; x.beginPath(); x.roundRect(20, py - ph / 2, 10, ph, 5); x.fill(); x.fillStyle = '#7dd3fc'; x.shadowColor = '#38bdf8'; x.beginPath(); x.roundRect(W - 30, ay - ph / 2, 10, ph, 5); x.fill();
    tr.forEach((p, i) => { x.globalAlpha = i / tr.length * .35; x.fillStyle = '#fff'; x.beginPath(); x.arc(p[0], p[1], 6, 0, 7); x.fill(); }); x.globalAlpha = 1;
    x.shadowColor = '#fff'; x.fillStyle = '#fff'; x.beginPath(); x.arc(bx, by, 7, 0, 7); x.fill(); x.shadowBlur = 0; drawP(x, dt);
    if (over) banner(x, W, H, ps > as ? 'You win' : 'Bot wins', ps + ' - ' + as + ' · press New game');
  });
};

/* ---------- MINESWEEPER ---------- */
G.minesweeper = () => {
  const M = 10; mount('<div class="ms-top"><span id="mc">🚩 10</span><span id="tm">⏱ 0</span></div><div id="b" class="ms"></div>');
  const g = Array.from({ length: 81 }, () => ({ m: 0, o: 0, f: 0, n: 0 })), bs = [], B = $('#b');
  let first = 1, done = 0, t0 = 0, fl = 0, bad = -1, lp = 0, tm;
  for (let i = 0; i < 81; i++) { const b = document.createElement('button'); B.appendChild(b); bs.push(b); }
  const nb = i => { const r = i / 9 | 0, c = i % 9, o = []; for (let a = -1; a < 2; a++) for (let d = -1; d < 2; d++) { const y = r + a, x = c + d; if ((a || d) && y >= 0 && y < 9 && x >= 0 && x < 9) o.push(y * 9 + x); } return o; };
  const plant = s => { const ex = [s, ...nb(s)]; let k = 0; while (k < M) { const i = R(81); if (!g[i].m && !ex.includes(i)) { g[i].m = 1; k++; } } g.forEach((q, i) => q.n = nb(i).filter(j => g[j].m).length); };
  const open = i => { const q = g[i]; if (q.o || q.f) return; q.o = 1; if (q.m) { done = 1; bad = i; g.forEach(z => { if (z.m) z.o = 1; }); clearInterval(tm); msg('Boom. Press New game'); beep(100, .4, 'sawtooth'); return; } if (!q.n) nb(i).forEach(open); };
  const show = () => {
    g.forEach((q, i) => { const b = bs[i]; b.className = q.o ? 'o' : ''; b.textContent = q.o ? (q.m ? '💣' : q.n || '') : q.f ? '🚩' : ''; if (q.o && !q.m && q.n) b.dataset.n = q.n; else delete b.dataset.n; });
    if (bad >= 0) bs[bad].classList.add('bad'); $('#mc').textContent = '🚩 ' + (M - fl);
  };
  const act = (i, flag) => {
    if (done) return; const q = g[i];
    if (flag) { if (!q.o) { q.f ^= 1; fl += q.f ? 1 : -1; beep(q.f ? 500 : 350, .04); } }
    else { if (q.f || q.o) return; if (first) { first = 0; plant(i); t0 = Date.now(); tm = setInterval(() => $('#tm').textContent = '⏱ ' + Math.floor((Date.now() - t0) / 1000), 500); } open(i); beep(300, .04); }
    if (!done && !first && g.every(z => z.m || z.o)) { done = 1; clearInterval(tm); const s = Math.floor((Date.now() - t0) / 1000); msg('Cleared in ' + s + 's'); coins(Math.max(5, 100 - s)); beep(900, .3, 'triangle'); }
    show();
  };
  const idx = e => bs.indexOf(e.target.closest('button'));
  B.onclick = e => { if (lp) { lp = 0; return; } const i = idx(e); if (i >= 0) act(i, 0); };
  B.oncontextmenu = e => { e.preventDefault(); const i = idx(e); if (i >= 0) act(i, 1); };
  let pt; B.onpointerdown = e => { if (e.pointerType == 'touch') { const i = idx(e); pt = setTimeout(() => { lp = 1; if (i >= 0) act(i, 1); }, 450); } };
  B.onpointerup = B.onpointerleave = () => clearTimeout(pt);
  msg('Click to reveal. Right-click or long-press to flag');
};

/* ---------- SPACE INVADERS ---------- */
G['space-invaders'] = () => {
  const W = 400, H = 500, [c, x] = stage(W, H); P = [];
  const F = [['00100100', '10100101', '11111111', '11011011', '01111110', '00111100', '01000010', '10000001'], ['00100100', '00100100', '01111110', '11011011', '11111111', '10111101', '10100101', '00011000']];
  const hb = getBest('invaders'), stars = Array.from({ length: 50 }, () => [R(W), R(H), Math.random() * 1.6 + .4]);
  let al, ox, oy, dir, fr = 0, stp, es = 0, px = W / 2, sc = 0, lv = 1, lives = 3, bl = [], eb = [], inv = 0, over = 0, keys = {}, last = 0;
  const build = () => { al = []; for (let j = 0; j < 5; j++) for (let i = 0; i < 8; i++) al.push({ i, j, a: 1 }); ox = 30; oy = 70; dir = 1; stp = 0; eb = []; bl = []; };
  const pos = a => [ox + a.i * 40, oy + a.j * 34], end = () => { over = 1; best('invaders', sc); msg('Game over. Score ' + sc); coins(Math.floor(sc / 30)); beep(100, .6, 'sawtooth'); };
  const shoot = () => { const n = performance.now(); if (over || n - last < 350) return; last = n; bl.push({ x: px, y: H - 56 }); beep(700, .06, 'square', .03); };
  const spr = (s, X, Y, k, col) => { x.fillStyle = col; s.forEach((r, j) => [...r].forEach((v, i) => v == '1' && x.fillRect(X + i * k, Y + j * k, k, k))); };
  build();
  c.onpointermove = e => { const r = c.getBoundingClientRect(); px = (e.clientX - r.left) * W / r.width; }; c.onpointerdown = shoot;
  document.onkeydown = e => { keys[e.key] = 1; if (e.key == ' ') { e.preventDefault(); shoot(); } if (e.key.startsWith('Arrow')) e.preventDefault(); }; document.onkeyup = e => keys[e.key] = 0;
  msg('Move the mouse or drag, or use arrow keys. Click or Space to fire');
  loop((dt, t) => {
    let L = al.filter(a => a.a);
    if (!over) {
      if (keys.ArrowLeft || keys.a) px -= .3 * dt; if (keys.ArrowRight || keys.d) px += .3 * dt; px = Math.max(18, Math.min(W - 18, px));
      stp += dt; if (stp > Math.max(45, L.length * (11 - lv))) {
        stp = 0; fr ^= 1; const xs = L.map(a => ox + a.i * 40);
        if ((dir > 0 && Math.max(...xs) + 24 > W - 10) || (dir < 0 && Math.min(...xs) < 10)) { dir = -dir; oy += 16; } else ox += dir * 8; beep(80 + fr * 30, .03, 'square', .02);
      }
      es += dt; if (es > Math.max(350, 1000 - lv * 80) && L.length) { es = 0; const a = L[R(L.length)], bt = L.filter(b => b.i == a.i).reduce((m, b) => b.j > m.j ? b : m), [p, q] = pos(bt); eb.push({ x: p + 12, y: q + 24 }); }
      bl.forEach(b => b.y -= .55 * dt); eb.forEach(b => b.y += (.25 + lv * .01) * dt); bl = bl.filter(b => b.y > 0); eb = eb.filter(b => b.y < H);
      bl.forEach(b => { const h = L.find(a => { const [p, q] = pos(a); return a.a && b.x > p && b.x < p + 24 && b.y > q && b.y < q + 24; }); if (h) { h.a = 0; b.y = -99; sc += [30, 20, 20, 10, 10][h.j] * lv; const [p, q] = pos(h); burst(p + 12, q + 12, `hsl(${[300, 270, 200, 160, 120][h.j]} 80% 65%)`, 12); beep(200, .08, 'sawtooth'); } });
      inv -= dt; eb.forEach(b => { if (inv <= 0 && b.y > H - 50 && b.y < H - 30 && Math.abs(b.x - px) < 18) { b.y = H + 99; lives--; inv = 1200; burst(px, H - 40, '#fff', 20); beep(120, .3, 'sawtooth'); if (lives <= 0) end(); } });
      L = al.filter(a => a.a); if (L.some(a => pos(a)[1] + 24 > H - 70)) end();
      if (!L.length && !over) { lv++; build(); beep(900, .3, 'triangle'); }
    }
    x.fillStyle = '#080812'; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; stars.forEach(s => { x.globalAlpha = .3 + .3 * Math.sin(t / 500 + s[0]); x.fillRect(s[0], (s[1] + t * .01 * s[2]) % H, s[2], s[2]); }); x.globalAlpha = 1;
    L.forEach(a => { const [p, q] = pos(a); x.shadowColor = x.fillStyle = `hsl(${[300, 270, 200, 160, 120][a.j]} 80% 65%)`; x.shadowBlur = 8; spr(F[fr], p, q, 3, x.fillStyle); }); x.shadowBlur = 0;
    if (inv <= 0 || Math.floor(t / 90) % 2) { x.shadowColor = '#c15bff'; x.shadowBlur = 12; x.fillStyle = '#e9b8ff'; x.beginPath(); x.moveTo(px, H - 56); x.lineTo(px + 18, H - 30); x.lineTo(px - 18, H - 30); x.fill(); x.fillStyle = '#9333ea'; x.fillRect(px - 18, H - 32, 36, 6); x.shadowBlur = 0; }
    x.fillStyle = '#fff'; bl.forEach(b => x.fillRect(b.x - 1, b.y, 3, 12)); x.fillStyle = '#f87171'; eb.forEach(b => x.fillRect(b.x - 1.5, b.y, 3, 12));
    drawP(x, dt); x.font = '700 16px Roboto'; x.fillStyle = '#fff'; x.fillText('Score ' + sc, 12, 28); x.textAlign = 'center'; x.fillText('Wave ' + lv, W / 2, 28); x.textAlign = 'right'; x.fillText('♥'.repeat(Math.max(lives, 0)), W - 12, 28); x.textAlign = 'left';
    x.font = '400 12px Roboto'; x.fillStyle = '#7b7b8c'; x.fillText('Best ' + Math.max(hb, sc), 12, 44);
    if (over) banner(x, W, H, 'Game over', 'Score ' + sc + ' · press New game');
  });
};

(G[document.body.dataset.game] || (() => {}))();
