# CMS 리팩토링 가이드 (Cursor용)

> 작성일: 2026-01-28
> QA 기반 분석 결과

---

## 1. 우선 점검 항목 (수동 테스트 필요)

QA 코드 분석 결과, 63개 항목이 실제 브라우저 테스트가 필요합니다.

### 1.1 MFA (다단계 인증) - 우선순위: 높음

| 파일 경로 | 점검 사항 |
|----------|----------|
| `apps/cms/src/pages/auth/login-page.tsx` | MFA 코드 입력 UI 동작 확인 |
| `apps/cms/src/features/auth/ui/mfa-verification-modal.tsx` | QR 코드 표시, 6자리 코드 검증 |
| `apps/cms/src/features/auth/model/auth-store.ts:153-178` | setMfaVerified 후 상태 확인 |

**테스트 시나리오:**
1. MFA 설정 활성화 → QR 코드 표시 확인
2. 올바른 코드 입력 → 인증 성공
3. 잘못된 코드 입력 → 에러 메시지 표시
4. MFA 비활성화 → 설정 해제

### 1.2 일정 관리 - 우선순위: 높음

| 파일 경로 | 점검 사항 |
|----------|----------|
| `apps/cms/src/pages/schedule/schedule-calendar-page.tsx` | 주별/일별 뷰 전환 |
| `apps/cms/src/entities/schedule/api/schedule-service.ts` | 반복 일정 생성/삭제 |

**테스트 시나리오:**
1. 반복 일정 생성 → 모든 인스턴스 생성 확인
2. 반복 일정 전체 삭제 → 모든 인스턴스 삭제 확인
3. 일정 시간 충돌 검사 → 경고 메시지 확인

### 1.3 파일 다운로드 - 우선순위: 중간

| 파일 경로 | 점검 사항 |
|----------|----------|
| `apps/cms/src/shared/utils/file-download.ts` | Excel/PDF 다운로드 |
| 정산 페이지들 | 증빙자료 다운로드, 명세서 PDF |

**테스트 시나리오:**
1. Excel 다운로드 → 파일 생성 및 내용 확인
2. PDF 다운로드 → 파일 생성 및 레이아웃 확인
3. 대용량 파일 업로드 → 에러 메시지 확인

---

## 2. 발견된 개선 필요 사항

### 2.1 코드 패턴 통일 필요

#### API 서비스 레이어 패턴
현재 상태: 각 서비스마다 약간씩 다른 패턴 사용

**현재 패턴 (instructor-service.ts):**
```typescript
export const instructorService = {
  getAll: async () => { ... },
  getById: async (id: string) => { ... },
  create: async (data: Omit<Instructor, 'id' | 'createdAt' | 'updatedAt'>) => { ... },
  // Sync 헬퍼 함수
  getByIdSync: (id: string) => instructorMap.get(id),
  getNameById: (id: string) => instructorMap.get(id)?.name || '알 수 없음',
}
```

**권장 리팩토링:**
```typescript
// shared/utils/create-service.ts 생성 권장
interface CrudService<T> {
  getAll(): Promise<T[]>
  getById(id: string): Promise<T | undefined>
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
}
```

**관련 파일들:**
- `apps/cms/src/entities/instructor/api/instructor-service.ts`
- `apps/cms/src/entities/school/api/school-service.ts`
- `apps/cms/src/entities/sponsor/api/sponsor-service.ts`
- `apps/cms/src/entities/matching/api/matching-service.ts`

### 2.2 Zustand Store 패턴 개선

**현재 이슈:**
`auth-store.ts`의 `checkAuth` 함수가 복잡하고 중복 호출 방지 로직이 전역 변수로 처리됨.

```typescript
// 현재 (auth-store.ts:37-38)
let isCheckingAuth = false
let checkAuthPromise: Promise<void> | null = null
```

**권장 리팩토링:**
```typescript
// 스토어 내부로 상태 이동
interface AuthState {
  // ... 기존 상태
  _isCheckingAuth: boolean
  _checkAuthPromise: Promise<void> | null
}
```

### 2.3 에러 핸들링 통일

