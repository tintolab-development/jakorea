# Cursor prompt — 회원 포탈 안내사항 「반응한 사람」 목록 추가 (JABACK)

> **Status (2026-10-07):** 요청. FE는 `reactors[]`를 받으면 바로 쓰도록 연동해 두었다. 필드가 없으면 「내 반응」 한 줄만 보여 준다.

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.
프론트 레포를 탐색하지 말고, **이 문서의 요청에만** 답하라.

## 배경

Platform 마이페이지 교육 안내사항 상세 팝업에서 반응 수를 누르면 **누가 어떤 이모지를 눌렀는지** 목록이 보여야 한다(Figma: 이모지별 개수 헤더 + `이모지 · 이름` 행 목록).

현재 회원 포탈 반응 API는 종류별 개수(`summary`)와 내 반응(`myReactions`)만 준다.

- `GET /api/portal/me/program-applications/{applicationType}/{applicationId}/notices/{postId}/reactions` → `NoticeReactionListResponse { programId, postId, summary[], myReactions[] }`
- `PUT .../reactions`, `DELETE .../reactions/{reactionType}` → `NoticeReactionMutationResponse { ..., summary[], myReactions[], processedAt }`

그래서 회원이 반응을 바꾸면(1인 1반응이라 기존 반응을 지우고 새 반응 등록) 총 개수가 그대로여서 화면에 변화가 없어 보인다. 2026-10-07 로컬 재현(회원 190081, post 1693321)에서 SCREAM → HEART 교체 시 PUT/DELETE 모두 200, 총 2개 유지.

## 요청

위 세 응답(`NoticeReactionListResponse`, `NoticeReactionMutationResponse`)에 `reactors` 배열을 **추가**한다. 기존 필드·path·요청 스키마는 바꾸지 않는다.

```json
"reactors": [
  {
    "reactionType": "HEART",
    "actorType": "MEMBER",
    "actorId": 190081,
    "actorDisplayName": "이건희일반",
    "mine": true,
    "reactedAt": "2026-10-06T16:01:09Z"
  },
  {
    "reactionType": "CLAP",
    "actorType": "ADMIN",
    "actorId": 162001,
    "actorDisplayName": null,
    "mine": false,
    "reactedAt": "2026-10-06T15:56:27Z"
  }
]
```

| 필드 | 타입 | 규칙 |
|---|---|---|
| `reactionType` | string | `summary`와 같은 정규화 값(SMILE, HEART …) |
| `actorType` | string | `program_post_reaction.actor_type` (`MEMBER` / `ADMIN`) |
| `actorId` | number | `actor_id` |
| `actorDisplayName` | string \| null | **댓글 `NoticeComment.authorDisplayName`과 같은 규칙**: 본인 실명, 다른 회원은 `PrivacyMaskingSupport.maskName`, 관리자·탈퇴·삭제·미존재는 `null` |
| `mine` | boolean | 현재 회원의 반응인지 |
| `reactedAt` | string(ISO) | 반응 시각 (`created_at` 또는 마지막 변경 시각) |

- 정렬: `reactedAt` 내림차순(최근 먼저).
- 키는 항상 내려준다(빈 배열 가능). 이름 조회는 한 번에 묶어 N+1을 피한다.
- 정적 `openapi/backend.openapi.json`과 런타임 Swagger에 스키마를 반영한다.

## 수용 기준

1. 회원 190081 / `INDIVIDUAL` 1694631 / post 1693321에서 GET `.../reactions` 응답에 `reactors`가 있고 `summary` 합계와 행 수가 같다.
2. PUT·DELETE 응답의 `reactors`가 변경 후 상태를 반영한다.
3. 다른 회원 이름은 마스킹, 관리자는 `actorDisplayName: null`.
4. 기존 FE는 모르는 키를 무시하므로 하위 호환이 깨지지 않는다.

## 보고 형식

- 변경 파일 목록, 응답 예시(JSON), 실행한 테스트와 결과.
- FE handoff 문서 경로(`docs/frontend/...`).
