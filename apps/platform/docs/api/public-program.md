# Platform 공개 프로그램 (CMS Portal / JABACK)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-09-20 |
| **백엔드** | CMS `:8080` (`VITE_API_SERVER`, JABACK) |
| **공개 API** | `GET /api/portal/programs` · `GET /api/portal/programs/{programId}` |
| **소비** | 홈 캐러셀 `useHomePortalPrograms` · `/programs` `usePortalProgramsList` · 상세 `useProgramDetail` |
| **홈 제목** | `GET /api/public/main` `education.title` 만 Homepage `:8081` |

프로그램 카드·목록·상세는 CMS Portal이다. Homepage `education.programs` 는 쓰지 않는다. 로그인 없이 호출한다 (`skipAuth`).

## 엔드포인트

| Method | Path | 화면 |
|--------|------|------|
| GET | `/api/portal/programs` | 홈 8건(`page=0&size=8&sort=LATEST`) · `/programs` 필터·페이징 |
| GET | `/api/portal/programs/{programId}` | `/programs/{id}` 상세. 정수 id만. |
| GET | `/api/portal/public/files/{fileObjectId}/content` | 썸네일 |
| GET | `/api/portal/public/files/{fileObjectId}/download` | 첨부 다운로드 |

로그아웃 시 이 캐시를 지우지 않는다.

## 목록 쿼리 (Platform → Portal)

| Platform | query |
|----------|-------|
| 탭 청소년·기관·강사 | `portalTab=YOUTH_YOUNG\|ORGANIZATION\|INSTRUCTOR` |
| 검색 | `keyword` |
| 모집 예정/중/완료 | `recruitmentStatus=UPCOMING\|OPEN\|CLOSED` |
| 모집대상·교육대상 | `recruitmentTarget` / `educationTarget` (`elementary`…`adult`) |
| 교육형태 | `educationMethod=ONLINE\|OFFLINE\|HYBRID\|PARTICIPANT_CHOICE` |
| 운영기간 | `operatingFrom` `operatingTo` |
| 최신/이름/마감임박 | `sort=LATEST\|NAME\|CLOSING_SOON` |
| 페이지 | `page` 0-base, 목록 `size=10` |

## Fallback

| 상태 | 홈 카드 | 목록 | 상세 |
|------|---------|------|------|
| CMS 미설정 · 요청 실패 | 섹션 숨김. mock 금지 | 에러 문구. mock 금지 | 에러/없음. mock 금지 |
| 첫 응답 전 | 제목만, 카드 없음 | 로딩 문구 | 로딩 (not-found 플래시 없음) |
| 200 + 빈 목록 | 섹션 숨김 | 「등록된 프로그램이 없습니다」 | — |
| 숫자 id 404 · 비숫자 slug | — | — | 찾을 수 없음 |

`/programs/{id}/apply` 제출 API는 아직 시드 폼이다. 프로그램 헤더는 같은 상세 훅을 쓴다.

캐시: 목록·홈 Class C (`staleTime` 30s, `gcTime` 15m). 상세 Class D (2m / 15m). 재시도는 Platform `query-retry`.

백엔드 갭(홈 고정 8건 선정, OpenAPI 목록 스키마, `SCHEDULED` 별칭):  
[portal-platform-programs-backend-cursor-prompt-2026-09-20.md](../../../cms/docs/api/portal-platform-programs-backend-cursor-prompt-2026-09-20.md)

**Last updated:** 2026-09-20
