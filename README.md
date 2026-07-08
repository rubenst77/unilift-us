# FAS-Technology UNILIFT — US Landing Page

Premium B2B landing page for the UNILIFT traction hoist range, targeting US industrial buyers.

## 🏗️ Project Structure

```
Website_FasTech_US/
├── index.html              ← Single-page landing (all 10 sections)
├── css/
│   └── styles.css          ← Complete design system & components
├── js/
│   └── main.js             ← GSAP animations, form, analytics
├── images/
│   ├── hero/               ← Hero background images
│   ├── product/            ← Product photography
│   ├── applications/       ← Application scene images
│   ├── certifications/     ← UL, CSA badge SVGs
│   └── logo/               ← FAS-Tech logo assets
└── README.md
```

## 🚀 Quick Start

### Local Development
```bash
# Option 1: Python
python -m http.server 8080

# Option 2: Node.js (npx)
npx serve .

# Option 3: VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Then visit `http://localhost:8080`

## 🔧 Configuration

### Google Analytics (GA4)
1. Open `index.html`
2. Find the commented-out GA4 script block in `<head>`
3. Replace `G-XXXXXXXXXX` with your GA4 Measurement ID
4. Replace `AW-XXXXXXXXX` with your Google Ads Conversion ID
5. Uncomment the script block

### Google Ads Conversion Tracking
In `js/main.js`, the `onFormSubmitSuccess()` function is called on form submit.
Define it in `index.html` before `main.js`:

```html
<script>
function onFormSubmitSuccess(formData) {
  gtag('event', 'conversion', {
    'send_to': 'AW-XXXXXXXXX/YOUR_CONVERSION_LABEL',
    'value': 100.00,
    'currency': 'USD',
    'transaction_id': 'LEAD_' + Date.now(),
    'user_data': {
      'email': formData.email.trim().toLowerCase(),
      'phone_number': formData.phone
    }
  });
}
</script>
```

### Images
Replace placeholder elements in `index.html` with actual images:

- **Hero**: Replace `.hero__bg--placeholder` div with `<img>` tag
- **Product**: Replace placeholder div in intro section with product photo
- **Applications**: Uncomment `<img>` tags in each `.app-block__bg`
- **Logo**: Replace text logo with `<img>` in `.nav__logo-text`

## 📐 Design Tokens

All design values are defined as CSS custom properties in `styles.css`:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-base` | `#0A1628` | Page background |
| `--color-accent` | `#E8503A` | CTAs, highlights |
| `--color-blue` | `#4A9EFF` | Links, secondary |
| `--color-amber` | `#F0883E` | Spec values |
| `--font-primary` | Inter | All text |
| `--font-mono` | JetBrains Mono | Spec values |

## 📊 Analytics Events

| Event | Trigger | GA4 Parameters |
|-------|---------|---------------|
| `generate_lead` | Form submission | `form_name`, `value` |
| `scroll` | 25/50/75/90% scroll | `percent_scrolled` |
| `cta_click` | Any `[data-cta]` click | `event_label` |
| `form_start` | First form focus | — |
| `section_view` | Section enters viewport | `event_label` (section ID) |

## 🔒 Privacy & Consent

- **Google Consent Mode v2** is pre-configured (defaults to `denied`)
- **Cookie consent banner** uses `localStorage` for persistence
- **GPC (Global Privacy Control)** signal is detected and honored
- US-compliant opt-out model (CCPA/CPRA)

## 📱 Responsive Breakpoints

| Breakpoint | Target |
|-----------|--------|
| > 1024px | Desktop |
| 768–1024px | Tablet |
| < 768px | Mobile |
| < 480px | Small mobile |

## 🚢 Deployment

### Static Hosting (Recommended)
Upload all files to any static host:
- Google Cloud Storage + CDN
- Cloudflare Pages
- Netlify
- Vercel

### Google Cloud (with existing server)
```bash
# Copy files to server
scp -r ./* user@your-server:/var/www/html/us/

# Or use gcloud CLI
gcloud compute scp --recurse ./* instance-name:/var/www/html/us/
```

## 📋 Checklist Before Launch

- [ ] Replace GA4 Measurement ID (`G-XXXXXXXXXX`)
- [ ] Replace Google Ads Conversion ID (`AW-XXXXXXXXX`)
- [ ] Add product images
- [ ] Add hero background image
- [ ] Add application scene images
- [ ] Replace text logo with image logo
- [ ] Set correct canonical URL in `<meta>`
- [ ] Update OG image path
- [ ] Set up form backend (email/CRM integration)
- [ ] Test on mobile devices
- [ ] Run Lighthouse audit
- [ ] Validate structured data (Google Rich Results Test)
