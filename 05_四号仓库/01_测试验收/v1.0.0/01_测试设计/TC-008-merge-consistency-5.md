# TC-008 就严合并黑盒五处一致性（C1 锂电池×EU）

> 生成：AI（QA-Agent）｜确认：待 PM 复核（主控代位）｜时间：2026-10-28｜版本：v1.0.0
> 上游真源：二号仓库产品基线 v1.0.0（FR-001~009）；零号仓库 VDL-v1.0.0 验收锚点三条

## 1. 用例信息

| 字段 | 内容 |
|------|------|
| 用例编号 | TC-008 |
| 用例名称 | 就严合并黑盒五处一致性（C1 锂电池×EU） |
| 用例类型 | 接口 |
| 关联规则编号 | FR-003 FR003-R5 / FR-001/002/004/005/009 |
| 优先级 | P0 |
| 适用版本 | v1.0.0 |
| 执行层 | 接口层（pytest） |

## 2. 前置条件

1. 种子库副本可用；C1=锂电池×EU：POLICY=CONDITIONAL + CARRIER=FORBIDDEN

## 3. 测试步骤与预期

| 步骤 | 操作 | 输入 / 数据 | 预期结果 |
|------|------|-------------|----------|
| 1 | 总览计数处 | GET /api/overview?region=EU&status=FORBIDDEN | total≥1 且该组合计入 FORBIDDEN（EU 不可接=4 含 C1）——计数处口径 |
| 2 | 规则列表处 | GET /api/rules?region=EU | 锂电池×EU 行 merged_status=FORBIDDEN，conflict=true |
| 3 | 矩阵处 | GET /api/regions/matrix | EU 行 counts.FORBIDDEN=4（含 C1）——矩阵处口径 |
| 4 | 下钻明细处 | GET /api/regions/EU/rules | 锂电池×EU 条目 merged_status=FORBIDDEN，conflict=true |
| 5 | 查询处 | GET /api/search?q=锂电 | 锂电池组 regions 中 EU：merged_status=FORBIDDEN，conflict=true |
| 6 | 逐值相等断言 | — | 五处 merged_status 与 conflict 逐值相等（五处为同一计算实现的消费——单点纪律黑盒复核，PD 交接提醒 b） |

## 4. 测试数据

| 数据项 | 内容 | 来源 |
|--------|------|------|
| C1 期望 | FORBIDDEN / conflict=true / worst_basis=船司公告（最严源依据） | 种子夹具+就严口径 |

## 5. 设计依据

1. AT-FR003-005（US-001 AT-003/US-002 AT-003/US-003 AT-002/US-008 AT-002）；PD-Agent 交接提醒 b：单点纪律黑盒复核。
2. 环境纪律：写操作一律在种子库临时副本（MH_DB_PATH 指向 /tmp）上执行，种子库 minhuo.db 不被污染；执行后以校验和留痕。

## 6. 执行结果登记

| 执行人 | 执行时间 | 结果 | 缺陷单号 | 备注 |
|--------|----------|------|----------|------|
| QA-Agent | 2026-10-28 | 通过 | — | RUN-001；详见 `02_测试执行/01_执行记录.md` |

## 7. 追溯关系

1. 来源需求：二号仓库产品基线 v1.0.0 `FR-003` 验收标准；零号仓库 VDL-v1.0.0。
2. 覆盖矩阵：见 `00_用例清单.md` §4（FR×TC）。

