/* Samanwaya Nepal — site behaviour: loader, nav, reveal animations,
   editable-content bindings, and event/notice rendering. */
(function () {
  'use strict';

  /* ----- Loader ----- */
  function hideLoader() {
    var l = document.getElementById('loader');
    if (l) l.classList.add('done');
  }
  if (document.readyState === 'complete') hideLoader();
  else window.addEventListener('load', hideLoader);
  setTimeout(hideLoader, 2500); // safety net

  /* ----- Mobile nav ----- */
  var toggle = document.getElementById('nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ----- Reveal on scroll ----- */
  var revealEls = document.querySelectorAll('.reveal');
  function revealAll() {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
    // Safety net: make sure nothing stays hidden (search-engine renderers,
    // print, or any case where the observer never fires).
    setTimeout(revealAll, 3000);
  } else {
    revealAll();
  }

  if (!window.SN) return;
  var C = window.SN.get();
  var O = window.SN.overrides();

  /* ----- Apply admin-edited content (only where an override exists,
     so the styled defaults in the HTML are kept otherwise) ----- */
  document.querySelectorAll('[data-edit]').forEach(function (el) {
    var v = O[el.getAttribute('data-edit')];
    if (v !== undefined && v !== '') el.textContent = v;
  });
  document.querySelectorAll('[data-edit-mail]').forEach(function (el) {
    if (O.email) {
      el.textContent = C.email;
      el.setAttribute('href', 'mailto:' + C.email);
    }
  });

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ----- Events ----- */
  var evWrap = document.getElementById('events-list');
  if (evWrap) {
    var evs = C.events || [];
    var limit = parseInt(evWrap.getAttribute('data-limit') || '0', 10);
    if (limit > 0) evs = evs.slice(0, limit);
    if (!evs.length) {
      var sec = document.getElementById('events-section');
      if (sec && sec.hasAttribute('data-hide-empty')) sec.style.display = 'none';
      else evWrap.innerHTML = '<div class="empty-msg">No upcoming events right now — check back soon, or follow us for announcements.</div>';
    } else {
      evWrap.innerHTML = evs.map(function (ev) {
        return '<article class="card event-card reveal in">' +
          (ev.image ? '<img src="' + esc(ev.image) + '" alt="' + esc(ev.title) + '" loading="lazy">' : '') +
          '<div class="body">' +
          (ev.date ? '<span class="date">' + esc(ev.date) + (ev.location ? ' · ' + esc(ev.location) : '') + '</span>' : '') +
          '<h3>' + esc(ev.title) + '</h3>' +
          '<p>' + esc(ev.desc) + '</p>' +
          '</div></article>';
      }).join('');
    }
  }

  /* ----- Notices ----- */
  var ntWrap = document.getElementById('notices-list');
  if (ntWrap) {
    var nts = C.notices || [];
    var sec2 = document.getElementById('notices-section');
    if (!nts.length) {
      if (sec2) sec2.style.display = 'none';
    } else {
      ntWrap.innerHTML = nts.map(function (n) {
        return '<div class="notice reveal in">' +
          (n.date ? '<time>' + esc(n.date) + '</time>' : '') +
          '<p>' + esc(n.text) + '</p></div>';
      }).join('');
    }
  }

  /* ----- Forms (posted to FormSubmit, which emails np.samanwaya@gmail.com).
     After the redirect back, ?sent=1 shows the thank-you banner. ----- */
  var status = document.getElementById('form-status');
  if (status && /[?&]sent=1/.test(window.location.search)) {
    status.className = 'form-msg ok';
    status.style.display = '';
    status.textContent = 'Thank you! Your message has been sent — our team will get back to you soon.';
    status.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  document.querySelectorAll('form[data-submitting-text]').forEach(function (f) {
    f.addEventListener('submit', function () {
      var btn = f.querySelector('button[type=submit]');
      if (btn) { btn.textContent = f.getAttribute('data-submitting-text'); btn.disabled = true; }
    });
  });

  /* ----- Gallery lightbox ----- */
  var gallery = document.getElementById('gallery-grid');
  if (gallery) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button class="lb-close" aria-label="Close">✕</button><img alt=""><div class="lb-cap"></div>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lb-cap');
    gallery.addEventListener('click', function (e) {
      var fig = e.target.closest('figure');
      if (!fig) return;
      var img = fig.querySelector('img');
      lbImg.src = img.getAttribute('data-full') || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = img.alt;
      lb.classList.add('open');
    });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lb-close')) lb.classList.remove('open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') lb.classList.remove('open');
    });
  }
})();
