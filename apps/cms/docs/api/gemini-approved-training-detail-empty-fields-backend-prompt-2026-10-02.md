# Cursor prompt — Gemini 승인 연수 상세 「담당 교사 정보」 빈 필드 (JABACK)

| 항목 | 값 |
|---|---|
| 대상 레포 | **JABACK만** |
| 주 API | `GET /api/admin/gemini/trainings/approved/{approvedTrainingId}` |
| 스키마 | `GeminiApprovedTrainingDetailResponse` |
| 대상 화면 | CMS → 제미나이 → 찾아가는 연수 → 승인 연수 상세 → **프로그램 정보** 탭 |
| 프로그램 유형 | `GEMINI_TRAINING` 만 |
| 우선순위 | **P1** (화면 필드가 항상 비어 보임) |
| 작성일 | 2026-10-02 |

---

## 한줄

상세 응답의 교사 필드 4개가 `GeminiTrainingAdminQueryService.mapApprovedDetail`에서 **`null`로 하드코딩**돼 있어, FE가 값을 받을 방법이 없다.

## 현황 (코드 확인 2026-10-02)

| 응답 필드 | CMS 라벨 | 현재 | 비고 |
|---|---|---|---|
| `teacherPosition` | 직급 | 항상 `null` | `teacher_profile`에 컬럼 없음 (`member_id` · `current_organization_id` · `employment_status`만) |
| `teacherSubject` | 과목 | 항상 `null` | 위와 동일 |
| `teacherScheduleChangeCount` | 일정 변경 횟수 | 항상 `null` | 집계 쿼리 없음 |
| `teacherAccountNumber` | 정산 계좌 정보(계좌번호) | 항상 `null` | `member_bank_account.account_no_encrypted`는 있으나 SELECT·매핑 안 함. 은행·예금주만 내려옴 |

값은 오지만 조건부로 비는 필드 (버그 아님, 확인용):

| 응답 필드 | 비는 조건 |
|---|---|
| `teacherInstructorFeeGrade` | 교사가 강사 프로필(`instructor_profile.default_fee_grade`)이 없을 때 |
| `teacherHomeAddress` · `teacherLectureExperience` | 교사의 `instructor_profile`이 없을 때 |
| `trainingDate` · `trainingStartTime` · `trainingEndTime` · `trainingTimeText` | 강사 미배정(`instructorMemberId == null`)이거나, 기관 일정 배정(`program_organization_schedule_assignment`)이 없을 때. 강사는 승인된 강사 신청으로 대체 표시되므로 「강사는 있는데 연수일시 `-`」가 생길 수 있음 |

## 요구사항

1. **직급·과목**: 교사 직급·과목의 원천을 정한다 (예: `teacher_profile`에 `position` · `subject` 추가, 또는 기관 신청 폼 응답에서 추출). 원천이 정해지면 상세 SELECT·매핑에 반영한다.
2. **일정 변경 횟수**: 해당 기관 신청(`organization_application_id`)의 일정 변경 이력 건수를 집계해 `teacherScheduleChangeCount`로 내려준다. 이력 테이블이 없으면 정의가 필요하다.
3. **계좌번호**: 기본 상세는 **마스킹된** 계좌번호(예: `123-****-7890`)를 `teacherAccountNumber`로 내려준다. 원문은 아래 개인정보 원문 조회 API에서만 준다 → [gemini-approved-training-privacy-unmask-backend-prompt-2026-10-02.md](./gemini-approved-training-privacy-unmask-backend-prompt-2026-10-02.md)
4. **연수일시**: 강사가 승인 강사 신청으로 대체 표시되는 경우에도 연수일이 필요하면, 기관 일정 배정이 없을 때의 기준(예: 강사 신청의 희망 일정 또는 기관 신청 1지망)을 정해 반영한다. 현행 유지가 맞다면 그 정책을 응답 스키마 description에 명시한다.
5. OpenAPI description에 각 필드의 원천·null 조건을 적는다.

## 검증

- [ ] 직급·과목이 있는 교사의 승인 연수 상세에서 `teacherPosition` · `teacherSubject`가 채워짐
- [ ] 일정 변경 이력이 있는 신청에서 `teacherScheduleChangeCount` ≥ 1, 없으면 `0`
- [ ] 계좌가 등록된 교사는 `teacherAccountNumber`가 마스킹 값으로 옴
- [ ] 로컬 시드 승인 연수 id `185334`로 응답 확인

## FE 참고

- 상세 매핑: `apps/cms/src/features/program/gemini/model/approved/approved-detail-resolver.ts`
- 표 구성: `apps/cms/src/features/program/gemini/lib/approved/build-manager-profile-fields.tsx`
- BE 반영 시 FE 수정 없이 표시됨 (필드명 동일)
