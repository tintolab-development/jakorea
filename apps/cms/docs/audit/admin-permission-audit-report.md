# CMS 관리자 권한 비즈니스 로직 재검증 보고서

**검증 일자**: 2026-01-23  
**검증 범위**: CMS 프로젝트 전체  
**검증 목적**: 관리자 권한 레벨(MASTER, ADMIN, GENERAL)에 따른 역할 비즈니스 로직 정확성 검증

---

## 1. 권한 체계 정의 현황

### 1.1 관리자 권한 레벨 정의

**파일**: `apps/cms/src/shared/config/permissions.ts`

```typescript
export const ADMIN_PERMISSIONS: Record<AdminLevel, AdminPermission> = {
  MASTER: {
    canManageUsers: true,
    canManageSystemSettings: true,
    canAccessAllPrograms: true,
    canDeleteUsers: true,
    canApprovePermissionRequests: true,
  },
  ADMIN: {
    canManageUsers: false,
    canManageSystemSettings: false,
    canAccessAllPrograms: false,
    canDeleteUsers: false,
    canApprovePermissionRequests: false,
  },
  GENERAL: {
    canManageUsers: false,
    canManageSystemSettings: false,
    canAccessAllPrograms: false,
    canDeleteUsers: false,
    canApprovePermissionRequests: false,
  },
}
```

**정책 요구사항** (POLICY_TO_AUDIT.md):

- **MASTER**: 모든 기능 접근 가능, 회원/권한 총괄 관리
- **ADMIN**: 프로그램 운영 전반, 신청 승인/반려, 강사 매칭, 정산 (담당 프로그램만)
- **GENERAL**: **조회 기능만**, 모든 쓰기 작업(create/update/delete) 금지

---

## 2. 발견된 문제점

### 2.1 심각도 S1: GENERAL 관리자 쓰기 작업 제한 미구현

#### 문제 1: 프로그램 관리 페이지

**파일**: `apps/cms/src/pages/programs/program-list-page.tsx`

```typescript
// 현재 코드 (245-249줄)
{isAdmin && (
  <Button type="primary" icon={<PlusOutlined />} onClick={handleNewClick}>
    프로그램 등록
  </Button>
)}
```

**문제점**:

- `isAdmin`만 체크하여 GENERAL 관리자도 버튼이 표시됨
- `adminLevel`을 확인하지 않음
- GENERAL 관리자가 프로그램을 생성/수정/삭제할 수 있음

**영향 범위**:

- 프로그램 등록 버튼
- 프로그램 수정/삭제 액션
- 프로그램 상태 변경

#### 문제 2: 신청 관리 페이지

**파일**: `apps/cms/src/pages/applications/application-list-page.tsx`

**문제점**:

- 관리자 권한만 체크하고 `adminLevel` 미체크
- GENERAL 관리자가 신청 승인/반려 가능

#### 문제 3: 강사 관리 페이지

**파일**: `apps/cms/src/pages/instructors/instructor-list-page.tsx`

```typescript
// 현재 코드 (72-79줄)
<PermissionButton
  type="primary"
  icon={<PlusOutlined />}
  onClick={handleNewClick}
  allowedRoles={['ADMIN']}
>
  강사 등록
</PermissionButton>
```

**문제점**:

- `PermissionButton`이 `allowedRoles`만 체크하고 `adminLevel`을 고려하지 않음
- GENERAL 관리자도 버튼이 표시될 수 있음

#### 문제 4: 기타 관리 페이지들

다음 페이지들에서도 동일한 문제 발견:

- `apps/cms/src/pages/posts/admin-inquiry-page.tsx` - 문의 답변/삭제
- `apps/cms/src/pages/posts/admin-notice-list-page.tsx` - 공지사항 관리
- `apps/cms/src/pages/posts/admin-faq-page.tsx` - FAQ 관리
- `apps/cms/src/pages/templates/template-*.tsx` - 템플릿 관리
- `apps/cms/src/pages/settlements/*.tsx` - 정산 관리

### 2.2 심각도 S2: 권한 체크 유틸리티 미사용

**파일**: `apps/cms/src/shared/utils/permissions.ts`

**현재 구현**:

```typescript
export function isMasterAdmin(user: Omit<User, 'password'> | null): boolean {
  return Boolean(user && user.role === 'ADMIN' && user.adminLevel === 'MASTER')
}

export function hasAdminLevel(
  user: Omit<User, 'password'> | null,
  adminLevel: AdminLevel
): boolean {
  return Boolean(user && user.role === 'ADMIN' && user.adminLevel === adminLevel)
}
```

**문제점**:

- 유틸리티 함수는 존재하지만 실제 페이지에서 사용되지 않음
- GENERAL 관리자를 체크하는 전용 함수가 없음

### 2.3 심각도 S2: PermissionButton 컴포넌트의 한계

**파일**: `apps/cms/src/shared/components/permission-button.tsx`

**현재 구현**:

```typescript
export function PermissionButton({
  allowedRoles,
  hideIfNoPermission = true,
  disabled,
  ...props
}: PermissionButtonProps) {
  const { user } = useAuthStore()
  const hasPermission = allowedRoles ? hasAnyRole(user, allowedRoles) : true
  // ...
}
```

