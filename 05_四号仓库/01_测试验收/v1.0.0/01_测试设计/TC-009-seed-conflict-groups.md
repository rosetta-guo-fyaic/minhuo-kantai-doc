# TC-009 种子冲突组 C1~C4 真冲突 + C5 同态不误报

> 生成：AI（QA-Agent）｜确认：待 PM 复核（主控代位）｜时间：2026-10-28｜版本：v1.0.0
> 上游真源：二号仓库产品基线 v1.0.0（FR-001~009）；零号仓库 VDL-v1.0.0 验收锚点三条

## 1. 用例信息

| 字段 | 内容 |
|------|------|
| 用例编号 | TC-009 |
| 用例名称 | 种子冲突组 C1~C4 真冲突 + C5 同态不误报 |
| 用例类型 | 接口 |
| 关联规则编号 | FR-003 FR003-R2/R3 / GBR-007 |
| 优先级 | P0 |
| 适用版本 | v1.0.0 |
| 执行层 | 接口层（pytest） |

## 2. 前置条件

1. 种子库副本可用；夹具定义（PD 交接提醒 c）：C1 锂电池×EU / C2 移动电源×SEA / C3 纯电池组×NA / C4 带电玩具×ME 真冲突 4 组 + C5 打火机×SEA 同态对照

## 3. 测试步骤与预期

| 步骤 | 操作 | 输入 / 数据 | 预期结果 |
|------|------|-------------|----------|
| 1 | 核对 C1 | GET /api/rules?region=EU（过滤锂电池） | FORBIDDEN，conflict=true（CONDITIONAL+FORBIDDEN 就严收紧） |
| 2 | 核对 C2 | GET /api/rules?region=SEA（过滤移动电源） | CONDITIONAL，conflict=true（ACCEPTABLE+CONDITIONAL 就严中间态——AT-FR003-002） |
| 3 | 核对 C3 | GET /api/rules?region=NA（过滤纯电池组） | FORBIDDEN，conflict=true（POLICY=FORBIDDEN + CUSTOMS=CONDITIONAL） |
| 4 | 核对 C4 | GET /api/rules?region=ME（过滤带电玩具） | FORBIDDEN，conflict=true（ACCEPTABLE+FORBIDDEN——AT-FR003-001） |
| 5 | 核对 C5 同态 | GET /api/rules?region=SEA（过滤打火机） | FORBIDDEN，conflict=false（CUSTOMS+POLICY 双源全 FORBIDDEN：多源同态不算冲突，不误报——AT-FR003-003） |
| 6 | 核对变化夹具 | GET /api/changes | total=10，三方向齐备（可接→敏感/敏感→不可接/不可接→敏感） |

## 4. 测试数据

（无特殊构造数据，使用种子夹具或用例内联数据。）

## 5. 设计依据

1. AT-FR003-001/002/003；GBR-007 样例口径；PD-Agent 交接提醒 c：种子夹具验证。
2. 环境纪律：写操作一律在种子库临时副本（MH_DB_PATH 指向 /tmp）上执行，种子库 minhuo.db 不被污染；执行后以校验和留痕。

## 6. 执行结果登记

| 执行人 | 执行时间 | 结果 | 缺陷单号 | 备注 |
|--------|----------|------|----------|------|
| QA-Agent | 2026-10-28 | 通过 | — | RUN-001；详见 `02_测试执行/01_执行记录.md` |

## 7. 追溯关系

1. 来源需求：二号仓库产品基线 v1.0.0 `FR-003` 验收标准；零号仓库 VDL-v1.0.0。
2. 覆盖矩阵：见 `00_用例清单.md` §4（FR×TC）。

