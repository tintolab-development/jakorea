# 게시글 관리 — 백엔드 갭 요청

CMS LNB **게시글 관리** 3화면(공지·FAQ·문의)의 OpenAPI v9 대조 결과입니다.

- 프론트 연동 명세: [posts-api-integration.md](./posts-api-integration.md)
- 더미 시드: [posts-dummy-seed-backend-request.md](./posts-dummy-seed-backend-request.md)
- 시드 Cursor 프롬프트 (G1–G4 포함): [posts-dummy-seed-backend-cursor-prompt.md](./posts-dummy-seed-backend-cursor-prompt.md)

**작성일**: 2026-08-26  
**OpenAPI**: `apps/cms/openapi/posts.openapi.json`

프론트는 목록 CRUD를 이미 호출합니다. 아래는 **스펙에 없는 API**, **있는 API의 계약 구멍**입니다.

G1–G4는 시드 검증에 필요합니다. 시드 프롬프트를 이미 실행했다면 이 블록은 건너뛰세요.  
G5–G8은 기획 노란 강조 / FE 후속 연동입니다. **OpenAPI만 먼저** 추가해도 됩니다.

---

## 현재 OpenAPI vs FE

### 공지 (`/admin/posts/notices`)

| Method           | Path                                                | FE                               |
| ---------------- | --------------------------------------------------- | -------------------------------- |
| GET/POST         | `/api/admin/content/notices`                        | 목록·등록 — 배선됨               |
| GET/PATCH/DELETE | `/api/admin/content/notices/{noticeId}`             | 상세·수정·삭제 — 배선됨          |
| POST             | `/api/admin/content/notices/bulk-delete`            | OpenAPI만. FE는 단건 DELETE 루프 |
| GET/POST         | `/api/admin/content/notice-categories`              | 카테고리 모달 — 배선됨           |
| PATCH/DELETE     | `/api/admin/content/notice-categories/{categoryId}` | 카테고리 모달 — 배선됨           |

### FAQ (`/admin/posts/faq`)

| Method                | Path                                  | FE                          |
| --------------------- | ------------------------------------- | --------------------------- |
| GET/POST              | `/api/admin/content/faqs`             | 목록·등록 — 배선됨          |
| GET/PATCH/DELETE      | `/api/admin/content/faqs/{faqId}`     | 상세·수정·삭제 — 배선됨     |
| POST                  | `/api/admin/content/faqs/bulk-delete` | OpenAPI만. FE는 단건 DELETE |
| GET/POST/PATCH/DELETE | `/api/admin/content/faq-categories`   | 카테고리 모달 — 배선됨      |

### 문의 (`/admin/posts/inquiries`)

| Method   | Path                                                  | FE                                                |
| -------- | ----------------------------------------------------- | ------------------------------------------------- |
| GET      | `/api/admin/inquiries`                                | 목록 — 배선됨 (`status`, `programId`만 서버 필터) |
| GET      | `/api/admin/inquiries/{inquiryId}`                    | 상세 — 배선됨                                     |
| DELETE   | `/api/admin/inquiries/{inquiryId}`                    | 단건 삭제 — 배선됨                                |
| POST     | `/api/admin/inquiries/bulk-delete`                    | 2건 이상 삭제 — 배선됨                            |
| GET/POST | `/api/admin/inquiries/{inquiryId}/answers`            | 답변 목록·등록 — 배선됨                           |
| PATCH    | `/api/admin/inquiries/{inquiryId}/answers/{answerId}` | 기존 답변 수정 — 배선됨                           |
| GET/POST | `/api/admin/inquiry-categories`                       | 카테고리 모달 — 배선됨                            |
| PATCH/DELETE | `/api/admin/inquiry-categories/{categoryId}`      | 카테고리 모달 — 배선됨                            |

---

## Notion 기획 ↔ gap

| 화면       | Notion                    | 조치                               | Gap           |
| ---------- | ------------------------- | ---------------------------------- | ------------- |
| 문의 목록  | 카테고리 관리 팝업        | FE 배선됨. 사용 중 삭제는 409(G4)  | **G4**        |
| 문의 상세  | 문의 회원명·연락처·이메일 | FE `회원 #id` / `-`                | **G2**        |
| 문의 목록  | 담당자명                  | FE `관리자 #id`                    | **G3**        |
| 문의 상세  | 답변 후 삭제 불가         | FE 버튼 비활성. 서버 409 필요      | **G4**        |
| 공지 상세  | 첨부파일                  | `hasAttachment`만                  | **G5**        |
| 공지 목록  | 수정일시                  | `NoticeResponse`에 없음            | **G6**        |
| 3화면 필터 | 제목·작성자·기간·카테고리 | FE size=500 후 클라이언트 필터     | **G7**        |
| 3화면      | 엑셀 다운로드             | FE는 현재 테이블 클라이언트 export | **G8**        |

---

## 복붙 블록 A — G1–G4 (시드와 함께)

시드 Cursor 프롬프트를 아직 안 돌렸다면 그 파일을 그대로 붙여라.  
시드는 이미 넣었고 API만 빠졌다면 **아래 블록만** 백엔드 Cursor에 붙여라.

````markdown
# Cursor prompt — CMS 문의 카테고리·문의자 embed·409 규칙

이 백엔드 레포에서 실행하라. CMS 게시글 관리(문의내역) 기획을 맞춘다.
공지/FAQ 카테고리 API 패턴을 재사용하라. prod 마이그레이션에 시드를 넣지 마라.

## G1 문의 카테고리 CRUD

다음을 공지 카테고리(`/api/admin/content/notice-categories`)와 동일 스키마로 추가하라.

