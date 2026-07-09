#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const htmlPath = path.join(ROOT, 'index.html');
const sitePath = path.join(ROOT, 'content', 'site.json');

const site = fs.readFileSync(sitePath, 'utf8').trim();
let html = fs.readFileSync(htmlPath, 'utf8');

const start = '<!-- SITE-DATA-START -->';
const end = '<!-- SITE-DATA-END -->';
const block =
  start +
  '\n  <script type="application/json" id="site-data">\n' +
  site +
  '\n  </script>\n  ' +
  end;

if (!html.includes(start) || !html.includes(end)) {
  console.error('Missing SITE-DATA markers in index.html');
  process.exit(1);
}

html = html.replace(new RegExp(start + '[\\s\\S]*?' + end), block);
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Inlined content/site.json into index.html');
