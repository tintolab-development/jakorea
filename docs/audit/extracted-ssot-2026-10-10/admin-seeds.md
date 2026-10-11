# Admin 시드·연동 프롬프트 이관 SSOT

이관일: 2026-10-10
원본 수: 8

원본 경로 목록:

- `apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-23.md`
- `apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-25.md`
- `apps/admin/docs/api/site-management-seed-2026-09-23.md`
- `apps/admin/docs/api/directions-dummy-seed-backend-request.md`
- `apps/admin/docs/api/education-platform-seed-backend-cursor-prompt-2026-09-20.md`
- `apps/admin/docs/api/people-dummy-seed-backend-request.md`
- `apps/admin/docs/api/recruit-guide-platform-seed-backend-cursor-prompt-2026-09-25.md`
- `apps/admin/docs/api/site-management-seed-ready-frontend-cursor-prompt-2026-09-25.md`

---

### Source: `apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-23.md`

# Cursor prompt — 사이트 관리 Platform SSOT 시드

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`)에서 실행**하라.  
프론트 레포를 탐색하지 마라. 값·경로는 이 문서만 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(길이·NOT NULL·enum)만 하라.

값 명세(사람용): `apps/admin/docs/api/site-management-seed-2026-09-23.md`  
이 프롬프트가 그 명세와 다르면 **이 프롬프트의 표를 따른다.**

기존 스크립트(있으면 값을 이 표로 맞추고, 없으면 같은 이름으로 만든다):

- `scripts/seed_site_settings_local.sql`
- `scripts/seed_gnb_menu_local.sql`
- `scripts/seed_footer_local.sql`

---

## Goal

로컬/dev Homepage DB의 사이트 관리 3화면 데이터를 Platform 사용자 홈 문구와 같게 맞춘다.

| 화면 | Admin | Public |
|------|-------|--------|
| 사이트 정보 | `GET/PUT /api/admin/site/settings` | `GET /api/public/site/settings` |
| GNB | `GET/PUT /api/admin/site/gnb` | `GET /api/public/site/gnb` |
| 푸터 | `GET /api/admin/site/footer` · `PUT .../footer/menus` · `PUT .../footer/organization` · `PUT .../footer/partners/{id}` · `PUT .../footer/partners/order` | `GET /api/public/site/footer` |

완료 조건:

1. 아래 표와 같은 값이 DB에 있다.
2. 시드는 **idempotent UPDATE**. 고정 행 수를 늘리거나 줄이지 않는다. TRUNCATE 금지.
3. **local/dev 전용.** prod Flyway·앱 기동·repeatable migration이 이 SQL을 자동 실행하지 않는다.
4. Admin/Platform 프론트 파일은 수정하지 않는다.
5. 끝나면 아래 회신 템플릿으로 답한다.

---

## Out of scope / 금지

- 메뉴 코드 추가·삭제. GNB는 20, 푸터 메뉴는 7, 파트너 슬롯은 4.
- 푸터에 `온라인 학습관리` 행 추가. Platform 화면 전용이다.
- `organization_description`에 문장 넣기. NULL.
- 사이트명 `JA KOREA`(전부 대문자). 값은 `JA Korea`.
- GNB 구 라벨 `기관 소개`, `진로·취업`, `경제·금융`, `기업가정신`.
- `PARTICIPATION_RESULT.enabled = false`.
- 기관 주소의 괄호 `(마곡나루역 프라이빗타워2차 714호)`.
- OG·파비콘·로고를 새 실파일로 교체. 기존 placeholder storage key를 유지한다.
- `publicUrl` 컬럼에 `localhost:9000` 저장.
- 관련 사이트 7개(JA Worldwide 등)·SNS 3개 시드. 푸터 API 범위 밖이다.
- OpenAPI·DTO·서비스 로직 변경. 시드만 한다.

---

## 시드 규칙

1. `site_setting.id = 1` UPDATE. 행이 없으면 실패로 보고하고 INSERT하지 마라. 마이그레이션이 싱글톤을 만든다.
2. OG/favicon/기관 로고/파트너 로고 asset은 `storage_key`가 없으면 INSERT, 있으면 그 id를 쓴다. purpose·status=`READY`를 유지한다.
3. `gnb_menu`는 `menu_code`로 UPDATE만. 없는 코드가 있으면 실패로 보고한다.
4. `footer_top_menu`는 `menu_code`로 UPDATE만.
5. `footer_organization.id = 1` UPDATE.


---

### Source: `apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-25.md`

# Cursor prompt — 사이트 관리 Platform SSOT 시드 재적용

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서 실행**하라.  
프론트 레포를 탐색하지 마라. 값·경로는 이 문서만 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(길이·NOT NULL·enum)만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/site-management-platform-seed-backend-cursor-prompt-2026-09-25.md`

