# 공지·FAQ 인라인 이미지 — `ownerId: null` upload-first 허용 요청

| 항목 | 값 |
|---|---|
| 작성일 | 2026-10-01 |
| 대상 | JABACK Admin Files (`POST /api/admin/files/upload-requests`) |
| 우선순위 | **P1** — CMS 공지 **신규 등록** 에디터 이미지 삽입이 400 |
| 관련 | 공지 첨부 upload-first (`NOTICE_ATTACHMENT` + `ownerId: null`) |
| FE | `apps/cms/src/shared/lib/admin-file-upload/inline-image.ts`, `notice-attachments.ts` |

아래는 **CMS 백엔드(JABACK)** 수정 요청이다. 프론트는 이미 첨부와 같은 payload를 보내고 있다.

---

## 1. 한 줄

`NOTICE_ATTACHMENT` 는 신규 공지에서 `ownerId: null` prepare 가 된다.  
`NOTICE_INLINE_IMAGE`(및 동형 `FAQ_INLINE_IMAGE`) 만 `ownerId` 필수로 거절한다.  
**첨부와 동일하게 인라인도 unbound prepare를 허용**하라.

---

## 2. 재현

공지사항 **신규 등록** 에디터에 PNG를 넣으면:

```http
POST /api/admin/files/upload-requests
```

```json
{
  "ownerDomain": "CONTENT",
  "ownerType": "NOTICE",
  "ownerId": null,
  "filePurpose": "NOTICE_INLINE_IMAGE",
  "originalFileName": "shot.png",
  "contentType": "image/png",
  "fileSize": 11798,
  "checksumSha256": "…"
}
```

현재 응답:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "field": "ownerId",
    "message": "필수 입력값이 누락되었습니다."
  }
}
```

대조:

| purpose | ownerId | 결과 |
|---|---|---|
| `NOTICE_ATTACHMENT` | `null` | **200** (신규 공지 첨부 upload-first) |
| `PROGRAM_INLINE_IMAGE` | `null` | **200** (모집양식 에디터) |
| `NOTICE_INLINE_IMAGE` | `null` | **400 `VALIDATION_FAILED` / field=ownerId** |
| `FAQ_INLINE_IMAGE` | `null` | 동일 거절로 추정 — 같이 맞춰라 |

임시 notice id·`0` 을 넣지 않는다. 첨부 계약과 같다.

---

## 3. 기대 계약

### prepare

`POST /api/admin/files/upload-requests`

- `ownerDomain=CONTENT`
- `ownerType=NOTICE` | `FAQ`
- `ownerId=null`
- `filePurpose=NOTICE_INLINE_IMAGE` | `FAQ_INLINE_IMAGE`

→ **200** + `fileObjectId` + presigned `uploadUrl`  
이후 S3 PUT → confirm → `CLEAN`+`AVAILABLE` 은 첨부·프로그램 인라인과 동일.

### 공지 생성 후 bind

`POST /api/admin/content/notices` 본문에 `/api/admin/files/{id}/content` 가 있고,  
이어서 (또는 생성 시 내부에서)

```http
PUT /api/admin/content/notices/{noticeId}/inline-images
{ "fileObjectIds": [ … ] }
```

이 unbound 인라인 id를 **claim** 해야 한다.  
claim 되면 `GET /api/portal/public/files/{id}/content` 가 공개 공지에서 열려야 한다.  
지금 unbound 인라인은 `PUBLIC_FILE_NOT_FOUND` 다.

FAQ: `PUT /api/admin/content/faqs/{faqId}/inline-images` 동일.

### GC

기존 인라인 orphan worker(`NOTICE_INLINE_IMAGE` + active `INLINE_IMAGE` 바인딩 없음)가  
**unbound 신규 업로드**를 즉시 지우지 않게 grace를 유지하라.  
첨부와 같이 claim 전 수 분~수 시간은 살아 있어야 한다.

---

## 4. Done when

- [ ] 위 payload `NOTICE_INLINE_IMAGE` + `ownerId: null` → **200**
- [ ] `FAQ_INLINE_IMAGE` + `ownerId: null` → **200**
- [ ] 가짜 ownerId(`0`, 없는 id) 로 우회하지 않음
- [ ] 공지 생성 + `PUT …/inline-images` 후 포털 `GET /api/portal/public/files/{id}/content` **302/200** (이미지)
- [ ] 기존 `NOTICE_ATTACHMENT` + `ownerId: null` 회귀 없음
- [ ] `PROGRAM_INLINE_IMAGE` + `ownerId: null` 회귀 없음

---

## 복사용 짧은 프롬프트

```
JABACK: 공지 첨부는 이미 NOTICE_ATTACHMENT + ownerId=null upload-first 가 된다.
NOTICE_INLINE_IMAGE 만 ownerId 필수라 CMS 공지 신규 등록 에디터 이미지 삽입이 400 VALIDATION_FAILED(field=ownerId) 다.

맞춰라:
1) POST /api/admin/files/upload-requests
   CONTENT/NOTICE/null + NOTICE_INLINE_IMAGE → 200
   CONTENT/FAQ/null + FAQ_INLINE_IMAGE → 200
   0이나 임시 id 쓰지 말 것.
2) POST 공지 후 PUT /api/admin/content/notices/{id}/inline-images 가 그 fileObjectId 를 claim.
3) claim 후 GET /api/portal/public/files/{id}/content 가 공개로 열릴 것.
4) NOTICE_ATTACHMENT·PROGRAM_INLINE_IMAGE 의 ownerId=null 은 깨지 말 것.
5) 인라인 orphan GC가 claim 전 파일을 바로 지우지 않게 grace 유지.

Verify:
- NOTICE_INLINE_IMAGE ownerId=null prepare 200
- FAQ_INLINE_IMAGE ownerId=null prepare 200
- 공지 생성+inline-images PUT 후 portal public content 302/200
```
