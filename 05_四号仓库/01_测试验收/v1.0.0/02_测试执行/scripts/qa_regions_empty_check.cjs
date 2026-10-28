/**
 * RUN-002 补验（PM 复核整改·方案①）：空库实例 PD-002（regions.html）
 * 验证面：FR-004 AT-003 / FR-005 AT-003 —— 矩阵空行全 0、行可点击、下钻空态定版文案、无 JS 报错。
 */
const { chromium } = require('playwright');

const SHOTS = '/Users/fuyo-aic/Projects/dic-ai-eng-test/minhuo-kantai-doc/05_四号仓库/01_测试验收/v1.0.0/02_测试执行/screenshots';
const results = [];
function check(name, cond, note = '') {
  results.push({ name, pass: !!cond, note });
  console.log(`${cond ? 'PASS' : 'FAIL'} [TC-037补验] ${name}${note ? ' | ' + note : ''}`);
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const jsErrors = [];
  let favicon404 = false;
  page.on('pageerror', e => jsErrors.push('pageerror: ' + e.message));
  // 披露：favicon.ico 404 为浏览器默认请求（页面未声明 favicon），非页面 JS 错误——单列观察项，白名单过滤
  page.on('console', m => {
    if (m.type() === 'error') {
      const loc = (m.location() && m.location().url) || '';
      if (loc.includes('favicon.ico')) favicon404 = true;
      else jsErrors.push('console.error: ' + m.text() + ' @ ' + loc);
    }
  });
  page.setDefaultTimeout(10000);

  await page.goto('http://localhost:8010/regions.html');
  await page.waitForSelector('#matrix-body tr.mrow');

  // 1) 五行渲染（空库仍固定五行）
  const rows = await page.$$eval('#matrix-body tr.mrow', els => els.map(e => e.dataset.region));
  check('空库矩阵仍渲染五行固定序 EU/NA/ME/SEA/OTHER', rows.join(',') === 'EU,NA,ME,SEA,OTHER', rows.join(','));

  // 2) 每行三态计数全 0、合计 0（矩阵空行 0 显示，FR004-R2/GBR-007）
  const rowCells = await page.$$eval('#matrix-body tr.mrow', els => els.map(e =>
    [...e.querySelectorAll('td.num')].map(td => td.textContent.trim())));
  const allZero = rowCells.every(cells => cells.length === 4 && cells.every(c => c === '0'));
  check('五行三态+合计全部为 0', allZero, JSON.stringify(rowCells));

  // 3) 初始下钻区=引导语（未选与空区分开）
  const guide = await page.textContent('#drill');
  check('未选大区时下钻区=引导语', guide.includes('点击上方矩阵中的大区行'));

  // 4) 空行可点击：点击 EU 行 → 高亮 + 下钻空态（FR004-R3 空区可点击）
  await page.click('tr[data-region="EU"]');
  await page.waitForTimeout(600);
  const active = await page.$eval('tr[data-region="EU"]', el => el.classList.contains('active'));
  check('空区行可点击且高亮 active', active);
  const drill = await page.textContent('#drill');
  check('点击后下钻区=空态文案「该大区暂无结构化规则」', drill.includes('该大区暂无结构化规则'), drill.trim().slice(0, 40));

  // 5) 换一个区（SEA）复核同样行为
  await page.click('tr[data-region="SEA"]');
  await page.waitForTimeout(600);
  const drill2 = await page.textContent('#drill');
  check('切换其他空区（SEA）同样空态', drill2.includes('该大区暂无结构化规则'));

  // 6) 页面脚本无 JS 错误（pageerror=0、功能性 console.error=0；favicon.ico 404 属浏览器默认请求，单列观察不算页面错误）
  check('页面脚本无 JS 错误（pageerror=0，功能性 console.error=0）', jsErrors.length === 0, jsErrors.join('; ').slice(0, 120) || 'clean');
  check('favicon.ico 404 情况如实记录（浏览器默认请求，非页面 JS 错误）', favicon404, favicon404 ? '存在（已登记观察项，不阻断）' : '未出现');

  await page.screenshot({ path: `${SHOTS}/TC-037-regions-empty.png`, fullPage: true });
  console.log('screenshot saved: TC-037-regions-empty.png');

  await browser.close();
  const fail = results.filter(r => !r.pass);
  console.log('===== SUMMARY =====');
  console.log(JSON.stringify({ total: results.length, pass: results.length - fail.length, fail: fail.length }));
  require('fs').writeFileSync('/tmp/qa_gen/regions_empty_results.json', JSON.stringify(results, null, 2));
  process.exit(fail.length ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR:', e.message); process.exit(2); });
