---
priority: medium
category: process
---

# 일반 프로그램 — 참여 봉사자 · 임직원 자원봉사자 등록 모달

**Scope:** 풀페이지 프로그램 모달 → LNB **프로그램 진행 현황** → **참여 봉사자** → **임직원 자원봉사자 등록**  
**Code:** `register-employee-volunteer-modal.tsx`, `employee-volunteer-session-rows.ts`, `employee-volunteer-registration.ts`, `use-employee-volunteer-registration.ts`, `data/mock/employee-volunteer-registrations.ts`

**Related:** [실적 관리 목록](../../features/education-record/) (`staffVolunteers`, `returningVolunteers`) · [school-detail-attendance-spec](./school-detail-attendance-spec.md) (일정 라벨 resolve 패턴)

---

## 배정 기관 목록

- **승인된 참여 기관만** 셀렉트에 노출 (`approvalStatus === 'approved'`).
- 기관을 선택하면, 해당 기관에 **이미 저장된 임직원 자원봉사자 수**가 있으면 일정별 **신규/재참여 인풋에 이전 값을 채운다**.
- 저장 데이터는 기관 id 기준 (`EmployeeVolunteerInstitutionRegistration`).

---

## 일정 행(그리드) 노출 규칙

프로그램 **공통 정보의 교육 구조**(`generalProgramEducationStructure`, `generalProgramSessionRound`, `scheduleCurriculumPreEducation`, `curriculumSessions`, `scheduleDetails`)에 따라 행을 결정한다. 구현: `resolveEmployeeVolunteerSessionRows`.

| 조건 | 노출 라벨 예 |
|------|----------------|
| **단일 회차** (`sessionRound === 'single'`) | `프로그램 진행` 1행 (일정형/커리큘럼형 무관) |
| 복수 + **사전교육 설정** (`scheduleCurriculumPreEducation`) | 선행 `사전교육` 행 |
| **일정형** (`educationStructure === 'schedule'`) | `scheduleDetails[].name` → 없으면 `scheduleLabel` → `세부 일정 NN` |
| **커리큘럼형** | `curriculumSessions[].sessionLabel` → 없으면 `N회차 교육` |

---

## 입력 필드 규칙

### 신규

- **숫자만** 입력 (`inputMode="numeric"`, `parsePositiveIntInput`, 키보드 숫자 외 차단).
- 입력값은 교육 실적 **`staffVolunteers`(임직원 자원봉사자)** 에 그대로 반영 (기관·일정별 합산).

### 재참여

- **숫자만** 입력 (신규와 동일).
- 입력값은 교육 실적 **`returningVolunteers`(재참여 자원봉사자)** 에 반영.
- **일반 봉사자** 중 `isReturningVolunteer === true` 이고, 해당 **기관·회차**에 배정된 인원은 **임직원 재참여 입력값과 합산**한다.  
  구현: `countGeneralReturningVolunteersForInstitutionSession` + `aggregateEmployeeVolunteerEducationMetrics`.

### 사전교육 일정

- `pre_education` 행: **신규·재참여 모두** `totalParticipants`(총 참가자) 반영분에 합산 (`countsTowardParticipants: true`).

---

## 검증 · 저장

| 상황 | 안내 |
|------|------|
| 기관 미선택 | `PARTICIPATING_EMPLOYEE_VOLUNTEER_REGISTER_SELECT_INSTITUTION_ALERT_MESSAGE` |
| 일정별 신규/재참여 미입력 | `PARTICIPATING_EMPLOYEE_VOLUNTEER_REGISTER_COUNTS_REQUIRED_ALERT_MESSAGE` (0 허용) |
| 등록 완료 | `PARTICIPATING_EMPLOYEE_VOLUNTEER_REGISTER_COMPLETE_ALERT_MESSAGE` |

---

## 교육 실적 집계 (API 연동 시)

Mock는 `registrations` 배열 + `aggregateEmployeeVolunteerEducationMetrics`로 프로그램 단위 합계를 계산한다.  
서버·`/education-records` export 연동 시 동일 규칙을 적용할 것.

```text
for each approved institution registration:
  for each session row:
    staffVolunteers += newCount
    returningVolunteers += returningCount + generalReturningCount(institution, round)
    if pre_education row:
      totalParticipants += newCount + returningCount
```

**제안 API (mock → 실연동):**

```http
PUT /api/v1/programs/{programId}/participating-institutions/{institutionId}/employee-volunteer-counts
Content-Type: application/json

{
  "countsBySessionId": {
    "pre_education": { "newCount": 2, "returningCount": 1 },
    "round_1": { "newCount": 3, "returningCount": 0 }
  }
}
```

---

## 수동 검증 체크리스트

- [ ] 승인 기관만 셀렉트 옵션에 표시
- [ ] 기관 재선택 시 이전 저장값 프리필 (mock: `school-3` / 마포초등학교)
- [ ] 단일 회차 프로그램 → `프로그램 진행` 1행
- [ ] 일정형 복수 → 오리엔테이션/국내대회 등 `scheduleDetails` 라벨
- [ ] 커리큘럼형 복수 + 사전교육 → 사전교육 + N회차 교육 행
- [ ] 신규/재참여 숫자 외 입력 불가
- [ ] 0 포함 전 일정 입력 후 등록 → 완료 안내

**Last updated:** 2026-06-10
