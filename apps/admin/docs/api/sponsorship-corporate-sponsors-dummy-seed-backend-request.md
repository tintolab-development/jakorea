# 후원사 목록 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **갱신** | 2026-09-20 — Admin 8 placeholder → Platform 홈 마퀴 12 SVG |
| **대상** | `corporate_sponsor` + `homepage_asset` (`SPONSOR_LOGO`) |
| **FE SSOT** | Platform [`HOME_PARTNER_LOGO_ROWS`](../../../platform/src/features/home/lib/mock.ts) |
| **요청서 요약** | [platform-home-public-main-seed-backend-request.md](./platform-home-public-main-seed-backend-request.md) |
| **BE 스크립트** | `seed_sponsorship_corporate_sponsors_local.sql` |

Admin localStorage mock 8건(Samsung, Citi, IBM, KRAFTON, lululemon, Microsoft, Google, Hyundai + SVG placeholder)은 **DB 시드 SSOT가 아니다**. Microsoft/Google/Hyundai placeholder 행은 폐기한다.

## 실행

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_sponsorship_corporate_sponsors_local.sql
```

## 에셋 복사

Platform 파일을 `homepage_asset` `local/seed/sponsors/` 로 복사한 뒤 `corporate_sponsor.logo_asset_id`에 연결한다.

경로: `apps/platform/src/features/corporate-donation/image/partner-logo-01.svg` … `partner-logo-12.svg`

| display_order | company_name | 파일 |
|---------------|--------------|------|
| 1 | SAMSUNG | partner-logo-01.svg |
| 2 | citi | partner-logo-02.svg |
| 3 | IBM | partner-logo-03.svg |
| 4 | Google for Education | partner-logo-04.svg |
| 5 | KRAFTON | partner-logo-05.svg |
| 6 | lululemon | partner-logo-06.svg |
| 7 | 신한은행 | partner-logo-07.svg |
| 8 | KYOBO 교보생명 | partner-logo-08.svg |
| 9 | MetLife Foundation | partner-logo-09.svg |
| 10 | BNY | partner-logo-10.svg |
| 11 | KIC 한국투자공사 | partner-logo-11.svg |
| 12 | Standard Chartered Foundation | partner-logo-12.svg |

## 완료 기준

- [ ] `corporate_sponsor` count = 12
- [ ] 각 행 `logo_asset_id` NOT NULL (placeholder data URL 아님)
- [ ] `/sponsor/corporate/partners` 목록 노출
- [ ] `GET /api/public/main` `sponsors[]` 12건

**Last updated:** 2026-09-20
