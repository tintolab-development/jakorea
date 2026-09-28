# Cursor prompt — 사이트 관리 Platform SSOT DB 시드 (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. 값·path·금지는 이 문서만 사용하라.  
질문이 필요하면 스키마·unique 제약·asset purpose가 값을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-26.md`

관련 API 문서(별도):

`apps/admin/docs/api/public-site-management-api-backend-cursor-prompt-2026-09-26.md`

값의 기준은 Platform 헤더·푸터·문서 헤드가 기대하는 문구(2026-09-26)다.  
이전 전달본 `site-management-platform-seed-backend-cursor-prompt-2026-09-23.md`, `…-2026-09-25.md`, `site-management-seed-2026-09-23.md` 와 이 문서가 다르면 **이 문서의 표를 따른다.**

공개 API와 Admin path는 이미 있다.  
이번 작업은 **로컬/dev DB 문구**를 Platform과 같게 맞춘다. 테이블·엔드포인트를 새로 만들지 마라.

---

## 배경

| 화면 | Admin 저장 | 공개 응답 |
|------|------------|-----------|
| 사이트명·SEO·OG·파비콘 | `site_setting` id=1 | `GET /api/public/site/settings` |
| GNB 5그룹·20메뉴 | `gnb` 그룹 + `gnb_menu` | `GET /api/public/site/gnb` |
| 푸터 메뉴 7 | `footer_top_menu` | `GET /api/public/site/footer` `menus` |
| 기관 정보 | `footer_organization` id=1 | `organization` |
| 유관 로고 4슬롯 | `footer_partner` id 1–4 | `partners` (사용 중·이름 있는 행만) |

Platform 화면 주소 줄은 `organizationName + ' ' + address` 이다.  
아래 기관명·주소를 합치면 다음 한 줄과 **문자 단위 동일**해야 한다.

`사단법인 제이에이코리아 서울특별시 강서구 마곡중앙로 171 마곡나루역 프라이빗타워2차 714호`

GNB href, 푸터 `온라인 학습관리`, 관련 사이트 7개, SNS 3개, 파트너 로컬 SVG는 **프론트 고정**이다. DB에 넣지 마라.

---

## Goal

로컬/dev Homepage DB의 사이트 관리 3화면이 Platform과 같게 한다.

완료 조건:

1. 무토큰 공개 GET 3개의 문자열이 이 문서 표와 같다(공백·문장 부호 포함).
2. GNB는 **20메뉴**, 전부 `enabled=true`. 그룹명 5개가 표와 같다.
3. 푸터 메뉴는 **7행**, 전부 enabled. `온라인 학습관리` 행은 없다.
4. 파트너는 **4슬롯**. 1–3 enabled+이름, 4는 enabled=false·organization_name NULL(또는 빈 문자열).
5. 시드는 **idempotent UPDATE**. 고정 행 수를 늘리거나 줄이지 않는다. TRUNCATE 금지.
6. **local/dev 전용.** prod Flyway·앱 기동·repeatable migration이 이 SQL을 자동 실행하지 않는다.
7. Admin/Platform 프론트 파일은 수정하지 않는다.

```bash
curl -sS 'http://localhost:8081/api/public/site/settings'
curl -sS 'http://localhost:8081/api/public/site/gnb'
curl -sS 'http://localhost:8081/api/public/site/footer'
```

---

## Out of scope / 금지

- API path·DTO 필드명 변경
- 메뉴 코드 추가·삭제. GNB 20, 푸터 메뉴 7, 파트너 슬롯 4
- 푸터에 `온라인 학습관리` 행 추가
- `organization_description`에 문장 넣기. NULL
- 사이트명 `JA KOREA`(전부 대문자). 값은 `JA Korea`
- GNB 구 라벨 `기관 소개`, `진로·취업`, `경제·금융`, `기업가정신`
- `PARTICIPATION_RESULT.enabled = false`
- 기관 주소의 괄호 `(마곡나루역 프라이빗타워2차 714호)`
- OG·파비콘·로고를 새 실파일로 교체. 기존 placeholder `storage_key` 유지
- `publicUrl` 컬럼에 `localhost:9000` 저장
- 관련 사이트 7개·SNS 3개 시드
- 참여하기 외부 링크(`/api/public/participation/links`) 시드
- TRUNCATE / 무관 행 DELETE
- prod 마이그레이션

---

## 시드 규칙

기존 스크립트(있으면 값을 이 표로 맞추고, 없으면 같은 이름으로 만든다):

- `scripts/seed_site_settings_local.sql`
- `scripts/seed_gnb_menu_local.sql`
- `scripts/seed_footer_local.sql`

스키마가 `homepage`가 아니면 Homepage가 이미 쓰는 스키마를 써라.  
로컬 DB 이름이 `jakorea`가 아니면 Homepage가 이미 쓰는 DB를 써라.

1. `site_setting.id = 1` UPDATE. 행이 없으면 실패로 보고하고 INSERT하지 마라.
2. OG/favicon/기관 로고/파트너 로고 asset은 `storage_key`가 없으면 INSERT, 있으면 그 id를 쓴다. purpose·status=`READY`를 유지한다.
3. GNB 그룹이 별도 테이블이면 `group_code`로 이름·`display_order`만 UPDATE. 없으면 메뉴 시드만 하고, 그룹명이 API에 하드코드면 그 코드를 이 표의 `group_name`으로 맞춘다. 그룹 행을 새로 만들지 마라.
4. `gnb_menu`는 `menu_code`로 UPDATE만. 없는 코드가 있으면 실패로 보고한다.
5. `footer_top_menu`는 `menu_code`로 UPDATE만.
6. `footer_organization.id = 1` UPDATE. 행이 없으면 실패로 보고하고 INSERT하지 마라.
7. `footer_partner.id` 1–4 UPDATE. id가 없으면 실패로 보고한다.
8. 모든 시드 행 `version = 0`, `updated_at = timestamptz '2026-07-01 00:00:00+00'`.
9. 스크립트를 두 번 실행해도 행 수가 같아야 한다.

실행:

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_site_settings_local.sql
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_gnb_menu_local.sql
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_footer_local.sql
```

