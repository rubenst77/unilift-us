#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const sitePath = path.join(ROOT, 'content', 'site.json');
const targets = [
  path.join(ROOT, 'index.html'),
  path.join(ROOT, 'faq.html')
];

const site = fs.readFileSync(sitePath, 'utf8').trim();
const start = '<!-- SITE-DATA-START -->';
const end = '<!-- SITE-DATA-END -->';
const block =
  start +
  '\n  <script type="application/json" id="site-data">\n' +
  site +
  '\n  </script>\n  ' +
  end;

for (const htmlPath of targets) {
  if (!fs.existsSync(htmlPath)) continue;

  let html = fs.readFileSync(htmlPath, 'utf8');
  if (!html.includes(start) || !html.includes(end)) {
    console.warn('Skipping', path.basename(htmlPath), '- missing SITE-DATA markers');
    continue;
  }

  html = html.replace(new RegExp(start + '[\\s\\S]*?' + end), block);
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('Inlined content/site.json into', path.basename(htmlPath));
}
