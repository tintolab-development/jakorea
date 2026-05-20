---
priority: medium
category: process
---

# UJAT 프로그램 상세 — 기관 신청 > 기관 신청 목록

**Scope:** `ujat-program-detail-fullpage-modal` → LNB **기관 신청** → **신청 기관** (`inst_all`)  
**Code:** `ujat-institution-application-list.tsx`, `ujat-institution-application-columns.tsx`, `ujat-institution-application-education-schedule.ts`, `ujat-institution-application-mock.ts`, `use-ujat-institution-application-list.ts`

**관련 탭:** [UJAT 프로그램 상세 — 모집 정보 3탭](./ujat-program-detail-recruitment-tabs.md)  
**신청 폼:** 템플릿 `application-ujat-school` — **UJAT 프로그램 학교 신청 폼** (`UJAT-institution` → `ujat-program-application-preferred-education-schedule-paragraph.tsx` · **교육 진행 희망일**)

---

## 화면 위치

| LNB | `tab` | 역할 |
|-----|-------|------|
| 기관 신청 > **신청 기관** | `inst_all` | 신청 목록·일괄 임시 배정·반려 (본 문서) |
| 기관 신청 > **신청 기관 임시 배정** | `inst_schedule_assign` | **상세 임시 배정** (일정·학급 단위 조정) |
| 기관 신청 > **임시 배정 기관 확인** | `inst_schedule_confirm` | 임시 배정 결과 확인 |

---

## 테이블 열 순서 (좌 → 우)

고정·스크롤 열 이후 **「총 신청 학급 수」 열의 우측**부터 날짜 열이 이어진다.

| 순서 | 열 | 비고 |
|------|-----|------|
| (선택) | 체크박스 | 일괄 액션 |
| 1 | No. | 역순 번호 |
| 2 | 신청 기관명 | |
| 3 | **임시 배정 현황** | ~~임시 배정 평가~~ |
| 4 | 학년 별 신청 학급 수 | `1학년 N학급 \| …` |
| 5 | **총 신청 학급 수** | 학년별 학급 수 합산 · `N학급` |
| 6… | **날짜 열** (아래 §) | 프로그램 진행일마다 1열 |
| 마지막 | 신청 교사명 | |

---

## 날짜 열 (교육 진행일)

### 열 헤더

- **정의:** 해당 **UJAT 프로그램이 진행되는 날짜**마다 독립 열 1개.
- **헤더 표기:** `M월 D일` (예: `4월 24일`).
- **데이터 소스:** 관리자가 프로그램 등록·교육 일정에서 설정한 **진행 가능일 / 세션 일자** 목록.  
  - mock: `UJAT_INSTITUTION_EDUCATION_PERIOD_MOCK` 기간 내 금요일 (`listFridayIsoDatesInPeriod`) — **API 연동 시 프로그램 실제 진행일 배열로 교체** (금요일만이 아닐 수 있음).
- **코드:** `UJAT_INSTITUTION_SCHEDULE_COLUMNS`, slot key = ISO `YYYY-MM-DD`.

### 셀 값 `O` / `-`

| 표시 | 의미 |
|------|------|
| **`O`** | 해당 기관이 **[UJAT 프로그램 학교 신청 폼]** 참여 신청 시 선택한 **「교육 진행 희망일」**에 포함된 날짜 |
| **`-`** | 해당 날짜 미선택 |

- 신청 폼 단락: `ujat-program-application-preferred-education-schedule-paragraph.tsx` (**교육 진행 희망일**).
- 목록 행: `scheduleSlots[isoDate] === 'O'`.
- 캘린더 뷰: `O`인 날짜만 일정 이벤트 (`ujat-institution-application-calendar-events.ts`).

### 총 신청 학급 수 (참고)

- **정의:** 해당 기관이 신청한 **모든 학년** 학급 수 **합산**.
- **표시:** `N학급`.
- **데이터:** `gradeClassCounts` 합 = `totalClassCount` · `sumGradeClassCounts()`.

---

## 임시 배정 열 · 상태

| 상태값 | UI 라벨 |
|--------|---------|
| `evaluation_pending` | 평가 대기 |
| `temp_rejected` | 임시 반려 |
| `temp_assigned` | **임시 배정** |
| `application_rejected` | 신청 반려 |

- 열 제목: **「임시 배정 현황」** (구 「임시 배정 평가」). 필터 라벨과 동일.
- 배지: `UjatInstitutionApplicationStatusBadge`.

---

## 일괄 액션 — [선택 임시 배정]

- **버튼:** 목록 상단 **「선택 임시 배정」** (`handleBulkTempAssign`).
- **동작 (기획):**
  1. **확인 모달(기관 임시 배정 안내) 없이** 즉시 처리.
  2. 선택 기관 상태를 **`temp_assigned`(임시 배정)** 으로 변경.
  3. **`useCmsAlert`** — 제목 `임시 배정 완료`, 본문 단건/다건 안내.
  4. (API) 해당 기관 **교육 진행 희망일(`O`)** 기준 임시 배정·교사 알림.
- **mock 한계:** 현재는 상태(`tempAssignmentStatus`)만 패치. **일자별 배정 슬롯·학급 수 배분**은 API·`inst_schedule_assign` 탭 연동 시 구현.
- **상세 배정:** 학급·시간대 등 **세부 조정은 [신청 기관 임시 배정]** 탭(`inst_schedule_assign`)에서 진행. 목록 탭은 **1차 일괄 임시 배정** 용도.

### 기타 일괄 버튼

| 버튼 | 결과 상태 |
|------|-----------|
| 선택 신청 반려 | `application_rejected` |
| 선택 임시 반려 | `temp_rejected` |

반려 모달: `ujat-institution-application-action-modal.tsx` · `PermissionRejectModal` (신청 반려·임시 반려만).  
**임시 배정**(목록·상세): 확인 모달 없음 → `temp_assigned` 즉시 반영 → `useCmsAlert` **임시 배정 완료** (`ujat-institution-application-temp-assign-complete.ts`).

---

## 구현 메모

- 테이블 `scroll.x`: 선택 + 고정 열 + `92px × 날짜 열 수`.
- API 연동 시:
  - 프로그램 **진행일 목록** → 날짜 열 동적 생성.
  - 기관별 **교육 진행 희망일** → `O`/`-` 매핑.
  - **선택 임시 배정** → 희망일(`O`) 기준 임시 배정 레코드 생성 + 상태 갱신.
- 필터 「임시 배정 현황」: 상태 라벨과 동일 용어 유지.

---

## 신청 기관 상세 — 기본 정보

- **레이아웃:** `DetailInfoForm` — (1) **임시 배정 현황**, (2) **기본 정보**.
- **교육 진행 희망일:** 상세 조회에 신청 폼과 동일한 날짜 목록 표시 (`ujat-institution-application-detail-view.tsx`).
- **임시 배정 현황 색:** 목록과 동일 배지 CSS.
- **개인정보 마스킹** (`personalInfoRevealed` 전): Tel·M 가운데 4자리 `*`, E-mail `@` 앞 3자리+`***`. 기관 소재지·상세 주소는 마스킹 없음.

---

## TODO (코드 ↔ 기획 갭)

- [x] 열 제목 **`임시 배정 현황`** (`ujat-institution-application-columns.tsx` · 필터와 동일)
- [ ] 날짜 열: mock 금요일 → **프로그램 진행일** API
- [ ] `temp_assign` 확인 시 **O 표시 일자**에 대한 배정 데이터 생성 (mock/API)
- [ ] `inst_schedule_assign` 상세 배정 UI·기획서 연동

---

**Last updated:** 2026-05-19
