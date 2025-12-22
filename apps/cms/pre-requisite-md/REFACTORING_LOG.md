# 리팩토링 로그

이 문서는 코드베이스 개선 작업의 진행 상황과 결과를 기록합니다.

---

## Phase 1: 상태 라벨/색상 중앙화

### Phase 1.1: 상태 라벨/색상 중앙화 상수 파일 생성

**작업 일시**: 2025-01-XX

**목적**: 
- 각 컴포넌트마다 반복 정의되던 상태 라벨/색상/아이콘을 중앙에서 관리
- 상태 추가/변경 시 여러 파일 수정 필요 문제 해결
- 일관성 있는 상태 표시 보장

**생성 파일**:
- `src/shared/constants/status.ts`

**주요 내용**:
```typescript
// 공통 상태 (Program, Matching 등에서 사용)
export const commonStatusConfig = {
  labels: { active: '활성', inactive: '비활성', ... },
  colors: { active: 'green', inactive: 'default', ... }
}

// 신청 상태
export const applicationStatusConfig = {
  labels: { submitted: '접수', reviewing: '검토', ... },
  colors: { submitted: 'default', reviewing: 'processing', ... },
  icons: { submitted: ClockCircleOutlined, ... }
}

// 정산 상태
export const settlementStatusConfig = {
  labels: { pending: '대기', calculated: '산출 완료', ... },
  colors: { pending: 'default', calculated: 'processing', ... }
}

// 헬퍼 함수
export function getApplicationStatusLabel(status: ApplicationStatus | string): string
export function getSettlementStatusLabel(status: SettlementStatus | string): string
export function getCommonStatusLabel(status: Status | string): string
export function getApplicationStatusColor(status: ApplicationStatus | string): string
export function getSettlementStatusColor(status: SettlementStatus | string): string
export function getCommonStatusColor(status: Status | string): string
export function getApplicationStatusIcon(status: ApplicationStatus): React.ComponentType
```

**영향 범위**:
- 10개 이상의 컴포넌트에서 중복 정의 제거 예정

---

### Phase 1.2: 상태 라벨/색상 적용 - 컴포넌트 리팩토링

**작업 일시**: 2025-01-XX

**목적**: 
- 각 컴포넌트에서 중앙화된 상태 상수 사용하도록 변경
- 중복 코드 제거

**리팩토링된 파일**:

#### Application 관련
- `src/features/application/ui/application-list.tsx`
  - 제거: `statusLabels`, `statusColors`, `statusIcons`, `subjectTypeLabels`, `subjectTypeColors` 로컬 정의
  - 추가: `applicationStatusConfig`, `applicationSubjectTypeConfig` import 및 헬퍼 함수 사용
  
- `src/features/application/ui/application-detail-drawer.tsx`
  - 제거: `statusLabels`, `statusColors`, `subjectTypeLabels`, `subjectTypeColors` 로컬 정의
  - 추가: 중앙화된 상수 및 헬퍼 함수 사용

#### Program 관련
- `src/features/program/ui/program-list.tsx`
  - 제거: `getStatusColor`, `getStatusLabel` 로컬 함수
  - 추가: `getCommonStatusLabel`, `getCommonStatusColor` 사용

- `src/features/program/ui/program-detail-drawer.tsx`
  - 제거: `statusLabels`, `statusColors` 로컬 정의
  - 추가: `commonStatusConfig` 사용

#### Settlement 관련
- `src/features/settlement/ui/settlement-list.tsx`
  - 제거: `statusLabels`, `statusColors` 로컬 정의
  - 추가: `getSettlementStatusLabel`, `getSettlementStatusColor` 사용

- `src/features/settlement/ui/settlement-detail-drawer.tsx`
  - 제거: `statusLabels`, `statusColors` 로컬 정의
  - 추가: 헬퍼 함수 사용

- `src/features/settlement/ui/settlement-approval-workflow.tsx`
  - 제거: `statusLabels`, `statusColors` 로컬 정의
  - 추가: 헬퍼 함수 사용

#### Matching 관련
- `src/features/matching/ui/matching-list.tsx`
  - 제거: `statusLabels`, `statusColors` 로컬 정의
  - 추가: `getCommonStatusLabel`, `getCommonStatusColor` 사용

- `src/features/matching/ui/matching-detail-drawer.tsx`
  - 제거: `statusLabels`, `statusColors` 로컬 정의
  - 추가: 헬퍼 함수 사용

#### Dashboard 관련
- `src/features/dashboard/ui/recent-activities.tsx`
  - 제거: `statusLabels`, `statusColors`, `matchingStatusLabels`, `matchingStatusColors` 로컬 정의
  - 추가: 헬퍼 함수 사용

**변경 통계**:
- 제거된 중복 코드: 약 200줄 이상
- 수정된 파일: 10개
- 타입 안정성: 개선 (모든 타입 체크 통과)

**개선 효과**:
1. **유지보수성 향상**: 상태 추가/변경 시 `status.ts` 한 곳만 수정
2. **일관성 보장**: 모든 컴포넌트에서 동일한 상태 표시
3. **코드 중복 제거**: DRY 원칙 준수
4. **타입 안정성**: 타입 체크 통과, 런타임 에러 가능성 감소

---

## 다음 단계

### Phase 1.3: Mock 데이터 참조 추상화 (예정)
- `features` 레이어에서 직접 `mockProgramsMap`, `mockInstructorsMap` 등 참조하는 문제 해결
- `entities/*/api/*-service.ts`에서 조회 함수 제공

### Phase 1.4: 에러 처리 일관화 (예정)
- `shared/utils/error-handler.ts` 생성
- 일관된 에러 처리 패턴 적용

### Phase 1.5: 테이블 훅 공통화 (예정)
- `shared/hooks/use-table-with-query.ts` 생성
- 중복된 테이블 훅 로직 통합

---

## 참고

- 리팩토링은 단계별로 진행하며, 각 단계 완료 후 커밋
- 타입 체크 및 린트 검사 통과 확인 필수
- 기존 기능 동작 보장 (회귀 테스트 필요)

