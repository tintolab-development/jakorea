# Cursor prompt — Homepage Admin 로컬 시드 (Platform 홈 에셋·카피)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 값·파일 경로만** 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(길이·URL 정규식·NOT NULL)만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/platform-home-public-main-backend-cursor-prompt-2026-09-20.md`

---

## Goal

Platform 사용자 홈(`apps/platform`)이 `GET /api/public/main` 을 호출한다.  
응답이 없거나 필드가 비면 Platform은 **로컬 fallback**을 쓴다.  
로컬/dev DB를 Platform 기본 화면과 **같은 카피·에셋**으로 맞춰, 연동 시 화면이 깨지지 않게 하라.

완료 조건:

1. `GET /api/public/main` (인증 없음) 이 아래 시드값을 **빈 배열/빈 문자열 없이** 반환한다.
2. 히어로 **3건** (기존 6건 placeholder 폐기). 이미지 3행이 **같은** `hero-classroom.png` 에셋을 가리킨다.
3. 임팩트 `youtubeUrl` = `https://www.youtube.com/watch?v=ts_hit5wXqg`
4. 후원사 **12건** + Platform SVG 실로고. Admin 8건 placeholder(Microsoft/Google/Hyundai 포함) 폐기.
5. 띠배너 활성 **2건** 문구·링크가 아래 표와 동일하다.
6. 소셜 6채널 **실URL 유지** (Platform generic URL로 바꾸지 마라).
7. 시드는 **idempotent**. 재실행해도 히어로 3 / 후원사 12 / 활성 띠배너 2가 중복되지 않는다.
8. **local/dev 전용.** prod Flyway에 운영 카피를 넣지 마라. 기존 `scripts/seed_*_local.sql` 패턴을 재사용하라.
9. 대표 스토리 커버는 **실 PNG** (`card-minjae.png`). `impact-story-placeholder.png` 는 404라서 Platform이 깨진 이미지로 보인다. 파일명을 placeholder로 두지 마라.

---

## Out of scope / 금지

- OpenAPI / `PublicMainResponse` 필드 추가·삭제. **이번 작업은 시드·에셋이다.**
- 띠배너 **배경색** 컬럼 추가 (Platform이 CSS 토큰을 유지한다)
- 팝업 시드 교체·Platform 팝업 렌더 지원
- GNB / 푸터 / 사이트 OG·파비콘 / 공지 (`/api/public/site/*`, `/api/public/ja-korea/notices`)
- 교육 프로그램 카탈로그 시드 (`PublicEducationResponse.programs` — 홈 카드 목록이 아님)
- 임팩트 스토리 목록 3건 추가 (public main은 `featuredStory` 1건만)
- `cta*Url` / `link_url` / `external_url` 에 **상대경로**(`/programs`)를 넣지 마라. DB 제약이 `^https?://` 이다.
- 소셜 `NEWSLETTER` 를 `mailto:` 로 바꾸지 마라 (https만 허용).
- 후원 CTA 를 `https://online.mrm.or.kr/...` 로 두지 마라.
- Admin FE localStorage mock 수정 (프론트 작업 아님)

---

## URL 정책 (필수)

링크 컬럼은 `http://` 또는 `https://` 만 허용한다.  
Platform 내부 페이지는 **호스트만 붙인다.** Platform 매퍼가 `jakorea.org` / `www.jakorea.org` 를 내부 path로 정규화한다.

| 용도 | DB에 넣을 값 |
|------|----------------|
| 개인후원 CTA | `https://www.jakorea.org/support/individual` |
| 기업후원 CTA | `https://www.jakorea.org/support/corporate` |
| 띠배너 봉사자 | `https://www.jakorea.org/programs` |
| 띠배너 연차보고서 | `https://www.jakorea.org/about/transparency/annual-reports` |
| 히어로 링크 | `NULL` |

`http://jakorea.org/_File/bbs/...pdf` 같은 구 링크는 활성 띠배너에서 제거하라.