- GET/POST `/api/admin/inquiry-categories`
- PATCH/DELETE `/api/admin/inquiry-categories/{categoryId}`
- Request: CategoryRequest (`categoryName` 또는 `name`, `status`, `displayOrder`)
- Response items: `id` 또는 `categoryId`, `categoryName` 또는 `name`

시드 카테고리 9개(이름 그대로 unique upsert):

계정, 프로그램, 결제, 활동, 봉사시간, 시스템, 정산, 안내, 기타

OpenAPI에 경로를 추가하라. 권한은 기존 문의 쓰기와 같게.

## G2 InquiryResponse 문의자 embed

목록·상세 모두에 추가:

- inquirerName
- inquirerPhone
- inquirerEmail

회원 마스터 join이 되면 join. 로컬 시드는 `inquirerMemberId` stub + 스냅샷 값.
빈 문자열 `"-"` 를 보내지 마라. 없으면 omit.
FE는 필드가 없으면 `회원 #{inquirerMemberId}` / `-` 로 fallback 한다.

검증: `GET /api/admin/inquiries/1` 의 inquirerName 이 `서봉사`.

## G3 assignedAdminName

InquiryResponse.assignedAdminName (string, nullable).
assignedAdminId 만 주고 이름을 빼지 마라.
검증: ANSWERED 문의의 담당자명이 비어 있지 않음.

## G4 409

1. 카테고리 DELETE: 해당 카테고리로 공지/FAQ/문의가 1건 이상이면 409.
2. 카테고리 POST/PATCH: 같은 보드에서 이름 중복이면 409.
3. 문의 DELETE 및 bulk-delete: 답변이 있거나 status=ANSWERED 이면 409. PENDING만 삭제.
4. 문의 답변은 1:1. 두 번째 POST는 409 (또는 기존 답변 PATCH만 허용).

검증:

```bash
# ANSWERED 문의 1 → 409
curl -sS -o /dev/null -w "%{http_code}\n" -X DELETE -H "Authorization: Bearer $TOKEN" \
  "$BASE/api/admin/inquiries/1"
```

작업 후 추가한 path와 OpenAPI 반영 여부를 보고하라.
````

---

## 복붙 블록 B — G5 공지 첨부 (OpenAPI 먼저)

````markdown
# Cursor prompt — CMS 공지 첨부 메타 API

구현하되 이번엔 OpenAPI + DTO만 먼저 해도 된다. 파일 스토리지 연동이 크면
NoticeResponse에 attachments 배열만 추가하고 upload는 TODO로 남겨라.

목표: 공지 상세에 첨부파일 영역이 파일명으로 보이게 한다.
지금 FE는 hasAttachment boolean만 받고, 업로드 API가 없어 실파일을 저장하지 못한다.

추가 필드 (NoticeResponse / 상세 GET):

```
attachments?: { id: string; name: string; downloadUrl?: string }[]
```

있으면 hasAttachment = attachments.length > 0 와 일치시킬 것.

업로드(후속):

- POST /api/admin/content/notices/{noticeId}/attachments (multipart)
- GET 다운로드 URL 또는 리다이렉트
- DELETE /api/admin/content/notices/{noticeId}/attachments/{attachmentId}

로컬 시드는 파일 바이너리 없이 name만 넣어도 된다.
예: notice-admin-1 → "(2026) JA Korea 경제금융교육 커리큘럼.pdf"
예: notice-result-2 → "[명단] UJAT 36기 최종합격 명단.pdf", "[안내문] UJAT 36기 향후 일정 안내.pdf"

prod 없이 local만. 기존 hasAttachment 계약을 깨지 마라.
````

---

## 복붙 블록 C — G6 공지 updatedAt (OpenAPI 먼저)

```markdown
# Cursor prompt — CMS 공지 updatedAt

NoticeResponse에 updatedAt (ISO-8601) 을 추가하라.
기획 공지 목록 컬럼이 수정일시이다. FE 컬럼 추가는 별 PR.
PATCH 후 updatedAt 이 createdAt 과 달라지는지 확인하라.
생성 직후엔 createdAt 과 같아도 된다.
OpenAPI NoticeResponse에 필드를 반영하라.
```

---

## 복붙 블록 D — G7 목록 서버 필터 (OpenAPI 먼저)

```markdown
# Cursor prompt — CMS 게시글 목록 서버 필터

FE는 지금 size=500으로 받은 뒤 클라이언트에서 거른다.
쿼리 파라미터만 OpenAPI에 추가하고, 구현하면 FE는 후속 PR에서 넘긴다.
기존 status / programId 계약을 깨지 마라.

공지 GET /api/admin/content/notices 추가 파라미터:

- title (부분 일치)
- author (부분 일치)
- category (카테고리명 exact)
- createdFrom, createdTo (날짜, inclusive)

FAQ GET /api/admin/content/faqs: 공지와 동일 (title=question 검색으로 매핑해도 됨).

문의 GET /api/admin/inquiries 추가 파라미터:

- title, category
- programName (programNameSnapshot 부분 일치)
- memberName (inquirerName 부분 일치)
- assigneeName (assignedAdminName 부분 일치)
- createdFrom, createdTo

page/size는 유지. 필터 미전달 시 현재와 같은 전체 목록.
```

---

## 복붙 블록 E — G8 엑셀 export (이번 시드 범위 밖)

```markdown
# Cursor prompt — CMS 게시글 엑셀 export (선택)

FE 목록 화면은 이미 현재 테이블 행을 클라이언트에서 xlsx로 내려받는다.
서버 export가 필요하면 공지/FAQ/문의에
POST /api/admin/content/notices/export 등 기존 CMS export 패턴을 따르라.
감사로그 정책이 export에 있으면 그대로 적용하라.

필수는 아니다. FE excel 버튼이 클라이언트 export로 동작 중이다.
```
