# Cursor prompt — 게시글 상세 `ProgramPostResponse` 스키마명 충돌 정리 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/program-post-detail-response-schema-collision-backend-cursor-prompt-2026-10-06.md`

> **긴급도: 중간 (계약 불일치).** FE는 2026-10-06에 `postId ?? id`를 모두 받도록 임시 대응해서 화면은 정상이다.
> 이 작업은 OpenAPI 문서가 실제 응답과 다른 문제를 없애기 위한 것이다. 다른 화면에서 같은 함정이 반복될 수 있다.

---

## 증상 (로컬, 2026-10-06 23:1x KST)

CMS 프로그램 186046 → 게시글 1693318 상세 모달에서 조회수는 `1`인데, 읽음 현황 팝오버가 `읽음(0)` / `안읽음(0)`, 「표시할 인원이 없습니다」로 나왔다.

`GET /api/admin/programs/186046/posts/1693318/reads`는 정상이다:

```json
{"programId":186046,"postId":1693318,
 "readers":[{"readId":59,"readerActorType":"ADMIN","readerActorId":162001, "...": "..."}],
 "unreadMembers":[],"unreadCount":0}
```

원인은 상세 응답의 게시글 식별자 필드명이다.

| 구분 | `post` 식별자 필드 |
|---|---|
| 런타임 `GET /api/admin/programs/{programId}/posts/{postId}` 응답 | `post.postId` |
| 런타임 Swagger `/v3/api-docs` → `ProgramPostDetailResponse.post` → `#/components/schemas/ProgramPostResponse` | `id` |
| 정적 `openapi/backend.openapi.json` `ProgramPostResponse` | `postId` (런타임 Swagger와도 다름) |

FE codegen은 Swagger 기준(`id`)으로 타입을 만들었고, `post.id`가 비어 게시글 id가 `''`가 되어 읽음 조회가 실행되지 않았다.

## 원인 (백엔드)

같은 simple name의 record가 두 개 있다. springdoc이 스키마명을 클래스 simple name으로 만들기 때문에 하나가 다른 하나를 덮는다.

| 클래스 | 식별자 필드 | 사용처 |
|---|---|---|
| `com.jakorea.cms.board.dto.ProgramPostResponse` | `Long id` | (확인 필요) |
| `com.jakorea.cms.adminapi.dto.ProgramBoardResponses.ProgramPostResponse` | `Long postId` | `ProgramPostDetailResponse.post` (관리자 게시글 상세) |

---

## 요청

### ① 런타임 응답은 **현행 유지**

관리자 게시글 상세의 `post.postId`는 바꾸지 마라. 목록 `ProgramPostListItemResponse.postId`와 같은 이름이고, FE가 이미 처리한다.
**필드명 변경(`postId` → `id`)·응답 구조 변경 금지.**

### ② 스키마명 충돌 해소

두 record가 OpenAPI에서 **서로 다른 스키마명**으로 나오게 하라. 방법은 둘 중 하나:

- `@Schema(name = "AdminProgramPostResponse")`처럼 한쪽(또는 양쪽)에 명시 이름 부여
- 또는 한쪽 record를 다른 이름으로 rename

결과적으로 `/v3/api-docs`에서 `ProgramPostDetailResponse.post`가 가리키는 스키마의 식별자 필드가 **`postId`**여야 한다.
`board.dto.ProgramPostResponse`(`id`)를 쓰는 엔드포인트가 있다면 그 엔드포인트의 `$ref`도 해당 스키마를 정확히 가리키는지 확인하라.

### ③ 정적 `openapi/backend.openapi.json` 동기화

런타임 Swagger와 같은 스키마명·필드로 맞춰라.

### ④ 회귀 테스트

- 관리자 게시글 상세 응답 JSON에 `post.postId`가 있고 `post.id`가 없음을 검증 (MockMvc)
- `/v3/api-docs`에서 `ProgramPostDetailResponse.post`의 `$ref` 대상 스키마에 `postId` property가 있음을 검증 (가능하면)

---

## 하지 말 것

- 런타임 응답 필드명·구조 변경 금지 (`postId` 유지)
- 게시글 외 다른 도메인 DTO rename 금지
- `/reads` 응답 변경 금지 (정상)

## 보고 형식

1. 변경 파일과 최종 스키마명 (`board.dto` 쪽 / `ProgramBoardResponses` 쪽)
2. `board.dto.ProgramPostResponse` 사용 엔드포인트 목록
3. 테스트 이름
4. `docs/frontend` handoff (바뀐 스키마명 + FE codegen 재생성 필요 여부)
