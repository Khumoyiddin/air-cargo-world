// ============================================================================
// AirCargo World — views, event handling & feature logic
// Every label comes from i18n.js via t() (keys) and tv() (stored values).
// ============================================================================

const MILESTONE_COUNT = 7;

let wizardDocs = [];
let marketFilters = { q:'', origin:'', dg:'' };
let chatOpen = false;
let notifOpen = false;
let sidebarOpen = false;
let chatMessages = [{ role:'bot', key:'chat.greet' }];
let chatRenderedKey = '';
let howObserver = null;

/* ---------------------------------------------------------------------- */
/* Helpers over Cache                                                       */
/* ---------------------------------------------------------------------- */
function me(){ return Session.user; }
function apCity(a){ return LANG==='ru' ? a.cityRu : a.city; }
function apCountry(a){ return LANG==='ru' ? a.countryRu : a.country; }
function airportLabel(code){ const a = AIRPORT_BY_CODE[code]; return a ? `${apCity(a)} (${a.code})` : code; }
function airportOptions(selected){
  return AIRPORTS.map(a => `<option value="${a.code}" ${a.code===selected?'selected':''}>${a.code} — ${apCity(a)}, ${apCountry(a)}</option>`).join('');
}
function roleLabel(role){ return ROLES[role] ? t('role.'+role) : esc(role || '—'); }
function myCargoRequests(){ return Cache.cargoRequests.filter(r=>r.ownerId===me().id).sort((a,b)=>b.createdAt-a.createdAt); }
function openMarketCargo(){ const u = me(); return Cache.cargoRequests.filter(r=>r.status==='open' && (!u || r.ownerId!==u.id)); }
function offersFor(requestId, requestType){ return Cache.offers.filter(o=>o.requestId===requestId && o.requestType===requestType); }
function myOffers(){ return Cache.offers.filter(o=>o.providerId===me().id); }
function myCharterRequests(){ return Cache.charterRequests.filter(r=>r.ownerId===me().id).sort((a,b)=>b.createdAt-a.createdAt); }
function openMarketCharter(){ const u = me(); return Cache.charterRequests.filter(r=>r.status==='open' && (!u || r.ownerId!==u.id)); }
function myNotifications(){ return Cache.notifications.filter(n=>n.userId===me().id).sort((a,b)=>b.createdAt-a.createdAt); }
function unreadCount(){ return myNotifications().filter(n=>!n.read).length; }
function awardedOfferOf(request){ return Cache.offers.find(o=>o.id===request.awardedOfferId) || null; }
function requestById(id){ return Cache.cargoRequests.find(r=>r.id===id) || Cache.charterRequests.find(r=>r.id===id) || null; }
function isShipmentActive(r){ return !!r && r.status==='awarded' && (r.trackingStage||0) < MILESTONE_COUNT; }
function routeText(r){ return `${r.origin} → ${r.destination}`; }
// Notifications are stored as a message key plus parameters, so they follow the language switch.
async function notify(userId, key, params){
  if (!userId) return;
  try{ await Store.add('notifications', { userId, key, params: params || {}, read:false, createdAt: Date.now() }); }catch(e){}
}
function notifText(n){ return n.key ? t(n.key, n.params || {}) : esc(n.text || ''); }

/* ---------------------------------------------------------------------- */
/* Shared fragments                                                         */
/* ---------------------------------------------------------------------- */
function badgeForStatus(status){
  const cls = { open:'badge-accent', closed:'badge-amber', awarded:'badge-teal' }[status];
  return cls ? `<span class="badge ${cls}"><span class="badge-dot"></span>${t('status.'+status)}</span>`
             : `<span class="badge badge-neutral">${esc(status)}</span>`;
}
function roleBadge(role){ return `<span class="badge badge-neutral">${roleLabel(role)}</span>`; }
function emptyState(html, actionHtml){
  return `<div class="empty-state">${icon('box',30)}<p>${html}</p>${actionHtml||''}</div>`;
}
function brandLockup(size){
  return `<div class="brand" data-action="go-home" style="cursor:pointer;">
    <span class="brand-mark">${icon('globe', size || 17)}</span> ${t('brand')}</div>`;
}
function langSwitch(){
  return `<div class="lang-switch" role="group" aria-label="${t('lang.label')}">
    ${['en','ru'].map(l => `<button type="button" class="${LANG===l?'active':''}" data-action="set-lang" data-lang="${l}" aria-pressed="${LANG===l}">${l.toUpperCase()}</button>`).join('')}
  </div>`;
}

/* ---------------------------------------------------------------------- */
/* Landing / marketing                                                      */
/* ---------------------------------------------------------------------- */
function renderLanding(){
  return `
  <nav class="nav-marketing"><div class="container nav-marketing-inner">
    ${brandLockup()}
    <div class="nav-links">
      <a href="#features" class="nl-item" data-action="scroll-to" data-target="features">${t('nav.platform')}</a>
      <a href="#roles" class="nl-item" data-action="scroll-to" data-target="roles">${t('nav.roles')}</a>
      <a href="#how" class="nl-item" data-action="scroll-to" data-target="how">${t('nav.how')}</a>
      ${langSwitch()}
      <button class="btn btn-ghost btn-sm" data-action="go-login">${t('nav.login')}</button>
      <button class="btn btn-primary btn-sm" data-action="go-register">${t('nav.getStarted')}</button>
    </div>
  </div></nav>

  <header class="hero"><div class="container hero-grid">
    <div>
      <span class="eyebrow">${t('hero.eyebrow')}</span>
      <h1 style="margin-top:14px;">${t('hero.title')}</h1>
      <p class="hero-sub">${t('hero.sub')}</p>
      <div class="hero-cta">
        <button class="btn btn-primary" data-action="go-register">${icon('bolt',16)} ${t('hero.cta')}</button>
        <button class="btn btn-ghost" data-action="go-login">${t('hero.login')}</button>
      </div>
      <div class="hero-tags">
        <span class="demo-tag">${t('hero.tagDemo')}</span>
        <span class="demo-tag">${t('hero.tagData')}</span>
      </div>
    </div>
    ${heroPreview()}
  </div></header>

  <section class="section" id="features"><div class="container">
    <div class="section-head"><span class="eyebrow">${t('problem.eyebrow')}</span>
      <h2>${t('problem.title')}</h2>
      <p>${t('problem.sub')}</p>
    </div>
    <div class="grid-3">${[1,2,3].map(roleProblemCard).join('')}</div>
  </div></section>

  <section class="section" style="background:var(--surface-2);"><div class="container split">
    <div class="section-head" style="margin-bottom:0;"><span class="eyebrow">${t('arch.eyebrow')}</span>
      <h2>${t('arch.title')}</h2>
      <p>${t('arch.sub')}</p>
    </div>
    <div class="layer-stack">
      ${[['grid',1],['clock',2],['file',3],['route',4],['sparkle',5]].map(([ic,i]) => layerRow(ic, i)).join('')}
    </div>
  </div></section>

  <section class="section" id="roles"><div class="container">
    <div class="section-head"><span class="eyebrow">${t('roles.eyebrow')}</span>
      <h2>${t('roles.title')}</h2>
    </div>
    <div class="role-grid">
      ${Object.keys(ROLES).map(k => `
        <div class="role-card">
          <div class="role-icon">${icon(ROLES[k].icon,19)}</div>
          <h3 style="font-size:16px;">${t('role.'+k)}</h3>
          <p class="muted" style="font-size:13px;">${t('roleBlurb.'+k)}</p>
        </div>`).join('')}
    </div>
  </div></section>

  <section class="section" style="background:var(--surface-2);"><div class="container" style="text-align:center;">
    <span class="eyebrow">${t('vision.eyebrow')}</span>
    <h2 style="margin-top:10px; font-size:clamp(24px,4vw,38px);">${t('vision.title')}</h2>
    <div style="margin-top:26px;"><button class="btn btn-primary" data-action="go-register">${icon('bolt',16)} ${t('vision.cta')}</button></div>
  </div></section>

  <section class="section" id="how"><div class="container">
    <div class="section-head centered">
      <span class="eyebrow">${t('how.eyebrow')}</span>
      <h2>${t('how.title')}</h2>
      <p>${t('how.sub')}</p>
    </div>
    <div class="video-frame">
      <video id="how-video" controls muted playsinline loop preload="metadata"
        poster="media/how-it-works-${LANG}.jpg" aria-label="${t('how.aria')}">
        <source src="media/how-it-works-${LANG}.mp4" type="video/mp4">
        <source src="media/how-it-works-${LANG}.webm" type="video/webm">
      </video>
    </div>
  </div></section>

  <footer class="site-footer"><div class="container footer-grid">
    <div class="brand" style="font-size:15px;"><span class="brand-mark">${icon('globe',15)}</span> ${t('brand')}</div>
    <span class="faint" style="font-size:12.5px;">${t('footer.note')}</span>
  </div></footer>
  `;
}

