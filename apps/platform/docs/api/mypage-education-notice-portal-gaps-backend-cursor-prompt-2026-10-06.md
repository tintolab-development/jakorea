# Cursor prompt — 회원 포탈 안내사항(게시글) 미구현 필드·API 보강 (JABACK)

> **Status (2026-10-06):** 요청. FE는 현재 응답만으로 연동 완료(댓글 CRUD·반응 토글·첨부 다운로드·`?noticeId=` 팝업). 아래 항목은 시안 대비 비어 있는 값이다.

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 재현·요청에만** 답하라.

이 문서는 프론트 레포 경로:

`apps/platform/docs/api/mypage-education-notice-portal-gaps-backend-cursor-prompt-2026-10-06.md`

관련 코드:

- `src/main/java/com/jakorea/cms/homepage/application/controller/HomepageProgramApplicationController.java` (`/me/program-applications/{type}/{id}/notices/**`)
- `src/main/java/com/jakorea/cms/homepage/application/dto/MemberPortalEducationDtos.java` (`NoticeListItem`, `NoticeDetailResponse`, `NoticeAttachment`, `NoticeComment`, `NoticeReactionListResponse`)
- `src/main/java/com/jakorea/cms/provider/runtime/LocalObjectStorageProvider.java` (`createDownloadUrl`)
- `src/main/java/com/jakorea/cms/provider/runtime/LocalObjectStorageRawController.java`
- 참고(CMS 동일 도메인): `src/main/java/com/jakorea/cms/adminapi/dto/ProgramBoardResponses.java` — `readCount`, `reactionCount`, 반응 `items[]` 이미 노출

화면: Platform `/mypage/education/INDIVIDUAL/1694631` 안내사항 탭 → 게시글 상세 팝업  
시안: 작성자 `박재희 담당교사님` · 조회수(👀 12) · 댓글 수 · 반응 수 · 댓글 작성자 이름(`김민수`, `이민희`) · 반응 팝오버(이모지별 수 + 반응한 사람 이름) · 우측 첨부파일 목록(파일명 검색)

DB에는 필요한 원천 데이터가 이미 있다 — `program_post.created_by_actor_*`, `program_post.read_count_cache`, `program_post_comment.created_by_actor_*`, `program_post_reaction.actor_*`. **포탈 DTO에만 빠져 있다.**

---

## 1. (P0) 회원 첨부 다운로드 서명 URL이 admin 경로로 발급됨

### 재현

1. 회원 Bearer로 `GET /api/portal/me/program-applications/INDIVIDUAL/1694631/notices/{postId}/attachments/{attachmentId}/download`
2. 응답 `downloadUrl`:

```
/api/admin/files/downloads/raw/b64.dGVzdC9zZW5zaXRpdmUvcHJvZ3JhbV9jb250ZW50LzIwMjYvMTAvMDYvcHJvZ3JhbV9wb3N0LTE2OTMzMTgvZmlsZS1lMmM3YmZkYy1mMGZjLTRiZDEtOGE1Mi1iYTZmMWQ3MjE5ZjAucG5n?expires=1791298646&signature=eb32…
```

3. 홈페이지 origin(`localhost:5173`)에서 호출 → **401**

```json
{ "code": "UNAUTHORIZED", "message": "Authentication is required.", "traceId": "a98ed25e-ab10-4022-994e-26f466ab088d" }
```

- 같은 URL을 `localhost:8080`에 직접 호출하면 200(PNG). 401은 홈페이지 게이트웨이가 `/api/admin/**`를 CMS로 보내지 않아서 난다(로컬: Vite가 `/api/portal`·`/api/auth`만 8080, 나머지 `/api`는 홈페이지 어드민 백엔드 8081).
- `/api/portal/public/files/downloads/raw/{same}`로 바꾸면 **403** — 서명이 버킷(`INTERNAL` vs `PUBLIC`)에 묶여 있다.
- FE는 로컬 임시 우회로 Vite에 `/api/admin/files/downloads/raw` → 8080 프록시를 추가했다. 배포 홈페이지 도메인에서 `LOCAL_SIGNED_URL` provider를 쓰는 환경(dev/stage)이 있으면 같은 문제가 난다.

### 요청

회원 포탈 resolve(`noticeAttachmentDownload` 등 `/api/portal/me/**/download`)가 돌려주는 `downloadUrl`은 **홈페이지 origin에서 인증 없이 열리는 portal 네임스페이스 경로**여야 한다.

- 권장: `GET /api/portal/files/downloads/raw/{encodedObjectName}?expires&signature` 추가(INTERNAL 버킷 서명 검증, 공개 매처 등록) + 포탈 resolve 시 이 base로 URL 생성.
- S3 provider는 현행 유지(외부 서명 URL).
- `requiredHeaders`가 비어 있음을 유지하거나, 필요 시 문서화.

---

## 2. 게시글 작성자 표시 — 목록·상세

`NoticeListItem`, `NoticeDetailResponse`에 추가:

| 필드 | 타입 | 설명 |
|---|---|---|
| `authorType` | string | `ADMIN` / `MEMBER` 등 (`created_by_actor_type`) |
| `authorName` | string \| null | 작성자 표시 이름 |
| `authorRoleLabel` | string \| null | 시안 `담당교사` 등 직함. 없으면 null |

