/* ==========================================================================
   Booking modal — Calendly / iframe embed for Ruben's calendar
   ========================================================================== */
(function () {
  'use strict';

  var modal, embedEl, fallbackEl, lastFocus, calendlyLoaded = false, widgetMounted = false;

  document.addEventListener('DOMContentLoaded', init);

  function cfg() {
    return window.__siteBooking || {};
  }

  function rep() {
    return window.__siteRep || {};
  }

  function init() {
    modal = document.getElementById('booking-modal');
    if (!modal) return;

    embedEl = document.getElementById('booking-embed');
    fallbackEl = document.getElementById('booking-fallback');

    modal.querySelectorAll('[data-booking-close]').forEach(function (el) {
      el.addEventListener('click', closeBooking);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        e.preventDefault();
        closeBooking();
      }
    });

    window.__openBooking = openBooking;

    document.querySelectorAll('[data-booking-open]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openBooking();
      });
    });
  }

  function openBooking() {
    if (!modal) return;
    hydrateHeader();
    mountEmbed();
    lastFocus = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var closeBtn = modal.querySelector('.modal__close');
    if (closeBtn) closeBtn.focus();
  }

  function closeBooking() {
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function hydrateHeader() {
    var r = rep();
    var b = cfg();
    var avatar = document.getElementById('booking-avatar');
    var name = document.getElementById('booking-name');
    var title = document.getElementById('booking-title');
    var desc = document.getElementById('booking-desc');
    var duration = document.getElementById('booking-duration');

    if (avatar && r.avatarLg) {
      avatar.src = r.avatarLg;
      avatar.alt = r.name || 'Ruben da Costa';
    }
    if (name) name.textContent = r.name || 'Ruben da Costa';
    if (title) title.textContent = b.title || 'Book a call';
    if (desc) desc.textContent = b.description || '';
    if (duration) duration.textContent = b.duration || '';
  }

  function mountEmbed() {
    var b = cfg();
    var url = (b.url || '').trim();
    var r = rep();

    if (!b.enabled || !url) {
      if (embedEl) embedEl.hidden = true;
      if (fallbackEl) {
        fallbackEl.hidden = false;
        var email = r.email || 'ruben.dacosta@fas-technology.com';
        fallbackEl.innerHTML =
          '<p class="booking-fallback__text">Online scheduling is being set up. Email Ruben directly and he will find a time with you.</p>' +
          '<a class="btn btn--primary btn--full" href="mailto:' + email + '">Email ' + (r.name || 'Ruben') + '</a>';
      }
      return;
    }

    if (fallbackEl) fallbackEl.hidden = true;
    if (embedEl) {
      embedEl.hidden = false;
      embedEl.innerHTML = '';
    }

    if ((b.provider || 'calendly') === 'calendly') {
      loadCalendly(url, embedEl);
    } else {
      var iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.title = 'Book a meeting';
      iframe.className = 'booking-embed__frame';
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      embedEl.appendChild(iframe);

      var ext = document.createElement('p');
      ext.className = 'booking-embed__external';
      ext.innerHTML =
        'Calendar not loading? <a href="' + url + '" target="_blank" rel="noopener noreferrer">Open booking page in a new tab</a>.';
      embedEl.appendChild(ext);
    }
  }

  function loadCalendly(url, parent) {
    if (!parent) return;
    parent.innerHTML = '';
    var host = document.createElement('div');
    host.className = 'booking-embed__calendly';
    parent.appendChild(host);

    var mount = function () {
      if (!window.Calendly || widgetMounted) return;
      widgetMounted = true;
      window.Calendly.initInlineWidget({
        url: url,
        parentElement: host,
        resize: true
      });
    };

    if (window.Calendly) {
      mount();
      return;
    }

    if (!calendlyLoaded) {
      calendlyLoaded = true;
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(link);

      var script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = mount;
      document.head.appendChild(script);
    } else {
      var wait = setInterval(function () {
        if (window.Calendly) {
          clearInterval(wait);
          mount();
        }
      }, 80);
      setTimeout(function () { clearInterval(wait); }, 8000);
    }
  }
})();