function heroPreview(){
  const rows = [
    { tag:'bestPrice',   ic:'bolt',    name:'Harborline Cargo Solutions', price:4150, days:5, svc:'Standard' },
    { tag:'bestOverall', ic:'sparkle', name:'Meridian Air Logistics',     price:4480, days:3, svc:'Priority', featured:true },
    { tag:'premium',     ic:'star',    name:'Northbridge Air Freight',    price:5020, days:2, svc:'Premium' },
  ];
  return `<div class="preview-panel">
    <div class="preview-head">
      <div>
        <span class="eyebrow">${t('pv.eyebrow')}</span>
        <div class="mono" style="font-size:20px; font-weight:600; margin-top:4px;">TAS → FRA</div>
        <p class="faint" style="font-size:12px; margin-top:2px;">${t('pv.meta')}</p>
      </div>
      <span class="badge badge-amber"><span class="badge-dot"></span>${t('status.closed')}</span>
    </div>
    <div class="preview-body">
      <div style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600;">
        ${icon('sparkle',15)} ${t('pv.top3')} <span class="faint" style="font-weight:500;">· ${t('pv.compared')}</span>
      </div>
      ${rows.map(r => `
        <div class="pv-row ${r.featured?'featured':''}">
          <div class="pv-main">
            <span class="badge badge-accent">${icon(r.ic,12)} ${t('tag.'+r.tag)}</span>
            <b style="font-size:13.5px;">${r.name}</b>
          </div>
          <div class="pv-nums mono"><span>${fmtMoney(r.price)}</span><span class="faint" style="font-size:11.5px;">${t('unit.daysShort',{n:r.days})} · ${tv(r.svc)}</span></div>
          ${r.featured ? `<p class="pv-note">${t('pv.note')}</p>` : ''}
        </div>`).join('')}
    </div>
    <div class="preview-foot">
      <span class="faint" style="font-size:12px;">${t('pv.example')}</span>
      <span class="badge badge-neutral">${t('pv.illustrative')}</span>
    </div>
  </div>`;
}
function roleProblemCard(i){
  return `<div class="card"><b style="font-size:14.5px;">${t(`problem.${i}.title`)}</b>
    <p class="muted" style="font-size:13px; margin-top:8px;">${t(`problem.${i}.problem`)}</p>
    <hr class="divider" style="margin:12px 0;">
    <p style="font-size:13px;">${t(`problem.${i}.value`)}</p></div>`;
}
function layerRow(iconName, i){
  return `<div class="layer-row"><div class="role-icon">${icon(iconName,17)}</div>
    <div><b style="font-size:14px;">${t(`layer.${i}.title`)}</b><p class="muted" style="font-size:12.5px; margin-top:2px;">${t(`layer.${i}.body`)}</p></div></div>`;
}
function setupHowVideo(){
  if (howObserver){ howObserver.disconnect(); howObserver = null; }
  const v = qs('#how-video');
  if (!v || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Start (muted) the first time the video is mostly on screen; after that the viewer is in control.
  howObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.intersectionRatio >= 0.5){
        const p = v.play(); if (p && p.catch) p.catch(() => {});
        howObserver.disconnect(); howObserver = null;
      }
    });
  }, { threshold: [0.5] });
  howObserver.observe(v);
}

/* ---------------------------------------------------------------------- */
/* Register / Login                                                         */
/* ---------------------------------------------------------------------- */
function authTop(){
  return `<div class="auth-top">${brandLockup()}${langSwitch()}</div>`;
}
function renderRegister(){
  return `<div class="auth-wrap"><div class="auth-card">
    ${authTop()}
    <div class="auth-panel">
      <h2 style="font-size:21px;">${t('reg.title')}</h2>
      <p class="muted" style="font-size:13px; margin-top:6px;">${t('reg.sub')}</p>
      <form data-form="register" style="display:flex; flex-direction:column; gap:16px; margin-top:20px;">
        <div class="field"><label>${t('reg.role')}</label>
          <div class="chip-select" data-chip-group="reg-role">
            ${Object.keys(ROLES).map((k,i)=>`<button type="button" class="chip ${i===0?'active':''}" data-action="pick-chip" data-group="reg-role" data-value="${k}" data-target="#reg-role">${t('role.'+k)}</button>`).join('')}
          </div>
          <input type="hidden" id="reg-role" value="cargo_owner">
        </div>
        <div class="field"><label for="reg-company">${t('reg.company')}</label>
          <input id="reg-company" required placeholder="${t('reg.companyPh')}"></div>
        <div class="grid-2">
          <div class="field"><label for="reg-country">${t('reg.country')}</label><input id="reg-country" required placeholder="${t('reg.countryPh')}"></div>
          <div class="field"><label for="reg-email">${t('reg.email')}</label><input id="reg-email" type="email" required placeholder="you@company.com"></div>
        </div>
        <div id="reg-error" class="badge badge-red hidden" style="align-self:flex-start;"></div>
        <button class="btn btn-primary btn-block" type="submit">${icon('arrow',16)} ${t('reg.submit')}</button>
      </form>
      <p class="legal-note" style="margin-top:16px;">${t('reg.note')}</p>
    </div>
    <p class="faint" style="text-align:center; font-size:13px;">${t('reg.have')} <span class="kicker-link" data-action="go-login" style="cursor:pointer;">${t('reg.login')}</span></p>
  </div></div>`;
}

function renderLoginPage(){
  const companies = Cache.users.filter(u=>!u.seed).sort((a,b)=>b.createdAt-a.createdAt);
  return `<div class="auth-wrap"><div class="auth-card">
    ${authTop()}
    <div class="auth-panel">
      <h2 style="font-size:21px;">${t('login.title')}</h2>
      <p class="muted" style="font-size:13px; margin-top:6px;">${t('login.sub')}</p>
      <div style="margin-top:18px; display:flex; flex-direction:column;">
        ${companies.length ? companies.map(u => `
          <div class="list-row">
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="avatar">${esc(initials(u.companyName))}</span>
              <div><b style="font-size:13.5px;">${esc(u.companyName)}</b>
                <div class="faint" style="font-size:12px;">${roleLabel(u.role)} · ${esc(u.country||'—')}</div></div>
            </div>
            <button class="btn btn-soft btn-sm" data-action="do-login" data-id="${esc(u.id)}">${t('login.continue')}</button>
          </div>`).join('') : emptyState(t('login.empty'))}
      </div>
    </div>
    <p class="faint" style="text-align:center; font-size:13px;">${t('login.new')} <span class="kicker-link" data-action="go-register" style="cursor:pointer;">${t('login.register')}</span></p>
  </div></div>`;
}

/* ---------------------------------------------------------------------- */
/* App shell                                                                 */
/* ---------------------------------------------------------------------- */
function renderAppShell(){
  const u = me();
  const nav = ROLE_NAV[u.role] || [];
  return `
  <div class="scrim ${sidebarOpen?'show':''}" data-action="close-sidebar"></div>
  <div class="app-shell">
    <aside class="sidebar ${sidebarOpen?'open':''}">
      ${brandLockup(15)}
      ${navGroup(nav)}
    </aside>
    <div class="main">
      <div class="topbar">
        <div class="topbar-left">
          <button class="icon-btn mobile-nav-toggle" data-action="toggle-sidebar" aria-label="${t('shell.menu')}">${icon('menu',18)}</button>
          <h2>${t('route.'+Router.route.name)}</h2>
        </div>
        <div class="topbar-right">
          ${langSwitch()}
          <div style="position:relative;">
            <button class="icon-btn" data-action="toggle-notif-panel" aria-label="${t('notif.title')}">${icon('bell',18)}</button>
            ${unreadCount()>0?`<span class="badge badge-red" style="position:absolute; top:-6px; right:-6px; padding:1px 5px; font-size:10px;">${unreadCount()}</span>`:''}
            ${notifOpen ? renderNotifDropdown() : ''}
          </div>
          <div class="user-chip" title="${esc(u.companyName)}">
            <span class="avatar">${esc(initials(u.companyName))}</span>
            <div class="user-chip-text" style="line-height:1.2; max-width:120px; overflow:hidden;">
              <div style="font-size:12.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(u.companyName)}</div>
              <div class="faint" style="font-size:10.5px; white-space:nowrap;">${roleLabel(u.role)}</div>
            </div>
            <button class="icon-btn" style="width:26px;height:26px; flex-shrink:0;" title="${t('shell.logout')}" aria-label="${t('shell.logout')}" data-action="logout">${icon('logout',13)}</button>
          </div>
        </div>
      </div>
      <div class="content">${viewFor(Router.route.name, Router.route.params.id)}</div>
    </div>
  </div>
  `;
}
function navGroup(nav){
  return nav.map(key => `<a href="#/${key}" class="side-link ${Router.route.name===key?'active':''}">${icon(navIcon(key),17)} ${t('route.'+key)}</a>`).join('')
    + `<div class="side-sep"></div><a href="#/notifications" class="side-link ${Router.route.name==='notifications'?'active':''}">${icon('bell',17)} ${t('route.notifications')} ${unreadCount()>0?`<span class="badge badge-red" style="margin-left:auto;">${unreadCount()}</span>`:''}</a>`;
}
function navIcon(key){
  return { dashboard:'grid', 'my-cargo':'box', marketplace:'list', charter:'plane', contracts:'file' }[key] || 'grid';
}

function renderNotifDropdown(){
  const list = myNotifications().slice(0,8);
  return `<div class="card card-flush" style="position:absolute; right:0; top:44px; width:320px; max-width:calc(100vw - 32px); z-index:60; box-shadow:var(--shadow-lg); max-height:360px; overflow-y:auto;">
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 14px; border-bottom:1px solid var(--border);">
      <b style="font-size:13px;">${t('notif.title')}</b>
      <button class="btn btn-ghost btn-sm" style="padding:3px 9px;" data-action="mark-all-read">${t('notif.markAll')}</button>
    </div>
    ${list.length ? list.map(n=>`
      <div class="list-row" style="padding:10px 14px;" data-action="mark-notif-read" data-id="${esc(n.id)}">
        <div style="display:flex; gap:8px; align-items:flex-start;">
          ${!n.read?'<span class="badge-dot" style="background:var(--accent); margin-top:6px;"></span>':'<span style="width:6px;"></span>'}
          <div><p style="font-size:12.5px;">${notifText(n)}</p><span class="faint" style="font-size:11px;">${timeAgo(n.createdAt)}</span></div>
        </div>
      </div>`).join('') : `<p class="faint" style="padding:16px; font-size:12.5px;">${t('notif.empty')}</p>`}
  </div>`;
}

