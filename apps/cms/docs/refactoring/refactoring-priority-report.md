# 프로젝트 전반 리팩토링 우선순위 리포트

**작성 일자**: 2026-01-23  
**분석 범위**: 전체 프로젝트 (apps/cms/src)  
**목적**: 상수화, 컴포넌트 재사용, 커스텀 훅 분리, 의존성 분리 영역 식별

---

## 📊 개요

이 리포트는 프로젝트 전반에 걸쳐 리팩토링이 필요한 영역을 4가지 카테고리로 분류하고, 우선순위를 제시합니다.

### 분석 결과 요약
- **상수화 필요 영역**: 15+ 항목
- **컴포넌트 재사용 가능**: 8개 패턴 그룹
- **커스텀 훅 분리 가능**: 12개 비즈니스 로직
- **의존성 분리 필요**: 6개 영역

---

## 🔴 우선순위 1: 즉시 개선 (High Priority)

### 1.1 상수화 가능 영역

#### 1.1.1 하드코딩된 스타일 값 (매우 높음)
**현황**: 805개 매치 발견 (170개 파일)
- `width: 340`, `width: 160`, `width: 250` 등 반복되는 너비 값
- `marginBottom: 12`, `marginBottom: 16`, `marginBottom: 24` 등 반복되는 마진
- `fontSize: 12`, `fontSize: 14` 등 반복되는 폰트 크기

**영향 파일**:
- 모든 페이지 및 컴포넌트 파일

**개선 방안**:
```typescript
// shared/constants/layout.ts
export const LAYOUT_CONSTANTS = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  widths: {
    search: 250,
    filter: 150,
    status: 110,
    action: 72,
    modal: {
      small: 520,
      medium: 720,
      large: 960,
      xlarge: 1100,
    },
  },
  fontSizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
  },
} as const
```

**예상 효과**: 
- 일관된 디자인 시스템 구축
- 반응형 디자인 변경 시 한 곳에서 수정 가능
- 코드 가독성 향상

---

#### 1.1.2 상태 라벨/색상 중복 정의 (높음)
**현황**: 여러 컴포넌트에서 동일한 상태 라벨/색상 반복 정의
- `reportTypeLabels`, `reportTypeColors` (report-detail-drawer.tsx)
- 각 drawer 컴포넌트마다 상태 매핑 중복

**영향 파일**:
- `features/report/ui/report-detail-drawer.tsx`
- `features/settlement/ui/settlement-detail-drawer.tsx`
- `features/matching/ui/matching-detail-drawer.tsx`
- 기타 drawer 컴포넌트들

**개선 방안**:
```typescript
// shared/constants/domain-status.ts
export const REPORT_TYPE_CONFIG = {
  labels: {
    lecture: '강의보고서',
    volunteer: '교육봉사 활동보고서',
    program: '프로그램 종료 보고서',
  },
  colors: {
    lecture: 'blue',
    volunteer: 'purple',
    program: 'cyan',
  },
} as const
```

**예상 효과**: 
- 상태 변경 시 한 곳에서만 수정
- 일관성 보장

---

#### 1.1.3 페이지네이션 기본값 중복 (높음)
**현황**: 여러 페이지에서 동일한 페이지네이션 설정 반복
- `defaultPageSize: 10`, `defaultPageSize: 20`
- `showSizeChanger: true`, `showTotal: total => \`총 ${total}개\``

**영향 파일**:
- 대부분의 list 페이지 (93개 파일)

**개선 방안**:
```typescript
// shared/constants/pagination.ts
export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: ['10', '20', '50', '100'],
  showSizeChanger: true,
  showTotal: (total: number) => `총 ${total}개`,
} as const
```

---

### 1.2 컴포넌트 재사용 가능성

#### 1.2.1 Drawer 컴포넌트 공통 패턴 (매우 높음)
**현황**: 10개의 drawer 컴포넌트가 유사한 구조
- 공통: `open`, `onClose`, `loading` props
- 공통: Descriptions, Tag, Space, Button 레이아웃
- 공통: Edit/Delete 액션 버튼 패턴

**영향 파일**:
- `features/*/ui/*-detail-drawer.tsx` (10개 파일)

