// Polished games: Tetris, Flappy Bird, Breakout. Needs games.js loaded first.
let RAF, P = [];
const AC = window.AudioContext ? new AudioContext() : null;
const beep = (f, d = .08, t = 'square', v = .04) => { try { if (!AC) return; AC.resume(); const o = AC.createOscillator(), g = AC.createGain(); o.type = t; o.frequency.value = f; g.gain.value = v; g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d); o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + d); } catch (e) {} };
const getBest = k => { try { return +localStorage.getItem('paradox-best-' + k) || 0; } catch (e) { return 0; } };
const best = (k, s) => { const v = Math.max(getBest(k), s); try { localStorage.setItem('paradox-best-' + k, v); } catch (e) {} return v; };
function stage(w, h) {
  cancelAnimationFrame(RAF); mount('<canvas id="c" class="hd"></canvas>');
  const c = $('#c'), d = devicePixelRatio || 1; c.width = w * d; c.height = h * d; c.style.width = w + 'px';
  const x = c.getContext('2d'); x.scale(d, d); return [c, x];
}
function loop(fn) { let l = performance.now(); const f = t => { fn(Math.min(t - l, 40), t); l = t; RAF = requestAnimationFrame(f); }; RAF = requestAnimationFrame(f); }
const cell = (x, i, j, s, c, a = 1) => { x.globalAlpha = a; x.fillStyle = c; x.fillRect(i * s + 1, j * s + 1, s - 2, s - 2); x.fillStyle = 'rgba(255,255,255,.3)'; x.fillRect(i * s + 1, j * s + 1, s - 2, (s - 2) / 3); x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(i * s + 1, j * s + s - 5, s - 2, 4); x.globalAlpha = 1; };
const burst = (px, py, c, n = 10) => { for (let i = 0; i < n; i++) P.push({ x: px, y: py, vx: (Math.random() - .5) * .3, vy: (Math.random() - .7) * .3, l: 1, c }); };
const drawP = (x, dt) => { P = P.filter(p => p.l > 0); P.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .0006 * dt; p.l -= dt / 600; x.globalAlpha = Math.max(p.l, 0); x.fillStyle = p.c; x.fillRect(p.x, p.y, 3, 3); }); x.globalAlpha = 1; };
const banner = (x, w, h, t, s) => { x.fillStyle = 'rgba(8,8,15,.78)'; x.fillRect(0, 0, w, h); x.textAlign = 'center'; x.fillStyle = '#fff'; x.font = '700 26px Roboto'; x.fillText(t, w / 2, h / 2 - 6); x.fillStyle = '#9a9ab0'; x.font = '400 14px Roboto'; x.fillText(s, w / 2, h / 2 + 20); x.textAlign = 'left'; };

