# 참여 기관 페이지 명세 (스크린샷 기반 개발 위임)

**대상**: 프로그램 상세 풀페이지 모달 > LNB 「프로그램 진행 현황」 > **참여 기관**  
**표시 조건**: URL `lnb=progress&tab=participants`  
**참조**: [participating-institutions-section.tsx](../../../src/features/program/ui/participating-institutions-section.tsx), [participating-schools mock](../../../src/data/mock/participating-schools.ts)

---

## §1 개요

- **목적**: 해당 프로그램에 참여하는 기관(학교) 목록을 조회·필터링하고, 선택 반려/승인 및 교재 배송 현황 변경을 수행한다.
- **사용자**: ADMIN(관리자).
- **표시 위치**: 풀페이지 모달 본문, `activeLnb === 'progress' && activeProgressChild === 'participants'`일 때.

---

## §2 필터 영역

- 5개 필드 + **조회** 버튼을 한 줄에 배치. 조회 클릭 시에만 필터가 적용된다.

| 필터 라벨           | 타입   | placeholder/기본값 | 비고 |
| ------------------- | ------ | ------------------ | ---- |
| 기관명              | Input  | "기관명을 입력하세요" | 텍스트 검색 |
| 기관 지역           | Select | "전체"             | REGION_OPTIONS / participating-schools 지역 목록 재사용 |
| 대상 학년           | Select | "전체"             | GRADE_OPTIONS (1~6학년) 재사용 |
| 교재 배송 현황      | Select | "전체"             | TEXTBOOK_OPTIONS (교재 준비 중/배송 중/배송 완료) 재사용 |
| 담당 교사/강사명    | Input  | "교사/강사명을 입력하세요" | teacherName 검색 |
| (우측)              | Button | **조회**           | primary(teal), 클릭 시 appliedFilters 반영 |

- 필터 상태는 URL 쿼리 파라미터와 연동 권장(기존 appliedFilters 패턴). 기관명 필터 키: `schoolName`.

---

## §3 테이블 영역 레이아웃

- **테이블 타이틀과 동일 레벨 한 줄**:
  - 왼쪽: "교육 참여 기관 목록" + "N건" (필터 적용 후 건수).
  - 오른쪽: **선택 반려** (danger outline), **선택 승인** (primary/teal), **캘린더 뷰로 보기** (outline + 캘린더 아이콘).
- 레이아웃: `program-applicants-tab__table-header` + `program-applicants-tab__table-heading` / `program-applicants-tab__table-actions` 패턴 재사용.

---

## §4 테이블 컬럼

**순서 고정**: 체크박스 | No. | 참여 기관명 | 기관 지역 | 강의 회차 별 교육 진행 날짜 | 대상 학년 | 대상 학급수 | 총 학생수 | 교재 배송 현황 | 담당 교사명 | 담당 강사

- **컬럼 셀 비율**: No.·대상 학년·대상 학급수·총 학생수는 좁게, 참여 기관명·기관 지역·강의 회차 별 교육 진행 날짜·담당 강사는 넓게 width/minWidth 배분. 테이블 래퍼에 **overflow-x: auto** 적용해 가로 스크롤 가능.
- **강의 회차 별 교육 진행 날짜** (td 표시 규칙):
  - 차시 **3개 이하**: 3차시까지 전부 표시(한 줄에 한 차시, 예: "1차시 2026.01.09 (금) 1시간 오프라인 1교시 9:20~10:10").
  - 차시 **4개 이상**: **2개 차시까지만** 표시 후 하단 **"+ 외 N개의 교육 일정"** (N = 전체 차시 수 − 2).
- **교재 배송 현황**: StatusDropdownCell + TextbookStatusBadge 재사용. 셀/트리거 클래스 `textbook-status-dropdown-cell` / `textbook-status-dropdown-trigger` 사용. 행 클릭 시 드롭다운/체크박스 클릭은 제외.

---

## §5 교재 배송 현황 태그/드롭다운

- 상태별 색상: 기존 [textbook-status-badge.css](https://github.com/../../../src/shared/components/textbook-status-badge.css) (preparing/shipping/delivered) 유지.
- 태그 클릭 시 드롭다운 노출, 옵션 선택 시 상태 변경. StatusDropdownCell 사용.

---

## §6 테이블 행 동작

- **행 선택**: 체크박스로 다중 선택. 선택 반려/선택 승인은 선택된 행에 대해 동작(초기 mock: 토스트 또는 목록 상태 갱신).
- **캘린더 뷰로 보기**: 클릭 시 정책에 따라 같은 모달 내 캘린더 전환 또는 `/programs/education/schedule` 등 경로 이동.
- **행 클릭**: 필요 시 SchoolDetailModal 연동. 드롭다운/체크박스 클릭은 행 클릭에서 제외.

---

## §7 재사용 체크리스트

- [ ] useProgressSchoolList / ProgressFilters에 schoolName 필터 추가
- [ ] ParticipatingSchoolRow에 sessions(강의 차시 배열) 필드 추가, mock 생성 시 값 세팅
- [ ] ParticipatingInstitutionsSection에서 program-progress-tab / program-applicants-tab 스타일 재사용
- [ ] 테이블 래퍼 overflow-x: auto, 강의 회차 셀 3차시/2차시+외 N개 규칙 구현
