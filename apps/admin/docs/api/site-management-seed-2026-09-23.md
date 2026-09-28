# 사이트 관리 시드 (Platform SSOT)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-09-23 |
| **대상** | Homepage `site_setting` · `gnb_menu` · `footer_top_menu` · `footer_organization` · `footer_partner` |
| **값 SSOT** | 이 문서 |
| **화면 출처** | Platform [`header-config.ts`](../../../platform/src/widgets/layout/app-layout/header/header-config.ts) · [`footer.tsx`](../../../platform/src/widgets/layout/app-layout/footer.tsx) |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_site_settings_local.sql` · `seed_gnb_menu_local.sql` · `seed_footer_local.sql` |
| **전달 프롬프트** | [`site-management-platform-seed-backend-cursor-prompt-2026-09-25.md`](./site-management-platform-seed-backend-cursor-prompt-2026-09-25.md) (이전: [`2026-09-23`](./site-management-platform-seed-backend-cursor-prompt-2026-09-23.md)) |

Admin mock(`apps/admin/.../store.ts`)은 2026-09-25부터 이 문서와 같은 문구를 쓴다. mock은 SSOT가 아니다. 실 JWT 조회는 이 문서 값을 보여야 한다. DB에 옛 값(`JA KOREA`, `기관 소개`, `진로·취업`, `기업가정신`, 결과 확인 미사용, 주소 괄호)이 남아 있으면 위 프롬프트의 SQL을 다시 실행한다.

구 문서 [`site-settings-dummy-seed-backend-request.md`](./site-settings-dummy-seed-backend-request.md) · [`gnb-menu-dummy-seed-backend-request.md`](./gnb-menu-dummy-seed-backend-request.md) · [`footer-dummy-seed-backend-request.md`](./footer-dummy-seed-backend-request.md)의 완료 기준(사이트명 `JA KOREA`, 결과 확인 미사용)은 쓰지 않는다.

## 범위

| 화면 | 경로 | 행 수 |
|------|------|------|
| 사이트 정보 | `/site/info` | 싱글톤 id=1 |
| GNB | `/site/gnb` | 고정 20 |
| 푸터 상단 메뉴 | `/site/footer` | 고정 7 |
| 푸터 기관 정보 | 같은 화면 | 싱글톤 id=1 |
| 유관기관 로고 | 같은 화면 | 고정 4슬롯 |

행 추가·삭제 없음. 시드는 **UPDATE**(에셋만 없을 때 INSERT). TRUNCATE 금지. local/dev 전용. Flyway·앱 기동이 이 SQL을 자동 재실행하지 않는다.

## 실행

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_site_settings_local.sql
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_gnb_menu_local.sql
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_footer_local.sql
```

## 1. 사이트 정보

| DB | 값 |
|----|-----|
| `site_name` | `JA Korea` |
| `seo_meta_description` | `청소년들이 과학기술을 기반으로 지식과 정보를 습득하는 방법을 익히고, 디지털 플랫폼을 통하여 분석, 응용, 활용해 문제를 해결하는 통합과정을 다루고 있습니다.` |
| `og_asset_id` | purpose `SITE_OG_IMAGE`, storage `local/seed/site-og-placeholder.png`, status `READY` |
| `favicon_asset_id` | purpose `SITE_FAVICON`, storage `local/seed/site-favicon-placeholder.png`, status `READY` |
| `version` | `0` |

OG·파비콘은 placeholder다. 실파일 스펙이 오기 전에는 파일명을 바꾸지 않는다. `publicUrl`에 `localhost:9000`을 컬럼으로 저장하지 않는다.

## 2. GNB (20)

그룹 코드는 기존 카탈로그를 유지한다. `display_order`는 그룹 안 1부터.

| group_code | display_order | menu_code | display_name | enabled |
|------------|---------------|-----------|--------------|---------|
| `JA_KOREA` | 1 | `JA_ORGANIZATION` | 기관소개 | true |
| `JA_KOREA` | 2 | `JA_TRANSPARENCY` | 투명경영 | true |
| `JA_KOREA` | 3 | `JA_PEOPLE` | 함께하는 사람들 | true |
| `JA_KOREA` | 4 | `JA_DIRECTIONS` | 오시는 길 | true |
| `JA_KOREA` | 5 | `JA_NOTICE` | 공지사항 | true |
| `JA_KOREA` | 6 | `JA_HISTORY` | JA History | true |
| `JA_KOREA` | 7 | `JA_RECRUIT` | 채용 | true |
| `IMPACT_STORY` | 1 | `IMPACT_STORY` | 임팩트 스토리 | true |
| `EDUCATION` | 1 | `EDU_CAREER` | 진로취업 | true |
| `EDUCATION` | 2 | `EDU_ECONOMY` | 경제금융 | true |
| `EDUCATION` | 3 | `EDU_ENTREPRENEURSHIP` | 기업가 정신 | true |
| `EDUCATION` | 4 | `EDU_DIGITAL_LITERACY` | 디지털 리터러시 | true |
| `EDUCATION` | 5 | `EDU_MATERIAL` | 교재 소개 | true |
| `PARTICIPATION` | 1 | `PARTICIPATION_APPLY` | 프로그램 신청 | true |
| `PARTICIPATION` | 2 | `PARTICIPATION_RESULT` | 결과 확인 | **true** |
| `PARTICIPATION` | 3 | `PARTICIPATION_ONLINE` | 온라인 학습 | true |
| `PARTICIPATION` | 4 | `PARTICIPATION_ALUMNI` | Alumni | true |
| `SPONSORSHIP` | 1 | `SPONSOR_PERSONAL` | 개인후원 | true |
| `SPONSORSHIP` | 2 | `SPONSOR_CORPORATE` | 기업후원 | true |
| `SPONSORSHIP` | 3 | `SPONSOR_TALENT` | 재능기부 | true |

