# Cursor prompt — 게시글 반응 `reactionType` 허용값·정규화 계약 정리 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/program-post-reaction-type-contract-backend-cursor-prompt-2026-10-06.md`

> **긴급도: 낮음 (계약 정리).** FE는 2026-10-06에 대소문자·`_`·`-`를 무시하고 비교하도록 고쳐서 화면은 이미 정상이다.
> 이 작업은 같은 불일치가 다시 생기지 않도록 **허용값을 명시**하기 위한 것이다.

---

## 증상 (로컬, 2026-10-06 22:5x KST)

CMS 프로그램 상세 → 게시글 상세 모달에서 반응 아이콘 수는 `2`로 보이는데, 반응 사용자 팝오버의 **헤더 집계와 사용자 목록이 모두 비어 있었다**.

원인:

| 단계 | 값 |
|------|----|
| FE 전송 (`PUT /api/admin/programs/{programId}/posts/{postId}/reaction`) | `{ "reactionType": "loveFace" }` (camelCase) |
| `ProgramPostInteractionService.normalizeReaction` | `trim → toUpperCase → '-'/' ' → '_'` |
| DB 저장 / `GET .../reactions` 응답 | `"LOVEFACE"`, `"SMILE"`, `"THUMBSUP"` |
| FE 카탈로그 키 | `smile`, `loveFace`, `thumbsUp` … (정확 일치 조회 → 매칭 실패) |

추가로 OpenAPI `POST /api/admin/program-posts/{postId}/reactions` 예시가 `"reactionType": "LIKE"`인데, `LIKE`는 FE 11종 카탈로그 어디에도 없다.

---

## FE 반응 카탈로그 (고정 11종, 순서 = 이모지 바 순서)

| FE 키 (전송값) | 현재 백엔드 저장값 |
|---|---|
| `smile` | `SMILE` |
| `laugh` | `LAUGH` |
| `loveFace` | `LOVEFACE` |
| `surprised` | `SURPRISED` |
| `cry` | `CRY` |
| `angry` | `ANGRY` |
| `scream` | `SCREAM` |
| `heart` | `HEART` |
| `clap` | `CLAP` |
| `thumbsUp` | `THUMBSUP` |
| `check` | `CHECK` |

---

## 요청

### ① 저장·응답 형식은 **현행 유지**

`normalizeReaction`의 정규화 결과(대문자, 위 표 오른쪽 열)를 그대로 정식 값으로 인정한다.
**기존 데이터 마이그레이션·응답 형식 변경 금지.** (FE가 이미 이 형식을 처리함)

### ② 허용값 allowlist 검증 추가

`normalizeReaction`에서 정규식(`[A-Z0-9_]{1,40}`) 통과 후, 위 11종이 **아닌** 값은 `400`(`reactionType is not supported.`)으로 거절하라.
적용 대상 (모두 같은 정규화 함수를 거치는지 확인):

- `PUT /api/admin/programs/{programId}/posts/{postId}/reaction`
- `POST /api/admin/program-posts/{postId}/reactions`
- `PUT /api/me/program-applications/{applicationType}/{applicationId}/notices/{postId}/reactions`
- `DELETE /api/me/program-applications/{applicationType}/{applicationId}/notices/{postId}/reactions/{reactionType}`

> 입력은 계속 대소문자·구분자 무관하게 받는다 (`loveFace`, `LOVE_FACE`, `loveface` → 모두 `LOVEFACE`).
> 즉 정규화 시 `_`도 제거해 비교하거나, 11종을 `_` 없는 형태로 고정하라. **저장값은 위 표 오른쪽 열과 동일해야 한다.**

### ③ OpenAPI 정리

- `ProgramPostReactionRequest`, `PostReactionUpsertRequest`, `NoticeReactionRequest`의 `reactionType`에 `enum`(위 11종 대문자) 또는 `description`으로 허용값 명시
- 응답 `ProgramPostReactionSummaryResponse` / `ProgramPostReactionResponse` / `NoticeReactionSummary`의 `reactionType`에도 같은 설명
- 예시 `"LIKE"` → `"SMILE"` 등 실제 허용값으로 교체

### ④ 기존 데이터 확인 (읽기 전용)

`program_post_reaction.reaction_type`의 `DISTINCT` 값과 건수를 보고하라.
11종 밖의 값(`LIKE` 등)이 있으면 **삭제·변환하지 말고** 목록만 보고하라. FE와 매핑 정책을 따로 정한다.

---

## 하지 말 것

- 저장값을 camelCase로 바꾸거나 기존 행 일괄 변환 금지
- 응답 스키마 필드 추가·삭제·path 변경 금지
- 댓글/게시글 외 다른 도메인의 정규화 로직 변경 금지

## 보고 형식

1. 변경 파일과 allowlist 위치
2. ④ `DISTINCT reaction_type` 결과
3. 테스트 이름 (허용값 통과, `loveFace`/`LOVE_FACE` → `LOVEFACE`, `LIKE` → 400)
4. `docs/frontend` handoff (허용 11종 대문자 표 + 400 메시지)
