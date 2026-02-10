# NAVER WORKS 홈(PC 웹) 위젯 편집기 · 드래그&드롭 구현 가이드 (React + Vite)

> 목표: NAVER WORKS의 **홈 위젯 편집** 경험(추가/제거/순서 변경/작게·크게)과 최대한 동일한 UX를 **React + Vite**에서 재현  
> 구현 범위: 프론트엔드(MVP → Phase 확장), 데이터는 Mock 기반(추후 API 교체 가능)

---

## 1) “NAVER WORKS 홈 위젯 편집” 핵심 동작 요약(기준 스펙)

헬프센터의 PC 웹 설명 기준으로 아래 동작을 **Acceptance Criteria**로 고정합니다.

### A. 위젯 추가/제거

- 상단의 **“홈 위젯 편집”** 진입(= edit mode 진입)
- 위젯을 **선택하면 추가**되고, **추가된 위젯은 맨 아래로 붙음**
- 위젯을 **선택 해제(제거)**하면 해당 위젯이 사라지고, **나머지 위젯들이 재배치(reflow)**
- 개별 위젯 Hover 시 **⋯(3-dot) 메뉴**에서 “위젯 제거” 가능

### B. 위젯 크기 조정(작게/크게)

- 개별 위젯 Hover → **⋯ 메뉴** → “위젯 작게/위젯 크게”
- **특정 사이즈만 제공하는 위젯은 크기 조정 메뉴가 아예 노출되지 않음**
- 크기 조정은 “자유 리사이즈”가 아니라, **정해진 2단계(작게/크게) 상태 전환**으로 구현

### C. 위젯 위치 변경(드래그&드롭)

- 위젯의 **상단 영역(헤더)**을 드래그하여 원하는 위치로 이동
- 이동 후 레이아웃은 자연스럽게 재배치(충돌 처리/빈 공간 정리/compact)

---

## 2) 라이브러리 선택 (권장안 + 대안)

### ✅ 권장안: `react-grid-layout` (대시보드/위젯 편집에 정석)

- React 전용, **드래그/리사이즈/브레이크포인트(Responsive)** 지원
- “위젯 제거 후 자동 재배치”, “드롭 시 충돌 처리”, “브레이크포인트별 레이아웃 저장”에 강함
- v2는 TypeScript rewrite + hooks 기반 API로 구성(프로젝트 확장에 유리)

**추천 상황**

- NAVER WORKS처럼 “위젯 카드들이 재배치되는 대시보드”를 만들고 싶다
- 향후 “권한별 위젯 노출”, “반응형 레이아웃”, “레이아웃 마이그레이션”까지 가려 한다

---

### 🔁 대안: `gridstack` (강력하지만 DOM 중심/imperative가 섞임)

- 프레임워크 불문(TypeScript), 대시보드 구성에 특화
- React에서도 사용 가능하지만, **React스럽게(선언형)만으로 끝내기 어려운 구간**이 생길 수 있음

**추천 상황**

- 그리드 엔진 기능이 최우선이고, React 컴포넌트 계층과의 자연스러운 통합보다 “대시보드 기능”이 더 중요하다

---

### 보조 UI/상태/검증 라이브러리(권장)

- 상태: `zustand` (+ `immer` 선택)
- 스키마/마이그레이션: `zod`
- UI(메뉴/다이얼로그/토스트): `@radix-ui/react-*` + `lucide-react`
- 유틸: `clsx`, `tailwindcss`(선택)
- 테스트: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `playwright`

---

## 3) 아키텍처 설계(“NAVER WORKS와 같은 UX”를 위한 핵심 구조)

### 3.1 데이터 모델(권장)

- **WidgetDefinition(정적/레지스트리)**
  - key, title, supportsSize, defaultSize, sizePresets, render(Component), visibilityRules(권한/상품)
- **WidgetInstance(유저가 홈에 올린 위젯 상태)**
  - id(=key 또는 uuid), size(small|large), enabled(boolean), pinned?(옵션), meta(위젯별 설정)
