// Polished games: Simon Says, Color Match, Pac-Man. Needs games.js and games2.js loaded first.
let GEN = 0;

/* ---------- SIMON SAYS ---------- */
G['simon-says'] = () => {
  const gen = ++GEN, later = (f, ms) => setTimeout(() => { if (gen == GEN) f(); }, ms);
  const C = ['#22c55e', '#ef4444', '#facc15', '#3b82f6'], Fq = [330, 415, 520, 260];
  mount('<div class="simon">' + C.map((c, i) => `<button aria-label="Pad ${i + 1}" style="--c:${c}"></button>`).join('') + '</div>');
  const B = [...document.querySelectorAll('.simon button')], box = $('.simon'); let seq = [], at = 0, lock = 1;
  const lit = (i, d) => { B[i].classList.add('on'); beep(Fq[i], d / 1000, 'sine', .08); later(() => B[i].classList.remove('on'), d); };
  const play = () => {
    lock = 1; at = 0; seq.push(R(4)); msg('Round ' + seq.length + '. Watch the pattern'); const gap = Math.max(300, 560 - seq.length * 18);
    seq.forEach((s, k) => later(() => lit(s, Math.max(200, 380 - seq.length * 12)), 700 + k * gap)); later(() => { lock = 0; msg('Your turn'); }, 700 + seq.length * gap);
  };
  B.forEach((b, i) => b.onclick = () => {
    if (lock) return; lit(i, 200);
    if (i != seq[at]) { lock = 1; const n = seq.length - 1; best('simon', n); box.classList.add('bad'); beep(110, .5, 'sawtooth'); msg('Wrong pad. You reached round ' + n + ' (best ' + getBest('simon') + ')'); coins(n); return; }
    if (++at == seq.length) { lock = 1; later(play, 800); }
  });
  later(play, 500);
};

/* ---------- COLOR MATCH ---------- */
G['color-match'] = () => {
  const N = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE'], Hx = { RED: '#ef4444', BLUE: '#3b82f6', GREEN: '#22c55e', YELLOW: '#facc15', PURPLE: '#a855f7' };
  mount('<div class="cm"><div id="bar"><i></i></div><div id="w" class="cmw"></div><div class="cmb"><button id="n">No</button><button id="y">Yes</button></div></div>');
  let sc = 0, ok = 0, end = 0, combo = 0; const t0 = performance.now(), hb = getBest('colormatch');
  const next = () => { const a = N[R(5)], b = Math.random() < .5 ? a : N.filter(n => n != a)[R(4)]; ok = a == b; $('#w').textContent = a; $('#w').style.color = Hx[b]; };
  const ans = v => {
    if (end) return;
    if (v == ok) { combo++; sc += 10 + Math.min(combo, 10) * 2; beep(600 + combo * 20, .05, 'triangle'); } else { combo = 0; sc = Math.max(0, sc - 5); beep(150, .15, 'sawtooth'); }
    msg('Score ' + sc + ' · streak ' + combo + ' · best ' + Math.max(hb, sc)); next();
  };
  $('#y').onclick = () => ans(true); $('#n').onclick = () => ans(false);
  document.onkeydown = e => { if (e.key == 'ArrowRight') ans(true); if (e.key == 'ArrowLeft') ans(false); };
  T = setInterval(() => {
    const left = Math.max(0, 30000 - (performance.now() - t0)); $('#bar i').style.width = left / 300 + '%';
    if (!left) { clearInterval(T); end = 1; best('colormatch', sc); msg('Time up. Score ' + sc); coins(Math.floor(sc / 10)); $('#w').textContent = 'Time up'; $('#w').style.color = '#fff'; }
  }, 100);
  msg('Does the ink color match the word? Left arrow = No, right arrow = Yes'); next();
};

