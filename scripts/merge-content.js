#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const KEYS = [
  'global',
  'hero',
  'product',
  'features',
  'closeups',
  'models',
  'specs',
  'applications',
  'faq',
  'distributors'
];

const site = {};
for (const key of KEYS) {
  const file = path.join(CONTENT, key + '.json');
  site[key] = JSON.parse(fs.readFileSync(file, 'utf8'));
}

fs.writeFileSync(
  path.join(CONTENT, 'site.json'),
  JSON.stringify(site, null, 2) + '\n',
  'utf8'
);

console.log('Merged content/site.json from', KEYS.length, 'files.');