값 명세(사람용, 표가 이 프롬프트와 같음): `apps/admin/docs/api/site-management-seed-2026-09-23.md`  
이전 전달본: `site-management-platform-seed-backend-cursor-prompt-2026-09-23.md`  
이 프롬프트가 그 문서와 다르면 **이 프롬프트의 표를 따른다.**

2026-09-25 Admin mock fallback도 아래 표와 같은 문구를 쓴다. JWT 조회가 mock과 달라지면 안 된다. DB에 옛 값이 남아 있으면 이 SQL로 덮어쓴다.

기존 스크립트(있으면 값을 이 표로 맞추고, 없으면 같은 이름으로 만든다):

- `scripts/seed_site_settings_local.sql`
- `scripts/seed_gnb_menu_local.sql`
- `scripts/seed_footer_local.sql`

---

## Goal

로컬/dev Homepage DB의 사이트 관리 3화면 데이터를 Platform 사용자 홈 문구와 같게 맞춘다.

| 화면 | Admin | Public |
|------|-------|--------|
| 사이트 정보 | `GET/PUT /api/admin/site/settings` | `GET /api/public/site/settings` |
| GNB | `GET/PUT /api/admin/site/gnb` | `GET /api/public/site/gnb` |
| 푸터 | `GET /api/admin/site/footer` · `PUT .../footer/menus` · `PUT .../footer/organization` · `PUT .../footer/partners/{id}` · `PUT .../footer/partners/order` | `GET /api/public/site/footer` |

완료 조건:

1. 아래 표와 같은 값이 DB에 있다.
2. 시드는 **idempotent UPDATE**. 고정 행 수를 늘리거나 줄이지 않는다. TRUNCATE 금지.
3. **local/dev 전용.** prod Flyway·앱 기동·repeatable migration이 이 SQL을 자동 실행하지 않는다.
4. Admin/Platform 프론트 파일은 수정하지 않는다.
5. 끝나면 아래 회신 템플릿으로 답한다.

---

## Out of scope / 금지

- 메뉴 코드 추가·삭제. GNB는 20, 푸터 메뉴는 7, 파트너 슬롯은 4.
- 푸터에 `온라인 학습관리` 행 추가. Platform 화면 전용이다.
- `organization_description`에 문장 넣기. NULL.
- 사이트명 `JA KOREA`(전부 대문자). 값은 `JA Korea`.
- GNB 구 라벨 `기관 소개`, `진로·취업`, `경제·금융`, `기업가정신`.
- `PARTICIPATION_RESULT.enabled = false`.
- 기관 주소의 괄호 `(마곡나루역 프라이빗타워2차 714호)`.
- OG·파비콘·로고를 새 실파일로 교체. 기존 placeholder storage key를 유지한다.
- `publicUrl` 컬럼에 `localhost:9000` 저장.
- 관련 사이트 7개(JA Worldwide 등)·SNS 3개 시드. 푸터 API 범위 밖이다.
- OpenAPI·DTO·서비스 로직 변경. 시드만 한다.
- 목록 필터·페이지네이션·`/id` 상세 API를 새로 만들지 마라. 조회는 위 GET이 전부다.

---


---

### Source: `apps/admin/docs/api/site-management-seed-2026-09-23.md`

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


---

### Source: `apps/admin/docs/api/directions-dummy-seed-backend-request.md`

# 오시는 길 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin `ja_directions_setting` (singleton `id=1`) |
| **FE SSOT** | [`apps/admin/src/features/directions/api/store.ts`](../../src/features/directions/api/store.ts) |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_ja_directions_local.sql` |

## 실행 (로컬)

```bash
# Postgres (docker 예: jakorea-postgres)
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_ja_directions_local.sql
```

또는:

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d jakorea \
  -f scripts/seed_ja_directions_local.sql
```

