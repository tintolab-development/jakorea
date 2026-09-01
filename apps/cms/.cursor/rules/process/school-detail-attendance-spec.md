# 참여 기관 상세 — 출석 관리 (일반 프로그램)

**Where:** 풀페이지 프로그램 모달 → LNB **프로그램 진행 현황** → **참여 기관** → 기관 행 클릭 → **출석 관리** 탭.  
**Code:** `school-detail-attendance-section.tsx`, `school-detail-attendance-session-panel.tsx`, `school-detail-attendance-display.ts`, `use-school-detail-attendance.ts`.

## 회차·일정 라벨 (교육 구조별)

프로그램 `generalProgramEducationStructure`(또는 variant·commonInfo 보강)에 따라 **회차 패널 제목·필터·엑셀**의 선행 라벨이 달라진다.

| 교육 구조 | 선행 라벨 소스 | 예시 |
|-----------|----------------|------|
| **커리큘럼형** (`curriculum`) | `generalCommonInfo.curriculumSessions[round-1].sessionLabel` | `1회차`, `2회차`, `1차시` |
| **일정형** (`schedule`) | `generalCommonInfo.scheduleDetails[round-1].name` | `오리엔테이션`, `온라인 워크숍` |

### Fallback

- 커리큘럼형: `sessionLabel` 없음 → **`${round}회차`**
- 일정형: `name` 없음 → `scheduleLabel` → **`세부 일정 NN`**

### 표시 형식

- **패널 제목 (`table-title`)**: `{선행 라벨} : {날짜(요일)}` — 예: `1회차 : 2026. 01. 09(금)`, `오리엔테이션 : 2026. 01. 09(금)`
- **필터 [교육 일정] 옵션**: `{선행 라벨} · {날짜(요일)}`
- **16px 메타 (`table-description`)**: `{시간} ({대면/온라인}) | {교시 구간}` — 교육 구조와 무관

함수: `resolveSchoolDetailAttendanceSessionLeadLabel`, `buildAttendanceSessionHeaderParts`, `buildAttendanceSessionFilterLabel`.  
commonInfo 해석: `resolveGeneralProgramCommonInfo`, `resolveEffectiveGeneralProgramTypeFields`.

## UI·동작 요약

- `FilterTableLayout`: `showTitle={false}`, `hideExcelDownload` — 탭 전역 엑셀 없음.
- 회차별 **[저장]** + **[엑셀]** — 엑셀은 액션 행 **맨 오른쪽**.
- 출결 라디오: `size="large"`.
- 학생 필터(이름·성별·학급·출결) 적용 시 해당 학생이 없는 회차 패널은 숨김.

## UJAT·타 유형

본 규칙은 **`features/program/general/`** 전용. UJAT·1사1교·Gemini 출석 UI는 각 유형 폴더에서 별도 구현.

**Last updated:** 2026-06-05