- **DashboardLayout**
  - breakpoints 별 layout 저장 (`{lg: LayoutItem[], md: ...}`)

> 포인트: “작게/크게”는 RGL의 resize가 아니라, **프리셋 h/w 전환**으로 표현하는 게 NAVER WORKS와 더 가깝습니다.

### 3.2 상태 흐름(권장: edit session)

NAVER WORKS는 “저장” 단계가 존재할 수 있으므로(특히 모바일은 저장 명시),
PC 웹도 동일 UX를 내기 위해 아래처럼 **편집 세션(draft) → 저장(commit) → 취소(rollback)** 패턴이 안전합니다.

- `committedState`: 현재 사용자 홈에 적용된 상태
- `draftState`: 편집 모드에서만 변경되는 임시 상태
- “저장” 클릭 시 draft → committed로 반영 + persist
- “취소/ESC/뒤로가기” 시 draft 폐기

---

## 4) 구현 로드맵: MVP → Phase → Task (React + Vite)

아래는 “기능 동일성”을 최우선으로 잡은 로드맵입니다.  
(권장 구현: `react-grid-layout` 기준)

---

# MVP (최소 기능 출시) — “편집 가능 + 저장됨 + 재배치 됨”

**목표**

- 홈 화면에서 위젯 카드들이 보인다
- 편집 모드에서 **추가/제거/드래그로 순서 변경**
- “작게/크게”는 일단 1~2개 위젯만이라도 동작
- localStorage에 저장되어 새로고침해도 유지

## MVP - Task

1. Vite 프로젝트 생성(react-ts 권장), ESLint/Prettier/Vitest 세팅
2. 위젯 레지스트리(예: Today, Apps, 결재 문서 등 3~5개 mock)
3. `DashboardStore(zustand)` 구축
   - committed/draft, editMode toggle, persist(load/save), migration version
4. 홈 화면 레이아웃(기본 1열/2열은 Phase에서 확장 가능)
5. 편집 진입 버튼(“홈 위젯 편집”)
6. 위젯 추가/제거 UI (간단한 modal/side panel)
   - 추가 시 맨 아래로
   - 제거 시 reflow
7. 드래그&드롭으로 위치 변경
   - 드래그 핸들은 “헤더 영역”으로 제한
8. 위젯 ⋯ 메뉴(최소: 제거)
9. 저장/취소 (draft → commit)

**Done 정의(체크리스트)**

- [ ] 위젯 추가하면 항상 최하단에 들어감
- [ ] 위젯 제거하면 빈 자리 없이 재배치됨
- [ ] 헤더 드래그로 위치 이동 가능
- [ ] 새로고침 후에도 레이아웃 유지

---

# Phase 1 — NAVER WORKS 편집 UX 정교화(메뉴/호버/작게·크게 완성)

**목표**

- ⋯ 메뉴에 **“위젯 작게/위젯 크게/위젯 제거”** 구현
- supportsSize=false 위젯은 “작게/크게” 메뉴가 아예 숨김
- hover/포커스 UX(키보드 접근) 맞추기
- 크기 전환 시 주변 위젯 재배치가 자연스럽게 동작

## Phase 1 - Task

1. 위젯별 size preset 정의
   - small/large 각각의 layout item (w/h) 또는 최소 h만 변경
2. “작게/크게” 전환 로직
   - 현재 size에서 반대 size로 토글
   - reflow/compact 수행
3. ⋯ 메뉴 UI 완성
   - hover 시 노출(키보드 focus 시도 포함)
4. supportsSize=false 위젯은 메뉴 항목 제거
5. 위젯 제거 플로우(확인 팝업 옵션)
6. 애니메이션(선택): 재배치 시 transition/FLIP

**Done 정의**

- [ ] 위젯마다 작게/크게가 명확히 구분되어 보임
- [ ] 지원 안 하는 위젯은 크기 메뉴가 없음
- [ ] 크기 변경해도 레이아웃이 깨지지 않음