**개선 방안**:
```typescript
// shared/ui/base-detail-drawer.tsx
export function BaseDetailDrawer<T>({
  open,
  data,
  onClose,
  loading,
  title,
  renderContent,
  actions,
  ...drawerProps
}: BaseDetailDrawerProps<T>)

// 사용 예시
<BaseDetailDrawer
  open={open}
  data={program}
  onClose={onClose}
  title="프로그램 상세"
  renderContent={(program) => <ProgramContent program={program} />}
  actions={[
    { key: 'edit', label: '수정', onClick: onEdit, icon: <EditOutlined /> },
    { key: 'delete', label: '삭제', onClick: onDelete, danger: true },
  ]}
/>
```

**예상 효과**: 
- 코드 중복 60% 이상 감소
- 일관된 UX 제공
- 유지보수성 향상

---

#### 1.2.2 List 페이지 필터 패턴 (매우 높음)
**현황**: 20+ 개의 list 페이지가 유사한 필터 구조
- Search + Select 필터 + 초기화 버튼
- Card로 감싼 필터 영역
- 동일한 레이아웃 패턴

**영향 파일**:
- `pages/posts/admin-inquiry-page.tsx`
- `pages/posts/admin-faq-page.tsx`
- `pages/programs/program-list-page.tsx`
- `pages/reports/report-list-page.tsx`
- 기타 list 페이지들

**개선 방안**:
```typescript
// shared/ui/list-page-filters.tsx
export function ListPageFilters<T extends Record<string, any>>({
  filters,
  onFilterChange,
  filterConfig,
  searchPlaceholder,
}: ListPageFiltersProps<T>)

// filterConfig 예시
const filterConfig = [
  { key: 'status', type: 'select', options: statusOptions, placeholder: '상태' },
  { key: 'category', type: 'select', options: categoryOptions, placeholder: '카테고리' },
]
```

**예상 효과**: 
- 필터 로직 중복 제거
- 일관된 필터 UX
- 새 필터 추가 용이

---

#### 1.2.3 Modal 폼 패턴 (높음)
**현황**: 21개의 modal 컴포넌트가 유사한 구조
- Form + Modal 조합
- Create/Edit 모드 분기
- Form 초기화 로직 중복

**영향 파일**:
- `features/*/ui/*-form-modal.tsx`
- `shared/ui/*-modal.tsx`

**개선 방안**:
```typescript
// shared/ui/form-modal.tsx
export function FormModal<T>({
  open,
  editing,
  onCancel,
  onSubmit,
  title,
  formConfig,
  initialValues,
}: FormModalProps<T>)
```

---

### 1.3 커스텀 훅 분리

#### 1.3.1 List 페이지 CRUD 패턴 (매우 높음)
**현황**: 거의 모든 list 페이지에서 동일한 CRUD 로직 반복
- `useState`로 관리하는 `data`, `editing`, `open` 상태
- `openCreate`, `openEdit`, `handleDelete` 함수
- 필터링 로직

**영향 파일**:
- 모든 list 페이지 (93개 파일)

**개선 방안**:
```typescript
// shared/hooks/use-list-crud.ts
export function useListCRUD<T extends { id: string }>({
  initialData,
  onCreate,
  onUpdate,
  onDelete,
  generateId,
}: UseListCRUDOptions<T>)

// 사용 예시
const {
  data,
  filtered,
  editing,
  open,
  openCreate,
  openEdit,
  closeModal,
  handleSubmit,
  handleDelete,
} = useListCRUD({
  initialData: mockInquiries,
  onCreate: (values) => ({ ...values, id: `inquiry-${Date.now()}` }),
  onUpdate: (id, values) => ({ ...id, ...values }),
  onDelete: (id) => message.success('삭제되었습니다.'),
})
```

**예상 효과**: 
- CRUD 로직 중복 80% 이상 제거
- 일관된 에러 처리
- 테스트 용이성 향상

---

#### 1.3.2 필터링 로직 (높음)
**현황**: 각 페이지마다 유사한 필터링 로직 반복
- `useMemo`로 필터링된 데이터 계산
- 검색어, 상태, 카테고리 필터 조합

**영향 파일**:
- 모든 list 페이지

