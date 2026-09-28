# Platform 홈 공개 메인 시드 (Platform 에셋·카피 → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-09-20 |
| **대상** | Homepage Admin `GET /api/public/main` 이 내리는 테이블 |
| **FE SSOT** | Platform 홈 mock [`apps/platform/src/features/home/lib/mock.ts`](../../../platform/src/features/home/lib/mock.ts) + [`lib/fallback.ts`](../../../platform/src/features/home/lib/fallback.ts) |
| **연동** | Platform `useHomeMain` — 응답이 없거나 비면 위 fallback을 그대로 쓴다 |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_main_heroes_local.sql`, `seed_main_content_local.sql`, `seed_sponsorship_corporate_sponsors_local.sql`, `seed_main_strip_banners_local.sql` |

이 문서는 **연결 준비용 시드 요청서**다. SQL·바이너리 복사는 백엔드 레포 작업이다. Admin localStorage mock은 바꾸지 않아도 된다(원격 API 사용 시 DB가 진실).

백엔드 에이전트에 붙여넣을 프롬프트(이 문서 내용을 실행 지시로 풀어 쓴 것):

[platform-home-public-main-backend-cursor-prompt-2026-09-20.md](./platform-home-public-main-backend-cursor-prompt-2026-09-20.md)

## 원칙

1. 기본 화면은 Platform 로컬 이미지·텍스트와 같아야 한다.
2. 빈 배열·빈 문자열은 Platform이 fallback으로 되돌리므로, 시드는 **채워진 값**이어야 한다.
3. `homepage_asset` 바이너리는 placeholder 1장 재사용을 중단하고, 아래 경로 파일을 `local/seed/...`로 복사한 뒤 id를 건다.

## 1. 히어로 — 3건 (6→3) + 교실 PNG 공유

FE: `HOME_HERO_SLIDES`. 필드: `eyebrow`→`top_text`, `titleLines.join('\n')`→`main_title`, `description`→`bottom_text`. **링크 없음** (`link_url` NULL).

에셋: [`apps/platform/src/features/home/image/background/hero-classroom.png`](../../../platform/src/features/home/image/background/hero-classroom.png) 1건을 `MAIN_HERO_IMAGE`로 올리고 3행이 같은 `image_asset_id`를 참조.

| display_order | enabled | top_text | main_title | bottom_text |
|---------------|---------|----------|------------|-------------|
| 1 | true | JA KOREA | 청소년의 가능성이\n더 넓은 세상과 만납니다 | JA는 학생들이 멘토와 연결되어 실제 세상을 경험하며 배울 수 있는 교육 기회를 제공합니다. |
| 2 | true | JA KOREA | 경제교육으로 여는\n청소년의 내일 | 전국 200여 개 지역에서 전문 봉사자·교사·강사가 청소년의 배움과 함께합니다. |
| 3 | true | JA KOREA | 배움의 기회를\n모든 청소년에게 | 기업과 지역사회가 함께 만드는 실질적인 경제·금융·진로 교육을 경험해 보세요. |

완료: `SELECT count(*) FROM homepage.main_hero_banner` = **3**, `enabled=true` = 3.

상세 매핑은 [hero-banner-dummy-seed-backend-request.md](./hero-banner-dummy-seed-backend-request.md).

## 2. 메인 콘텐츠 — YouTube·실적·후원 CTA

| 섹션 | 필드 | 시드 값 |
|------|------|---------|
| 교육 | `title` | `새로운 배움이 기다리고 있어요` (이미 동일) |
| 임팩트 | `title` | `JA Korea와 함께\n청소년의 가능성을 넓혀주세요` |
| 임팩트 | `youtube_url` | **`https://www.youtube.com/watch?v=ts_hit5wXqg`** (Admin mock `youtu.be/sJYCV5yMa9M` 교체) |
| 실적 | counts | `200 / 1000 / 3000 / 90000` (이미 동일) |
| 실적 | `bottom_text` | `학생들이 스스로 미래를 설계하도록\n전국 200여개 지역의 JA 네트워크가 함께합니다` |
| 정기후원 | CTA 라벨 | `개인후원 시작하기` / `기업후원 문의하기` |
| 정기후원 | CTA URL | BE가 `https?://`만 받으면 `https://www.jakorea.org/support/individual`, `https://www.jakorea.org/support/corporate`. Platform 매퍼가 내부 path로 정규화한다. 기존 mrm 외부 URL은 쓰지 않는다. |

프로그램 카드 목록은 홈 콘텐츠 시드 범위가 아니다(`PublicEducationResponse.programs` ≠ 홈 카탈로그). 대표 스토리 1건만 `featured_story_id` (**민재** 18건 시드 2번). 서브 3건은 `/api/public/impact-story/stories`. 스토리 18건 시드: [impact-story-platform-seed-backend-cursor-prompt-2026-09-20.md](./impact-story-platform-seed-backend-cursor-prompt-2026-09-20.md).

