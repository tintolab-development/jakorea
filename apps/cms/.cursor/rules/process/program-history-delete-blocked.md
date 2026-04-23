---
priority: medium
always_include: false
category: process
---

# 프로그램 이력 삭제 — 진행 중 건 차단

다음 화면에서 **이력 삭제** 흐름(삭제 안내 모달 → 확인 입력 후 **[삭제]** 클릭)을 적용할 때:

- 회원 상세 — 프로그램 수강 이력, 프로그램 강의 이력, 봉사 프로그램 참여 이력 (`MemberProgramLectureHistory`)
- 회원 상세 — 프로그램 담당 이력 (`AdminManagedProgramHistory`)
- 후원사 상세 — 프로그램 진행 이력 (`SponsorProgramHistoryPanel`)

## 규칙

- 선택된 행 중 **프로그램 진행 현황이 「프로그램 진행 중」**에 해당하는 건이 하나라도 있으면, 실제 삭제를 수행하지 않는다.
- 판별은 테이블·배지와 동일한 표시용 상태 **`ProgramEnrollmentDisplayStatus === 'EDUCATION_IN_PROGRESS'`** 로 통일한다. (`getEffectiveEnrollmentDisplayStatus` / `getEnrollmentDisplayStatusFromProgramLifecycle` / 봉사 이력용 `deriveVolunteerDisplayStatus` 등 기존 파이프라인 사용)
- 차단 시 **삭제 안내 모달(`DeleteGuideModal`)은 닫고**, `ProgramHistoryDeleteBlockedModal`을 연다.
- 차단 모달 UI·카피:
  - 타이틀: **이력 삭제 불가 안내**
  - 본문: **진행 중인 프로그램 정보는 삭제 불가합니다.**
  - 레이아웃: `InstitutionDeleteBlockedModal` 과 동일 패턴(`ContentModal` 폭 480, **확인** 단일 버튼).

## 구현 참고

- 공통 헬퍼: `isProgramHistoryDeleteBlockedByDisplayStatus` (`@/shared/constants/status`)
- 공통 모달: `ProgramHistoryDeleteBlockedModal` (`@/shared/ui`)