**개선 방안**:
```typescript
// shared/hooks/use-list-filters.ts
export function useListFilters<T>({
  data,
  filterConfig,
  defaultFilters,
}: UseListFiltersOptions<T>)

// filterConfig 예시
const filterConfig = {
  search: { keys: ['title', 'content', 'author'] },
  status: { key: 'status', type: 'select' },
  category: { key: 'category', type: 'select' },
}
```

---

#### 1.3.3 모달 상태 관리 (높음)
**현황**: 여러 모달의 열림/닫힘 상태 관리 로직 중복
- `isModalOpen`, `setIsModalOpen`
- `selectedItem`, `setSelectedItem`
- Form 초기화 로직

**영향 파일**:
- 모든 modal 사용 페이지

**개선 방안**:
```typescript
// shared/hooks/use-modal-state.ts
export function useModalState<T>({
  initialData,
  onOpen,
  onClose,
}: UseModalStateOptions<T>)
```

---

### 1.4 의존성 분리

#### 1.4.1 서비스 레이어 직접 의존 (매우 높음)
**현황**: 컴포넌트에서 직접 서비스 호출
- `programService.getByIdSync()`
- `instructorService.getAll()`
- Mock 데이터 직접 import

**영향 파일**:
- 대부분의 페이지 및 컴포넌트

**개선 방안**:
```typescript
// features/program/hooks/use-program.ts
export function useProgram(id: string) {
  // 서비스 호출 로직 캡슐화
  // 에러 처리, 로딩 상태 관리
}

// 컴포넌트에서는 훅만 사용
const { program, loading, error } = useProgram(programId)
```

**예상 효과**: 
- 서비스 변경 시 컴포넌트 수정 최소화
- 테스트 용이성 향상
- 의존성 역전 원칙 준수

---

## 🟡 우선순위 2: 단기 개선 (Medium Priority)

### 2.1 상수화 가능 영역

#### 2.1.1 메시지 텍스트 (중간)
**현황**: 하드코딩된 성공/에러 메시지
- `message.success('삭제되었습니다.')`
- `message.error('오류가 발생했습니다.')`

**개선 방안**:
```typescript
// shared/constants/messages.ts
export const MESSAGES = {
  success: {
    created: '등록되었습니다.',
    updated: '수정되었습니다.',
    deleted: '삭제되었습니다.',
    // ...
  },
  error: {
    create: '등록에 실패했습니다.',
    update: '수정에 실패했습니다.',
    // ...
  },
} as const
```

---

#### 2.1.2 테이블 컬럼 너비 (중간)
**현황**: 반복되는 컬럼 너비 값
- `width: 110` (상태 컬럼)
- `width: 120` (날짜 컬럼)
- `width: 72` (작업 컬럼)

**개선 방안**:
```typescript
// shared/constants/table.ts
export const TABLE_COLUMN_WIDTHS = {
  status: 110,
  date: 120,
  action: 72,
  // ...
} as const
```

---

### 2.2 컴포넌트 재사용

#### 2.2.1 Status Badge/Tag 패턴 (중간)
**현황**: 여러 컴포넌트에서 상태 표시 로직 중복
- Tag + 색상 + 라벨 조합

**개선 방안**:
```typescript
// shared/ui/status-badge.tsx
export function StatusBadge({
  status,
  statusConfig,
  showIcon,
}: StatusBadgeProps)
```

---

#### 2.2.2 Empty State 컴포넌트 (중간)
**현황**: 빈 상태 표시 로직 중복

**개선 방안**:
```typescript
// shared/ui/empty-state.tsx (이미 존재하지만 활용도 낮음)
// 사용률 높이기
```

---

### 2.3 커스텀 훅 분리

#### 2.3.1 페이지네이션 로직 (중간)
**현황**: 여러 페이지에서 유사한 페이지네이션 로직

**개선 방안**:
```typescript
// shared/hooks/use-pagination.ts (이미 존재)
// 사용률 높이기
```

---

#### 2.3.2 쿼리 파라미터 동기화 (중간)
**현황**: URL 쿼리 파라미터와 상태 동기화 로직 중복

**개선 방안**:
```typescript
// shared/hooks/use-query-params.ts (이미 존재)
// 사용률 높이기
```

