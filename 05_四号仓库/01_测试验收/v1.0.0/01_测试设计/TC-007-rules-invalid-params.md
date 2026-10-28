# TC-007 列表非法 granularity/sort 400

> 生成：AI（QA-Agent）｜确认：待 PM 复核（主控代位）｜时间：2026-10-28｜版本：v1.0.0
> 上游真源：二号仓库产品基线 v1.0.0（FR-001~009）；零号仓库 VDL-v1.0.0 验收锚点三条

## 1. 用例信息

| 字段 | 内容 |
|------|------|
| 用例编号 | TC-007 |
| 用例名称 | 列表非法 granularity/sort 400 |
| 用例类型 | 接口 |
| 关联规则编号 | FR-002 异常 |
| 优先级 | P1 |
| 适用版本 | v1.0.0 |
| 执行层 | 接口层（pytest） |

## 2. 前置条件

1. 种子库副本可用

## 3. 测试步骤与预期

| 步骤 | 操作 | 输入 / 数据 | 预期结果 |
|------|------|-------------|----------|
| 1 | 非法粒度 | GET /api/rules?granularity=xxx | HTTP 400，code=MH-400-VALIDATION，detail.field=granularity |
| 2 | 非法排序 | GET /api/rules?sort=xxx | HTTP 400，code=MH-400-VALIDATION，detail.field=sort |
| 3 | source 粒度合法对照 | GET /api/rules?granularity=source&region=EU | HTTP 200，行含 id/category/region/source_type/rule_status/basis_text/note/operator/created_at/updated_at 全字段 |

## 4. 测试数据

（无特殊构造数据，使用种子夹具或用例内联数据。）

## 5. 设计依据

1. 异常分支覆盖（任务要求 400）；source 粒度为 PD-004 检索/修订定位的契约。
2. 环境纪律：写操作一律在种子库临时副本（MH_DB_PATH 指向 /tmp）上执行，种子库 minhuo.db 不被污染；执行后以校验和留痕。

## 6. 执行结果登记

| 执行人 | 执行时间 | 结果 | 缺陷单号 | 备注 |
|--------|----------|------|----------|------|
| QA-Agent | 2026-10-28 | 通过 | — | RUN-001；详见 `02_测试执行/01_执行记录.md` |

## 7. 追溯关系

1. 来源需求：二号仓库产品基线 v1.0.0 `FR-002` 验收标准；零号仓库 VDL-v1.0.0。
2. 覆盖矩阵：见 `00_用例清单.md` §4（FR×TC）。

