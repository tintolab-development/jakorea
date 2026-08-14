# 메인 상단 띠배너 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin `main_strip_banner` |
| **FE SSOT** | [`apps/admin/src/features/strip-banner/api/store.ts`](../../src/features/strip-banner/api/store.ts) `SEED_ROWS` |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_main_strip_banners_local.sql` |

## 실행 (로컬)

```bash
# Postgres (docker 예: jakorea-postgres / 컨테이너명 확인 후)
PGPASSWORD=postgres psql -h localhost -U postgres -d jakorea \
  -f scripts/seed_main_strip_banners_local.sql
```

또는 컨테이너 안:

```bash
docker exec -i <postgres-container> \
  psql -U postgres -d jakorea < scripts/seed_main_strip_banners_local.sql
```

## FE → API/DB 매핑

| FE | API (`StripCreateRequest`) | DB |
|----|----------------------------|-----|
| `isActive` | `enabled` | `enabled` |
| `text` | `bannerText` | `banner_text` |
| `periodStart` / `periodEnd` | `displayStartDate` / `displayEndDate` | `display_*_date` |
| `sortOrder` | `displayOrder` | `display_order` |
| `linkEnabled` / `linkUrl` | 동일 | `link_*` (`false`면 `link_url` NULL) |

## 시드 5건

| # | enabled | banner_text | 기간 | link |
|---|---------|-------------|------|------|
| 1 | true | 경제교육 봉사자 모집 중 | 2026-09-15 ~ 2027-09-15 | Y https://www.jakorea.org/ |
| 2 | true | 2026 연차보고서가 발간되었습니다 | 2026-09-15 ~ 2027-09-15 | Y http://jakorea.org/_File/bbs/4/files_1739770612_0.pdf |
| 3 | false | 청소년 경제교육 프로그램 참가자 모집 | 2026-09-15 ~ 2027-09-15 | N |
| 4 | false | JA Korea 뉴스레터 구독 안내 | 2026-09-15 ~ 2027-09-15 | Y https://www.jakorea.org/ |
| 5 | false | 만료 테스트 띠배너 | 2025-01-01 ~ 2025-12-31 | N |

규칙: 동시 `enabled=true` 최대 **2** (`MAX_ACTIVE_STRIP_BANNERS`).

## 완료 기준

- [ ] `SELECT count(*) FROM homepage.main_strip_banner` = 5
- [ ] `enabled=true` = 2
- [ ] Admin API 로그인 후 `/main/strip-banners`에 동일 노출

**Last updated:** 2026-08-13
