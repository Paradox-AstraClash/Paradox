// Chess and UNO (vs bots). Needs games.js loaded first.
let G5 = 0; const lt = (g, f, ms) => setTimeout(() => { if (g == G5) f(); }, ms);

/* ---------- CHESS ---------- */
// CHESS-CORE-START
const Kn = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]], D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const inb = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const att = (b, s, by) => {
  const r = s >> 3, c = s & 7, pr = by == 'w' ? r + 1 : r - 1;
  for (const dc of [-1, 1]) if (inb(pr, c + dc) && b[pr * 8 + c + dc] == by + 'P') return 1;
  for (const [a, d] of Kn) if (inb(r + a, c + d) && b[(r + a) * 8 + c + d] == by + 'N') return 1;
  for (const [a, d] of D8) { let rr = r + a, cc = c + d, n = 1; while (inb(rr, cc)) { const p = b[rr * 8 + cc]; if (p) { if (p[0] == by) { const t = p[1]; if (t == 'Q' || (t == 'K' && n == 1) || (t == 'R' && (!a || !d)) || (t == 'B' && a && d)) return 1; } break; } rr += a; cc += d; n++; } }
  return 0;
};
const pseudo = (st, s) => {
  const b = st.b, p = b[s], col = p[0], t = p[1], r = s >> 3, c = s & 7, o = col == 'w' ? 'b' : 'w', out = [], add = (to, x = {}) => out.push({ f: s, t: to, ...x });
  if (t == 'P') {
    const d = col == 'w' ? -1 : 1, sr = col == 'w' ? 6 : 1, pr = col == 'w' ? 0 : 7;
    if (!b[(r + d) * 8 + c]) { add((r + d) * 8 + c, r + d == pr ? { pr: 1 } : {}); if (r == sr && !b[(r + 2 * d) * 8 + c]) add((r + 2 * d) * 8 + c, { dp: 1 }); }
    for (const dc of [-1, 1]) if (inb(r + d, c + dc)) { const to = (r + d) * 8 + c + dc; if (b[to] && b[to][0] == o) add(to, r + d == pr ? { pr: 1 } : {}); else if (to == st.ep) add(to, { ep: 1 }); }
  } else if (t == 'N' || t == 'K') {
    for (const [a, d] of (t == 'N' ? Kn : D8)) if (inb(r + a, c + d)) { const to = (r + a) * 8 + c + d; if (!b[to] || b[to][0] == o) add(to); }
    if (t == 'K') { const R0 = col == 'w' ? 56 : 0; if (s == R0 + 4 && !att(b, s, o)) {
      if (st.c[col + 'K'] && !b[R0 + 5] && !b[R0 + 6] && b[R0 + 7] == col + 'R' && !att(b, R0 + 5, o) && !att(b, R0 + 6, o)) add(R0 + 6, { ca: 1 });
      if (st.c[col + 'Q'] && !b[R0 + 3] && !b[R0 + 2] && !b[R0 + 1] && b[R0] == col + 'R' && !att(b, R0 + 3, o) && !att(b, R0 + 2, o)) add(R0 + 2, { ca: -1 });
    } }
  } else for (const [a, d] of D8) {
    if ((t == 'R' && a && d) || (t == 'B' && !(a && d))) continue; let rr = r + a, cc = c + d;
    while (inb(rr, cc)) { const to = rr * 8 + cc; if (!b[to]) add(to); else { if (b[to][0] == o) add(to); break; } rr += a; cc += d; }
  }
  return out;
};
const mv = (st, m) => {
  const b = st.b.slice(), p = b[m.f], col = p[0], c = { ...st.c }; let ep = -1;
  b[m.t] = m.pr ? col + 'Q' : p; b[m.f] = ''; if (m.ep) b[m.t + (col == 'w' ? 8 : -8)] = '';
  if (m.ca) { const R0 = col == 'w' ? 56 : 0; if (m.ca > 0) { b[R0 + 5] = b[R0 + 7]; b[R0 + 7] = ''; } else { b[R0 + 3] = b[R0]; b[R0] = ''; } }
  if (m.dp) ep = (m.f + m.t) / 2; if (p[1] == 'K') c[col + 'K'] = c[col + 'Q'] = 0;
  for (const [sq, k] of [[56, 'wQ'], [63, 'wK'], [0, 'bQ'], [7, 'bK']]) if (m.f == sq || m.t == sq) c[k] = 0;
  return { b, t: col == 'w' ? 'b' : 'w', c, ep };
};
const kg = (b, col) => b.indexOf(col + 'K'), chk = (st, col) => att(st.b, kg(st.b, col), col == 'w' ? 'b' : 'w');
const legal = st => { const o = []; st.b.forEach((p, s) => { if (p && p[0] == st.t) pseudo(st, s).forEach(m => { if (!chk(mv(st, m), st.t)) o.push(m); }); }); return o; };
const V = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };
const ev = st => { let s = 0; st.b.forEach((p, i) => { if (!p) return; const r = i >> 3, c = i & 7, k = p[1], cen = 'PNB'.includes(k) ? (7 - Math.abs(c - 3.5) - Math.abs(r - 3.5)) * 4 : 0, adv = k == 'P' ? (p[0] == 'w' ? 6 - r : r - 1) * 4 : 0; s += (p[0] == 'w' ? 1 : -1) * (V[k] + cen + adv); }); return st.t == 'w' ? s : -s; };
const nm = (st, d, a, b) => {
  const ms = legal(st); if (!ms.length) return chk(st, st.t) ? -50000 - d : 0; if (!d) return ev(st);
  ms.sort((x, y) => (st.b[y.t] ? V[st.b[y.t][1]] : 0) - (st.b[x.t] ? V[st.b[x.t][1]] : 0));
  let best = -1e9; for (const m of ms) { const v = -nm(mv(st, m), d - 1, -b, -a); if (v > best) best = v; if (best > a) a = best; if (a >= b) break; } return best;
};
const botMove = st => { let bm = null, bv = -1e9; legal(st).forEach(m => { const v = -nm(mv(st, m), 2, -1e9, 1e9) + Math.random() * 6; if (v > bv) { bv = v; bm = m; } }); return bm; };
const startPos = () => { const row = 'RNBQKBNR', b = Array(64).fill(''); for (let i = 0; i < 8; i++) { b[i] = 'b' + row[i]; b[8 + i] = 'bP'; b[48 + i] = 'wP'; b[56 + i] = 'w' + row[i]; } return { b, t: 'w', c: { wK: 1, wQ: 1, bK: 1, bQ: 1 }, ep: -1 }; };
// CHESS-CORE-END

