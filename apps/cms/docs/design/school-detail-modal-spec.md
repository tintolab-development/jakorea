# 학교 상세 정보 모달 명세 (디자이너/기획 → 개발 전달)

**대상**: 프로그램 상세 > 프로그램 진행현황 > 참여 학교 정보 탭  
**트리거**: 수강 참여 학교 목록 테이블 **행 클릭** 시  
**참조 시안**: 스크린샷 (학교 상세 정보 모달, 기본 정보 탭)

---

## 1. 모달 사양

| 항목          | 값                             | 비고                                               |
| ------------- | ------------------------------ | -------------------------------------------------- |
| **컴포넌트**  | `TealHeaderModal`              | 기존 공용 모달 재사용                              |
| **size**      | `large`                        | width 1400px, 바디 최대 높이 840px, 초과 시 스크롤 |
| **제목**      | `학교 상세 정보`               | 헤더 고정                                          |
| **닫기**      | 헤더 우측 X 버튼 + 마스크 클릭 | 기존 TealHeaderModal 동작                          |
| **내부 구조** | 탭 2개                         | **기본 정보** \| **학생 명단**                     |
| **푸터**      | 버튼 1개                       | `닫기` (가운데, 120×40)                            |

---

## 2. 탭: 기본 정보

### 2.1 상단 안내 문구

- **문구**: "기본 정보 학교 담당자(교사) 및 관리자만 작성/수정이 가능합니다."
- **위치**: 탭 패널 바로 아래, 첫 번째 섹션 위
- **스타일**: 본문 텍스트, 색상 `var(--color-text-body)` 또는 `var(--color-text-secondary)`, 폰트 14px

### 2.2 기본 정보 탭 레이아웃

- **탭 바로 아래 우측**: `수정` 버튼 1개 (기본 정보 전체 수정용, 120×40 권장)
- **내용**: 아래 3개 섹션을 **2열 키-값 테이블** 형태로 표시 (레이블 왼쪽, 값 오른쪽, 구분선)

---

### 2.3 섹션 1: 학교 기본 정보

**표시 형태**: 2열 테이블 (좌열 4행 + 우열 4행, 총 8개 필드)

| 필드명(레이블)         | 데이터 타입 | 표시 형식                                              | 예시 값                                                          | 비고                                     |
| ---------------------- | ----------- | ------------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------- |
| 참여 학교명            | string      | 단일 텍스트                                            | 진월초등학교                                                     |                                          |
| 대상 학년              | string      | 단일 텍스트                                            | 초등학교 5학년                                                   | educationGrade 확장 표기 가능            |
| 진행 장소              | string      | 단일 텍스트                                            | 교육 진행 대상 학급의 교실                                       |                                          |
| 식사 제공 여부 및 안내 | string      | "제공 \| 상세안내" 또는 "미제공"                       | 제공 \| 급식실에서 식사 가능하며...                              | 구분자 `\|` 로 줄바꿈 또는 한 셀 내 표시 |
| 담당 교사              | string      | "문의처 : {이름} \| Tel: {연락처} \| E-mail: {이메일}" | 문의처 : 이길동 \| Tel: 010-0000-0000 \| E-mail: tinto@naver.com |                                          |
| 지역                   | string      | 단일 텍스트                                            | 광주광역시 남구                                                  |                                          |
| 학급 수 및 전체 인원   | string      | "{N}개 학급 \| 총 {M}명"                               | 4개 학급 \| 총 124명                                             | classCount, studentCount 조합            |
| 대기실 여부 및 위치    | string      | "있음 \| {위치}" 또는 "없음"                           | 있음 \| 교내 1층 귀빈실                                          |                                          |

- **테이블 UI**: Ant Design `Descriptions` 또는 동일 스타일 테이블, 2 column, bordered, 레이블 배경 `#fafafa`, 레이블 폰트 굵기 500, 값 영역 배경 #fff

---

### 2.4 섹션 2: 강의 및 교재 정보

**표시 형태**: 2열 테이블 (좌열 2행 + 우열 2행, 총 4개 필드)

| 필드명(레이블) | 데이터 타입 | 표시 형식   | 예시 값                  | 비고                             |
| -------------- | ----------- | ----------- | ------------------------ | -------------------------------- |
| 강의 진행 회차 | string      | 단일 텍스트 | 진행 전                  |                                  |
| 교재명         | string      | 단일 텍스트 | 초등 5학년용 '우리 나라' |                                  |
| 교재 현황      | enum        | **뱃지**    | 교재 준비 중             | preparing / shipping / delivered |
| 교재 준비 수량 | number      | "{N}권"     | 124권                    | textbookQuantity                 |

