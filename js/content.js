/* ==========================================================================
   UNILIFT: CMS content hydration
   Reads inline #site-data JSON and populates the DOM + JSON-LD.
   ========================================================================== */
(function () {
  'use strict';

  var POINT_ICONS = [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7 4v6c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path d="M6 20V10l6-4 6 4v10"/><path d="M10 20v-5h4v5"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
  ];

  function getSiteData() {
    var el = document.getElementById('site-data');
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (err) {
      console.error('Failed to parse site-data JSON', err);
      return null;
    }
  }

  function absUrl(path, siteUrl) {
    if (!path) return siteUrl || '';
    if (/^https?:\/\//i.test(path)) return path;
    var base = (siteUrl || '').replace(/\/$/, '');
    return base + '/' + String(path).replace(/^\//, '');
  }

  function setHtml(el, html) {
    if (el && html != null) el.innerHTML = html;
  }

  function setText(el, text) {
    if (el && text != null) el.textContent = text;
  }

  function val(item) {
    return item.valueHtml || item.value || '';
  }

  function hydrateGlobal(d) {
    var g = d.global;
    if (!g) return;

    window.SITE_URL = g.SITE_URL || window.SITE_URL;
    window.GA4_ID = g.GA4_ID || window.GA4_ID;
    window.GADS_ID = g.GADS_ID || window.GADS_ID;
    window.LEAD_WEBHOOK_URL = g.LEAD_WEBHOOK_URL != null ? g.LEAD_WEBHOOK_URL : window.LEAD_WEBHOOK_URL;

    document.title = g.seo.title;
    setText(document.querySelector('meta[name="description"]'), g.seo.description);
    setText(document.querySelector('meta[name="author"]'), g.companyName);
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = g.SITE_URL + '/';

    setText(document.querySelector('meta[property="og:url"]'), g.SITE_URL + '/');
    setText(document.querySelector('meta[property="og:title"]'), g.seo.ogTitle);
    setText(document.querySelector('meta[property="og:description"]'), g.seo.ogDescription);
    setText(document.querySelector('meta[property="og:image"]'), absUrl(g.seo.ogImage, g.SITE_URL));
    setText(document.querySelector('meta[property="og:site_name"]'), g.brandName);
    setText(document.querySelector('meta[name="twitter:title"]'), g.seo.twitterTitle);
    setText(document.querySelector('meta[name="twitter:description"]'), g.seo.twitterDescription);
    setText(document.querySelector('meta[name="twitter:image"]'), absUrl(g.seo.ogImage, g.SITE_URL));

    var heroPreload = document.querySelector('link[rel="preload"][as="image"]');
    if (heroPreload && d.hero) heroPreload.href = d.hero.backgroundImage;

    setText(document.querySelector('[data-cms="nav-cta"]'), g.navCta);

    if (g.contact) {
      setText(document.querySelector('[data-cms="contact-kicker"]'), g.contact.kicker);
      setText(document.querySelector('[data-cms="contact-title"]'), g.contact.title);
      setText(document.querySelector('[data-cms="contact-intro"]'), g.contact.intro);
    }

    setText(document.querySelector('[data-cms="footer-tagline"]'), '');
    var tagline = document.querySelector('[data-cms="footer-tagline"]');
    if (tagline) tagline.innerHTML = g.tagline;

    var linkedin = document.querySelector('[data-cms="social-linkedin"]');
    var youtube = document.querySelector('[data-cms="social-youtube"]');
    if (linkedin) linkedin.href = g.social.linkedin;
    if (youtube) youtube.href = g.social.youtube;

    var footerAddr = document.querySelector('[data-cms="footer-address"]');
    if (footerAddr && g.address) {
      var footerLines = g.address.street + '<br>' + g.address.postalCode + ' ' + g.address.city;
      if (g.address.country) footerLines += ', ' + g.address.country;
      footerAddr.innerHTML =
        footerLines + '<br><br>' +
        '<a href="tel:' + g.phoneTel + '" class="footer__link">' + g.phone + '</a><br>' +
        '<a href="mailto:' + g.email + '" class="footer__link">' + g.email + '</a>';
    }

    var legal = document.querySelector('[data-cms="footer-legal"]');
    if (legal) {
      legal.innerHTML =
        '&copy; ' + g.copyrightYear + ' ' + g.companyName +
        ' &middot; R.C.S ' + g.rcs + ' &middot; VAT ' + g.vat;
    }

    var emailTile = document.querySelector('[data-cms="contact-email"]');
    var waTile = document.querySelector('[data-cms="contact-whatsapp"]');
    var addrTile = document.querySelector('[data-cms="contact-address"]');
    if (emailTile) {
      emailTile.href = 'mailto:' + g.email;
      setText(emailTile.querySelector('[data-cms-value]'), g.email);
    }
    if (waTile) {
      waTile.href = 'https://wa.me/' + g.whatsapp.replace(/\D/g, '');
      setText(waTile.querySelector('[data-cms-value]'), g.phone);
    }
    if (addrTile) setHtml(addrTile.querySelector('[data-cms-value]'), g.address.display);

    var pdfLink = document.querySelector('[data-cms="datasheet-pdf"]');
    if (pdfLink && g.datasheetPdf) pdfLink.href = g.datasheetPdf;

    if (g.rep) {
      window.__siteRep = g.rep;
    }
    if (g.booking) {
      window.__siteBooking = g.booking;
    }
  }

  function hydrateHero(d) {
    var h = d.hero;
    if (!h) return;

    setText(document.querySelector('[data-cms="hero-kicker"]'), h.kicker);
    var title = document.querySelector('[data-cms="hero-title"]');
    if (title) {
      title.innerHTML =     h.titleLines.map(function (line) {
        var text = typeof line === 'string' ? line : (line && line.line) || '';
        return '<span class="line"><span data-hero-anim>' + text + '</span></span>';
      }).join('');
    }
    setText(document.querySelector('[data-cms="hero-subtitle"]'), h.subtitle);
    setText(document.querySelector('[data-cms="hero-primary-cta"]'), h.primaryCta);
    setText(document.querySelector('[data-cms="hero-secondary-cta"]'), h.secondaryCta);
    setText(document.querySelector('[data-cms="hero-scroll"]'), h.scrollLabel);

    var bg = document.querySelector('[data-hero-bg]');
    if (bg) bg.style.backgroundImage = "url('" + h.backgroundImage + "')";

    var certs = document.querySelector('[data-cms="hero-certs"]');
    if (certs) {
      certs.innerHTML = h.certifications.map(function (c) {
        return '<li>' + c + '</li>';
      }).join('');
    }
  }

  function hydrateProduct(d) {
    var p = d.product;
    if (!p) return;

    setText(document.querySelector('[data-cms="product-kicker"]'), p.kicker);
    setHtml(document.querySelector('[data-cms="product-heading"]'), p.headingHtml);
    setHtml(document.querySelector('[data-cms="product-intro"]'), p.intro);

    var points = document.querySelector('[data-cms="product-points"]');
    if (!points) return;
    points.innerHTML = p.points.map(function (pt, i) {
      var title = pt.titleHtml || pt.title;
      return (
        '<li class="point">' +
          '<span class="point__icon" aria-hidden="true">' + (POINT_ICONS[i] || POINT_ICONS[0]) + '</span>' +
          '<span>' +
            '<span class="point__label">' + title + '</span>' +
            '<span class="point__desc">' + pt.line + '</span>' +
          '</span>' +
        '</li>'
      );
    }).join('');
  }

  function hydrateFeatures(d) {
    var f = d.features;
    var list = document.querySelector('[data-cms="features-list"]');
    if (!f || !list) return;

    setText(document.querySelector('[data-cms="features-kicker"]'), f.kicker);
    setHtml(document.querySelector('[data-cms="features-heading"]'), f.headingHtml);
    setText(document.querySelector('[data-cms="features-subline"]'), f.subline);

    list.innerHTML = f.items.map(function (item) {
      return (
        '<article class="feature-row">' +
          '<div class="feature-row__thumb">' +
            '<img src="' + item.image + '" width="400" height="400" loading="lazy" decoding="async" alt="' + item.imageAlt + '">' +
          '</div>' +
          '<div class="feature-row__body">' +
            '<h3 class="feature-row__title">' + item.title + '</h3>' +
            '<p class="feature-row__desc">' + item.descriptionHtml + '</p>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function hydrateCloseups(d) {
    var c = d.closeups;
    if (!c) return;

    setText(document.querySelector('[data-cms="closeups-kicker"]'), c.kicker);
    setText(document.querySelector('[data-cms="closeups-heading"]'), c.heading);

    var stepsRoot = document.querySelector('[data-xray-steps]');
    var mobileRoot = document.querySelector('[data-xray-mobile]');
    var items = c.items || [];

    function renderSpecs(specs) {
      if (!specs || !specs.length) return '';
      return (
        '<div class="xray__spec">' +
          specs.map(function (s) {
            return '<div><span class="k">' + s.k + '</span><span class="v">' + s.v + '</span></div>';
          }).join('') +
        '</div>'
      );
    }

    if (stepsRoot) {
      stepsRoot.innerHTML =
        '<div class="xray__carousel" data-xray-carousel>' +
          '<div class="xray__stage">' +
            '<div class="xray__media-col">' +
              '<div class="xray__media">' +
              items.map(function (item, i) {
                return (
                  '<article class="xray__frame' + (i === 0 ? ' is-active' : '') + '" data-xray-slide="' + i + '">' +
                    '<img src="' + item.image + '" width="1563" height="1563" loading="' + (i === 0 ? 'eager' : 'lazy') + '" ' +
                      'decoding="async" alt="' + (item.imageAlt || '') + '">' +
                  '</article>'
                );
              }).join('') +
              '<div class="xray__slashes-wrap" aria-hidden="true">' +
                '<div class="brand-slashes brand-slashes--xray-inset">' +
                  '<span class="brand-slashes__bar"></span>' +
                  '<span class="brand-slashes__bar"></span>' +
                '</div>' +
              '</div>' +
              '</div>' +
              '<div class="xray__media-foot">' +
                '<div class="xray__progress" aria-hidden="true">' +
                  items.map(function (item, i) {
                    return '<span class="xray__dot' + (i === 0 ? ' is-active' : '') + '" data-xray-dot="' + i + '">' + item.step + '</span>';
                  }).join('') +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="xray__copy-stack">' +
              items.map(function (item, i) {
                return (
                  '<article class="xray__panel' + (i === 0 ? ' is-active' : '') + '" data-xray-slide="' + i + '">' +
                    '<div class="xray__eyebrow">' +
                      '<span class="xray__idx">' + item.step + '</span>' +
                      '<span class="xray__rule" aria-hidden="true"></span>' +
                    '</div>' +
                    '<h3 class="xray__title">' + item.title + '</h3>' +
                    '<p class="xray__sub">' + item.subline + '</p>' +
                    '<p class="xray__text">' + item.text + '</p>' +
                    renderSpecs(item.specs) +
                  '</article>'
                );
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>';
    }

    if (mobileRoot) {
      mobileRoot.innerHTML =
        '<div class="xray-mobile">' +
          '<div class="xray-mobile__nav" aria-label="Slide navigation">' +
            items.map(function (item, i) {
              return (
                '<button type="button" class="xray-mobile__nav-dot' + (i === 0 ? ' is-active' : '') + '" data-xray-mobile-jump="' + i + '">' +
                  item.step +
                '</button>'
              );
            }).join('') +
          '</div>' +
          items.map(function (item, i) {
            var img = item.mobileImage || item.image;
            var alt = item.mobileImageAlt || item.imageAlt || '';
            return (
              '<article class="xray-mobile__card reveal" id="xray-mobile-' + i + '" data-xray-mobile-card="' + i + '">' +
                '<div class="xray-mobile__media">' +
                  '<img src="' + img + '" width="800" height="800" loading="' + (i === 0 ? 'eager' : 'lazy') + '" ' +
                    'decoding="async" alt="' + alt + '">' +
                  '<div class="xray__slashes-wrap" aria-hidden="true">' +
                    '<div class="brand-slashes brand-slashes--xray-inset">' +
                      '<span class="brand-slashes__bar"></span>' +
                      '<span class="brand-slashes__bar"></span>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
                '<div class="xray-mobile__body">' +
                  '<div class="xray__eyebrow">' +
                    '<span class="xray__idx">' + item.step + '</span>' +
                    '<span class="xray__rule" aria-hidden="true"></span>' +
                  '</div>' +
                  '<h3 class="xray__title">' + item.title + '</h3>' +
                  '<p class="xray__sub">' + item.subline + '</p>' +
                  '<p class="xray__text">' + item.text + '</p>' +
                  renderSpecs(item.specs) +
                '</div>' +
              '</article>'
            );
          }).join('') +
        '</div>';
    }
  }

  function hydrateModels(d) {
    var m = d.models;
    if (!m) return;

    setText(document.querySelector('[data-cms="models-kicker"]'), m.kicker);
    setHtml(document.querySelector('[data-cms="models-heading"]'), m.headingHtml);
    setText(document.querySelector('[data-cms="models-subline"]'), m.subline);

    var cards = document.querySelector('[data-cms="models-cards"]');
    if (cards) {
      cards.innerHTML = m.models.map(function (model) {
        var featured = model.featured ? ' model-card--featured' : '';
        var ribbon = model.ribbon
          ? '<span class="model-card__ribbon">' + model.ribbon + '</span>'
          : '';
        var btnClass = model.ctaVariant === 'primary' ? 'btn btn--primary' : 'btn btn--outline';
        return (
          '<div class="model-card' + featured + ' reveal">' +
            ribbon +
            '<div class="model-card__phase">' + model.phaseLabel + '</div>' +
            '<div class="model-card__name">' + model.ref + '</div>' +
            '<div>' +
              '<span class="model-card__load num count-up" data-target="' + model.wllLbsRaw + '">' + model.wllLbs + '</span>' +
              '<span class="model-card__unit">lbs</span>' +
            '</div>' +
            '<div class="model-card__metric">' + model.wllKg + '</div>' +
            '<div class="model-card__specs">' +
              '<div class="model-spec-row"><span class="label">Motor</span><span class="value">' + model.motorDisplay + '</span></div>' +
              '<div class="model-spec-row"><span class="label">Rated current</span><span class="value">' + model.ratedCurrent + '</span></div>' +
              '<div class="model-spec-row"><span class="label">Control box</span><span class="value">' + model.controlBox + '</span></div>' +
              '<div class="model-spec-row"><span class="label">Connector</span><span class="value">' + model.connector + '</span></div>' +
            '</div>' +
            '<button class="' + btnClass + ' btn--full btn--sm" data-model-quote="' + model.ref + '" data-cta="' + model.ctaId + '">' +
              model.ctaLabel + ' <span class="btn__arrow" aria-hidden="true">&rarr;</span>' +
            '</button>' +
          '</div>'
        );
      }).join('');
    }

    var strip = document.querySelector('[data-cms="models-strip"]');
    if (strip) {
      strip.innerHTML = m.sharedStrip.map(function (item) {
        var label = item.label ? item.label + ' ' : '';
        return '<span class="models__shared-item">' + label + item.valueHtml + '</span>';
      }).join('');
    }

    var thead = document.querySelector('[data-cms="models-table-head"]');
    if (thead) {
      thead.innerHTML =
        '<tr>' +
          '<th scope="col">Parameter</th>' +
          m.models.map(function (model) {
            return '<th scope="col">' + model.ref + '</th>';
          }).join('') +
        '</tr>';
    }

    var tbody = document.querySelector('[data-cms="models-table-body"]');
    if (tbody) {
      var rows = [
        {
          label: 'WLL',
          values: m.models.map(function (model) {
            return model.wllLbs + ' lbs <span class="metric">(' + model.wllKgMetric + ')</span>';
          })
        },
        { label: 'Supply', values: m.models.map(function (model) { return model.supply; }) },
        { label: 'Supply freq.', values: m.models.map(function (model) { return model.supplyFreq; }) },
        {
          label: 'Motor',
          values: m.models.map(function (model) {
            return model.motorHp + ' <span class="metric">(' + model.motorKw + ')</span>';
          })
        },
        { label: 'Rated current', values: m.models.map(function (model) { return model.ratedCurrent; }) },
        { label: 'Control box', values: m.models.map(function (model) { return model.controlBox; }) },
        { label: 'Connector', values: m.models.map(function (model) { return model.connector; }) }
      ];
      tbody.innerHTML = rows.map(function (row) {
        return (
          '<tr><td>' + row.label + '</td>' +
          row.values.map(function (cell) {
            return '<td class="val">' + cell + '</td>';
          }).join('') +
          '</tr>'
        );
      }).join('');
    }

    var select = document.getElementById('q-model');
    if (select) {
      var current = select.value;
      var options = m.models.map(function (model) {
        return '<option value="' + model.ref + '">' + model.formOption + '</option>';
      }).join('');
      select.innerHTML = options + '<option value="not-sure">Not sure yet</option>';
      select.value = current || 'not-sure';
    }
  }

  function hydrateSpecs(d) {
    var s = d.specs;
    if (!s) return;

    setText(document.querySelector('[data-cms="specs-kicker"]'), s.kicker);
    setText(document.querySelector('[data-cms="specs-heading"]'), s.heading);
    setText(document.querySelector('[data-cms="specs-subline"]'), s.subline);
    setText(document.querySelector('[data-cms="specs-download-title"]'), s.downloadTitle);
    setText(document.querySelector('[data-cms="specs-download-text"]'), s.downloadText);
    setText(document.querySelector('[data-cms="specs-download-cta"]'), s.downloadCta);

    var tabs = document.querySelector('[data-cms="specs-tabs"]');
    var panels = document.querySelector('[data-cms="specs-panels"]');
    if (!tabs || !panels) return;

    tabs.innerHTML = s.tabs.map(function (tab, i) {
      var active = i === 0;
      return (
        '<button class="specs__tab' + (active ? ' is-active' : '') + '" role="tab" aria-selected="' + active + '" ' +
          'aria-controls="panel-' + tab.id + '" id="tab-' + tab.id + '" data-spec-tab="' + tab.id + '">' +
          tab.label +
        '</button>'
      );
    }).join('');

    panels.innerHTML = s.tabs.map(function (tab, i) {
      var active = i === 0;
      var grid = tab.items.map(function (item) {
        return (
          '<div class="spec-item">' +
            '<span class="spec-item__label">' + item.label + '</span>' +
            '<span class="spec-item__value">' + val(item) + '</span>' +
          '</div>'
        );
      }).join('');

      var cable = '';
      if (tab.cableTable) {
        var ct = tab.cableTable;
        cable =
          '<h4 class="specs__sub">' + ct.heading + '</h4>' +
          '<div class="compare">' +
            '<table class="compare__table" style="min-width:480px;">' +
              '<thead><tr><th scope="col">Working height</th>' +
              ct.columns.map(function (col) { return '<th scope="col">' + col + '</th>'; }).join('') +
              '</tr></thead>' +
              '<tbody><tr><td>' + ct.rowLabel + '</td>' +
              ct.values.map(function (v) { return '<td class="val">' + v + '</td>'; }).join('') +
              '</tr></tbody>' +
            '</table>' +
          '</div>';
      }

      return (
        '<div class="specs__panel' + (active ? ' is-active' : '') + '" id="panel-' + tab.id + '" role="tabpanel" ' +
          'aria-labelledby="tab-' + tab.id + '" data-spec-panel="' + tab.id + '"' +
          (active ? '' : ' hidden') + '>' +
          '<div class="specs__grid">' + grid + '</div>' +
          cable +
          '<div class="specs__callout">' + tab.calloutHtml + '</div>' +
        '</div>'
      );
    }).join('');
  }

  function hydrateDistributors(d) {
    var dist = d.distributors;
    if (!dist) return;

    setText(document.querySelector('[data-cms="distributors-kicker"]'), dist.kicker);
    setText(document.querySelector('[data-cms="distributors-heading"]'), dist.heading);
    setText(document.querySelector('[data-cms="distributors-line"]'), dist.line);
    setText(document.querySelector('[data-cms="distributors-cta"]'), dist.ctaLabel);

    var map = document.querySelector('[data-cms="distributors-map"]');
    if (map && dist.mapImage) {
      map.src = dist.mapImage;
      map.alt = dist.mapAlt || '';
    }
  }

  function hydrateFaq(d) {
    var f = d.faq;
    if (!f) return;

    setHtml(document.querySelector('[data-cms="faq-title"]'), f.titleHtml);
    setText(document.querySelector('[data-cms="faq-intro"]'), f.intro);

    var label = document.querySelector('[data-cms="faq-banner-label"]');
    if (label) setText(label, f.bannerLabel || 'FAQ');
    var sub = document.querySelector('[data-cms="faq-banner-sub"]');
    if (sub) setText(sub, f.bannerSub);
    var cta = document.querySelector('[data-cms="faq-banner-cta"]');
    if (cta) setText(cta, f.bannerCta || 'View FAQ');

    var list = document.querySelector('[data-cms="faq-list"]');
    if (!list) return;

    var html = '';
    var lastCat = '';
    f.items.forEach(function (item) {
      if (item.category !== lastCat) {
        html += '<h3 class="faq__category reveal">' + item.category + '</h3>';
        lastCat = item.category;
      }
      html +=
        '<div class="faq__item reveal">' +
          '<button class="faq__q" aria-expanded="false">' + item.question +
            '<span class="faq__icon" aria-hidden="true"></span>' +
          '</button>' +
          '<div class="faq__a"><div class="faq__a-inner">' + item.answer + '</div></div>' +
        '</div>';
    });
    list.innerHTML = html;
  }

  function hydrateManufacturing(d) {
    var m = d.manufacturing;
    if (!m) return;

    setText(document.querySelector('[data-cms="mfg-kicker"]'), m.kicker);
    setText(document.querySelector('[data-cms="mfg-heading"]'), m.heading);
    setText(document.querySelector('[data-cms="mfg-subline"]'), m.subline);
    setText(document.querySelector('[data-cms="mfg-body"]'), m.body);

    var facade = document.querySelector('[data-youtube-facade]');
    if (facade && m.youtubeId) {
      facade.setAttribute('data-video-id', m.youtubeId);
      var thumb = facade.querySelector('.video-facade__thumb');
      if (thumb) thumb.src = 'https://i.ytimg.com/vi/' + m.youtubeId + '/hqdefault.jpg';
    }

    var ytLink = document.querySelector('[data-cms="mfg-youtube"]');
    if (ytLink) {
      ytLink.href = m.youtubeUrl || ('https://www.youtube.com/watch?v=' + m.youtubeId);
    }
  }

  function hydrateAbout(d) {
    var a = d.about;
    if (!a || !document.body.classList.contains('page-about')) return;

    var g = d.global || {};
    var siteUrl = (g.SITE_URL || 'https://www.fas-tech.us').replace(/\/$/, '');

    if (a.seo) {
      document.title = a.seo.title;
      setText(document.querySelector('meta[name="description"]'), a.seo.description);
      var canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.href = siteUrl + '/about.html';
    }

    if (a.hero) {
      setText(document.querySelector('[data-cms="about-hero-kicker"]'), a.hero.kicker);
      setText(document.querySelector('[data-cms="about-hero-title"]'), a.hero.title);
      setText(document.querySelector('[data-cms="about-hero-lead"]'), a.hero.lead);
      var aboutBg = document.querySelector('[data-about-hero-bg]');
      if (aboutBg && a.hero.backgroundImage) {
        aboutBg.style.backgroundImage = "url('" + a.hero.backgroundImage + "')";
      }
      var preload = document.querySelector('link[rel="preload"][as="image"]');
      if (preload && a.hero.backgroundImage) preload.href = a.hero.backgroundImage;
      setText(document.querySelector('[data-cms="about-story-kicker"]'), a.hero.kicker);
    }

    if (a.story) {
      var storyImg = document.querySelector('[data-cms="about-story-img"]');
      if (storyImg) {
        storyImg.src = a.story.image;
        storyImg.alt = a.story.imageAlt || '';
      }
      var body = document.querySelector('[data-cms="about-story-body"]');
      if (body && a.story.paragraphs) {
        body.innerHTML = a.story.paragraphs.map(function (p) {
          return '<p>' + p + '</p>';
        }).join('');
      }
    }

    if (a.values) {
      setText(document.querySelector('[data-cms="about-values-heading"]'), a.values.heading);
      var valuesGrid = document.querySelector('[data-cms="about-values-grid"]');
      if (valuesGrid && a.values.items) {
        valuesGrid.innerHTML = a.values.items.map(function (item, i) {
          return (
            '<article class="about-value reveal" style="--i:' + i + '">' +
              '<span class="about-value__idx">0' + (i + 1) + '</span>' +
              '<h3 class="about-value__label">' + item.label + '</h3>' +
              '<p class="about-value__line">' + item.line + '</p>' +
            '</article>'
          );
        }).join('');
      }
    }

    if (a.support) {
      setText(document.querySelector('[data-cms="about-support-kicker"]'), a.support.kicker);
      setText(document.querySelector('[data-cms="about-support-heading"]'), a.support.heading);
      setText(document.querySelector('[data-cms="about-support-text"]'), a.support.text);
    }

    if (a.certifications) {
      setText(document.querySelector('[data-cms="about-certs-kicker"]'), a.certifications.kicker);
      setText(document.querySelector('[data-cms="about-certs-heading"]'), a.certifications.heading);
      setText(document.querySelector('[data-cms="about-certs-intro"]'), a.certifications.intro);
      var certList = document.querySelector('[data-cms="about-certs-list"]');
      if (certList && a.certifications.items) {
        certList.innerHTML = a.certifications.items.map(function (cert) {
          return (
            '<article class="about-cert reveal">' +
              '<span class="about-cert__mark" aria-hidden="true">' +
                '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg>' +
              '</span>' +
              '<div class="about-cert__body">' +
                '<h3 class="about-cert__code">' + cert.code + '</h3>' +
                '<p class="about-cert__desc">' + cert.description + '</p>' +
              '</div>' +
            '</article>'
          );
        }).join('');
      }
    }
  }

  function hydrateJsonLd(d) {
    var g = d.global;
    var siteUrl = g.SITE_URL;

    var org = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: g.companyName,
      url: siteUrl,
      description: 'Engineering, manufacturing and consultancy group specializing in access solutions, lifting solutions, and height safety systems.',
      address: {
        '@type': 'PostalAddress',
        streetAddress: g.address.street,
        addressLocality: g.address.city,
        postalCode: g.address.postalCode,
        addressCountry: 'LU'
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+352-691-592-667',
        contactType: 'sales',
        areaServed: 'US',
        availableLanguage: 'English'
      },
      sameAs: [g.social.linkedin, g.social.youtube]
    };

    var ps = g.productSchema;
    var product = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: ps.name,
      brand: { '@type': 'Brand', name: g.brandName },
      manufacturer: {
        '@type': 'Organization',
        name: g.companyName,
        url: g.manufacturerUrl
      },
      description: ps.description,
      image: absUrl(ps.image, siteUrl),
      url: siteUrl + '/',
      category: ps.category,
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'Working Load Limit', value: '1,500 to 2,200 lbs' },
        { '@type': 'PropertyValue', name: 'Lifting Speed', value: '35 fpm' },
        { '@type': 'PropertyValue', name: 'Supply Voltage', value: '208 V / 60 Hz' },
        { '@type': 'PropertyValue', name: 'Certifications', value: 'UL 1323, CSA Z271, EN 1808:2015, EN 60204-1' }
      ],
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/InStock',
        priceCurrency: 'USD',
        description: 'Request a quote for pricing'
      }
    };

    var faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: (d.faq.items || []).map(function (item) {
        return {
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer }
        };
      })
    };

    function writeLd(id, data) {
      var el = document.getElementById(id);
      if (el) el.textContent = JSON.stringify(data);
    }

    writeLd('ld-org', org);
    writeLd('ld-product', product);
    if (document.getElementById('ld-faq') && d.faq && d.faq.items) {
      writeLd('ld-faq', faq);
    }
  }

  function hydrateSite() {
    var data = getSiteData();
    if (!data) return null;

    hydrateGlobal(data);
    hydrateHero(data);
    hydrateProduct(data);
    hydrateCloseups(data);
    hydrateFeatures(data);
    hydrateManufacturing(data);
    hydrateAbout(data);
    hydrateModels(data);
    hydrateDistributors(data);
    hydrateSpecs(data);
    hydrateFaq(data);
    hydrateJsonLd(data);

    return data;
  }

  window.__hydrateSite = hydrateSite;
})();