/* ---------- TETRIS ---------- */
const SH = { I: [[1, 1, 1, 1]], O: [[1, 1], [1, 1]], T: [[0, 1, 0], [1, 1, 1]], S: [[0, 1, 1], [1, 1, 0]], Z: [[1, 1, 0], [0, 1, 1]], J: [[1, 0, 0], [1, 1, 1]], L: [[0, 0, 1], [1, 1, 1]] };
const COL = { I: '#22d3ee', O: '#facc15', T: '#c15bff', S: '#4ade80', Z: '#f87171', J: '#60a5fa', L: '#fb923c' };
const rot = m => m[0].map((_, i) => m.map(r => r[i]).reverse());
G.tetris = () => {
  const W = 380, H = 520, S = 26, [c, x] = stage(W, H); P = [];
  let b = Array.from({ length: 20 }, () => Array(10).fill(0)), bag = [], sc = 0, ln = 0, lv = 1, acc = 0, over = 0, pause = 0, cur, nxt;
  const hb = getBest('tetris');
  const pick = () => { if (!bag.length) bag = Object.keys(SH).sort(() => Math.random() - .5); const k = bag.pop(); return { m: SH[k], c: COL[k], x: 0, y: 0 }; };
  const hit = (m, px, py) => m.some((r, j) => r.some((v, i) => v && (px + i < 0 || px + i > 9 || py + j > 19 || (py + j >= 0 && b[py + j][px + i]))));
  const spawn = () => {
    cur = nxt || pick(); nxt = pick(); cur.x = Math.floor((10 - cur.m[0].length) / 2); cur.y = 0;
    if (hit(cur.m, cur.x, cur.y)) { over = 1; best('tetris', sc); beep(120, .5, 'sawtooth'); msg('Game over. Score ' + sc); coins(Math.floor(sc / 200)); }
  };
  const lock = () => {
    cur.m.forEach((r, j) => r.forEach((v, i) => { if (v && cur.y + j >= 0) b[cur.y + j][cur.x + i] = cur.c; }));
    let n = 0;
    for (let j = 19; j >= 0; j--) if (b[j].every(Boolean)) { for (let i = 0; i < 10; i++) burst(i * S + 13, j * S + 13, b[j][i], 3); b.splice(j, 1); b.unshift(Array(10).fill(0)); n++; j++; }
    if (n) { sc += [0, 100, 300, 500, 800][n] * lv; ln += n; lv = Math.floor(ln / 10) + 1; beep(500 + n * 150, .2, 'triangle'); } else beep(150, .05);
    spawn();
  };
  const drop = () => { if (!hit(cur.m, cur.x, cur.y + 1)) cur.y++; else lock(); };
  const gy = () => { let y = cur.y; while (!hit(cur.m, cur.x, y + 1)) y++; return y; };
  spawn();
  document.onkeydown = e => {
    const k = e.key; if (k == 'p' || k == 'P') { pause ^= 1; return; } if (over || pause) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(k)) e.preventDefault();
    if (k == 'ArrowLeft' && !hit(cur.m, cur.x - 1, cur.y)) cur.x--;
    else if (k == 'ArrowRight' && !hit(cur.m, cur.x + 1, cur.y)) cur.x++;
    else if (k == 'ArrowDown') { drop(); sc++; }
    else if (k == 'ArrowUp' || k == 'x') { const r = rot(cur.m); for (const o of [0, -1, 1, -2, 2]) if (!hit(r, cur.x + o, cur.y)) { cur.m = r; cur.x += o; beep(300, .04); break; } }
    else if (k == ' ') { const y = gy(); sc += (y - cur.y) * 2; cur.y = y; lock(); }
  };
  c.onpointerdown = () => { if (!over && !pause) document.onkeydown({ key: 'ArrowUp', preventDefault() {} }); };
  msg('Arrows move and rotate. Space drops. P pauses. On a phone: tap to rotate, swipe to move');
  loop(dt => {
    if (!over && !pause) { acc += dt; const sp = Math.max(80, 800 - (lv - 1) * 70); while (acc > sp) { acc -= sp; drop(); } }
    x.fillStyle = '#0b0b14'; x.fillRect(0, 0, W, H); x.strokeStyle = 'rgba(255,255,255,.04)';
    for (let i = 0; i <= 10; i++) { x.beginPath(); x.moveTo(i * S, 0); x.lineTo(i * S, 520); x.stroke(); }
    b.forEach((r, j) => r.forEach((v, i) => v && cell(x, i, j, S, v)));
    if (!over) { const g = gy(); cur.m.forEach((r, j) => r.forEach((v, i) => v && cell(x, cur.x + i, g + j, S, cur.c, .2))); cur.m.forEach((r, j) => r.forEach((v, i) => v && cell(x, cur.x + i, cur.y + j, S, cur.c))); }
    drawP(x, dt); x.textAlign = 'left';
    [['SCORE', sc], ['LEVEL', lv], ['LINES', ln], ['BEST', Math.max(hb, sc)]].forEach(([k, v], i) => { x.fillStyle = '#7b7b8c'; x.font = '400 12px Roboto'; x.fillText(k, 280, 40 + i * 46); x.fillStyle = '#fff'; x.font = '700 20px Roboto'; x.fillText(v, 280, 62 + i * 46); });
    x.fillStyle = '#7b7b8c'; x.font = '400 12px Roboto'; x.fillText('NEXT', 280, 236);
    x.save(); x.translate(284, 248); nxt.m.forEach((r, j) => r.forEach((v, i) => v && cell(x, i, j, 20, nxt.c))); x.restore();
    if (pause) banner(x, W, H, 'Paused', 'Press P to resume'); if (over) banner(x, W, H, 'Game over', 'Score ' + sc + ' · press New game');
  });
};

