/* ==========================================================================
   UNILIFT guided contact widget (mailto flow, no AI backend)
   ========================================================================== */
(function () {
  'use strict';

  var REP = {
    name: 'Ruben da Costa',
    title: 'FAS-Tech · UNILIFT specialist',
    email: 'ruben.dacosta@fas-technology.com',
    whatsapp: 'https://wa.me/352691592667',
    avatar: 'assets/avatar_ruben@96.webp',
    avatarLg: 'assets/avatar_ruben.webp'
  };

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TEASER_KEY = 'chatTeaserDismissed';
  var PULSE_KEY = 'chatLauncherPulseDone';

  var root, launcher, teaser, panel, messagesEl, actionsEl, liveRegion, closeBtn;
  var panelBuilt = false;
  var isOpen = false;
  var lastFocus = null;
  var closingShown = false;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    createLauncher();
    scheduleTeaser();
  }

  function createLauncher() {
    root = document.createElement('div');
    root.className = 'chat-widget';
    root.id = 'contact-chat-widget';

    launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'chat-launcher';
    launcher.setAttribute('aria-label', 'Open contact chat');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-controls', 'contact-chat-panel');

    var avatarWrap = document.createElement('span');
    avatarWrap.className = 'chat-launcher__avatar';
    var img = document.createElement('img');
    img.src = REP.avatar;
    img.alt = '';
    img.width = 60;
    img.height = 60;
    img.loading = 'lazy';
    img.decoding = 'async';
    avatarWrap.appendChild(img);

    var dot = document.createElement('span');
    dot.className = 'chat-launcher__dot';
    dot.setAttribute('aria-hidden', 'true');

    launcher.appendChild(avatarWrap);
    launcher.appendChild(dot);
    launcher.addEventListener('click', togglePanel);

    teaser = document.createElement('div');
    teaser.className = 'chat-teaser';
    teaser.setAttribute('role', 'status');
    teaser.innerHTML =
      '<p class="chat-teaser__text">Hi, I\'m Ruben — questions about the UNILIFT?</p>' +
      '<button type="button" class="chat-teaser__dismiss" aria-label="Dismiss message">&times;</button>';

    teaser.querySelector('.chat-teaser__dismiss').addEventListener('click', function (e) {
      e.stopPropagation();
      dismissTeaser();
    });
    teaser.addEventListener('click', function () {
      openPanel();
      dismissTeaser();
    });

    root.appendChild(teaser);
    root.appendChild(launcher);
    document.body.appendChild(root);

    if (!sessionStorage.getItem(PULSE_KEY) && !prefersReduced) {
      launcher.classList.add('chat-launcher--pulse');
      sessionStorage.setItem(PULSE_KEY, '1');
    }
  }

  function scheduleTeaser() {
    if (sessionStorage.getItem(TEASER_KEY)) return;
    var delay = prefersReduced ? 4000 : 4000;
    setTimeout(function () {
      if (sessionStorage.getItem(TEASER_KEY) || isOpen) return;
      teaser.classList.add('is-visible');
      if (!prefersReduced) teaser.classList.add('chat-teaser--animate');
    }, delay);
  }

  function dismissTeaser() {
    sessionStorage.setItem(TEASER_KEY, '1');
    teaser.classList.remove('is-visible', 'chat-teaser--animate');
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
        '<img class="chat-panel__rep-avatar" src="' + REP.avatar + '" alt="" width="40" height="40" loading="lazy" decoding="async">' +
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
    dismissTeaser();
    lastFocus = document.activeElement;
    isOpen = true;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    launcher.setAttribute('aria-expanded', 'true');
    launcher.classList.add('is-hidden');
    resetFlow();
    setTimeout(function () { closeBtn.focus(); }, 50);
  }

  function closePanel() {
    if (!panel || !isOpen) return;
    isOpen = false;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.classList.remove('is-hidden');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    else launcher.focus();
  }

  function resetFlow() {
    messagesEl.innerHTML = '';
    actionsEl.innerHTML = '';
    closingShown = false;
    startGreeting();
  }

  function startGreeting() {
    showTyping(function () {
      addBotMessage('Hi! I\'m Ruben. What can I help you with?');
      showInitialChips();
    });
  }

  function showInitialChips() {
    var chips = [
      { label: 'Request a quote', intent: 'quote' },
      { label: 'Get the datasheet', intent: 'datasheet' },
      { label: 'Become a US distributor', intent: 'distributor' },
      { label: 'Ask a technical question', intent: 'technical' }
    ];
    renderChips(chips, onChipSelect);
  }

  function onChipSelect(intent, label) {
    clearActions();
    addUserMessage(label);
    showTyping(function () {
      switch (intent) {
        case 'quote': handleQuote(); break;
        case 'datasheet': handleDatasheet(); break;
        case 'distributor': handleDistributor(); break;
        case 'technical': handleTechnical(); break;
      }
    });
  }

  function handleQuote() {
    addBotMessage('Great — tell me the model and your project and I\'ll get you a price.');
    var wrap = document.createElement('div');
    wrap.className = 'chat-action-group';

    var mailBtn = document.createElement('a');
    mailBtn.className = 'btn btn--primary btn--sm chat-action-btn';
    mailBtn.href = buildMailto('UNILIFT quote request', quoteBody());
    mailBtn.textContent = 'Open email to Ruben';
    mailBtn.addEventListener('click', function () {
      onMailtoClick('quote');
    });

    var formLink = document.createElement('button');
    formLink.type = 'button';
    formLink.className = 'chat-action-link';
    formLink.textContent = 'Or use the full quote form';
    formLink.addEventListener('click', function () {
      fireWebhook('quote');
      if (typeof window.__scrollToSection === 'function') window.__scrollToSection('contact');
      else {
        var contactEl = document.getElementById('contact');
        if (contactEl) contactEl.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
      }
      closePanel();
    });

    wrap.appendChild(mailBtn);
    wrap.appendChild(formLink);
    actionsEl.appendChild(wrap);
    mailBtn.focus();
    showClosingFallback();
  }

  function handleDatasheet() {
    addBotMessage('I\'ll send the full technical datasheet.');
    var wrap = document.createElement('div');
    wrap.className = 'chat-action-group';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--primary btn--sm chat-action-btn';
    btn.textContent = 'Get the datasheet';
    btn.addEventListener('click', function () {
      fireWebhook('datasheet');
      if (typeof window.__openDatasheetModal === 'function') {
        window.__openDatasheetModal();
      } else {
        var trigger = document.querySelector('[data-datasheet-trigger]');
        if (trigger) trigger.click();
      }
      closePanel();
    });

    wrap.appendChild(btn);
    actionsEl.appendChild(wrap);
    btn.focus();
    showClosingFallback();
  }

  function handleDistributor() {
    addBotMessage('We\'re opening US territories now.');
    var wrap = document.createElement('div');
    wrap.className = 'chat-action-group';

    var mailBtn = document.createElement('a');
    mailBtn.className = 'btn btn--primary btn--sm chat-action-btn';
    mailBtn.href = buildMailto('UNILIFT US distributor enquiry', distributorBody());
    mailBtn.textContent = 'Open email to Ruben';
    mailBtn.addEventListener('click', function () {
      onMailtoClick('distributor');
    });

    wrap.appendChild(mailBtn);
    actionsEl.appendChild(wrap);
    mailBtn.focus();
    showClosingFallback();
  }

  function handleTechnical() {
    addBotMessage('Ask away — I\'ll get back to you fast.');
    var form = document.createElement('form');
    form.className = 'chat-tech-form';
    form.innerHTML =
      '<input type="text" class="chat-tech-input" placeholder="Your question…" aria-label="Your technical question" required maxlength="500">' +
      '<button type="submit" class="chat-tech-send" aria-label="Send question">Send</button>';

    var faqLink = document.createElement('button');
    faqLink.type = 'button';
    faqLink.className = 'chat-action-link';
    faqLink.textContent = 'See the FAQ';
    faqLink.addEventListener('click', function () {
      if (typeof window.__scrollToSection === 'function') window.__scrollToSection('faq');
      else {
        var faqEl = document.getElementById('faq');
        if (faqEl) faqEl.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
      }
      closePanel();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('.chat-tech-input');
      var text = (input.value || '').trim();
      if (!text) { input.focus(); return; }
      addUserMessage(text);
      clearActions();
      var mailto = buildMailto('UNILIFT technical question', technicalBody(text));
      fireWebhook('technical', text);
      copyEmailHint();
      window.location.href = mailto;
      showTyping(function () {
        addBotMessage('Opening your email app with your question — if nothing opens, use the contact details below.');
        showClosingFallback(true);
      });
    });

    actionsEl.appendChild(form);
    actionsEl.appendChild(faqLink);
    form.querySelector('.chat-tech-input').focus();
  }

  function showClosingFallback(force) {
    if (closingShown && !force) return;
    closingShown = true;
    setTimeout(function () {
      var el = document.createElement('div');
      el.className = 'chat-msg chat-msg--bot chat-msg--closing';
      el.innerHTML =
        '<img class="chat-msg__avatar" src="' + REP.avatar + '" alt="" width="32" height="32" loading="lazy" decoding="async">' +
        '<div class="chat-msg__bubble">' +
          '<p class="chat-closing-text">Prefer email or WhatsApp?</p>' +
          '<p class="chat-closing-links">' +
            '<a href="mailto:' + REP.email + '">' + REP.email + '</a>' +
            ' <span class="chat-closing-sep" aria-hidden="true">|</span> ' +
            '<a href="' + REP.whatsapp + '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' +
          '</p>' +
        '</div>';
      messagesEl.appendChild(el);
      scrollMessages();
      announce('Contact options: email ' + REP.email + ' or WhatsApp');
    }, force ? 0 : 120);
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
  }

  function showTyping(done) {
    var row = document.createElement('div');
    row.className = 'chat-msg chat-msg--bot chat-msg--typing';
    row.setAttribute('aria-hidden', 'true');
    row.innerHTML =
      '<img class="chat-msg__avatar" src="' + REP.avatar + '" alt="" width="32" height="32" loading="lazy" decoding="async">' +
      '<div class="chat-msg__bubble chat-msg__bubble--dots"><span></span><span></span><span></span></div>';
    messagesEl.appendChild(row);
    scrollMessages();
    var delay = prefersReduced ? 0 : 600;
    setTimeout(function () {
      row.remove();
      if (done) done();
    }, delay);
  }

  function addBotMessage(text) {
    var row = document.createElement('div');
    row.className = 'chat-msg chat-msg--bot';
    row.innerHTML =
      '<img class="chat-msg__avatar" src="' + REP.avatar + '" alt="" width="32" height="32" loading="lazy" decoding="async">' +
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

  function buildMailto(subject, body) {
    return 'mailto:' + REP.email +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  }

  function quoteBody() {
    return 'Hi Ruben,\n\nI\'m interested in the UNILIFT.\nModel: \nCompany: \nProject / quantity: \n\nThanks,';
  }

  function distributorBody() {
    return 'Hi Ruben,\n\nI\'m interested in becoming a UNILIFT distributor in the US.\nCompany: \nTerritory / state: \n\nThanks,';
  }

  function technicalBody(question) {
    return 'Hi Ruben,\n\nI have a technical question about the UNILIFT:\n\n' + question + '\n\nThanks,';
  }

  function onMailtoClick(intent) {
    fireWebhook(intent);
    copyEmailHint();
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
    toast.textContent = 'Address copied';
    root.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2200);
  }

  function fireWebhook(intent, text) {
    var url = window.LEAD_WEBHOOK_URL;
    if (!url) return;
    try {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'chat_widget',
          intent: intent,
          text: text || undefined,
          ts: Date.now(),
          page: location.pathname
        }),
        keepalive: true
      }).catch(function () { /* fire-and-forget */ });
    } catch (err) { /* ignore */ }
  }
})();
