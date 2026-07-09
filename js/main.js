/* ==========================================================================
   UNILIFT: FAS-Technology US landing page
   Interactions: nav, product viewer, tabs, accordion, forms, motion.
   Vanilla JS. GSAP + ScrollTrigger + Lenis loaded via CDN (optional).
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DATASHEET_PDF = 'assets/docs/UNILIFT_Datasheet_TSUNIA-EN.pdf';
  var isEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim()); };

  function trackConversion(eventName, params) {
    try {
      window.dataLayer = window.dataLayer || [];
      var payload = Object.assign({ event: eventName }, params || {});
      window.dataLayer.push(payload);
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params || {});
      }
    } catch (err) { /* tracking must never break the page */ }
  }

  function warnWebhookUnset() {
    if (!window.LEAD_WEBHOOK_URL) {
      console.warn('LEAD_WEBHOOK_URL not set - leads are not being delivered');
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    if (typeof window.__hydrateSite === 'function') {
      window.__hydrateSite();
    }
    warnWebhookUnset();
    initSmoothScroll();
    initNavbar();
    initReveal();
    initScrollFx();
    initHeroIntro();
    initCountUps();
    initProductViewer();
    initCloseups();
    initFeatureCards();
    initSpecTabs();
    initFaq();
    initDatasheet();
    initContactForm();
    initModelQuote();
    initPartner();
    initConsent();
    initAppsParallax();
    initTracking();
    window.__scrollToSection = function (id) { scrollToEl(document.getElementById(id)); };
    window.__sendLead = sendLead;
  }

  /* ---------- Smooth scroll (Lenis + GSAP ticker) ---------- */
  var lenis = null;
  function initSmoothScroll() {
    if (window.gsap && window.ScrollTrigger) { window.gsap.registerPlugin(window.ScrollTrigger); }
    if (prefersReduced || typeof window.Lenis === 'undefined') return;

    lenis = new window.Lenis({
      lerp: 0.09,
      wheelMultiplier: 1,
      smoothWheel: true,
      touchMultiplier: 1.6
    });

    // Drive Lenis from GSAP's ticker so smooth scroll and ScrollTrigger stay in sync.
    if (window.gsap && window.ScrollTrigger) {
      var ST = window.ScrollTrigger;
      ST.scrollerProxy(document.documentElement, {
        scrollTop: function (value) {
          if (arguments.length) {
            lenis.scrollTo(value, { immediate: true });
          }
          return lenis.scroll;
        },
        getBoundingClientRect: function () {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight
          };
        }
      });
      lenis.on('scroll', ST.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ---------- Scroll effects: progress bar + hero parallax ---------- */
  function initScrollFx() {
    var bar = $('.scroll-progress');

    if (prefersReduced || !window.gsap || !window.ScrollTrigger) {
      // Lightweight fallback for the progress bar without animation library.
      if (bar) {
        var upd = function () {
          var h = document.documentElement;
          var max = h.scrollHeight - h.clientHeight;
          bar.style.transform = 'scaleX(' + (max > 0 ? (h.scrollTop || window.scrollY) / max : 0) + ')';
        };
        upd();
        window.addEventListener('scroll', upd, { passive: true });
      }
      return;
    }

    var gsap = window.gsap;
    if (bar) {
      gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
    }

    var heroBg = $('[data-hero-bg]');
    if (heroBg) {
      gsap.to(heroBg, {
        yPercent: 18, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }

    window.addEventListener('load', function () { window.ScrollTrigger.refresh(); });
  }
  function scrollToEl(el) {
    if (!el) return;
    if (lenis) { lenis.scrollTo(el, { offset: -70 }); }
    else { el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' }); }
  }
  // Intercept in-page anchor links for offset-aware scroll
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.getElementById(id.slice(1));
      if (target) { e.preventDefault(); closeMobileNav(); scrollToEl(target); }
    });
  });

  /* ---------- Navbar ---------- */
  function initNavbar() {
    var nav = $('#site-nav');
    var toggle = $('.nav__toggle');
    var mobile = $('#nav-mobile');
    if (!nav) return;

    var onScroll = function () {
      if (window.scrollY > 60) { nav.classList.add('nav--scrolled'); nav.classList.remove('nav--transparent'); }
      else { nav.classList.remove('nav--scrolled'); nav.classList.add('nav--transparent'); }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (toggle && mobile) {
      toggle.addEventListener('click', function () {
        var open = mobile.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.style.overflow = open ? 'hidden' : '';
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobileNav();
    });
  }
  function closeMobileNav() {
    var toggle = $('.nav__toggle');
    var mobile = $('#nav-mobile');
    if (mobile && mobile.classList.contains('is-open')) {
      mobile.classList.remove('is-open');
      if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open menu'); }
      document.body.style.overflow = '';
    }
  }

  /* ---------- Reveal on scroll (batched for smoothness) ---------- */
  function initReveal() {
    var els = $$('.reveal');
    if (!els.length) return;

    if (prefersReduced || !(window.gsap && window.ScrollTrigger)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);
    gsap.set(els, { opacity: 0, y: 26 });

    window.ScrollTrigger.batch('.reveal', {
      start: 'top 88%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1, y: 0,
          duration: 0.9, ease: 'power3.out',
          stagger: 0.09, overwrite: true
        });
      }
    });

    window.ScrollTrigger.refresh();
  }

  /* ---------- Hero intro ---------- */
  function initHeroIntro() {
    var items = $$('.hero [data-hero-anim]');
    if (!items.length) return;
    if (prefersReduced || !window.gsap) {
      items.forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
      return;
    }
    window.gsap.to(items, {
      opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
      stagger: 0.12, delay: 0.15
    });
  }

  /* ---------- Count ups ---------- */
  function initCountUps() {
    var els = $$('.count-up');
    if (!els.length) return;
    if (prefersReduced) return; // static values already in DOM

    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-target')) || 0;
      var dur = 1400, start = null;
      var format = function (n) { return Math.round(n).toLocaleString('en-US'); };
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = format(target * eased);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = format(target);
      };
      requestAnimationFrame(step);
    };

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ==========================================================================
     PRODUCT VIEWER: drag-to-rotate photo scrubber with hotspots.
     Future 3D: drop a real model at assets/model/unilift.glb (CAD/STEP export)
     to enable true 3D via <model-viewer>; the photo viewer is the fallback.
     ========================================================================== */
  function initProductViewer() {
    var viewer = $('[data-viewer]');
    if (!viewer) return;

    var glb = viewer.getAttribute('data-glb');
    // Try the GLB first; if present, upgrade to real 3D with zero markup change.
    if (glb) {
      fetch(glb, { method: 'HEAD' }).then(function (res) {
        if (res && res.ok) { mountModelViewer(viewer, glb); }
        else { mountPhotoViewer(viewer); }
      }).catch(function () { mountPhotoViewer(viewer); });
    } else {
      mountPhotoViewer(viewer);
    }
  }

  function mountModelViewer(viewer, glb) {
    var canvas = $('#viewer-canvas', viewer);
    var hotspots = $('#viewer-hotspots', viewer);
    var label = $('#viewer-label', viewer);
    if (canvas) canvas.remove();
    if (hotspots) hotspots.remove();
    if (label) label.textContent = '';

    var s = document.createElement('script');
    s.type = 'module';
    s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
    document.head.appendChild(s);

    var mv = document.createElement('model-viewer');
    mv.setAttribute('src', glb);
    mv.setAttribute('alt', 'UNILIFT traction hoist 3D model');
    mv.setAttribute('camera-controls', '');
    mv.setAttribute('auto-rotate', '');
    mv.setAttribute('shadow-intensity', '1');
    mv.setAttribute('touch-action', 'pan-y');
    viewer.appendChild(mv);
  }

  function mountPhotoViewer(viewer) {
    var canvas = $('#viewer-canvas', viewer);
    var label = $('#viewer-label', viewer);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var order = (viewer.getAttribute('data-photos') || '1').split(',').map(function (n) { return n.trim(); });
    var offsets = (viewer.getAttribute('data-frame-offsets') || '').split(',').map(function (v) { return parseFloat(v) || 0; });
    var photoBase = viewer.getAttribute('data-photo-base') || 'assets/photos';
    var photoExt = viewer.getAttribute('data-photo-ext') || '.webp';
    var imgs = [];
    var loaded = 0;
    var frame = 0;
    var frameCount = order.length;
    var interacted = false;
    var idleTimer = null;

    order.forEach(function (n, i) {
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () {
        loaded++;
        if (loaded === 1) { fitCanvas(); draw(); }
      };
      im.src = photoBase + '/' + n + photoExt;
      imgs[i] = im;
    });

    function fitCanvas() {
      var rect = viewer.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      var idx = ((Math.round(frame) % frameCount) + frameCount) % frameCount;
      var im = imgs[idx];
      var rect = viewer.getBoundingClientRect();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      if (!im || !im.complete || !im.naturalWidth) return;
      var scale = Math.min(rect.width / im.naturalWidth, rect.height / im.naturalHeight) * 0.92;
      var w = im.naturalWidth * scale, h = im.naturalHeight * scale;
      var offsetX = (offsets[idx] || 0) * rect.width;
      ctx.drawImage(im, (rect.width - w) / 2 + offsetX, (rect.height - h) / 2, w, h);
    }

    function startIdle() {
      if (prefersReduced || interacted) return;
      idleTimer = setInterval(function () {
        if (interacted) { stopIdle(); return; }
        frame = (Math.round(frame) + 1) % frameCount;
        draw();
      }, 1400);
    }
    function stopIdle() { if (idleTimer) { clearInterval(idleTimer); idleTimer = null; } }
    function markInteracted() {
      if (interacted) return;
      interacted = true; stopIdle();
      if (label) label.style.opacity = '0.55';
    }

    // Drag scrub with inertia
    var dragging = false, lastX = 0, velocity = 0, raf = null;
    var SENSITIVITY = 0.02; // frames per px

    function pointerDown(x) { dragging = true; lastX = x; velocity = 0; viewer.classList.add('is-dragging'); markInteracted(); if (raf) { cancelAnimationFrame(raf); raf = null; } }
    function pointerMove(x) {
      if (!dragging) return;
      var dx = x - lastX; lastX = x;
      velocity = -dx * SENSITIVITY;
      frame += velocity;
      draw();
    }
    function pointerUp() {
      if (!dragging) return;
      dragging = false; viewer.classList.remove('is-dragging');
      inertia();
    }
    function inertia() {
      velocity *= 0.94;
      frame += velocity;
      draw();
      if (Math.abs(velocity) > 0.002) { raf = requestAnimationFrame(inertia); }
      else { frame = Math.round(frame); draw(); }
    }

    // Mouse
    canvas.addEventListener('mousedown', function (e) { e.preventDefault(); pointerDown(e.clientX); });
    window.addEventListener('mousemove', function (e) { pointerMove(e.clientX); });
    window.addEventListener('mouseup', pointerUp);

    // Touch
    canvas.addEventListener('touchstart', function (e) { pointerDown(e.touches[0].clientX); }, { passive: true });
    canvas.addEventListener('touchmove', function (e) { pointerMove(e.touches[0].clientX); }, { passive: true });
    canvas.addEventListener('touchend', pointerUp);

    // Wheel steps
    viewer.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) < 1) return;
      e.preventDefault();
      markInteracted();
      frame += e.deltaY > 0 ? -1 : 1;
      frame = Math.round(frame);
      draw();
    }, { passive: false });

    // Keyboard
    viewer.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { markInteracted(); frame = Math.round(frame) + 1; draw(); }
      else if (e.key === 'ArrowRight') { markInteracted(); frame = Math.round(frame) - 1; draw(); }
    });

    // Tap to open lightbox (only when it wasn't a drag)
    var downX = 0;
    canvas.addEventListener('mousedown', function (e) { downX = e.clientX; });
    canvas.addEventListener('click', function (e) {
      if (Math.abs(e.clientX - downX) < 5) openLightbox(order, frame, frameCount, photoBase, photoExt);
    });

    var resizeT;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () { fitCanvas(); draw(); }, 120);
    });

    startIdle();
  }

  /* ---------- Lightbox ---------- */
  function openLightbox(order, frame, frameCount, photoBase, photoExt) {
    var idx = ((Math.round(frame) % frameCount) + frameCount) % frameCount;
    var lb = $('#lightbox') || buildLightbox();
    var img = $('img', lb);
    var base = photoBase || 'assets/photos';
    var ext = photoExt || '.webp';
    img.src = base + '/' + order[idx] + ext;
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function buildLightbox() {
    var lb = document.createElement('div');
    lb.id = 'lightbox'; lb.className = 'lightbox';
    lb.innerHTML = '<button class="lightbox__close" aria-label="Close">×</button><img alt="UNILIFT detail">';
    document.body.appendChild(lb);
    var close = function () { lb.classList.remove('is-open'); document.body.style.overflow = ''; };
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lightbox__close')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    return lb;
  }

  /* ---------- Inside the UNILIFT (sticky + IntersectionObserver) ---------- */
  function initCloseups() {
    var section = document.getElementById('xray');
    if (!section) return;

    if (section._xrayIO) {
      section._xrayIO.disconnect();
      section._xrayIO = null;
    }

    var steps = $$('[data-step]', section);
    var imgs = $$('[data-xray-img]', section);
    var chipEl = $('[data-xray-chip]', section);
    if (!steps.length || !imgs.length) return;

    if (prefersReduced || window.innerWidth < 1024) return;

    var current = 0;

    function activate(i) {
      if (i === current) return;
      current = i;
      steps.forEach(function (s, si) { s.classList.toggle('is-active', si === i); });
      imgs.forEach(function (img, ii) { img.classList.toggle('is-active', ii === i); });
      if (chipEl) {
        chipEl.style.opacity = '0';
        setTimeout(function () {
          chipEl.textContent = steps[i].getAttribute('data-chip') || '';
          chipEl.style.opacity = '1';
        }, 150);
      }
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          activate(parseInt(e.target.getAttribute('data-step'), 10));
        }
      });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });

    steps.forEach(function (s) { io.observe(s); });
    section._xrayIO = io;
  }

  /* ---------- Feature cards (mobile tap-to-expand) ---------- */
  function initFeatureCards() {
    $$('[data-feature]').forEach(function (card) {
      card.addEventListener('click', function () {
        var open = card.classList.toggle('is-open');
        card.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  /* ---------- Spec tabs ---------- */
  function initSpecTabs() {
    var tabs = $$('[data-spec-tab]');
    var panels = $$('[data-spec-panel]');
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-spec-tab');
        tabs.forEach(function (t) { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
        panels.forEach(function (p) {
          var match = p.getAttribute('data-spec-panel') === key;
          p.classList.toggle('is-active', match);
          if (match) { p.removeAttribute('hidden'); } else { p.setAttribute('hidden', ''); }
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
      });
      tab.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(tab);
        if (e.key === 'ArrowRight') { e.preventDefault(); tabs[(i + 1) % tabs.length].focus(); tabs[(i + 1) % tabs.length].click(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); tabs[(i - 1 + tabs.length) % tabs.length].focus(); tabs[(i - 1 + tabs.length) % tabs.length].click(); }
      });
    });
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq() {
    $$('.faq__q').forEach(function (q) {
      q.addEventListener('click', function () {
        var item = q.parentElement;
        var answer = $('.faq__a', item);
        var open = q.getAttribute('aria-expanded') === 'true';
        // close others (single-open accordion feel; comment out for multi-open)
        $$('.faq__q').forEach(function (other) {
          if (other !== q && other.getAttribute('aria-expanded') === 'true') {
            other.setAttribute('aria-expanded', 'false');
            $('.faq__a', other.parentElement).style.height = '0px';
          }
        });
        if (open) { q.setAttribute('aria-expanded', 'false'); answer.style.height = '0px'; }
        else {
          q.setAttribute('aria-expanded', 'true');
          answer.style.height = $('.faq__a-inner', answer).offsetHeight + 'px';
        }
      });
    });
  }

  /* ==========================================================================
     DATASHEET EMAIL-GATE
     ========================================================================== */
  function initDatasheet() {
    var modal = $('#datasheet-modal');
    if (!modal) return;
    var form = $('#datasheet-form');
    var emailInput = $('#datasheet-email');
    var formWrap = $('#modal-form-wrap');
    var success = $('#modal-success');
    var lastFocus = null;

    var triggers = $$('[data-datasheet-trigger]');
    triggers.forEach(function (t) {
      t.addEventListener('click', function () { openDatasheet(); });
    });
    $$('[data-datasheet-gate]').forEach(function (t) {
      t.addEventListener('click', function () { openDatasheetGate(); });
    });

    function openDatasheet() {
      // Returning visitor: skip the gate, download directly.
      if (localStorage.getItem('datasheetUnlocked') === 'true') {
        directDownload();
        return;
      }
      openDatasheetGate();
    }
    function openDatasheetGate() {
      lastFocus = document.activeElement;
      showForm();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (emailInput) setTimeout(function () { emailInput.focus(); }, 50);
    }
    function closeDatasheet() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    function showForm() { formWrap.style.display = ''; success.classList.remove('is-visible'); }
    function showSuccess(isFallback) {
      formWrap.style.display = 'none';
      success.classList.add('is-visible');
      var h3 = $('h3', success);
      var p = $('p', success);
      if (isFallback && h3 && p) {
        h3.textContent = 'Download ready';
        p.textContent = 'We could not deliver the email right now. Use the link below for the PDF.';
      } else if (h3 && p) {
        h3.textContent = 'Check your inbox';
        p.textContent = 'The datasheet is on its way.';
      }
    }

    function directDownload() {
      var a = document.createElement('a');
      a.href = DATASHEET_PDF; a.download = ''; document.body.appendChild(a); a.click(); a.remove();
    }

    $$('[data-modal-close]', modal).forEach(function (b) { b.addEventListener('click', closeDatasheet); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeDatasheet();
      if (e.key === 'Tab' && modal.classList.contains('is-open')) trapFocus(e, modal);
    });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var err = $('[data-error-for="datasheet-email"]');
        if (!isEmail(emailInput.value)) {
          emailInput.classList.add('is-invalid');
          if (err) err.classList.add('is-visible');
          emailInput.focus();
          return;
        }
        emailInput.classList.remove('is-invalid');
        if (err) err.classList.remove('is-visible');

        var payload = { email: emailInput.value.trim(), source: 'datasheet_gate', page: location.pathname, ts: Date.now() };
        var submitBtn = $('button[type="submit"]', form);
        if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = '0.7'; }

        sendLead(payload).then(function (res) {
          if (res.ok) {
            localStorage.setItem('datasheetUnlocked', 'true');
            trackConversion('datasheet_request', { source: 'datasheet_gate' });
            showSuccess(false);
          } else {
            localStorage.setItem('datasheetUnlocked', 'true');
            directDownload();
            showSuccess(true);
          }
          if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = ''; }
        });
      });
    }

    window.__openDatasheetModal = openDatasheet;
    window.__openDatasheetGate = openDatasheetGate;

    // expose for contact form "Get Datasheet" success
    window.__openDatasheetSuccess = function () { openAndShowSuccess(); };
    function openAndShowSuccess() {
      lastFocus = document.activeElement;
      showSuccess();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function trapFocus(e, container) {
    var focusable = $$('a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])', container)
      .filter(function (el) { return el.offsetParent !== null; });
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function sendLead(payload) {
    var url = window.LEAD_WEBHOOK_URL;
    if (!url) {
      return Promise.resolve({ ok: false, skipped: true });
    }
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) { console.warn('[UNILIFT] lead webhook returned', r.status); }
      return { ok: r.ok };
    }).catch(function (err) {
      console.warn('[UNILIFT] lead webhook failed', err);
      return { ok: false, error: true };
    });
  }

  /* ==========================================================================
     CONTACT FORM
     ========================================================================== */
  function initContactForm() {
    var form = $('#quote-form');
    if (!form) return;
    var fields = $('#quote-fields');
    var success = $('#quote-success');
    var status = $('#quote-status');
    var inquiry = 'quote';

    // Inquiry chips
    $$('.chip', form).forEach(function (chip) {
      chip.addEventListener('click', function () {
        $$('.chip', form).forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        inquiry = chip.getAttribute('data-inquiry');
      });
    });

    var showError = function (input, show) {
      input.classList.toggle('is-invalid', show);
      var err = $('[data-error-for="' + input.id + '"]');
      if (err) err.classList.toggle('is-visible', show);
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = ''; status.classList.remove('is-error');

      // Honeypot: silently succeed for bots
      var hp = form.querySelector('input[name="company_website"]');
      if (hp && hp.value) { fields.style.display = 'none'; success.classList.add('is-visible'); return; }

      var name = $('#q-name'), company = $('#q-company'), email = $('#q-email');
      var valid = true;
      if (!name.value.trim()) { showError(name, true); valid = false; } else showError(name, false);
      if (!company.value.trim()) { showError(company, true); valid = false; } else showError(company, false);
      if (!isEmail(email.value)) { showError(email, true); valid = false; } else showError(email, false);
      if (!valid) { status.textContent = 'Please fix the highlighted fields.'; status.classList.add('is-error'); return; }

      var payload = {
        source: 'contact_form',
        name: name.value.trim(),
        company: company.value.trim(),
        email: email.value.trim(),
        phone: ($('#q-phone').value || '').trim(),
        model: $('#q-model').value,
        inquiry: inquiry,
        message: ($('#q-message').value || '').trim(),
        page: location.pathname,
        ts: Date.now()
      };

      var btn = $('[data-cta="form-submit"]', form);
      if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }

      sendLead(payload).then(function (res) {
        if (res.ok) {
          trackConversion('generate_lead', { source: 'contact_form', inquiry: inquiry });
          fields.style.display = 'none';
          success.classList.add('is-visible');
          if (inquiry === 'datasheet') {
            localStorage.setItem('datasheetUnlocked', 'true');
            if (typeof window.__openDatasheetSuccess === 'function') window.__openDatasheetSuccess();
          }
        } else {
          status.classList.add('is-error');
          status.innerHTML = 'We couldn\'t submit right now. Email us at <a href="mailto:info@fas-technology.com">info@fas-technology.com</a>.';
          if (btn) { btn.disabled = false; btn.style.opacity = ''; }
        }
      });
    });
  }

  function mailtoFor(p) {
    var subject = encodeURIComponent('UNILIFT inquiry: ' + (p.company || ''));
    var body = encodeURIComponent(
      'Name: ' + p.name + '\nCompany: ' + p.company + '\nEmail: ' + p.email +
      '\nPhone: ' + p.phone + '\nModel: ' + p.model + '\nInquiry: ' + p.inquiry +
      '\n\n' + p.message);
    return 'mailto:info@fas-technology.com?subject=' + subject + '&body=' + body;
  }

  /* ---------- Partner / distributor CTA ---------- */
  function initPartner() {
    var btn = $('#partner-cta');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      setInquiryChip('distributor');
      scrollToEl($('#contact'));
      trackConversion('quote_click', { cta: 'partner' });
    });
  }

  function setInquiryChip(value) {
    var chips = $$('#quote-form .chip');
    chips.forEach(function (c) {
      c.classList.toggle('is-active', c.getAttribute('data-inquiry') === value);
    });
  }

  /* ---------- Conversion tracking ---------- */
  function initTracking() {
    $$('[data-track="quote"]').forEach(function (el) {
      el.addEventListener('click', function () {
        trackConversion('quote_click', { cta: el.getAttribute('data-cta') || 'quote' });
      });
    });
    $$('[data-cta]').forEach(function (el) {
      var cta = el.getAttribute('data-cta') || '';
      if (/quote/i.test(cta) && !el.hasAttribute('data-track')) {
        el.addEventListener('click', function () {
          trackConversion('quote_click', { cta: cta });
        });
      }
    });
    $$('[data-cta="whatsapp-contact"]').forEach(function (el) {
      el.addEventListener('click', function () {
        trackConversion('whatsapp_click', {});
      });
    });
  }

  /* ---------- Model quote preselect ---------- */
  function initModelQuote() {
    $$('[data-model-quote]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var model = btn.getAttribute('data-model-quote');
        var select = $('#q-model');
        if (select) {
          var opt = Array.prototype.slice.call(select.options).find(function (o) { return o.value === model; });
          if (opt) select.value = model;
        }
        // set inquiry to quote
        var chips = $$('#quote-form .chip');
        setInquiryChip('quote');
        trackConversion('quote_click', { cta: btn.getAttribute('data-cta') || 'model-quote' });
        scrollToEl($('#contact'));
      });
    });
  }

  /* ---------- Cookie consent ---------- */
  function initConsent() {
    var banner = $('#consent-banner');
    if (!banner) return;
    if (localStorage.getItem('cookieConsent')) return;
    setTimeout(function () { banner.classList.add('is-visible'); }, 900);

    var set = function (v) {
      localStorage.setItem('cookieConsent', v);
      banner.classList.remove('is-visible');
      if (v === 'accepted' && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          ad_storage: 'granted', ad_user_data: 'granted',
          ad_personalization: 'granted', analytics_storage: 'granted'
        });
      }
    };
    $('#accept-cookies').addEventListener('click', function () { set('accepted'); });
    $('#decline-cookies').addEventListener('click', function () { set('declined'); });
  }

  /* ---------- Applications parallax ---------- */
  function initAppsParallax() {
    if (prefersReduced || !window.gsap || !window.ScrollTrigger) return;
    $$('[data-app-bg]').forEach(function (bg) {
      window.gsap.to(bg, {
        yPercent: 9, ease: 'none',
        scrollTrigger: { trigger: bg.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

})();
