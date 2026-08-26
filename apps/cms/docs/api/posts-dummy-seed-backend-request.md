# 게시글 관리 더미 시드 요청 (BE)

CMS LNB **게시글 관리** 3화면(공지사항·FAQ·문의내역)을 FE mock과 동일하게 검증할 수 있도록 더미 시드를 요청합니다.

| 항목                       | 값                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **작성일**                 | 2026-08-26                                                                                                          |
| **대상 화면**              | `/admin/posts/notices` · `/admin/posts/faq` · `/admin/posts/inquiries`                                              |
| **모듈 플래그**            | `VITE_REAL_API_MODULES=notices,faqs,inquiries`                                                                      |
| **연동 명세**              | [posts-api-integration.md](./posts-api-integration.md)                                                              |
| **갭**                     | [posts-api-backend-gaps.md](./posts-api-backend-gaps.md)                                                            |
| **백엔드 Cursor 프롬프트** | [posts-dummy-seed-backend-cursor-prompt.md](./posts-dummy-seed-backend-cursor-prompt.md) — 지시 + JSON SSOT 한 파일 |

OpenAPI에 bulk create POST가 없습니다. local profile **Flyway** / `LocalDemoSeedRunner`로 **UPSERT** 해 주세요. mock fallback이 없어 시드가 없으면 3화면 모두 빈 목록입니다.

---

## 0. 페이로드

| 도메인                      | FE SSOT                                                                                                                                                                                                  | 건수                               | BE 복붙                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------- |
| 공지 카테고리 + 공지        | [`admin-notice-mock-store.ts`](../../src/features/posts/api/admin-notice-mock-store.ts) + [`createInitialNoticeCategoryRows()`](../../src/features/posts/model/admin-notice-management-filter-fields.ts) | 8 + 27                             | [`notices-seed.payload.json`](./notices-seed.payload.json)     |
| FAQ 카테고리 + FAQ          | [`admin-faq-mock-store.ts`](../../src/features/posts/api/admin-faq-mock-store.ts) + [`admin-faq-seeds.ts`](../../src/data/mock/admin-faq-seeds.ts)                                                       | 8 + 130                            | [`faqs-seed.payload.json`](./faqs-seed.payload.json)           |
| 문의 카테고리 + 문의 + 답변 | [`admin-inquiry-mock-store.ts`](../../src/features/posts/api/admin-inquiry-mock-store.ts)                                                                                                                | 9 + 130 (ANSWERED 32건에 답변 1건) | [`inquiries-seed.payload.json`](./inquiries-seed.payload.json) |

재생성(FE):

```bash
WRITE_POSTS_SEED=1 pnpm --filter cms test -- src/features/posts/lib/seed.test.ts
```

FE 정합: 동일 vitest (env 없이) — payload ↔ mock.

---

## 1. 시드 순서

```text
notice_categories (8) → faq_categories (8) → inquiry_categories (9)
→ notices (27) → faqs (130)
→ member stubs (문의자 FK) → inquiries (130) → inquiry_answers (ANSWERED만)
```

- `seedLabel = posts-fe-mock-v1`. idempotent. 재실행해도 복제하지 말 것.
- `local` profile만. prod 마이그레이션에 넣지 말 것.
- 공지/FAQ `status`: FE `draft` → API `임시저장`.
- 공지 `isImportant` 상단 고정, **개수 제한 없음**.
- 첨부: `hasAttachment` + `attachmentNames[]`만. 파일 바이너리는 시드 범위 밖.
- 문의 `programId` FK가 깨지면 **null** + `programNameSnapshot` 문자열 유지.
- 문의 id: mock `1`~`7`은 그대로, `inq-gen-N` → `800000+N`.

---

## 2. 대표 검증 행

