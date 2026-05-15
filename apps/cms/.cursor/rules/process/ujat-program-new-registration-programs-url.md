---
priority: medium
category: routing
---

# UJAT 프로그램 신규 등록 — `/programs/ujat` 쿼리 부트스트랩

**Scope:** `apps/cms/src/pages/programs/**`, `apps/cms/src/features/template/**` (UJAT 프로그램 등록 폼)

---

## 요구사항

- **UJAT 프로그램 목록**(`apps/cms/src/pages/programs/UJAT/page.tsx`)의「프로그램 신규 등록」은 **`/templates/form-management`로 라우트 이동하지 않는다.**
- **`/programs/ujat` 경로를 유지**한 채, 쿼리 **`new`** 로 진입한다. (예: `/programs/ujat?new=1` — `userPreview`는 모달이 연 뒤에만 URL에 붙여 `useWritingUserPreviewUrlAuxiliarySync` 레이스를 피함)
- 이 때 템플릿 관리에 등록된 **`registration-ujat` —「UJAT 프로그램 등록 폼」**을 **사용자 모드**로 연다. UI는 `TemplatePreviewModal` 등 풀모달로 띄우며, URL의 **`userPreview=1`** 은 모달·히스토리 동기화용이며 **사용자 모드와 같은 말이 아니다** (용어 정의는 [form-editor-modes.mdc](../template/form-editor-modes.mdc) 참고).
- 구현 위치: **`UjatProgramListPage`** (`apps/cms/src/pages/programs/UJAT/page.tsx`) — `TemplateWritingPreviewProvider` + `useUjatProgramRegistrationEditor` + `useWritingUserPreviewUrlAuxiliarySync`로 URL·모달 동기화.

---

## 용어: 사용자 모드 ≠ `userPreview`

| 용어 | 의미 |
|------|------|
| **사용자 모드** | 제목·설명·단락 구조 편집 불가, **양식 필드에 내용만 입력·등록 가능**한 응답자 관점 모드 ([form-editor-modes.mdc](../template/form-editor-modes.mdc)) |
| **`userPreview` 쿼리** | `TemplateWritingPreview` 미리보기 모달과 URL/뒤로가기 **동기화**용 기술 플래그 (`TEMPLATE_USER_PREVIEW_ACTIVE`) |

---

## 식별자

| 항목 | 값 |
|------|-----|
| 템플릿 정의 id | `registration-ujat` (`template.schema.ts`) |
| 쿼리 키 (신규 등록 진입) | `new` (예: `new=1`; `searchParams.has('new')` 로 판별) |
| 미리보기 모달 URL 동기화 | `userPreview=1` (`TEMPLATE_USER_PREVIEW_ACTIVE`) — **사용자 모드와 혼동 금지** |

---

## 관련

- [template-management.md](../coding/template-management.md) — 템플릿 관리 라우트 영역  
- [form-editor-modes.mdc](../template/form-editor-modes.mdc) — view / edit / write 및 **사용자 모드** 정의  
- `use-ujat-program-registration-editor.ts` — 등록 폼 draft·`paragraphBodyOptions` (모달 본문 옵션)

**Last updated:** 2026-05-15