/* ---------- PAC-MAN ---------- */
G['pac-man'] = () => {
  const MZ = ['###################', '#........#........#', '#o##.###.#.###.##o#', '#.................#', '#.##.#.#####.#.##.#', '#....#...#...#....#', '####.### # ###.####', '   #.#       #.#   ', '####.# ##-## #.####', '    .  #GGG#  .    ', '####.# ##### #.####', '   #.#       #.#   ', '####.# ##### #.####', '#........#........#', '#.##.###.#.###.##.#', '#o.#.....P.....#.o#', '##.#.#.#####.#.#.##', '#....#...#...#....#', '#.######.#.######.#', '#.................#', '###################'];
  const C = 19, RW = 21, S = 20, OY = 36, W = C * S, H = RW * S + OY + 8, [cv, x] = stage(W, H); P = [];
  const M = MZ.map(r => [...r]); let sx = 9, sy = 15;
  M.forEach((r, j) => r.forEach((v, i) => { if (v == 'P') { sx = i; sy = j; r[i] = ' '; } if (v == 'G') r[i] = ' '; }));
  const seen = new Set([sy * C + sx]), q = [[sx, sy]], D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (q.length) { const [a, b] = q.shift(); for (const [dx, dy] of D4) { const nx = (a + dx + C) % C, ny = b + dy; if (ny < 0 || ny >= RW || M[ny][nx] == '#' || seen.has(ny * C + nx)) continue; seen.add(ny * C + nx); q.push([nx, ny]); } }
  let pellets = 0; M.forEach((r, j) => r.forEach((v, i) => { if (v == '.' || v == 'o') { if (seen.has(j * C + i)) pellets++; else r[i] = ' '; } }));
  const base = M.map(r => r.slice()), total = pellets;
  const wall = (c, r, g) => { c = (c + C) % C; if (r < 0 || r >= RW) return 1; const v = M[r][c]; return v == '#' || (v == '-' && (!g || g.r < 9)); };
  const mk = (c, r, col, wait) => ({ c, r, dx: 0, dy: 0, p: 0, col, wait });
  let pac, gh, lives = 3, lv = 1, fright = 0, chain = 0, hold = 1500, nd = [0, 0], face = 0, over = 0, sc = 0, tk = 0; const hb = getBest('pacman');
  const reset = () => { pac = { c: sx, r: sy, dx: 0, dy: 0, p: 0 }; gh = [mk(9, 7, '#ef4444', 0), mk(8, 9, '#f9a8d4', 2000), mk(9, 9, '#22d3ee', 5000), mk(10, 9, '#fb923c', 8000)]; gh[0].dx = -1; nd = [0, 0]; fright = 0; hold = 1500; };
  const eat = () => {
    const v = M[pac.r][pac.c]; if (v != '.' && v != 'o') return; M[pac.r][pac.c] = ' '; pellets--; sc += v == 'o' ? 50 : 10; beep(v == 'o' ? 250 : (tk++ % 2 ? 420 : 380), .03, 'square', .02);
    if (v == 'o') { fright = 7000; chain = 0; }
    if (!pellets) { lv++; base.forEach((r, j) => r.forEach((c, i) => M[j][i] = c)); pellets = total; reset(); beep(900, .4, 'triangle'); }
  };
  const gch = e => {
    const op = [-e.dx, -e.dy], moving = e.dx || e.dy, opts = D4.filter(d => !wall(e.c + d[0], e.r + d[1], e) && !(moving && d[0] == op[0] && d[1] == op[1]));
    if (!opts.length) return [-e.dx, -e.dy]; const inH = e.r >= 8 && e.r <= 9 && e.c >= 8 && e.c <= 10;
    if (fright > 0 && !inH) return opts[R(opts.length)];
    let t = inH ? [9, 6] : [pac.c, pac.r];
    if (!inH) { if (e.col == '#f9a8d4') t = [pac.c + 4 * face_dx(), pac.r + 4 * face_dy()]; else if (e.col == '#22d3ee') t = [R(C), R(RW)]; else if (e.col == '#fb923c' && Math.hypot(e.c - pac.c, e.r - pac.r) < 7) t = [0, 20]; if (Math.random() < .12) return opts[R(opts.length)]; }
    return opts.reduce((m, d) => { const k = Math.hypot(e.c + d[0] - t[0], e.r + d[1] - t[1]); return k < m[0] ? [k, d] : m; }, [1e9, null])[1];
  };
  const face_dx = () => Math.round(Math.cos(face)), face_dy = () => Math.round(Math.sin(face));
  const adv = (e, v, dt, choose, arrive) => {
    if (e.dx || e.dy) e.p += v * dt;
    while (e.p >= 1 || (!e.dx && !e.dy)) {
      if (e.dx || e.dy) { e.p -= 1; e.c = (e.c + e.dx + C) % C; e.r += e.dy; if (arrive) arrive(); }
      const d = choose(e); if (d) { e.dx = d[0]; e.dy = d[1]; } else { e.dx = e.dy = 0; e.p = 0; break; }
    }
  };
  const pch = e => { if (nd[0] || nd[1]) { if (!wall(e.c + nd[0], e.r + nd[1])) return nd; } return (e.dx || e.dy) && !wall(e.c + e.dx, e.r + e.dy) ? [e.dx, e.dy] : null; };
  const KEY = { ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0], ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1] };
  document.onkeydown = e => {
    const d = KEY[e.key]; if (!d) return; e.preventDefault(); nd = d; if (hold > 0) hold = Math.min(hold, 200);
    if (pac.p > 0 && (pac.dx || pac.dy) && d[0] == -pac.dx && d[1] == -pac.dy) { pac.c = (pac.c + pac.dx + C) % C; pac.r += pac.dy; pac.dx *= -1; pac.dy *= -1; pac.p = 1 - pac.p; }
  };
  const pos = e => [(e.c + e.dx * e.p) * S + S / 2, OY + (e.r + e.dy * e.p) * S + S / 2];
  const ghost = (X, Y, e, t) => {
    x.fillStyle = fright > 0 ? (fright < 2000 && Math.floor(t / 150) % 2 ? '#fff' : '#2563eb') : e.col; x.shadowColor = x.fillStyle; x.shadowBlur = 8;
    x.beginPath(); x.arc(X, Y - 1, 8, Math.PI, 0); x.lineTo(X + 8, Y + 8); x.lineTo(X + 4, Y + 5); x.lineTo(X, Y + 8); x.lineTo(X - 4, Y + 5); x.lineTo(X - 8, Y + 8); x.closePath(); x.fill(); x.shadowBlur = 0;
    x.fillStyle = '#fff'; [-3, 3].forEach(o => { x.beginPath(); x.arc(X + o, Y - 3, 2.6, 0, 7); x.fill(); }); x.fillStyle = '#111'; [-3, 3].forEach(o => { x.beginPath(); x.arc(X + o + e.dx * 1.3, Y - 3 + e.dy * 1.3, 1.3, 0, 7); x.fill(); });
  };
  reset(); msg('Arrow keys or WASD to move, or swipe. Eat every dot and avoid the ghosts');
  loop((dt, t) => {
    if (!over) {
      if (hold > 0) hold -= dt; else {
        if (fright > 0) fright -= dt;
        adv(pac, .0058, dt, pch, eat); if (pac.dx || pac.dy) face = Math.atan2(pac.dy, pac.dx);
        gh.forEach(g => { if (g.wait > 0) { g.wait -= dt; return; } adv(g, fright > 0 ? .0036 : .0052 * (1 + .04 * lv), dt, gch); });
        const [px, py] = pos(pac);
        gh.forEach(g => {
          const [gx, gy] = pos(g); if (Math.hypot(gx - px, gy - py) > 11) return;
          if (fright > 0 && g.wait <= 0) { chain++; sc += 100 * 2 ** chain; burst(gx, gy, '#2563eb', 14); beep(700, .15, 'triangle'); Object.assign(g, { c: 9, r: 9, dx: 0, dy: 0, p: 0, wait: 1500 }); }
          else if (!fright && g.wait <= 0) { lives--; beep(110, .6, 'sawtooth'); burst(px, py, '#facc15', 20); if (lives <= 0) { over = 1; best('pacman', sc); msg('Game over. Score ' + sc); coins(Math.floor(sc / 100)); } else reset(); }
        });
      }
    }
    x.fillStyle = '#05050c'; x.fillRect(0, 0, W, H);
    M.forEach((r, j) => r.forEach((v, i) => {
      const X = i * S, Y = OY + j * S;
      if (v == '#') { x.fillStyle = '#14104a'; x.strokeStyle = '#5b4bff'; x.lineWidth = 1.5; x.beginPath(); x.roundRect(X + 2, Y + 2, S - 4, S - 4, 5); x.fill(); x.stroke(); }
      else if (v == '-') { x.fillStyle = '#f9a8d4'; x.fillRect(X, Y + 8, S, 3); }
      else if (v == '.') { x.fillStyle = '#e9d5ff'; x.fillRect(X + 9, Y + 9, 3, 3); }
      else if (v == 'o') { x.fillStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 10; x.beginPath(); x.arc(X + 10, Y + 10, 4 + Math.sin(t / 150), 0, 7); x.fill(); x.shadowBlur = 0; }
    }));
    const [px, py] = pos(pac), m = over ? .05 : (pac.dx || pac.dy) ? .05 + .25 * Math.abs(Math.sin(t / 70)) : .25;
    x.fillStyle = '#facc15'; x.shadowColor = '#facc15'; x.shadowBlur = 10; x.beginPath(); x.moveTo(px, py); x.arc(px, py, 8.5, face + m * Math.PI, face + (2 - m) * Math.PI); x.closePath(); x.fill(); x.shadowBlur = 0;
    gh.forEach(g => { const [gx, gy] = pos(g); ghost(gx, gy, g, t); }); drawP(x, dt);
    x.font = '700 16px Roboto'; x.fillStyle = '#fff'; x.fillText('Score ' + sc, 8, 24); x.textAlign = 'center'; x.fillText('Level ' + lv, W / 2, 24); x.textAlign = 'right'; x.fillStyle = '#facc15'; x.fillText('●'.repeat(Math.max(lives, 0)), W - 8, 24); x.textAlign = 'left';
    if (hold > 0 && !over) { x.fillStyle = '#facc15'; x.font = '700 14px Roboto'; x.textAlign = 'center'; x.fillText('READY!', W / 2, OY + 11.5 * S + 5); x.textAlign = 'left'; }
    if (over) banner(x, W, H, 'Game over', 'Score ' + sc + ' · best ' + Math.max(hb, sc));
  });
};

(G[document.body.dataset.game] || (() => {}))();
