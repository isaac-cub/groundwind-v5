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

  // Preview: el envío real se conecta a Netlify Forms al desplegar allí.
  var form = document.getElementById('contact-form');
  if (form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      alert(form.getAttribute('data-msg'));
    });
  }
})();
