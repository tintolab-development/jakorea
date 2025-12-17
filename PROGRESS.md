# JaKorea LMS 프로젝트 진행 상황

이 문서는 JaKorea 업무자동화 프로그램 개발 진행 상황을 프롬프트 단위로 트래킹합니다.

## 프로젝트 개요

- **프로젝트**: JaKorea 교육 프로그램 운영·매칭·정산 통합 관리 시스템
- **대상 앱**: `apps/lms`
- **디자인 시스템**: Material Design 3 (`@material/web`)
- **아키텍처**: Turborepo + pnpm 모노레포

## 진행 상황

### 2025-01-XX - 프로젝트 초기 설정 및 의존성 구성

#### 프롬프트

프로젝트 컨텍스트 확인, M3 Material Design 기반 설정, apps/lms에 필수 의존성 추가, PROGRESS.md 파일 생성

#### 결과

- ✅ 프로젝트 컨텍스트 이해 완료 (project-system-prompt.md 기반)
- ✅ Material Design 3 주력 디자인 시스템 결정
- ✅ 의존성 추가 완료: `react-hook-form`, `@tanstack/react-table`, `exceljs`, `zustand`, `recharts`, `@material/web@^2.4.1`, `react-router-dom`, `zod`, `@hookform/resolvers`, `date-fns`, `axios`
- ✅ PROGRESS.md 파일 생성 (의미있는 프롬프트만 트래킹)

### 2025-01-XX - MVP 범위 선정 및 개발 로드맵 수립

#### 프롬프트

Mock 데이터 기반으로 MVP 범위 선정, 기획/디자인/개발 단위로 개발 우선순위 리스트업

#### 결과

- ✅ MVP 범위 확정 (프로그램/신청/매칭/일정/강사/정산/대시보드)
- ✅ 5개 Phase로 개발 로드맵 수립
- ✅ MVP_ROADMAP.md 문서 생성 (상세 작업 항목 포함)
- ✅ Phase 1부터 순차 진행 결정

### 2025-01-XX - Phase 1.1: 프로젝트 기반 구조 설정 완료

#### 프롬프트

Phase 1.1 구현: React Router 설정, 기본 레이아웃 컴포넌트, Material Design 3 통합, Mock 데이터 구조 정의, Zustand 상태 관리 구조 설계

#### 결과

- ✅ React Router 설정 완료 (라우팅 구조 정의)
- ✅ 기본 레이아웃 컴포넌트 구현 (Header, Sidebar, Main Layout)
- ✅ Material Design 3 초기 설정 (`@material/web` import, 기본 CSS 변수 설정)
- ✅ Mock 데이터 타입 정의 완료 (도메인 엔티티 타입: Sponsor, Program, School, Instructor, Application, Schedule, Matching, Settlement)
- ✅ Zustand 상태 관리 구조 설계 (기본 구조, 향후 도메인별 스토어 분리 예정)
- ✅ Mock 서비스 레이어 구조 설계 (향후 백엔드 연동 고려)
- ✅ 모든 페이지 라우트 생성 (Phase별 구현 예정 표시)

### 2025-01-XX - Phase 1.2: 강사 DB CRUD 구현 완료

#### 프롬프트

Phase 1.2 구현: 강사 Mock 데이터 생성 (35개), Zustand 스토어, Mock 서비스, 강사 목록/상세/등록/수정 페이지, react-hook-form + zod

#### 결과

- ✅ 강사 Mock 데이터 생성 (35개, 다양한 지역/전문분야)
- ✅ Zustand 강사 스토어 구현 (목록, 상세, 생성, 수정, 삭제, 필터, 정렬, 페이지네이션)
- ✅ Mock 강사 서비스 레이어 구현 (필터링, 정렬, 페이지네이션 로직)
- ✅ 강사 목록 페이지 구현 (@tanstack/react-table 사용, 필터, 정렬, 페이지네이션)
- ✅ 강사 상세 페이지 구현
- ✅ 강사 등록/수정 폼 구현 (react-hook-form + zod 유효성 검사)
- ✅ Zod 스키마 정의 (강사 유효성 검사 규칙)
- ✅ 기본 UI 컴포넌트 생성 (MdTextField)

### 2025-01-XX - Phase 1.3: 스폰서 관리 CRUD 구현 완료

#### 프롬프트