/* ---------------------------------------------------------------------- */
/* Content router                                                            */
/* ---------------------------------------------------------------------- */
function viewFor(name, id){
  switch(name){
    case 'dashboard': return viewDashboard();
    case 'my-cargo': return id==='new' ? viewCargoWizard() : viewCargoList();
    case 'marketplace': return viewMarketplace();
    case 'tender': return viewCargoDetail(id);
    case 'charter': return id==='new' ? viewCharterForm() : viewCharterList();
    case 'charter-detail': return viewCharterDetail(id);
    case 'contracts': return viewContracts();
    case 'notifications': return viewNotifications();
    default: return viewDashboard();
  }
}

/* ---------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* ---------------------------------------------------------------------- */
function viewDashboard(){
  const u = me();
  const isOwner = u.role==='cargo_owner';
  const canCharter = ['cargo_owner','forwarder'].includes(u.role);
  const mine = isOwner ? myCargoRequests() : [];
  const myRequests = [...myCargoRequests(), ...myCharterRequests()];
  const offers = myOffers();
  const won = offers.filter(o => requestById(o.requestId)?.awardedOfferId === o.id);

  const stats = isOwner ? [
    ['stat.openRequests', myRequests.filter(r=>r.status==='open').length, 'box'],
    ['stat.offersReceived', Cache.offers.filter(o=>myRequests.some(r=>r.id===o.requestId)).length, 'list'],
    ['stat.awarded', myRequests.filter(r=>r.status==='awarded').length, 'check'],
    ['stat.inTransit', myRequests.filter(isShipmentActive).length, 'plane'],
  ] : [
    ['stat.openOpps', openMarketCargo().length + openMarketCharter().length, 'list'],
    ['stat.offersSubmitted', offers.length, 'route'],
    ['stat.offersWon', won.length, 'sparkle'],
    ['stat.activeShipments', won.filter(o => isShipmentActive(requestById(o.requestId))).length, 'plane'],
  ];
  const recent = myNotifications().slice(0,5);

  return `
  <div class="stat-grid">
    ${stats.map(([key,num,ic])=>`<div class="stat-tile">${icon(ic,16)}<span class="num">${num}</span><span class="label">${t(key)}</span></div>`).join('')}
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="section-title"><b style="font-size:14.5px;">${t('dash.quick')}</b></div>
      <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:14px;">
        ${isOwner ? `<button class="btn btn-primary btn-sm" data-action="nav" data-route="my-cargo" data-id="new">${icon('plus',15)} ${t('dash.newCargo')}</button>` : ''}
        ${canCharter ? `<button class="btn btn-soft btn-sm" data-action="nav" data-route="charter" data-id="new">${icon('plus',15)} ${t('dash.newCharter')}</button>` : ''}
        <button class="btn btn-ghost btn-sm" data-action="nav" data-route="marketplace">${icon('list',15)} ${t('dash.browseMarket')}</button>
        ${!canCharter ? `<button class="btn btn-ghost btn-sm" data-action="nav" data-route="charter">${icon('plane',15)} ${t('dash.browseCharter')}</button>` : ''}
        <button class="btn btn-ghost btn-sm" data-action="nav" data-route="contracts">${icon('file',15)} ${t('dash.contracts')}</button>
      </div>
    </div>
    <div class="card">
      <b style="font-size:14.5px;">${t('dash.recent')}</b>
      <div style="margin-top:8px;">
        ${recent.length ? recent.map(n=>`
          <div class="list-row"><span style="font-size:12.5px;">${notifText(n)}</span><span class="faint" style="font-size:11px; white-space:nowrap;">${timeAgo(n.createdAt)}</span></div>`).join('')
          : emptyState(t('dash.recentEmpty'))}
      </div>
    </div>
  </div>

  ${isOwner ? `<div class="card">
    <div class="section-title"><b style="font-size:14.5px;">${t('dash.myRecent')}</b>
      <button class="btn btn-ghost btn-sm" data-action="nav" data-route="my-cargo">${t('dash.viewAll')}</button></div>
    ${mine.length ? requestTable(mine.slice(0,5), 'tender') : emptyState(t('dash.noRequests'), `<button class="btn btn-primary btn-sm" data-action="nav" data-route="my-cargo" data-id="new">${icon('plus',15)} ${t('dash.newRequest')}</button>`)}
  </div>` : `<div class="card">
    <div class="section-title"><b style="font-size:14.5px;">${t('dash.latestOpps')}</b>
      <button class="btn btn-ghost btn-sm" data-action="nav" data-route="marketplace">${t('dash.viewAll')}</button></div>
    ${openMarketCargo().length ? requestTable(openMarketCargo().slice(0,5), 'tender') : emptyState(t('dash.noOpps'))}
  </div>`}
  `;
}

function requestTable(list, route){
  return `<div class="table-wrap"><table>
    <thead><tr><th>${t('th.route')}</th><th>${t('th.cargo')}</th><th>${t('th.service')}</th><th>${t('th.status')}</th><th>${t('th.offers')}</th><th></th></tr></thead>
    <tbody>${list.map(r=>`
      <tr style="cursor:pointer;" data-action="nav" data-route="${route}" data-id="${esc(r.id)}">
        <td class="mono">${routeText(r)}</td>
        <td>${esc(r.commodity||'—')}</td>
        <td>${esc(tv(r.service||'—'))}</td>
        <td>${badgeForStatus(r.status)}</td>
        <td>${offersFor(r.id,'cargo').length}</td>
        <td>${icon('chevron',15)}</td>
      </tr>`).join('')}</tbody>
  </table></div>`;
}

/* ---------------------------------------------------------------------- */
/* My Cargo — list                                                          */
/* ---------------------------------------------------------------------- */
function viewCargoList(){
  const mine = myCargoRequests();
  return `
  <div class="section-title">
    <div><h2 style="font-size:19px;">${t('mc.title')}</h2><p class="muted" style="font-size:13px;">${t('mc.sub')}</p></div>
    <button class="btn btn-primary btn-sm" data-action="nav" data-route="my-cargo" data-id="new">${icon('plus',15)} ${t('mc.new')}</button>
  </div>
  <div class="card card-flush">
    ${mine.length ? requestTable(mine, 'tender') : emptyState(t('mc.empty'), `<button class="btn btn-primary btn-sm" data-action="nav" data-route="my-cargo" data-id="new">${icon('plus',15)} ${t('mc.first')}</button>`)}
  </div>`;
}

/* ---------------------------------------------------------------------- */
/* Cargo request wizard (6 steps)                                            */
/* ---------------------------------------------------------------------- */
const CARGO_TYPES = ['General Cargo','Perishable','Pharma / Cold Chain','Automotive Parts','E-commerce / Parcels','Live Animals','Valuables / High-Value'];
const TEMP_OPTIONS = ['Ambient','Chilled (2–8°C)','Frozen (-18°C)','Controlled Room Temp (15–25°C)'];
const SERVICES = ['Airport-Airport','Door-Airport','Airport-Door','Door-Door'];
const DOC_PRESETS = ['Commercial Invoice','Packing List','Export Declaration','Certificate of Origin'];
const TENDER_WINDOWS = [['24 hours',24],['48 hours',48],['72 hours',72],['5 days',120]];