---

### 2.4 의존성 분리

#### 2.4.1 타입 정의 분리 (중간)
**현황**: 컴포넌트 파일 내부에 타입 정의

**개선 방안**:
- 각 feature별 `types.ts` 또는 `model/types.ts`로 분리

---

## 🟢 우선순위 3: 중기 개선 (Low Priority)

### 3.1 상수화 가능 영역

#### 3.1.1 아이콘 매핑 (낮음)
**현황**: 아이콘 선택 로직 중복

**개선 방안**:
```typescript
// shared/constants/icons.ts
export const STATUS_ICONS = {
  // ...
} as const
```

---

### 3.2 컴포넌트 재사용

#### 3.2.1 Form 필드 패턴 (낮음)
**현황**: 반복되는 Form.Item 구조

**개선 방안**:
```typescript
// shared/ui/form-field.tsx
export function FormField({ ... })
```

---

### 3.3 커스텀 훅 분리

#### 3.3.1 날짜 포맷팅 (낮음)
**현황**: `dayjs().format()` 반복

**개선 방안**:
```typescript
// shared/hooks/use-date-format.ts
export function useDateFormat(date: string, format: string)
```

---

## 📋 실행 계획

### Phase 1: 즉시 개선 (1-2주)
1. ✅ 상수화: 스타일 값, 상태 라벨/색상, 페이지네이션
2. ✅ 컴포넌트: BaseDetailDrawer, ListPageFilters
3. ✅ 훅: useListCRUD, useListFilters, useModalState
4. ✅ 의존성: 서비스 레이어 훅으로 래핑

### Phase 2: 단기 개선 (2-4주)
1. 메시지 텍스트 상수화
2. StatusBadge 컴포넌트 활용도 높이기
3. 기존 훅 활용도 높이기

### Phase 3: 중기 개선 (1-2개월)
1. 나머지 상수화 작업
2. Form 필드 패턴 추출
3. 유틸리티 훅 추가

---

## 📊 예상 효과

### 코드 감소
- **상수화**: 하드코딩 값 805개 → 상수 50개 (94% 감소)
- **컴포넌트 재사용**: Drawer 컴포넌트 중복 60% 감소
- **훅 분리**: CRUD 로직 중복 80% 감소

### 유지보수성
- 변경 사항 반영 시 수정 파일 수 90% 감소
- 일관성 있는 코드베이스
- 테스트 용이성 향상

### 개발 생산성
- 새 페이지/컴포넌트 개발 시간 50% 단축
- 버그 발생 가능성 감소
- 코드 리뷰 시간 단축

---

## 🎯 우선순위 매트릭스

| 항목 | 영향 범위 | 구현 난이도 | 우선순위 | 예상 시간 |
|------|----------|------------|---------|----------|
| 스타일 상수화 | 전체 | 낮음 | 🔴 높음 | 2일 |
| Drawer 공통화 | 10개 파일 | 중간 | 🔴 높음 | 3일 |
| List CRUD 훅 | 93개 파일 | 중간 | 🔴 높음 | 5일 |
| 필터 패턴 추출 | 20+ 파일 | 낮음 | 🔴 높음 | 2일 |
| 서비스 레이어 분리 | 전체 | 높음 | 🔴 높음 | 7일 |
| 메시지 상수화 | 전체 | 낮음 | 🟡 중간 | 1일 |
| Status Badge | 30+ 파일 | 낮음 | 🟡 중간 | 1일 |

---

## 📝 참고 사항

1. **기존 리팩토링과의 연계**
   - `template-email-page.tsx`, `template-sms-page.tsx` 리팩토링 완료 (참고)
   - `heavy-pages-analysis.md`의 우선순위와 연계

2. **FSD 아키텍처 준수**
   - 모든 변경사항은 FSD 구조를 준수해야 함
   - `shared/` 레이어 활용 최대화

3. **하위 호환성**
   - 기존 코드와의 호환성 유지
   - 점진적 마이그레이션 전략

4. **테스트**
   - 각 리팩토링 단계마다 회귀 테스트 필요
   - 기존 기능 동작 확인 필수

---

**다음 단계**: 이 리포트를 기반으로 Phase 1 작업부터 시작