---

# Phase 2 — 반응형(브레이크포인트) + 레이아웃 보존 고도화

**목표**

- 화면 너비에 따라 컬럼 수/배치가 바뀌어도 위젯 구성이 자연스럽게 유지
- breakpoint별 레이아웃 저장/복원
- 편집 상태 동기화(“상태 하나의 흐름”) 원칙 적용

## Phase 2 - Task

1. breakpoints 정의(lg/md/sm 등) + cols 정의
2. breakpoint별 layout 저장 구조 확정
3. breakpoint 전환 시 layout 정책
   - 기본: 현재 layout을 next breakpoint에 자동 매핑
   - 충돌 시 compact
4. store에 “단일 진실 공급원(Single Source of Truth)” 적용
   - 권한/상품 변경 시 위젯 가시성도 전체 상태에 반영되도록 sync
5. migration 버전업(예: v1 → v2) 구현

**Done 정의**

- [ ] 화면 크기 바꿔도 위젯이 사라지거나 겹치지 않음
- [ ] breakpoint마다 레이아웃이 유지/저장됨

---

# Phase 3 — “위젯 생태계” (권한/상품/설정 + Mock API)

**목표**

- 위젯별로 “데이터 어댑터”를 분리해서 유지보수 가능하게
- 권한/상품에 따라 위젯 노출 규칙을 재현(예: 특정 권한 있을 때만 보임)
- 위젯별 설정(필터/표시 항목 등) 최소 1~2개 구현

## Phase 3 - Task

1. `UserContext`/`EntitlementContext` 설계(권한/상품/계정)
2. WidgetDefinition에 `isVisible(ctx)` 추가
3. 위젯 목록 패널에서 “사용 불가(회색/툴팁)” 처리
4. Mock API 계층 도입(MSW 또는 간단한 repository)
5. 위젯별 설정 UI(예: Today: 표시 항목 선택)
6. 설정 포함 상태 persist & migration

---

# Phase 4 — 품질(테스트/성능/접근성) & 운영 준비

**목표**

- E2E로 “추가→드래그→작게/크게→저장→새로고침” 시나리오가 깨지지 않게
- 대량 위젯에서도 렌더/드래그 성능 확보
- 접근성(키보드/ARIA) 보강

## Phase 4 - Task

1. 단위 테스트(Store reducer/serializer/migration)
2. 컴포넌트 테스트(WidgetMenu, WidgetPicker, EditToolbar)
3. E2E(Playwright)
4. 성능
   - memoization, virtualization(목록 패널), throttling
5. 접근성
   - 키보드로 메뉴 열기/닫기, focus trap, aria-label
6. 문서화(개발자용/운영자용)

---

## 5) Phase별 Cursor 프롬프트(복붙용)

> 아래 프롬프트는 “한 번에 완성품”을 내도록 길게 작성되어 있습니다.  
> 각 프롬프트는 **‘파일 단위 완성본’**을 요구하도록 되어 있어, Cursor에서 그대로 붙여넣고 진행하기 좋습니다.

---

## Prompt: MVP 구현 (KR)

아래 요구사항대로 React + Vite(react-ts) 프로젝트를 구현해줘. **코드는 diff가 아니라 “완성된 파일 전체”로만 제공**해줘.

### 목표

- NAVER WORKS PC 웹 홈의 “홈 위젯 편집”과 유사한 대시보드를 만든다.
- 기능: 위젯 추가/제거/드래그로 순서 변경/저장-취소(draft/commit)/localStorage persist.
- 추가 시 항상 맨 아래에 들어가야 한다.
- 제거 시 남은 위젯들이 빈 공간 없이 재배치되어야 한다.
- 드래그는 위젯 “헤더 영역”에서만 가능해야 한다.

### 기술 스택/라이브러리

