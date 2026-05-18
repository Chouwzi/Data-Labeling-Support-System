const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  console.log('Setting localStorage...');
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    localStorage.setItem('accessToken', 'dummy_token');
    localStorage.setItem('role', 'ANNOTATOR');
    localStorage.setItem('email', 'test@test.com');
    localStorage.setItem('fullName', 'Test User');
  });

  console.log('Navigating to Dashboard...');
  await page.goto('http://localhost:5173/annotator', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Clicking Settings link...');
  // Find the link with href="/annotator/settings"
  await page.evaluate(() => {
    const link = document.querySelector('a[href="/annotator/settings"]');
    if (link) link.click();
    else console.log('Settings link not found!');
  });

  console.log('Waiting 3 seconds...');
  await new Promise(r => setTimeout(r, 3000));

  console.log('Checking if screen is blank...');
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log('HTML size:', html.length);
  
  await browser.close();
  console.log('Done.');
})();
