# Cursor prompt — 게시글 댓글·반응·읽음 작성자 표시명 필드 추가 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/program-post-actor-display-name-backend-cursor-prompt-2026-10-06.md`

> **긴급도: 중간 (화면 표시 품질).** 기능은 동작하지만 CMS 게시글 상세에서 작성자가 이름 대신
> `참여자 #190081`처럼 **역할 + actor ID**로 보인다. FE는 이름이 없을 때만 이 폴백을 쓰므로,
> 백엔드가 필드를 추가하면 FE 매핑 한 줄로 해결된다.

---

## 증상 (로컬, 2026-10-06 23:5x KST)

CMS 일반 프로그램 상세 → 진행 → 게시글 탭 → 게시글 상세 모달

- 재현 URL: `http://localhost:3000/programs/general?programId=186046&lnb=progress&tab=progress_posts&applicantId=1694631`
- 댓글 목록 작성자: `참여자 #190081` (2건) — 실제 회원 이름이어야 함
- 반응 사용자 팝오버·읽음 현황 팝오버도 같은 형식(`강사 #…`, `참여자 #…`)

원인: 아래 응답들이 **작성자 actor 유형과 ID만** 내려주고 표시명이 없다.
OpenAPI `backend.openapi.json`(2026-10-06 22:59 동기화본) 기준으로 확인했다.

| 스키마 | 현재 작성자 관련 필드 | 사용 엔드포인트 |
|---|---|---|
| `ProgramPostCommentResponse` | `createdByActorType`, `createdByActorId` | `GET /api/admin/programs/{programId}/posts/{postId}/comments` (및 상세의 comments) |
| `ProgramPostReactionResponse` | `actorType`, `actorId` | `GET /api/admin/programs/{programId}/posts/{postId}/reactions` |
| `ProgramPostReadResponse` (`readers[]`) | `readerActorType`, `readerActorId` | `GET /api/admin/programs/{programId}/posts/{postId}/reads` |
| `ProgramPostUnreadTargetResponse` (`unreadMembers[]`) | `memberId`, `targetRole` | 위와 동일 |
| `ProgramPostResponse` / `ProgramPostListItemResponse` | `createdByActorType`, `createdByActorId` | 게시글 상세 / 목록 |
| `NoticeComment` (Portal) | `authorType`, `authorId`, `mine` | `GET /api/portal/me/program-applications/{applicationType}/{applicationId}/notices/{postId}` |

---

## 요청

### ① 표시명 필드 추가 (additive, nullable)

기존 필드는 **그대로 두고** 아래 필드만 추가하라.

| 스키마 | 추가 필드 | 타입 |
|---|---|---|
| `ProgramPostCommentResponse` | `createdByDisplayName` | `string \| null` |
| `ProgramPostResponse` | `createdByDisplayName` | `string \| null` |
| `ProgramPostListItemResponse` | `createdByDisplayName` | `string \| null` |
| `ProgramPostReactionResponse` | `actorDisplayName` | `string \| null` |
| `ProgramPostReadResponse` | `readerDisplayName` | `string \| null` |
| `ProgramPostUnreadTargetResponse` | `displayName` | `string \| null` |
| `NoticeComment` (Portal) | `authorDisplayName` | `string \| null` |

### ② 표시명 결정 규칙

actor 유형별로 다음 값을 채운다. 조회 실패·탈퇴 회원이면 `null` (FE가 `역할 #ID` 폴백).

| actor 유형 | 표시명 |
|---|---|
| `MEMBER` / `STUDENT` / `INSTRUCTOR` / `VOLUNTEER` / `TEACHER` | 회원 이름 (`member.name`) |
| `SCHOOL` / `ORGANIZATION` | 기관명 (회원 이름이 아니라 기관 계정이면 기관명) |
| `ADMIN` / `CMS` / `SYSTEM` | 관리자 이름. 정책상 숨겨야 하면 `null` (FE가 `JA KOREA 알림`으로 표시) |

- **CMS 관리자 API(`/api/admin/**`)**: 실명 그대로 내려준다 (관리자 화면에서 이미 신청자 실명을 조회함).
- **Portal API(`/api/portal/me/**`)**: 다른 참여자 이름 노출 범위는 개인정보 정책을 따른다.
  정책이 없으면 **본인(`mine=true`)과 관리자만 실명**, 타 참여자는 마스킹(`김**`)으로 내려라.
  마스킹 여부를 정했으면 보고에 명시하라.

### ③ N+1 방지

댓글·반응·읽음 목록은 actor ID를 모아 **한 번에 조회**(IN 쿼리 또는 기존 회원 요약 조회 서비스)해서 채워라.
목록 건수만큼 회원 단건 조회를 반복하지 마라.

### ④ OpenAPI 반영

- 위 필드에 `description` 추가 (예: `작성자 표시명 — 회원 이름 또는 기관명. 조회 불가 시 null`)
- 각 응답 예시에 표시명 값 포함

---

## 하지 말 것

- 기존 `*ActorType` / `*ActorId` / `memberId` 필드 삭제·이름 변경 금지 (FE 폴백과 내 반응 판별에 사용 중)
- path·요청 스키마 변경 금지
- 표시명을 별도 API로 분리하지 말 것 (목록 응답에 포함)
- 게시글 외 다른 도메인의 회원 조회 로직 변경 금지

## 보고 형식

1. 변경 파일과 표시명을 채우는 위치 (서비스/매퍼)
2. ② actor 유형별 실제 매핑 결과, Portal 마스킹 적용 여부
3. 재현 데이터 확인: `programId=186046` 게시글 댓글 작성자 actor `190081`의 `createdByDisplayName` 값
4. 테스트 이름 (회원 이름 채움, 기관 actor → 기관명, 탈퇴/미존재 → `null`, 목록 조회 쿼리 수)
5. `docs/frontend` handoff (추가 필드 표 + null 규칙)

---

## FE 후속 작업 (참고, 백엔드 작업 아님)

- OpenAPI 재동기화 → orval 재생성
- `apps/cms/src/features/program/general/api/adapters/program-post-adapters.ts`의
  `resolvePostAuthorName` / `resolveActorDisplayName` 호출에 표시명 전달 (폴백 로직은 이미 있음)
- Platform 공지 댓글(`apps/platform/src/features/mypage/education/notices`)도 `authorDisplayName` 매핑