| 도메인 | seedKey          | 확인                                                                                                                     |
| ------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 공지   | `notice-admin-1` | 제목 `2025년 1월 정산 신청 기간 및 방법 안내`, `isImportant=true`, `status=published`, `category=정산`, `viewCount=1250` |
| FAQ    | `faq-admin-1`    | `category=회원가입`, `status=임시저장`, 질문 `봉사시간은 언제 확인 가능한가요?`                                          |
| 문의   | `1`              | 제목 `1365 포털에 봉사시간이 아직 안 올라왔어요.`, `status=ANSWERED`, 회원명 `서봉사`, 답변 1건                          |

---

## 3. 중복·충돌 체크리스트

### 공지·FAQ 카테고리

1. `categoryName` 정규화 후 unique.
2. 해당 카테고리에 글이 있으면 DELETE → **409**.
3. 공지 카테고리 `필독`은 mock 필터 옵션이다. 게시 `category` 값으로 쓰인 행은 없다. 모달 목록 일치를 위해 **카테고리 행은 시드**한다.

### 문의

1. `suggestedNumericId` unique upsert.
2. ANSWERED 행만 `inquiry_answers` 1건.
3. 답변 있는 문의 DELETE → **409**. PENDING만 삭제 성공.
4. 문의 카테고리 API가 없으면 시드 테이블만 만들고, [갭 G1](./posts-api-backend-gaps.md)을 구현한 뒤 모달에 연결.

### 교차

- 문의자 `inquirerMemberId` stub: `1`~`7` → `1001`~`1007`, `inq-gen-N` → `810000+N`. 기존 회원과 충돌하면 이름·전화·이메일만 스냅샷으로 저장 (G2).

---

## 4. 필드 힌트

### 공지 (`rows[]`)

| payload          | API/DB 힌트                                   |
| ---------------- | --------------------------------------------- |
| `id` / `seedKey` | `NoticeResponse.id` (string)                  |
| `status`         | `published` \| `임시저장` \| `archived`       |
| `isImportant`    | 상단 고정                                     |
| `hasAttachment`  | boolean. 실제 파일 URL 없음                   |
| `category`       | 카테고리명 문자열 (ID가 있으면 이름으로 join) |

### FAQ (`rows[]`)

| payload               | API/DB 힌트      |
| --------------------- | ---------------- |
| `question` / `answer` | `FaqResponse`    |
| `status`              | 공지와 동일 enum |

### 문의 (`rows[]`)

| payload                                            | API/DB 힌트                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| `suggestedNumericId`                               | `InquiryResponse.id`                                             |
| `inquirerName` / `inquirerPhone` / `inquirerEmail` | G2 embed. 없으면 FE가 `회원 #{id}` / `-`                         |
| `assignedAdminName`                                | G3. 없으면 FE가 `관리자 #{id}`                                   |
| `programNameSnapshot`                              | 프로그램 삭제 후에도 목록 표시                                   |
| `answer`                                           | child. `POST /api/admin/inquiries/{id}/answers` 응답과 동일 필드 |

---

## 5. 검증

관리자 JWT:

1. `GET /api/admin/content/notices?page=0&size=500` — 27건, `isImportant` DESC → `createdAt` DESC.
2. `GET /api/admin/content/notices?status=published` / `status=임시저장`.
3. `GET /api/admin/content/notices/notice-admin-1` — 본문·조회수 1250·첨부 true.
4. `GET /api/admin/content/faqs?page=0&size=500` — 130건, 카테고리 8종.
5. `GET /api/admin/inquiries?page=0&size=500` — 130건.
6. `GET /api/admin/inquiries/1` + `GET /api/admin/inquiries/1/answers` — ANSWERED, 답변 1건.
7. PENDING 문의 DELETE 성공. ANSWERED 문의 DELETE → 409.
8. 글이 있는 공지/FAQ 카테고리 DELETE → 409. 중복명 POST → 409.
9. CMS LNB 3화면 `notices,faqs,inquiries` 모듈 ON 후 목록·상세 스모크.

시드만으로 막히는 화면(문의 카테고리 모달, 문의자 실명)은 [posts-api-backend-gaps.md](./posts-api-backend-gaps.md) G1–G4.
