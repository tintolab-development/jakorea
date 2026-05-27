---
priority: medium
category: process
---

# UJAT 교육 진행 — 참여 봉사자 상세 · 교육 배정 및 진행 현황 탭

**Scope:** `ujat-program-detail-fullpage-modal` → LNB **교육 진행** → **참여 봉사자** → 행 클릭 상세  
**Code:** `progress/volunteers/detail/detail-view.tsx`, `progress/volunteers/detail/assignment-*.tsx`, `assignment-mock.ts`, `assign-modal.tsx`  
**URL:** `UJAT_EDU_VOL_ID_PARAM`, `UJAT_EDU_VOL_TAB_PARAM` (`assignment_progress`)

**관련:** [Status dropdown cell](../coding/status-dropdown-cell.md) · 관리자 회원 목록 권한 유형 열과 동일 `StatusDropdownCell` (`tagLayout="tag160"`)

---

## 탭·헤더 액션

| 탭 | `tab` | 헤더 버튼 (우측, `program-detail-fullpage-modal__header-actions`) |
|----|-------|---------------------------------------------------------------------|
| 신청 정보 | `application` | 활동 포기 · 활동인증서 · 수료증/참여 · 정보 수정 · 개인정보 상세보기 |
| **교육 배정 및 진행 현황** | `assignment_progress` | **배정 취소** · **출결 정정** · **파트너 및 교육 배정** |

**[파트너 및 교육 배정]** (테이블에서 교육 일정 1행 선택 필수):
- 배정 기관 없음(`assignedInstitution` `-`) 또는 **배정 학급 미지정** → **교육 배정** 모달 (`mode: education`)
- 배정 기관·배정 학급 모두 있음 → **파트너 배정** 모달 (`mode: partner`, 배정 학급 disabled·기존 학급 표시)

미연동 액션(배정 취소·출결 정정)은 `FEATURE_COMING_SOON_ALERT_MESSAGE` 안내.

---

## 교육 배정 및 진행 현황 테이블

열 순서 (좌 → 우):

| 열 | 표기·동작 |
|----|-----------|
| (선택) | 체크박스 · **활동 포기 행은 disabled** |
| No. | 정렬 후 1부터 (활동 포기 행은 하단 고정 후 번호 재부여) |
| 교육 진행 일정 | `scheduleLabel` |
| 역할 | `해당 없음` / `출결 담당` — 아래 §역할 |
| 배정 기관 | 기관명 · `-`(미배정) |
| 파트너명 | 이름 · **미정**(학급 배정·파트너 미정) · `-`(학급 미배정) |
| 배정 학급 | 학급 라벨 · `-`(미배정·교육 미진행) · **활동 포기**(빨간 텍스트) |
| 출결 현황 | 출석 · **지각 (H:MM)** · 사유 불참 · `-` |
| 교육계획서 제출 현황 | `CmsButton` **variant `default`**, **width 140** · 조건 미충족 시 **disabled** |
| 교육일지 제출 현황 | `CmsButton` **variant `default`**, **width 140** · 조건 미충족 시 **disabled** |
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

### 활동 포기 (배정 학급)

- **배정 학급** 열: `classDisplay.kind === 'withdrawn'` → `활동 포기` (빨간색).
- 정렬: `classDisplay.kind === 'withdrawn'` 행만 No.와 무관하게 **테이블 최하단**.
- **흰색 오버레이**(`row--class-withdrawn`): **배정 학급이 활동 포기인 행만** 적용. `isWithdrawn`만 true이고 학급이 `5-1` 등인 행은 오버레이 없음.
- 오버레이 행: 체크박스 비활성. `isWithdrawn`은 역할 변경·교육계획서/일지 보기 제한 등에 별도 사용.

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

| 섹션 | 노출 조건 | 내용 |
|------|-----------|------|
| 출결 관련 정보 | 항상 | 수료 여부 · 지각 횟수 (2열 요약 테이블) |
| **불참 사유** | 배정 테이블 **출결 현황**에 `사유 불참`(`attendance.kind === 'excused_absence'`)이 **1건 이상** | 아래 §불참 사유 |

### 불참 사유

- **제출 이력 있음:** `program-detail-info-tab__table` 4열 격자 — `일자(th)` · `사유(td)` · `증빙 서류(th)` · `파일(td)`. `th` 배경 `#F2F3F5`. 증빙 없으면 파일 열 `-`만 표기. 파일은 `NoticeAttachmentDownloadIcon` + 파일명 링크 버튼.
- **제출 이력 없음:** 회색 빈 블록(높이 100px, `border-radius: 8px`, `border: 1px solid var(--table-line)`, `background: rgba(61,61,61,0.02)`, 문구 `사유 기재 후 불참한 이력이 없습니다.`, 20px/500, `opacity: 0.5`).
- mock: 박틴토 `park-tinto` — 2건(5월 8일·5월 29일). 그 외 프로필 중 `사유 불참`만 있고 `absenceReasons` 빈 배열이면 빈 블록.

---

## 교육·파트너 배정 모달 (`assign-modal.tsx`)

공통 레이아웃·`mode: 'education' | 'partner'`.

| mode | 제목 | 설명 문구 | 배정 학급 | 파트너 |
|------|------|-----------|-----------|--------|
| education | 교육 배정 | `[이름] 봉사자를 [M월 D일] 교육에 배정하시겠습니까?` | 해당 일자 **봉사자 미배정 학급**만 선택 | 미배정 학생, 배정일 적은 순 · `이름 (배정일 : N일)` |
| partner | 파트너 배정 | `[이름] 봉사자의 [M월 D일] 교육 파트너로…` | 교육 배정 학급 **disabled** 표시 | 동일 정렬·표기 |

파트너 정렬: `assignmentDayCount` 오름차순 → 동률 시 **해당 봉사자와 파트너 이력 없음** 우선.

확인 버튼 라벨: **배정**. mock: `assign-mock.ts`.

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
