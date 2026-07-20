---
priority: high
category: process
---

# 일반 프로그램 — 봉사자 2차 면접 심사 현황 (자동·수동)

**Scope:** `봉사자 신청 목록` → **2차 면접 대상자** (리스트·캘린더·상세)  
**Code:** `general-volunteer-interview2-display.ts`, `interview2-columns.tsx`, `volunteer-doc-screening-filter-fields.ts`, `use-general-interview2-effective-status-tick.ts`

---

## 2차 면접 심사 현황 종류

| 표시 | 저장 키 | 분류 |
|------|---------|------|
| 면접 진행 대기 | `waiting` | **자동** |
| 면접 진행 완료 | `completed` | **자동** |
| 면접 합격 | `pass` | 수동 |
| 면접 불합격 | `fail` | 수동 |
| 예비 1 ~ 4 | `reserve1` ~ `reserve4` | 수동 |
| 활동 포기 | `withdrawn` | 면접일 배정 `interviewAssignmentStatus` |

---

## 자동 상태 — 면접 진행 대기 / 면접 진행 완료

**DB/API에 `waiting`·`completed`를 저장하지 않는다.** 화면·필터·캘린더는 **유효 심사 현황(effective status)** 으로 계산한다.

### 판별 기준

- 기준 시각: **배정된 면접일 + 면접 시간 종료 시각** (`assignedInterviewDateLabel` + `assignedInterviewTime` 끝 시각)
- **현재 시각 < 종료 시각** → `면접 진행 대기`
- **현재 시각 ≥ 종료 시각** → `면접 진행 완료`
- 면접일·시간 파싱 불가 → `면접 진행 대기` (fallback)

### 수동 상태 우선

다음이 **저장된 경우** 면접 종료 시각과 무관하게 저장값을 그대로 표시한다.

- `pass`, `fail`, `reserve1`, `reserve2`, `reserve3`, `reserve4`

### 활동 포기

`interviewAssignmentStatus === 'withdrawn'` 이면 심사 현황은 **활동 포기** (`withdrawn`).

---

## UI 반영

| 화면 | 반영 방식 |
|------|-----------|
| 2차 면접 대상자 **리스트** — 심사 현황 열 | `resolveGeneralEffectiveSecondInterviewStatus` |
| **필터** — 2차 면접 심사 현황 | 동일 함수로 필터링 |
| **캘린더** — 셀 팝오버·우측 목록 | 동일 |
| **상세** — 기본정보 심사 현황 | 동일 |
| **실시간 전환** | `useGeneralInterview2EffectiveStatusTick` — 다음 전환 시각(또는 최대 60초)마다 재렌더 |

수동 합격/불합격/예비 처리·활동 포기는 기존 액션·mock patch 로 **저장값**을 갱신한다.

---

## 구현 참고

- 유효 심사 현황: `resolveGeneralEffectiveSecondInterviewStatus(row, now?)`
- 면접 슬롯 종료 파싱: `parseGeneralInterviewSlotEnd`
- 자동 갱신 훅: `useGeneralInterview2EffectiveStatusTick(rows)` — 목록 훅·상세 화면에서 호출

---

## Related

- [general-program-type-variant-spec.md](./general-program-type-variant-spec.md)
- `volunteer-screening-constants.ts` — `GENERAL_SECOND_INTERVIEW_SCREENING_STATUS_LABELS`

**Last updated:** 2026-06-08