function viewCargoWizard(){
  wizardDocs = [];
  return `
  <div class="card wizard" data-total="6" data-step="1" data-kind="cargo" style="max-width:720px;">
    <div class="section-title">
      <div><h2 style="font-size:18px;">${t('wz.title')}</h2><span class="wizard-step-label faint" style="font-size:12px;">${t('wz.step',{n:1,total:6})}</span></div>
      <button class="btn btn-ghost btn-sm" data-action="nav" data-route="my-cargo">${t('wz.cancel')}</button>
    </div>
    <div class="step-tracker" style="margin:16px 0 22px;">${[1,2,3,4,5,6].map(i=>`<div class="dot ${i===1?'on':''}"></div>`).join('')}</div>

    <div class="wizard-section" data-step="1">
      <h3 style="font-size:15px; margin-bottom:14px;">${t('wz.s1')}</h3>
      <div class="grid-2">
        <div class="field"><label for="cg-origin">${t('wz.origin')}</label><select id="cg-origin">${airportOptions('HKG')}</select></div>
        <div class="field"><label for="cg-dest">${t('wz.dest')}</label><select id="cg-dest">${airportOptions('FRA')}</select></div>
      </div>
    </div>

    <div class="wizard-section" data-step="2" hidden>
      <h3 style="font-size:15px; margin-bottom:14px;">${t('wz.s2')}</h3>
      <div class="grid-2">
        <div class="field"><label for="cg-commodity">${t('wz.commodity')}</label><input id="cg-commodity" placeholder="${t('wz.commodityPh')}"></div>
        <div class="field"><label for="cg-type">${t('wz.type')}</label><select id="cg-type">
          ${CARGO_TYPES.map(v=>`<option value="${v}">${tv(v)}</option>`).join('')}
        </select></div>
        <div class="field"><label for="cg-hs">${t('wz.hs')}</label><input id="cg-hs" class="mono" placeholder="8471.30"></div>
        <div class="field"><label for="cg-weight">${t('wz.weight')}</label><input id="cg-weight" type="number" min="1" placeholder="1200"></div>
        <div class="field"><label for="cg-volume">${t('wz.volume')}</label><input id="cg-volume" type="number" min="0" step="0.1" placeholder="4.2"></div>
        <div class="field"><label for="cg-pieces">${t('wz.pieces')}</label><input id="cg-pieces" type="number" min="1" placeholder="18"></div>
        <div class="field"><label for="cg-dim">${t('wz.dim')}</label><input id="cg-dim" placeholder="${t('wz.dimPh')}"></div>
        <div class="field"><label for="cg-temp">${t('wz.temp')}</label><select id="cg-temp">
          ${TEMP_OPTIONS.map(v=>`<option value="${v}">${tv(v)}</option>`).join('')}
        </select></div>
      </div>
      <div class="field" style="margin-top:14px;"><label>${t('wz.dg')}</label>
        <div class="chip-select" data-chip-group="dg">
          <button type="button" class="chip active" data-action="pick-chip" data-group="dg" data-value="Non-DG" data-target="#cg-dg">${t('wz.dgNo')}</button>
          <button type="button" class="chip" data-action="pick-chip" data-group="dg" data-value="DG" data-target="#cg-dg">${t('wz.dgYes')}</button>
        </div>
        <input type="hidden" id="cg-dg" value="Non-DG">
      </div>
    </div>

    <div class="wizard-section" data-step="3" hidden>
      <h3 style="font-size:15px; margin-bottom:14px;">${t('wz.s3')}</h3>
      <div class="chip-select" data-chip-group="service">
        ${SERVICES.map((s,i)=>`<button type="button" class="chip ${i===0?'active':''}" data-action="pick-chip" data-group="service" data-value="${s}" data-target="#cg-service">${tv(s)}</button>`).join('')}
      </div>
      <input type="hidden" id="cg-service" value="Airport-Airport">
    </div>

    <div class="wizard-section" data-step="4" hidden>
      <h3 style="font-size:15px; margin-bottom:6px;">${t('wz.s4')}</h3>
      <p class="faint" style="font-size:12px; margin-bottom:12px;">${t('wz.docsHint')}</p>
      <div class="chip-select" style="margin-bottom:10px;">
        ${DOC_PRESETS.map(d=>`<button type="button" class="chip" data-action="add-doc-chip" data-name="${d}">${icon('plus',12)} ${tv(d)}</button>`).join('')}
      </div>
      <label class="btn btn-ghost btn-sm" style="width:fit-content; display:inline-flex;">${icon('upload',15)} ${t('wz.upload')}
        <input type="file" id="cg-files" multiple style="display:none;"></label>
      <div id="cg-file-list" class="chip-select" style="margin-top:12px;"></div>
    </div>

    <div class="wizard-section" data-step="5" hidden>
      <h3 style="font-size:15px; margin-bottom:14px;">${t('wz.s5')}</h3>
      <p class="faint" style="font-size:12px; margin-bottom:10px;">${t('wz.tenderQ')}</p>
      <div class="chip-select" data-chip-group="tender">
        ${TENDER_WINDOWS.map(([l,h],i)=>`<button type="button" class="chip ${i===1?'active':''}" data-action="pick-chip" data-group="tender" data-value="${l}|${h}" data-target="#cg-tender">${tv(l)}</button>`).join('')}
      </div>
      <input type="hidden" id="cg-tender" value="48 hours|48">
      <p class="faint" style="font-size:11.5px; margin-top:10px;">${t('wz.tenderTip')}</p>
    </div>

    <div class="wizard-section" data-step="6" hidden>
      <h3 style="font-size:15px; margin-bottom:14px;">${t('wz.s6')}</h3>
      <div id="cg-review" class="card" style="background:var(--surface-2); font-size:13px;"></div>
      <div id="wizard-error" class="badge badge-red hidden" style="margin-top:12px;"></div>
    </div>

    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:24px;">
      <button type="button" class="btn btn-ghost" data-action="wizard-prev" style="visibility:hidden;">${t('wz.back')}</button>
      <button type="button" class="btn btn-primary" data-action="wizard-next">${t('wz.next')}</button>
      <button type="button" class="btn btn-primary hidden" data-action="publish-cargo">${icon('bolt',15)} ${t('wz.publish')}</button>
    </div>
  </div>`;
}

function syncWizardButtons(wrap){
  const step = Number(wrap.dataset.step), total = Number(wrap.dataset.total);
  qs('[data-action="wizard-prev"]', wrap).style.visibility = step===1 ? 'hidden' : 'visible';
  qs('[data-action="wizard-next"]', wrap).classList.toggle('hidden', step===total);
  qs('[data-action="publish-cargo"]', wrap).classList.toggle('hidden', step!==total);
}

function renderDocChips(){
  const c = qs('#cg-file-list');
  if (!c) return;
  c.innerHTML = wizardDocs.length ? wizardDocs.map(n=>`
    <span class="chip active" style="cursor:default; display:inline-flex; align-items:center; gap:5px;">
      ${icon('doc',13)} ${esc(tv(n))}
      <button type="button" data-action="remove-doc-chip" data-name="${esc(n)}" aria-label="×" style="background:none; border:none; color:inherit; cursor:pointer; display:flex;">${icon('close',11)}</button>
    </span>`).join('') : `<span class="faint" style="font-size:12.5px;">${t('wz.noDocs')}</span>`;
}

function fillCargoReview(){
  const g = id => qs('#'+id)?.value || '';
  const box = qs('#cg-review');
  if (!box) return;
  const row = (k, v) => `<div><b>${t(k)}:</b> ${v}</div>`;
  box.innerHTML = `
    <div class="grid-2" style="gap:8px;">
      ${row('rv.route', `${esc(g('cg-origin'))} → ${esc(g('cg-dest'))}`)}
      ${row('rv.service', esc(tv(g('cg-service'))))}
      ${row('rv.commodity', esc(g('cg-commodity')||'—'))}
      ${row('rv.type', esc(tv(g('cg-type'))))}
      ${row('rv.weightVol', `${esc(g('cg-weight')||'—')} ${t('unit.kg')} / ${esc(g('cg-volume')||'—')} ${t('unit.cbm')}`)}
      ${row('rv.pieces', esc(g('cg-pieces')||'—'))}
      ${row('rv.temp', esc(tv(g('cg-temp'))))}
      ${row('rv.dg', esc(tv(g('cg-dg'))))}
      ${row('rv.tender', esc(tv(g('cg-tender').split('|')[0])))}
      ${row('rv.docs', wizardDocs.length || t('rv.none'))}
    </div>`;
}

async function publishCargo(){
  const g = id => qs('#'+id)?.value || '';
  const origin = g('cg-origin'), dest = g('cg-dest');
  const errBox = qs('#wizard-error');
  if (origin === dest){ errBox.innerHTML = t('wz.errSame'); errBox.classList.remove('hidden'); return; }
  if (!g('cg-weight') || Number(g('cg-weight')) <= 0){ errBox.innerHTML = t('wz.errWeight'); errBox.classList.remove('hidden'); return; }
  errBox.classList.add('hidden');

  const [tenderLabel, hours] = g('cg-tender').split('|');
  const doc = {
    ownerId: me().id, ownerName: me().companyName,
    origin, destination: dest,
    commodity: g('cg-commodity'), cargoType: g('cg-type'), hsCode: g('cg-hs'),
    weightKg: Number(g('cg-weight')||0), volumeCbm: Number(g('cg-volume')||0), pieces: Number(g('cg-pieces')||0),
    dimensions: g('cg-dim'), tempReq: g('cg-temp'), dg: g('cg-dg'),
    service: g('cg-service'), documents: wizardDocs.slice(),
    tenderWindowLabel: tenderLabel, tenderEndsAt: Date.now() + Number(hours||48)*3600000,
    status: 'open', createdAt: Date.now(),
  };
  const id = await Store.add('cargoRequests', doc);
  toast(t('toast.published'));
  Router.go('tender', id);
}

/* ---------------------------------------------------------------------- */
/* Marketplace (cargo)                                                       */
/* ---------------------------------------------------------------------- */
function viewMarketplace(){
  const rows = openMarketCargo();
  return `
  <div class="section-title">
    <div><h2 style="font-size:19px;">${t('mkt.title')}</h2><p class="muted" style="font-size:13px;">${t('mkt.count',{n:rows.length})}</p></div>
  </div>
  <div class="card">
    <div class="grid-3">
      <div class="field"><label for="mkt-q">${t('mkt.search')}</label><input id="mkt-q" placeholder="${t('mkt.searchPh')}" value="${esc(marketFilters.q)}"></div>
      <div class="field"><label for="mkt-origin">${t('mkt.origin')}</label><select id="mkt-origin"><option value="">${t('mkt.any')}</option>${AIRPORTS.map(a=>`<option value="${a.code}" ${marketFilters.origin===a.code?'selected':''}>${a.code}</option>`).join('')}</select></div>
      <div class="field"><label for="mkt-dg">${t('mkt.dg')}</label><select id="mkt-dg"><option value="">${t('mkt.any')}</option>${['DG','Non-DG'].map(v=>`<option value="${v}" ${marketFilters.dg===v?'selected':''}>${tv(v)}</option>`).join('')}</select></div>
    </div>
  </div>
  <div class="card card-flush"><div id="results-list">${marketplaceRows(rows)}</div></div>
  `;
}
function marketplaceRows(rows){
  rows = rows || openMarketCargo();
  const f = marketFilters;
  const filtered = rows.filter(r => {
    if (f.origin && r.origin !== f.origin) return false;
    if (f.dg && r.dg !== f.dg) return false;
    if (f.q){
      const hay = `${r.commodity} ${r.origin} ${r.destination} ${r.cargoType} ${tv(r.cargoType)}`.toLowerCase();
      if (!hay.includes(f.q.toLowerCase())) return false;
    }
    return true;
  });
  if (!filtered.length) return emptyState(t('mkt.empty'));
  return `<div class="table-wrap"><table>
    <thead><tr><th>${t('th.route')}</th><th>${t('th.cargo')}</th><th>${t('th.weightVol')}</th><th>${t('th.service')}</th><th>${t('th.dg')}</th><th>${t('th.closes')}</th><th>${t('th.offers')}</th><th></th></tr></thead>
    <tbody>${filtered.map(r=>`
      <tr style="cursor:pointer;" data-action="nav" data-route="tender" data-id="${esc(r.id)}">
        <td class="mono">${routeText(r)}</td>
        <td>${esc(r.commodity||tv(r.cargoType)||'—')}</td>
        <td class="mono">${r.weightKg||'—'} ${t('unit.kg')} / ${r.volumeCbm||'—'} m³</td>
        <td>${esc(tv(r.service))}</td>
        <td>${r.dg==='DG'?`<span class="badge badge-red">${tv('DG')}</span>`:`<span class="badge badge-neutral">${tv('Non-DG')}</span>`}</td>
        <td class="mono" style="font-size:12px;">${fmtDateTime(r.tenderEndsAt)}</td>
        <td>${offersFor(r.id,'cargo').length}</td>
        <td>${icon('chevron',15)}</td>
      </tr>`).join('')}</tbody></table></div>`;
}

