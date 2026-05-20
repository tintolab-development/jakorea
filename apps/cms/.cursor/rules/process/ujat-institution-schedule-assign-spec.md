---
priority: medium
category: process
---

# UJAT 프로그램 상세 — 신청 기관 임시 배정 (`inst_schedule_assign`)

**Scope:** `ujat-program-detail-fullpage-modal` → LNB **기관 신청** → **신청 기관 임시 배정**  
**Code:** `application-institution/schedule-assign/*`

**관련:** [ujat-institution-application-list-table-spec.md](./ujat-institution-application-list-table-spec.md)

---

## 화면 구성

### 상단 — 지역 탭

- [신청 기관] 목록(`inst_all`)과 **동일 UI** (`UjatInstitutionApplicationRegionTabs`).
- 탭별 **레이아웃 동일**, **데이터만 지역 키로 분리**.

### 상단 우측

- **임시 교육 일정표 확인** — `UjatInstitutionScheduleSheetPreviewModal` + `exportScheduleSheetExcel` (지역별 시트, `downloadExcel` / ExcelJS).

### 중앙 — 날짜별 `DetailInfoForm`

#### 노출 날짜

- 프로그램 **교육 진행 일정 기간** 안 **금요일**만 열로 노출.
- 예: 5/1(금)~5/15(금) → `5.1`, `5.8`, `5.15` 3열.
- 프로그램 등록 시 지정한 **교육 진행 불가일**은 목록에서 **제외**.
- mock: `UJAT_INSTITUTION_EDUCATION_PERIOD_MOCK` + `UJAT_INSTITUTION_EDUCATION_UNAVAILABLE_MOCK`.

#### 섹션 헤더

| 요소 | 규칙 |
|------|------|
| 제목 | `M월 D일` |
| `headerNote` | 해당 일 **배정 학급 합계** `N학급` (민트). 0이면 미표시 |
| `titleTrailing` | **[추가 배정]** — 행 추가 |

#### 본문 필드 (행마다)

| 필드 | 내용 |
|------|------|
| 배정 학교 | 학교 셀렉트 + 배정 학급(다중) 셀렉트 |
| 총 학급 수 | 선택 학교·학급 기준 합계. 미선택 시 `학교 및 배정 학급을 선택해 주세요` |

#### 배정 학교 라벨

- 행 **1개**: `배정 학교` (번호 없음).
- 행 **2개 이상**: `배정 학교 01`, `배정 학교 02`, … (2자리).

#### 학교 셀렉트 옵션

- 해당 **날짜**에 **임시 배정(`temp_assigned`)** 된 기관만.
- 그 날짜 `scheduleSlots[iso] === 'O'` (신청 폼 **교육 진행 희망일**).
- 전체 신청 기관 목록이 아님.

#### 배정 학급 셀렉트

- `CmsSelect` `mode="multiple"` — 닫힘: 선택 라벨 쉼표 구분·말줄임, 열림: 검색 + 체크 + 옵션 라벨 pill.
- 선택 학교의 `gradeClassCounts` → 학년·반 단위(`1학년 1반`, `3학년 4반` …) 다중 선택. 상세 「학년 별 신청 정보」와 동일.
- 행 **총 학급 수** = 선택한 학년·반 개수.

---

## 하단 — 배정값 임시 산정

- `CrossTable` (첫 열 기본 200px).
- 안내: `봉사단 교육 일수는 모든 입력값이 작성되어야 계산됩니다.`

| 행 | 1일 최대 교육 학급 수 | 총 학급 수 | 봉사단 수 | 봉사단 교육 진행일 수 |
|----|----------------------|------------|-----------|----------------------|
| 1학기 | **공통 입력** (`rowSpan` 2) — placeholder `예상 최대 학급 수를 입력하세요` | **예상 학급 수** (자동) | 입력 — `예상 봉사단 인원을 입력하세요` | **예상 봉사단 교육 진행일 수** (자동, 산식 결과 숫자) |
| 2학기 | ↑ | **예상 학급 수** (자동) | 입력 | **예상 봉사단 교육 진행일 수** (자동) |

- **학기** = 반기. 상반기 1학기, 하반기 2학기 (날짜 ISO가 해당 반기 기간에 속하면 합산).
- **총 학급 수(예상)**: 해당 학기 날짜들에 배정된 학급 수 **합**.
- **1일 최대 교육 학급 수** — 지역·반기 공통 1개 필드 (`maxClassesPerDay`).
- **봉사단 교육 진행일 수** = `예상 학급 수 × 2 / 예상 봉사단 수` (반올림). **예상 학급 수·봉사단 수**가 있으면 숫자 표시, 미충족 시 placeholder `예상 봉사단 교육 진행일 수`.

### 임시 교육 일정표 미리보기

- **모든 지역·모든 임시 배정 금요일** 열 노출. 해당 일자에 배정 없으면 열 1개·셀 값 `-`.
- 지역별 `CrossTable` — corner `배정 기관 / 날짜`, 열 = 일자, 행 = 기관명 / 배정 학급 / 총 학급 수.
- **배정 학급** 표기 (`formatAssignedGradeClassesDisplay`):
  - 해당 학년 **전체** 배정: `N학년 M학급` (반 목록 생략)
  - 일부·연속: `N학년 M학급(1~7반)`
  - 일부·비연속: `N학년 M학급 (1, 2, 5, 6반)`
- 데이터: `schedule-assign` store 일자별 배정 + 신청 기관 mock.

---

## 데이터·API (TODO)

- [ ] 프로그램별 교육 기간·불가일·반기 구간 API
- [ ] 일자별 배정 CRUD·중복 학교 정책
- [ ] 임시 교육 일정표 확인 산출물

---

**Last updated:** 2026-05-19