## FE → API/DB 매핑

| FE (`DirectionsInfo`) | API (`DirectionsResponse` / Update) | DB (`ja_directions_setting`) |
|-----------------------|--------------------------------------|------------------------------|
| `addressKo` | `koreanAddress` | `korean_address` |
| `addressEn` | `englishAddress` | `english_address` |
| `kakaoMapHtml` | `kakaoMapHtml` (렌더/파싱) | `kakao_map_timestamp` / `kakao_map_key` / `kakao_map_width` / `kakao_map_height` |
| `phone` | `phone` | `phone` |
| `fax` | `fax` | `fax` |
| `email` | `email` | `email` |
| `updatedAt` | `updatedAt` | `updated_at` |
| `version` | `version` | `version` |

> BE는 임의 HTML을 저장하지 않는다. Kakao Roughmap 생성 스니펫만 파싱해 필드 저장 후, 조회 시 동일 형식으로 재조립한다.

## 시드 1건 (UPDATE)

| 필드 | 값 |
|------|-----|
| korean_address | 서울특별시 강서구 마곡중앙로 171 (마곡나루역 프라이빗타워2차 714호) |
| english_address | Rm 714, Magoknaru Station Private Tower 2, … |
| kakao_map_* | timestamp=`1783579310022`, key=`2xyz`, 1440×728 |
| phone / fax / email | 02-783-2367 / 070-4275-5115 / jakorea@jakorea.org |

## 완료 기준

- [ ] `SELECT count(*) FROM homepage.ja_directions_setting WHERE id=1` = 1
- [ ] `korean_address` · `phone` · `kakao_map_key` not null
- [ ] Admin API 로그인 후 `/ja-korea/directions`에 동일 노출

**Last updated:** 2026-08-13


---

### Source: `apps/admin/docs/api/education-platform-seed-backend-cursor-prompt-2026-09-20.md`