대표 스토리 커버: [`card-minjae.png`](../../../platform/src/features/impact-story/image/illustration/card-minjae.png) 를 `IMPACT_STORY_ATTACHMENT` 로 올리고 featured 스토리에 연결.  
현재 `imageUrl=http://localhost:9000/homepage-public/local/seed/impact-story-placeholder.png` 는 **404**. 히어로처럼 실파일을 넣고, 객체 키에 `placeholder` 를 쓰지 마라.  
브라우저가 여는 주소여야 한다(히어로 `main-hero-classroom.png` 와 같은 publicUrl 규칙). 객체만 비어 있으면 깨진 아이콘이 난다.

전용 프롬프트: [platform-home-featured-story-cover-backend-cursor-prompt-2026-09-20.md](./platform-home-featured-story-cover-backend-cursor-prompt-2026-09-20.md)

상세: [main-content-dummy-seed-backend-request.md](./main-content-dummy-seed-backend-request.md).

## 3. 후원사 — 12 + Platform SVG

Admin mock 8건(Samsung…Hyundai + placeholder)을 **폐기**하고 Platform 마퀴 12개를 `SPONSOR_LOGO`로 올린다.

소스: [`apps/platform/src/features/corporate-donation/image/partner-logo-0N.svg`](../../../platform/src/features/corporate-donation/image/)

| display_order | company_name | 파일 |
|---------------|--------------|------|
| 1 | SAMSUNG | `partner-logo-01.svg` |
| 2 | citi | `partner-logo-02.svg` |
| 3 | IBM | `partner-logo-03.svg` |
| 4 | Google for Education | `partner-logo-04.svg` |
| 5 | KRAFTON | `partner-logo-05.svg` |
| 6 | lululemon | `partner-logo-06.svg` |
| 7 | 신한은행 | `partner-logo-07.svg` |
| 8 | KYOBO 교보생명 | `partner-logo-08.svg` |
| 9 | MetLife Foundation | `partner-logo-09.svg` |
| 10 | BNY | `partner-logo-10.svg` |
| 11 | KIC 한국투자공사 | `partner-logo-11.svg` |
| 12 | Standard Chartered Foundation | `partner-logo-12.svg` |

완료: `corporate_sponsor` count = **12**, 각 행 `logo_asset_id` NOT NULL.

상세: [sponsorship-corporate-sponsors-dummy-seed-backend-request.md](./sponsorship-corporate-sponsors-dummy-seed-backend-request.md).

## 4. 소셜 — Admin 실채널 URL 유지

Platform fallback은 generic 호스트 + 5번째 슬롯 `mailto:jakorea@jakorea.org`(Admin PK `NEWSLETTER`). 시드는 **Admin 실URL을 유지**한다. Platform 연동 후 remote가 overlay 된다.

| channel_code | external_url |
|--------------|--------------|
| INSTAGRAM | https://www.instagram.com/jakorea_official/ |
| FACEBOOK | https://www.facebook.com/jakorea/?locale=ko_KR |
| LINKEDIN | https://kr.linkedin.com/ |
| NAVER_BLOG | (기존 Admin 시드) |
| NEWSLETTER | https://stibee.com/ |
| YOUTUBE | https://youtube.com/user/jakorea2002 |

상세: [social-link-dummy-seed-backend-request.md](./social-link-dummy-seed-backend-request.md).

## 5. 띠배너 — Platform 2줄 카피·내부 링크

배경색 DB 필드 없음 → Platform CSS 토큰 유지. 활성 2건만 Platform 카피로 맞춘다. 비활성 3건은 테스트용 유지 가능.

| display_order | enabled | banner_text | link_url |
|---------------|---------|-------------|----------|
| 1 | true | 경제교육 봉사자 모집 중 | `https://www.jakorea.org/programs` (또는 path `/programs`) |
| 2 | true | 2026연차보고서가 발간되었습니다 ! | `https://www.jakorea.org/about/transparency/annual-reports` |

상세: [strip-banner-dummy-seed-backend-request.md](./strip-banner-dummy-seed-backend-request.md).

## 6. 팝업

Platform 홈 UI 없음. Admin mock 시드만 유지하고 `GET /api/public/main.popups`는 Platform이 **렌더하지 않는다**.

## 완료 후 확인

- [ ] Admin `/main/hero-banners` 3건 + 교실 이미지
- [ ] `/main/contents` YouTube = `watch?v=ts_hit5wXqg`
- [ ] `/sponsor/corporate/partners` 12 + 실 SVG
- [ ] `/main/strip-banners` 활성 2줄 문구가 Platform과 동일
- [ ] `GET /api/public/main` 후 Platform 홈이 fallback과 같은 카피·에셋으로 보임 (빈 필드가 없어야 함)
- [ ] `impact.featuredStory.imageUrl` HTTP 200. 홈 대표 스토리에 깨진 이미지/「이미지 없음」이 없음

**Last updated:** 2026-09-20
