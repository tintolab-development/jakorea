---
priority: medium
category: process
---

# 일반 프로그램 — 참여 강사 상세 · 활동 포기

**Scope:** 풀페이지 프로그램 모달 → LNB **프로그램 진행 현황** → **참여 강사** → 행 클릭 상세 → **신청 정보** 탭  
**Code:** `participating-instructor-fullpage-view.tsx`, `participating-instructor-activity-withdraw-modal.tsx`, `participating-instructor-activity-withdraw.ts`, `data/mock/participating-instructors.ts`

**Related:** [실적 관리 목록](../../features/education-record/) · [Participating institution textbook spec](./participating-institution-textbook-spec.md) (실적 취합 학년)

---

## 비즈니스 규칙

### 활동 포기 가능 조건

- **기관 사유**(`reason: 'institution'`)로만 CMS에서 활동 포기 처리한다.
- 이미 활동 포기된 강사는 재처리 불가 — `PARTICIPATING_INSTRUCTOR_ALREADY_ACTIVITY_WITHDRAWN_ALERT_MESSAGE` 안내.

### 처리 결과

1. 강사 참여 상태를 **활동 포기**로 기록한다 (`activityWithdrawn: true`).
2. **교육 일정이 있는 경우** — 모달에서 **활동 중단일**을 선택한다.
3. **실적 반영**
   - **활동 중단일(선택 일정)까지** 교육 실적·집계에 **포함**한다.
   - **이후 일정**은 실적·집계에 **반영하지 않는다**.
4. **교육 일정이 없는 경우** — 활동 중단일 선택 없이 확인 입력(`활동 포기`)만으로 즉시 포기 처리한다.

### 실적 집계 연동 (API)

Mock는 `performanceIncludedScheduleIds` 배열로 포함 일정 id를 저장한다.  
API 연동 시 아래와 동일 규칙을 **education-record / performance aggregation**에 적용할 것.

| 필드 | 설명 |
|------|------|
| `activityWithdrawn` | 활동 포기 여부 |
| `activityWithdrawReason` | `'institution'` (기관 사유) |
| `activityWithdrawStopScheduleId` | 활동 중단일 일정 id (일정 없으면 `null`) |
| `activityWithdrawStopScheduleLabel` | 중단일 표시 라벨 |
| `performanceIncludedScheduleIds` | 실적 포함 일정 id 목록 (중단일까지, 순서 유지) |

**집계 로직 (서버·export 공통):**

```text
schedules = program.participatingInstructorEducationSchedules(instructorId) // 날짜 오름차순
stopIndex = schedules.findIndex(s => s.id === stopScheduleId)

if stopScheduleId == null:
  included = schedules where progress in (completed, in_progress)
else if stopIndex >= 0:
  included = schedules[0 .. stopIndex]  // 중단일 포함
else:
  included = []

performance metrics ← only sessions in included
```

**제안 API (mock → 실연동):**

```http
POST /api/v1/programs/{programId}/participating-instructors/{instructorId}/activity-withdraw
Content-Type: application/json

{
  "reason": "institution",
  "stopScheduleId": "pi-sched-2"   // optional — 일정 없으면 생략
}
```

**Response:** 갱신된 참여 강사 DTO + `performanceIncludedScheduleIds`.

실적 관리(`/education-records`) export·합계 탭 집계 시 위 `performanceIncludedScheduleIds` 또는 동일 서버 규칙으로 **포기 이후 회차·학생 수·강사 실적을 제외**한다.

---

## UI

### 신청 정보 탭 헤더 — 활동 포기 버튼

| 항목 | 값 |
|------|-----|
| variant | `delete` |
| width | 140 |
| disabled | 이미 포기됨 · 정보 수정 중 · 코멘트 작성 중 |

### 활동 포기 모달

- 제목: `활동 포기 안내`
- 확인 입력: `[활동 포기]` 키워드 (UJAT 활동 포기 모달과 동일)
- **활동 중단일** `CmsSelect` — `getParticipatingInstructorEducationSchedules(instructorId)` 옵션
- 일정 없으면 중단일 필드 숨김
- 완료 alert **미표시** (저장·코멘트와 동일 — UI만 전환)

---

## Mock

- 교육 일정: `getParticipatingInstructorEducationSchedules` — `instructor-1`, `instructor-2`에 4회차 샘플
- 저장: `patchParticipatingInstructorActivityWithdraw`
- 비즈니스 헬퍼: `applyParticipatingInstructorActivityWithdraw`, `resolveParticipatingInstructorPerformanceIncludedScheduleIds`

---

## 수동 검증

- [ ] 일정 있는 강사(`instructor-1`) — 중단일 선택 + 키워드 입력 후 포기
- [ ] 일정 없는 강사 — 중단일 필드 없이 포기
- [ ] 포기 후 버튼 disabled, 재클릭 시 안내 alert
- [ ] 정보 수정·코멘트 작성 중 포기 버튼 disabled
- [ ] `performanceIncludedScheduleIds`가 중단일까지 id만 포함 (mock devtools)

**Last updated:** 2026-06-09
