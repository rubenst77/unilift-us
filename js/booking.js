/* ==========================================================================
   Booking modal — lightweight CTA that opens calendar in a new tab
   ========================================================================== */
(function () {
  'use strict';

  var modal, actionEl, fallbackEl, ctaEl, lastFocus;

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

    actionEl = document.getElementById('booking-action');
    fallbackEl = document.getElementById('booking-fallback');
    ctaEl = document.getElementById('booking-cta');

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

    if (ctaEl) {
      ctaEl.addEventListener('click', function () {
        closeBooking();
      });
    }
  }

  function openBooking() {
    if (!modal) return;
    hydrateHeader();
    mountAction();
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

  function mountAction() {
    var b = cfg();
    var url = (b.url || '').trim();
    var r = rep();

    if (!b.enabled || !url) {
      if (actionEl) actionEl.hidden = true;
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
    if (actionEl) actionEl.hidden = false;
    if (ctaEl) {
      ctaEl.href = url;
      var label = (b.ctaLabel || 'Book the meeting').trim();
      ctaEl.innerHTML = label + ' <span class="btn__arrow" aria-hidden="true">&rarr;</span>';
    }
  }
})();
