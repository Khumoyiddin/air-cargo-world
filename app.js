// ============================================================================
// AirCargo World — application shell: store, router, state, utilities
// ============================================================================

/* ---------------------------------------------------------------------- */
/* Icons — minimal line-icon set, hand-authored primitives                 */
/* ---------------------------------------------------------------------- */
const ICONS = {
  box: '<path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z"/><path d="M3 7.5v9L12 21l9-4.5v-9"/><path d="M12 12v9"/>',
  route: '<circle cx="5" cy="6" r="2.2"/><circle cx="19" cy="18" r="2.2"/><path d="M5 8.2v3.6a4 4 0 0 0 4 4h6a4 4 0 0 1 4 4"/>',
  plane: '<path d="M2 16.5 22 9l-3-3-16 4-3-1.5 2 3.5-2 1.5 3 1.5Z" transform="translate(0,-1)"/><path d="M10.5 12.5 8 21l2-.6 2.2-6.6"/>',
  handshake: '<path d="M3 11l4-4 4 3 3-3 4 4"/><path d="M7 10l4 4"/><path d="M14 10l-4 4"/><path d="M3 11v3l4 4"/><path d="M21 11v3l-4 4"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
  list: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="14" y2="18"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><line x1="3" y1="12" x2="21" y2="12"/>',
  file: '<path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="16.5" x2="15" y2="16.5"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9L12 17l-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.5Z"/>',
  bell: '<path d="M6 10a6 6 0 0 1 12 0v4l1.8 3H4.2L6 14Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  menu: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>',
  close: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="20" y2="20"/>',
  chevron: '<polyline points="9 6 15 12 9 18"/>',
  check: '<polyline points="5 12.5 9.5 17 19 7"/>',
  arrow: '<line x1="4" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>',
  upload: '<path d="M12 16V5"/><polyline points="7 9 12 4 17 9"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.5-4 5-6 7.5-6s6 2 7.5 6"/>',
  bolt: '<polygon points="13 2 4 14 11 14 9 22 20 9 12 9 13 2"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><polyline points="12 7.5 12 12 15.5 14"/>',
  sparkle: '<path d="M12 3l1.6 4.9L18 9l-4.4 1.6L12 15.5 10.4 10.6 6 9l4.4-1.1L12 3Z"/><path d="M19 15l.8 2.3L22 18l-2.2.7L19 21l-.8-2.3L16 18l2.2-.7L19 15Z"/>',
  filter: '<polygon points="4 4 20 4 14 12.5 14 19 10 21 10 12.5 4 4"/>',
  chat: '<path d="M4 5h16v11H9l-5 4V5Z"/>',
  send: '<line x1="21" y1="3" x2="10" y2="14"/><polygon points="21 3 14 21 10 14 3 10 21 3"/>',
  doc: '<path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/>',
  layers: '<polygon points="12 3 21 8 12 13 3 8 12 3"/><polyline points="3 12.5 12 17.5 21 12.5"/><polyline points="3 17 12 22 21 17"/>',
  building: '<rect x="4" y="3" width="10" height="18" rx="1"/><rect x="14" y="9" width="6" height="12" rx="1"/><line x1="7" y1="7" x2="7" y2="7"/><line x1="10.5" y1="7" x2="10.5" y2="7"/>',
};
function icon(name, size=18){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]||''}</svg>`;
}

/* ---------------------------------------------------------------------- */
/* Small utilities                                                         */
/* ---------------------------------------------------------------------- */
function el(html){ const tpl = document.createElement('template'); tpl.innerHTML = html.trim(); return tpl.content.firstElementChild; }
function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmtMoney(n, cur='USD'){ return (cur==='USD'?'$':cur+' ') + Math.round(n).toLocaleString(locale()); }
function fmtDate(ts){ if(!ts) return '—'; const d = new Date(ts); return d.toLocaleDateString(locale(),{month:'short',day:'numeric',year:'numeric'}); }
function fmtDateTime(ts){ if(!ts) return '—'; const d = new Date(ts); return d.toLocaleDateString(locale(),{month:'short',day:'numeric'}) + ' · ' + d.toLocaleTimeString(locale(),{hour:'2-digit',minute:'2-digit'}); }
function timeAgo(ts){
  const s = Math.floor((Date.now()-ts)/1000);
  if (s < 60) return t('time.now');
  if (s < 3600) return t('time.m', { n: Math.floor(s/60) });
  if (s < 86400) return t('time.h', { n: Math.floor(s/3600) });
  return t('time.d', { n: Math.floor(s/86400) });
}
function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }
function initials(name){ return (name||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase(); }
function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }
function debounce(fn, ms){ let timer; return (...a)=>{ clearTimeout(timer); timer=setTimeout(()=>fn(...a), ms); }; }
// Local-time values for <input type="date"> / <input type="time">, and back to a timestamp.
function pad2(n){ return String(n).padStart(2,'0'); }
function isoDate(ts){ const d = new Date(ts); return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function isoTime(ts){ const d = new Date(ts); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
function parseLocalDateTime(date, time){
  if (!date || !time) return null;
  const [y,m,d] = date.split('-').map(Number), [hh,mm] = time.split(':').map(Number);
  const ts = new Date(y, m-1, d, hh, mm).getTime();
  return isNaN(ts) ? null : ts;
}

/* ---------------------------------------------------------------------- */
/* Store — unified data layer over the `db` capability or a local fallback */
/* ---------------------------------------------------------------------- */
const COLLECTIONS = ['users','cargoRequests','offers','charterRequests','notifications','capacity'];

const Cache = { users:[], cargoRequests:[], offers:[], charterRequests:[], notifications:[], capacity:[] };
let cacheReady = { users:false, cargoRequests:false, offers:false, charterRequests:false, notifications:false, capacity:false };

const Store = {
  backend: null, // 'db' | 'local'
  _db: null,
  _localListeners: {},

  async init(){
    try{
      if (window.claude && typeof window.claude.use === 'function'){
        const db = await window.claude.use('db');
        if (db){ this._db = db; this.backend = 'db'; return; }
      }
    }catch(e){ /* fall through to local */ }
    this.backend = 'local';
  },

  _localKey(c){ return 'acw_demo__' + c; },
  _localRead(c){
    try{ return JSON.parse(localStorage.getItem(this._localKey(c)) || '[]'); }catch(e){ return []; }
  },
  _localWrite(c, arr){
    try{ localStorage.setItem(this._localKey(c), JSON.stringify(arr)); }catch(e){}
    (this._localListeners[c]||[]).forEach(cb => { try{ cb(arr); }catch(e){} });
  },

  async add(collection, data){
    if (this.backend === 'db'){
      const ref = await this._db.collection(collection).add(data);
      return ref.id;
    }
    const arr = this._localRead(collection);
    const id = uid(collection.slice(0,3));
    arr.push({ id, ...data });
    this._localWrite(collection, arr);
    return id;
  },

  async set(collection, id, data){
    if (this.backend === 'db'){ return this._db.collection(collection).doc(id).set(data); }
    const arr = this._localRead(collection);
    const i = arr.findIndex(d => d.id === id);
    if (i >= 0) arr[i] = { id, ...data }; else arr.push({ id, ...data });
    this._localWrite(collection, arr);
  },

  async update(collection, id, patch){
    if (this.backend === 'db'){
      try{ await this._db.collection(collection).doc(id).update(patch); }
      catch(e){ await this._db.collection(collection).doc(id).set(patch); }
      return;
    }
    const arr = this._localRead(collection);
    const i = arr.findIndex(d => d.id === id);
    if (i >= 0) arr[i] = { ...arr[i], ...patch };
    this._localWrite(collection, arr);
  },

  async get(collection, id){
    if (this.backend === 'db'){
      const snap = await this._db.collection(collection).doc(id).get();
      return snap.exists ? { id: snap.id, ...snap.data() } : null;
    }
    const arr = this._localRead(collection);
    return arr.find(d => d.id === id) || null;
  },

  // Demo data (ids starting "seed_"). putSeed writes a collection's seed rows, replacing earlier ones locally.
  async putSeed(collection, docs){
    if (this.backend === 'db'){
      // Retry transient failures with a growing, jittered delay so one hiccup doesn't leave a half-written demo.
      for (const { id, ...data } of docs){
        for (let attempt = 0; ; attempt++){
          try{ await this._db.collection(collection).doc(id).set(data); break; }
          catch(e){
            if (attempt >= 3) throw e;
            await new Promise(r => setTimeout(r, 300 * 2 ** attempt * (0.5 + Math.random())));
          }
        }
      }
      return;
    }
    const own = this._localRead(collection).filter(d => !String(d.id).startsWith('seed_'));
    this._localWrite(collection, [...docs, ...own]);
  },
  // Local backend only: rewrite every row of a collection through fn (used to keep demo dates recent).
  mapLocal(collection, fn){
    this._localWrite(collection, this._localRead(collection).map(fn));
  },

  // Subscribe to a whole collection; cb receives an array of {id,...}.
  subscribe(collection, cb){
    if (this.backend === 'db'){
      return this._db.collection(collection).onSnapshot(
        snap => cb(snap.docs.map(d => ({ id:d.id, ...d.data() }))),
        () => cb(this.backend==='db' ? [] : this._localRead(collection))
      );
    }
    this._localListeners[collection] = this._localListeners[collection] || [];
    const wrapped = (arr) => cb(arr);
    this._localListeners[collection].push(wrapped);
    cb(this._localRead(collection));
    return () => {
      this._localListeners[collection] = (this._localListeners[collection]||[]).filter(f => f !== wrapped);
    };
  },

  subscribeAll(){
    COLLECTIONS.forEach(c => {
      this.subscribe(c, (arr) => {
        Cache[c] = arr;
        cacheReady[c] = true;
        scheduleRender();
      });
    });
  },
};

/* ---------------------------------------------------------------------- */
/* Session / current user                                                  */
/* ---------------------------------------------------------------------- */
const Session = {
  get userId(){ try{ return localStorage.getItem('acw_session_uid'); }catch(e){ return null; } },
  set(uidVal){ try{ localStorage.setItem('acw_session_uid', uidVal); }catch(e){} },
  clear(){ try{ localStorage.removeItem('acw_session_uid'); }catch(e){} },
  get user(){ return Cache.users.find(u => u.id === this.userId) || null; },
};

/* ---------------------------------------------------------------------- */
/* Router                                                                   */
/* ---------------------------------------------------------------------- */
const Router = {
  route: { name:'landing', params:{} },
  parse(){
    const hash = location.hash.replace(/^#\/?/, '');
    const parts = hash.split('/').filter(Boolean);
    if (!parts.length) return { name: Session.userId ? 'dashboard' : 'landing', params:{} };
    const name = parts[0];
    const params = {};
    if (parts[1]) params.id = decodeURIComponent(parts[1]);
    return { name, params };
  },
  navigate(path){ location.hash = path; },
  go(name, id){ location.hash = '#/' + name + (id ? '/' + encodeURIComponent(id) : ''); },
};
window.addEventListener('hashchange', () => { Router.route = Router.parse(); render(); window.scrollTo(0,0); });

/* ---------------------------------------------------------------------- */
/* Toasts                                                                   */
/* ---------------------------------------------------------------------- */
// `html` must already be HTML-safe (t() output is: its parameters are escaped).
function toast(html, kind){
  let stack = qs('.toast-stack');
  if (!stack){ stack = el('<div class="toast-stack" role="status" aria-live="polite"></div>'); document.body.appendChild(stack); }
  const node = el(`<div class="toast">${icon(kind==='error'?'close':'check',15)}<span>${html}</span></div>`);
  stack.appendChild(node);
  setTimeout(() => { node.style.opacity='0'; node.style.transition='opacity .25s'; setTimeout(()=>node.remove(), 260); }, 3200);
}

/* ---------------------------------------------------------------------- */
/* Modal                                                                    */
/* ---------------------------------------------------------------------- */
function openModal(innerHtml){
  closeModal();
  const backdrop = el(`<div class="modal-backdrop" id="acw-modal"><div class="modal">${innerHtml}</div></div>`);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
  document.body.appendChild(backdrop);
}
function closeModal(){ const m = qs('#acw-modal'); if (m) m.remove(); }

/* ---------------------------------------------------------------------- */
/* Render scheduling                                                       */
/* ---------------------------------------------------------------------- */
let renderScheduled = false;
function scheduleRender(){
  if (renderScheduled) return;
  renderScheduled = true;
  requestAnimationFrame(() => {
    renderScheduled = false;
    // Don't nuke an in-progress form (ids 'new', 'new-flight', 'new-space') when a background snapshot arrives.
    if (/^new/.test(Router.route.params?.id || '')) return;
    render();
  });
}

function render(){
  const root = qs('#app');
  if (!root) return;
  const scrollY = window.scrollY;
  const { name } = Router.route;

  const authed = !!Session.user;
  const appRoutes = ['dashboard','my-cargo','marketplace','tender','charter','charter-detail','capacity','capacity-detail','contracts','notifications'];

  if (authed && appRoutes.includes(name)){
    root.innerHTML = renderAppShell();
    afterRenderAppShell();
    renderChat(true);
    window.scrollTo(0, scrollY);
    return;
  }
  if (authed){
    // Unknown or retired route (e.g. an old bookmark): fall back to the dashboard.
    Router.route = { name:'dashboard', params:{} };
    try{ history.replaceState(null, '', '#/dashboard'); }catch(e){}
    root.innerHTML = renderAppShell();
    afterRenderAppShell();
    renderChat(true);
    return;
  }

  if (name === 'register'){ root.innerHTML = renderRegister(); renderChat(false); return; }
  if (name === 'login'){ root.innerHTML = renderLoginPage(); renderChat(false); return; }

  root.innerHTML = renderLanding();
  renderChat(true);
  setupHowVideo();
}

/* ---------------------------------------------------------------------- */
/* Boot                                                                     */
/* ---------------------------------------------------------------------- */
async function boot(){
  applyLangAttr();
  Router.route = Router.parse();
  const root = qs('#app');
  root.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-family:var(--font-mono);font-size:13px;">${t('loading')}</div>`;
  await Store.init();
  try{ await Seed.ensure(); }catch(e){ /* the app works without demo data */ }
  Store.subscribeAll();
  // small grace period so first snapshot(s) arrive before first paint
  setTimeout(render, 60);
  render();

  const chatRoot = qs('#chat-root');
  [root, chatRoot].forEach(r => {
    if (!r) return;
    r.addEventListener('click', onGlobalClick);
    r.addEventListener('submit', onGlobalSubmit);
    r.addEventListener('input', onGlobalInput);
    r.addEventListener('change', onGlobalChange);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  if (window.claude?.hot?.ready) window.claude.hot.ready(()=>{});
}
document.addEventListener('DOMContentLoaded', boot);