**문제점**:

- `allowedRoles`만 체크하고 `adminLevel`을 고려하지 않음
- GENERAL 관리자 제한 로직이 없음

### 2.4 심각도 S3: ProtectedRoute의 불완전한 구현

**파일**: `apps/cms/src/shared/components/protected-route.tsx`

**현재 코드 (108-122줄)**:

```typescript
// Phase 0.1.5: 관리자 레벨별 접근 제어
if (user?.role === 'ADMIN') {
  // MASTER 관리자는 모든 경로 접근 가능
  if (user.adminLevel === 'MASTER') {
    // 접근 허용
  }
  // ADMIN 레벨은 일반 관리자 권한
  else if (user.adminLevel === 'ADMIN') {
    // 일반 관리자 권한 (프로그램 ACL로 제어됨)
  }
  // GENERAL 레벨은 제한된 권한
  else if (user.adminLevel === 'GENERAL') {
    // 일반 관리자보다 더 제한된 권한 (필요시 추가 체크)
  }
}
```

**문제점**:

- 주석만 있고 실제 제한 로직이 없음
- GENERAL 관리자가 쓰기 작업이 필요한 경로에 접근할 수 있음

---

## 3. 권한 매트릭스 (현재 vs 요구사항)

### 3.1 프로그램 관리

| 액션          | MASTER | ADMIN       | GENERAL | 현재 구현           |
| ------------- | ------ | ----------- | ------- | ------------------- |
| 프로그램 조회 | ✅     | ✅          | ✅      | ✅                  |
| 프로그램 생성 | ✅     | ✅          | ❌      | ❌ (GENERAL도 가능) |
| 프로그램 수정 | ✅     | ✅ (담당만) | ❌      | ❌ (GENERAL도 가능) |
| 프로그램 삭제 | ✅     | ✅ (담당만) | ❌      | ❌ (GENERAL도 가능) |
| 상태 변경     | ✅     | ✅ (담당만) | ❌      | ❌ (GENERAL도 가능) |

### 3.2 신청 관리

| 액션           | MASTER | ADMIN | GENERAL | 현재 구현           |
| -------------- | ------ | ----- | ------- | ------------------- |
| 신청 조회      | ✅     | ✅    | ✅      | ✅                  |
| 신청 승인/반려 | ✅     | ✅    | ❌      | ❌ (GENERAL도 가능) |
| 신청 수정      | ✅     | ✅    | ❌      | ❌ (GENERAL도 가능) |
| 신청 삭제      | ✅     | ✅    | ❌      | ❌ (GENERAL도 가능) |

### 3.3 강사 관리

| 액션      | MASTER | ADMIN | GENERAL | 현재 구현           |
| --------- | ------ | ----- | ------- | ------------------- |
| 강사 조회 | ✅     | ✅    | ✅      | ✅                  |
| 강사 등록 | ✅     | ✅    | ❌      | ❌ (GENERAL도 가능) |
| 강사 수정 | ✅     | ✅    | ❌      | ❌ (GENERAL도 가능) |
| 강사 삭제 | ✅     | ✅    | ❌      | ❌ (GENERAL도 가능) |

---

## 4. 수정 방안

### 4.1 권한 체크 유틸리티 함수 추가

**파일**: `apps/cms/src/shared/utils/permissions.ts`

```typescript
/**
 * GENERAL 관리자인지 확인
 */
export function isGeneralAdmin(user: Omit<User, 'password'> | null): boolean {
  return Boolean(user && user.role === 'ADMIN' && user.adminLevel === 'GENERAL')
}

/**
 * 쓰기 작업(create/update/delete)이 가능한 관리자인지 확인
 * GENERAL은 모든 쓰기 작업 금지
 */
export function canPerformWriteAction(user: Omit<User, 'password'> | null): boolean {
  if (!user || user.role !== 'ADMIN') return false
  return user.adminLevel === 'MASTER' || user.adminLevel === 'ADMIN'
}

/**
 * 특정 관리자 레벨 이상의 권한이 있는지 확인
 */
export function hasAdminLevelOrAbove(
  user: Omit<User, 'password'> | null,
  minLevel: AdminLevel
): boolean {
  if (!user || user.role !== 'ADMIN') return false

  const levelHierarchy: Record<AdminLevel, number> = {
    MASTER: 3,
    ADMIN: 2,
    GENERAL: 1,
  }

  return (levelHierarchy[user.adminLevel || 'GENERAL'] || 0) >= levelHierarchy[minLevel]
}
```

### 4.2 PermissionButton 컴포넌트 개선

**파일**: `apps/cms/src/shared/components/permission-button.tsx`

