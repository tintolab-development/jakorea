# 수입&지출 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | `ja_finance_item` |
| **FE SSOT** | [`apps/admin/src/features/income-expense/api/store.ts`](../../src/features/income-expense/api/store.ts) `buildSeedData()` |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_ja_finance_items_local.sql` |

## 실행

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_ja_finance_items_local.sql
```

## 매핑

| FE | API/DB |
|----|--------|
| `income` / `expense` | `INCOME` / `EXPENSE` |
| `graph` / `table` | `CHART` / `TABLE` |
| `direct` / `indirect` | `DIRECT_PROGRAM` / `OTHER` (expense TABLE만) |
| `name` / `ratio` / `amount` / `sortOrder` | `item_name` / `ratio` / `amount` / `display_order` |

## 시드 건수

| section | view | count |
|---------|------|-------|
| INCOME | CHART | 3 |
| INCOME | TABLE | 3 |
| EXPENSE | CHART | 6 |
| EXPENSE | TABLE | 8 (direct 6 + indirect 2) |

**Last updated:** 2026-08-13
