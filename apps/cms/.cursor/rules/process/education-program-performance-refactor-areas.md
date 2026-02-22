# 교육프로그램 경로 성능·리팩토링 가능 영역 (비즈니스 로직 무변경)

비즈니스 로직(데이터 필터링, 권한, API 계약, 라우팅 규칙)은 유지한 채 적용 가능한 영역만 우선순위별로 구분했습니다.

---

## 우선순위 1 (효과 큼, 위험 낮음)

### 1-1. `ProgramList` 컴포넌트 분리 및 메모이제이션
- **위치**: `apps/cms/src/features/program/ui/program-list.tsx` (~1905줄)
- **내용**:
  - **분리**: 하나의 거대 컴포넌트를 아래처럼 역할별로 분리
    - `ProgramListFilters` (참가자용 `UnifiedFilterCard` + 관리자용 필터 카드)
    - `ProgramListTableView` (테이블 + 행 선택 + 컬럼 정의)
    - `ProgramListCalendarView` (기존 `ProgramCalendarView` 래핑)
    - 상단 툴바(뷰 전환, 신규 등록 등)를 별도 컴포넌트로
  - **메모이제이션**:
    - `getMenuItems(program)` → `useMemo` 또는 컴포넌트 밖 정적 함수로 이동해 매 렌더마다 새 배열 생성 방지
    - 테이블 `columns`가 조건부로 여러 벌 생성되는 부분을 `useMemo`로 감싸서 의존성만 바뀔 때만 재계산
- **비즈니스**: 필터/테이블/캘린더 동작·표시 규칙은 그대로 두고, 구조만 나누고 참조 안정화.

### 1-2. `program-list.tsx` 내 `useSearchParams()` 단일화
- **위치**: `program-list.tsx` (동일 파일)
- **내용**: 현재 `useSearchParams()`를 두 번 써서 `searchParams`와 `searchParamsAdmin`으로 쓰고 있음. 동일 URL 소스이므로 한 번만 호출하고, 관리자/참가자 필터는 같은 `searchParams`에서 키만 구분해 사용.
- **효과**: 훅 호출·의존성 정리, 리렌더 원인 단순화.
- **비즈니스**: URL 스키마와 필터 의미 변경 없음.

### 1-3. `ProgramListPage`의 `useEffect`·디바운스 정리
- **위치**: `apps/cms/src/pages/programs/program-list-page.tsx`
- **내용**:
  - 검색 인풋 → URL 동기화용 `useEffect`에 500ms 디바운스가 있는데, `setSearchParams` 호출 시 `replace: true`만 유지하고, 불필요한 연쇄 상태 업데이트가 없는지 확인.
  - `viewMode`와 URL `viewMode` 동기화하는 두 개의 `useEffect`를 하나로 합치거나, 하나는 초기화·하나는 “외부 변경(뒤로가기)” 전용으로 역할 분리해 의존성 배열 최소화.
- **비즈니스**: “검색어/뷰모드가 URL과 일치한다”는 요구사항은 유지.

### 1-4. 찜하기(`favorites`) 일괄 조회
- **위치**: `program-list.tsx` 내 `loadFavorites`
- **내용**: 현재 `data.map(p => isFavoriteProgram(userId, p.id))`로 N번 호출. 가능하면 “한 번에 programId[]로 찜 여부 조회”하는 API/서비스가 있다면 그걸 쓰고, 없으면 `Promise.all`로 묶어서 한 번에 요청하도록만 정리(네트워크 병렬화).
- **비즈니스**: “목록에 찜 여부 표시” 동작만 유지.

---

## 우선순위 2 (효과 중간, 유지보수·번들 개선)

### 2-1. `ProgramCalendarView` 메모이제이션
- **위치**: `apps/cms/src/features/program/ui/program-calendar-view.tsx`
- **내용**: `ProgramCalendarView`를 `React.memo`로 감싸고, 부모에서 넘기는 `programs` 참조가 바뀌지 않으면 리렌더 스킵. 부모(`ProgramList`)에서 캘린더용으로 넘길 때 `useMemo`로 같은 배열 참조 유지.
- **비즈니스**: 캘린더에 표시되는 프로그램 집합 규칙 변경 없음.

### 2-2. `ProgramProgressWidget` 의존성 최소화
- **위치**: `apps/cms/src/features/dashboard/ui/program-progress-widget.tsx`
- **내용**: 교육 프로그램일 때 `useProgramStore(state => state.programs)`를 구독하고 있어, 목록 CRUD 시 위젯도 함께 리렌더·재요청됨. “목록이 바뀌었을 때만 위젯 숫자 갱신”이 목적이므로, `programs.length` 또는 필요한 식별자만 구독하거나, “마지막 fetch 시점/버전” 같은 최소한의 의존성으로 재조회 트리거할 수 있으면 그렇게 변경.
- **비즈니스**: “위젯 숫자 = 현재 교육 프로그램 목록 기준” 관계 유지.

