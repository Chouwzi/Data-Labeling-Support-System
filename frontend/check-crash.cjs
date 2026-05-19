const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  console.log('Setting localStorage on localhost...');
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    localStorage.setItem('accessToken', 'dummy_token');
    localStorage.setItem('role', 'ANNOTATOR');
    localStorage.setItem('email', 'test@test.com');
    localStorage.setItem('fullName', 'Test User');
  });

  console.log('Navigating to http://localhost:5173/annotator/settings ...');
  try {
    await page.goto('http://localhost:5173/annotator/settings', { waitUntil: 'networkidle2', timeout: 10000 });
    console.log('Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (err) {
    console.log('Navigation or wait error:', err.message);
  }

  await browser.close();
  console.log('Done.');
})();
