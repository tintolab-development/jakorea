# 기업 후원 상담 더미 시드 (익명)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | `corporate_consultation` (PENDING 10건) |
| **FE SSOT** | `corporate-consultation/api/store.ts` (건수·필드 형태) |
| **BE 스크립트** | `seed_sponsorship_corporate_consultations_local.sql` |

실 PII 없음 — 회사명 `(더미)`, 연락처 `010-1000-00xx`, 첨부 NULL.

## 실행

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_sponsorship_corporate_consultations_local.sql
```

## 완료 기준

- [ ] count = 10, status=PENDING
- [ ] `/sponsor/corporate/consultations` 목록 노출

**Last updated:** 2026-08-13
