# 게시글 관리 API 연동 명세

LNB 「게시글 관리」 3화면(공지·FAQ·문의)과 Swagger API 매핑입니다.

공통 가이드: [backend-handoff.md](./backend-handoff.md) · [api-routes-and-client.md](./api-routes-and-client.md)

---

## 모듈 키

| env | 코드 |
|-----|------|
| `VITE_REAL_API_MODULES=...,notices` | `isRealApiModuleEnabled('notices')` |
| `VITE_REAL_API_MODULES=...,faqs` | `isRealApiModuleEnabled('faqs')` |
| `VITE_REAL_API_MODULES=...,inquiries` | `isRealApiModuleEnabled('inquiries')` |

실 API 호출 추가 조건: MFA 완료 후 유효 JWT (`hasRemoteAdminJwt()`).

---

## 코드 위치

| 역할 | 경로 |
|------|------|
| Orval 생성 | `src/shared/api/generated/posts/` |
| OpenAPI subset | `openapi/posts.openapi.json` (`scripts/filter-openapi-posts.mjs`) |
| 공통 query keys | `features/posts/api/posts-query-keys.ts` |
| 캐시 clear | `features/posts/api/clear-posts-query-cache.ts` |
| 공지 | `features/posts/api/notices/` |
| FAQ | `features/posts/api/faqs/` |
| 문의 | `features/posts/api/inquiries/` |

---

## TanStack Query 캐시

- Key prefix: `['cms', 'posts', …]`
- `logout` / `completeAdminAuth` → `clearPostsQueryCache()`
- 게시글 관리 3화면은 **mock fallback 없음** — `VITE_REAL_API_MODULES`에 해당 키가 있어야 동작

---

## 공지사항 (`/admin/posts/notices`)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/cms/admin/notices` | 목록 |
| POST | `/api/cms/admin/notices` | 등록 |
| GET | `/api/cms/admin/notices/{noticeId}` | 상세 |
| PATCH | `/api/cms/admin/notices/{noticeId}` | 수정 |
| DELETE | `/api/cms/admin/notices/{noticeId}` | 삭제 |
| GET/POST/PATCH/DELETE | `/api/cms/admin/notice-categories` | 카테고리 모달 |

---

## FAQ (`/admin/posts/faq`)

| Method | Path | UI |
|--------|------|-----|
| GET/POST/PATCH/DELETE | `/api/cms/admin/faqs` | 목록·상세·등록·수정·삭제 |
| GET/POST/PATCH/DELETE | `/api/cms/admin/faq-categories` | 카테고리 모달 |

---

## 문의내역 (`/admin/posts/inquiries`)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/admin/inquiries` | 목록 |
| GET | `/api/admin/inquiries/{inquiryId}` | 상세 |
| GET | `/api/admin/inquiries/{inquiryId}/answers` | 답변 목록 |
| POST | `/api/admin/inquiries/{inquiryId}/answers` | 답변 등록 |
| PATCH | `/api/admin/inquiries/{inquiryId}/answers/{answerId}` | 답변 수정 |

---

## API 미존재 / 스펙 갭

| # | 항목 | UI 대응 |
|---|------|---------|
| 1 | 문의 DELETE | remote 시 삭제 버튼 비활성 |
| 2 | 문의 카테고리 CRUD | 카테고리 모달 비활성, 목록 distinct로 필터 |
| 3 | 문의자 이름·연락처 embed | `inquirerMemberId` 표시, `-` fallback |
| 4 | 공지 첨부 upload/download | remote 시 첨부 UI 비활성, `hasAttachment`만 |
| 5 | 목록 서버 필터 (제목·작성자·기간) | 클라이언트 `useTablePage` 보조 |
| 6 | `assignedAdminId` 표시명 | ID 표시 (`관리자 #id`) |

**Last updated:** 2026-06-12
