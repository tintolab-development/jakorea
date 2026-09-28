# 메인 상단 띠배너 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **갱신** | 2026-09-20 — 활성 2줄 카피·링크를 Platform 홈 셸에 맞춤 |
| **대상** | Homepage Admin `main_strip_banner` |
| **FE SSOT** | Platform [`HOME_MAIN_FALLBACK.strips`](../../../platform/src/features/home/lib/fallback.ts) (`TopBannerStrip`) |
| **요청서 요약** | [platform-home-public-main-seed-backend-request.md](./platform-home-public-main-seed-backend-request.md) |
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

**배경색 필드 없음.** Platform은 `--color-primary-700` / `--color-primary-500` 토큰을 유지한다. 스키마 확장 전까지 시드하지 않는다.

## 시드 5건

활성 2건은 Platform 홈 카피·내부 경로. 비활성 3건은 테스트용 유지.

| # | enabled | banner_text | 기간 | link |
|---|---------|-------------|------|------|
| 1 | true | 경제교육 봉사자 모집 중 | 2026-09-15 ~ 2027-09-15 | Y `https://www.jakorea.org/programs` |
| 2 | true | 2026연차보고서가 발간되었습니다 ! | 2026-09-15 ~ 2027-09-15 | Y `https://www.jakorea.org/about/transparency/annual-reports` |
| 3 | false | 청소년 경제교육 프로그램 참가자 모집 | 2026-09-15 ~ 2027-09-15 | N |
| 4 | false | JA Korea 뉴스레터 구독 안내 | 2026-09-15 ~ 2027-09-15 | Y https://www.jakorea.org/ |
| 5 | false | 만료 테스트 띠배너 | 2025-01-01 ~ 2025-12-31 | N |

규칙: 동시 `enabled=true` 최대 **2** (`MAX_ACTIVE_STRIP_BANNERS`).

이전 Admin 시드와의 차이: 연차보고서 띄어쓰기·`!`, 링크가 외부 루트/PDF가 아니라 Platform 내부 경로(호스트만 https).

## 완료 기준

- [ ] `SELECT count(*) FROM homepage.main_strip_banner` = 5
- [ ] `enabled=true` = 2, 문구가 위 1·2와 동일
- [ ] Admin API 로그인 후 `/main/strip-banners`에 동일 노출

**Last updated:** 2026-09-20
