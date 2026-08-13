# 교육 소개 · 교재 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **FE SSOT** | `education-textbook/api/store.ts` SEED_ROWS (8건) |
| **BE 스크립트** | `seed_education_textbooks_local.sql` |
| **API** | `GET/POST /textbooks`, `PUT/PATCH/DELETE` |

## 필터 → list GET

`applied` → `useEducationTextbooksList(filter)` → `list9(toTextbookListParams)`  

`enabled`, `textbookName`, `businessFieldId`, `targetId`, `createdFrom`/`To`, `page=0`, **`size=20`**

## 실행

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_education_business_catalog_local.sql
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_education_targets_local.sql
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_education_textbooks_local.sql
```

## 시드 건수

| 대상 | 건수 |
|------|------|
| textbook | 8 (비활성 1) |
| textbook_target | 11 links |
| thumbnail asset | 1 shared placeholder |

**Last updated:** 2026-08-13
