# Cursor prompt — 회원 포탈 안내사항 「신청 단위 첨부파일 목록」 API 추가 (JABACK)

> **Status (2026-10-07):** 요청. FE는 이 API를 먼저 호출하도록 이미 연동했다(실패 시 열어 본 게시글 첨부만 표시하는 폴백).  
> 상위 문서: `apps/platform/docs/api/mypage-education-notice-portal-gaps-backend-cursor-prompt-2026-10-06.md` 6번 항목을 단독 작업으로 분리한 것.

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 재현·요청에만** 답하라.

이 문서는 프론트 레포 경로:

`apps/platform/docs/api/mypage-education-notice-attachments-list-backend-cursor-prompt-2026-10-07.md`

관련 코드:

- `src/main/java/com/jakorea/cms/homepage/application/controller/HomepageProgramApplicationController.java` (`/me/program-applications/{applicationType}/{applicationId}/notices/**`)
- `src/main/java/com/jakorea/cms/homepage/application/service/MemberPortalNoticeService.java`
- `src/main/java/com/jakorea/cms/homepage/application/dto/MemberPortalEducationDtos.java` (`NoticeListItem`, `NoticeAttachment`)

---

## 증상

Platform `/mypage/education/INDIVIDUAL/1694631` 안내사항 탭.

- 게시글 「가나다」(postId `1693318`)에 첨부 1건이 있다(`NoticeListItem.attachmentCount = 1`).
- 우측 「파일명으로 검색해 보세요」 첨부 목록은 **「첨부된 파일이 없어요」**로 나온다.

원인: 회원 포탈에 첨부 목록을 주는 API가 없다. 첨부는 `GET .../notices/{postId}` 상세 응답의 `attachments[]`에만 있다. 그런데 상세 GET은 **읽음 처리**를 하므로, FE가 첨부를 얻으려고 모든 게시글 상세를 미리 부를 수 없다(안 읽은 글이 전부 읽음이 됨).

현재 `GET .../notices/attachments`를 호출하면 `/notices/{postId}`에 `postId="attachments"`로 매칭되어 4xx가 난다.

## 요청

### 엔드포인트

`GET /api/portal/me/program-applications/{applicationType}/{applicationId}/notices/attachments`

| 쿼리 | 기본 | 설명 |
|---|---|---|
| `keyword` | 없음 | `originalFileName` 부분 일치, 대소문자 무시 (FE는 현재 클라이언트 필터를 쓰므로 선택) |
| `page` | 0 | |
| `size` | 100 | FE는 `size=100` 한 번만 호출 |

### 응답 (envelope `data` 안)

```json
{
  "items": [
    {
      "postId": 1693318,
      "postTitle": "가나다",
      "attachmentId": 501,
      "fileObjectId": 9001,
      "originalFileName": "ChatGPT Image Sep 3, 2026, 04_34_30 PM.png",
      "fileSize": 2097152,
      "mimeType": "image/png",
      "createdAt": "2026-10-06T12:06:00Z",
      "downloadPath": "/api/portal/me/program-applications/INDIVIDUAL/1694631/notices/1693318/attachments/501/download"
    }
  ],
  "page": 0,
  "size": 100,
  "totalElements": 1,
  "totalPages": 1
}
```

FE 매핑: `attachmentId` → 행 id, `postId` → 「원문 보기」로 해당 게시글 팝업 열기, `originalFileName`·`fileSize`·`createdAt` → 행 표시, `downloadPath` → 다운로드 resolve(기존 `.../attachments/{attachmentId}/download`와 동일 경로).

### 규칙

1. **읽음 처리하지 않는다** (`program_post_read` 미기록, `read_count_cache`·`unread_count_cache` 불변).
2. 가시성·권한은 `GET .../notices` 목록과 **동일**하다. 같은 신청이 목록에서 볼 수 있는 게시글의 첨부만, 삭제된 게시글·첨부는 제외한다.
3. 정렬: 게시글 고정(`is_pinned`) 여부와 무관하게 첨부 `createdAt` desc, 같으면 `attachmentId` desc.
4. 라우팅: `/notices/attachments`(리터럴)가 `/notices/{postId}`보다 우선 매칭되는지 확인한다. 필요하면 `{postId:\\d+}` 제약을 추가한다.
5. N+1 금지 — 게시글·첨부·파일 객체를 한 번의 조회(또는 고정 횟수)로 가져온다.

### 함께 보강 (선택이지만 권장)

- 상세 `NoticeAttachment`에 `createdAt` 추가. 현재 없어서 FE가 게시글 작성일로 대체한다.

## 검증

```bash
TOKEN=<회원 accessToken>
BASE=http://localhost:8080/api/portal/me/program-applications/INDIVIDUAL/1694631

# 첨부 1건 이상, downloadPath 포함
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/notices/attachments" | jq '.data.items'

# 호출 전후 목록의 unread 가 바뀌지 않아야 한다
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/notices" | jq '[.data.items[] | {postId, unread}]'

# keyword
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/notices/attachments?keyword=chatgpt" | jq '.data.totalElements'

# 다른 회원 신청 id → 403/404
```

- `HomepageProgramMockMvcTest`에 케이스 추가: 첨부 목록 반환, 읽음 미처리, 타 신청 접근 차단, `/notices/attachments`가 상세로 매칭되지 않음.
- OpenAPI(`/v3/api-docs`) 스키마 반영.

## 완료 후

`JABACK/docs/frontend/`에 handoff를 남겨 달라(엔드포인트·필드·정렬·읽음 미처리 보장). FE 추가 작업은 없다. 응답이 오면 우측 목록이 전체 첨부로 바로 바뀐다.
