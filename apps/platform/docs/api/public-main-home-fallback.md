# Platform 홈 ↔ public main 연동 계약

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-09-20 |
| **공개 API** | `GET /api/public/main` (로컬: JAHOMEADMINBACK `:8081`) |
| **로그인** | `/api/portal/**` → CMS `:8080` |
| **소비** | `apps/platform` `useHomeMain` |
| **Fallback SSOT** | [`features/home/lib/mock.ts`](../../src/features/home/lib/mock.ts) + [`lib/fallback.ts`](../../src/features/home/lib/fallback.ts) |

## Fallback 규율

| 상태 | 0 가능 목록 (`stripBanners` · `heroes` · `sponsors` · `socialLinks` · `popups`) | 스칼라 (제목·유튜브·CTA·실적) |
|------|------|------|
| 미호출 · 요청 실패 (`source: 'fallback'`) | 로컬 mock | 로컬 mock |
| 첫 응답 전 (`source: 'pending'`) | **빈 목록** (mock 띠배너를 먼저 띄우지 않음) | 로컬 mock으로 레이아웃 유지 |
| 응답 성공 + `[]` 또는 필드 생략 (`source: 'remote'`) | **빈 목록. mock 되살림 금지** | 빈 문자열이면 필드만 mock |
| 응답 성공 + 값 있음 | 매핑해서 노출 (기간 만료 행은 제외) | 덮어씀 |

- 빈 객체 `{}`도 네트워크상 remote다. 목록은 비우고, 스칼라만 fallback이다.
- 프로그램 카드는 CMS `GET /api/portal/programs?page=0&size=8&sort=LATEST` (`:8080`) 를 쓴다. Homepage `education.programs` 는 매핑하지 않는다. 요청 실패·빈 배열이면 섹션을 숨기고 mock 카탈로그를 되살리지 않는다. 계약: [public-program.md](./public-program.md).
- 홈 섹션 제목만 public main `education.title` 이다.
- `/programs` 목록·상세도 같은 Portal API. slug mock id는 쓰지 않는다.
- 임팩트 스토리 서브카드 3건은 `GET /api/public/impact-story/stories` (`useHomeImpactSubStories`). 실패 시에만 impact-story mock. 대표 1건은 public main `featuredStory`. 계약: [public-impact-story.md](./public-impact-story.md).
- `featuredStory.imageUrl` 이 비었거나 `impact-story-placeholder` 파일명이면 로컬 `card-minjae.png` 를 쓴다. 원격 URL이 404여도 `<img onError>` 가 같은 PNG로 바꾼다. 목록 `[]` 과는 달리 스칼라 오버레이다.
- `popups[]`는 계약에 포함되나 홈 UI가 없어 **무시**한다. 셸 순서는 [home-shell-integration-order.md](./home-shell-integration-order.md).
- 띠배너 배경색은 public 스키마에 없다. 노출되는 행만 FE `FALLBACK_STRIP_COLORS`를 쓴다.
- `jakorea.org` 호스트 URL은 내부 path로 정규화한다 (`lib/href.ts`).
- 띠배너 `displayStartDate`/`displayEndDate`가 오면 FE가 로컬 시각으로 한 번 더 걸러, 캐시가 남아 있어도 만료분을 숨긴다. 필드가 없으면 서버 필터를 신뢰한다.
- 홈이 열려 있는 동안 `GET /api/public/main` 을 1분마다 재조회한다(백그라운드 탭 제외). 로그아웃은 공개 홈 캐시를 지우지 않는다. 공개 홈 요청은 8초 타임아웃·재시도 1회.

BE 시드 값(히어로 3 / YouTube / 후원사 12 SVG)은 Admin [platform-home-public-main-seed-backend-request.md](../../../admin/docs/api/platform-home-public-main-seed-backend-request.md).  
공개 띠배너·팝업 기간 필드: [platform-home-public-main-period-backend-cursor-prompt-2026-09-20.md](../../../admin/docs/api/platform-home-public-main-period-backend-cursor-prompt-2026-09-20.md).

**Last updated:** 2026-09-20
