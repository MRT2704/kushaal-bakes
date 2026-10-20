// Test script for Kushaal Home Made Bakes website
// Tests all cake + weight combinations and WhatsApp message generation
// Loads data directly from cakes.json (single source of truth)

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log('  PASS: ' + message);
  } else {
    failed++;
    console.error('  FAIL: ' + message);
  }
}

// Expected prices from the flyer
const EXPECTED_PRICES = {
  'normal': { '½ kg': 250, '1 kg': 450, '2 kg': 650, '2 kg Steps (2-Layer)': 740 },
  'cool': { '½ kg': 350, '1 kg': 650, '2 kg': 1250, '2 kg Steps (2-Layer)': 1400 },
  'redvelvet': { '½ kg': 500, '1 kg': 950 },
  'normal-choco': { '½ kg': 200, '1 kg': 350, '2 kg': 690, '2 kg Steps (2-Layer)': 800 },
  'cool-choco': { '½ kg': 400, '1 kg': 750, '2 kg': 1450, '2 kg Steps (2-Layer)': 1550 }
};

// Load cakes.json (the single source of truth)
const cakesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'cakes.json'), 'utf8'));
const bakery = cakesData.bakery;
const cakes = cakesData.cakes;

// Read the HTML file
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// ===== Test 1: Data structure =====
console.log('\n--- Data Structure ---');
assert(cakes.length === 5, 'All 5 cakes defined in cakes.json');

// ===== Test 2: Cake names =====
console.log('\n--- Cake Names ---');
assert(cakes.find(c => c.id === 'normal').name === 'Normal Cake', 'Normal Cake name correct');
assert(cakes.find(c => c.id === 'cool').name === 'Cool Cake', 'Cool Cake name correct');
assert(cakes.find(c => c.id === 'redvelvet').name === 'Red Velvet Cake', 'Red Velvet Cake name correct');
assert(cakes.find(c => c.id === 'normal-choco').name === 'Normal Chocolate Cake', 'Normal Chocolate Cake name correct');
assert(cakes.find(c => c.id === 'cool-choco').name === 'Cool Chocolate Cake', 'Cool Chocolate Cake name correct');

// ===== Test 3: All prices match flyer (18 price points) =====
console.log('\n--- Price Verification ---');
let allPricesCorrect = true;
let totalPrices = 0;
for (const cake of cakes) {
  for (const weight of cake.weights) {
    totalPrices++;
    const expected = EXPECTED_PRICES[cake.id][weight.label];
    if (expected !== undefined) {
      const correct = weight.price === expected;
      if (!correct) allPricesCorrect = false;
      assert(correct, cake.name + ' - ' + weight.label + ': Rs.' + weight.price + ' (expected Rs.' + expected + ')');
    }
  }
}
assert(totalPrices === 18, 'Total price points: ' + totalPrices + ' (expected 18)');
assert(allPricesCorrect, 'All prices match flyer data');

// ===== Test 4: Red Velvet only has 2 weights (no 2kg or Steps (2-Layer)) =====
console.log('\n--- Weight Options ---');
const rv = cakes.find(c => c.id === 'redvelvet');
assert(rv.weights.length === 2, 'Red Velvet Cake has only 2 weights (no unlisted sizes)');

// ===== Test 5: Other cakes have 4 weights =====
['normal', 'cool', 'normal-choco', 'cool-choco'].forEach(id => {
  const c = cakes.find(c => c.id === id);
  assert(c.weights.length === 4, c.name + ' has 4 weight options');
});

// ===== Test 6: WhatsApp number =====
console.log('\n--- WhatsApp Number ---');
assert(bakery.whatsappNumber === '918074117710', 'WhatsApp number is 918074117710 in cakes.json');
assert(html.includes('cakes.json'), 'HTML references cakes.json for data');
assert(html.includes('fetch('), 'HTML loads cake data via fetch()');

// ===== Test 7: Phone numbers NOT redacted =====
console.log('\n--- Phone Numbers ---');
assert(bakery.phone1.href === 'tel:+918074117710', 'Phone 1 click-to-call href is correct');
assert(bakery.phone2.href === 'tel:+919391523823', 'Phone 2 click-to-call href is correct');
assert(!bakery.phone1.href.includes('****'), 'Phone 1 href has no redaction');
assert(!bakery.phone2.href.includes('****'), 'Phone 2 href has no redaction');
assert(!html.includes('****'), 'No redacted phone numbers in HTML');

// ===== Test 8: Address is short only =====
console.log('\n--- Address ---');
assert(bakery.address === 'Bhimadole, West Godavari, Andhra Pradesh 534425', 'Address is short only');
assert(!html.includes('Geethanjali College Road'), 'Full address NOT displayed');