Phase 1.3 구현: 스폰서 Mock 데이터 생성, Zustand 스토어, Mock 서비스, 스폰서 목록/상세/등록/수정 페이지

#### 결과

- ✅ 스폰서 Mock 데이터 생성 (20개)
- ✅ Zustand 스폰서 스토어 구현 (목록, 상세, 생성, 수정, 삭제, 필터, 정렬, 페이지네이션)
- ✅ Mock 스폰서 서비스 레이어 구현 (필터링, 정렬, 페이지네이션 로직)
- ✅ 스폰서 목록 페이지 구현 (@tanstack/react-table 사용, 검색 필터, 정렬, 페이지네이션)
- ✅ 스폰서 상세 페이지 구현 (M3 Card 컴포넌트 사용)
- ✅ 스폰서 등록/수정 폼 구현 (react-hook-form + zod 유효성 검사)
- ✅ Zod 스키마 정의 (스폰서 유효성 검사 규칙)
- ✅ 라우팅 설정 완료 (목록, 상세, 등록, 수정)

#### 다음 단계

- [ ] Phase 1.4: 학교 관리 CRUD 구현 시작

### 2025-01-XX - Phase 1.4: 학교 관리 CRUD 구현 완료

#### 프롬프트

Phase 1.4 구현: 학교 Mock 데이터 생성, Zustand 스토어, Mock 서비스, 학교 목록/상세/등록/수정 페이지, 색감 variation 추가

#### 결과

- ✅ 학교 Mock 데이터 생성 (30개, 다양한 지역/담당자 정보)
- ✅ Zustand 학교 스토어 구현 (목록, 상세, 생성, 수정, 삭제, 필터, 정렬, 페이지네이션)
- ✅ Mock 학교 서비스 레이어 구현 (필터링, 정렬, 페이지네이션 로직)
- ✅ 학교 목록 페이지 구현 (리스트 레이아웃, Instructor: 테이블, Sponsor: 카드 그리드와 차별화)
- ✅ 학교 상세 페이지 구현 (M3 Card 컴포넌트 사용)
- ✅ 학교 등록/수정 폼 구현 (react-hook-form + zod 유효성 검사)
- ✅ Zod 스키마 정의 (학교 유효성 검사 규칙)
- ✅ 라우팅 설정 완료 (목록, 상세, 등록, 수정)
- ✅ 색감 variation 추가:
  - M3 색상 토큰 확장 (tertiary, surface-variant, inverse 등)
  - 학교별 색상 테마 추가 (school-primary, school-container)
  - 지역별 색상 variation 적용 (6가지 색상 테마)
  - 카드 배경색 및 테두리 색상으로 시각적 구분
- ✅ 스폰서 목록 연락처 UI 개선 (이메일/전화번호 줄바꿈 처리)

#### 다음 단계

- [ ] Phase 2.1: 프로그램 관리 CRUD 구현 시작

### 2025-01-XX - UI/UX 디자인 시스템 활용 원칙 강화

#### 프롬프트

디자인이 단조로워 보이는 문제 해결, 컴포넌트 자유롭게 활용하도록 룰셋 추가, 팝업 모달/패널/아코디언 등 백오피스 UI 적극 활용, UI/UX 디자이너 역할 강화

#### 결과

- ✅ CONSTRAINTS.md에 "Material Design 3 컴포넌트 활용 원칙" 추가
- ✅ 백오피스에 적합한 UI 패턴 명시:
  - Dialog/Modal: 확인, 폼 입력, 상세 정보 표시
  - Drawer/Panel: 사이드 패널, 필터 패널, 설정 패널
  - Accordion: 정보 계층 구조, FAQ, 상세 정보 접기/펼치기
  - Tabs: 카테고리별 정보 분류, 단계별 프로세스
  - Snackbar: 간단한 알림/피드백
  - Menu/Dropdown: 액션 메뉴, 컨텍스트 메뉴
  - Tooltip: 추가 정보 표시
  - List: 구조화된 데이터 표시, 네비게이션
  - Stepper: 다단계 프로세스
  - Alert: 중요한 메시지 표시
- ✅ 컴포넌트 선택 원칙 추가 (상황별 적절한 컴포넌트 선택 가이드)
- ✅ UI/UX 디자이너 역할 강화 원칙 명시

#### 다음 단계

