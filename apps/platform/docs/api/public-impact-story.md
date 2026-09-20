# Platform 임팩트 스토리 공개 API

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-09-20 |
| **공개 API** | `GET /api/public/impact-story/categories` · `…/stories` · `…/stories/{id}` |
| **홈 대표 1건** | `GET /api/public/main` `impact.featuredStory` |
| **소비** | `apps/platform` `useImpactStoriesList` / `useImpactStoryDetail` / `useFeaturedImpactStories` / `useHomeImpactSubStories` |
| **Fallback** | Platform mock 18건 [`features/impact-story/lib/mock-stories.ts`](../../src/features/impact-story/lib/mock-stories.ts) |
| **BE 시드** | [impact-story-platform-seed-backend-cursor-prompt-2026-09-20.md](../../../admin/docs/api/impact-story-platform-seed-backend-cursor-prompt-2026-09-20.md) |

## 엔드포인트

| Method | Path | Query | 화면 |
|--------|------|-------|------|
| GET | `/api/public/impact-story/categories` | — | 탭 라벨 (`name` 5종) |
| GET | `/api/public/impact-story/stories` | `categoryId`, **`q`**(제목 contains), `page`(0-based), `size=9` | `/impact` 그리드 |
| GET | `/api/public/impact-story/stories` | `page=0`, `size=20` | 캐러셀(pinned 3) · 홈 서브카드 3 · 상세 인접글 |
| GET | `/api/public/impact-story/stories/{id}` | — | `/impact/{id}` 본문 `body` |
| GET | `/api/public/main` | — | 홈 히어로 1건 + YouTube |

인증 없음. `skipAuth`. 로그인 세션과 무관. 로그아웃 시 이 캐시를 지우지 않는다.

`q` 는 백엔드 시드 프롬프트에 포함. 서버가 무시해도 Platform은 preview(`size=20`)에서 제목·요약 contains 로 클라이언트 필터한다. 시드 18건은 한 페이지에 들어간다.

## Fallback

| 상태 | 목록 / 캐러셀 / 서브카드 | 상세 |
|------|------|------|
| Homepage API 미설정 · 요청 실패 | mock 18건 (slug id `impact-1` …) | mock 상세 |
| 첫 응답 전 | 빈 목록 + 로딩 문구 | 로딩 |
| 응답 성공 + `[]` | 빈 목록. mock 되살림 금지 | — |
| 응답 성공 + 값 | 숫자 id로 매핑 | `body` → `RichTextViewer` |
| 상세 404 · 비숫자 경로 | — | 찾을 수 없음. 단 홈 fallback slug는 mock 상세 |

홈 히어로 커버는 public main 스칼라 오버레이. `featuredStory.imageUrl` 이 비었거나 `impact-story-placeholder` 이면 로컬 `card-minjae.png`.

캐시: 카테고리 Class B (15–30m), 목록/preview Class C (30s), 상세 Class D (2m). 재시도는 Platform `query-retry`(4xx 제외).

**Last updated:** 2026-09-20
