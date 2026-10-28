# 实施编排与 Task 表：敏货看台 v1.0.0

> 生成：AI（DEV-Agent）｜确认：DEV 自检+待评审｜时间：2026-10-28 18:20（R3 整改 2026-10-28 18:29）
> 状态：待评审（对应模板 10/12/21 的合并承接；放行后由代码仓按 `ai-code-input-assembler` 汇编为 AI_CODE_INPUT，本表即汇编底稿）

## 1. 编排范围与结论

1. 覆盖：环境初始化 → 数据库 → 后端 API → 前端 → 种子数据 → 集成自测，共 **9 个 Task**（Task-001~009）。
2. 不纳入：REQ-006~010 及全部基线排除项（版本范围说明 §2.3）；测试用例正文归四号仓库（本表只给验收自检命令）。
3. 实施结论：`CONTINUE`（无阻断缺口；TD-01/TD-02 待评审点不阻塞编码，按本表实现，评审异议走三号仓修订）。
4. 前置门禁：`00_技术方案评审与放行/01_放行结论.md` 评审放行 + 代码仓 `.project-doc-repo.json` 填写激活基线，方可启动 Task-001（代码仓 AGENTS §1 硬门禁）。

## 2. 上游输入映射

| Task 输入 | 真源 |
|-----------|------|
| 数据模型 | M01（DDL 定版） |
| API 契约 | M02（8 端点+错误码） |
| 合并口径 | M03（单点+常量表） |
| 页面绑定 | M04（§5 绑定表） |
| 种子数据 | M05（22/5/4/10+自校验） |
| 事务纪律 | 跨模块专项 01 |

## 3. Task 表（每个 Task 一轮「实现→自检→commit」）

### Task-001 环境初始化

| 项 | 内容 |
|----|------|
| 内容 | 建 venv（Python 3.14）；装 fastapi/uvicorn；建代码仓骨架目录（backend/app、frontend/static/{css,js}、database、tests、scripts）；requirements.txt 落版本 |
| 涉及文件 | `backend/app/__init__.py`、`requirements.txt`、目录占位 |
| 对应 | 总体方案 §4（选型定版） |
| 验收自检 | `python3 --version`（≥3.14）；`python -c "import fastapi, uvicorn; print('ok')` "输出 ok |

### Task-002 数据库与数据模型

| 项 | 内容 |
|----|------|
| 内容 | 编写 schema.sql（三表+CHECK+唯一+索引+append-only 触发器）；db.py 连接助手（参数化出口、PRAGMA foreign_keys=ON、行转对象）；init_db.sh（删库→DDL） |
| 涉及文件 | `database/schema.sql`、`backend/app/db.py`、`scripts/init_db.sh` |
| 对应 | M01 全件；FR-007/008 数据底座 |
| 验收自检 | `bash scripts/init_db.sh && sqlite3 minhuo.db ".tables"`（三表齐）；`sqlite3 minhuo.db "SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name LIKE 'trg_change_log%'"`（=2）；`sqlite3 minhuo.db "INSERT INTO rule(category_id,region,source_type,rule_status,basis_text,operator) VALUES(1,'XX','CARRIER','ACCEPTABLE','x','y')"` 报 CHECK 失败 |

### Task-003 状态合并模块（M03 单点）

| 项 | 内容 |
|----|------|
| 内容 | merge.py（STATUS_SEVERITY/merge_status/build_display_entries/单源口径分支）；constants.py（服务端枚举序）；可配置点 STATUS_MERGE_STRATEGY+fail-fast |
| 涉及文件 | `backend/app/merge.py`、`backend/app/constants.py`、`tests/test_merge.py` |
| 对应 | FR-003 全部；R2 硬要求①（就严单点实现+策略做成可配置点，版本范围说明 §7.1 子项） |
| 验收自检 | `pytest tests/test_merge.py -q`（覆盖 AT-FR003-001~004 四类断言全绿）；`grep -rn "SEVERITY\|severity" backend/app --include="*.py" | grep -v merge.py | grep -v constants.py`（零命中=无第二实现） |

### Task-004 后端只读 API

| 项 | 内容 |
|----|------|
| 内容 | 实现 6 个 GET 端点（overview/rules 双粒度/regions/matrix/regions/{code}/rules/changes/search），全部走 build_display_entries；LIKE 转义；错误码按 M02 §7.2 |
| 涉及文件 | `backend/app/api.py`、`backend/app/main.py`、`tests/test_api_read.py`（pytest 临时库夹具：空库/种子库两态） |
| 对应 | FR-001/002/004/005/006/009 |
| 验收自检 | `pytest tests/test_api_read.py -q`；`python -m uvicorn app.main:app --port 8000 & sleep 2 && curl -s localhost:8000/api/overview | head -c 200`（返回 counts JSON） |

### Task-005 后端写 API（登记/修订）

| 项 | 内容 |
|----|------|
| 内容 | POST /api/rules（TD-01 品类解析/409 查重/不留痕）；PUT /api/rules/{id}（§跨模块 01 的单事务双写/404/422/回滚）；Pydantic 模型 RuleCreate/RuleRevise |
| 涉及文件 | `backend/app/api.py`、`tests/test_api_write.py` |
| 对应 | FR-007/FR-008（+GBR-002/004/005） |
| 验收自检 | `pytest tests/test_api_write.py -q`（含：修订后 change_log 计数+1；构造 CHECK 失败断言 rule 与 change_log 均不变=回滚；POST 不产生 change_log）；`curl -s -X PUT localhost:8000/api/rules/11 -H 'content-type: application/json' -d '{"new_status":"CONDITIONAL","basis_text":"t","operator":"qa"}' | head -c 200`（返回 change_id） |

