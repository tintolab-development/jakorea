# 참여 기관 상세 — 출석 관리 (일반 프로그램)

**Where:** 풀페이지 프로그램 모달 → LNB **프로그램 진행 현황** → **참여 기관** → 기관 행 클릭 → **출석 관리** 탭.  
**Code:** `school-detail-attendance-section.tsx`, `school-detail-attendance-session-panel.tsx`, `school-detail-attendance-display.ts`, `use-school-detail-attendance.ts`.

## 회차·일정 라벨 (교육 구조별)

프로그램 `generalProgramEducationStructure`·`generalProgramSessionRound`(또는 variant·commonInfo 보강)에 따라 **회차 패널 제목·[교육 일정] 필터·엑셀 머리글**(출석·과제 공통)과 **강사 신청·참여 강사 캘린더 일정 라벨**의 선행 라벨이 달라진다.

### 회차 ≠ 차시

- **회차** = 교육 일정 단위(`program_schedule.sessionNo`). 복수 회차 프로그램은 회차마다 일정이 있다.
- **차시** = 커리큘럼 수업 단위(`program_curriculum_session`, 「차시 및 교육 내용」). 차시 **개수**를 `N차시`로 쓴다(예: `1회차 (2차시)`, 희망 차시 수 `3차시`).
- 회차 번호(`sessionNo`)·지망 순위·배열 순서·일정 건수를 `N차시`로 쓰지 않는다. 차시 수를 `N회차`로 쓰지 않는다.
- **커리큘럼형 단일 회차는 하루만 진행**한다. 그날 프로그램의 전 차시를 진행하므로 그날 어떤 차시인지 따로 찾지 않고 차시 수 `N차시`로 표시한다.

| 구조 | 선행 라벨 | 소스 | 예시 |
|------|-----------|------|------|
| **사전교육** | `사전교육` | 일정 canonical `scheduleRole` / `educationSlotKey` | `사전교육` |
| **커리큘럼형 · 단일 회차** | `N차시` (차시 수) | 일정 `curriculumSessionCount` → 없으면 `generalCommonInfo.curriculumSessions` 중 사전교육 제외 개수 | `4차시` |
| **커리큘럼형 · 복수 회차** | `N회차`, 차시 수를 알면 `N회차 (K차시)` | N = `sessionNo`(round), K = 일정 `curriculumSessionCount` → 없으면 그 회차 행(`sessionNo` 일치 → 없으면 회차 순번)의 진행 차시 수(`title`) | `1회차 (2차시)`, `2회차` |
| **일정형** | 세부 일정명 | `generalCommonInfo.scheduleDetails[round-1].name` (사전교육 블록 제외) | `오리엔테이션` |

### Fallback

- 커리큘럼형 단일: 차시 수를 모르면 `{round}회차`
- 커리큘럼형 복수: 차시 수를 모르면 `{round}회차`
- 일정형: `name` 없음 → `scheduleLabel` → **`세부 일정 NN`**
- 캘린더(강사 신청·참여 강사): 선행 라벨을 모르면(프로그램 정보 없음, 복수·일정형인데 `sessionNo` 없음) 시간만 표시

### 표시 형식

- **패널 제목 (`table-title`)**: `{선행 라벨} : {날짜(요일)}` — 예: `1회차 (2차시) : 2026.01.09(금)`, `4차시 : 2026.01.09(금)`, `오리엔테이션 : 2026.01.09(금)`
- **필터 [교육 일정] 옵션**: `{선행 라벨} · {날짜(요일)}`
- **엑셀 머리글·파일명**: 패널 `headerPrefix`(선행 라벨 포함)를 그대로 쓴다.
- **캘린더 셀·팝오버·카드**: `{선행 라벨} (HH:mm ~ HH:mm)` — 예: `4차시 (09:20 ~ 11:20)`, `2회차 (2차시) (09:20 ~ 11:20)`
- **16px 메타**: `{N시간} ({교육형태}) | {교육시간}`. 교시가 있으면 `{N교시 (start ~ end) ~ …}`, 없으면 시계 구간. 교육형태 원문(오프라인 등)을 대면으로 바꾸지 않음.

함수(SSOT): `resolveSchoolDetailAttendanceSessionLeadLabel(program, round, schedule?)` — 출석(`school-detail-attendance-api.ts`·`progress-attendance-adapters.ts`)·과제(`progress-assignment-adapters.ts`)·참여 진행 일정명(`participating-school-session-display.ts`)이 같이 쓴다. 캘린더는 `resolveEducationScheduleSessionLeadLabel`·`formatEducationScheduleSessionWithTime`(같은 파일). 라벨 조립은 `formatEducationScheduleUnitLabel`(`shared/lib/education-schedule-name.ts`). 그 밖에 `buildAttendanceSessionHeaderParts`, `buildAttendanceSessionFilterLabel`.  
commonInfo 해석: `resolveGeneralProgramCommonInfo`, `resolveEffectiveGeneralProgramTypeFields`.

## UI·동작 요약

- `FilterTableLayout`: `showTitle={false}`, `hideExcelDownload` — 탭 전역 엑셀 없음.
- 회차별 **[저장]** + **[엑셀]** — 엑셀은 액션 행 **맨 오른쪽**.
- 출결 라디오: `size="large"`.
- 학생 필터(이름·성별·학급·출결) 적용 시 해당 학생이 없는 회차 패널은 숨김.

## UJAT·타 유형

본 규칙은 **`features/program/general/`** 코드 기준. 1사1교 참여 기관 상세 출석·과제도 같은 함수를 쓰며 커리큘럼형·단일 회차 고정이므로 `N차시`(차시 수)로 표시된다. UJAT·Gemini 출석 UI는 각 유형 폴더에서 별도 구현.

**Last updated:** 2026-11-11
