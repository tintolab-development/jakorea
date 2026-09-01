# 참여 기관 상세 — 교재 정보 (일반 프로그램)

**Where:** 풀페이지 프로그램 모달 → LNB **프로그램 진행 현황** → **참여 기관** → 기관 행 클릭 → **신청 정보** 탭 기본 정보.  
**Code:** `participating-institution-textbook.ts`, `school-detail-fullpage-view.tsx`, `use-participating-institution-detail-edit.ts`.

## 노출 여부

- `programUsesTextbook(program)` — 일정형(`educationStructure === 'schedule'`)이 아니고, 프로그램 **사업 분야·교육 대상**에 맞는 **사용 중** 교재가 교재 카탈로그에 1건 이상 있을 때만 교재 UI 노출.
- 미노출 시: 상세 **교재명** 행 숨김, 목록 **교재 배송 현황** 열·필터 숨김.

## 자동 매칭·키트 산출

| 입력 | 규칙 |
|------|------|
| 사업 분야 + 교육 학년 | `filterTextbooksForApplicant` → 첫 매칭 교재명 |
| 총 학생 수 | `ceil(인원 / 권수/키트)` 키트 수, 권수 = 키트 × 권수/키트 |
| 권수/키트 | `targetLevel` 고·대 → **32**, 그 외(초·중 등) → **24** |

함수: `resolveParticipatingInstitutionTextbookDisplay`, `calculateParticipatingTextbookKitQuantity`.

## 합반 수업 — 교재 수정

- **합반 신청 = 신청**일 때만 **정보 수정** 모드에서 **교재명 `CmsSelect`만** 전체 너비 노출 (키트·배송 현황은 조회 행과 동일, 수정 행에는 미포함).
- 옵션: `filterTextbooksForCombinedClassEdit` — 사업 분야·교육 대상 동일, **교재 학년만** 상이한 사용 중 교재.
- 저장 시 `textbookId`, `textbookName`, `textbookGrade`, `textbookKits`, `textbookQuantity` 반영.
- **실적 취합** 학년명: `textbookGrade`(선택 교재 학년). 기관 **교육 학년**(`educationGrade`)과 별도.

## 합반 신청 여부 (편집 UI)

- 라디오·타 학년 셀렉·단일 회차 제한·안내 문구 등 **공통 규칙**은 [applicant-institution-combined-class-spec.md](./applicant-institution-combined-class-spec.md) 따름.
- 참여 화면도 `InstitutionCombinedClassEditCell` 공유.

## 정보 수정 저장

- 수정 가능: 관리자 코멘트, 합반 신청 여부(+ 타 학년), 합반 시 교재명.
- 교재명 Zod 검증: `requiresParticipatingTextbookSelection` (= 교재 사용 프로그램 **且** 합반 신청).

## UJAT

UJAT 참여 기관 상세 교재 로직은 `features/program/ujat/.../textbook.ts` — 본 규칙과 분리.

**Last updated:** 2026-06-08
