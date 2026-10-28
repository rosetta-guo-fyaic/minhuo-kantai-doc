# TC-025 正常修订：双写+updated_at 变化+时间线置顶+三视图联动

> 生成：AI（QA-Agent）｜确认：待 PM 复核（主控代位）｜时间：2026-10-28｜版本：v1.0.0
> 上游真源：二号仓库产品基线 v1.0.0（FR-001~009）；零号仓库 VDL-v1.0.0 验收锚点三条

## 1. 用例信息

| 字段 | 内容 |
|------|------|
| 用例编号 | TC-025 |
| 用例名称 | 正常修订：双写+updated_at 变化+时间线置顶+三视图联动 |
| 用例类型 | 接口 |
| 关联规则编号 | FR-008 FR008-P2/P3 / FR-006 联动 |
| 优先级 | P0 |
| 适用版本 | v1.0.0 |
| 执行层 | 接口层（pytest，临时副本库） |

## 2. 前置条件

1. 种子库副本可写；目标=C1 锂电池×EU×CARRIER（id 以 granularity=source 查得，当前 FORBIDDEN，种子 updated_at=2026-10-01 09:30:00）

## 3. 测试步骤与预期

| 步骤 | 操作 | 输入 / 数据 | 预期结果 |
|------|------|-------------|----------|
| 1 | 记录修订前基线 | GET /api/rules?granularity=source&region=EU + GET /api/changes | 记下 rule.updated_at / rule_status / change 总数 10 |
| 2 | 提交修订 | PUT /api/rules/{id}：{new_status:CONDITIONAL,basis_text:船司恢复附条件承接（QA 修订样例）,operator:QA-修订人} | HTTP 200；返回 {rule, change_id}，rule.rule_status=CONDITIONAL、basis_text/operator 已回写 |
| 3 | 断言双写 | sqlite3 查临时副本 | change_log 行数 10→11（+1）；新行 old=FORBIDDEN new=CONDITIONAL 依据/操作者/时间齐全 |
| 4 | 断言 updated_at 变化 | GET /api/rules?granularity=source&region=EU | rule.updated_at ≠ 修订前值（种子值为 2026-10-01，必变） |
| 5 | 断言时间线置顶 | GET /api/changes | items[0] 即本次新记录（new_status=CONDITIONAL，operator=QA-修订人）——修订后时间线新增记录置顶 |
| 6 | 断言三视图联动 | GET /api/overview?region=EU + GET /api/regions/matrix | EU FORBIDDEN 4→3、CONDITIONAL 5→6（C1 就严态即时切换，GBR-005） |

## 4. 测试数据

| 数据项 | 内容 | 来源 |
|--------|------|------|
| 目标规则 | 锂电池×EU×CARRIER（FORBIDDEN） | 种子夹具 C1 |

## 5. 设计依据

1. AT-FR008-001/004（US-007 AT-001/004）+ US-005 AT-004；VDL 版本验收锚点 2「修订必留痕」。
2. 环境纪律：写操作一律在种子库临时副本（MH_DB_PATH 指向 /tmp）上执行，种子库 minhuo.db 不被污染；执行后以校验和留痕。

## 6. 执行结果登记

| 执行人 | 执行时间 | 结果 | 缺陷单号 | 备注 |
|--------|----------|------|----------|------|
| QA-Agent | 2026-10-28 | 通过 | — | RUN-001；详见 `02_测试执行/01_执行记录.md` |

## 7. 追溯关系

1. 来源需求：二号仓库产品基线 v1.0.0 `FR-008` 验收标准；零号仓库 VDL-v1.0.0。
2. 覆盖矩阵：见 `00_用例清单.md` §4（FR×TC）。

