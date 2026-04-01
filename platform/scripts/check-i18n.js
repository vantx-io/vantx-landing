#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/messages/en.json'), 'utf-8'))
const es = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/messages/es.json'), 'utf-8'))

function leafKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const full = prefix ? `${prefix}.${k}` : k
    return typeof v === 'object' && v !== null ? leafKeys(v, full) : [full]
  })
}

const enKeys = new Set(leafKeys(en))
const esKeys = new Set(leafKeys(es))
const onlyEn = [...enKeys].filter(k => !esKeys.has(k))
const onlyEs = [...esKeys].filter(k => !enKeys.has(k))

if (onlyEn.length || onlyEs.length) {
  if (onlyEn.length) console.error('Keys in EN missing from ES:', onlyEn)
  if (onlyEs.length) console.error('Keys in ES missing from EN:', onlyEs)
  process.exit(1)
}
console.log(`i18n parity OK — ${enKeys.size} keys`)
