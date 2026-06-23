import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:8080/';
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    errors.push(`console.error: ${msg.text()}`);
  }
});

page.on('pageerror', (err) => {
  errors.push(`pageerror: ${err.message}`);
});

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.keyboard.press('Space');
await page.waitForTimeout(500);

await browser.close();

if (errors.length > 0) {
  console.error('Console check FAILED:');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log('Console check passed — no errors detected.');