G.chess = () => {
  const g = ++G5, GL = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' }; mount('<div id="b" class="chess"></div>');
  let st = startPos(), sel = -1, last = [-1, -1], over = 0, busy = 0; const B = $('#b');
  const draw = () => {
    const ms = sel >= 0 ? legal(st).filter(m => m.f == sel) : [], ks = chk(st, st.t) ? kg(st.b, st.t) : -1;
    B.innerHTML = st.b.map((p, i) => `<button class="sq ${((i >> 3) + (i & 7)) % 2 ? 'd' : 'l'}${i == sel ? ' sel' : ''}${last.includes(i) ? ' last' : ''}${i == ks ? ' chk' : ''}${ms.some(m => m.t == i) ? (p ? ' cap' : ' mv') : ''}${p ? ' ' + p[0] : ''}" data-i="${i}" aria-label="square ${i}">${p ? GL[p[1]] + '\uFE0E' : ''}</button>`).join('');
  };
  const end = () => {
    if (legal(st).length) return 0; over = 1;
    if (chk(st, st.t)) { const w = st.t == 'b'; msg(w ? 'Checkmate. You win!' : 'Checkmate. Bot wins'); coins(w ? 20 : 2); } else { msg('Stalemate. Draw'); coins(5); } return 1;
  };
  const play = m => {
    st = mv(st, m); last = [m.f, m.t]; sel = -1; draw(); if (end()) return;
    busy = 1; msg('Bot is thinking...');
    lt(g, () => { const bm = botMove(st); st = mv(st, bm); last = [bm.f, bm.t]; busy = 0; draw(); if (!end()) msg(chk(st, 'w') ? 'Check! Your move' : 'Your move'); }, 60);
  };
  B.onclick = e => {
    const bt = e.target.closest('button'); if (!bt || over || busy) return; const i = +bt.dataset.i, m = legal(st).find(x => x.f == sel && x.t == i);
    if (m) return play(m); sel = st.b[i] && st.b[i][0] == 'w' ? i : -1; draw();
  };
  draw(); msg('You are white. Click a piece, then a highlighted square');
};

