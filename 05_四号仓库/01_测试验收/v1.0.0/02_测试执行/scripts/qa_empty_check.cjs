const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const out = [];
  await page.goto('http://localhost:8010/');
  await page.waitForTimeout(1200);
  const cards = await page.$$eval('#cards .stat .v', els => els.map(e => e.textContent.trim()));
  const listEmpty = await page.textContent('#rules-list');
  out.push(['TC-037', '空库三卡全 0', cards.join(',') === '0,0,0', cards.join(',')]);
  out.push(['TC-037', 'PD-001 空态文案「暂无规则数据」', listEmpty.includes('暂无规则数据')]);
  await page.goto('http://localhost:8010/changes.html');
  await page.waitForTimeout(1200);
  const tl = await page.textContent('#timeline');
  out.push(['TC-037', 'PD-003 空态文案「暂无变化记录」', tl.includes('暂无变化记录')]);
  await browser.close();
  let fail = 0;
  for (const [tc, name, pass, note] of out) { console.log(`${pass?'PASS':'FAIL'} [${tc}] ${name}${note?' | '+note:''}`); if(!pass) fail++; }
  process.exit(fail ? 1 : 0);
})();