- react, vite, typescript
- zustand(+immer 선택)
- react-grid-layout (권장: v2 API 사용)
- radix-ui(메뉴/다이얼로그), lucide-react(아이콘)
- clsx
- vitest + testing-library(최소 smoke test)

### 폴더 구조(반드시 준수)

- src/
  - app/App.tsx
  - app/router.tsx (라우터가 필요 없으면 이유와 함께 제거)
  - domain/widgets/registry.tsx
  - domain/widgets/types.ts
  - store/dashboardStore.ts
  - pages/HomePage.tsx
  - components/dashboard/Dashboard.tsx
  - components/dashboard/WidgetCard.tsx
  - components/dashboard/WidgetMenu.tsx
  - components/dashboard/WidgetPickerDialog.tsx
  - lib/storage.ts
  - styles.css (또는 tailwind면 설정 포함)

### 구현 상세

- WidgetDefinition으로 위젯 레지스트리를 만들고, 최소 3개 위젯을 Mock로 렌더링.
- store에는 committedState와 draftState를 모두 두고, editMode일 때는 draft만 변경.
- 저장 버튼: draft → committed로 반영하고 localStorage에 저장.
- 취소 버튼: draft를 committed로 롤백.
- 위젯 메뉴(⋯): 최소 “위젯 제거”만 제공(Phase1에서 크기 메뉴 추가 예정)
- 에러 방지: localStorage schema version을 두고, 버전이 다르면 초기값으로 reset(또는 migration placeholder)

### 완료 기준

- 새로고침해도 위젯 구성/순서가 유지된다.
- 편집 모드가 아닐 땐 드래그가 비활성화된다.
- 위젯 추가하면 최하단으로 간다.

### 마지막에

- 실행 방법(npm scripts)과 “수동 테스트 시나리오”를 단계별로 적어줘.

---

## Prompt: MVP 구현 (EN)

Implement a React + Vite (react-ts) project. **Provide complete file contents (no diffs).**

### Goal

Build a NAVER WORKS-like Home Widget Editor (PC web style):

- Add/remove widgets
- Drag & drop reorder
- Draft vs committed editing session with Save/Cancel
- Persist to localStorage

### Hard requirements

- When a widget is added, it must be appended to the very bottom.
- When a widget is removed, remaining widgets must reflow (no gaps).
- Dragging must be possible ONLY by grabbing the widget header.

### Stack

- React, Vite, TypeScript
- Zustand (+Immer optional)
- react-grid-layout (prefer v2 API)
- Radix UI (menu/dialog), lucide-react icons
- clsx
- Vitest + Testing Library (at least a smoke test)

### Required folder structure

(use the exact paths)

- src/
  - app/App.tsx
  - app/router.tsx (if not needed, explain and remove)
  - domain/widgets/registry.tsx
  - domain/widgets/types.ts
  - store/dashboardStore.ts
  - pages/HomePage.tsx
  - components/dashboard/Dashboard.tsx
  - components/dashboard/WidgetCard.tsx
  - components/dashboard/WidgetMenu.tsx
  - components/dashboard/WidgetPickerDialog.tsx
  - lib/storage.ts
  - styles.css (or Tailwind config if used)

### Implementation details

- Create a WidgetDefinition registry (min 3 mock widgets).
- Store must keep committedState + draftState; editMode changes draft only.
- Save: draft → committed + persist; Cancel: rollback.
- Widget “⋯” menu: only “Remove widget” for MVP.
- localStorage schema versioning: reset or migration placeholder.

### Done criteria

- State survives refresh.
- Drag is disabled when not in edit mode.
- Added widgets always go to the bottom.

At the end, provide run instructions and manual test scenarios.

---

## Prompt: Phase 1 (KR) — ⋯ 메뉴 + 작게/크게

MVP 코드베이스 위에서 Phase 1을 구현해줘. **수정되는 파일은 ‘파일 전체 내용’으로 제공**해줘.

### 목표

