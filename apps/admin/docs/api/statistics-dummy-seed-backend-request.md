# 통계 관리 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin 통계 관리 (방문자 · 메뉴별 조회) |
| **FE SSOT** | `visitor-stats/api/store.ts` `MONTHLY_TOTALS` · `menu-view-stats/api/store.ts` 섹션 수치 |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_statistics_local.sql` |
| **API** | `GET /api/admin/statistics/visitors` · `GET /api/admin/statistics/menus` |
| **테이블** | `homepage.homepage_metric_daily` |

## 실행

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_statistics_local.sql
```

(`JAHOMEADMINBACK` 루트에서 실행)

## 방문자

| FE | DB / API |
|----|----------|
| 일별 방문자 | `metric_code = VISITOR_SESSION_START` |
| 연·월 집계 | API `unit=YEAR\|MONTH\|DAY` + `from`/`to` |

- 시드 구간: `2022-01-01` ~ `2026-07-31` (월 합계를 일 단위로 분배)
- 일별 조회는 BE 한도(366일)로 FE가 `from`/`to`를 자름

## 메뉴별 조회

앵커 일자 `2026-07-01`에 mock 스케일 수치 INSERT. QA 시 기간에 **2026-07-01 포함** 필요.

| FE 섹션 / 지표 | metric_code (예) |
|----------------|------------------|
| 기관 소개 entry | `JA_ORGANIZATION_VIEW` |
| 투명경영 entry | `JA_TRANSPARENCY_VIEW` |
| 연차보고서 list/download | `JA_TRANSPARENCY_ANNUAL_REPORT_*` |
| 공지 entry/posts | `JA_KOREA_NOTICE_LIST_VIEW` / `DETAIL_VIEW` |
| 임팩트 entry/posts | `IMPACT_STORY_LIST_VIEW` / `DETAIL_VIEW` |
| 교육 분야 | `EDU_*_VIEW` |
| 참여·후원 | `PARTICIPATION_*` / `DONATION_*` / `SPONSOR_*` |

요약 상단 5메뉴 합은 BE `TopMenuStatistics.eventCount` (하위 metric 합). mock의 하드코딩 `20/0/0/9/15`와 다를 수 있음.

## 검증

- [ ] API 로그인 → 방문자 연/월/일 탭 Network `visitors?unit=&from=&to=`
- [ ] 메뉴별 조회 기간에 `2026-07-01` 포함 시 섹션 수치 노출
- [ ] Mock 로그인 → local store 유지
- [ ] 로그아웃 후 통계 query cache clear

**Last updated:** 2026-08-13