/* ---------------------------------------------------------------------- */
/* Cargo detail / tender                                                     */
/* ---------------------------------------------------------------------- */
function field(labelKey, valueHtml, mono){
  return `<div><b class="lbl">${t(labelKey)}</b><p ${mono?'class="mono"':''} style="margin-top:3px;">${valueHtml}</p></div>`;
}
function viewCargoDetail(id){
  const r = Cache.cargoRequests.find(x=>x.id===id);
  if (!r) return emptyState(t('cd.notFound'));
  const isOwner = r.ownerId === me().id;
  const offers = offersFor(id,'cargo');
  const myOffer = offers.find(o=>o.providerId===me().id);

  return `
  <div class="card">
    <div class="section-title">
      <div><span class="eyebrow">${t('cd.eyebrow')}</span>
        <h2 style="font-size:22px; margin-top:4px;" class="mono">${routeText(r)}</h2>
        <p class="muted" style="font-size:13px; margin-top:4px;">${t('cd.meta', { from: airportLabel(r.origin), to: airportLabel(r.destination), owner: r.ownerName })}</p>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">${badgeForStatus(r.status)}${r.dg==='DG'?`<span class="badge badge-red">${t('badge.dg')}</span>`:''}</div>
    </div>
    <hr class="divider" style="margin:16px 0;">
    <div class="grid-3" style="font-size:13px;">
      ${field('cd.commodity', `${esc(r.commodity||'—')} <span class="faint">(${esc(tv(r.cargoType||'—'))})</span>`)}
      ${field('cd.hs', esc(r.hsCode||'—'), true)}
      ${field('cd.service', esc(tv(r.service)))}
      ${field('cd.weightVol', `${r.weightKg||'—'} ${t('unit.kg')} / ${r.volumeCbm||'—'} m³`, true)}
      ${field('cd.piecesDim', `${r.pieces||'—'} · ${esc(r.dimensions||'—')}`)}
      ${field('cd.temp', esc(tv(r.tempReq||'—')))}
    </div>
    ${r.documents && r.documents.length ? `<div style="margin-top:14px;"><b class="lbl">${t('cd.docs')}</b>
      <div class="chip-select" style="margin-top:6px;">${r.documents.map(d=>`<span class="chip active" style="cursor:default;">${icon('doc',12)} ${esc(tv(d))}</span>`).join('')}</div></div>` : ''}
    <hr class="divider" style="margin:16px 0;">
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
      <span class="faint" style="font-size:12.5px;">${t('cd.window', { w: tv(r.tenderWindowLabel||'—'), when: fmtDateTime(r.tenderEndsAt) })}</span>
      ${isOwner && r.status==='open' ? `<button class="btn btn-soft btn-sm" ${offers.length?'':'disabled'} data-action="close-tender" data-collection="cargoRequests" data-id="${esc(r.id)}">${icon('sparkle',14)} ${t('cd.close')}</button>` : ''}
    </div>
    ${isOwner && r.status==='open' && !offers.length ? `<p class="faint" style="font-size:11.5px; margin-top:6px;">${t('cd.waiting')}</p>` : ''}
  </div>

  ${r.status==='open' && !isOwner && me().role!=='cargo_owner' ? offerFormCard(r, 'cargo', myOffer) : ''}
  ${r.status==='open' && !isOwner && myOffer ? `<div class="card"><b style="font-size:13.5px;">${t('of.yours')}</b>${offerSummaryRow(myOffer)}</div>` : ''}

  ${(isOwner || r.status!=='open') ? offersPanel(r, offers, isOwner, 'cargo') : (offers.length ? `<div class="card"><p class="muted" style="font-size:13px;">${t('cd.soFar',{n:offers.length})}</p></div>` : '')}

  ${r.status==='awarded' ? renderAwardedPanel(r, 'cargoRequests') : ''}
  `;
}

function offerFormCard(r, kind, myOffer){
  if (myOffer) return '';
  return `<div class="card">
    <b style="font-size:14.5px;">${t('of.title')}</b>
    <form data-form="submit-offer" data-request-id="${esc(r.id)}" data-kind="${kind}" style="display:flex; flex-direction:column; gap:14px; margin-top:14px;">
      <div class="grid-2">
        <div class="field"><label for="of-price">${t('of.price')}</label><input id="of-price" type="number" min="1" required placeholder="4200"></div>
        <div class="field"><label for="of-transit">${t('of.transit')}</label><input id="of-transit" type="number" min="1" required placeholder="3"></div>
      </div>
      <div class="field"><label>${t('of.service')}</label>
        <div class="chip-select" data-chip-group="of-service">
          ${['Standard','Priority','Premium'].map((s,i)=>`<button type="button" class="chip ${i===0?'active':''}" data-action="pick-chip" data-group="of-service" data-value="${s}" data-target="#of-service">${tv(s)}</button>`).join('')}
        </div>
        <input type="hidden" id="of-service" value="Standard">
      </div>
      <div class="field"><label for="of-notes">${t('of.notes')}</label><textarea id="of-notes" placeholder="${t('of.notesPh')}"></textarea></div>
      <button class="btn btn-primary" type="submit">${icon('arrow',15)} ${t('of.submit')}</button>
    </form>
  </div>`;
}
function offerSummaryRow(o){
  return `<div class="grid-3" style="font-size:13px; margin-top:10px;">
    ${field('of.lPrice', fmtMoney(o.price), true)}
    ${field('of.lTransit', t('unit.daysShort',{n:o.transitDays}), true)}
    ${field('of.lService', esc(tv(o.serviceLevel)))}
  </div>`;
}

function offersPanel(r, offers, isOwner, kind){
  if (!offers.length) return `<div class="card">${emptyState(t('offers.empty'))}</div>`;
  const collection = kind==='cargo' ? 'cargoRequests' : 'charterRequests';
  const showAI = r.status==='closed' && isOwner;
  return `<div class="card">
    <div class="section-title"><b style="font-size:14.5px;">${t('offers.title',{n:offers.length})}</b></div>
    ${showAI ? renderAIRecommendations(offers, r, collection) : ''}
    <div class="table-wrap" style="margin-top:${showAI?'18px':'10px'};"><table>
      <thead><tr><th>${t('th.provider')}</th><th>${t('th.role')}</th><th>${t('th.price')}</th><th>${t('th.transit')}</th><th>${t('th.service')}</th><th>${t('th.submitted')}</th></tr></thead>
      <tbody>${[...offers].sort((a,b)=>a.price-b.price).map(o=>`
        <tr ${r.awardedOfferId===o.id?'style="background:var(--teal-soft);"':''}>
          <td>${esc(o.providerName)} ${r.awardedOfferId===o.id?`<span class="badge badge-teal">${t('offers.awarded')}</span>`:''}</td>
          <td>${roleBadge(o.providerRole)}</td>
          <td class="mono">${fmtMoney(o.price)}</td>
          <td class="mono">${t('unit.daysShort',{n:o.transitDays})}</td>
          <td>${esc(tv(o.serviceLevel))}</td>
          <td class="faint" style="font-size:11.5px;">${timeAgo(o.createdAt)}</td>
        </tr>`).join('')}</tbody>
    </table></div>
  </div>`;
}

// EN keeps the service level lower-case mid-sentence; RU quotes the localized name.
function svcMid(level){ return LANG==='ru' ? tv(level) : String(level).toLowerCase(); }
function aiReason(tag, o, n, median){
  const days = o.transitDays, daysWord = pl(days, 'day'), svc = svcMid(o.serviceLevel);
  const price = { __html: fmtMoney(o.price) };
  if (tag === 'bestPrice'){
    if (n === 1) return t('ai.r.only', { price, days, daysWord, svc });
    const below = o.price < median ? { __html: t('ai.r.below', { pct: Math.round((median - o.price) / median * 100) }) } : '';
    return t('ai.r.bestPrice', { price, n, below, days, daysWord, svc });
  }
  if (tag === 'bestOverall') return t('ai.r.bestOverall', { score: o.ai.total, days, daysWord, svc });
  return t('ai.r.premium', { svcCap: tv(o.serviceLevel), svc, days, daysWord });
}

