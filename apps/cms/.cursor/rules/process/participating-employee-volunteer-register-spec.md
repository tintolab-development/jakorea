---
priority: medium
category: process
---

# 일반 프로그램 — 참여 봉사자 · 임직원 자원봉사자 등록 모달

**Scope:** 풀페이지 프로그램 모달 → LNB **프로그램 진행 현황** → **참여 봉사자** → **임직원 자원봉사자 등록**  
**Code:** `register-employee-volunteer-modal.tsx`, `employee-volunteer-session-rows.ts`, `employee-volunteer-registration.ts`, `employee-volunteer-counts-remote.ts`, `use-employee-volunteer-registration.ts`, `program-progress-api-client.ts`

**Related:** [실적 관리 목록](../../features/education-record/) (`staffVolunteers`, `returningVolunteers`) · [school-detail-attendance-spec](./school-detail-attendance-spec.md) (일정 라벨 resolve 패턴)

---

## 배정 기관 목록

- **승인된 참여 기관만** 셀렉트에 노출 (`approvalStatus === 'approved'`, 진행 현황 참여 기관 목록).
- 기관을 선택하면 `GET /api/admin/programs/{programId}/employee-volunteer-counts?organizationApplicationId=` 로 조회하고, `confirmed === true` 일정만 신규/재참여 인풋에 채운다 (`confirmed === false` 는 미등록).
- 개인 프로그램은 `organizationApplicationId` 쿼리·PUT body 생략.
- 저장 데이터는 기관 id(또는 개인 프로그램 스코프 id) 기준 (`EmployeeVolunteerInstitutionRegistration`).

---

## 일정 행(그리드) 노출 규칙

프로그램 **공통 정보의 교육 구조**(`generalProgramEducationStructure`, `generalProgramSessionRound`, `scheduleCurriculumPreEducation`, `curriculumSessions`, `scheduleDetails`)에 따라 행을 결정한다. 구현: `resolveEmployeeVolunteerSessionRows`.

| 조건 | 노출 라벨 예 |
|------|----------------|
| **단일 회차** (`sessionRound === 'single'`) | `프로그램 진행` 1행 (일정형/커리큘럼형 무관) |
| 복수 + **사전교육 설정** (`scheduleCurriculumPreEducation`) | 선행 `사전교육` 행 |
| **일정형** (`educationStructure === 'schedule'`) | `scheduleDetails[].name` → 없으면 `scheduleLabel` → `세부 일정 NN` (기관·개인 동일, **N회차 변환 없음**) |
| **커리큘럼형** | `curriculumSessions[].sessionLabel` → 없으면 `N회차 교육` |
| **기관 + 복수 + 커리큘럼** | `1회차 교육`, `2회차 교육` … (사전교육 행은 `사전교육`) |

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

## API (SSOT)

```http
GET  /api/admin/programs/{programId}/employee-volunteer-counts
PUT  /api/admin/programs/{programId}/employee-volunteer-counts
```

- PUT `entries`는 GET이 반환한 **전체 유효 scheduleId** 집합과 일치해야 한다 (`employee-volunteer-counts-remote.ts`).
- `reason`: `CMS 참여 봉사자 임직원 자원봉사자 인원 등록` (필수).
- 일정 매핑: GET `entries[].scheduleName` · dashboard `scheduleName` 우선, `sessionNo`는 유일할 때만 보조. 실패·집합 불일치 시 저장 차단(임의 scheduleId 대체 금지).
- `progressRemoteEnabled` 비활성 시 저장·완료 처리 금지.

## 교육 실적 집계 (화면 표시)

프로그램 상세·실적 관리는 **서버 실적**을 SSOT로 본다.  
`aggregateEmployeeVolunteerEducationMetrics`는 진행 현황 UI 보조 합산용이며, 임직원 PUT 직후 자동 실적 재산출 API를 호출하지 않는다.

```text
for each approved institution registration:
  for each session row:
    staffVolunteers += newCount
    returningVolunteers += returningCount + generalReturningCount(institution, round)
    if pre_education row:
      totalParticipants += newCount + returningCount
```

## DEV E2E 체크리스트 (수동 · JWT 실인증)

**순서:** 수량 수정·재조회·0명 저장을 먼저 수행하고, **실적 재산출·원장 생성 검증은 마지막**에 한다(원장 생성 후 수정 차단).

1. 관리자 JWT 로그인(MFA `000000` 로컬)
2. 승인 기관 목록·셀렉트(승인 기관만)
3. 개인 프로그램 — 기관 셀렉 없음, PUT/GET `organizationApplicationId` 생략
4. 기관 프로그램 — `organizationApplicationId` 일치 저장
5. OSA 없는 승인 기관 등록(프론트 선행 차단 없음)
6. 신규·재참여 입력, 0명 저장
7. `confirmed=false` 미등록 vs `confirmed=true`+0명 구분
8. 기관 전환·재선택 시 값·race 없음
9. 일정별 `scheduleId` ↔ 화면 행 일치(네트워크 탭 PUT `entries`)
10. 저장 후 GET 재조회·캐시(schedules / program detail / performance invalidate)
11. 일반 봉사자 재참여 합산(실적 BE, PARTIAL fixture 주의)
12. 사전교육 실적
13. **마지막:** 실적 재산출 → performance_record → Excel/실적 화면
14. 원장 생성 후 수정 → `EMPLOYEE_VOLUNTEER_PERFORMANCE_ALREADY_REBUILT` 안내

자동 E2E는 스테이징 데이터·권한에 의존하므로 CI 미포함.

## 수동 검증 체크리스트 (UI)

- [ ] 승인 기관만 셀렉트 옵션에 표시
- [ ] 개인 프로그램 — 배정 기관 셀렉 비노출, 일정만 입력
- [ ] 기관 재선택 시 서버 저장값 프리필
- [ ] 단일 회차 프로그램 → `프로그램 진행` 1행
- [ ] 일정형 복수 → `scheduleDetails` 실제 일정명 (오리엔테이션·국내대회 등)
- [ ] 기관 복수 커리큘럼 → `N회차 교육`
- [ ] 커리큘럼형 복수 + 사전교육 → 사전교육 + N회차 교육 행
- [ ] 신규/재참여 숫자 외 입력 불가
- [ ] 0 포함 전 일정 입력 후 등록 → `등록되었습니다.`

**Last updated:** 2026-10-11