# Cursor prompt — 교육 소개 Platform SSOT 시드 + 프로그램 소개 write/public API

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약·값·파일 경로만** 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(길이·NOT NULL·enum·HTML sanitize)만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/education-platform-seed-backend-cursor-prompt-2026-09-20.md`

관련 FE 갭: `apps/admin/docs/api/education-program-intro-backend-gap.md`  
기존 시드(값 교체 대상): `scripts/seed_education_business_catalog_local.sql`, `scripts/seed_education_targets_local.sql`, `scripts/seed_education_textbooks_local.sql`

---

## Goal

Platform 「교육 소개」4페이지 + 「교육 콘텐츠(교재)」가 아래 API를 호출한다.  
로컬/dev DB를 **Platform mock 카피·이미지**와 같게 맞춰라.

| Method | Path | 상태 | 용도 |
|--------|------|------|------|
| GET/PUT | `/api/admin/education/program-intros/{fieldCode}` | **미구현 — 신설** | Admin 프로그램 소개 4탭 저장 |
| GET | `/api/public/education/program-intros/{fieldCode}` | **미구현 — 신설** | Platform `/education/career` 등 4페이지 |
| GET/PUT | `/api/admin/education/business-catalog` | 있음 | 사업분야 4 + introText |
| GET/PUT | `/api/admin/education/targets` | 있음 | 교육대상 5 |
| GET/POST/PUT/PATCH/DELETE | `/api/admin/education/textbooks…` | 있음 | 교재 CRUD |
| GET | `/api/public/education/overview` | 있음 | intro + fields + targets |
| GET | `/api/public/education/textbooks` | 있음 | Platform `/education/textbooks` |
| GET | `/api/public/education/textbooks/{id}` | 있음 | 교재 상세 모달 |
| GET | `/api/admin/education/programs` | 있음 **쓰지 마라** | CMS `public.program` 읽기. 교육소개 본문과 무관 |
| GET | `/api/public/education/programs` | 있음 **쓰지 마라** | 동일. Platform `/programs` 신청 카탈로그용 |

완료 조건:

1. **프로그램 소개 write/public API**가 아래 계약과 같고 OpenAPI에 올라간다.
2. 4 `fieldCode` 문서가 시드된다. 섹션 수는 **진로·경제·기업가 3, 디지털 2**. 이미지는 실파일 HTTP 200.
3. 사업분야 4 + introText, 교육대상 5, 교재 **8건**(아래 제목)이 Platform 카피와 같다. 구 Admin 교재 제목은 없다.
4. 시드는 **idempotent**. TRUNCATE 금지. **local/dev 전용.** prod Flyway에 운영 카피를 넣지 마라. 앱 기동·repeatable이 이 SQL을 **자동 재실행하지 않는다.**
5. 작업 후 프론트 변경이 있으면 아래 템플릿으로 회신하라.

---

## Out of scope / 금지

- `GET /api/admin/education/programs` · `GET /api/public/education/programs` 를 교육소개 본문으로 재사용
- 테이블 **TRUNCATE**. 시드 키와 다른 운영/수동 행은 남겨라
- `publicUrl` 에 `localhost:9000` MinIO 직접 주소
- placeholder 파일명만 있는 이미지 (`impact-story-placeholder`, `text.jpg` 단독 재사용으로 4분야 갤러리를 때우기)
- Admin/Platform FE 수정 (프론트 작업 아님)
- CMS 프로그램 신청 카탈로그 시드
- 홈 `GET /api/public/main` 의 `education.programs` 카드 목록 (홈 카드는 신청 프로그램 mock)

---

## 시드 초기화

1. 사업분야 4코드는 **없으면 INSERT, 있으면 id 유지**.
2. 교육대상 5코드는 **없으면 INSERT, 있으면 id 유지**. 명칭만 UPDATE.
3. 교재: 아래 **구 Admin 시드 제목**이 있고 신규 8제목에 없으면 DELETE. 신규 8제목은 UPSERT(이름+분야).

#### Marker lines (excerpt)
```
5. **TRUNCATE 금지.**
(파일명은 기존 패턴을 재사용해도 된다. 값은 이 문서가 SSOT.)
### 경로
| `sections` | 배열 **1–3**. 고정 3 금지 | 디지털만 2 |
`homepage_asset` 에 올리고 `READY` 로 둔 뒤 섹션 이미지 FK에 연결하라. placeholder 1장 재사용 금지.
백엔드 스펙 경로: {BE OpenAPI 파일}
```

---

### Source: `apps/admin/docs/api/people-dummy-seed-backend-request.md`

# 함께하는 사람들 더미 시드 (FE mock → DB)

> **내용 SSOT는 이 문서가 아니다.** Platform `/about/people` 기준 시드는 [people-platform-seed-backend-cursor-prompt-2026-09-26.md](./people-platform-seed-backend-cursor-prompt-2026-09-26.md) 를 쓴다. 아래 건수·컬럼 매핑만 참고한다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin 함께하는 사람들 (`ja_people_org_chart`, `ja_board_member`) |
| **FE SSOT** | [`organization-chart/api/store.ts`](../../src/features/organization-chart/api/store.ts) · [`board-members/api/store.ts`](../../src/features/board-members/api/store.ts) `SEED_ROWS` |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_ja_people_local.sql` |

## 실행 (로컬)

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d jakorea \
  -f scripts/seed_ja_people_local.sql
```

또는:

```bash
docker exec -i <postgres-container> \
  psql -U postgres -d jakorea < scripts/seed_ja_people_local.sql
```

## FE → API/DB 매핑

### 조직도

| FE | API | DB |
|----|-----|-----|
| `mainTitle` | `title` | `title` |
| `imageUrl` / `imageAssetId` | `organizationChartImage` / `organizationChartAssetId` | `organization_chart_asset_id` (`JA_ORGANIZATION_CHART_IMAGE`) |
| `version` | `version` | `version` |

### 이사회

| FE | API | DB |
|----|-----|-----|
| `roleGroup` | `role` (`BOARD_CHAIR_PRESIDENT` …) | `role_code` |
| `isPublic` | `published` | `published` |
| `nameKo` / `nameEn` | `koreanName` / `englishName` | `korean_name` / `english_name` |
| `position` / `affiliation` | `positionTitle` / `affiliationTitle` | `position_title` / `affiliation_title` |
| `sortOrder` | `displayOrder` | `display_order` |
| `version` | `version` | `version` |

## 시드 건수

| 대상 | 건수 |
|------|------|
| org chart | 1 (title + placeholder PNG asset) |
| board members | **11** (Chair&President 2 · Fiduciary 3 · Board Chair 6, 전부 `published=true`) |

## 완료 기준

- [ ] `SELECT count(*) FROM homepage.ja_board_member` = 11
- [ ] `ja_people_org_chart.id=1` title·asset NOT NULL
- [ ] Admin API 로그인 후 `/ja-korea/people` · `?tab=board`에 FE mock과 동일 노출

**Last updated:** 2026-08-13


---

### Source: `apps/admin/docs/api/recruit-guide-platform-seed-backend-cursor-prompt-2026-09-25.md`

# Cursor prompt — 채용 안내 Platform SSOT 시드 (JAHOMEADMINBACK)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서 실행**하라.  
프론트 레포를 탐색하지 마라. 값·경로는 이 문서만 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(길이·NOT NULL·enum)만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/recruit-guide-platform-seed-backend-cursor-prompt-2026-09-25.md`