function renderAIRecommendations(offers, r, collectionName){
  const { picks, n, median } = rankOffers(offers);
  const iconFor = { bestPrice:'bolt', bestOverall:'sparkle', premium:'star' };
  return `<div>
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
      ${icon('sparkle',16)}<b style="font-size:14px;">${t('ai.title')}</b>
      <span class="faint" style="font-size:11.5px;">${t('ai.note')}</span>
    </div>
    <div class="ai-grid">
      ${picks.map(p=>`
        <div class="ai-pick ${p.tag==='bestOverall'?'featured':''}" data-tag="${p.tag}">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <span class="badge badge-accent">${icon(iconFor[p.tag],12)} ${t('tag.'+p.tag)}</span>
            <span class="mono" style="font-size:11px; color:var(--text-faint);">${t('ai.score',{n:p.offer.ai.total})}</span>
          </div>
          <b style="font-size:14.5px;">${esc(p.offer.providerName)}</b>
          <div style="display:flex; gap:12px; flex-wrap:wrap; font-size:12.5px;">
            <span class="mono">${fmtMoney(p.offer.price)}</span><span class="mono">${t('ai.transit',{n:p.offer.transitDays})}</span><span>${esc(tv(p.offer.serviceLevel))}</span>
          </div>
          <div class="ai-reasoning">${aiReason(p.tag, p.offer, n, median)}</div>
          ${r.status==='closed' ? `<button class="btn btn-primary btn-sm btn-block" data-action="select-provider" data-collection="${collectionName}" data-id="${esc(r.id)}" data-offer-id="${esc(p.offer.id)}">${icon('check',14)} ${t('ai.select')}</button>` : ''}
        </div>`).join('')}
    </div>
  </div>`;
}

function renderAwardedPanel(r, collectionName){
  const offer = awardedOfferOf(r);
  const stage = r.trackingStage ?? 0;
  const isParty = r.ownerId===me().id || (offer && offer.providerId===me().id);
  return `
  <div class="card">
    <b style="font-size:14.5px;">${t('aw.contract')}</b>
    <div class="grid-2" style="margin-top:12px; font-size:13px;">
      ${field('aw.provider', `${esc(offer?.providerName||'—')} ${offer ? roleBadge(offer.providerRole) : ''}`)}
      ${field('aw.price', fmtMoney(offer?.price||0), true)}
    </div>
    <hr class="divider" style="margin:14px 0;">
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
      <span class="faint" style="font-size:12px;">${r.paymentStatus==='paid' ? t('aw.paidNote') : t('aw.pendingNote')}</span>
      ${r.paymentStatus!=='paid' && isParty ? `<button class="btn btn-soft btn-sm" data-action="simulate-payment" data-collection="${collectionName}" data-id="${esc(r.id)}">${icon('file',14)} ${t('aw.simulate')}</button>`
        : r.paymentStatus==='paid' ? `<span class="badge badge-teal">${icon('check',12)} ${t('aw.paid')}</span>` : ''}
    </div>
  </div>
  <div class="card">
    <b style="font-size:14.5px;">${t('aw.tracking')}</b>
    <div class="timeline" style="margin-top:16px;">
      ${Array.from({length:MILESTONE_COUNT}, (_,i)=>`
        <div class="tl-step ${i<stage?'done':i===stage?'current':''}">
          ${i<MILESTONE_COUNT-1?'<div class="tl-line"></div>':''}
          <div class="tl-dot"></div>
          <div class="tl-body"><b>${t('ms.'+i)}</b><div class="when">${i<stage?t('aw.done'):i===stage?t('aw.current'):t('aw.pending')}</div></div>
        </div>`).join('')}
    </div>
    ${stage < MILESTONE_COUNT && isParty ? `<button class="btn btn-primary btn-sm" style="margin-top:6px;" data-action="advance-tracking" data-collection="${collectionName}" data-id="${esc(r.id)}">${icon('arrow',14)} ${t('aw.advance')}</button>` : ''}
    ${stage >= MILESTONE_COUNT ? renderRatingWidget(r, collectionName) : ''}
  </div>`;
}

function renderRatingWidget(r, collectionName){
  if (r.rating) return `<div style="margin-top:14px;"><span class="badge badge-teal">${icon('star',12)} ${t('aw.rated',{n:r.rating})}</span></div>`;
  if (r.ownerId !== me().id) return '';
  return `<div style="margin-top:14px;">
    <b style="font-size:13px;">${t('aw.rate')}</b>
    <div style="display:flex; gap:6px; margin-top:8px;">
      ${[1,2,3,4,5].map(n=>`<button class="icon-btn" data-action="rate-provider" data-collection="${collectionName}" data-id="${esc(r.id)}" data-stars="${n}">${n}★</button>`).join('')}
    </div>
  </div>`;
}

/* ---------------------------------------------------------------------- */
/* Charter — list / form / detail                                            */
/* ---------------------------------------------------------------------- */
const FREQUENCIES = ['One-off','Weekly','Monthly'];
const AIRCRAFT = ['Any suitable aircraft','Narrow-body freighter','Wide-body freighter','Main-deck cargo','Combi aircraft'];

function viewCharterList(){
  const mine = myCharterRequests();
  const market = openMarketCharter();
  const canCreate = ['cargo_owner','forwarder'].includes(me().role);
  const canOffer = ['airline','broker'].includes(me().role);
  return `
  <div class="section-title">
    <div><h2 style="font-size:19px;">${t('ch.title')}</h2><p class="muted" style="font-size:13px;">${t('ch.sub')}</p></div>
    ${canCreate ? `<button class="btn btn-primary btn-sm" data-action="nav" data-route="charter" data-id="new">${icon('plus',15)} ${t('ch.new')}</button>` : ''}
  </div>
  ${canCreate && mine.length ? `<div class="card">
    <b style="font-size:14.5px;">${t('ch.mine')}</b>
    <div class="table-wrap" style="margin-top:10px;"><table><thead><tr><th>${t('th.route')}</th><th>${t('th.date')}</th><th>${t('th.status')}</th><th>${t('th.offers')}</th><th></th></tr></thead>
    <tbody>${mine.map(r=>`<tr style="cursor:pointer;" data-action="nav" data-route="charter-detail" data-id="${esc(r.id)}">
      <td class="mono">${routeText(r)}</td><td class="mono">${fmtDate(r.requiredDate)}</td>
      <td>${badgeForStatus(r.status)}</td><td>${offersFor(r.id,'charter').length}</td><td>${icon('chevron',15)}</td></tr>`).join('')}</tbody>
    </table></div></div>` : ''}
  <div class="card">
    <b style="font-size:14.5px;">${canOffer ? t('ch.openDemand') : t('ch.other')}</b>
    <div style="margin-top:10px;">
      ${market.length ? `<div class="table-wrap"><table><thead><tr><th>${t('th.route')}</th><th>${t('th.cargo')}</th><th>${t('th.weight')}</th><th>${t('th.aircraft')}</th><th>${t('th.date')}</th><th>${t('th.offers')}</th><th></th></tr></thead>
      <tbody>${market.map(r=>`<tr style="cursor:pointer;" data-action="nav" data-route="charter-detail" data-id="${esc(r.id)}">
        <td class="mono">${routeText(r)}</td><td>${esc(r.cargoDesc||'—')}</td><td class="mono">${r.weightKg||'—'} ${t('unit.kg')}</td>
        <td>${esc(r.aircraftType ? tv(r.aircraftType) : t('ch.anyAircraft'))}</td><td class="mono">${fmtDate(r.requiredDate)}</td><td>${offersFor(r.id,'charter').length}</td><td>${icon('chevron',15)}</td></tr>`).join('')}</tbody>
      </table></div>` : emptyState(t('ch.empty'))}
    </div>
  </div>`;
}

function viewCharterForm(){
  const minDate = new Date(Date.now()+2*86400000).toISOString().slice(0,10);
  return `
  <div class="card" style="max-width:720px;">
    <div class="section-title"><h2 style="font-size:18px;">${t('chf.title')}</h2>
      <button class="btn btn-ghost btn-sm" data-action="nav" data-route="charter">${t('wz.cancel')}</button></div>
    <form data-form="publish-charter" style="display:flex; flex-direction:column; gap:16px; margin-top:16px;">
      <div class="grid-2">
        <div class="field"><label for="ch-origin">${t('wz.origin')}</label><select id="ch-origin">${airportOptions('HKG')}</select></div>
        <div class="field"><label for="ch-dest">${t('wz.dest')}</label><select id="ch-dest">${airportOptions('DXB')}</select></div>
      </div>
      <div class="field"><label for="ch-cargo">${t('chf.cargo')}</label><input id="ch-cargo" placeholder="${t('chf.cargoPh')}"></div>
      <div class="grid-2">
        <div class="field"><label for="ch-weight">${t('chf.weight')}</label><input id="ch-weight" type="number" min="1" placeholder="45000"></div>
        <div class="field"><label for="ch-date">${t('chf.date')}</label><input id="ch-date" type="date" min="${minDate}" value="${minDate}"></div>
      </div>
      <div class="field"><label>${t('chf.freq')}</label>
        <div class="chip-select" data-chip-group="ch-freq">
          ${FREQUENCIES.map((f,i)=>`<button type="button" class="chip ${i===0?'active':''}" data-action="pick-chip" data-group="ch-freq" data-value="${f}" data-target="#ch-freq">${tv(f)}</button>`).join('')}
        </div><input type="hidden" id="ch-freq" value="One-off">
      </div>
      <div class="grid-2">
        <div class="field"><label for="ch-aircraft">${t('chf.aircraft')}</label><select id="ch-aircraft">
          ${AIRCRAFT.map(a=>`<option value="${a}">${tv(a)}</option>`).join('')}
        </select></div>
        <div class="field"><label for="ch-payload">${t('chf.payload')}</label><input id="ch-payload" placeholder="${t('chf.payloadPh')}"></div>
      </div>
      <div id="ch-error" class="badge badge-red hidden"></div>
      <button class="btn btn-primary" type="submit">${icon('bolt',15)} ${t('chf.publish')}</button>
    </form>
  </div>`;
}

