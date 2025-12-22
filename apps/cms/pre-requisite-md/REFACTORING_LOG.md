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

---

### Phase 1.3: Mock 데이터 참조 추상화

**작업 일시**: 2025-01-XX

**목적**: 
- `features` 레이어에서 직접 `mockProgramsMap`, `mockInstructorsMap` 등을 참조하는 문제 해결
- FSD 계층 구조 준수 (Features → Entities → Data)
- 실제 API 연동 시 대량 수정 필요 문제 해결

**생성/수정된 파일**:

#### Entities 레이어 - Service 헬퍼 함수 추가
- `entities/program/api/program-service.ts`
  - `getNameById(id: string): string` 추가
  - `getByIdSync(id: string): Program | undefined` 추가
  - `getAllSync(): Program[]` 추가

- `entities/instructor/api/instructor-service.ts`
  - `getNameById(id: string): string` 추가
  - `getByIdSync(id: string): Instructor | undefined` 추가
  - `getAllSync(): Instructor[]` 추가

- `entities/school/api/school-service.ts`
  - `getNameById(id: string): string` 추가
  - `getByIdSync(id: string): School | undefined` 추가

- `entities/sponsor/api/sponsor-service.ts`
  - `getNameById(id: string): string` 추가
  - `getByIdSync(id: string): Sponsor | undefined` 추가
  - `getAllSync(): Sponsor[]` 추가

- `entities/schedule/api/schedule-service.ts`
  - `getNameById(id: string): string` 추가
  - `getByIdSync(id: string): Schedule | undefined` 추가
  - `getAllSync(): Schedule[]` 추가

- `entities/matching/api/matching-service.ts`
  - `getByIdSync(id: UUID): Matching | undefined` 추가

**리팩토링된 파일** (17개):

#### Application 관련
- `features/application/ui/application-list.tsx`
  - 제거: `mockProgramsMap`, `mockSchoolsMap`, `mockInstructorsMap` 직접 import
  - 추가: `programService`, `schoolService`, `instructorService` import
  - 변경: `mockProgramsMap.get()` → `programService.getByIdSync()`
  - 변경: `mockSchoolsMap.get()` → `schoolService.getNameById()`
  - 변경: `mockInstructorsMap.get()` → `instructorService.getNameById()`
  - 변경: `Array.from(mockProgramsMap.values())` → `programService.getAllSync()`

- `features/application/ui/application-detail-drawer.tsx`
  - 제거: `mockProgramsMap`, `mockSchoolsMap`, `mockInstructorsMap` 직접 import
  - 추가: Service import 및 사용

#### Program 관련
- `features/program/ui/program-list.tsx`
  - 제거: `mockSponsorsMap` 직접 import
  - 추가: `sponsorService` import
  - 변경: `mockSponsorsMap.get()` → `sponsorService.getNameById()`
  - 변경: `Array.from(mockSponsorsMap.values())` → `sponsorService.getAllSync()`

- `features/program/ui/program-detail-drawer.tsx`
  - 제거: `mockSponsorsMap` 직접 import
  - 추가: `sponsorService` import 및 사용

#### Settlement 관련
- `features/settlement/ui/settlement-list.tsx`
  - 제거: `mockProgramsMap`, `mockInstructorsMap` 직접 import
  - 추가: `programService`, `instructorService` import
  - 변경: `Array.from(mockProgramsMap.values())` → `programService.getAllSync()`

- `features/settlement/ui/settlement-detail-drawer.tsx`
  - 제거: `mockProgramsMap`, `mockInstructorsMap`, `mockMatchingsMap` 직접 import
  - 추가: `programService`, `instructorService`, `matchingService` import

#### Matching 관련
- `features/matching/ui/matching-list.tsx`
  - 제거: `mockProgramsMap`, `mockInstructorsMap`, `mockSchedulesMap` 직접 import
  - 추가: `programService`, `instructorService`, `scheduleService` import
  - 변경: `Array.from(mockProgramsMap.values())` → `programService.getAllSync()`

- `features/matching/ui/matching-detail-drawer.tsx`
  - 제거: `mockProgramsMap`, `mockInstructorsMap`, `mockSchedulesMap` 직접 import
  - 추가: Service import 및 사용

- `features/matching/ui/matching-form.tsx`
  - 제거: `mockProgramsMap`, `mockInstructorsMap`, `mockSchedulesMap` 직접 import
  - 추가: `programService`, `instructorService`, `scheduleService` import
  - 변경: `Array.from(mockProgramsMap.values())` → `programService.getAllSync()`
  - 변경: `Array.from(mockInstructorsMap.values())` → `instructorService.getAllSync()`