(compose DB 이름·유저가 다르면 레포 README에 맞춘다.)

---

## 값

### site_setting id=1

| 컬럼 | 값 |
|------|-----|
| `site_name` | `JA Korea` |
| `seo_meta_description` | `청소년들이 과학기술을 기반으로 지식과 정보를 습득하는 방법을 익히고, 디지털 플랫폼을 통하여 분석, 응용, 활용해 문제를 해결하는 통합과정을 다루고 있습니다.` |
| OG | purpose `SITE_OG_IMAGE`, `storage_key` `local/seed/site-og-placeholder.png`, `original_name` `JA Korea_OG image.png` |
| favicon | purpose `SITE_FAVICON`, `storage_key` `local/seed/site-favicon-placeholder.png`, `original_name` `JA Korea_favicon image.png` |

### GNB 그룹

| display_order | group_code | group_name |
|---------------|------------|------------|
| 1 | `JA_KOREA` | `JA Korea` |
| 2 | `IMPACT_STORY` | `임팩트 스토리` |
| 3 | `EDUCATION` | `교육 소개` |
| 4 | `PARTICIPATION` | `참여하기` |
| 5 | `SPONSORSHIP` | `후원하기` |

### gnb_menu

그룹 안 `display_order`는 1부터. `enabled`는 전부 true.

| group_code | order | menu_code | display_name |
|------------|-------|-----------|--------------|
| JA_KOREA | 1 | JA_ORGANIZATION | 기관소개 |
| JA_KOREA | 2 | JA_TRANSPARENCY | 투명경영 |
| JA_KOREA | 3 | JA_PEOPLE | 함께하는 사람들 |
| JA_KOREA | 4 | JA_DIRECTIONS | 오시는 길 |
| JA_KOREA | 5 | JA_NOTICE | 공지사항 |
| JA_KOREA | 6 | JA_HISTORY | JA History |
| JA_KOREA | 7 | JA_RECRUIT | 채용 |
| IMPACT_STORY | 1 | IMPACT_STORY | 임팩트 스토리 |
| EDUCATION | 1 | EDU_CAREER | 진로취업 |
| EDUCATION | 2 | EDU_ECONOMY | 경제금융 |
| EDUCATION | 3 | EDU_ENTREPRENEURSHIP | 기업가 정신 |
| EDUCATION | 4 | EDU_DIGITAL_LITERACY | 디지털 리터러시 |
| EDUCATION | 5 | EDU_MATERIAL | 교재 소개 |
| PARTICIPATION | 1 | PARTICIPATION_APPLY | 프로그램 신청 |
| PARTICIPATION | 2 | PARTICIPATION_RESULT | 결과 확인 |
| PARTICIPATION | 3 | PARTICIPATION_ONLINE | 온라인 학습 |
| PARTICIPATION | 4 | PARTICIPATION_ALUMNI | Alumni |
| SPONSORSHIP | 1 | SPONSOR_PERSONAL | 개인후원 |
| SPONSORSHIP | 2 | SPONSOR_CORPORATE | 기업후원 |
| SPONSORSHIP | 3 | SPONSOR_TALENT | 재능기부 |

### footer_top_menu