**현재 상태:** 각 컴포넌트에서 try-catch로 개별 처리

```typescript
// 현재 패턴 (admin-settlement-review-page.tsx:48-57)
onApprove: async settlement => {
  try {
    await approveSettlement(settlement)
    message.success(MESSAGES.success.settlementApproved)
  } catch (e) {
    console.error('Failed to approve settlement:', e)
    message.error(MESSAGES.error.approvalProcessFailed)
  }
}
```

**권장 리팩토링:**
```typescript
// shared/utils/error-handler.ts 생성
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options: {
    successMessage?: string
    errorMessage?: string
    onSuccess?: (result: T) => void
    onError?: (error: Error) => void
  }
): Promise<T | undefined>
```

---

## 3. 타입 안전성 개선

### 3.1 any 타입 제거 필요

**발견 위치:**
```typescript
// permission-customization-page.tsx:235
render: (_: any, record: { key: string }) => (

// admin-settlement-review-page.tsx:154
render: (_: unknown, record: Settlement) => {
```

**권장 수정:**
```typescript
// ColumnsType 제네릭 활용
const columns: ColumnsType<YourType> = [
  {
    render: (_, record) => { /* record 자동 추론 */ }
  }
]
```

### 3.2 타입 가드 추가 필요

```typescript
// 권장: shared/utils/type-guards.ts
export function isAdminUser(user: User): user is AdminUser {
  return user.role === 'ADMIN' && 'adminLevel' in user
}

export function hasPermission(
  user: User,
  permission: keyof AdminPermissions
): boolean {
  if (!isAdminUser(user)) return false
  return user.permissions[permission] === true
}
```

---

## 4. 성능 최적화

### 4.1 불필요한 리렌더링

**확인 필요 위치:**
- `permission-customization-page.tsx` - 스위치 토글 시 전체 테이블 리렌더링
- 대형 테이블 컴포넌트들 - `useMemo` 적용 확인

**권장 최적화:**
```typescript
// 테이블 컬럼 정의를 useMemo로 감싸기
const columns = useMemo(() => [
  // ... column definitions
], [dependencies])

// 개별 행 컴포넌트 분리 및 React.memo 적용
const TableRow = React.memo(({ record }: { record: Settlement }) => {
  // ...
})
```

### 4.2 API 호출 최적화

**발견된 이슈 (permission-customization-page.tsx:147-188):**
```typescript
// 저장 시 매번 fetchPermissionCustomization 호출
for (const adminLevel of adminLevels) {
  const original = await fetchPermissionCustomization() // 반복 호출!
  // ...
}
```

**권장 수정:**
```typescript
const handleSave = async () => {
  // 한 번만 호출
  const original = await fetchPermissionCustomization()

  for (const adminLevel of adminLevels) {
    const originalPerms = original.adminPermissions[adminLevel].permissions
    // ...
  }
}
```

### 4.3 번들 크기 분석

**필요 작업:**
```bash
# 번들 분석 실행
cd apps/cms
npm run build -- --analyze
# 또는
npx vite-bundle-visualizer
```

**확인 사항:**
- Ant Design 컴포넌트 트리쉐이킹 적용 여부
- 대형 라이브러리 청크 분리 여부
- 중복 의존성 확인

---

## 5. 반응형 디자인 개선

### 5.1 테스트 필요 해상도

| 해상도 | 장치 | 확인 사항 |
|--------|------|----------|
| 1920px | 데스크톱 | ✅ 확인됨 |
| 1366px | 노트북 | ✅ 확인됨 |
| 768px | 태블릿 | ⬜ 테스트 필요 |
| 375px | 모바일 | ⬜ 테스트 필요 |

### 5.2 개선 필요 컴포넌트

**테이블 컴포넌트:**
```typescript
// 현재: 고정 너비
<Table scroll={{ x: 1000 }} />

// 권장: 반응형 너비
<Table
  scroll={{ x: 'max-content' }}
  responsive
/>
```

**사이드바:**
- 768px 이하에서 자동 접힘
- 모바일에서 오버레이 메뉴

---

## 6. 테스트 코드 추가 필요

### 6.1 단위 테스트

