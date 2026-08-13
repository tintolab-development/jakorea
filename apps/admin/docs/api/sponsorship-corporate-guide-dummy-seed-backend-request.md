# 기업후원 안내 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | `corporate_sponsorship_setting` · `metric` · `partnership_step` |
| **FE SSOT** | [`corporate-guide/api/store.ts`](../../src/features/corporate-guide/api/store.ts) |
| **BE 스크립트** | `seed_sponsorship_corporate_guide_local.sql` |

## 실행

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_sponsorship_corporate_guide_local.sql
```

## 완료 기준

- [ ] setting main/sub not null
- [ ] metrics 3 · steps 6 텍스트 채움
- [ ] `/sponsor/corporate/guide` 노출

**Last updated:** 2026-08-13
