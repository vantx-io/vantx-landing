#!/usr/bin/env node
/**
 * Setup Stripe products and prices for Vantix
 * Run: STRIPE_SECRET_KEY=sk_test_xxx node scripts/setup-stripe.js
 */
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setup() {
  console.log('🔧 Setting up Stripe products for Vantix...\n');

  // Retainer SRE
  const retainer = await stripe.products.create({
    name: 'Retainer SRE Mensual',
    description: 'Monitoreo proactivo, evaluación de performance mensual, optimización continua, soporte ante incidentes. 100% async.',
    metadata: { slug: 'retainer' },
  });
  console.log(`✓ Product: ${retainer.name} (${retainer.id})`);

  const retainerUS = await stripe.prices.create({
    product: retainer.id, unit_amount: 450000, currency: 'usd', recurring: { interval: 'month' },
    metadata: { market: 'US', type: 'retainer' },
  });
  console.log(`  Price US: $4,500/mo (${retainerUS.id})`);

  const retainerLATAM = await stripe.prices.create({
    product: retainer.id, unit_amount: 280000, currency: 'usd', recurring: { interval: 'month' },
    metadata: { market: 'LATAM', type: 'retainer' },
  });
  console.log(`  Price LATAM: $2,800/mo (${retainerLATAM.id})`);

  // Retainer Pilot
  const retainerPilotUS = await stripe.prices.create({
    product: retainer.id, unit_amount: 337500, currency: 'usd', recurring: { interval: 'month' },
    metadata: { market: 'US', type: 'retainer-pilot' },
  });
  console.log(`  Price Pilot US: $3,375/mo (${retainerPilotUS.id})`);

  const retainerPilotLATAM = await stripe.prices.create({
    product: retainer.id, unit_amount: 210000, currency: 'usd', recurring: { interval: 'month' },
    metadata: { market: 'LATAM', type: 'retainer-pilot' },
  });
  console.log(`  Price Pilot LATAM: $2,100/mo (${retainerPilotLATAM.id})`);

  // Performance Checkup
  const checkup = await stripe.products.create({
    name: 'Performance Checkup',
    description: 'Evaluación completa de performance en 5 días. Incluye prueba de carga, web performance, y roadmap.',
    metadata: { slug: 'checkup' },
  });
  console.log(`\n✓ Product: ${checkup.name} (${checkup.id})`);

  const checkupUS = await stripe.prices.create({
    product: checkup.id, unit_amount: 550000, currency: 'usd',
    metadata: { market: 'US', type: 'checkup' },
  });
  console.log(`  Price US: $5,500 (${checkupUS.id})`);

  const checkupLATAM = await stripe.prices.create({
    product: checkup.id, unit_amount: 350000, currency: 'usd',
    metadata: { market: 'LATAM', type: 'checkup' },
  });
  console.log(`  Price LATAM: $3,500 (${checkupLATAM.id})`);

  console.log('\n✅ Setup complete! Add these to .env.local:\n');
  console.log(`STRIPE_PRICE_RETAINER_US=${retainerUS.id}`);
  console.log(`STRIPE_PRICE_RETAINER_LATAM=${retainerLATAM.id}`);
  console.log(`STRIPE_PRICE_RETAINER_PILOT_US=${retainerPilotUS.id}`);
  console.log(`STRIPE_PRICE_RETAINER_PILOT_LATAM=${retainerPilotLATAM.id}`);
  console.log(`STRIPE_PRICE_CHECKUP_US=${checkupUS.id}`);
  console.log(`STRIPE_PRICE_CHECKUP_LATAM=${checkupLATAM.id}`);
}

setup().catch(e => { console.error(e); process.exit(1); });