function viewCharterDetail(id){
  const r = Cache.charterRequests.find(x=>x.id===id);
  if (!r) return emptyState(t('chd.notFound'));
  const isOwner = r.ownerId === me().id;
  const offers = offersFor(id,'charter');
  const myOffer = offers.find(o=>o.providerId===me().id);
  const canOffer = ['airline','broker'].includes(me().role);

  return `
  <div class="card">
    <div class="section-title">
      <div><span class="eyebrow">${t('chd.eyebrow')}</span>
        <h2 style="font-size:22px; margin-top:4px;" class="mono">${routeText(r)}</h2>
        <p class="muted" style="font-size:13px; margin-top:4px;">${t('cd.meta', { from: airportLabel(r.origin), to: airportLabel(r.destination), owner: r.ownerName })}</p>
      </div>
      ${badgeForStatus(r.status)}
    </div>
    <hr class="divider" style="margin:16px 0;">
    <div class="grid-3" style="font-size:13px;">
      ${field('chd.cargo', esc(r.cargoDesc||'—'))}
      ${field('chd.weight', `${r.weightKg||'—'} ${t('unit.kg')}`, true)}
      ${field('chd.date', fmtDate(r.requiredDate))}
      ${field('chd.freq', esc(tv(r.frequency||'—')))}
      ${field('chd.aircraft', esc(tv(r.aircraftType||'—')))}
      ${field('chd.payload', esc(r.payloadReq||'—'))}
    </div>
    ${isOwner && r.status==='open' ? `<hr class="divider" style="margin:16px 0;">
      <button class="btn btn-soft btn-sm" ${offers.length?'':'disabled'} data-action="close-tender" data-collection="charterRequests" data-id="${esc(r.id)}">${icon('sparkle',14)} ${t('chd.close')}</button>
      ${!offers.length?`<p class="faint" style="font-size:11.5px; margin-top:6px;">${t('chd.waiting')}</p>`:''}` : ''}
  </div>

  ${r.status==='open' && !isOwner && canOffer ? offerFormCard(r, 'charter', myOffer) : ''}
  ${r.status==='open' && !isOwner && myOffer ? `<div class="card"><b style="font-size:13.5px;">${t('of.yours')}</b>${offerSummaryRow(myOffer)}</div>` : ''}
  ${(isOwner || r.status!=='open') ? offersPanel(r, offers, isOwner, 'charter') : (offers.length ? `<div class="card"><p class="muted" style="font-size:13px;">${t('chd.soFar',{n:offers.length})}</p></div>` : '')}
  ${r.status==='awarded' ? renderAwardedPanel(r, 'charterRequests') : ''}
  `;
}

/* ---------------------------------------------------------------------- */
/* Contracts                                                                  */
/* ---------------------------------------------------------------------- */
function viewContracts(){
  const u = me();
  const mineOrWon = r => r.status==='awarded' && (r.ownerId===u.id || awardedOfferOf(r)?.providerId===u.id);
  const all = [
    ...Cache.cargoRequests.filter(mineOrWon).map(d=>({...d, kind:'cargo'})),
    ...Cache.charterRequests.filter(mineOrWon).map(d=>({...d, kind:'charter'})),
  ].sort((a,b)=>(b.awardedAt||0)-(a.awardedAt||0));
  return `
  <div><h2 style="font-size:19px;">${t('ct.title')}</h2><p class="muted" style="font-size:13px; margin-top:4px;">${t('ct.sub')}</p></div>
  ${all.length ? `<div class="card-grid">${all.map(d=>{
    const offer = awardedOfferOf(d);
    const counterpart = d.ownerId===u.id ? offer?.providerName : d.ownerName;
    const stage = Math.min(d.trackingStage||0, MILESTONE_COUNT-1);
    return `<div class="card" style="cursor:pointer;" data-action="nav" data-route="${d.kind==='cargo'?'tender':'charter-detail'}" data-id="${esc(d.id)}">
      <div style="display:flex; justify-content:space-between; gap:8px;"><span class="badge badge-neutral">${t(d.kind==='cargo'?'ct.cargo':'ct.charter')}</span>${d.paymentStatus==='paid'?`<span class="badge badge-teal">${t('ct.paid')}</span>`:`<span class="badge badge-amber">${t('ct.pending')}</span>`}</div>
      <b class="mono" style="font-size:15px; margin-top:8px; display:block;">${routeText(d)}</b>
      <p class="muted" style="font-size:12.5px;">${t('ct.with',{name: counterpart||'—'})}</p>
      <p class="mono" style="font-size:13px; margin-top:6px;">${fmtMoney(offer?.price||0)}</p>
      <div class="progress-bar" style="margin-top:10px;"><div style="width:${((d.trackingStage||0)/MILESTONE_COUNT)*100}%"></div></div>
      <span class="faint" style="font-size:11px;">${t('ms.'+stage)}</span>
    </div>`;
  }).join('')}</div>` : emptyState(t('ct.empty'))}
  `;
}

/* ---------------------------------------------------------------------- */
/* Notifications                                                             */
/* ---------------------------------------------------------------------- */
function viewNotifications(){
  const list = myNotifications();
  return `
  <div class="section-title">
    <h2 style="font-size:19px;">${t('notif.title')}</h2>
    ${list.length?`<button class="btn btn-ghost btn-sm" data-action="mark-all-read">${t('notif.markAll')}</button>`:''}
  </div>
  <div class="card card-flush">
    ${list.length ? list.map(n=>`
      <div class="list-row" style="padding:14px 18px;" data-action="mark-notif-read" data-id="${esc(n.id)}">
        <div style="display:flex; gap:10px; align-items:flex-start;">
          ${!n.read?'<span class="badge-dot" style="background:var(--accent); margin-top:7px;"></span>':'<span style="width:6px;"></span>'}
          <div><p style="font-size:13.5px;">${notifText(n)}</p><span class="faint" style="font-size:12px;">${timeAgo(n.createdAt)}</span></div>
        </div>
      </div>`).join('') : emptyState(t('notif.empty'))}
  </div>`;
}

/* ---------------------------------------------------------------------- */
/* AI Assistant chat widget (rendered into #chat-root, outside the page)     */
/* ---------------------------------------------------------------------- */
// '=word' matches a whole word only (so "ии" does not match inside "компании").
const CHAT_KB = [
  { id:'ai',      kw:['ai decision','top 3','top-3','recommend','decision engine','best overall','best price','=ии','топ-3','топ 3','рекоменд','оптимальн','лучшая цена','выбирает'] },
  { id:'charter', kw:['charter','чартер'] },
  { id:'track',   kw:['track','shipment','milestone','отслеж','этап','трек'] },
  { id:'request', kw:['marketplace','request','publish','заявк','маркетплейс','опубликов','создать'] },
  { id:'roles',   kw:['role','forwarder','airline','broker','owner','рол','экспедитор','авиакомпан','брокер','грузовладел'] },
];
function answerAssistant(q){
  const lower = q.toLowerCase();
  const words = lower.split(/[^a-zа-яё0-9-]+/i).filter(Boolean);
  const hit = CHAT_KB.find(k => k.kw.some(w => w.startsWith('=') ? words.includes(w.slice(1)) : lower.includes(w)));
  if (!hit) return { key:'chat.fallback' };
  return hit.id === 'ai' ? { key:'chat.kb.ai', params:{ p:AI_WEIGHTS.price, tr:AI_WEIGHTS.transit, s:AI_WEIGHTS.service } } : { key:'chat.kb.'+hit.id };
}
function chatMsgHtml(m){
  return `<div class="chat-msg ${m.role}">${m.role==='bot' ? t(m.key, m.params) : esc(m.text)}</div>`;
}
function renderChatWidget(){
  const suggestions = ['chat.s1','chat.s2','chat.s3','chat.s4'].map(k => t(k));
  if (!chatOpen) return `<button class="chat-launcher" data-action="toggle-chat" aria-label="${t('chat.open')}">${icon('chat',22)}</button>`;
  return `<div class="chat-panel" role="dialog" aria-label="${t('chat.title')}">
    <div class="chat-head"><div style="display:flex; align-items:center; gap:8px;">${icon('sparkle',16)}<b style="font-size:13.5px;">${t('chat.title')}</b></div>
      <button class="icon-btn" style="width:28px;height:28px;" data-action="toggle-chat" aria-label="${t('chat.close')}">${icon('close',14)}</button></div>
    <div class="chat-body" id="chat-body">${chatMessages.map(chatMsgHtml).join('')}</div>
    ${chatMessages.length<3 ? `<div class="chat-suggest">${suggestions.map(s=>`<button type="button" class="chip" data-action="chat-suggest" data-q="${s}">${s}</button>`).join('')}</div>` : ''}
    <form class="chat-input-row" data-form="chat">
      <input id="chat-input" placeholder="${t('chat.ph')}" autocomplete="off">
      <button class="icon-btn" type="submit" aria-label="${t('chat.send')}">${icon('send',16)}</button>
    </form>
  </div>`;
}
// Re-render the widget only when what it shows changes, so typed text and scroll survive page renders.
function renderChat(visible){
  const host = qs('#chat-root');
  if (!host) return;
  const key = [visible, chatOpen, LANG].join('|');
  if (key === chatRenderedKey) return;
  chatRenderedKey = key;
  host.innerHTML = visible ? renderChatWidget() : '';
  const body = qs('#chat-body');
  if (body) body.scrollTop = body.scrollHeight;
}
function pushChat(msg){
  chatMessages.push(msg);
  const body = qs('#chat-body');
  if (body){
    body.insertAdjacentHTML('beforeend', chatMsgHtml(msg));
    body.scrollTop = body.scrollHeight;
  }
  if (chatMessages.length >= 3) qs('.chat-suggest')?.remove();
}
function sendChat(text){
  text = (text||'').trim();
  if (!text) return;
  pushChat({ role:'user', text });
  setTimeout(() => pushChat({ role:'bot', ...answerAssistant(text) }), 400);
}