**교재 현황 뱃지 스펙** (기존 프로그램 진행현황 탭과 동일):

| 값        | 라벨           | 배경색  | 텍스트색 | 테두리  |
| --------- | -------------- | ------- | -------- | ------- |
| preparing | 교재 준비 중   | #E8F5E9 | #1E8C29  | #C7E0C8 |
| shipping  | 교재 배송 중   | #F0E6FA | #8457CE  | #CFC4E5 |
| delivered | 교재 배송 완료 | #F2F3F5 | #464646  | #E4E5E7 |

- 뱃지: box-sizing border-box, padding 6px 10px, border 4px solid, border-radius 6px, font-size 14px, font-weight 600, 높이 33px 수준

---

### 2.5 섹션 3: 강사진 정보

- **헤더**: "강사진 정보 총 N건" (N = 해당 학교 배정 강사 수)
- **헤더 우측 버튼**: `수정`, `추가 배정` (각 120×40 권장, 간격 8px)
- **테이블 컬럼 정의**:

| 컬럼명    | 데이터 타입 | 표시     | 비고                               |
| --------- | ----------- | -------- | ---------------------------------- |
| (선택)    | -           | 체크박스 | 행 선택용, 열 너비 48px            |
| 역할      | enum        | 텍스트   | 대표 강사 / 일반 강사              |
| 강사명    | string      | 텍스트   |                                    |
| 연락처    | string      | 텍스트   | 010-1234-5678 형식                 |
| 이메일    | string      | 텍스트   |                                    |
| 정산 현황 | enum        | **뱃지** | pending / partial / completed / na |

**정산 현황 뱃지 스펙** (시안 기준):

| 값        | 라벨           | 배경색      | 텍스트색     | 비고              |
| --------- | -------------- | ----------- | ------------ | ----------------- |
| pending   | 정산 대기      | 파란 계열   | #1976d2 대비 | 시안: 파란색 배경 |
| partial   | 일부 정산 완료 | 자주색 계열 | #8457ce 대비 | 시안: 자주색 배경 |
| completed | 정산 완료      | 녹색 계열   | #1e8c29 대비 | 시안: 녹색 배경   |
| na        | 해당 없음      | 회색        | #464646      |                   |

- 테이블: Ant Design Table, 헤더 배경 #fafafa, 셀 구분선, 세로 중앙 정렬
- 기존 진행현황 탭의 정산 뱃지 CSS 클래스(`program-progress-tab__settlement-tag--*`) 재사용 또는 모달 전용 클래스로 동일 스펙 적용

---

## 3. 탭: 학생 명단

- **라벨**: "학생 명단"
- **내용**: 해당 학교·해당 프로그램 참여 학생 목록 (테이블)
- **수정 모드**: 학생 명단 탭의 수정 모드(인풋 전환, 버튼 disabled, 폼 관리)는 별도 명세 참고 → [학교 상세정보 모달 학생 명단 탭 수정 모드](./school-detail-modal-student-list-edit-spec.md)
- **강의 출석 내역**: 학생 명단의 「강의 출석 내역」 열 클릭 시 노출되는 모달·테이블·회차 셀 클릭 시 2차 모달은 별도 명세 참고 → [강의 출석 내역 모달 명세](./lecture-attendance-modal-spec.md)
- **필드 정의 (1차)**:

| 컬럼명  | 데이터 타입 | 비고                       |
| ------- | ----------- | -------------------------- |
| No.     | number      | 1부터 순번                 |
| 이름    | string      |                            |
| 학년/반 | string      | 예: 5학년 3반              |
| 연락처  | string      | 마스킹 정책 적용 시 마스킹 |
| 비고    | string      | 선택                       |

- **UI**: Ant Design Table, 페이지네이션(예: 10건 per page), 상단 "총 N명" 표시
- **추가 기획**: 다운로드, 필터 등은 별도 요구 시 확장

---

## 4. UI 디테일 체크리스트 (디자이너)

