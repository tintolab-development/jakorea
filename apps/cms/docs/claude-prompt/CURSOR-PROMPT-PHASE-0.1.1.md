# Cursor AI 작업 프롬프트: Phase 0.1.1 역할/권한 체계 재정의

> **중요**: 이 프롬프트를 Cursor AI에 복사하여 사용하세요.
> Claude Code가 QA 역할로 대기 중입니다. 작업 완료 후 typecheck/lint/build 검증을 요청하세요.

---

## 프롬프트 시작

```
당신은 JA Korea CMS 프로젝트의 Phase 0.1.1 "역할/권한 체계 재정의" 작업을 수행합니다.

## 배경
현재 코드베이스의 역할 구조가 요구사항(requirements.md)과 불일치합니다.
이 작업에서 역할 체계를 요구사항에 맞게 재정의합니다.

## 현재 상태 (변경 전)
- UserRole: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' | 'VOLUNTEER'
- AdminRole: 'MASTER' | 'ADMIN' | 'GENERAL' (유지)
- AdminProgramRole: 'OWNER' | 'PARTNER' | 'ASSISTANT' (유지)

## 목표 상태 (변경 후)
- UserRole: 'INDIVIDUAL' | 'SCHOOL' | 'INSTRUCTOR' | 'ADMIN'
- AdminLevel: 'MASTER' | 'ADMIN' | 'GENERAL' (이름 변경: AdminRole → AdminLevel)
- ProgramRole: 'OWNER' | 'PARTNER' | 'ASSISTANT' (이름 변경: AdminProgramRole → ProgramRole)

---

## 작업 순서 (반드시 이 순서대로 진행)

### Step 1: 타입 정의 수정 - src/types/user.ts

다음과 같이 수정하세요:

```typescript
/**
 * 사용자 계정 및 권한 타입 정의
 * Phase 0.1.1: 역할/권한 체계 재정의
 * requirements.md §2 역할 및 권한 기준
 */

import type { UUID, DateValue } from './index'

// ===== 역할 정의 =====

// 프론트 사용자 역할 (§2.1)
export type UserRole = 'INDIVIDUAL' | 'SCHOOL' | 'INSTRUCTOR' | 'ADMIN'

// 관리자 권한 레벨 (§2.2)
export type AdminLevel = 'MASTER' | 'ADMIN' | 'GENERAL'

// 프로그램 단위 역할 (§백오피스 권한 구조)
export type ProgramRole = 'OWNER' | 'PARTNER' | 'ASSISTANT'

// 강사 면접 상태 (기존 유지)
export type InterviewStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'APPROVED'
  | 'REJECTED'

// ===== 사용자 인터페이스 =====

export interface User {
  id: UUID
  email: string
  password: string
  name: string
  phone?: string
  role: UserRole

  // 관리자 전용 (role === 'ADMIN'일 때만 사용)
  adminLevel?: AdminLevel
  programRoles?: Record<string, ProgramRole> // { [programId]: role }

  // 학교 전용 (role === 'SCHOOL'일 때만 사용)
  schoolInfo?: {
    schoolName: string
    address: string
    detailAddress?: string
    zipCode?: string
  }

  // 강사 전용 (role === 'INSTRUCTOR'일 때만 사용)
  instructorInfo?: {
    instructorId?: UUID
    interviewStatus?: InterviewStatus
    interviewScheduledAt?: DateValue
    interviewCompletedAt?: DateValue
    participationHistory?: number
    bankInfo?: {
      bankName: string
      accountHolder: string
      accountNumber: string
    }
    isBusinessIncome?: boolean // 사업소득자 여부 (3.3% vs 8.8%)
  }

  // 계정 상태
  isActive: boolean
  lastLoginAt?: DateValue
  createdAt: DateValue
  updatedAt: DateValue
}

// ===== 레거시 타입 별칭 (호환성) =====
// 점진적 마이그레이션을 위해 유지, 추후 제거 예정
/** @deprecated AdminLevel 사용 권장 */
export type AdminRole = AdminLevel
/** @deprecated ProgramRole 사용 권장 */
export type AdminProgramRole = ProgramRole

// ===== 요청/응답 인터페이스 =====

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: Omit<User, 'password'>
  token: string
  expiresAt: DateValue
}
```

### Step 2: 권한 유틸리티 수정 - src/shared/utils/permissions.ts

다음과 같이 수정하세요:

```typescript
/**
 * 권한 검증 유틸리티 함수
 * Phase 0.1.1: 역할/권한 체계 재정의
 */

import type { AdminLevel, ProgramRole, User, UserRole } from '@/types/user'

// ===== 기본 역할 체크 =====

export function hasRole(user: Omit<User, 'password'> | null, role: UserRole): boolean {
  if (!user) return false
  return user.role === role
}

export function hasAnyRole(user: Omit<User, 'password'> | null, roles: UserRole[]): boolean {
  if (!user || roles.length === 0) return false
  return roles.includes(user.role)
}

