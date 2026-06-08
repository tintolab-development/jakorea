# 참여 기관 상세 — 게시글 탭 (일반 프로그램)

**Where:** 풀페이지 프로그램 모달 → LNB **프로그램 진행 현황** → **참여 기관** → 기관 행 클릭 → **게시글** 탭.  
**Code:** `school-detail-fullpage-view.tsx`, `EnrollmentProgramDetailPostsTab` (`features/user/detail/ui/enrollment-program-detail-posts-tab.tsx`).

## 구현 원칙

- **공통 컴포넌트 재사용** — 수강 프로그램 상세·UJAT 참여 기관 상세와 동일한 `EnrollmentProgramDetailPostsTab` + `enrollment-program-detail-modal.css`.
- 탭 행 trailing **[게시글 등록]** → `PostWriteModal` (controlled: `writeModalOpen` / `onWriteModalOpenChange`).
- 탭 본문 `showWriteButtonInSection={false}` — 좌측 "게시글 작성" 버튼 숨김.
- `schoolId={detail.id}` — 해당 참여 기관(학교) 게시글·첨부만 필터.

## 레이아웃 (2컬럼 7:3)

| 영역 | 내용 |
|------|------|
| **좌 (70%)** | 게시글 카드 목록 — 아바타·작성자·일시·읽음 배지·본문(…더보기)·첨부·조회/반응/댓글 |
| **우 (30%)** | 파일 검색 + 첨부 파일 목록 (다운로드·바로보기 메뉴) |

풀페이지에서는 고정 `862px` 대신 **content 영역 flex fill** — `school-detail-fullpage-view__posts-tab-wrap` CSS.

## Mock

- 게시글: `getProgramPostsByProgramIdAndSchoolId(program.id, schoolId)`  
  canonical: `GENERAL_PARTICIPATING_SCHOOLS_PROGRAM_ID` (`general-prog-type-org-curriculum-single`).  
  `general-prog-*` id fallback → canonical school posts.
- 파일: `getProgramFilesByProgramId` — 동일 fallback.
- 강서초등학교(`school-1`) 시안 3건: `buildGeneralOrgSchool1ScreenshotPosts()`.

## UJAT·타 유형

UJAT 참여 기관 상세는 `ujat/.../detail-view.tsx` — 동일 탭 컴포넌트, 별도 mock·CSS 래퍼.

**Related:** [enrollment-program-detail-posts-tab-spec.md](./enrollment-program-detail-posts-tab-spec.md)

**Last updated:** 2026-06-05