| order | menu_code | label | link_type | internal_route_code | external_url |
|-------|-----------|-------|-----------|---------------------|--------------|
| 1 | TERMS | 이용약관 | INTERNAL | TERMS | NULL |
| 2 | PRIVACY | 개인정보처리방침 | INTERNAL | PRIVACY | NULL |
| 3 | DIRECTIONS | 오시는길 | INTERNAL | DIRECTIONS | NULL |
| 4 | NTS_DISCLOSURE | 국세청 공시 및 공개 내역 | EXTERNAL | NULL | `https://www.hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index.xml` |
| 5 | NTS_EVASION_REPORT | 국세청 탈세 제보 | EXTERNAL | NULL | `https://www.hometax.go.kr/` |
| 6 | DONATION | 후원하기 | EXTERNAL | NULL | `https://www.mrm.co.kr/` |
| 7 | DONATION_RECEIPT | 기부금영수증 | EXTERNAL | NULL | `https://www.mrm.co.kr/` |

전부 `enabled = true`.

### footer_organization id=1

| 컬럼 | 값 |
|------|-----|
| organization_name | `사단법인 제이에이코리아` |
| organization_description | NULL |
| address | `서울특별시 강서구 마곡중앙로 171 마곡나루역 프라이빗타워2차 714호` |
| postal_code | `07788` |
| representative_name | `이은형` |
| business_registration_number | `107-82-10367` |
| phone | `02-783-2367` |
| fax | `070-4275-5115` |
| email | `jakorea@jakorea.org` |
| logo | purpose `FOOTER_LOGO`, `storage_key` `local/seed/footer-org-logo-placeholder.png` |

### footer_partner

| id | organization_name | enabled | display_order | logo |
|----|-------------------|---------|---------------|------|
| 1 | 기획재정부 | true | 1 | purpose `FOOTER_PARTNER_LOGO`, `storage_key` `local/seed/footer-partner-logo-placeholder.png` |
| 2 | 국세청 | true | 2 | 같은 asset |
| 3 | 국민권익위원회 | true | 3 | 같은 asset |
| 4 | NULL | false | 4 | NULL |

---

## 검증 SQL

스키마가 `homepage`가 아니면 실제 스키마로 바꿔라.

```sql
SELECT site_name, seo_meta_description, og_asset_id IS NOT NULL, favicon_asset_id IS NOT NULL
FROM homepage.site_setting WHERE id = 1;

SELECT count(*) FROM homepage.gnb_menu;
SELECT menu_code, display_name, enabled
FROM homepage.gnb_menu
WHERE menu_code IN (
  'JA_ORGANIZATION','EDU_CAREER','EDU_ECONOMY','EDU_ENTREPRENEURSHIP','PARTICIPATION_RESULT'
);

SELECT count(*) FROM homepage.footer_top_menu;
SELECT menu_code, label, link_type, external_url IS NULL
FROM homepage.footer_top_menu ORDER BY display_order;

SELECT organization_name, address, organization_description IS NULL,
       address NOT LIKE '%(%',
       logo_asset_id IS NOT NULL
FROM homepage.footer_organization WHERE id = 1;

SELECT id, organization_name, enabled, logo_asset_id IS NOT NULL
FROM homepage.footer_partner ORDER BY id;
```

기대:

- `site_name` = `JA Korea`
- `seo_meta_description`이 위 문장과 같다
- gnb 20. `JA_ORGANIZATION`=`기관소개`, `EDU_CAREER`=`진로취업`, `EDU_ECONOMY`=`경제금융`, `EDU_ENTREPRENEURSHIP`=`기업가 정신`, `PARTICIPATION_RESULT.enabled` = true
- 그룹명이 있으면 `JA Korea` / `임팩트 스토리` / `교육 소개` / `참여하기` / `후원하기`
- footer menu 7. TERMS·PRIVACY·DIRECTIONS의 `external_url` IS NULL
- `organization_description` IS NULL, 주소에 `(` 없음
- 합친 주소 줄이 배경의 한 줄과 같다
- partner 1–3 enabled+logo, 4 disabled+logo null

공개 API:

```bash
curl -sS http://localhost:8081/api/public/site/settings
curl -sS http://localhost:8081/api/public/site/gnb
curl -sS http://localhost:8081/api/public/site/footer
```

공개 GNB에 메뉴 20(전부 enabled), 공개 푸터 메뉴 7, 공개 파트너는 이름 있는 3건(`기획재정부` `국세청` `국민권익위원회`).

---

## 회신 템플릿

```text
## 한 일
- 스크립트: (생성/수정 파일)
- 실행: (성공/실패)

## 검증
- site_name / seo 앞 20자:
- gnb count / PARTICIPATION_RESULT.enabled / JA_ORGANIZATION.display_name / group names:
- footer menu count:
- organization_description is null / address has '(':
- joined address line:
- partners 1-4 enabled+logo:

## 하지 않은 일
- 프론트 수정 없음
- 행 추가/삭제 없음
- 실 이미지 교체 없음
- 관련 사이트·SNS·참여하기 링크 시드 없음
- path·DTO 변경 없음

## 막힌 점
- (없으면 없음)
```

**Last updated:** 2026-09-26
