// Headless bot simulation: runs full games with window.__AUTO=true (every
// player is a bot) and checks for script errors and rule violations.
// Usage: node test/sim.js [gamesPerPlayerCount]   (default 100)
const fs = require('fs'), path = require('path'), vm = require('vm');
const N = +process.argv[2] || 100;
// Node < 12 lacks Object.fromEntries (all current browsers have it).
const POLYFILL = 'if(!Object.fromEntries)Object.fromEntries=e=>{const o={};for(const[k,v]of e)o[k]=v;return o};\n';
// One game file for every screen (the old phone/ and pc/ folders only redirect).
const editions = ['.'];
const PTS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 10, 6: 15, 7: 18, 8: 21 };
let failures = 0;

function runGame(src, nb) {
  return new Promise(resolve => {
    const errors = [];
    let finished = false;
    const ctx = {
      window: { __AUTO: true, __NB: nb },
      // Bots only ever wait 0 ms in AUTO mode, so run callbacks immediately
      // instead of waiting for the ~15 ms Windows timer tick.
      document: {}, setTimeout: f => setImmediate(f), clearTimeout: () => {},
      console: { log: () => { finished = true; }, error: m => errors.push(String(m)), warn: () => {} },
    };
    vm.createContext(ctx);
    process.removeAllListeners('unhandledRejection');
    process.on('unhandledRejection', e => errors.push(String(e && e.stack || e)));
    try { vm.runInContext(POLYFILL + src +'\n;this.__G=()=>G;', ctx); } catch (e) { errors.push(String(e.stack || e)); }
    const t0 = Date.now();
    (function wait() {
      const G = ctx.__G && ctx.__G();
      if (errors.length || (G && G.over) || Date.now() - t0 > 20000) return resolve({ G, errors, finished });
      setImmediate(wait);
    })();
  });
}

function check(G, nb) {
  const bad = [];
  const n = nb + 1, startTrains = { 2: 30, 3: 27, 4: 24 }[n];
  if (!G.over) bad.push('game did not finish');
  let cards = G.deck.length + G.disc.length + G.face.length;
  G.players.forEach((p, i) => {
    const own = G.routes.filter(r => r.owner === i);
    const used = own.reduce((s, r) => s + r.len, 0);
    if (p.trains < 0) bad.push(`${p.name} has ${p.trains} trains`);
    if (p.trains !== startTrains - used) bad.push(`${p.name} trains ${p.trains} != ${startTrains}-${used}`);
    const pts = own.reduce((s, r) => s + PTS[r.len], 0);
    if (p.score !== pts) bad.push(`${p.name} route score ${p.score} != ${pts}`);
    if (p.stations.length > 3) bad.push(`${p.name} has ${p.stations.length} stations`);
    for (const k in p.hand) { if (p.hand[k] < 0) bad.push(`${p.name} has ${p.hand[k]} ${k}`); cards += p.hand[k]; }
    if (p.tickets.length < 2) bad.push(`${p.name} kept only ${p.tickets.length} tickets`);
  });
  if (cards !== 110) bad.push(`card count ${cards} != 110`);
  const st = G.players.flatMap(p => p.stations);
  if (new Set(st).size !== st.length) bad.push('two stations in one city');
  if (G.face.length > 5) bad.push('more than 5 face-up cards');
  return bad;
}

(async () => {
  for (const ed of editions) {
    const html = fs.readFileSync(path.join(__dirname, '..', ed, 'index.html'), 'utf8');
    const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];
    for (const nb of [1, 2, 3]) {
      let ok = 0, bad = 0, turnsLog = 0;
      for (let g = 0; g < N; g++) {
        const { G, errors } = await runGame(src, nb);
        const issues = errors.concat(G ? check(G, nb) : ['no game state']);
        if (issues.length) { bad++; failures++; if (bad <= 3) console.log(`  [${ed === '.' ? 'game' : ed} ${nb + 1}p game ${g}] ${issues.join('; ')}`); }
        else { ok++; turnsLog += G.log.length; }
      }
      console.log(`${(ed === '.' ? 'game' : ed).padEnd(6)} ${nb + 1} players: ${ok}/${N} games clean${bad ? `, ${bad} with problems` : ''}`);
    }
  }
  console.log(failures ? `FAILED: ${failures} game(s) with problems` : 'ALL CLEAN');
  process.exit(failures ? 1 : 0);
})();
