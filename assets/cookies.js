(function(){
  var KEY = 'gw-cookie-consent';
  var lang = (document.documentElement.lang || 'es').slice(0,2).toLowerCase();
  var es = lang !== 'en';

  var T = es ? {
    title: 'Cookies',
    text: 'Usamos cookies propias y de terceros para que el sitio funcione y, con tu permiso, para analítica y medición. Puedes aceptarlas, rechazarlas o elegir por categorías. Más información en la <a href="/legal/#cookies">Política de Cookies</a>.',
    accept: 'Aceptar', reject: 'Rechazar', config: 'Configurar',
    mTitle: 'Preferencias de cookies',
    mLead: 'Gestiona tu consentimiento por categorías. Las cookies necesarias no pueden desactivarse.',
    save: 'Guardar selección', acceptAll: 'Aceptar todas',
    settings: 'Preferencias de cookies',
    cats: [
      { k:'necessary',   lock:true, h:'Necesarias',   p:'Imprescindibles para el funcionamiento del sitio y de los formularios. Siempre activas.' },
      { k:'preferences',            h:'Preferencias', p:'Recuerdan opciones como el idioma o la configuración de visualización.' },
      { k:'analytics',              h:'Analíticas',   p:'Nos ayudan a entender el uso del sitio de forma agregada y anónima.' },
      { k:'advertising',            h:'Publicitarias',p:'Permiten mostrar y medir anuncios personalizados.' }
    ]
  } : {
    title: 'Cookies',
    text: 'We use our own and third-party cookies for the site to work and, with your permission, for analytics and measurement. You can accept, reject or choose by category. More in our <a href="/en/legal/#cookies">Cookie Policy</a>.',
    accept: 'Accept', reject: 'Reject', config: 'Configure',
    mTitle: 'Cookie preferences',
    mLead: 'Manage your consent by category. Necessary cookies cannot be disabled.',
    save: 'Save choices', acceptAll: 'Accept all',
    settings: 'Cookie preferences',
    cats: [
      { k:'necessary',   lock:true, h:'Necessary',   p:'Essential for the site and forms to work. Always on.' },
      { k:'preferences',            h:'Preferences', p:'Remember choices such as language or display settings.' },
      { k:'analytics',              h:'Analytics',   p:'Help us understand site usage in an aggregated, anonymous way.' },
      { k:'advertising',            h:'Advertising', p:'Allow personalised ads to be shown and measured.' }
    ]
  };

  function read(){
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch(e){ return null; }
  }
  function store(consent){
    try { localStorage.setItem(KEY, JSON.stringify(consent)); } catch(e){}
    apply(consent);
  }
  function apply(consent){
    // Punto de integración: cargar aquí GA4 / píxeles SOLO si el usuario ha consentido.
    // Ejemplo:  if (consent.analytics) { /* insertar script de Google Analytics 4 */ }
    //           if (consent.advertising) { /* insertar Meta Pixel, etc. */ }
    document.dispatchEvent(new CustomEvent('gw:consent', { detail: consent }));
  }

  var banner, modal, inputs = {};

  function el(tag, cls, html){
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function buildBanner(){
    banner = el('div', 'cc-banner');
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', T.title);
    banner.innerHTML =
      '<p class="cc-title">' + T.title + '</p>' +
      '<p class="cc-text">' + T.text + '</p>' +
      '<div class="cc-actions">' +
        '<button type="button" class="cc-btn cc-btn--accept" data-cc="accept">' + T.accept + '</button>' +
        '<button type="button" class="cc-btn cc-btn--reject" data-cc="reject">' + T.reject + '</button>' +
        '<button type="button" class="cc-btn cc-btn--config" data-cc="config">' + T.config + '</button>' +
      '</div>';
    document.body.appendChild(banner);
    banner.addEventListener('click', function(e){
      var b = e.target.closest('[data-cc]'); if (!b) return;
      var a = b.getAttribute('data-cc');
      if (a === 'accept') decide(true);
      else if (a === 'reject') decide(false);
      else openModal();
    });
    requestAnimationFrame(function(){ setTimeout(function(){ banner.classList.add('in'); }, 350); });
  }

  function hideBanner(){ if (banner) banner.classList.remove('in'); }

  function buildModal(){
    modal = el('div', 'cc-modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', T.mTitle);
    var cats = T.cats.map(function(c){
      var checked = c.lock ? 'checked disabled' : '';
      return '<div class="cc-cat">' +
        '<div><h3>' + c.h + '</h3><p>' + c.p + '</p></div>' +
        '<label class="cc-switch"><input type="checkbox" data-cat="' + c.k + '" ' + checked + ' />' +
        '<span class="track"></span></label></div>';
    }).join('');
    modal.innerHTML =
      '<div class="cc-backdrop" data-cc="close"></div>' +
      '<div class="cc-panel">' +
        '<h2>' + T.mTitle + '</h2>' +
        '<p class="cc-lead">' + T.mLead + '</p>' +
        cats +
        '<div class="cc-panel-actions">' +
          '<button type="button" class="cc-btn cc-btn--accept" data-cc="acceptAll">' + T.acceptAll + '</button>' +
          '<button type="button" class="cc-btn cc-btn--reject" data-cc="save">' + T.save + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    T.cats.forEach(function(c){ inputs[c.k] = modal.querySelector('[data-cat="' + c.k + '"]'); });
    modal.addEventListener('click', function(e){
      var b = e.target.closest('[data-cc]'); if (!b) return;
      var a = b.getAttribute('data-cc');
      if (a === 'close') closeModal();
      else if (a === 'acceptAll') decide(true);
      else if (a === 'save') saveFromToggles();
    });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeModal(); });
  }

  function openModal(){
    if (!modal) buildModal();
    var c = read();
    T.cats.forEach(function(cat){
      if (cat.lock) return;
      inputs[cat.k].checked = c ? !!c[cat.k] : false;
    });
    modal.classList.add('in');
  }
  function closeModal(){ if (modal) modal.classList.remove('in'); }

  function decide(all){
    store({ necessary:true, preferences:all, analytics:all, advertising:all, date:new Date().toISOString() });
    hideBanner(); closeModal();
  }
  function saveFromToggles(){
    var c = { necessary:true, date:new Date().toISOString() };
    T.cats.forEach(function(cat){ if (!cat.lock) c[cat.k] = !!inputs[cat.k].checked; });
    store(c);
    hideBanner(); closeModal();
  }

  function injectSettingsLink(){
    var uls = document.querySelectorAll('.footer-links');
    uls.forEach(function(ul){
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#'; a.textContent = T.settings;
      a.setAttribute('data-cookie-settings', '');
      a.addEventListener('click', function(e){ e.preventDefault(); openModal(); });
      li.appendChild(a); ul.appendChild(li);
    });
  }

  document.addEventListener('click', function(e){
    var t = e.target.closest('[data-cookie-settings]');
    if (t){ e.preventDefault(); openModal(); }
  });

  var existing = read();
  if (existing) apply(existing);

  function init(){
    injectSettingsLink();
    if (!existing) buildBanner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