---

## 에셋 파일 (프론트 레포에서 복사)

`homepage_asset` 에 올리고 `READY` 로 둔 뒤, 배너/후원사 FK에 연결하라.  
placeholder SVG 1장 재사용을 **중단**하라.

프론트 레포 `jakorea` 기준:

```
apps/platform/src/features/home/image/background/hero-classroom.png
apps/platform/src/features/corporate-donation/image/partner-logo-01.svg
apps/platform/src/features/corporate-donation/image/partner-logo-02.svg
apps/platform/src/features/corporate-donation/image/partner-logo-03.svg
apps/platform/src/features/corporate-donation/image/partner-logo-04.svg
apps/platform/src/features/corporate-donation/image/partner-logo-05.svg
apps/platform/src/features/corporate-donation/image/partner-logo-06.svg
apps/platform/src/features/corporate-donation/image/partner-logo-07.svg
apps/platform/src/features/corporate-donation/image/partner-logo-08.svg
apps/platform/src/features/corporate-donation/image/partner-logo-09.svg
apps/platform/src/features/corporate-donation/image/partner-logo-10.svg
apps/platform/src/features/corporate-donation/image/partner-logo-11.svg
apps/platform/src/features/corporate-donation/image/partner-logo-12.svg
apps/platform/src/features/impact-story/image/illustration/card-minjae.png
```

권장 저장 경로 예:

```
local/seed/main-hero-classroom.png
local/seed/sponsors/partner-logo-01.svg
… partner-logo-12.svg
local/seed/impact-story-card-minjae.png
```

히어로 PNG는 **1건만** 만들고 히어로 3행이 같은 `image_asset_id` 를 쓴다.  
후원 SVG는 **12건 각각** `SPONSOR_LOGO` (또는 기존 후원 로고 타입)로 올린다.

---

## 1. 히어로 — `main_hero_banner` 3건

스크립트: `scripts/seed_main_heroes_local.sql`

기존 6행을 지우고 3행으로 재시드하거나, natural key로 upsert 후 나머지 disable/delete.

`main_title` 의 `\n` 은 **실제 줄바꿈**으로 저장하라 (JSON escape 문자 그대로 넣지 마라).

| display_order | enabled | top_text | main_title | bottom_text | link_url |
|---------------|---------|----------|------------|-------------|----------|
| 1 | true | JA KOREA | 청소년의 가능성이\n더 넓은 세상과 만납니다 | JA는 학생들이 멘토와 연결되어 실제 세상을 경험하며 배울 수 있는 교육 기회를 제공합니다. | NULL |
| 2 | true | JA KOREA | 경제교육으로 여는\n청소년의 내일 | 전국 200여 개 지역에서 전문 봉사자·교사·강사가 청소년의 배움과 함께합니다. | NULL |
| 3 | true | JA KOREA | 배움의 기회를\n모든 청소년에게 | 기업과 지역사회가 함께 만드는 실질적인 경제·금융·진로 교육을 경험해 보세요. | NULL |

공개 API 필드: `topText` / `mainTitle` / `bottomText` / `imageUrl` / `displayOrder`.

완료: `SELECT count(*) FROM homepage.main_hero_banner WHERE enabled` = 3.  
활성 행이 3을 넘으면 Platform 캐러셀이 6장이 된다 — **활성은 3만**.

---

## 2. 메인 콘텐츠 — `main_*_content_setting`

스크립트: `scripts/seed_main_content_local.sql`