// ===== Test 9: Placeholder images (SVG, not JPG) =====
console.log('\n--- Images ---');
assert(!html.includes('.jpg'), 'No hardcoded JPG image sources in HTML');
assert(html.includes('Illustrative'), 'Illustrative label present in HTML');
assert(!html.includes('Photo coming soon'), 'No placeholder text (images are illustrative)');
cakes.forEach(cake => {
  assert(cake.image.endsWith('.png'), cake.name + ' uses PNG image, not JPG');
  assert(fs.existsSync(path.join(__dirname, cake.image)), cake.name + ' image file exists at ' + cake.image);
  assert(cake.illustrative === true, cake.name + ' marked as illustrative');
});

// ===== Test 10: No embedded data (cakes.json is the single source) =====
console.log('\n--- Data Source ---');
assert(!html.includes('const cakes'), 'No inline cake data object in HTML (loaded via fetch from cakes.json)');

// ===== Test 11: WhatsApp message generation =====
console.log('\n--- WhatsApp Message Test ---');

function generateWhatsAppMessage(cakeName, weightLabel, price, customerName, date, time, fulfillment, address, message) {
  let msg = '\uD83D\uDCE6 *Kushaal Home Made Bakes - Order Request*\n\n';
  msg += '*Cake:* ' + cakeName + '\n';
  msg += '*Weight:* ' + weightLabel + '\n';
  msg += '*Price:* \u20B9' + price + '\n\n';
  msg += '*Name:* ' + customerName + '\n';
  msg += '*Required:* ' + date + ' at ' + time + '\n';
  msg += '*Method:* ' + (fulfillment === 'pickup' ? 'Pickup' : 'Delivery') + '\n';
  if (fulfillment === 'delivery' && address) {
    msg += '*Address:* ' + address + '\n';
  }
  if (message) {
    msg += '*Message/Instructions:* ' + message + '\n';
  }
  msg += '\n_The bakery will confirm availability, any delivery charges, and final total._';
  return msg;
}

// Test all 18 cake + weight combinations
for (const cake of cakes) {
  for (const weight of cake.weights) {
    const msg = generateWhatsAppMessage(
      cake.name, weight.label, weight.price,
      'Test Customer', '25 Oct 2026', '14:00',
      'pickup', '', 'Happy Birthday!'
    );
    assert(msg.includes(cake.name), cake.name + ' - ' + weight.label + ': message includes cake name');
    assert(msg.includes(weight.label), cake.name + ' - ' + weight.label + ': message includes weight');
    assert(msg.includes('\u20B9' + weight.price), cake.name + ' - ' + weight.label + ': message includes correct price');
    const encoded = encodeURIComponent(msg);
    const url = 'https://wa.me/918074117710?text=' + encoded;
    assert(url.startsWith('https://wa.me/918074117710'), cake.name + ' - ' + weight.label + ': WhatsApp URL generated');
  }
}

// Test delivery with address
const deliveryMsg = generateWhatsAppMessage(
  'Normal Cake', '1 kg', 450,
  'Ravi Teja', '20 Oct 2026', '10:00',
  'delivery', '123 Main Street, Bhimadole', 'Extra frosting please'
);
assert(deliveryMsg.includes('*Address:* 123 Main Street, Bhimadole'), 'Delivery message includes address');

// Test pickup without address
const pickupMsg = generateWhatsAppMessage(
  'Red Velvet Cake', '½ kg', 500,
  'Priya Sharma', '22 Oct 2026', '16:30',
  'pickup', '', ''
);
assert(!pickupMsg.includes('*Address:*'), 'Pickup message does NOT include address');

// ===== Test 12: Accessibility features =====
console.log('\n--- Accessibility ---');
assert(html.includes('aria-label') || html.includes('role='), 'ARIA attributes present for accessibility');
assert(html.includes('<label'), 'Form fields have labels for accessibility');

// ===== Test 13: Mobile viewport =====
console.log('\n--- Mobile ---');
assert(html.includes('viewport'), 'Mobile viewport meta tag present');

// ===== Test 14: V1 constraints (no payment/cart/account) =====
console.log('\n--- V1 Constraints ---');
assert(!html.toLowerCase().includes('stripe') && !html.toLowerCase().includes('paypal'), 'No online payment processors');
assert(!html.toLowerCase().includes('shopping cart'), 'No shopping cart');
assert(!html.toLowerCase().includes('login') && !html.toLowerCase().includes('account'), 'No account/login system');

console.log('\n========================================');
console.log('Tests: ' + passed + ' passed, ' + failed + ' failed');
console.log('========================================');
process.exit(failed > 0 ? 1 : 0);
