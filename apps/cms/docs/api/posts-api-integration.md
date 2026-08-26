# 게시글 관리 API 연동 명세

LNB 「게시글 관리」 3화면(공지·FAQ·문의)과 Swagger API 매핑입니다.

공통 가이드: [backend-handoff.md](./backend-handoff.md) · [api-routes-and-client.md](./api-routes-and-client.md)

| 문서                                                                                                                                                                               | 용도                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| [posts-dummy-seed-backend-request.md](./posts-dummy-seed-backend-request.md)                                                                                                       | mock → DB 시드 요청                 |
| [posts-dummy-seed-backend-cursor-prompt.md](./posts-dummy-seed-backend-cursor-prompt.md)                                                                                           | BE Cursor 복붙 (시드 + 검증 + JSON) |
| [posts-api-backend-gaps.md](./posts-api-backend-gaps.md)                                                                                                                           | 부족한 API 복붙 블록 (G1–G8)        |
| [`notices-seed.payload.json`](./notices-seed.payload.json) · [`faqs-seed.payload.json`](./faqs-seed.payload.json) · [`inquiries-seed.payload.json`](./inquiries-seed.payload.json) | 시드 SSOT                           |

---

## 모듈 키

| env                                   | 코드                                  |
| ------------------------------------- | ------------------------------------- |
| `VITE_REAL_API_MODULES=...,notices`   | `isRealApiModuleEnabled('notices')`   |
| `VITE_REAL_API_MODULES=...,faqs`      | `isRealApiModuleEnabled('faqs')`      |
| `VITE_REAL_API_MODULES=...,inquiries` | `isRealApiModuleEnabled('inquiries')` |

실 API 호출 추가 조건: MFA 완료 후 유효 JWT (`hasRemoteAdminJwt()`).

게시글 관리 3화면은 **mock fallback 없음**. 모듈 키가 없거나 JWT가 없으면 쿼리가 비활성이라 빈 목록이다. local 검증은 위 시드가 선행돼야 한다.

---

## 코드 위치

| 역할            | 경로                                                              |
| --------------- | ----------------------------------------------------------------- |
| Orval 생성      | `src/shared/api/generated/posts/`                                 |
| OpenAPI subset  | `openapi/posts.openapi.json` (`scripts/filter-openapi-posts.mjs`) |
| 공통 query keys | `features/posts/api/posts-query-keys.ts`                          |
| 캐시 clear      | `features/posts/api/clear-posts-query-cache.ts`                   |
| 공지            | `features/posts/api/notices/`                                     |
| FAQ             | `features/posts/api/faqs/`                                        |
| 문의            | `features/posts/api/inquiries/`                                   |
| 시드 빌더       | `features/posts/lib/build-seed.ts`                                |

---

## TanStack Query 캐시

- Key prefix: `['cms', 'posts', …]`
- `logout` / `completeAdminAuth` → `clearPostsQueryCache()`

---

## 공지사항 (`/admin/posts/notices`)

| Method       | Path                                                | UI                                                                     |
| ------------ | --------------------------------------------------- | ---------------------------------------------------------------------- |
| GET          | `/api/admin/content/notices`                        | 목록. FE `size=500`. 서버 필터는 `status`만 (`published` / `임시저장`) |
| POST         | `/api/admin/content/notices`                        | 등록                                                                   |
| GET          | `/api/admin/content/notices/{noticeId}`             | 상세                                                                   |
| PATCH        | `/api/admin/content/notices/{noticeId}`             | 수정                                                                   |
| DELETE       | `/api/admin/content/notices/{noticeId}`             | 삭제 (목록 다건은 단건 루프)                                           |
| GET/POST     | `/api/admin/content/notice-categories`              | 카테고리 모달                                                          |
| PATCH/DELETE | `/api/admin/content/notice-categories/{categoryId}` | 카테고리 수정·삭제                                                     |