// ===== 프론트 사용자 역할 체크 =====

export function isIndividual(user: Omit<User, 'password'> | null): boolean {
  return hasRole(user, 'INDIVIDUAL')
}

export function isSchool(user: Omit<User, 'password'> | null): boolean {
  return hasRole(user, 'SCHOOL')
}

export function isInstructor(user: Omit<User, 'password'> | null): boolean {
  return hasRole(user, 'INSTRUCTOR')
}

export function isAdmin(user: Omit<User, 'password'> | null): boolean {
  return hasRole(user, 'ADMIN')
}

// ===== 관리자 레벨 체크 =====

export function hasAdminLevel(user: Omit<User, 'password'> | null, level: AdminLevel): boolean {
  return Boolean(user && user.role === 'ADMIN' && user.adminLevel === level)
}

export function isMasterAdmin(user: Omit<User, 'password'> | null): boolean {
  return hasAdminLevel(user, 'MASTER')
}

export function isGeneralAdmin(user: Omit<User, 'password'> | null): boolean {
  return hasAdminLevel(user, 'GENERAL')
}

// ===== 프로그램 역할 체크 =====

export function getProgramRole(user: Omit<User, 'password'> | null, programId: string): ProgramRole | null {
  if (!user || user.role !== 'ADMIN' || !user.programRoles) return null
  return user.programRoles[programId] || null
}

export function hasProgramRole(user: Omit<User, 'password'> | null, programId: string, role: ProgramRole): boolean {
  return getProgramRole(user, programId) === role
}

export function isProgramOwner(user: Omit<User, 'password'> | null, programId: string): boolean {
  return hasProgramRole(user, programId, 'OWNER')
}

export function isProgramPartner(user: Omit<User, 'password'> | null, programId: string): boolean {
  return hasProgramRole(user, programId, 'PARTNER')
}

export function isProgramAssistant(user: Omit<User, 'password'> | null, programId: string): boolean {
  return hasProgramRole(user, programId, 'ASSISTANT')
}

// ===== 권한 레벨 비교 =====

const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 4,
  INSTRUCTOR: 3,
  SCHOOL: 2,
  INDIVIDUAL: 1,
}

export function hasHigherRole(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2]
}

export function hasEqualOrHigherRole(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2]
}

// ===== 레거시 함수 (호환성) =====
// 점진적 마이그레이션을 위해 유지

/** @deprecated isIndividual 또는 isSchool 사용 권장 */
export function isStudent(user: Omit<User, 'password'> | null): boolean {
  return hasAnyRole(user, ['INDIVIDUAL', 'SCHOOL'])
}

/** @deprecated isInstructor 사용 권장 */
export function isInstructorOrStudent(user: Omit<User, 'password'> | null): boolean {
  return hasAnyRole(user, ['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL'])
}

/** @deprecated hasAdminLevel 사용 권장 */
export function hasAdminRole(user: Omit<User, 'password'> | null, adminRole: AdminLevel): boolean {
  return hasAdminLevel(user, adminRole)
}

/** @deprecated hasProgramRole 사용 권장 */
export function hasAdminProgramRole(user: Omit<User, 'password'> | null, programRole: ProgramRole): boolean {
  // 전역 체크 (특정 프로그램 ID 없이) - 하나라도 해당 역할이 있으면 true
  if (!user || user.role !== 'ADMIN' || !user.programRoles) return false
  return Object.values(user.programRoles).includes(programRole)
}
```

### Step 3: Mock 데이터 수정 - src/data/mock/users.ts

기존 Mock 사용자의 role을 새 역할로 매핑하세요:

**매핑 규칙:**
- `STUDENT` → `INDIVIDUAL` (개인 참여자)
- `VOLUNTEER` → `INDIVIDUAL` (봉사자도 개인으로 통합)
- `INSTRUCTOR` → `INSTRUCTOR` (유지)
- `ADMIN` → `ADMIN` (유지)

**테스트 계정 추가:**
```typescript
// 새 역할 체계 테스트 계정
{ email: 'individual@test.com', role: 'INDIVIDUAL', name: '개인 테스트' },
{ email: 'school@test.com', role: 'SCHOOL', name: '학교 테스트', schoolInfo: { schoolName: '테스트초등학교', address: '서울시 강남구' } },
{ email: 'instructor@test.com', role: 'INSTRUCTOR', name: '강사 테스트' },
{ email: 'master@jakorea.or.kr', role: 'ADMIN', adminLevel: 'MASTER', name: '마스터 관리자' },
{ email: 'admin@jakorea.or.kr', role: 'ADMIN', adminLevel: 'ADMIN', name: '관리자' },
{ email: 'general@jakorea.or.kr', role: 'ADMIN', adminLevel: 'GENERAL', name: '일반 관리자' },
```

### Step 4: 메뉴 설정 수정 - src/shared/config/menu-config.tsx

**allowedRoles 매핑 규칙:**
- `['STUDENT']` → `['INDIVIDUAL', 'SCHOOL']`
- `['STUDENT', 'INSTRUCTOR']` → `['INDIVIDUAL', 'SCHOOL', 'INSTRUCTOR']`
- `['VOLUNTEER']` → `['INDIVIDUAL', 'SCHOOL']` (봉사단은 역할이 아닌 기능)
- `['ADMIN']` → `['ADMIN']` (유지)

**canAccessPath 함수 수정:**
- `STUDENT` 체크 → `INDIVIDUAL` 또는 `SCHOOL` 체크로 변경

### Step 5: 권한 정책 파일 생성 - src/shared/config/permissions.ts (신규)

```typescript
/**
 * 권한 정책 정의
 * Phase 0.1.1: 역할/권한 체계 재정의
 * requirements.md §2.2 관리자 권한 정의
 */