- [ ] M3 Dialog/Modal 컴포넌트 래퍼 구현
- [ ] M3 Drawer/Panel 컴포넌트 래퍼 구현
- [ ] M3 Accordion 컴포넌트 래퍼 구현
- [ ] M3 Snackbar 컴포넌트 래퍼 구현
- [ ] 각 페이지에 적절한 컴포넌트 적용

### 2025-01-XX - MVP 개발 제약사항 문서화

#### 프롬프트

MVP 우선순위부터 개발 시작 전 제약사항 정리

#### 결과

- ✅ CONSTRAINTS.md 문서 생성 (종합 제약사항 정리)
- ✅ 절대 규칙, 기술 스택, 데이터, 아키텍처, 기능 범위, 보안 제약사항 명시
- ✅ 개발 프로세스 및 검증 체크리스트 포함

### 2025-01-XX - Material Design 3 활용 검증 및 개선 계획

#### 프롬프트

M3 디자인 시스템 활용 현황 검증 및 개발 생산성 향상을 위한 개선 방안 수립

#### 결과

- ✅ M3 활용 현황 검증 완료 (CSS 변수/타입스케일만 활용, 웹 컴포넌트 미사용)
- ✅ M3 React Wrapper 컴포넌트 기본 구조 생성 (MdButton, MdTextField)
- ✅ M3_USAGE.md 문서 생성 (활용 현황, 개선 방안, 전환 계획)

#### 다음 단계

- [ ] 기존 컴포넌트를 M3 Wrapper로 점진적 전환
- [ ] 추가 M3 Wrapper 컴포넌트 생성 (Checkbox, Select, Chip 등)

### 2025-01-XX - Google Forms API 연동 분석 및 강사 정산 제출 기능 추가

#### 프롬프트

정산 관리 쪽 구글폼 API 연결 가능한지 확인하고, 아니라면 정산관련 구글폼 형식으로 만들어서 제출하게 만들기. 이미 존재하는 기능이라면 기존대로 유지하고 새로운 기능이 있다면 다시 MVP 추가

#### 결과

- ✅ Google Forms API 검증 완료
  - 공식 Forms API는 존재하지 않음
  - Google Apps Script나 Google Sheets API를 통한 간접 방법만 가능
  - 결론: 구글폼 스타일의 폼을 직접 구현하는 것이 적합
- ✅ 현재 시스템 분석
  - 정산 관리 기능 존재 (관리자 중심)
  - 정산 목록/상세/Excel 다운로드 기능 완료
  - **강사가 직접 정산 정보를 제출하는 폼 없음** (신규 기능 필요)
- ✅ Phase 6 추가 (강사 정산 제출 기능)
  - 강사 정산 제출 폼 (구글폼 스타일)
  - 프로그램/강의 선택, 비용 항목 입력, 증빙 파일 업로드
  - 총액 자동 계산, 제출 데이터 처리
- ✅ GOOGLE_FORMS_API_ANALYSIS.md 문서 생성

#### 다음 단계

- [ ] Phase 6.1: 강사 정산 제출 폼 구현 시작

### 2025-01-XX - Phase 6.1: 강사 정산 제출 폼 구현 완료

#### 프롬프트

Phase 6.1 구현: 강사 정산 제출 폼 (구글폼 스타일), 프로그램/강의 선택, 비용 항목 입력, 파일 업로드, 총액 자동 계산, 제출 데이터 처리

#### 결과

- ✅ 정산 제출 폼 Zod 스키마 생성 (`settlementSubmissionSchema.ts`)
  - 비용 항목 검증 (강사비, 교통비, 숙박비, 유류비, 기타)
  - 유류비 입력 시 증빙 파일 필수 검증
  - 최소 하나의 비용 항목 필수 검증
- ✅ 파일 업로드 컴포넌트 구현 (`MdFileUpload.tsx`)
  - 드래그앤드롭 지원
  - 파일 크기/형식 검증
  - 파일 목록 표시 및 삭제 기능
  - M3 디자인 시스템 적용
- ✅ 강사 정산 제출 폼 페이지 구현 (`SettlementSubmissionForm.tsx`)
  - 구글폼 스타일 UI (섹션 카드 레이아웃)
  - 프로그램/강의 선택 (Matching 기반)
  - 비용 항목 입력 (강사비, 교통비, 숙박비 80,000원 고정, 유류비, 기타)
  - 유류비 증빙 파일 업로드
  - 총액 실시간 자동 계산
  - 제출 데이터 처리 (Settlement 생성, 상태: 'pending')
  - 제출 완료 피드백 및 리다이렉트
