# 일반 프로그램 — 기관 합반 신청 여부 (신청·참여 공통)

**Scope:** 일반 프로그램(`features/program/general`) 기관 유형 **신청 상세**·**참여 기관 상세**의 **합반 신청 여부** 편집 UI·저장 정책. UJAT·1사1교·Gemini는 본 규칙과 분리.

## 적용 화면

| 화면 | 진입 | Code |
|------|------|------|
| 기관 **신청** 상세 | 프로그램 상세 → 참여자 신청 → 기관 행 | `institution-basic-info.tsx`, `use-applicant-institution-detail-edit.ts` |
| **참여** 기관 상세 | 프로그램 진행 현황 → 참여 기관 → 신청 정보 탭 | `school-detail-fullpage-view.tsx`, `use-participating-institution-detail-edit.ts` |

공통 편집 UI: `institution-combined-class-edit-cell.tsx`  
정책 함수: `combined-class-edit-policy.ts`

## 프로그램 자격

- **단일 회차 프로그램**(`resolveInstitutionApplicationProgramBridge(program).sessionRound === 'single'`)에서만 합반 신청 가능.
- 다회차·비대상 프로그램: 조회·편집 모두 **「해당 없음」**, 저장 시 항상 **미신청**·파트너 ID 빈 배열.

## 편집 UI (정보 수정 모드)

1. **라디오** — `미신청` / `신청`, **기본값 미신청** (`size="large"`).
2. **「신청」 선택 시** 라디오 **우측**에 **다중 선택 `CmsSelect`** 활성화.
3. **옵션** — 동일 프로그램·**동일 기관명**의 **타 학년** 신청(또는 참여) 건 목록.
   - 신청: `getSameSchoolApplicantGrades(programId, schoolName, excludeId)`
   - 참여: `getSameSchoolParticipatingGrades(schoolName, excludeId)` — 목록은 이미 동일 프로그램 범위.
4. **타 학년 건이 없으면** **「신청」 라디오만 `disabled`** — 「미신청」은 항상 선택 가능.
5. **진행된 교육**(`sessions` 중 `status === 'completed'`)이 **있을 때만** 합반 반영 안내 문구 노출 (`COMBINED_CLASS_EFFECTIVE_FROM_NEXT_SCHEDULE_NOTICE`). 아직 진행 교육 없으면 안내 없이 합반 가능.

## 저장·동기화

- **신청** 선택 시 파트너 학년 **1건 이상** 필수 (Zod).
- **미신청** 또는 비대상 프로그램: 파트너 ID·학년 배열 초기화.
- **신청 상세 mock:** `patchApplicantInstitutionDetailWithCombinedClass` — 선택한 타 학년 신청 건에도 **교재명·합반 신청 정보** 동기화.
- **참여 상세:** `participatingInstitutionEditDraftToDetailPatch` + `onSaveBasicInfo`; 합반 시 교재 선택 규칙은 [참여 기관 교재 spec](./participating-institution-textbook-spec.md) 참고.

## 실적·교육 일정 (안내 카피)

합반 처리 시 **다음 교육 일정부터** 반영. 이전 교육은 실적 개별 반영, 합반 이후는 **사용 교재 학년** 기준 취합.

## 검증·테스트

- 단위: `combined-class-edit-policy.test.ts`
- mock 데모: 동일 기관·동일 프로그램 다학년 (`applicant-school-1/5/6` 진월초 등)

**Last updated:** 2026-06-08