import type { AdminLevel, ProgramRole } from '@/types/user'

// §2.2 관리자 권한 정의
export const ADMIN_PERMISSIONS: Record<AdminLevel, {
  label: string
  description: string
  canManageUsers: boolean
  canManageSystemSettings: boolean
  canAccessAllPrograms: boolean
  canDeleteUsers: boolean
  canApprovePermissionRequests: boolean
}> = {
  MASTER: {
    label: '마스터 관리자',
    description: '회원/권한 총괄 관리, 시스템 설정, 모든 기능 접근',
    canManageUsers: true,
    canManageSystemSettings: true,
    canAccessAllPrograms: true,
    canDeleteUsers: true,
    canApprovePermissionRequests: true,
  },
  ADMIN: {
    label: '관리자',
    description: '프로그램 운영 전반, 신청 승인/반려, 강사 매칭, 정산',
    canManageUsers: false,
    canManageSystemSettings: false,
    canAccessAllPrograms: false,
    canDeleteUsers: false,
    canApprovePermissionRequests: false,
  },
  GENERAL: {
    label: '일반',
    description: '조회 기능만 (기본값)',
    canManageUsers: false,
    canManageSystemSettings: false,
    canAccessAllPrograms: false,
    canDeleteUsers: false,
    canApprovePermissionRequests: false,
  },
}

// §백오피스 프로그램 역할 정의
export const PROGRAM_ROLE_PERMISSIONS: Record<ProgramRole, {
  label: string
  description: string
  canCreate: boolean
  canUpload: boolean
  canDownload: boolean
  canDelete: boolean
  canApprove: boolean
}> = {
  OWNER: {
    label: '담당자',
    description: '해당 사업 총괄 담당자',
    canCreate: true,
    canUpload: true,
    canDownload: true,
    canDelete: true,
    canApprove: true,
  },
  PARTNER: {
    label: '파트너',
    description: '총괄사업 담당자와 공동 진행 내부 직원',
    canCreate: true,
    canUpload: true,
    canDownload: false,
    canDelete: false,
    canApprove: true,
  },
  ASSISTANT: {
    label: '보조',
    description: '뷰어 기능만 (업로드/다운로드/삭제 제외)',
    canCreate: false,
    canUpload: false,
    canDownload: false,
    canDelete: false,
    canApprove: false,
  },
}

// 역할 라벨
export const USER_ROLE_LABELS: Record<string, string> = {
  INDIVIDUAL: '개인',
  SCHOOL: '학교',
  INSTRUCTOR: '강사',
  ADMIN: '관리자',
}
```

---

## 주의사항 (반드시 준수)

### 절대 수정하지 마세요:
1. **정산 관련 파일** - Phase 0.4.3 작업 중이므로 충돌 방지
   - `src/pages/settlements/*`
   - `src/features/settlement/*`
   - `src/types/settlement.ts`
   - `src/types/settlement-calculation.ts`

2. **라우터 파일** - Step 4 이후 별도 작업
   - `src/app/router/index.tsx`

### 컴파일 에러 해결 방법:
역할 변경 후 다른 파일에서 타입 에러가 발생하면:

1. **'STUDENT' 에러**: `'INDIVIDUAL'` 또는 `['INDIVIDUAL', 'SCHOOL']`로 변경
2. **'VOLUNTEER' 에러**: `'INDIVIDUAL'`로 변경
3. **AdminRole 에러**: `AdminLevel`로 변경
4. **AdminProgramRole 에러**: `ProgramRole`로 변경

### 레거시 호환성:
- `@deprecated` 주석이 있는 타입/함수는 삭제하지 마세요
- 점진적 마이그레이션을 위해 유지합니다

---

## 완료 확인

작업 완료 후 다음을 확인하세요:

1. `pnpm typecheck` 에러 없음
2. `pnpm lint` 에러 없음 (warning은 허용)
3. `pnpm build` 성공

문제 발생 시 Claude Code에 QA 요청하세요.
```

---

## 프롬프트 끝

위 프롬프트를 Cursor AI에 복사하여 실행하세요.

