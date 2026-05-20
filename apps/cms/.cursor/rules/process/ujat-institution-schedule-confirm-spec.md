---
priority: medium
category: process
---

# UJAT 프로그램 상세 — 기관 신청 > 임시 배정 기관 확인

**Scope:** `ujat-program-detail-fullpage-modal` → LNB **기관 신청** → **임시 배정 기관 확인** (`inst_schedule_confirm`)  
**Code:** `application-institution/schedule-confirm/`

**선행:** [신청 기관 목록](./ujat-institution-application-list-table-spec.md) · [임시 배정](./ujat-institution-schedule-assign-spec.md)

---

## 역할

임시 배정(`temp_assigned`) 완료 후, 각 기관이 배정 내용을 확인하고 일정을 **수락** 또는 **재조율**하는 진행 상황을 관리자가 조회한다.

---

## 대상 행

- `tempAssignmentStatus === 'temp_assigned'` 인 기관만 (`build-confirm-rows.ts`)
- 배정 학급·확정 일정: `schedule-assign/store` 우선, 미입력 시 신청 목록(`scheduleSlots`·`gradeClassCounts`) fallback

---

## 일정 확인 현황

| 상태값 | 리스트 라벨 | 캘린더 뱃지 |
|--------|-------------|-------------|
| `institution_checking` | 기관 확인 중 | 확인 중 |
| `institution_confirmed` | 기관 확인 완료 | 확인 완료 |
| `application_rejected` | 신청 반려 | 신청 반려 |

(mock: `ujat-institution-application-mock.ts` — 서울 5개 `UJAT_INSTITUTION_SEOUL_FIXTURES` 단일 소스 · API 연동 시 교체)

---

## 리스트 뷰 열

| 열 | 비고 |
|----|------|
| No. | 역순 |
| 참여 기관명 | |
| 일정 확인 현황 | 상태 뱃지 |
| 교육 진행 확정 일정 | `M월 D일` 콤마 구분 |
| 1~6학년 | 배정 학급 수 `N학급` / `-` (중앙) |
| 총 교육 학급 | `N개` |
| 담당 교사명 | |

**액션:** 캘린더 ↔ 리스트 전환만 (일괄 배정·반려 없음, 행 선택 없음)

---

## 필터

- 참여 기관명
- 일정 확인 현황
- 교육 진행 확정 일정 (`UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES` 기준)
- 담당 교사명

---

## 캘린더 뷰

- 이벤트: 확정 일정 ISO 날짜별 기관명
- 우측 패널: `총 N개 학급 | 확정 일정 목록` · 일정 확인 현황 뱃지
- 신청 기관 탭과 동일 레이아웃 (`calendar-view.css` 공유)