- **모달 헤더**: 높이 50px, padding 8px 30px, 배경 `var(--color-modal-header)` (#47a9ad), 제목 + X 버튼, 제목 폰트 18px 700, 흰색 텍스트
- **탭**: 모달 바디 상단, 기본 정보 / 학생 명단. 활성 탭은 청록 계열 강조 (기존 프로그램 진행현황 탭 스타일 참고: `--color-tab-active`), 비활성 회색
- **섹션 간 간격**: 24px ~ 30px (기존 TealHeaderModal body gap 30px 유지)
- **2열 키-값 테이블**: 레이블 셀 너비 비율 약 30%~35%, 값 셀 65%~70%
- **버튼**: 닫기 120×40, border-radius 4px; 수정/추가 배정 동일 높이, primary는 청록
- **접근성**: 모달 제목 `aria-labelledby`, 닫기 버튼 `aria-label="닫기"`, 탭 `role="tablist"` 등

---

## 5. 데이터 모델 (개발자 참고)

### 5.1 리스트 행 → 상세 확장

- **트리거 데이터**: `ParticipatingSchoolRow` (id, no, schoolName, region, educationGrade, classCount, studentCount, lectureRound, textbookStatus, teacherName, instructors)
- **모달 입력**: 행 클릭 시 해당 `id`(또는 schoolId)로 **학교 상세** API 또는 확장 mock 조회

### 5.2 학교 상세 (기본 정보용) 확장 필드 제안

```ts
// 기존 ParticipatingSchoolRow 에서 확장 또는 별도 타입
interface SchoolDetailForModal {
  id: string
  schoolName: string
  region: string
  educationGrade: string // 표시: "초등학교 5학년" 등
  venue?: string // 진행 장소
  mealProvided?: boolean
  mealNotice?: string // 식사 안내 문구
  teacherName?: string
  teacherPhone?: string
  teacherEmail?: string
  classCount: number
  studentCount: number
  waitingRoomAvailable?: boolean
  waitingRoomLocation?: string
  lectureRound: string
  textbookName?: string
  textbookStatus: TextbookStatusKey
  textbookQuantity?: number
  instructors: SchoolDetailInstructorRow[] // 강사진 테이블용
}

interface SchoolDetailInstructorRow {
  id: string
  role: 'lead' | 'assistant' // 대표 강사 / 일반 강사
  instructorName: string
  contact: string
  email: string
  settlementStatus: SettlementStatusKey
}
```

### 5.3 학생 명단

```ts
interface SchoolDetailStudentRow {
  id: string
  no: number
  name: string
  gradeClass: string // "5학년 3반"
  contact?: string
  notes?: string
}
```

- Mock: 1차 구현 시 `SchoolDetailForModal`은 `ParticipatingSchoolRow` + 위 확장 필드로 채우고, 강사진은 해당 학교 배정 강사 mock 리스트 사용

---

## 6. 개발 작업 정리

1. **모달 컴포넌트**: `SchoolDetailModal` (또는 `ParticipatingSchoolDetailModal`) 생성, `TealHeaderModal` size="large", 내부 Tabs (기본 정보 / 학생 명단).
2. **기본 정보 탭**: 안내 문구 → 수정 버튼 → 학교 기본 정보 Descriptions → 강의 및 교재 정보 Descriptions → 강사진 정보 Table (뱃지 스타일 재사용).
3. **학생 명단 탭**: Table + 페이지네이션, mock 데이터 연동.
4. **진행현황 탭**: 참여 학교 테이블에 `onRow={{ onClick: () => openSchoolDetail(row) }}` 및 `schoolDetailModalOpen`, `selectedSchool` 상태로 모달 연동.
5. **타입/데이터**: `ParticipatingSchoolRow` 기반 확장 타입 및 mock (또는 API) 준비.

---

## 7. 기본 정보 탭 수정 모드

기본 정보 탭에서 **수정** 버튼 클릭 시 인풋/라디오/셀렉트로 전환되는 수정 모드 구현은 별도 명세로 정리되어 있습니다.

**→ [기본 정보 탭 수정 모드 구현 명세 (school-detail-basic-edit-mode-spec.md)](./school-detail-basic-edit-mode-spec.md)**

- 기획: 사용자 시나리오, 저장/취소 동작, 예외 처리
- 디자인: 필드별 컨트롤 타입, 레이아웃, 접근성
- 개발 위임: 폼 상태, Zod 검증, Mock/API 연동, 검증 기준(Acceptance)

---

**문서 버전**: 1.0  
**작성 기준**: 스크린샷(학교 상세 정보 모달, 기본 정보 탭) 및 기존 프로그램 진행현황 탭·TealHeaderModal 스펙
