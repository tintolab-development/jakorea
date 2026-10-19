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
| GET | `/api/portal/programs?featuredOnHome=true&size=8` | 홈 캐러셀. 옵션 A. `sort` 없음. 최대 8, 빈 배열 허용, mock 채우기 없음 |
| GET | `/api/portal/programs` | `/programs` 필터·페이징 (`size=10`) |
| GET | `/api/portal/programs/{programId}` | `/programs/{id}` 상세. 정수 id만. 없으면 404 |
| GET | `/api/portal/public/files/{fileObjectId}/content` | 썸네일 |
| GET | `/api/portal/public/files/{fileObjectId}/download` | 첨부 다운로드 |

로그아웃 시 이 캐시를 지우지 않는다.

## 목록 쿼리 (Platform → Portal)

| Platform | query |
|----------|-------|
| 홈 카드 | `featuredOnHome=true` `size=8` `page=0`. `sort` 생략. **모집 상태 필터 없음** (`recruitmentStatus` 미전송). 목록 행에 `featuredOnHome`·`homeDisplayOrder` 포함 |
| 탭 청소년·기관·강사 | `portalTab=YOUTH_YOUNG\|ORGANIZATION\|INSTRUCTOR` |
| Gemini 찾아가는 연수 | Portal `programType` SSOT = **`GEMINI_TRAINING`** (`GEMINI` alias 없음). 기관 모집만이면 `portalCategories=["ORGANIZATION"]` — 강사 탭 미노출이 정상 |
| 검색 | `keyword` |
| 모집 예정/중/완료 | `recruitmentStatus=UPCOMING\|OPEN\|CLOSED` |
| 모집대상·교육대상 | API `educationTargets` (`elementary`…`adult`). URL은 `recruitmentTarget` / `educationTarget` |
| 교육형태 | `educationMethod=ONLINE\|OFFLINE\|HYBRID\|PARTICIPANT_CHOICE` |
| 운영기간 | `operatingFrom` `operatingTo` |
| 최신/이름/마감임박 | `sort=LATEST\|NAME\|CLOSING_SOON` |
| 페이지 | `page` 0-base, 목록 `size=10` |

서버 별칭(목록 필터, 홈이 아님): `recruitmentStatus=SCHEDULED` → `UPCOMING`, `RECRUITING` → `OPEN`. `sort=DEADLINE` → `CLOSING_SOON`, `TITLE` → `NAME`. Platform 목록 UI는 정규 값만 보낸다.

목록 행 스키마는 OpenAPI `PortalProgramListItem` + `PageResponse`. `MemberPortalProgramSummary`는 교육현황 nested용이며 홈/목록 행이 아니다.

배지 표시는 `recruitmentStatus`만 본다. `periodStatus=SCHEDULED` 이고 `recruitmentStatus=OPEN` 이면 **모집 중**.

| 값 | 배지 |
|----|------|
| `OPEN` 또는 `RECRUITING` | 모집 중 |
| `UPCOMING` 또는 `SCHEDULED` | 모집 예정 |
| `CLOSED` | 모집 완료 |

## 홈 노출 (`featuredOnHome`) — BE 검증 (2026-10-19)

Platform 홈 캐러셀은 **API 필터가 아니라 데이터**로 건수가 결정된다. 로컬 예: `featuredOnHome=true` → `totalElements=1`, 일반 목록 `57`, `recruitmentStatus=OPEN` → `40`, `featuredOnHome=true&recruitmentStatus=OPEN` → `1` (AND).

| 항목 | SSOT |
|------|------|
| 저장 위치 | `program.featured_on_home`, `program.home_display_order` (**프로그램 단위**, 모집 행 컬럼 아님) |
| 목록 행 | 다중 모집 행은 동일 프로그램 플래그를 상속해 `recruitmentId`별 행으로 반환 |
| 홈 필터 | `featuredOnHome=true`만. `OPEN` / `UPCOMING` / `CLOSED` 모두 홈 대상 가능 |
| 정렬 (`sort` 생략) | `homeDisplayOrder ASC NULLS LAST` → `programId ASC` → `recruitmentId ASC` → `applicationType ASC` |
| 페이징 | 서버 `size` 최대 8. `totalElements`는 제한 전 전체 매칭 **모집 행** 수 |
| 제외 | 삭제·비공개 프로그램, 비공개·`INACTIVE` 모집 행. 별도 캐시 없음 (요청 시 DB 조회) |
| JABACK | `HomepageProgramQueryService`, `HomepageProgramController` (`GET /api/portal/programs`) |

**CMS 저장 (2026-10-19 BE):** `PATCH /api/admin/programs/{programId}` · `POST` create에 `featuredOnHome`, `homeDisplayOrder`. 생략=기존 유지, `featuredOnHome=false`면 순서 null, `clearFields`에 `homeDisplayOrder` 가능. 상세 GET `GET /api/admin/programs/{programId}`. CMS 공통정보에서 프로그램 단위로 저장한다.

## Fallback

| 상태 | 홈 카드 | 목록 | 상세 |
|------|---------|------|------|
| CMS 미설정 · 요청 실패 | 섹션 숨김. mock 금지 | 에러 문구. mock 금지 | 에러/없음. mock 금지 |
| 첫 응답 전 | 제목만, 카드 없음 | 로딩 문구 | 로딩 (not-found 플래시 없음) |
| 200 + 빈 목록 | 섹션 숨김 | 「등록된 프로그램이 없습니다」 | — |
| 숫자 id 404 · 비숫자 slug | — | — | 찾을 수 없음 |

`/programs/{id}/apply` 제출 API는 아직 시드 폼이다. 프로그램 헤더는 같은 상세 훅을 쓴다.

캐시: 목록·홈 Class C (`staleTime` 30s, `gcTime` 15m). 상세 Class D (2m / 15m). 재시도는 Platform `query-retry`.

BE 핸드오프: `docs/frontend/portal-platform-programs-home-list-frontend-handoff-2026-09-20.md` (JABACK).  
BE 요청 원문: [portal-platform-programs-backend-cursor-prompt-2026-09-20.md](../../../cms/docs/api/portal-platform-programs-backend-cursor-prompt-2026-09-20.md)

**Last updated:** 2026-10-19

Gemini Portal 노출 handoff: [gemini-portal-platform-visibility-backend-prompt-2026-09-30.md](./gemini-portal-platform-visibility-backend-prompt-2026-09-30.md) · BE FE handoff `JABACK/docs/frontend/gemini-portal-platform-visibility-frontend-handoff-2026-09-30.md`