### Task-006 前端公共层

| 项 | 内容 |
|----|------|
| 内容 | constants.js（M03 §6 常量表逐条落）+ app.js（fetchJSON/statusBadge/conflictBadge/escapeHtml/highlight/导航/快捷搜索）+ app.css（三态色/徽章/矩阵） |
| 涉及文件 | `frontend/static/js/constants.js`、`frontend/static/js/app.js`、`frontend/static/css/app.css` |
| 对应 | PD 约定（页面清单 §2）；R2 硬要求③（三态文案单点） |
| 验收自检 | `node --check frontend/static/js/app.js 2>/dev/null || echo "no-node 环境改用浏览器控制台无报错"`；`grep -c "不可接" frontend/static/js/constants.js`（≥1）且 `grep -rn "不可接" frontend/static --include="*.js" | grep -v constants.js`（零命中=文案单点）；镜像一致性（R3 条件3）：`python3 -c "import re;css=set(re.findall(r'#[0-9a-f]{6}',open('frontend/static/css/app.css').read().lower()));js=set(re.findall(r'#[0-9a-f]{6}',open('frontend/static/js/constants.js').read().lower()));assert js<=css,(js,css);print('mirror-ok')"`（constants.js 色值 ⊆ app.css :root 真源） |

### Task-007 前端五页面

| 项 | 内容 |
|----|------|
| 内容 | index/regions/changes/maintain/search 五页，按 M04 §5 绑定表逐区块接 API；静态挂载 StaticFiles(html=True) 且 API 路由先行 |
| 涉及文件 | `frontend/static/*.html`（5 件）、`backend/app/main.py`（挂载） |
| 对应 | PD-001~005 ↔ FR-001~009（绑定表逐行） |
| 验收自检 | `curl -s localhost:8000/ | grep -c 现状总览`（≥1）；五个路由逐一 `curl -s -o /dev/null -w "%{http_code} " localhost:8000/{,regions,changes,maintain,search}.html`（全 200）；.js 侧断言=文案单点+镜像不外溢（R3 条件3）：`grep -rn "不可接\|#dc2626" frontend/static --include="*.js" | grep -v constants.js`（零命中）；样式色值断言扫 app.css：`grep -n "#16a34a\|#d97706\|#dc2626" frontend/static/css/app.css`（恰 3 处且均位于 :root 块内，其余样式一律 var(--c-*) 引用） |

### Task-008 种子数据

| 项 | 内容 |
|----|------|
| 内容 | seed.py（CATEGORIES 22/RULES~55 含 4 冲突组/CHANGELOG 10）+ 播种后六项自校验断言 |
| 涉及文件 | `database/seed.py`、`scripts/init_db.sh`（串联 seed） |
| 对应 | GBR-007（版本范围说明 §5.4 定版 22/5/4/10）；FR-006 前置 ≥8 |
| 验收自检 | `python database/seed.py && python database/seed.py; echo exit=$?`（第二次非 0=防重播生效）；`sqlite3 minhuo.db "SELECT COUNT(*) FROM category; SELECT COUNT(*) FROM change_log;"`（22 / 10） |

### Task-009 集成自测与收口

| 项 | 内容 |
|----|------|
| 内容 | 全量 pytest；浏览器冒烟走查 PD-001~005 主链（含一条登记→三视图可见、一条修订→时间线首位出现）；路由数断言；单点 grep 复扫；README 启动说明 |
| 涉及文件 | `tests/`（全量）、`README.md`（代码仓） |
| 对应 | FR-001~009 汇总；跨模块专项 01 §6 |
| 验收自检 | `pytest -q`（全绿）；`python - <<'EOF'…枚举 app.routes 业务路由数==8…EOF`；`curl -s "localhost:8000/api/search?q=锂电" | python -m json.tool | head`（命中锂电池）；修订后 `curl -s localhost:8000/api/changes | head -c 300`（新记录在首位） |

## 4. Task ↔ FR ↔ 页面 总映射（汇编 AI_CODE_INPUT 用）

| Task | FR | 页面/区块 | 依赖 Task |
|------|----|-----------|-----------|
| 001 | —（环境） | — | — |
| 002 | 数据底座（FR-007/008 存储） | — | 001 |
| 003 | FR-003 | 跨页口径 | 002 |
| 004 | FR-001/002/004/005/006/009 | PD-001/002/003/005 数据面 | 003 |
| 005 | FR-007/008 | PD-004 数据面 | 003 |
| 006 | PD 全局约定 | 全部页公共 | 001 |
| 007 | FR-001~009 | PD-001~005 界面 | 004+005+006 |
| 008 | GBR-007 | —（演示/冒烟数据） | 002 |
| 009 | 全部 | 全部 | 001~008 |

## 5. 缺口清单

| 缺口项 | 说明 | 影响 | 阻断 |
|--------|------|------|------|
| 无 | TD-01 品类双名撞档、TD-03 错误文案归属为待评审技术口径，按 M02 §6 实现不阻断 | 编码/测试 | 否 |

## 6. 版本历史

| 修订版 | 日期 | 修改内容 | 修改人 |
|--------|------|----------|--------|
| r1.0 | 2026-10-28 | 初始建立（Task-001~009/映射/自检命令） | AI（DEV-Agent） |
| r1.1 | 2026-10-28 | R3 整改：条件2 Task-003/006 标尺统一；条件3 Task-006 增镜像一致性断言、Task-007 断言口径改写（.js=文案与镜像一致性，样式色值扫 app.css） | AI（DEV-Agent） |
