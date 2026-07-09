/* ==========================================================================
   UNILIFT guided contact widget (mailto flow, no AI backend)
   ========================================================================== */
(function () {
  'use strict';

  var REP;
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PULSE_KEY = 'chatLauncherPulseDone';

  var root, launcherBar, panel, messagesEl, actionsEl, liveRegion, closeBtn;
  var panelBuilt = false;
  var isOpen = false;
  var lastFocus = null;
  var closingShown = false;

  document.addEventListener('DOMContentLoaded', init);

  function getRepConfig() {
    var r = window.__siteRep || {};
    var wa = r.whatsapp || '352691592667';
    if (wa.indexOf('http') !== 0) wa = 'https://wa.me/' + String(wa).replace(/\D/g, '');
    return {
      name: r.name || 'Ruben da Costa',
      title: r.title || 'Sales Director at FAS-Tech',
      email: r.email || 'ruben.dacosta@fas-technology.com',
      whatsapp: wa,
      avatar: r.avatar || 'assets/cararuben.png',
      avatarLg: r.avatarLg || 'assets/cararuben.png'
    };
  }

  function init() {
    REP = getRepConfig();
    createLauncher();
  }

  function createLauncher() {
    root = document.createElement('div');
    root.className = 'chat-widget';
    root.id = 'contact-chat-widget';

    launcherBar = document.createElement('button');
    launcherBar.type = 'button';
    launcherBar.className = 'chat-launcher-bar';
    launcherBar.setAttribute('aria-label', 'Open contact chat with Ruben');
    launcherBar.setAttribute('aria-expanded', 'false');
    launcherBar.setAttribute('aria-controls', 'contact-chat-panel');
    launcherBar.innerHTML =
      '<span class="chat-launcher-bar__label">Need help?</span>' +
      '<span class="chat-launcher-bar__avatar">' +
        '<img src="' + REP.avatar + '" alt="" width="68" height="68" loading="eager" decoding="async">' +
        '<span class="chat-launcher-bar__dot" aria-hidden="true"></span>' +
      '</span>';

    launcherBar.addEventListener('click', togglePanel);
    root.appendChild(launcherBar);
    document.body.appendChild(root);

    if (!sessionStorage.getItem(PULSE_KEY) && !prefersReduced) {
      launcherBar.classList.add('chat-launcher-bar--pulse');
      sessionStorage.setItem(PULSE_KEY, '1');
    }
  }

  function togglePanel() {
    if (isOpen) closePanel();
    else openPanel();
  }

  function buildPanel() {
    if (panelBuilt) return;
    panelBuilt = true;

    panel = document.createElement('aside');
    panel.id = 'contact-chat-panel';
    panel.className = 'chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Contact Ruben da Costa');
    panel.setAttribute('aria-hidden', 'true');

    var header = document.createElement('header');
    header.className = 'chat-panel__header';
    header.innerHTML =
      '<div class="chat-panel__rep">' +
        '<img class="chat-panel__rep-avatar" src="' + REP.avatarLg + '" alt="" width="48" height="48" loading="lazy" decoding="async">' +
        '<div class="chat-panel__rep-meta">' +
          '<strong class="chat-panel__rep-name">' + REP.name + '</strong>' +
          '<span class="chat-panel__rep-title">' + REP.title + '</span>' +
        '</div>' +
      '</div>' +
      '<span class="chat-panel__online">Online</span>' +
      '<button type="button" class="chat-panel__close" aria-label="Close chat">&times;</button>';

    closeBtn = header.querySelector('.chat-panel__close');
    closeBtn.addEventListener('click', closePanel);

    messagesEl = document.createElement('div');
    messagesEl.className = 'chat-panel__messages';

    actionsEl = document.createElement('div');
    actionsEl.className = 'chat-panel__actions';

    liveRegion = document.createElement('div');
    liveRegion.className = 'visually-hidden';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');

    var body = document.createElement('div');
    body.className = 'chat-panel__body';
    body.appendChild(messagesEl);
    body.appendChild(actionsEl);

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(liveRegion);
    root.appendChild(panel);

    document.addEventListener('keydown', onKeydown);
  }

  function onKeydown(e) {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closePanel();
      return;
    }
    if (e.key === 'Tab') trapFocus(e);
  }

  function trapFocus(e) {
    var focusable = Array.prototype.slice.call(
      panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return el.offsetParent !== null; });
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openPanel() {
    buildPanel();
    lastFocus = document.activeElement;
    isOpen = true;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    launcherBar.setAttribute('aria-expanded', 'true');
    launcherBar.classList.add('is-hidden');
    resetFlow();
    setTimeout(function () { closeBtn.focus(); }, 50);
  }

  function closePanel() {
    if (!panel || !isOpen) return;
    isOpen = false;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    launcherBar.setAttribute('aria-expanded', 'false');
    launcherBar.classList.remove('is-hidden');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    else launcherBar.focus();
  }

  function resetFlow() {
    messagesEl.innerHTML = '';
    actionsEl.innerHTML = '';
    closingShown = false;
    startGreeting();
  }

  function startGreeting() {
    addBotMessage('I\'m Ruben, Sales Director at FAS-Tech. I\'m here to help with anything, any question you have.');
    addBotMessage('What can I help you with?');
    showInitialChips();
  }

  function showInitialChips() {
    var chips = [
      { label: 'Request a quote', intent: 'quote' },
      { label: 'Book a call', intent: 'booking' },
      { label: 'Get the datasheet', intent: 'datasheet' },
      { label: 'Become a US distributor', intent: 'distributor' },
      { label: 'Ask a technical question', intent: 'technical' },
      { label: 'Other', intent: 'other' }
    ];
    renderChips(chips, onChipSelect);
  }

  function onChipSelect(intent, label) {
    clearActions();
    addUserMessage(label);
    trackIntent(intent);
    switch (intent) {
      case 'quote': handleQuote(); break;
      case 'booking': handleBooking(); break;
      case 'datasheet': handleDatasheet(); break;
      case 'distributor': handleDistributor(); break;
      case 'technical': handleTechnical(); break;
      case 'other': handleOther(); break;
    }
  }

  function handleQuote() {
    addBotMessage('Great. Tell me the model and your project and I will get you a price.');
    showClosingFallback();
  }

  function handleBooking() {
    addBotMessage('Pick a time on my calendar and I will confirm by email.');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--primary chat-action-btn';
    btn.textContent = 'Open calendar';
    btn.addEventListener('click', function () {
      openBooking();
      closePanel();
    });
    actionsEl.appendChild(btn);
    btn.focus();
  }

  function openBooking() {
    if (typeof window.__openBooking === 'function') {
      window.__openBooking();
      return;
    }
    var trigger = document.querySelector('[data-booking-open]');
    if (trigger) trigger.click();
  }

  function handleDatasheet() {
    addBotMessage('Enter your email on the next screen and I will send you the full technical datasheet.');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--primary chat-action-btn';
    btn.textContent = 'Continue to datasheet';
    btn.addEventListener('click', function () {
      openDatasheetGate();
      closePanel();
    });
    actionsEl.appendChild(btn);
    btn.focus();
  }

  function handleDistributor() {
    addBotMessage('We are opening US territories now. Get in touch and we can talk about your market.');
    showClosingFallback();
  }

  function handleTechnical() {
    addBotMessage('Contact me directly at my personal email and I will reply as quickly as possible.');
    var faqLink = document.createElement('button');
    faqLink.type = 'button';
    faqLink.className = 'chat-action-link';
    faqLink.textContent = 'See the FAQ';
    faqLink.addEventListener('click', function () {
      scrollToSection('faq');
      closePanel();
    });
    actionsEl.appendChild(faqLink);
    showClosingFallback();
  }

  function handleOther() {
    addBotMessage('Happy to help. Reach out by email or WhatsApp and tell me what you need.');
    showClosingFallback();
  }

  function showClosingFallback() {
    if (closingShown) return;
    closingShown = true;

    var card = document.createElement('div');
    card.className = 'chat-contact-card';
    card.innerHTML =
      '<p class="chat-contact-card__lead">Prefer email or WhatsApp?</p>' +
      '<div class="chat-contact-block">' +
        '<p class="chat-contact-block__label">Contact me directly at my personal email:</p>' +
        '<a class="chat-contact-email" href="mailto:' + REP.email + '">' + REP.email + '</a>' +
      '</div>' +
      '<div class="chat-contact-block">' +
        '<p class="chat-contact-block__label">Or send me a WhatsApp message:</p>' +
        '<a class="btn btn--primary chat-contact-wa" href="' + REP.whatsapp + '" target="_blank" rel="noopener noreferrer">Message on WhatsApp</a>' +
      '</div>';

    card.querySelector('.chat-contact-email').addEventListener('click', function () {
      copyEmailHint();
      trackIntent('email_click');
    });

    card.querySelector('.chat-contact-wa').addEventListener('click', function () {
      trackIntent('whatsapp_click');
    });

    actionsEl.appendChild(card);
    scrollMessages();
    announce('Contact options: email or WhatsApp');
  }

  function openDatasheetGate() {
    if (typeof window.__openDatasheetGate === 'function') {
      window.__openDatasheetGate();
      return;
    }
    var trigger = document.querySelector('[data-datasheet-trigger]');
    if (trigger) trigger.click();
  }

  function renderChips(items, onSelect) {
    var wrap = document.createElement('div');
    wrap.className = 'chat-chips';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Quick replies');
    items.forEach(function (item) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chat-chip';
      btn.textContent = item.label;
      btn.addEventListener('click', function () {
        onSelect(item.intent, item.label);
      });
      wrap.appendChild(btn);
    });
    actionsEl.appendChild(wrap);
    wrap.querySelector('.chat-chip').focus();
  }

  function clearActions() {
    actionsEl.innerHTML = '';
    closingShown = false;
  }

  function addBotMessage(text) {
    var row = document.createElement('div');
    row.className = 'chat-msg chat-msg--bot';
    row.innerHTML =
      '<img class="chat-msg__avatar" src="' + REP.avatar + '" alt="" width="36" height="36" loading="lazy" decoding="async">' +
      '<div class="chat-msg__bubble"></div>';
    row.querySelector('.chat-msg__bubble').textContent = text;
    messagesEl.appendChild(row);
    scrollMessages();
    announce(text);
  }

  function addUserMessage(text) {
    var row = document.createElement('div');
    row.className = 'chat-msg chat-msg--user';
    row.innerHTML = '<div class="chat-msg__bubble"></div>';
    row.querySelector('.chat-msg__bubble').textContent = text;
    messagesEl.appendChild(row);
    scrollMessages();
  }

  function scrollMessages() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function announce(text) {
    if (liveRegion) liveRegion.textContent = text;
  }

  function scrollToSection(id) {
    if (typeof window.__scrollToSection === 'function') {
      window.__scrollToSection(id);
      return;
    }
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
  }

  function copyEmailHint() {
    if (!navigator.clipboard || !navigator.clipboard.writeText) return;
    navigator.clipboard.writeText(REP.email).then(function () {
      showCopiedToast();
    }).catch(function () { /* ignore */ });
  }

  function showCopiedToast() {
    var existing = root.querySelector('.chat-copy-toast');
    if (existing) existing.remove();
    var toast = document.createElement('p');
    toast.className = 'chat-copy-toast';
    toast.setAttribute('role', 'status');
    toast.textContent = 'Email copied';
    root.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2200);
  }

  function trackIntent(intent, text) {
    var payload = {
      source: 'chat_widget',
      intent: intent,
      text: text || undefined,
      ts: Date.now(),
      page: location.pathname
    };
    if (typeof window.__sendLead === 'function') {
      window.__sendLead(payload);
      return;
    }
    var url = window.LEAD_WEBHOOK_URL;
    if (!url) return;
    try {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () { /* fire-and-forget */ });
    } catch (err) { /* ignore */ }
  }
})();
