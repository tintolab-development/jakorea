# Cursor prompt — Gemini 승인 연수 「개인정보 상세보기」 원문 필드 보강 (JABACK)

| 항목 | 값 |
|---|---|
| 대상 레포 | **JABACK만** |
| 현재 사용 API | `POST /api/admin/organization-applications/{applicationId}/privacy/unmask` (교사) · `POST /api/admin/users/{memberId}/instructor/privacy/unmask` (배정 강사) |
| 대상 화면 | CMS → 제미나이 → 찾아가는 연수 → 승인 연수 상세 → 프로그램 정보 탭 우상단 **개인정보 상세보기** |
| 프로그램 유형 | `GEMINI_TRAINING` 만 |
| 우선순위 | **P2** (버튼은 동작하나 일부 필드가 마스킹된 채로 남음) |
| 작성일 | 2026-10-02 |

---

## 한줄

기관 신청 unmask 응답(`OrganizationApplicationDetailResponse`)에는 교사 **이름·연락처·이메일**만 원문으로 온다. 승인 연수 상세에 표시되는 교사 **자택 주소·정산 계좌번호**, 강사 **자택 주소**는 원문을 받을 API가 없어 상세보기 후에도 마스킹 상태다.

## FE 현황 (이미 반영)

1. 사유 입력 → 교사: `POST /organization-applications/{approvedTrainingId}/privacy/unmask` (`{ reason, programId }`) → `teacherName` · `teacherPhone` · `teacherEmail` 교체
2. 배정 강사: `POST /users/{assignedInstructor.memberId}/instructor/privacy/unmask` → 연락처·이메일 교체. 실패 시 강사만 마스킹 유지
3. 위 두 호출이 각각 감사 로그를 남긴다 (한 번 클릭에 2건)

## 요구사항 (택1, 권장 A)

### A. 승인 연수 전용 unmask (권장)

`POST /api/admin/gemini/trainings/approved/{approvedTrainingId}/privacy/unmask`

- 요청: `AdminPrivacyUnmaskRequest` (`reason`)
- 권한: `PRIVACY_RAW_READ` + 프로그램 scope (기존 기관 신청 unmask와 동일)
- 응답: `GeminiApprovedTrainingDetailResponse`와 같은 스키마에서 아래 필드를 원문으로 채움 (`Cache-Control: no-store`)

| 필드 | 원천 |
|---|---|
| `teacherName` · `teacherPhone` · `teacherEmail` | 기존 기관 신청 unmask와 동일 |
| `teacherHomeAddress` | 교사 `instructor_profile.home_address` |
| `teacherAccountNumber` | `member_bank_account.account_no_encrypted` 복호화 (현재 계좌) |
| `assignedInstructor.phone` · `email` · `homeAddress` | 배정 강사 회원·프로필 |

- 감사 로그 1건에 교사·강사 열람 대상을 함께 기록

### B. 기존 API 확장

- `OrganizationApplicationDetailResponse` unmask 응답에 `teacherHomeAddress` · `teacherAccountNumber` 추가
- 강사 회원 unmask(`/users/{memberId}/instructor/privacy/unmask`) 응답에 `homeAddress` 포함 여부 확인

## 검증

- [ ] 사유 입력 후 교사 자택 주소·계좌번호, 강사 자택 주소가 원문으로 옴
- [ ] `PRIVACY_RAW_READ` 없는 관리자는 403
- [ ] 감사 로그에 사유·대상·programId 기록
- [ ] 응답 헤더 `Cache-Control: no-store`

## FE 참고

- 서비스: `apps/cms/src/features/program/gemini/api/visiting-training/service.ts` (`revealGeminiApprovedTrainingPersonalInfo`) — A 채택 시 단일 호출로 교체 예정
- 화면: `apps/cms/src/features/program/gemini/ui/approved/detail-fullpage-modal.tsx` (`displayedDetail`)
- 기본 상세 계좌번호 마스킹 값 요청은 [gemini-approved-training-detail-empty-fields-backend-prompt-2026-10-02.md](./gemini-approved-training-detail-empty-fields-backend-prompt-2026-10-02.md)