/* ---------- FLAPPY BIRD ---------- */
G['flappy-bird'] = () => {
  const W = 320, H = 480, GR = H - 60, [c, x] = stage(W, H); P = [];
  let by = 200, vy = 0, st = 0, sc = 0, pipes = [], tm = 1200, dead = 0, off = 0; const hb = getBest('flappy');
  const stars = Array.from({ length: 40 }, () => [R(W), R(GR), Math.random() * 1.5 + .5]);
  const flap = () => { if (dead) return; st = 1; vy = -.36; beep(520, .06, 'triangle'); };
  const die = () => { if (dead) return; dead = 1; beep(130, .4, 'sawtooth'); burst(80, by, '#facc15', 24); best('flappy', sc); msg('Game over. Score ' + sc); coins(Math.floor(sc / 2)); };
  c.onpointerdown = flap; document.onkeydown = e => { if (e.key == ' ' || e.key == 'ArrowUp') { e.preventDefault(); flap(); } };
  msg('Tap, click, or press Space to flap');
  loop((dt, t) => {
    if (st && !dead) {
      vy += .0011 * dt; by += vy * dt; off += .12 * dt; tm += dt;
      if (tm > 1500) { tm = 0; pipes.push({ x: W, g: 50 + R(190), ok: 0 }); }
      pipes.forEach(p => { p.x -= .12 * dt; if (!p.ok && p.x + 52 < 80) { p.ok = 1; sc++; beep(800, .06); msg('Score ' + sc); } if (91 > p.x && 69 < p.x + 52 && (by - 10 < p.g || by + 10 > p.g + 130)) die(); });
      pipes = pipes.filter(p => p.x > -60); if (by + 11 > GR || by < 0) die();
    } else if (!st) by = 200 + Math.sin(t / 200) * 8; else if (by + 11 < GR) { vy += .0011 * dt; by += vy * dt; }
    const sk = x.createLinearGradient(0, 0, 0, GR); sk.addColorStop(0, '#0b0b2a'); sk.addColorStop(1, '#3a1466'); x.fillStyle = sk; x.fillRect(0, 0, W, H);
    x.fillStyle = '#fff'; stars.forEach(s => { x.globalAlpha = .4 + .3 * Math.sin(t / 400 + s[0]); x.fillRect((s[0] - off * s[2] * .2 + W * 9) % W, s[1], s[2], s[2]); }); x.globalAlpha = 1;
    pipes.forEach(p => {
      const g = x.createLinearGradient(p.x, 0, p.x + 52, 0); g.addColorStop(0, '#15803d'); g.addColorStop(.45, '#4ade80'); g.addColorStop(1, '#166534'); x.fillStyle = g;
      x.fillRect(p.x, 0, 52, p.g); x.fillRect(p.x - 4, p.g - 18, 60, 18); x.fillRect(p.x, p.g + 130, 52, GR - p.g - 130); x.fillRect(p.x - 4, p.g + 130, 60, 18);
    });
    x.fillStyle = '#2a1646'; x.fillRect(0, GR, W, 60); x.fillStyle = '#c15bff'; for (let i = -1; i < 12; i++) x.fillRect(i * 30 - off % 30, GR, 15, 6);
    x.save(); x.translate(80, by); x.rotate(Math.max(-.5, Math.min(1.2, vy * 2.4)));
    x.shadowColor = '#facc15'; x.shadowBlur = 14; x.fillStyle = '#facc15'; x.beginPath(); x.ellipse(0, 0, 14, 11, 0, 0, 7); x.fill(); x.shadowBlur = 0;
    x.fillStyle = '#f59e0b'; x.beginPath(); x.ellipse(-4, 2 + Math.sin(t / 60) * 3, 7, 4, 0, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(6, -4, 4, 0, 7); x.fill(); x.fillStyle = '#111'; x.beginPath(); x.arc(7, -4, 2, 0, 7); x.fill();
    x.fillStyle = '#fb923c'; x.beginPath(); x.moveTo(12, 0); x.lineTo(20, 3); x.lineTo(12, 6); x.fill(); x.restore();
    drawP(x, dt); x.fillStyle = '#fff'; x.font = '700 40px Roboto'; x.textAlign = 'center'; x.fillText(sc, W / 2, 70); x.font = '400 12px Roboto'; x.fillStyle = '#9a9ab0'; x.fillText('BEST ' + Math.max(hb, sc), W / 2, 92); x.textAlign = 'left';
    if (!st) banner(x, W, H, 'Flappy Bird', 'Tap or press Space to start'); if (dead) { x.fillStyle = 'rgba(8,8,15,.6)'; x.fillRect(0, H / 2 - 40, W, 80); x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '700 24px Roboto'; x.fillText('Game over', W / 2, H / 2); x.font = '400 14px Roboto'; x.fillText('Press New game to retry', W / 2, H / 2 + 24); x.textAlign = 'left'; }
  });
};

/* ---------- BREAKOUT ---------- */
G.breakout = () => {
  const W = 360, H = 480, [c, x] = stage(W, H); P = [];
  let pw = 72, px = W / 2, lives = 3, sc = 0, lv = 1, bx = 0, by = 0, vx = 0, vy = 0, stuck = 1, over = 0, tr = [], br = [], keys = {}; const hb = getBest('breakout');
  const build = () => { br = []; for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) br.push({ x: 12 + i * 42, y: 50 + j * 20, hue: 300 - j * 45 }); };
  const reset = () => { stuck = 1; vx = vy = 0; tr = []; };
  const launch = () => { if (over) return; if (stuck) { stuck = 0; const sp = .3 + lv * .02, a = -Math.PI / 2 + (Math.random() - .5) * .6; vx = Math.cos(a) * sp; vy = Math.sin(a) * sp; beep(400, .05); } };
  c.onpointermove = e => { const r = c.getBoundingClientRect(); px = (e.clientX - r.left) * W / r.width; }; c.onpointerdown = launch;
  document.onkeydown = e => { if (e.key == ' ') { e.preventDefault(); launch(); } keys[e.key] = 1; }; document.onkeyup = e => keys[e.key] = 0;
  build(); reset(); msg('Move the mouse or drag, or use arrow keys. Click or Space to launch');
  loop((dt, t) => {
    if (keys.ArrowLeft) px -= .45 * dt; if (keys.ArrowRight) px += .45 * dt; px = Math.max(pw / 2, Math.min(W - pw / 2, px));
    if (stuck) { bx = px; by = 428; }
    else if (!over) {
      bx += vx * dt; by += vy * dt; tr.push([bx, by]); if (tr.length > 8) tr.shift();
      if (bx < 6 || bx > W - 6) { vx = -vx; bx = Math.max(6, Math.min(W - 6, bx)); beep(250, .03); }
      if (by < 6) { vy = Math.abs(vy); by = 6; beep(250, .03); }
      if (vy > 0 && by > 428 && by < 442 && Math.abs(bx - px) < pw / 2 + 6) { const o = (bx - px) / (pw / 2), sp = Math.hypot(vx, vy) * 1.004, a = -Math.PI / 2 + o * 1.0; vx = Math.cos(a) * sp; vy = Math.sin(a) * sp; beep(330, .04); }
      const h = br.find(b => bx > b.x - 5 && bx < b.x + 43 && by > b.y - 5 && by < b.y + 21);
      if (h) {
        br = br.filter(b => b !== h); const ox = Math.min(Math.abs(bx - h.x), Math.abs(bx - h.x - 38)), oy = Math.min(Math.abs(by - h.y), Math.abs(by - h.y - 16));
        if (ox < oy) vx = -vx; else vy = -vy; sc += 10 * lv; burst(h.x + 19, h.y + 8, `hsl(${h.hue} 80% 60%)`, 10); beep(500 + (h.y < 70 ? 300 : h.y < 110 ? 150 : 0), .05);
        if (!br.length) { lv++; build(); reset(); beep(900, .3, 'triangle'); }
      }
      if (by > H + 10) { lives--; beep(120, .3, 'sawtooth'); if (lives <= 0) { over = 1; best('breakout', sc); msg('Game over. Score ' + sc); coins(Math.floor(sc / 50)); } else reset(); }
    }
    x.fillStyle = '#0b0b14'; x.fillRect(0, 0, W, H);
    br.forEach(b => { const g = x.createLinearGradient(0, b.y, 0, b.y + 16); g.addColorStop(0, `hsl(${b.hue} 85% 68%)`); g.addColorStop(1, `hsl(${b.hue} 75% 45%)`); x.fillStyle = g; x.beginPath(); x.roundRect(b.x, b.y, 38, 16, 4); x.fill(); });
    const pg = x.createLinearGradient(0, 440, 0, 452); pg.addColorStop(0, '#e9b8ff'); pg.addColorStop(1, '#9333ea'); x.shadowColor = '#c15bff'; x.shadowBlur = 14; x.fillStyle = pg; x.beginPath(); x.roundRect(px - pw / 2, 440, pw, 12, 6); x.fill();
    tr.forEach((p, i) => { x.globalAlpha = i / tr.length * .4; x.beginPath(); x.arc(p[0], p[1], 5, 0, 7); x.fill(); }); x.globalAlpha = 1;
    x.shadowColor = '#fff'; x.fillStyle = '#fff'; x.beginPath(); x.arc(bx, by, 6, 0, 7); x.fill(); x.shadowBlur = 0;
    drawP(x, dt); x.font = '700 16px Roboto'; x.fillStyle = '#fff'; x.fillText('Score ' + sc, 12, 28); x.textAlign = 'center'; x.fillText('Level ' + lv, W / 2, 28); x.textAlign = 'right'; x.fillText('♥'.repeat(Math.max(lives, 0)), W - 12, 28); x.textAlign = 'left';
    x.font = '400 12px Roboto'; x.fillStyle = '#7b7b8c'; x.fillText('Best ' + Math.max(hb, sc), 12, 44);
    if (over) banner(x, W, H, 'Game over', 'Score ' + sc + ' · press New game');
  });
};

(G[document.body.dataset.game] || (() => {}))();