값의 기준은 Platform 채용 안내 상수다. Admin mock·이전 합본 시드 문서는 SSOT가 아니다.  
이전 합본(`recruit-platform-seed-backend-cursor-prompt-2026-09-25.md`)과 안내 문구가 다르면 **이 문서의 JSON을 따른다.**

Flyway `V22__careers.sql` 과 기존 `scripts/seed_careers_local.sql` 은 이미 `ja_cms_local` 에 있다.  
이번 작업은 **채용 안내(배너·조직문화·인터뷰)만** 그 값으로 다시 맞춘다. 테이블·API를 새로 만들지 마라.

---

## Goal

로컬/dev Homepage DB의 채용 안내가 Platform `/about/careers` 히어로·조직문화·직무 인터뷰와 같게 한다.

| 화면 | Admin | Public |
|------|-------|--------|
| 채용 안내 | `GET /api/admin/careers/guide` | `GET /api/public/careers/guide` |

완료 조건:

1. 무토큰 `GET /api/public/careers/guide` 가 아래 JSON과 **문자 단위 동일**하다. `mainText`·`subTextKo` 의 `\n` 은 실제 개행이다.
2. `cultureItems` 길이 **4**. 첫 `code` 는 `MAKE_AN_IMPACT`. `displayOrder` 는 1→4.
3. `interviews` 길이 **3**. 첫 `storyKey` 는 `story-metlife-2026`, `year` 는 `2026`.
4. 시드는 **idempotent UPDATE**. 조직문화 4행·인터뷰 3행을 늘리거나 줄이지 않는다. TRUNCATE 금지.
5. **local/dev 전용.** prod Flyway·앱 기동·repeatable migration이 이 SQL을 자동 실행하지 않는다.
6. Admin/Platform 프론트 파일은 수정하지 않는다.

---

## Out of scope / 금지

- 채용공고 `job-1`…`job-10` 재시드·삭제. 인재 지원자 INSERT.
- 조직문화 행 추가·삭제. 인터뷰를 3건이 아닌 다른 `storyKey`·제목으로 바꾸기.
- 배너·커버 **파일 바이트** 생성. `storage_key` 만 연결한다. 파일이 없어도 키는 둔다.
- `bannerImageUrl` / `coverImageUrl` 컬럼에 `http://localhost:9000/...` 를 저장. 공개 URL은 조회 시 storage key에서 만든다.
- 배너를 Unsplash URL로 두기.
- 히어로 라벨 `인재채용`, `imageAlt`, `How We Thrive`, thrive `tone` / `column` / decoration SVG, 인터뷰 `categoryLabel` `스토리` 를 DB 컬럼으로 추가. Platform 고정 카피다.
- 조직문화 `title`·`description` 에 화면 줄바꿈(`summaryLines` / `detailLines`)을 `\n` 으로 넣기. 그 필드는 **한 문장**이다.
- 인터뷰 `year` 에 월·일(`2026년 08월 15일`)을 넣기. 연도 정수만.
- 안내 `PUT` API, DTO, OpenAPI 변경.
- 공고 29건, 지원자 `홍길동`.

---

## 시드 규칙

스크립트: `scripts/seed_careers_guide_local.sql`  
없으면 이 이름으로 만든다. 기존 `scripts/seed_careers_local.sql` 의 **안내 UPDATE 구간만** 이 JSON으로 바꿔도 된다. 그 스크립트의 공고·지원자 구간은 실행하지 마라.

