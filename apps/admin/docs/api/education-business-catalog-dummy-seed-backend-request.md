# 교육 소개 · 사업분야 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin 사업분야 관리 |
| **FE SSOT** | `education-business-field/api/store.ts` SEED_ROWS / DEFAULT_INTRO |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_education_business_catalog_local.sql` |
| **API** | `GET/PUT /api/admin/education/business-catalog` |

## 실행

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_education_business_catalog_local.sql
```

## 매핑

| FE | DB / API |
|----|----------|
| `intro.mainText` | `education_business_setting.intro_text` / `introText` |
| `guideText` | `notice` |
| `isActive` | `enabled` |
| `sortOrder` | `display_order` |
| key `career`… | `field_code` CAREER_EMPLOYMENT… (id 1–4 고정) |

**Last updated:** 2026-08-13
