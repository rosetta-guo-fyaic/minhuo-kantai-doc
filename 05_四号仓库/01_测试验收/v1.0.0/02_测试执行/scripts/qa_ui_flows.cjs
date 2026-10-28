/**
 * QA 独立验收·界面层交互流（TC-030/031/032/033/034/035/036/038）
 * 敏货看台 v1.0.0 ｜ 运行于 :8000（MH_DB_PATH=/tmp/qa_ui.db 种子副本，写操作不触种子库）
 * 每步断言 + 截图留证；输出 JSON 结果摘要供执行记录引用。
 */
const { chromium } = require('playwright');

const BASE = 'http://localhost:8000';
const SHOTS = '/Users/fuyo-aic/Projects/dic-ai-eng-test/minhuo-kantai-doc/05_四号仓库/01_测试验收/v1.0.0/02_测试执行/screenshots';
const results = [];
function check(tc, name, cond, note = '') {
  results.push({ tc, name, pass: !!cond, note });
  console.log(`${cond ? 'PASS' : 'FAIL'} [${tc}] ${name}${note ? ' | ' + note : ''}`);
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(10000);

  // ---------- TC-030 PD-001 筛选联动 ----------
  await page.goto(BASE + '/');
  await page.waitForSelector('#rules-list .row-item');
  let cards = await page.$$eval('#cards .stat .v', els => els.map(e => e.textContent.trim()));
  check('TC-030', '初始三卡 12/24/15', cards.join(',') === '12,24,15', cards.join(','));
  await page.selectOption('#f-region', 'EU');
  await page.waitForTimeout(600);
  cards = await page.$$eval('#cards .stat .v', els => els.map(e => e.textContent.trim()));
  check('TC-030', '选欧洲后三卡 2/5/4', cards.join(',') === '2,5,4', cards.join(','));
  let n = await page.$$eval('#rules-list .row-item', els => els.length);
  check('TC-030', '列表 11 条', n === 11, String(n));
  await page.selectOption('#f-status', 'FORBIDDEN');
  await page.waitForTimeout(600);
  cards = await page.$$eval('#cards .stat .v', els => els.map(e => e.textContent.trim()));
  n = await page.$$eval('#rules-list .row-item', els => els.length);
  check('TC-030', '叠加不可接：卡片=4 且列表=4（AT-FR001-004 一致）', cards.join(',') === '0,0,4' && n === 4, `cards=${cards.join(',')} n=${n}`);
  await page.screenshot({ path: `${SHOTS}/TC-030-index-filter-eu-forb.png`, fullPage: true });
  await page.click('#f-reset');
  await page.waitForTimeout(600);
  cards = await page.$$eval('#cards .stat .v', els => els.map(e => e.textContent.trim()));
  check('TC-030', '重置恢复全量 12/24/15', cards.join(',') === '12,24,15', cards.join(','));

  // ---------- TC-031 PD-002 下钻 ----------
  await page.goto(BASE + '/regions.html');
  await page.waitForSelector('#matrix-body tr.mrow');
  const guide = await page.textContent('#drill');
  check('TC-031', '初始下钻区=引导语（区分未选/无数据）', guide.includes('点击上方矩阵中的大区行'));
  const rows = await page.$$eval('#matrix-body tr.mrow', els => els.map(e => e.dataset.region));
  check('TC-031', '矩阵五行固定序', rows.join(',') === 'EU,NA,ME,SEA,OTHER', rows.join(','));
  await page.click('tr[data-region="EU"]');
  await page.waitForSelector('#drill .row-item');
  const active = await page.$eval('tr[data-region="EU"]', el => el.classList.contains('active'));
  check('TC-031', '点击行高亮 active', active);
  const drillTxt = await page.textContent('#drill');
  check('TC-031', '下钻明细含锂电池·合并（2 源）', drillTxt.includes('合并（2 源）') && drillTxt.includes('锂电池'));
  check('TC-031', '冲突条目=不可接+多源冲突徽标', drillTxt.includes('多源冲突') && drillTxt.includes('不可接'));
  // 展开锂电池行看逐源源规则
  await page.locator('#drill .row-item', { hasText: '锂电池' }).locator('.row-main').click();
  await page.waitForTimeout(400);
  const drillTxt2 = await page.textContent('#drill');
  check('TC-031', '行展开逐源源规则（船司+国家政策）', drillTxt2.includes('船司') && drillTxt2.includes('国家政策'));
  await page.screenshot({ path: `${SHOTS}/TC-031-regions-drill.png`, fullPage: true });

  // ---------- TC-032 PD-002 二次筛选（单源口径） ----------
  await page.selectOption('#d-source', 'CARRIER');
  await page.waitForTimeout(600);
  const d32 = await page.textContent('#drill');
  const n32 = await page.$$eval('#drill .row-item', els => els.length);
  check('TC-032', '船司口径 3 条', n32 === 3, String(n32));
  check('TC-032', '信源列=「船司」而非合并（N 源）', d32.includes('船司') && !d32.includes('合并（'));
  check('TC-032', '单源口径无「多源冲突」徽标', !d32.includes('多源冲突'));
  check('TC-032', '无船司源条目（雾化器）不出现', !d32.includes('雾化器'));
  await page.screenshot({ path: `${SHOTS}/TC-032-regions-filter-carrier.png`, fullPage: true });
  await page.selectOption('#d-source', '');

  // ---------- TC-033 PD-003 时间线倒序+筛选（静态截图已另存全量态） ----------
  await page.goto(BASE + '/changes.html');
  await page.waitForSelector('.tl-item');
  const firstTl = await page.textContent('.tl-item');
  check('TC-033', '首条=火柴 2026-10-24 08:50', firstTl.includes('火柴') && firstTl.includes('2026-10-24 08:50'));
  const tlCount = await page.$$eval('.tl-item', els => els.length);
  check('TC-033', '时间线 10 条', tlCount === 10, String(tlCount));
  const bodyTxt = await page.textContent('body');
  check('TC-033', '页面无编辑/删除变化记录入口（只读）', !/删除|编辑/.test(bodyTxt));
  await page.selectOption('#f-region', 'SEA');
  await page.waitForTimeout(600);
  const seaN = await page.$$eval('.tl-item', els => els.length);
  check('TC-033', '东南亚筛选后 3 条', seaN === 3, String(seaN));
  await page.screenshot({ path: `${SHOTS}/TC-033-changes-filter-sea.png`, fullPage: true });

  // ---------- TC-034 PD-004 登记流（写 /tmp/qa_ui.db） ----------
  await page.goto(BASE + '/maintain.html');
  await page.waitForSelector('#rules .row-item');
  // 必填拦截
  await page.click('[data-btn="submit"]');
  await page.waitForSelector('#msg .msg.err');
  const reqMsg = await page.textContent('#msg');
  check('TC-034', '空表单提交被拦截（请填写品名（中文））', reqMsg.includes('请填写'));
  await page.screenshot({ path: `${SHOTS}/TC-034-maintain-required.png`, fullPage: true });
  // 填全提交
  await page.fill('#r-name-zh', 'QA界面登记品类');
  await page.fill('#r-name-en', 'QA UI Item');
  await page.selectOption('#r-region', 'NA');
  await page.selectOption('#r-source', 'CUSTOMS');
  await page.selectOption('#r-status', 'FORBIDDEN');
  await page.fill('#r-basis', 'QA 界面登记依据：海关禁收样例（测试）');
  await page.fill('#r-operator', 'QA-界面');
  await page.click('[data-btn="submit"]');
  await page.waitForSelector('#msg .msg.ok');
  let mmsg = await page.textContent('#msg');
  check('TC-034', '登记成功提示', mmsg.includes('登记成功'));
  await page.waitForTimeout(600);
  const listTxt = await page.textContent('#rules');
  check('TC-034', '列表刷新出现新规则', listTxt.includes('QA界面登记品类'));
  await page.screenshot({ path: `${SHOTS}/TC-034-maintain-register.png`, fullPage: true });
  // 即时生效：PD-001 北美+不可接可见
  await page.goto(BASE + '/?region=NA&status=FORBIDDEN');
  await page.waitForSelector('#rules-list .row-item');
  const idxTxt = await page.textContent('#rules-list');
  check('TC-034', '登记后三视图即时可见（PD-001 北美×不可接）', idxTxt.includes('QA界面登记品类'));

  // ---------- TC-035 PD-004 重复登记 409 → 转修订 → 修订成功 ----------
  await page.goto(BASE + '/maintain.html');
  await page.waitForSelector('#rules .row-item');
  // 重复登记（与 TC-034 同组合）
  await page.fill('#r-name-zh', 'QA界面登记品类');
  await page.fill('#r-name-en', 'QA UI Item');
  await page.selectOption('#r-region', 'NA');
  await page.selectOption('#r-source', 'CUSTOMS');
  await page.selectOption('#r-status', 'ACCEPTABLE');
  await page.fill('#r-basis', 'QA 重复登记依据（应 409）');
  await page.fill('#r-operator', 'QA-界面');
  await page.click('[data-btn="submit"]');
  await page.waitForSelector('#msg .msg.err');
  mmsg = await page.textContent('#msg');
  check('TC-035', '重复登记被拦截并提示转修订', mmsg.includes('已有规则') && mmsg.includes('修订'));
  await page.screenshot({ path: `${SHOTS}/TC-035-maintain-dup-409.png`, fullPage: true });
  // 409 后前端自动打开修订面板（openRevise 引导）
  await page.waitForTimeout(800);
  const panelVisible = await page.evaluate(() => {
    const p = document.querySelector('#rules .row-detail:not(.hidden)');
    return p && p.textContent.includes('新状态');
  });
  check('TC-035', '409 自动展开修订面板（转修订引导）', panelVisible);
  // 同状态拦截（面板预选当前状态，直接确认）
  const preSelected = await page.$eval('#v-status', el => el.value);
  check('TC-035', '修订面板预选当前状态（不可接）', preSelected === 'FORBIDDEN', preSelected);
  await page.fill('#v-basis', 'QA 修订依据：恢复附条件承接（界面测试）');
  await page.fill('#v-operator', 'QA-修订人');
  await page.click('#v-ok');
  await page.waitForTimeout(600);
  mmsg = await page.textContent('#msg');
  check('TC-035', '同状态提交被拦截（状态未变化，无需修订）', mmsg.includes('状态未变化，无需修订'));
  await page.screenshot({ path: `${SHOTS}/TC-035-maintain-same-status-422.png`, fullPage: true });
  // 改状态为敏感 → 确认修订
  await page.selectOption('#v-status', 'CONDITIONAL');
  await page.click('#v-ok');
  await page.waitForSelector('#msg .msg.ok');
  mmsg = await page.textContent('#msg');
  check('TC-035', '修订成功提示+变化记录链接', mmsg.includes('修订成功') && mmsg.includes('查看变化记录'));
  await page.screenshot({ path: `${SHOTS}/TC-035-maintain-revise-ok.png`, fullPage: true });
  // 列表行状态刷新为敏感
  await page.waitForTimeout(600);
  const rowTxt = await page.locator('#rules .row-item', { hasText: 'QA界面登记品类' }).textContent();
  check('TC-035', '列表行状态刷新为敏感（条件接）', rowTxt.includes('敏感（条件接）'));
  // 自动留痕置顶：PD-003 首条=本次修订
  await page.goto(BASE + '/changes.html');
  await page.waitForSelector('.tl-item');
  const topTl = await page.textContent('.tl-item');
  check('TC-035', '时间线首条=自动新增修订记录（置顶，无需人工补录）',
    topTl.includes('QA界面登记品类') && topTl.includes('不可接') && topTl.includes('敏感') && topTl.includes('QA-修订人'));
  await page.screenshot({ path: `${SHOTS}/TC-035-changes-top.png`, fullPage: true });

  // ---------- TC-036（交互面复核：英文查询+展开；中文/无命中文案已由 ?q= 静态截图留证） ----------
  await page.goto(BASE + '/search.html');
  await page.fill('#q', 'POWER');
  await page.click('#go');
  await page.waitForSelector('.hit-group');
  const hitTxt = await page.textContent('#results');
  check('TC-036', '英文大写 POWER 命中 Power Bank（忽略大小写）', hitTxt.includes('Power Bank') && hitTxt.includes('移动电源'));
  await page.locator('.hit-group .row-main').first().click();
  await page.waitForTimeout(400);
  const expTxt = await page.textContent('#results');
  check('TC-036', '结果行展开逐源源规则', expTxt.includes('展开') && (expTxt.includes('船司') || expTxt.includes('海关') || expTxt.includes('国家政策') || expTxt.includes('目的港') || expTxt.includes('头部物流')));
  await page.screenshot({ path: `${SHOTS}/TC-036-search-en-expand.png`, fullPage: true });

  // ---------- TC-038 导航快捷搜索 ----------
  await page.goto(BASE + '/');
  await page.waitForSelector('#quick');
  await page.fill('#quick', '电池');
  await page.press('#quick', 'Enter');
  await page.waitForSelector('.hit-group');
  const q = decodeURIComponent(new URL(page.url()).searchParams.get('q'));
  const groups = await page.$$eval('.hit-cat', els => els.length);
  check('TC-038', '快捷搜索跳转 search.html?q=电池 并自动查询 3 组', q === '电池' && groups === 3, `q=${q} groups=${groups}`);
  await page.screenshot({ path: `${SHOTS}/TC-038-quicksearch.png`, fullPage: true });

  await browser.close();

  const fail = results.filter(r => !r.pass);
  console.log('\n===== SUMMARY =====');
  console.log(JSON.stringify({ total: results.length, pass: results.length - fail.length, fail: fail.length }, null, 0));
  require('fs').writeFileSync('/tmp/qa_gen/ui_results.json', JSON.stringify(results, null, 2));
  process.exit(fail.length ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR:', e.message); process.exit(2); });
