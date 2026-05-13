const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: "new",
    defaultViewport: { width: 1000, height: 600 }
  });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    window.mockIpcChannels = {};
    window.electronAPI = {
      on: (channel, callback) => {
        window.mockIpcChannels[channel] = callback;
      },
      send: () => {},
      removeAllListeners: () => {}
    };
    window.triggerMock = (channel, data) => {
      if (window.mockIpcChannels[channel]) {
        window.mockIpcChannels[channel](data);
      }
    };
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });

  // Add a nice background so the transparent notch looks good
  await page.evaluate(() => {
    document.body.style.background = 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop") center/cover';
    // Make the root transparent if it isn't
    document.getElementById('root').style.background = 'transparent';
  });

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const notchSelector = '#root > div > div'; // Generic selector

  async function takeShot(name, w=450, h=300) {
    await sleep(2000); // wait for animations
    const element = await page.$(notchSelector);
    if (!element) {
        console.log("Notch not found for " + name);
        await page.screenshot({ path: `assets/fullpage_error_${name}` });
        return;
    }
    const box = await element.boundingBox();
    if (!box) return;
    await page.screenshot({
      path: `assets/${name}`,
      clip: {
        x: Math.max(0, box.x - 20),
        y: Math.max(0, box.y - 10),
        width: box.width + 40,
        height: Math.max(box.height + 40, 100)
      }
    });
  }

  await page.waitForSelector(notchSelector, { timeout: 10000 });
  const notchEl = await page.$(notchSelector);
  
  // 1. Compact Mode (idle)
  await page.evaluate(() => window.triggerMock('hardware-stats', { cpu: 15, ram: 45 }));
  await page.evaluate(() => window.triggerMock('network-stats', { rx: 1024, tx: 512 }));
  await page.evaluate(() => window.triggerMock('privacy-dots', { cam: false, mic: false }));
  await takeShot('compact_mode_v2.png');

  // Hover to expand
  await notchEl.hover();
  await sleep(1000);

  // 2. Media Player Mode
  await page.evaluate(() => {
    window.triggerMock('spotify-state', {
      is_playing: true,
      progress_ms: 45000,
      item: {
        name: 'Midnight City',
        artists: [{ name: 'M83' }],
        album: { images: [{ url: 'https://i.scdn.co/image/ab67616d0000b2737c355cfaefbafdd273dcf2d9' }] }
      },
      lyrics: []
    });
  });
  await takeShot('media_player_v2.png');

  // 3. Hardware Stats
  await page.click('button[title="Hardware Stats"]');
  await page.evaluate(() => window.triggerMock('hardware-stats', { cpu: 67, ram: 82 }));
  await takeShot('hardware_stats_v2.png');

  // 4. Network Speed
  await page.click('button[title="Network Stats"]');
  await page.evaluate(() => window.triggerMock('network-stats', { rx: 1024 * 1024 * 4.5, tx: 1024 * 500 }));
  await takeShot('network_stats_v2.png');

  // 5. Pomodoro Timer
  await page.click('button[title="Pomodoro Timer"]');
  await takeShot('pomodoro_mode_v2.png');

  // 6. Settings (Theme) Mode
  await page.click('button[title="Settings"]');
  await takeShot('settings_mode_v2.png');

  await browser.close();
  console.log("Screenshots captured successfully!");
}

run().catch(console.error);