- ⋯ 메뉴에 “위젯 작게/위젯 크게/위젯 제거”를 구현한다.
- 위젯별 supportsSize가 false면 작게/크게 메뉴가 아예 보이지 않아야 한다.
- 작게/크게는 자유 리사이즈가 아니라, 프리셋(2단계) 전환이다.
- 크기 변경 후에도 layout이 깨지지 않고 자연스럽게 재배치된다.

### 구현 가이드

- WidgetDefinition에 sizePresets(small/large)를 추가해라.
- store에 widgetSizeById를 저장하고 persist 대상에 포함해라.
- WidgetMenu에서 supportsSize 조건으로 메뉴 노출을 제어해라.
- 최소 1개 위젯(예: 결재 문서)에 대해 “큰 상태면 리스트가 더 보이는” 식으로 렌더 차이를 주어라.

### 완료 기준

- 크기 메뉴는 지원 위젯에만 보인다.
- 토글해도 드래그/추가/제거/저장 흐름이 깨지지 않는다.

---

## Prompt: Phase 2 (KR) — Responsive + breakpoint layout 저장

MVP+Phase1 코드베이스 위에서 Phase 2를 구현해줘. **수정되는 파일은 ‘파일 전체 내용’으로 제공**해줘.

### 목표

- 화면 너비에 따라 breakpoint(lg/md/sm) 레이아웃을 관리한다.
- breakpoint별 layout을 저장/복원한다.
- breakpoint가 바뀌어도 위젯이 겹치거나 사라지지 않게 한다.
- “상태는 하나의 흐름” 원칙: 권한/노출 규칙 변경 시 전체 위젯 상태가 동기화되어야 한다.

### 구현 가이드

- breakpoints/cols를 한 곳에서 관리하고(상수 파일), ResponsiveGridLayout을 사용한다.
- layout mapping 정책을 코드로 명확히 정의한다(현재 bp → 다음 bp로 자동 변환 규칙).
- storage schema version을 올리고 migration을 작성(최소 stub라도).

---

## Prompt: Phase 3 (KR) — 권한/상품/설정 + Mock API

Phase 3을 구현해줘. **파일 전체 내용으로 제공**해줘.

### 목표

- WidgetDefinition에 isVisible(ctx) 규칙을 추가해서 권한/상품에 따라 위젯 노출을 제어한다.
- 위젯 목록 패널에서 “사용 불가” 상태(비활성/툴팁)를 보여준다.
- Mock API 계층을 도입해서 위젯 데이터 로딩을 분리한다.

### 구현 가이드

- UserContext/EntitlementContext를 만들어 App 상단에서 주입한다.
- 최소 2개의 조건부 위젯을 만든다(예: 특정 권한이 있을 때만 보임).
- MSW를 쓰거나, 간단한 repository 모듈로도 가능(선택 이유를 남겨라).

---

## Prompt: Phase 4 (KR) — 테스트/성능/접근성

Phase 4를 구현해줘. **파일 전체 내용으로 제공**해줘.

### 목표

- Playwright E2E로 “추가→드래그→작게/크게→저장→새로고침” 시나리오를 자동화한다.
- WidgetMenu/WidgetPicker/EditToolbar 컴포넌트 테스트를 추가한다.
- 접근성: 메뉴/다이얼로그 키보드 조작이 가능하도록 ARIA와 focus 관리가 되어야 한다.

---

## 6) 빠른 결론(추천 조합)

- “NAVER WORKS처럼 위젯이 재배치되는 대시보드”를 React로 재현하려면:
  - **react-grid-layout + zustand + radix-ui** 조합이 가장 현실적인 MVP → 확장 루트입니다.
- 특히 “추가 시 맨 아래”, “제거 시 재배치”, “헤더 드래그”, “작게/크게(2단계 프리셋)”은
  - 그리드 엔진의 자동 배치(compact) + 프리셋 기반 size 전환으로 구현하는 게 구현 난이도 대비 가장 비슷합니다.
