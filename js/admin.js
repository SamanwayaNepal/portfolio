/* Samanwaya Nepal — admin dashboard.
   Login uses SHA-256 hashed credentials (no plaintext passwords in source).
   All content lives in localStorage (see js/content.js) because GitHub Pages
   is a static host; the Backup tab exports/imports the content as JSON. */
(function () {
  'use strict';

  /* SHA-256 hashes of the two authorized admin passwords. */
  var ADMINS = {
    jagdishayer: '9da189319887e56b77ddb1354e108f913d39541c27ce599270a9e187aec5bbbd',
    superadmin: '96559d8ce1d29f23fbb92628798bc3fd3675fe0bc2d3e74c4cd5456e7fcf79a9'
  };
  var SESSION_KEY = 'sn_admin';

  var $ = function (id) { return document.getElementById(id); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function sha256(str) {
    var data = new TextEncoder().encode(str);
    return crypto.subtle.digest('SHA-256', data).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
    });
  }

  /* ---------- Session ---------- */
  function currentUser() {
    try { return localStorage.getItem(SESSION_KEY) || null; } catch (e) { return null; }
  }
  function show(view) {
    $('login-view').style.display = view === 'login' ? '' : 'none';
    $('dash-view').style.display = view === 'dash' ? '' : 'none';
    if (view === 'dash') {
      $('admin-name').textContent = currentUser();
      renderAll();
    }
  }

  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var u = $('login-user').value.trim().toLowerCase();
    var p = $('login-pass').value;
    var err = $('login-error');
    if (!ADMINS[u]) { err.style.display = ''; err.textContent = 'Invalid username or password.'; return; }
    sha256(p).then(function (hash) {
      if (hash === ADMINS[u]) {
        try { localStorage.setItem(SESSION_KEY, u); } catch (e2) {}
        err.style.display = 'none';
        $('login-pass').value = '';
        show('dash');
      } else {
        err.style.display = '';
        err.textContent = 'Invalid username or password.';
      }
    });
  });

  $('logout-btn').addEventListener('click', function () {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    show('login');
  });

  /* ---------- Tabs ---------- */
  document.querySelectorAll('.admin-tabs button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.admin-tabs button').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.admin-panel').forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      $('panel-' + btn.getAttribute('data-tab')).classList.add('active');
    });
  });

  /* ---------- Shared render ---------- */
  function renderAll() {
    renderStats();
    renderEvents();
    renderNotices();
    fillContentForm();
  }
  function renderStats() {
    var c = SN.get();
    $('stat-events').textContent = (c.events || []).length;
    $('stat-notices').textContent = (c.notices || []).length;
    var edited = Object.keys(SN.overrides()).filter(function (k) { return k !== 'events' && k !== 'notices'; }).length;
    $('stat-edits').textContent = edited;
  }

  /* ---------- Events ---------- */
  var editingEventId = null;

  function resizeImage(file, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var MAX = 1200, w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        var cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(cv.toDataURL('image/jpeg', 0.78));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  $('ev-image').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    resizeImage(f, function (dataUrl) {
      $('ev-image-data').value = dataUrl;
      $('ev-preview').src = dataUrl;
      $('ev-preview').style.display = '';
    });
  });

  $('event-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var title = $('ev-title').value.trim();
    if (!title) return;
    var events = SN.get().events.slice();
    var data = {
      id: editingEventId || Date.now(),
      title: title,
      date: $('ev-date').value.trim(),
      location: $('ev-location').value.trim(),
      desc: $('ev-desc').value.trim(),
      image: $('ev-image-data').value
    };
    if (editingEventId) {
      events = events.map(function (ev) { return ev.id === editingEventId ? data : ev; });
    } else {
      events.unshift(data);
    }
    SN.save({ events: events });
    resetEventForm();
    renderAll();
  });

  $('ev-cancel').addEventListener('click', resetEventForm);

  function resetEventForm() {
    editingEventId = null;
    $('event-form').reset();
    $('ev-image-data').value = '';
    $('ev-preview').style.display = 'none';
    $('ev-submit').textContent = 'Publish event';
    $('ev-cancel').style.display = 'none';
    $('event-form-title').textContent = 'Add a new event';
  }

  function renderEvents() {
    var events = SN.get().events || [];
    var wrap = $('events-admin-list');
    if (!events.length) {
      wrap.innerHTML = '<div class="empty-msg">No events published yet. Add your first one above.</div>';
      return;
    }
    wrap.innerHTML = events.map(function (ev) {
      return '<div class="admin-list-item">' +
        (ev.image ? '<img src="' + esc(ev.image) + '" alt="">' : '') +
        '<div class="meta"><b>' + esc(ev.title) + '</b><span>' +
        esc([ev.date, ev.location].filter(Boolean).join(' · ')) + '</span></div>' +
        '<button class="mini-btn edit" data-edit-ev="' + ev.id + '">Edit</button>' +
        '<button class="mini-btn del" data-del-ev="' + ev.id + '">Delete</button></div>';
    }).join('');
    wrap.querySelectorAll('[data-del-ev]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('Delete this event?')) return;
        SN.save({ events: SN.get().events.filter(function (ev) { return String(ev.id) !== b.getAttribute('data-del-ev'); }) });
        renderAll();
      });
    });
    wrap.querySelectorAll('[data-edit-ev]').forEach(function (b) {
      b.addEventListener('click', function () {
        var ev = SN.get().events.filter(function (x) { return String(x.id) === b.getAttribute('data-edit-ev'); })[0];
        if (!ev) return;
        editingEventId = ev.id;
        $('ev-title').value = ev.title || '';
        $('ev-date').value = ev.date || '';
        $('ev-location').value = ev.location || '';
        $('ev-desc').value = ev.desc || '';
        $('ev-image-data').value = ev.image || '';
        if (ev.image) { $('ev-preview').src = ev.image; $('ev-preview').style.display = ''; }
        $('ev-submit').textContent = 'Save changes';
        $('ev-cancel').style.display = '';
        $('event-form-title').textContent = 'Edit event';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  /* ---------- Notices ---------- */
  $('notice-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = $('nt-text').value.trim();
    if (!text) return;
    var notices = SN.get().notices.slice();
    notices.unshift({ id: Date.now(), date: $('nt-date').value.trim(), text: text });
    SN.save({ notices: notices });
    $('notice-form').reset();
    renderAll();
  });

  function renderNotices() {
    var notices = SN.get().notices || [];
    var wrap = $('notices-admin-list');
    if (!notices.length) {
      wrap.innerHTML = '<div class="empty-msg">No notices yet.</div>';
      return;
    }
    wrap.innerHTML = notices.map(function (n) {
      return '<div class="admin-list-item"><div class="meta"><b>' + esc(n.text) +
        '</b><span>' + esc(n.date || '') + '</span></div>' +
        '<button class="mini-btn del" data-del-nt="' + n.id + '">Delete</button></div>';
    }).join('');
    wrap.querySelectorAll('[data-del-nt]').forEach(function (b) {
      b.addEventListener('click', function () {
        SN.save({ notices: SN.get().notices.filter(function (n) { return String(n.id) !== b.getAttribute('data-del-nt'); }) });
        renderAll();
      });
    });
  }

  /* ---------- Content editor ---------- */
  var CONTENT_FIELDS = ['heroTitle', 'heroText', 'meaningQuote', 'founderQuote', 'founderIntro',
    'visionText', 'missionText', 'email', 'phone', 'address',
    'stat1n', 'stat1l', 'stat2n', 'stat2l', 'stat3n', 'stat3l', 'stat4n', 'stat4l'];

  function fillContentForm() {
    var c = SN.get();
    CONTENT_FIELDS.forEach(function (k) {
      var el = $('c-' + k);
      if (el) el.value = c[k] || '';
    });
  }

  $('content-form').addEventListener('submit', function (e) {
    e.preventDefault();
    // Store only the fields that actually differ from the defaults.
    var o = SN.overrides();
    CONTENT_FIELDS.forEach(function (k) {
      var el = $('c-' + k);
      if (!el) return;
      var v = el.value.trim();
      if (v === '' || v === SN.DEFAULTS[k]) delete o[k];
      else o[k] = v;
    });
    try { localStorage.setItem(SN.KEY, JSON.stringify(o)); } catch (err) {}
    var ok = $('content-saved');
    ok.style.display = '';
    setTimeout(function () { ok.style.display = 'none'; }, 2600);
    renderStats();
  });

  $('content-restore').addEventListener('click', function () {
    if (!confirm('Restore all text content to the original defaults? Events and notices are kept.')) return;
    var o = SN.overrides();
    CONTENT_FIELDS.forEach(function (k) { delete o[k]; });
    try { localStorage.setItem(SN.KEY, JSON.stringify(o)); } catch (e) {}
    renderAll();
  });

  /* ---------- Backup ---------- */
  $('export-btn').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(SN.overrides(), null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'samanwaya-content-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $('import-file').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (typeof data !== 'object' || data === null) throw new Error('bad');
        localStorage.setItem(SN.KEY, JSON.stringify(data));
        alert('Content imported successfully.');
        renderAll();
      } catch (err) {
        alert('That file is not a valid content backup.');
      }
      e.target.value = '';
    };
    reader.readAsText(f);
  });

  $('reset-btn').addEventListener('click', function () {
    if (!confirm('This deletes ALL local edits, events, and notices, and restores the site defaults. Continue?')) return;
    SN.reset();
    renderAll();
  });

  /* ---------- Boot ---------- */
  show(currentUser() ? 'dash' : 'login');
})();