/* ---------------------------------------------------------------------- */
/* Post-render hooks                                                         */
/* ---------------------------------------------------------------------- */
function afterRenderAppShell(){
  if (Router.route.params.id === 'new' && Router.route.name === 'my-cargo') renderDocChips();
}

/* ---------------------------------------------------------------------- */
/* Global event delegation                                                   */
/* ---------------------------------------------------------------------- */
function onGlobalClick(e){
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  switch(action){
    case 'go-home': location.hash = ''; if (!Session.user) render(); break;
    case 'go-register': Router.navigate('#/register'); break;
    case 'go-login': Router.navigate('#/login'); break;
    case 'do-login': {
      Session.set(el.dataset.id); Router.navigate('#/dashboard');
      toast(t('toast.loggedIn', { name: Cache.users.find(u=>u.id===el.dataset.id)?.companyName || '' }));
      break;
    }
    case 'logout': Session.clear(); location.hash=''; render(); break;
    case 'set-lang': setLang(el.dataset.lang); break;

    case 'scroll-to': {
      e.preventDefault();
      const target = document.getElementById(el.dataset.target);
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      break;
    }

    case 'nav': Router.go(el.dataset.route, el.dataset.id); break;

    case 'toggle-sidebar': sidebarOpen = !sidebarOpen; render(); break;
    case 'close-sidebar': sidebarOpen = false; render(); break;
    case 'toggle-notif-panel': notifOpen = !notifOpen; render(); break;
    case 'mark-notif-read': Store.update('notifications', el.dataset.id, { read:true }); break;
    case 'mark-all-read': myNotifications().forEach(n => { if (!n.read) Store.update('notifications', n.id, { read:true }); }); break;

    case 'toggle-chat': {
      chatOpen = !chatOpen;
      renderChat(true);
      if (chatOpen) qs('#chat-input')?.focus();
      break;
    }
    case 'chat-suggest': sendChat(el.dataset.q); break;

    case 'pick-chip': {
      const group = el.closest('.chip-select');
      qsa('.chip', group).forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      const target = qs(el.dataset.target);
      if (target) target.value = el.dataset.value;
      break;
    }

    case 'add-doc-chip': if (!wizardDocs.includes(el.dataset.name)) wizardDocs.push(el.dataset.name); renderDocChips(); break;
    case 'remove-doc-chip': wizardDocs = wizardDocs.filter(n => n !== el.dataset.name); renderDocChips(); break;

    case 'wizard-next': case 'wizard-prev': {
      const wrap = el.closest('.wizard');
      let step = Number(wrap.dataset.step);
      step = action==='wizard-next' ? Math.min(step+1, Number(wrap.dataset.total)) : Math.max(step-1, 1);
      wrap.dataset.step = step;
      qsa('.wizard-section', wrap).forEach(s => { s.hidden = Number(s.dataset.step) !== step; });
      qsa('.step-tracker .dot', wrap).forEach((d,i) => d.classList.toggle('on', i < step));
      const label = qs('.wizard-step-label', wrap);
      if (label) label.innerHTML = t('wz.step', { n: step, total: wrap.dataset.total });
      syncWizardButtons(wrap);
      if (Number(wrap.dataset.total)===step) fillCargoReview();
      break;
    }
    case 'publish-cargo': publishCargo(); break;

    case 'close-tender': Store.update(el.dataset.collection, el.dataset.id, { status:'closed' }); toast(t('toast.closed')); break;

    case 'select-provider': {
      const collection = el.dataset.collection, reqId = el.dataset.id, offerId = el.dataset.offerId;
      const offer = Cache.offers.find(o=>o.id===offerId);
      const req = Cache[collection].find(r=>r.id===reqId);
      Store.update(collection, reqId, { status:'awarded', awardedOfferId: offerId, awardedAt: Date.now(), trackingStage: 0, lastAdvancedAt: Date.now() });
      if (offer) notify(offer.providerId, collection==='charterRequests' ? 'n.awardCharter' : 'n.awardCargo', { route: req ? routeText(req) : '' });
      toast(t('toast.selected'));
      break;
    }

    case 'close-modal': closeModal(); break;

    case 'simulate-payment': Store.update(el.dataset.collection, el.dataset.id, { paymentStatus:'paid', paidAt:Date.now() }); toast(t('toast.paid')); break;

    case 'advance-tracking': {
      const collection = el.dataset.collection, id = el.dataset.id;
      const req = Cache[collection].find(r=>r.id===id);
      if (!req) break;
      const next = Math.min((req.trackingStage||0)+1, MILESTONE_COUNT);
      Store.update(collection, id, { trackingStage: next, lastAdvancedAt: Date.now() });
      break;
    }
    case 'rate-provider':
      Store.update(el.dataset.collection, el.dataset.id, { rating: Number(el.dataset.stars) });
      toast(t('toast.rated'));
      break;
  }
}

function onGlobalSubmit(e){
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form;

  if (kind === 'register'){
    const company = qs('#reg-company', form).value.trim();
    const country = qs('#reg-country', form).value.trim();
    const email = qs('#reg-email', form).value.trim();
    const role = qs('#reg-role', form).value;
    const err = qs('#reg-error', form);
    if (!company || !country || !email){ err.innerHTML = t('reg.err'); err.classList.remove('hidden'); return; }
    err.classList.add('hidden');
    (async () => {
      const id = await Store.add('users', { role, companyName: company, country, email, createdAt: Date.now() });
      Session.set(id);
      await notify(id, 'n.welcome');
      Router.navigate('#/dashboard');
      toast(t('toast.created'));
    })();
    return;
  }

  if (kind === 'submit-offer'){
    const price = Number(qs('#of-price', form).value), transit = Number(qs('#of-transit', form).value);
    const service = qs('#of-service', form).value, notes = qs('#of-notes', form).value;
    if (!price || price<=0 || !transit || transit<=0) return;
    const requestType = form.dataset.kind, requestId = form.dataset.requestId;
    const req = requestType==='cargo' ? Cache.cargoRequests.find(r=>r.id===requestId) : Cache.charterRequests.find(r=>r.id===requestId);
    (async () => {
      await Store.add('offers', {
        requestId, requestType, providerId: me().id, providerName: me().companyName, providerRole: me().role,
        price, currency:'USD', transitDays: transit, serviceLevel: service, notes, createdAt: Date.now(),
      });
      if (req) await notify(req.ownerId, requestType==='cargo' ? 'n.offerCargo' : 'n.offerCharter', { company: me().companyName, route: routeText(req) });
      toast(t('toast.offer'));
      render();
    })();
    return;
  }

  if (kind === 'publish-charter'){
    const g = id => qs('#'+id, form)?.value || '';
    const err = qs('#ch-error', form);
    if (g('ch-origin')===g('ch-dest')){ err.innerHTML = t('wz.errSame'); err.classList.remove('hidden'); return; }
    if (!g('ch-weight') || Number(g('ch-weight'))<=0){ err.innerHTML = t('chf.errWeight'); err.classList.remove('hidden'); return; }
    err.classList.add('hidden');
    (async () => {
      const id = await Store.add('charterRequests', {
        ownerId: me().id, ownerName: me().companyName,
        origin: g('ch-origin'), destination: g('ch-dest'), cargoDesc: g('ch-cargo'),
        weightKg: Number(g('ch-weight')||0), requiredDate: new Date(g('ch-date')).getTime(), frequency: g('ch-freq'),
        aircraftType: g('ch-aircraft'), payloadReq: g('ch-payload'), status:'open', createdAt: Date.now(),
      });
      toast(t('toast.charterPublished'));
      Router.go('charter-detail', id);
    })();
    return;
  }

  if (kind === 'chat'){
    const input = qs('#chat-input', form);
    sendChat(input.value);
    input.value = '';
    return;
  }
}

function onGlobalInput(e){
  if (e.target.id === 'mkt-q'){ marketFilters.q = e.target.value; refreshMarketList(); }
}
function onGlobalChange(e){
  if (e.target.id === 'mkt-origin'){ marketFilters.origin = e.target.value; refreshMarketList(); }
  if (e.target.id === 'mkt-dg'){ marketFilters.dg = e.target.value; refreshMarketList(); }
  if (e.target.id === 'cg-files'){
    Array.from(e.target.files || []).forEach(f => { if (!wizardDocs.includes(f.name)) wizardDocs.push(f.name); });
    e.target.value = '';
    renderDocChips();
  }
}
function refreshMarketList(){ const c = qs('#results-list'); if (c) c.innerHTML = marketplaceRows(); }
