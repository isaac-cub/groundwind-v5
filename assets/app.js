(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduce){
    els.forEach(function(el){ el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin:'0px 0px -6% 0px', threshold:0.05 });
    els.forEach(function(el){ io.observe(el); });
    setTimeout(function(){ els.forEach(function(el){ el.classList.add('in'); }); }, 2500);
  }

  var navLinks = document.querySelectorAll('.nav-links a[href^="#"]:not(.btn)');
  var map = {};
  navLinks.forEach(function(a){ map[a.getAttribute('href').slice(1)] = a; });
  var secIO = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      var link = map[e.target.id];
      if (!link) return;
      if (e.isIntersecting){
        navLinks.forEach(function(a){ a.classList.remove('active'); });
        link.classList.add('active');
      }
    });
  }, { rootMargin:'-40% 0px -55% 0px' });
  Object.keys(map).forEach(function(id){
    var s = document.getElementById(id);
    if (s) secIO.observe(s);
  });

  // Envío del formulario a Netlify Forms vía AJAX + mensaje de confirmación en la página.
  var form = document.getElementById('contact-form');
  if (form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var btn = form.querySelector('.submit-btn');
      var btnHtml = btn ? btn.innerHTML : '';
      if (btn){ btn.disabled = true; btn.textContent = form.getAttribute('data-sending') || 'Enviando…'; }

      var old = form.querySelector('.form-error');
      if (old) old.remove();

      var body = new URLSearchParams(new FormData(form)).toString();
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      }).then(function(res){
        if (!res.ok) throw new Error(res.status);
        var panel = document.createElement('div');
        panel.className = 'form-status reveal in';
        panel.setAttribute('role', 'status');
        panel.innerHTML =
          '<span class="form-status-mark" aria-hidden="true">✓</span>' +
          '<h3>' + (form.getAttribute('data-success-title') || '') + '</h3>' +
          '<p>' + (form.getAttribute('data-success') || '') + '</p>';
        form.replaceWith(panel);
      }).catch(function(){
        if (btn){ btn.disabled = false; btn.innerHTML = btnHtml; }
        var err = document.createElement('p');
        err.className = 'form-error';
        err.setAttribute('role', 'alert');
        err.textContent = form.getAttribute('data-error') || '';
        form.appendChild(err);
      });
    });
  }
})();