공개/비공개: 폼 `public` → `status=published`, `private` → `status=임시저장`. FE domain `draft`는 adapter에서 `임시저장`과 매핑.

상단 고정: `isImportant`. 목록은 클라이언트에서 `isImportant DESC` → `createdAt DESC` 재정렬.

---

## FAQ (`/admin/posts/faq`)

| Method                | Path                                | UI                                          |
| --------------------- | ----------------------------------- | ------------------------------------------- |
| GET                   | `/api/admin/content/faqs`           | 목록. FE `size=500`. 서버 필터는 `status`만 |
| POST                  | `/api/admin/content/faqs`           | 등록                                        |
| GET                   | `/api/admin/content/faqs/{faqId}`   | 상세                                        |
| PATCH                 | `/api/admin/content/faqs/{faqId}`   | 수정                                        |
| DELETE                | `/api/admin/content/faqs/{faqId}`   | 삭제                                        |
| GET/POST/PATCH/DELETE | `/api/admin/content/faq-categories` | 카테고리 모달                               |

---

## 문의내역 (`/admin/posts/inquiries`)

| Method | Path                                                  | UI                                    |
| ------ | ----------------------------------------------------- | ------------------------------------- |
| GET    | `/api/admin/inquiries`                                | 목록. 서버 필터 `status`, `programId` |
| GET    | `/api/admin/inquiries/{inquiryId}`                    | 상세                                  |
| DELETE | `/api/admin/inquiries/{inquiryId}`                    | 단건 삭제                             |
| POST   | `/api/admin/inquiries/bulk-delete`                    | 2건 이상 삭제                         |
| GET/POST | `/api/admin/inquiry-categories`                     | 카테고리 모달                         |
| PATCH/DELETE | `/api/admin/inquiry-categories/{categoryId}`      | 카테고리 수정·삭제                    |
| GET    | `/api/admin/inquiries/{inquiryId}/answers`            | 답변 목록                             |
| POST   | `/api/admin/inquiries/{inquiryId}/answers`            | 답변 등록 (없을 때)                   |
| PATCH  | `/api/admin/inquiries/{inquiryId}/answers/{answerId}` | 답변 수정 (있을 때)                   |

답변 후 삭제 버튼은 FE에서 비활성. 서버도 ANSWERED DELETE → 409 이어야 한다 (G4).

---

## API 미존재 / 스펙 갭

상세·복붙 프롬프트: [posts-api-backend-gaps.md](./posts-api-backend-gaps.md)

| #   | 항목                                       | UI 대응                                                     | Gap |
| --- | ------------------------------------------ | ----------------------------------------------------------- | --- |
| 1   | 문의 카테고리 CRUD                         | 배선됨 (`inquiry-categories`, 공지/FAQ와 동일 모달)         | G1  |
| 2   | 문의자 이름·연락처·이메일                  | `회원 #{inquirerMemberId}`, phone/email `-`                 | G2  |
| 3   | `assignedAdminName`                        | `관리자 #{assignedAdminId}`                                 | G3  |
| 4   | 카테고리 삭제/중복·답변된 문의 삭제 409    | FE 모달 차단 + 서버 409 필요                                | G4  |
| 5   | 공지 첨부 upload/download                  | `hasAttachment` boolean. 폼 첨부 UI는 파일명만 전송         | G5  |
| 6   | 공지 `updatedAt`                           | 목록 컬럼 없음                                              | G6  |
| 7   | 목록 서버 필터 (제목·작성자·기간·카테고리) | 클라이언트 `useTablePage` 보조                              | G7  |
| 8   | 서버 엑셀 export                           | 클라이언트 `excelExport` (현재 테이블 행)                   | G8  |

문의 **DELETE**는 OpenAPI·FE 모두 구현됨 (2026-06-12 문서의 “미존재”는 outdated).

---

## 시드 재생성

```bash
WRITE_POSTS_SEED=1 pnpm --filter cms test -- src/features/posts/lib/seed.test.ts
```

**Last updated:** 2026-08-26