FE 표시: `authorRoleLabel` 있으면 `{authorName} {authorRoleLabel}님`, 없으면 `authorName`, 둘 다 없으면 `안내`(현행).  
직함 산출 규칙(관리자 역할명 / 기관 담당자 / 교사)은 BE가 정해 handoff에 적어 달라.

---

## 3. 조회수·반응 수 — 목록·상세

`NoticeListItem`, `NoticeDetailResponse`에 추가 (CMS `ProgramPostListItemResponse`와 같은 이름):

| 필드 | 타입 | 원천 |
|---|---|---|
| `readCount` | int | `program_post.read_count_cache` |
| `reactionCount` | int | 반응 총합 |

현재 목록 카드는 조회수·반응 수를 0으로 표시한다. 반응 수를 목록에서 보려면 게시글마다 `/reactions`를 N회 호출해야 해서 쓰지 않는다.

---

## 4. 댓글 작성자 이름

`NoticeComment`에 추가:

| 필드 | 타입 | 설명 |
|---|---|---|
| `authorName` | string \| null | 표시 이름 (관리자=관리자명/직함, 회원=회원명) |

현재 FE는 `mine`이면 로그인 회원명, 아니면 `관리자`/`회원` 고정 문구로 대체 중.  
같은 프로그램 다른 회원 이름의 노출·마스킹 정책(예: `김*수`)은 BE에서 결정해 handoff에 명시.

---

## 5. 반응한 사람 목록

`GET .../notices/{postId}/reactions` 응답(`NoticeReactionListResponse`)에 CMS와 같은 `items[]` 추가:

```json
{
  "postId": 1693318,
  "summary": [{ "reactionType": "SMILE", "count": 10 }],
  "myReactions": ["SMILE"],
  "items": [
    { "reactionType": "SMILE", "authorName": "김민수", "mine": false, "reactedAt": "2026-10-06T05:00:00Z" }
  ]
}
```

- 정렬: `reactedAt` desc.
- 이름 노출 정책은 4번과 동일.
- PUT/DELETE 응답(`NoticeReactionMutationResponse`)에도 같은 `items[]`를 넣어 주면 FE가 재조회 없이 캐시 갱신 가능(선택).

---

## 6. 신청 단위 첨부파일 목록 (우측 패널)

> 단독 작업 문서로 분리: `apps/platform/docs/api/mypage-education-notice-attachments-list-backend-cursor-prompt-2026-10-07.md` (FE 선연동 완료)

시안 우측 패널은 해당 신청에서 볼 수 있는 **모든 안내사항의 첨부**를 파일명 검색과 함께 보여준다. 지금은 상세 응답의 `attachments`밖에 없어서 **열어 본 게시글의 첨부만** 표시된다. 상세를 일괄 조회하면 읽음 처리가 되어 쓸 수 없다.

### 요청

`GET /api/portal/me/program-applications/{applicationType}/{applicationId}/notices/attachments?keyword=&page=0&size=100`

```json
{
  "items": [
    {
      "postId": 1693318,
      "postTitle": "가나다",
      "attachmentId": 501,
      "fileObjectId": 9001,
      "originalFileName": "안내문.pdf",
      "fileSize": 102400,
      "mimeType": "application/pdf",
      "createdAt": "2026-10-06T05:00:00Z",
      "downloadPath": "/api/portal/me/program-applications/INDIVIDUAL/1694631/notices/1693318/attachments/501/download"
    }
  ],
  "page": 0, "size": 100, "totalElements": 1, "totalPages": 1
}
```

- **읽음 처리하지 않는다.**
- 가시성은 목록 API와 동일(해당 신청이 볼 수 있는 게시글만).
- `keyword`: `originalFileName` 부분 일치, 대소문자 무시.
- 정렬: `createdAt` desc.

또한 `NoticeAttachment`(상세 `attachments[]`)에 `createdAt` 추가 — 현재 없어서 FE가 게시글 작성일로 대체 중.

---

## 검증

```bash
TOKEN=<회원 accessToken>
BASE=http://localhost:8080/api/portal/me/program-applications/INDIVIDUAL/1694631

curl -s -H "Authorization: Bearer $TOKEN" "$BASE/notices" | jq '.data.items[0] | {authorName, authorRoleLabel, readCount, reactionCount}'
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/notices/{postId}" | jq '.data | {authorName, readCount, reactionCount, comments: [.comments[] | {authorName, mine}], attachments: [.attachments[] | {createdAt}]}'
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/notices/{postId}/reactions" | jq '.data.items'
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/notices/attachments?keyword=pdf" | jq '.data.items | length'

# 1번: resolve 결과 URL이 /api/portal/ 로 시작하고, 홈페이지 origin(5173)에서 인증 없이 200
URL=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE/notices/{postId}/attachments/{attachmentId}/download" | jq -r '.data.downloadUrl')
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5173$URL"
```

- 기존 MockMvc(`HomepageProgramMockMvcTest`) 안내사항 케이스에 위 필드 assertion 추가.
- OpenAPI(`/v3/api-docs`) 스키마 갱신.

## 완료 후

`JABACK/docs/frontend/`에 handoff(필드 목록·이름 노출 정책·직함 규칙·첨부 목록 엔드포인트)를 남겨 달라. FE는 handoff 기준으로 `activity-client.ts` / `activity-hooks.ts` 매핑과 패널 파일 목록을 교체한다.