| 테이블/섹션 | 필드 | 값 |
|-------------|------|-----|
| education | title | `새로운 배움이 기다리고 있어요` |
| impact | title | `JA Korea와 함께\n청소년의 가능성을 넓혀주세요` (실제 줄바꿈) |
| impact | youtube_url | `https://www.youtube.com/watch?v=ts_hit5wXqg` |
| impact | featured_story_id | 기존 published 스토리 1건 유지. **커버는 실 PNG** (`card-minjae.png`). `impact-story-placeholder.png` 금지. `publicUrl`에 `localhost:9000` 넣지 마라. |
| performance | network_distribution_count | 200 |
| performance | partner_organization_count | 1000 |
| performance | educator_count | 3000 |
| performance | youth_beneficiary_count | 90000 |
| performance | title | `함께 만들어온 배움의 여정` |
| performance | bottom_text | `학생들이 스스로 미래를 설계하도록\n전국 200여개 지역의 JA 네트워크가 함께합니다` |
| donation | title | `더 많은 학생들이 배움의 기회를\n만날 수 있게 함께해 주세요` |
| donation | cta1_label | `개인후원 시작하기` |
| donation | cta1_url | `https://www.jakorea.org/support/individual` |
| donation | cta2_label | `기업후원 문의하기` |
| donation | cta2_url | `https://www.jakorea.org/support/corporate` |

**교체:** `https://youtu.be/sJYCV5yMa9M?...` → 위 watch URL.  
**교체:** mrm 후원 URL → jakorea.org 내부 경로(호스트 포함).

대표 스토리 커버:

프론트 `apps/platform/src/features/impact-story/image/illustration/card-minjae.png` 를  
`local/seed/impact-story-card-minjae.png` 로 복사하고 `IMPACT_STORY_ATTACHMENT` 로 올린 뒤 featured 스토리에 연결하라.  
`GET /api/public/main` 의 `impact.featuredStory.imageUrl` 이 **200** 이어야 한다. 브라우저에서 열리게 하라 (`:9000` MinIO 직접 URL 금지).

단위 문자열(`지역+` 등)은 DB에 넣지 마라. 숫자만.

---

## 3. 후원사 — `corporate_sponsor` 12건

스크립트: `scripts/seed_sponsorship_corporate_sponsors_local.sql`

공개 홈 마퀴에 나가므로 **12건 모두 공개(enabled/isPublic=true)**.  
기존 8건(Samsung, Citi, IBM, KRAFTON, lululemon, Microsoft, Google, Hyundai + placeholder)은 삭제하거나 비공개 후 12건으로 교체.

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

`GET /api/public/main` 의 `sponsors[]` 길이가 **12** 이고 각 `logoUrl` 이 실제 SVG/이미지 URL이어야 한다.

---

## 4. 소셜 — `main_social_link` UPDATE만

스크립트: `scripts/seed_main_social_links_local.sql`  
생성/삭제 없음. PK 고정 6종.

값을 **바꾸지 마라.** 확인만 하라.

| channel_code | enabled | external_url |
|--------------|---------|--------------|
| INSTAGRAM | true | https://www.instagram.com/jakorea_official/ |
| FACEBOOK | true | https://www.facebook.com/jakorea/?locale=ko_KR |
| LINKEDIN | true | https://kr.linkedin.com/ |
| NAVER_BLOG | true | https://section.blog.naver.com/BlogHome.naver?directoryNo=0&currentPage=1&groupId=0 |
| NEWSLETTER | true | https://stibee.com/ |
| YOUTUBE | true | https://youtube.com/user/jakorea2002 |

공개 응답 필드: `channelCode` / `channelName` / `externalUrl` / `displayOrder`.  
비활성 채널은 배열에서 빼거나 Platform이 URL 없는 행을 무시한다 — **6개 모두 enabled** 유지.

---

## 5. 띠배너 — `main_strip_banner`

스크립트: `scripts/seed_main_strip_banners_local.sql`  
동시 `enabled=true` 최대 **2**.

활성 2건만 Platform 카피로 맞춘다. 비활성 테스트 3건은 유지해도 된다.

| display_order | enabled | banner_text | link_url | 기간 예 |
|---------------|---------|-------------|----------|---------|
| 1 | true | 경제교육 봉사자 모집 중 | `https://www.jakorea.org/programs` | 2026-09-15 ~ 2027-09-15 |
| 2 | true | 2026연차보고서가 발간되었습니다 ! | `https://www.jakorea.org/about/transparency/annual-reports` | 동일 |