- ✅ 라우팅 설정 완료 (`/settlements/submit`)
- ✅ 정산 목록 페이지에 "정산 제출" 버튼 추가

#### 구현 상세

- **Zod 스키마**: 유효성 검사 규칙 정의, 한글 에러 메시지
- **파일 업로드**: 드래그앤드롭, 파일 검증, 목록 표시
- **폼 UI**: 섹션별 카드 레이아웃, 총액 강조 표시, 프로그램 정보 표시
- **데이터 처리**: Settlement 엔티티 변환, 항목별 정산 항목 생성

#### 다음 단계

- [ ] 실제 파일 업로드 기능 (백엔드 연동 시)
- [ ] 강사별 정산 제출 목록 조회 (선택사항)

### 2025-01-XX - UI/UX 개선: 필터 영역 및 주체 유형 구분

#### 프롬프트

카테고리 필터 영역 UI 겹침 문제 해결, 주체 유형(강사/학생/학교) 구분 UI 추가, CustomButton variant 통일

#### 결과

- ✅ 필터 영역 UI 겹침 문제 해결
  - 모든 필터 페이지의 간격 통일 (`gap: 12px !important`)
  - 필터 정렬 개선 (`align-items: flex-start`)
  - z-index 및 stacking context 개선 (드롭다운 메뉴 겹침 방지)
  - 레이블 없는 드롭다운 완전히 숨기기 (다중 CSS 속성 적용)
  - 필터 그룹 개수 제한 (최대 5개)
- ✅ 주체 유형 구분 UI 추가
  - `SubjectTypeChip` 컴포넌트 생성 (학교/학생/강사 색상 구분)
  - 학교: 청록색 배경 (`--md-sys-color-school-container`)
  - 학생: 보라색 배경 (`--md-sys-color-primary-container`)
  - 강사: 노란색 배경 (`--md-sys-color-instructor-container`)
  - 신청 관리 테이블에서 주체 유형을 색상으로 구분 표시
- ✅ CustomButton variant 통일
  - 모든 삭제 버튼을 `danger` variant로 통일
  - 수정 버튼: `primary` 또는 `secondary`
  - 삭제 버튼: `danger` (빨간색 배경)
- ✅ 필터 영역 레이아웃 개선
  - CSS `!important`로 강제 적용하여 override 방지
  - 필터 그룹 너비 조정 (검색: 280px, 드롭다운: 180px)
  - 필터 높이 통일 (`min-height: 56px`)

#### 수정된 파일

- `apps/lms/src/pages/programs/ProgramsList.css`
- `apps/lms/src/pages/applications/ApplicationsList.css`
- `apps/lms/src/pages/instructors/InstructorsList.css`
- `apps/lms/src/pages/matchings/MatchingsList.css`
- `apps/lms/src/pages/settlements/SettlementsList.css`
- `apps/lms/src/pages/schedules/SchedulesCalendar.css`
- `apps/lms/src/pages/sponsors/SponsorsList.css`
- `apps/lms/src/components/m3/MdSelect.css`
- `apps/lms/src/components/ui/SubjectTypeChip.tsx` (신규)
- `apps/lms/src/components/ui/SubjectTypeChip.css` (신규)
- `apps/lms/src/pages/applications/ApplicationsList.tsx`
- `apps/lms/src/pages/sponsors/SponsorDetail.tsx`
- `apps/lms/src/pages/schools/SchoolDetail.tsx`
- `apps/lms/src/pages/settlements/SettlementDetail.tsx`
- `apps/lms/src/pages/schedules/ScheduleDetail.tsx`

#### 다음 단계

- [ ] 다른 페이지에도 SubjectTypeChip 적용 (필요 시)
- [ ] 필터 영역 반응형 디자인 개선 (모바일 대응)

---

## 참고 자료

- [프로젝트 시스템 프롬프트](./project-system-prompt.md)
- [M3 Material Design 가이드](./m3-material-design.md)
- [MVP 개발 로드맵](./MVP_ROADMAP.md)
- [개발 제약사항](./CONSTRAINTS.md)
- [M3 활용 현황 및 개선 방안](./M3_USAGE.md)
- [Google Forms API 분석](./GOOGLE_FORMS_API_ANALYSIS.md)
- [README](./README.md)
