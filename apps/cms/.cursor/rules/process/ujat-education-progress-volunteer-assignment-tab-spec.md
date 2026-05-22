---
priority: medium
category: process
---

# UJAT 교육 진행 — 참여 봉사자 상세 · 교육 배정 및 진행 현황 탭

**Scope:** `ujat-program-detail-fullpage-modal` → LNB **교육 진행** → **참여 봉사자** → 행 클릭 상세  
**Code:** `progress/volunteers/detail/ujat-education-progress-volunteer-detail-view.tsx`, `ujat-education-progress-volunteer-assignment-*.tsx`, `ujat-education-progress-volunteer-assignment-mock.ts`  
**URL:** `UJAT_EDU_VOL_ID_PARAM`, `UJAT_EDU_VOL_TAB_PARAM` (`assignment_progress`)

**관련:** [Status dropdown cell](../coding/status-dropdown-cell.md) · 관리자 회원 목록 권한 유형 열과 동일 `StatusDropdownCell` (`tagLayout="tag160"`)

---

## 탭·헤더 액션

| 탭 | `tab` | 헤더 버튼 (우측, `program-detail-fullpage-modal__header-actions`) |
|----|-------|---------------------------------------------------------------------|
| 신청 정보 | `application` | 활동 포기 · 활동인증서 · 수료증/참여 · 정보 수정 · 개인정보 상세보기 |
| **교육 배정 및 진행 현황** | `assignment_progress` | **배정 취소** · **출결 정정** · **파트너 및 교육 배정** |

미연동 액션은 `FEATURE_COMING_SOON_ALERT_MESSAGE` 안내.

---

## 교육 배정 및 진행 현황 테이블

열 순서 (좌 → 우):

| 열 | 표기·동작 |
|----|-----------|
| (선택) | 체크박스 · **활동 포기 행은 disabled** |
| No. | 정렬 후 1부터 (활동 포기 행은 하단 고정 후 번호 재부여) |
| 교육 진행 일정 | `scheduleLabel` |
| 역할 | `해당 없음` / `출결 담당` — 아래 §역할 |
| 파트너명 | 이름 · **미정**(학급 배정·파트너 미정) · `-`(학급 미배정) |
| 배정 학급 | 학급 라벨 · `-`(미배정·교육 미진행) · **활동 포기**(빨간 텍스트) |
| 출결 현황 | 출석 · **지각 (H:MM)** · 사유 불참 · `-` |
| 교육계획서 제출 현황 | `교육계획서 보기` — 조건 미충족 시 **disabled** |
| 교육일지 제출 현황 | `교육일지 보기` — 조건 미충족 시 **disabled** |
| 교육 진행 현황 | 교육 완료 · 교육 예정 · `-` |

### 텍스트 색 (토큰)

| 열 | 조건 | CSS 변수 |
|----|------|----------|
| 파트너명 | 미정 | `--color-mint-01` |
| 배정 학급 | 활동 포기 | `--color-red` |
| 출결 현황 | 지각 | `--color-red` |
| 출결 현황 | 사유 불참 | `--color-blue` |

### 교육계획서·교육일지 보기 버튼 활성화

다음 **모두** 만족할 때만 enabled (`educationPlanSubmitted` / `educationLogSubmitted` 각각 true):

- 활동 포기 행이 아님 (`!isWithdrawn`)
- 배정 학급이 `-`·활동 포기가 아님 (`classDisplay.kind === 'class'`)
- 교육 진행 현황이 **교육 완료** (`educationProgress === 'completed'`)

### 활동 포기 행

- `isWithdrawn: true` · `classDisplay.kind === 'withdrawn'` → **배정 학급** 열에 `활동 포기` (빨간색).
- 정렬: `sortVolunteerAssignmentRows` — **활동 포기 행은 No.와 무관하게 테이블 최하단**.
- 행 클래스 `ujat-volunteer-assignment-table__row--withdrawn`: 셀 `pointer-events: none`, **흰색 오버레이** `rgba(255,255,255,0.55)` (`::after`).
- 역할 드롭다운·체크박스·보기 버튼 비활성.

---

## 역할 열

- UI: `StatusDropdownCell` + 커스텀 배지 `.ujat-volunteer-assignment-role-badge` (100×32, `border-radius: 6px`, 12px/600).
- **해당 없음:** `#F2F3F5` 배경, `#3D3D3D` 텍스트, `rgba(61,61,61,0.1)` 테두리.
- **출결 담당:** `#E6F2F7` 배경, `--color-blue` 텍스트·테두리.
- 헤더·셀: `STATUS_DROPDOWN_CELL_TAG_160_*` (`tagLayout="tag160"`).

### 출결 담당 단일 지정 (프로그램당 1명)

새 행을 **출결 담당**으로 변경하면, **동일 테이블(동일 봉사자·프로그램 세션 목록) 내** 기존 출결 담당은 자동으로 **해당 없음**으로 변경.  
활동 포기 행(`isWithdrawn`)은 역할 변경 대상에서 제외.

---

## 하단 블록

| 섹션 | 내용 |
|------|------|
| 출결 관련 정보 | 수료 여부 · 지각 횟수 (2열 요약 테이블) |
| 불참 사유 | 일자·사유·증빙 PDF 다운로드 (mock: 박틴토 `park-tinto` 2건) |

---

## Mock

- `getUjatVolunteerAssignmentProgressBundle(volunteerRowId)` — `parseEducationProgressVolunteerProfileId` → `park-tinto`일 때 스크린샷 8행·출결 요약·불참 사유.
- 그 외 프로필: 단순 기본 행 세트 (`DEFAULT_ASSIGNMENT_ROWS`).
- 역할 변경은 **테이블 로컬 state**만 반영 (mock 영속 API 없음).

---

## 구현 체크리스트

- [ ] 탭 전환 시 헤더 버튼 분기 (`application` vs `assignment_progress`)
- [ ] 활동 포기 행 하단·오버레이·비활성
- [ ] 출결 담당 지정 시 기존 담당 → 해당 없음
- [ ] 미정 mint / 지각·활동 포기 red / 사유 불참 blue
- [ ] 교육계획서·일지 보기 disabled 조건