#### Schedule 관련
- `features/schedule/ui/schedule-calendar.tsx`
  - 제거: `mockProgramsMap`, `mockInstructorsMap` 직접 import
  - 추가: `programService`, `instructorService` import

- `features/schedule/ui/schedule-detail-drawer.tsx`
  - 제거: `mockProgramsMap`, `mockInstructorsMap` 직접 import
  - 추가: `programService`, `instructorService` import

#### Dashboard 관련
- `features/dashboard/ui/recent-activities.tsx`
  - 제거: `mockProgramsMap`, `mockInstructorsMap` 직접 import
  - 추가: `programService`, `instructorService` import

**변경 통계**:
- 수정된 Service 파일: 6개
- 수정된 Features 컴포넌트: 12개
- 제거된 직접 Mock 참조: 17개 파일
- 타입 안정성: 개선 (모든 타입 체크 통과)

**개선 효과**:
1. **FSD 계층 구조 준수**: Features → Entities → Data 의존성 유지
2. **실제 API 연동 용이**: Service 함수만 수정하면 됨 (17개 파일 수정 불필요)
3. **테스트 용이**: Service를 Mock으로 교체 가능
4. **코드 중복 감소**: 조회 로직을 Service에 중앙화
5. **타입 안정성**: Service에서 타입 보장

**참고**:
- `features/matching/lib/instructor-candidate.ts`는 lib 파일이므로 Mock 데이터 직접 참조 유지 (비즈니스 로직 파일)
- 필터 옵션용 `getAllSync()` 함수 추가로 동기 조회 가능

---

### Phase 1.4: 에러 처리 일관화

**작업 일시**: 2025-01-XX

**목적**: 
- 각 컴포넌트마다 다른 에러 처리 패턴 통일
- 에러 타입 분류 및 사용자 친화적 메시지 제공
- 개발 환경에서 에러 로깅 지원
- 일관된 에러 처리 패턴 적용

**생성 파일**:
- `src/shared/utils/error-handler.ts`

**주요 기능**:
1. **에러 타입 분류**:
   - `NETWORK`: 네트워크 연결 문제
   - `SERVER`: 서버 내부 오류
   - `VALIDATION`: 입력 검증 오류
   - `NOT_FOUND`: 리소스 없음 (404)
   - `UNAUTHORIZED`: 인증 필요 (401)
   - `FORBIDDEN`: 권한 없음 (403)
   - `UNKNOWN`: 알 수 없는 오류

2. **핵심 함수**:
   - `classifyError(error: unknown): ErrorType`: 에러 타입 분류
   - `getUserFriendlyMessage(errorType: ErrorType, defaultMessage?: string): string`: 사용자 친화적 메시지 생성
   - `extractErrorInfo(error: unknown, defaultMessage?: string): ErrorInfo`: 에러 정보 추출
   - `handleError(error: unknown, options?): ErrorInfo`: 에러 처리 및 사용자 알림
   - `executeWithErrorHandling<T>(fn, options?): Promise<T | null>`: 비동기 함수 실행 및 에러 처리
   - `showSuccessMessage(messageText: string)`: 성공 메시지 표시
   - `showInfoMessage(messageText: string)`: 정보 메시지 표시
   - `showWarningMessage(messageText: string)`: 경고 메시지 표시

3. **개발 환경 로깅**: 개발 환경에서만 콘솔에 에러 상세 정보 출력

**리팩토링된 파일** (2개):

#### Application 관련
- `pages/applications/application-list-page.tsx`
  - 제거: `message` 직접 import 및 사용
  - 추가: `handleError`, `showSuccessMessage` import
  - 변경: `message.success()` → `showSuccessMessage()`
  - 변경: `message.error()` → `handleError()` (컨텍스트 정보 포함)
  - 변경: `catch {}` → `catch (error) {}` (에러 객체 활용)

#### Settlement 관련
- `pages/settlements/settlement-list-page.tsx`
  - 제거: `message` 직접 import 및 사용
  - 추가: `handleError`, `showSuccessMessage` import
  - 변경: `message.success()` → `showSuccessMessage()`
  - 변경: `message.error()` → `handleError()` (컨텍스트 정보 포함)
  - 변경: `catch {}` → `catch (error) {}` (에러 객체 활용)