문구 주의: `2026연차보고서` **띄어쓰기 없음**, 끝에 ` !` (공백+느낌표).  
공개 필드: `bannerText` / `linkUrl` / `displayOrder`. 배경색 필드 없음.

기간이 지난 행은 public에서 빠지는 기존 스케줄 로직을 유지하라. 활성 2건은 **지금 날짜에 노출**되게 하라.

---

## 6. 팝업

`main_popup` / public `popups[]` 는 **손대지 마라.** Platform이 렌더하지 않는다.

---

## 구현 순서

1. 기존 `scripts/seed_main_heroes_local.sql`, `seed_main_content_local.sql`, `seed_sponsorship_corporate_sponsors_local.sql`, `seed_main_strip_banners_local.sql`, `seed_main_social_links_local.sql` 과 `homepage_asset` 시드 패턴을 찾아라.
2. 에셋 13개(히어로 PNG 1 + 로고 SVG 12)를 local seed 경로에 복사하고 asset 행을 upsert 하라.
3. 히어로 6→3 재시드 + 공통 `image_asset_id`.
4. 메인 콘텐츠 YouTube·CTA URL UPDATE.
5. 후원사 8→12 + 로고 FK.
6. 띠배너 활성 2줄 문구·링크 UPDATE.
7. 소셜 SELECT로 실URL 확인만.
8. `GET /api/public/main` 으로 검수.

---

## 검수 — `GET /api/public/main`

인증 없이 호출. 래퍼가 `{ success, data }` 이면 `data` 기준.

최소 확인:

```text
heroes.length == 3
heroes[*].imageUrl 비어 있지 않음
heroes[0].mainTitle 에 줄바꿈 포함
impact.youtubeUrl == https://www.youtube.com/watch?v=ts_hit5wXqg
impact.featuredStory.imageUrl 비어 있지 않음, 파일명에 placeholder 없음
impact.featuredStory.imageUrl 을 curl 하면 HTTP 200 + image/*
performance.networkDistributionCount == 200
performance.youthBeneficiaryCount == 90000
donation.cta1Url 가 https://www.jakorea.org/support/individual
donation.cta2Url 가 https://www.jakorea.org/support/corporate
sponsors.length == 12
sponsors[*].logoUrl 비어 있지 않음
stripBanners 활성 노출 2건
stripBanners[0].bannerText == 경제교육 봉사자 모집 중
stripBanners[1].bannerText == 2026연차보고서가 발간되었습니다 !
socialLinks 6건, INSTAGRAM URL 에 jakorea_official
```

Admin 로그인 후 UI 확인:

- `/main/hero-banners` 3건 + 교실 이미지
- `/main/contents` YouTube·CTA
- `/sponsor/corporate/partners` 12 + 실 SVG
- `/main/strip-banners` 활성 2줄
- `/main/social-links` 기존 실URL

---

## 스키마 변경이 필요할 때만 (이번 범위 아님)

아래는 **하지 마라.** 프론트가 따로 요청하기 전까지 보류.

- `main_strip_banner.background_color`
- 링크 컬럼에 상대경로 `/...` 허용
- `NEWSLETTER` 에 `mailto:`
- public main 에 프로그램 카드 썸네일·스토리 서브 3건

프론트가 빈 필드를 fallback으로 되돌리므로, 시드가 빠지면 **기본 화면으로 돌아가고 관리값이 안 보인다.** 빈 값으로 두지 마라.

---

## 작업 후 회신 형식

```text
- 변경 스크립트: (파일 목록)
- 에셋 경로: (homepage_asset local/seed/…)
- GET /api/public/main 요약: heroes=?, sponsors=?, stripBanners=?
- 막힌 제약: (있으면 스키마/정규식 그대로)
```

**Last updated:** 2026-09-20