```typescript
export interface PermissionButtonProps extends ComponentProps<typeof Button> {
  allowedRoles?: UserRole[]
  hideIfNoPermission?: boolean
  /**
   * 쓰기 작업인지 여부 (GENERAL 관리자 제한)
   */
  isWriteAction?: boolean
  /**
   * 최소 관리자 레벨 요구사항
   */
  minAdminLevel?: AdminLevel
}

export function PermissionButton({
  allowedRoles,
  hideIfNoPermission = true,
  isWriteAction = false,
  minAdminLevel,
  disabled,
  ...props
}: PermissionButtonProps) {
  const { user } = useAuthStore()

  // 역할 체크
  const hasRolePermission = allowedRoles
    ? hasAnyRole(user, allowedRoles)
    : true

  // 쓰기 작업인 경우 GENERAL 제한
  const canWrite = isWriteAction ? canPerformWriteAction(user) : true

  // 관리자 레벨 체크
  const hasAdminLevelPermission = minAdminLevel
    ? hasAdminLevelOrAbove(user, minAdminLevel)
    : true

  const hasPermission = hasRolePermission && canWrite && hasAdminLevelPermission

  if (!hasPermission && hideIfNoPermission) {
    return null
  }

  return <Button {...props} disabled={disabled || !hasPermission} />
}
```

### 4.3 페이지별 수정 예시

#### 프로그램 목록 페이지

```typescript
// 수정 전
{isAdmin && (
  <Button type="primary" icon={<PlusOutlined />} onClick={handleNewClick}>
    프로그램 등록
  </Button>
)}

// 수정 후
<PermissionButton
  type="primary"
  icon={<PlusOutlined />}
  onClick={handleNewClick}
  allowedRoles={['ADMIN']}
  isWriteAction={true}
>
  프로그램 등록
</PermissionButton>
```

#### 프로그램 상세 Drawer

```typescript
// 수정 전
const isAdmin = user?.role === 'ADMIN'
const showActions = !hideActions && isAdmin

// 수정 후
const isAdmin = user?.role === 'ADMIN'
const canWrite = canPerformWriteAction(user)
const showActions = !hideActions && isAdmin && canWrite
```

### 4.4 ProtectedRoute 개선

```typescript
// Phase 0.1.5: 관리자 레벨별 접근 제어
if (user?.role === 'ADMIN') {
  // GENERAL 관리자는 쓰기 작업이 필요한 경로 접근 금지
  if (user.adminLevel === 'GENERAL') {
    const writeActionPaths = [
      '/programs/create',
      '/programs/:id/edit',
      '/applications/:id/approve',
      '/instructors/create',
      // ... 기타 쓰기 작업 경로
    ]

    const isWriteActionPath = writeActionPaths.some(path => {
      const pattern = path.replace(/:id/g, '[^/]+')
      return new RegExp(`^${pattern}$`).test(location.pathname)
    })

    if (isWriteActionPath) {
      return <Navigate to="/forbidden" replace />
    }
  }
}
```

---

## 5. 수정 우선순위

### 우선순위 P0 (즉시 수정 필요)

1. ✅ 권한 체크 유틸리티 함수 추가 (`canPerformWriteAction`, `isGeneralAdmin`)
2. ✅ `PermissionButton` 컴포넌트 개선
3. ✅ 프로그램 관리 페이지 수정
4. ✅ 신청 관리 페이지 수정
5. ✅ 강사 관리 페이지 수정

### 우선순위 P1 (1주일 내)

6. ✅ 템플릿 관리 페이지 수정
7. ✅ 정산 관리 페이지 수정
8. ✅ 게시글 관리 페이지 수정
9. ✅ `ProtectedRoute` 개선

### 우선순위 P2 (2주일 내)

10. ✅ 기타 관리 페이지들 수정
11. ✅ API 서비스 레벨 권한 체크 추가
12. ✅ 테스트 코드 작성

---

## 6. 테스트 시나리오

### 6.1 GENERAL 관리자 테스트

1. **프로그램 관리**
   - [ ] 프로그램 목록 조회 가능
   - [ ] 프로그램 등록 버튼 비활성화/숨김
   - [ ] 프로그램 수정 버튼 비활성화/숨김
   - [ ] 프로그램 삭제 버튼 비활성화/숨김
   - [ ] 프로그램 상태 변경 불가

2. **신청 관리**
   - [ ] 신청 목록 조회 가능
   - [ ] 신청 승인/반려 불가
   - [ ] 신청 수정 불가
   - [ ] 신청 삭제 불가

3. **강사 관리**
   - [ ] 강사 목록 조회 가능
   - [ ] 강사 등록 불가
   - [ ] 강사 수정 불가
   - [ ] 강사 삭제 불가

---

## 7. 결론

현재 CMS 프로젝트의 관리자 권한 비즈니스 로직은 **정의는 명확하지만 실제 구현이 부족**합니다. 특히 **GENERAL 관리자에 대한 쓰기 작업 제한이 전혀 구현되지 않았습니다**.

주요 문제점:

1. ❌ GENERAL 관리자가 모든 쓰기 작업을 수행할 수 있음
2. ❌ 권한 체크가 `isAdmin`만으로 이루어짐
3. ❌ `adminLevel`을 고려한 체크가 없음
4. ❌ 권한 체크 유틸리티가 정의되어 있으나 사용되지 않음

**즉시 수정이 필요하며**, 위의 수정 방안에 따라 단계적으로 개선해야 합니다.