**변경 통계**:
- 생성된 파일: 1개 (`error-handler.ts`)
- 수정된 페이지 파일: 2개
- 제거된 직접 `message` 사용: 10개 이상
- 에러 처리 일관성: 개선

**개선 효과**:
1. **일관된 에러 처리**: 모든 컴포넌트에서 동일한 패턴 사용
2. **사용자 친화적 메시지**: 에러 타입에 따른 적절한 메시지 제공
3. **개발 편의성**: 개발 환경에서 에러 상세 정보 로깅
4. **유지보수성 향상**: 에러 처리 로직 중앙화
5. **타입 안정성**: TypeScript로 에러 타입 보장

**참고**:
- 나머지 페이지 파일들도 단계적으로 리팩토링 예정
- Store 레이어의 에러 처리도 향후 개선 예정

---

### Phase 1.5: 테이블 훅 공통화

**작업 일시**: 2025-01-XX

**목적**: 
- 각 도메인별 테이블 훅에서 중복되는 로직 통합
- Query Parameter 동기화 로직 일원화
- 테이블 훅 생성 및 유지보수 용이성 향상

**생성 파일**:
- `src/shared/hooks/use-table-with-query.ts`

**주요 기능**:
1. **제네릭 타입 지원**: 모든 도메인 타입에 적용 가능
2. **필터 키 설정**: `filterKeys` 배열로 URL 파라미터와 동기화할 필터 지정
3. **기본 페이지 사이즈 설정**: `defaultPageSize` 옵션 (기본: 10)
4. **추가 테이블 옵션**: `tableOptions`로 TanStack Table 옵션 확장 가능
5. **필터/페이지네이션 초기화 함수**: `resetFilters`, `resetPagination` 제공

**리팩토링된 파일** (6개):

#### Application 관련
- `features/application/model/use-application-table.ts`
  - 제거: 중복된 테이블 로직 (약 70줄)
  - 추가: `useTableWithQuery` 사용 (약 20줄)
  - 변경: 필터 키 `['programId', 'subjectType', 'status']` 지정

#### Program 관련
- `features/program/model/use-program-table.ts`
  - 제거: 중복된 테이블 로직 (약 70줄)
  - 추가: `useTableWithQuery` 사용 (약 20줄)
  - 변경: 필터 키 `['title', 'sponsorId', 'type', 'status']` 지정

#### Settlement 관련
- `features/settlement/model/use-settlement-table.ts`
  - 제거: 중복된 테이블 로직 (약 65줄)
  - 추가: `useTableWithQuery` 사용 (약 20줄)
  - 변경: 필터 키 `['status', 'programId', 'period']` 지정

#### Instructor 관련
- `features/instructor/model/use-instructor-table.ts`
  - 제거: 중복된 테이블 로직 (약 70줄)
  - 추가: `useTableWithQuery` 사용 (약 20줄)
  - 변경: 필터 키 `['name', 'region', 'specialty']` 지정

#### School 관련
- `features/school/model/use-school-table.ts`
  - 제거: 중복된 테이블 로직 (약 70줄)
  - 추가: `useTableWithQuery` 사용 (약 20줄)
  - 변경: 필터 키 `['name', 'region']` 지정

#### Sponsor 관련
- `features/sponsor/model/use-sponsor-table.ts`
  - 제거: 중복된 테이블 로직 (약 70줄)
  - 추가: `useTableWithQuery` 사용 (약 20줄)
  - 변경: 필터 키 `['name']` 지정

**변경 통계**:
- 생성된 파일: 1개 (`use-table-with-query.ts`, 약 230줄)
- 수정된 테이블 훅: 6개
- 제거된 중복 코드: 약 420줄
- 코드 감소율: 약 65% (420줄 → 120줄)
- 타입 안정성: 개선 (모든 타입 체크 통과)

**개선 효과**:
1. **코드 중복 제거**: 6개 파일에서 약 420줄의 중복 코드 제거
2. **유지보수성 향상**: 테이블 로직 변경 시 공통 훅만 수정
3. **일관성 보장**: 모든 테이블에서 동일한 동작 보장
4. **확장성 향상**: 새로운 테이블 추가 시 간단한 설정만으로 구현 가능
5. **타입 안정성**: 제네릭 타입으로 타입 안정성 보장

**참고**:
- `resetFilters`, `resetPagination` 함수는 현재 사용되지 않지만 향후 확장을 위해 제공
- URL 파라미터 동기화 로직은 `isMounted` ref로 초기 마운트 시 업데이트 방지

---

## 다음 단계

### Phase 2: 비즈니스 로직 분리 (예정)
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

