# 후원사 목록 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | `corporate_sponsor` + `homepage_asset` (`SPONSOR_LOGO`) |
| **FE SSOT** | [`corporate-partner/api/store.ts`](../../src/features/corporate-partner/api/store.ts) |
| **BE 스크립트** | `seed_sponsorship_corporate_sponsors_local.sql` |

## 실행

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_sponsorship_corporate_sponsors_local.sql
```

## 완료 기준

- [ ] `corporate_sponsor` count = 8
- [ ] `/sponsor/corporate/partners` 목록 노출

**Last updated:** 2026-08-13