/* ---------- UNO ---------- */
G.uno = () => {
  const g = ++G5, CL = { R: '#ef4444', Y: '#eab308', G: '#22c55e', B: '#3b82f6', W: '#1f1f2e' }, LB = { S: '⊘', R: '⇄', D: '+2', W: '★', F: '+4' }, NM = ['You', 'Bot Ada', 'Bot Max', 'Bot Zoe'];
  mount('<div id="u" class="uno"></div>'); const U = $('#u');
  let deck = [], disc = [], hands = [[], [], [], []], color, cur = 0, dir = 1, drew = 0, over = 0, pick = null;
  for (const c of 'RYGB') { deck.push({ c, v: '0' }); for (let n = 1; n < 10; n++) deck.push({ c, v: '' + n }, { c, v: '' + n }); for (const v of 'SRD') deck.push({ c, v }, { c, v }); }
  for (let i = 0; i < 4; i++) deck.push({ c: 'W', v: 'W' }, { c: 'W', v: 'F' });
  for (let i = deck.length - 1; i > 0; i--) { const j = R(i + 1); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  const top = () => disc[disc.length - 1], nxt = (p, k = 1) => ((p + dir * k) % 4 + 4) % 4;
  const draw1 = () => { if (!deck.length) { const t = disc.pop(); deck = disc.sort(() => Math.random() - .5); disc = [t]; } return deck.pop(); };
  const give = (p, n) => { for (let i = 0; i < n; i++) { const c = draw1(); if (c) hands[p].push(c); } };
  const ok = c => c.c == 'W' || c.c == color || c.v == top().v;
  for (let p = 0; p < 4; p++) give(p, 7);
  let s = draw1(); while (s.c == 'W' || isNaN(s.v)) { deck.unshift(s); s = draw1(); } disc.push(s); color = s.c;
  const ui = () => {
    const t = top(), last = hands[0].length - 1;
    U.innerHTML = `<div class="ur">${[1, 2, 3].map(p => `<div class="up${cur == p && !over ? ' on' : ''}"><b>${NM[p]}</b>🂠 ${hands[p].length}</div>`).join('')}</div>
    <div class="um"><button id="dr" class="uc back" aria-label="Draw a card">UNO</button><div class="uc big${t.c == 'W' ? ' wd' : ''}" style="--c:${CL[t.c]}"><b>${LB[t.v] || t.v}</b></div><div class="ucol" style="background:${CL[color]}" title="Current color"></div></div>
    ${pick !== null ? '<div class="upk">' + ['R', 'Y', 'G', 'B'].map(c => `<button data-c="${c}" style="--c:${CL[c]}" aria-label="Choose ${c}"></button>`).join('') + '</div>' : ''}
    <div class="uh">${hands[0].map((c, i) => `<button class="uc${c.c == 'W' ? ' wd' : ''}${cur == 0 && !over && pick === null && ok(c) && (!drew || i == last) ? '' : ' no'}" data-i="${i}" style="--c:${CL[c.c]}"><b>${LB[c.v] || c.v}</b></button>`).join('')}</div>
    ${drew ? '<button id="ps" class="btn">Pass</button>' : ''}`;
  };
  const turn = () => { ui(); if (over) return; if (cur == 0) return; lt(g, bot, 900); };
  const play = (p, i, col) => {
    const c = hands[p].splice(i, 1)[0]; disc.push(c); color = c.c == 'W' ? col : c.c; drew = 0; if (c.v == 'R') dir = -dir;
    let log = NM[p] + ' played ' + (c.c == 'W' ? 'Wild' : { R: 'Red', Y: 'Yellow', G: 'Green', B: 'Blue' }[c.c]) + ' ' + (LB[c.v] || c.v) + (c.c == 'W' ? ' (' + { R: 'Red', Y: 'Yellow', G: 'Green', B: 'Blue' }[col] + ')' : '');
    if (c.v == 'S') cur = nxt(p, 2); else if (c.v == 'D') { give(nxt(p), 2); cur = nxt(p, 2); } else if (c.v == 'F') { give(nxt(p), 4); cur = nxt(p, 2); } else cur = nxt(p);
    if (!hands[p].length) { over = 1; msg(p ? NM[p] + ' wins. Better luck next time' : 'You win!'); coins(p ? 2 : 20); ui(); return; }
    if (hands[p].length == 1) log += ' · UNO!'; msg(log); turn();
  };
  const bot = () => {
    const p = cur, h = hands[p]; let cand = h.map((c, k) => ok(c) ? k : -1).filter(k => k >= 0);
    if (!cand.length) { const c = draw1(); if (c) h.push(c); if (!c || !ok(c)) { cur = nxt(p); msg(NM[p] + ' drew a card'); return turn(); } cand = [h.length - 1]; }
    const nw = cand.filter(k => h[k].c != 'W'), pool = nw.length ? nw : cand, k = pool[R(pool.length)], cnt = { R: 0, Y: 0, G: 0, B: 0 };
    h.forEach(c => { if (c.c != 'W') cnt[c.c]++; }); play(p, k, Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]);
  };
  U.onclick = e => {
    const b = e.target.closest('button'); if (!b || over || cur != 0) return;
    if (b.id == 'dr') { if (drew || pick !== null) return; const c = draw1(); hands[0].push(c); if (c && ok(c)) { drew = 1; msg('You drew a playable card. Play it or pass'); ui(); } else { cur = nxt(0); msg('You drew a card'); turn(); } }
    else if (b.id == 'ps') { drew = 0; cur = nxt(0); msg('You passed'); turn(); }
    else if (b.dataset.c) { const i = pick; pick = null; play(0, i, b.dataset.c); }
    else if (b.dataset.i !== undefined && pick === null) { const i = +b.dataset.i, c = hands[0][i]; if (!ok(c) || (drew && i != hands[0].length - 1)) return; if (c.c == 'W') { pick = i; msg('Choose a color'); ui(); } else play(0, i); }
  };
  msg('Match the color, number, or symbol. Click the UNO pile to draw'); turn();
};

(G[document.body.dataset.game] || (() => {}))();
