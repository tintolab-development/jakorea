# 보고서 및 공시 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | `ja_transparency_report`, `ja_disclosure_setting`, `homepage_asset` |
| **FE SSOT** | [`apps/admin/src/features/reports-disclosure/api/store.ts`](../../src/features/reports-disclosure/api/store.ts) |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_ja_transparency_reports_local.sql` |

## 실행

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_ja_transparency_reports_local.sql
```

## 매핑

| FE | API/DB |
|----|--------|
| `annual` / `audit` | `ANNUAL` / `AUDIT` |
| title / createdAt | title / created_at |
| thumbnail / attachment | shared READY assets (`JA_REPORT_THUMBNAIL_IMAGE`, `JA_REPORT_PDF`) |
| NTS `linkUrl` | `disclosure_url` |

시드: annual 18 + audit 18 (제목·연도 패턴 FE 동일).  
썸네일/PDF는 행마다 **고유** READY asset (`uq_ja_transparency_report_thumbnail` / `_attachment`).

## 완료 기준

- [ ] ANNUAL 18 / AUDIT 18
- [ ] disclosure URL = FE SEED NTS
- [ ] Admin `/ja-korea/reports-disclosure` 노출

**Last updated:** 2026-08-13