GNB API는 메뉴 URL을 저장하지 않는다. `온라인 학습`·`Alumni`도 이름과 사용 여부만 맞춘다.

쓰지 말 것: `기관 소개`, `진로·취업`, `경제·금융`, `기업가정신`, `PARTICIPATION_RESULT.enabled = false`.

## 3. 푸터 상단 메뉴 (7)

`온라인 학습관리`는 Platform 화면에만 있고 DB 메뉴가 아니다. 8번째 행을 만들지 않는다.

| display_order | menu_code | label | link_type | internal_route_code | external_url | enabled |
|---------------|-----------|-------|-----------|---------------------|--------------|---------|
| 1 | `TERMS` | 이용약관 | `INTERNAL` | `TERMS` | NULL | true |
| 2 | `PRIVACY` | 개인정보처리방침 | `INTERNAL` | `PRIVACY` | NULL | true |
| 3 | `DIRECTIONS` | 오시는길 | `INTERNAL` | `DIRECTIONS` | NULL | true |
| 4 | `NTS_DISCLOSURE` | 국세청 공시 및 공개 내역 | `EXTERNAL` | NULL | `https://www.hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index.xml` | true |
| 5 | `NTS_EVASION_REPORT` | 국세청 탈세 제보 | `EXTERNAL` | NULL | `https://www.hometax.go.kr/` | true |
| 6 | `DONATION` | 후원하기 | `EXTERNAL` | NULL | `https://www.mrm.co.kr/` | true |
| 7 | `DONATION_RECEIPT` | 기부금영수증 | `EXTERNAL` | NULL | `https://www.mrm.co.kr/` | true |

외부 URL은 Platform `footer.tsx`에 href가 아직 없다. 위 4개는 Admin이 이미 쓰던 주소이며, 이번 시드에서 바꾸지 않는다. 라벨은 PUT으로 수정되지 않는다.

## 4. 푸터 기관 정보

| DB | 값 |
|----|-----|
| `organization_name` | `사단법인 제이에이코리아` |
| `organization_description` | `NULL` |
| `address` | `서울특별시 강서구 마곡중앙로 171 마곡나루역 프라이빗타워2차 714호` |
| `postal_code` | `07788` |
| `representative_name` | `이은형` |
| `business_registration_number` | `107-82-10367` |
| `phone` | `02-783-2367` |
| `fax` | `070-4275-5115` |
| `email` | `jakorea@jakorea.org` |
| `logo_asset_id` | purpose `FOOTER_LOGO`, storage `local/seed/footer-org-logo-placeholder.png`, status `READY` |

주소에 괄호 `(마곡나루역 프라이빗타워2차 714호)`를 넣지 않는다. `organization_description`은 Admin 화면에 없고, 시드는 null로 둔다.

## 5. 유관기관 로고 (4)

| id | organization_name | enabled | display_order | logo |
|----|-------------------|---------|---------------|------|
| 1 | 기획재정부 | true | 1 | `FOOTER_PARTNER_LOGO` placeholder |
| 2 | 국세청 | true | 2 | 같은 placeholder 재사용 가능 |
| 3 | 국민권익위원회 | true | 3 | 같은 placeholder |
| 4 | NULL | false | 4 | `logo_asset_id` NULL |

공개 푸터는 enabled 3건만 노출한다. 슬롯 4는 Admin 빈 행으로 남긴다.

## API 확인

인증 없이:

- `GET /api/public/site/settings` → `siteName` = `JA Korea`
- `GET /api/public/site/gnb` → 위 20개 `displayName`, `PARTICIPATION_RESULT` 포함
- `GET /api/public/site/footer` → 메뉴 7, 기관 주소는 괄호 없음, 파트너 3

Admin JWT:

- `GET /api/admin/site/settings`
- `GET /api/admin/site/gnb`
- `GET /api/admin/site/footer`

## 완료 기준

- [ ] `homepage.site_setting` 1행, `site_name` = `JA Korea`, og/favicon asset NOT NULL
- [ ] `homepage.gnb_menu` 20행, `PARTICIPATION_RESULT.enabled` = true, `display_name` = `기관소개` · `진로취업` · `경제금융` · `기업가 정신`
- [ ] `footer_top_menu` 7행. `온라인 학습관리` 행 없음. 내부 3개의 `external_url` IS NULL
- [ ] `footer_organization.id` = 1, `organization_description` IS NULL, 주소에 `(` 없음, logo NOT NULL
- [ ] `footer_partner` 1–3 enabled + logo, id 4 disabled + name/logo NULL
- [ ] 스크립트 재실행 후 행 수가 늘지 않음

**Last updated:** 2026-09-25