**우선 작성 대상:**
```
apps/cms/src/shared/utils/permissions.ts
apps/cms/src/features/auth/model/auth-store.ts
apps/cms/src/entities/*/api/*-service.ts
```

**예시:**
```typescript
// __tests__/permissions.test.ts
describe('isMasterAdmin', () => {
  it('should return true for MASTER admin', () => {
    const user = { role: 'ADMIN', adminLevel: 'MASTER' }
    expect(isMasterAdmin(user)).toBe(true)
  })

  it('should return false for ADMIN level', () => {
    const user = { role: 'ADMIN', adminLevel: 'ADMIN' }
    expect(isMasterAdmin(user)).toBe(false)
  })
})
```

### 6.2 통합 테스트

**우선 작성 대상:**
- 로그인 → MFA → 대시보드 흐름
- 정산 생성 → 검토 → 승인 흐름
- 권한 요청 → 승인 → 권한 적용 흐름

---

## 7. 코드 정리

### 7.1 미사용 코드 확인

```bash
# 미사용 export 확인
npx ts-prune

# 미사용 파일 확인
npx unimported
```

### 7.2 Deprecated API 정리

**Ant Design:**
```typescript
// 현재 (permission-customization-page.tsx)
const { TabPane } = Tabs  // Deprecated

// 권장
<Tabs items={[
  { key: 'admin', label: '관리자 권한', children: <AdminTab /> },
  { key: 'program', label: '프로그램 역할 권한', children: <ProgramTab /> },
]} />
```

---

## 8. 리팩토링 우선순위

### Phase 1: 긴급 (1주)
- [ ] MFA UI 수동 테스트 및 버그 수정
- [ ] 반복 일정 기능 테스트 및 수정
- [ ] `permission-customization-page.tsx` API 호출 최적화

### Phase 2: 높음 (2주)
- [ ] API 서비스 레이어 패턴 통일
- [ ] 에러 핸들링 유틸리티 생성
- [ ] any 타입 제거

### Phase 3: 중간 (3주)
- [ ] 반응형 디자인 개선 (768px 이하)
- [ ] 테이블 컴포넌트 최적화
- [ ] 번들 크기 분석 및 최적화

### Phase 4: 낮음 (4주)
- [ ] 단위 테스트 추가
- [ ] Deprecated API 정리
- [ ] 문서화 개선

---

## 9. 관련 파일 목록

### 핵심 파일 (우선 검토)

```
apps/cms/src/
├── app/router/index.tsx                    # 라우팅 설정
├── features/auth/
│   └── model/auth-store.ts                 # 인증 상태 관리
├── pages/
│   ├── admin/
│   │   ├── admin-settlement-review-page.tsx
│   │   ├── audit-log-list-page.tsx
│   │   ├── permission-request-list-page.tsx
│   │   └── settings/permission-customization-page.tsx
│   └── auth/login-page.tsx
├── entities/
│   ├── instructor/api/instructor-service.ts
│   ├── school/api/school-service.ts
│   ├── sponsor/api/sponsor-service.ts
│   └── matching/api/matching-service.ts
└── shared/
    ├── components/protected-route.tsx      # 권한 기반 라우트 보호
    └── utils/permissions.ts                # 권한 헬퍼 함수
```

### 타입 정의 파일

```
apps/cms/src/types/
├── user.ts           # User, AdminLevel, ProgramRole
├── domain.ts         # Settlement, Program 등 도메인 타입
├── mfa.ts            # MFA 관련 타입
└── permission-customization.ts  # 권한 커스터마이징 타입
```

---

## 10. Cursor 작업 시 주의사항

1. **Mock 데이터**: 현재 모든 API는 Mock 기반. 실제 백엔드 연동 전까지 Mock 유지
2. **Ant Design 버전**: 5.x 사용 중. Deprecated API 확인 필요
3. **상태 관리**: Zustand 사용. Redux 패턴 혼용 금지
4. **코드 스플리팅**: React.lazy 패턴 유지. 새 페이지 추가 시 동일 패턴 적용

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2026-01-28 | Claude | QA 분석 기반 초기 작성 |
