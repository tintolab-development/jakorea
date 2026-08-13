# 교육 소개 · 교육 대상 더미 시드

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **FE SSOT** | `education-target/api/store.ts` SEED_ROWS |
| **BE 스크립트** | `seed_education_targets_local.sql` |
| **API** | `GET/PUT /api/admin/education/targets` |

이름만 수정 가능 (id 1–5, color/order/code 고정). V10 기본값과 FE mock이 동일하면 UPDATE 0건.

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_education_targets_local.sql
```

**Last updated:** 2026-08-13