### 2-3. 수강 신청 현황 페이지 데이터 소스 통일
- **위치**: `apps/cms/src/pages/programs/education-enrollment-page.tsx`, `EnrollmentStatusTable`
- **내용**: `EducationEnrollmentPage`는 로컬 `useState` + `useEffect`로 `getEducationPrograms()`만 호출. 프로그램 목록 페이지와 같은 레이아웃에서 오는 경우, 이미 스토어에 교육 프로그램이 있을 수 있으므로 “스토어에 있으면 재사용, 없으면 fetch” 같은 단일 소스 정책으로 바꿀 수 있음. (선택: `useProgramStore` + 조건부 fetch 또는 공용 캐시 훅)
- **비즈니스**: “수강 신청 현황 테이블에 표시되는 프로그램 목록” 정의는 그대로.

### 2-4. 프로그램 상세·탭 lazy
- **위치**: `apps/cms/src/pages/programs/program-detail-page.tsx`
- **내용**: `ProgramDetailInfoTab`, `ProgramProgressTab`, `ProgramManagersTab`, `ProgramApplicantsTab` 등을 `React.lazy`로 감싸고, `activeTabKey`에 따라 해당 탭만 로드. 초기 로딩·탭 전환 시 번들 분할로 체감 속도 개선.
- **비즈니스**: 탭 내용·권한·표시 조건 변경 없음.

---

## 우선순위 3 (점진적 개선·코드 품질)

### 3-1. `ProgramListPage` 모달/드로어 상태 묶기
- **위치**: `program-list-page.tsx`
- **내용**: Drawer/Form/Delete 모달 등 여러 `useState`가 흩어져 있음. “UI 모달 상태만” 묶어서 `useReducer` 또는 `useModalState` 계열 하나로 정리하면, 한 번의 디스패치로 정리되어 불필요한 리렌더 감소 가능.
- **비즈니스**: 어떤 모달이 언제 열리는지에 대한 사용자 경험만 유지.

### 3-2. 테이블 컬럼 정의 메모이제이션
- **위치**: `program-list.tsx` 내 테이블 `columns` (education / studentRecruitment / instructorRecruitment 분기)
- **내용**: `tableVariant`, `studentRecruitmentTable`, `instructorRecruitmentTable` 등에 따라 컬럼 배열을 만드는 부분을 `useMemo(..., [tableVariant, studentRecruitmentTable, instructorRecruitmentTable, ...])`로 고정. 인라인 렌더 함수는 유지하되, 컬럼 배열 참조만 안정화.
- **비즈니스**: 컬럼 구성·표시 규칙 동일.

### 3-3. CSS·스타일 정리
- **위치**: `program-list.css`, `program-list-page.css`, `program-calendar-view.css`, `program-progress-widget.css` 등
- **내용**: 프로젝트에 이미 있는 디자인 토큰/테마 규칙(`styling-tokens.md`, `theme-provider.css`)에 맞춰 중복 규칙 제거, 클래스명 일관화. 미사용 규칙 제거로 파싱 비용 소폭 감소.
- **비즈니스**: 시각적 결과만 동일하게 유지.

### 3-4. 교육 프로그램 레이아웃
- **위치**: `apps/cms/src/pages/programs/education-program-layout.tsx`
- **내용**: 레이아웃이 단순히 위젯 + `Outlet`이므로, `ProgramProgressWidget`만 `React.memo` 또는 조건부 렌더로 감싸서 경로 전환 시 불필요한 위젯 리렌더 감소.
- **비즈니스**: “교육 프로그램 하위에서만 위젯 표시” 규칙 유지.

---

## 제외·신중 대우

- **`filteredPrograms` / `getEducationPrograms()` 이중 소스**: 교육 탭에서 “위젯 건수 = 테이블 총 건수”를 맞추기 위해 목록은 `getEducationPrograms()`, 나머지는 스토어를 쓰는 구조. 비즈니스 요구이므로 로직 변경 없이, 위 2-2·2-3처럼 “캐시/구독 최소화”만 적용.
- **`program-store`의 `fetchPrograms`**: Zustand 액션 참조는 보통 안정적. `fetchPrograms`를 `useEffect` 의존성에 두는 현재 방식 유지해도 됨.
- **라우팅·경로 구조**: `/programs`, `/programs/education`, `/programs/education/student-recruitment` 등은 요구사항 반영이므로 변경 대상 아님.

---

## 요약 표

| 우선순위 | 영역 | 기대 효과 | 비고 |
|----------|------|-----------|------|
| 1 | ProgramList 분리·메모, useSearchParams 단일화, 페이지 useEffect 정리, 찜하기 일괄 조회 | 리렌더·네트워크 감소, 유지보수성 향상 | 비즈니스 로직 무변경 |
| 2 | 캘린더/위젯 메모, 수강현황 데이터 소스, 상세 탭 lazy | 체감 속도·번들 분할 | 선택 적용 |
| 3 | 모달 상태 정리, 컬럼 useMemo, CSS/레이아웃 정리 | 코드 품질·점진적 개선 | 여유 있을 때 |

이 순서대로 적용하면 교육프로그램 경로에서 성능·리팩토링 이득을 얻으면서도 비즈니스 동작은 그대로 유지할 수 있습니다.
