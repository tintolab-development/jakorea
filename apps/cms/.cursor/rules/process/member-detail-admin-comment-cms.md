---
priority: high
category: process
---

# CMS — member detail “admin comment”

Product rules for the admin comment block on the **Detail info** tab. UI: `user-detail-admin-comment-section.tsx`.

## 0. 노출 조건 (CMS 관리자 로그인)

- 로그인 사용자의 `role === 'ADMIN'`(`isCmsAdminUser`)이면 **대상 회원의 권한 승인 현황과 관계없이** 해당 블록을 항상 노출한다. (`shouldShowAdminCommentSectionForViewer`)
- 저장·인라인 편집 가능 여부는 `admin-provisioned-member-cms.md` §2·§3의 기존 규칙을 따르되, **보기**만 필요한 경우에도 블록은 숨기지 않는다.

## 1. 열람 범위 (공통 노출)

- Comments are **not** private to the author. **Every** CMS admin who can open the member sees the **same** text (shared operational note per member).
- Do not filter to “only my comments” on the client. Render `adminComment` (or equivalent) from the member-detail response as returned.

## 2. 빈 상태 문구

- 본문이 없거나 공백만 있으면 **`작성된 코멘트가 없습니다.`** 를 표시한다. (프로그램 내 학교 상세의 동일 영역과 문구 통일.)

## 3. 구현·API 시 유의

- The backend must not return different bodies per admin user. Model as **one comment per member** (or latest revision of a single thread).  
- If you add author labels or audit logs later, keep **read access** consistent with this rule unless product explicitly changes it.

**Last updated:** 2026-04-21