1. 안내 싱글톤 행이 없으면 실패로 보고하고 INSERT하지 마라. `V22` 가 만든다.
2. 조직문화는 `code` 로 UPDATE만. `MAKE_AN_IMPACT` · `KEEP_LEARNING` · `SPEAK_OPENLY` · `READY_TO_HELP` 중 없으면 실패로 보고한다.
3. 인터뷰는 `story_key` 로 UPDATE만. `story-metlife-2026` · `story-summer-camp` · `story-volunteer-day` 중 없으면 실패로 보고한다.

#### Marker lines (excerpt)
```
- 배너 URL 경로에 `local/seed/careers-hero.png`.
- API/DTO 변경 없음
```

---

### Source: `apps/admin/docs/api/site-management-seed-ready-frontend-cursor-prompt-2026-09-25.md`

# Cursor prompt — 사이트 관리 시드 반영 확인 (FE)

아래 지시를 **프론트 레포(`jakorea`)에서 실행**하라.  
`JAHOMEADMINBACK` 를 수정하지 마라.

**백엔드 상태 (2026-09-25 로컬 `:8081` 검증 완료):** 사이트 정보·GNB·푸터 시드를 Platform SSOT로 다시 적용했다. path·DTO·스키마는 바꾸지 않았다.

값 SSOT: [`site-management-seed-2026-09-23.md`](./site-management-seed-2026-09-23.md)  
연동 규칙(이미 구현된 경우 재작성 금지): [`site-shell-public-api-frontend-cursor-prompt-2026-09-23.md`](../../../platform/docs/api/site-shell-public-api-frontend-cursor-prompt-2026-09-23.md)

---

## OpenAPI

**갱신 필요: NO.**

- 추가·삭제·rename된 path 없음.
- schema 이름·필드 변경 없음.
- `pnpm --filter admin fetch:openapi` / `generate:api` 를 **하지 마라.**
- 스냅샷에 `/api/admin/site` · `/api/public/site` 가 없을 때만 기존 `orval-codegen.md`의 `site` filter로 fetch한다. 그 경우에도 corporate/talent 스키마를 같이 건드리지 마라.

---

## FE 코드 수정

**기본: 수정하지 않는다.** Admin·Platform이 이미 아래 GET을 쓰면 브라우저 새로고침(쿼리 캐시 무효)만 하면 된다.

| 앱 | 확인 |
|----|------|
| Admin | `GET /api/admin/site/settings` · `/gnb` · `/footer` (JWT) |
| Platform | `GET /api/public/site/settings` · `/gnb` · `/footer` |

remote가 켜져 있으면 store mock / `header-config` / `footer.tsx` 하드코딩을 화면에 쓰지 마라. mock으로 되돌리지 마라.

로컬 Homepage가 꺼져 fallback만 보일 때는 fallback 문구가 아래와 같아야 한다. 옛 값이면 **fallback 카피만** 고친다. API 클라이언트·OpenAPI·백엔드는 건드리지 마라.

| 옛 값 (쓰지 말 것) | 현재 값 |
|--------------------|---------|
| `JA KOREA` | `JA Korea` |
| `기관 소개` | `기관소개` |
| `진로·취업` | `진로취업` |
| `경제·금융` | `경제금융` |
| `기업가정신` | `기업가 정신` |
| 결과 확인 미사용 | `PARTICIPATION_RESULT` enabled, 라벨 `결과 확인` |
| 주소 `(마곡나루역 …)` | 괄호 없는 주소 |

---

## 화면에 보여야 하는 값

- `siteName` = `JA Korea`
- GNB 20, 위 라벨, `결과 확인` 포함
- 푸터 메뉴 7. `온라인 학습관리`는 API에 없고 Platform 로컬 append
- 기관 `organizationDescription` 없음, 주소에 `(` 없음
- 공개 푸터 파트너 3 (슬롯 4는 Admin에서만 disabled)

---

## Out of scope / 금지


#### Marker lines (excerpt)
```
- 백엔드·DTO·시드 SQL 수정
- Admin remote 조회가 SSOT와 같음: (yes/no)
- Platform public 조회가 SSOT와 같음: (yes/no)
```

---
