---
priority: high
always_include: true
category: coding
---

# 타입 안전성 및 코드 일관성 원칙

**작성 일자**: 2025-01-20  
**기준**: 하위 호환성 코드 정리 경험 기반  
**적용 범위**: 모든 타입 정의, 함수 작성, 코드 리뷰 시 준수

---

## 🎯 핵심 원칙

### 1. Deprecated 코드 사용 금지

**원칙**: `@deprecated`로 표시된 타입, 함수, 필드는 절대 사용하지 않습니다.

**금지 사항**:
- ❌ `AdminRole` 타입 사용 (→ `AdminLevel` 사용)
- ❌ `AdminProgramRole` 타입 사용 (→ `ProgramRole` 사용)
- ❌ `STUDENT`, `VOLUNTEER` 역할 사용 (→ `INDIVIDUAL` 사용)
- ❌ `hasAdminRole()` 함수 사용 (→ `hasAdminLevel()` 사용)
- ❌ `user.adminRole` 필드 접근 (→ `user.adminLevel` 사용)
- ❌ `user.adminProgramRole` 필드 접근 (→ `user.programRoles[programId]` 사용)

**✅ 올바른 사용**:
```typescript
// ✅ 올바른 방식
if (user.adminLevel === 'MASTER') { ... }
if (hasAdminLevel(user, 'MASTER')) { ... }
if (user.programRoles?.[programId] === 'OWNER') { ... }

// ❌ 잘못된 방식
if (user.adminRole === 'MASTER') { ... }  // deprecated
if (hasAdminRole(user, 'MASTER')) { ... }  // deprecated
```

---

### 2. 하위 호환성 코드 작성 금지

**원칙**: 새로운 코드에서는 하위 호환성을 위한 별칭이나 fallback 로직을 작성하지 않습니다.

**금지 사항**:
```typescript
// ❌ 하위 호환성 코드 작성 금지
const effectiveAdminLevel = adminLevel || adminRole  // 금지
const effectiveProgramRole = programRole || adminProgramRole  // 금지

// ❌ 하위 호환성 주석과 함께 코드 작성 금지
// Phase 0.1.1: adminLevel 우선 사용, 없으면 adminRole (하위 호환성)
const level = adminLevel || adminRole  // 금지
```

**✅ 올바른 방식**:
```typescript
// ✅ 명확하고 단순한 코드
if (user.adminLevel === 'MASTER') { ... }

// ✅ 필수 값이 없으면 에러 처리
if (!user.adminLevel) {
  throw new Error('adminLevel is required')
}
```

---

### 3. 타입 일관성 유지

**원칙**: 같은 개념을 나타내는 타입은 프로젝트 전체에서 일관되게 사용합니다.

**규칙**:
- 역할 타입: `UserRole`만 사용 (`'INDIVIDUAL' | 'SCHOOL' | 'INSTRUCTOR' | 'ADMIN'`)
- 관리자 레벨: `AdminLevel`만 사용 (`'MASTER' | 'ADMIN' | 'GENERAL'`)
- 프로그램 역할: `ProgramRole`만 사용 (`'OWNER' | 'PARTNER' | 'ASSISTANT'`)

**✅ 올바른 타입 사용**:
```typescript
// ✅ 일관된 타입 사용
function checkPermission(user: User, level: AdminLevel): boolean {
  return user.role === 'ADMIN' && user.adminLevel === level
}

// ❌ 타입 혼용 금지
function checkPermission(user: User, level: AdminRole): boolean {  // AdminRole은 deprecated
  return user.role === 'ADMIN' && user.adminLevel === level
}
```

---

### 4. 함수 시그니처 일관성

**원칙**: 같은 기능을 수행하는 함수는 동일한 시그니처를 사용합니다.

**규칙**:
- 권한 확인 함수: `hasAdminLevel(user, level: AdminLevel)`
- 프로그램 역할 확인: `hasProgramRole(user, programId: string, role: ProgramRole)`
- 역할 확인: `isIndividual(user)`, `isSchool(user)`, `isInstructor(user)`

**✅ 올바른 함수 사용**:
```typescript
// ✅ 일관된 함수 시그니처
if (hasAdminLevel(user, 'MASTER')) { ... }
if (hasProgramRole(user, 'program-1', 'OWNER')) { ... }
if (isIndividual(user)) { ... }

// ❌ deprecated 함수 사용 금지
if (hasAdminRole(user, 'MASTER')) { ... }  // deprecated
if (hasAdminProgramRole(user, 'OWNER')) { ... }  // deprecated
if (isStudent(user)) { ... }  // deprecated
```

---

### 5. 필드 접근 패턴 일관성

**원칙**: 사용자 객체의 필드에 접근할 때는 새로운 필드 구조만 사용합니다.

**규칙**:
- 관리자 레벨: `user.adminLevel` (not `user.adminRole`)
- 프로그램 역할: `user.programRoles?.[programId]` (not `user.adminProgramRole`)
- 학교 정보: `user.schoolInfo?.schoolName` (not `user.schoolName`)
- 강사 정보: `user.instructorInfo` (not `user.bankInfo`)

**✅ 올바른 필드 접근**:
```typescript
// ✅ 새로운 필드 구조 사용
const adminLevel = user.adminLevel
const programRole = user.programRoles?.[programId]
const schoolName = user.schoolInfo?.schoolName
const bankInfo = user.instructorInfo

// ❌ deprecated 필드 접근 금지
const adminLevel = user.adminRole  // deprecated
const programRole = user.adminProgramRole  // deprecated
const schoolName = user.schoolName  // deprecated
const bankInfo = user.bankInfo  // deprecated
```

---

### 6. 타입 정의 정리

**원칙**: 타입 정의 파일에서는 deprecated 타입을 제거하고, 명확한 타입만 유지합니다.

**규칙**:
- `@deprecated` 주석이 있는 타입은 제거
- 하위 호환성을 위한 타입 별칭 제거
- 사용하지 않는 타입 제거

**✅ 올바른 타입 정의**:
```typescript
// ✅ 명확하고 단순한 타입 정의
export type UserRole = 'INDIVIDUAL' | 'SCHOOL' | 'INSTRUCTOR' | 'ADMIN'
export type AdminLevel = 'MASTER' | 'ADMIN' | 'GENERAL'
export type ProgramRole = 'OWNER' | 'PARTNER' | 'ASSISTANT'

// ❌ deprecated 타입 포함 금지
export type UserRole = 'INDIVIDUAL' | 'SCHOOL' | 'INSTRUCTOR' | 'ADMIN' | 'STUDENT' | 'VOLUNTEER'  // STUDENT, VOLUNTEER 제거
/** @deprecated Use AdminLevel instead */
export type AdminRole = AdminLevel  // 제거
```

---

### 7. 코드 리뷰 체크리스트

코드 리뷰 시 다음 항목을 반드시 확인합니다:

- [ ] `@deprecated` 타입/함수 사용 여부
- [ ] 하위 호환성 코드 작성 여부
- [ ] 타입 일관성 (같은 개념에 같은 타입 사용)
- [ ] 함수 시그니처 일관성
- [ ] 필드 접근 패턴 일관성
- [ ] 불필요한 조건문 (fallback 로직) 존재 여부

---

### 8. 새 기능 추가 시 주의사항

새로운 기능을 추가할 때:

1. **기존 패턴 확인**: 같은 기능을 수행하는 기존 코드의 패턴을 확인
2. **일관된 패턴 사용**: 기존 패턴과 동일한 방식으로 구현
3. **타입 재사용**: 새로운 타입을 만들기 전에 기존 타입 재사용 가능 여부 확인
4. **하위 호환성 고려 불필요**: 새로운 코드에서는 하위 호환성을 위한 별칭 작성 금지

---

### 9. 마이그레이션 시 주의사항

기존 코드를 새 패턴으로 마이그레이션할 때:

1. **점진적 마이그레이션**: 한 번에 하나의 타입/필드씩 마이그레이션
2. **타입 체크**: 각 단계마다 `npx tsc --noEmit` 실행
3. **기능 보존**: 마이그레이션 후 동일한 기능이 작동하는지 확인
4. **완전 제거**: deprecated 코드는 완전히 제거 (별칭 유지 안 함)

---

## 🚫 금지 사항 요약

### 절대 하지 말아야 할 것들

1. ❌ `@deprecated` 타입/함수 사용
2. ❌ 하위 호환성을 위한 별칭 코드 작성
3. ❌ `adminLevel || adminRole` 같은 fallback 로직
4. ❌ "하위 호환성" 주석과 함께 코드 작성
5. ❌ 같은 개념에 여러 타입 혼용
6. ❌ deprecated 필드 접근

---

## ✅ 권장 사항

### 반드시 해야 할 것들

1. ✅ 최신 타입/함수만 사용
2. ✅ 명확하고 단순한 코드 작성
3. ✅ 타입 일관성 유지
4. ✅ 함수 시그니처 일관성 유지
5. ✅ 새로운 필드 구조만 사용
6. ✅ 코드 리뷰 시 일관성 체크

---

## 📚 참고 자료

- 타입 정의: `apps/cms/src/types/user.ts`
- 권한 유틸리티: `apps/cms/src/shared/utils/permissions.ts`
- 역할 배지: `apps/cms/src/shared/ui/role-badge.tsx`
- 하위 호환성 정리 가이드: `apps/cms/docs/claude-prompt/CLEANUP_DEPRECATED_CODE.md`

---

## 🎯 목표

이 원칙을 따르면:
- ✅ 코드 일관성 향상
- ✅ 타입 안전성 강화
- ✅ 유지보수성 개선
- ✅ 버그 예방
- ✅ 개발 생산성 증가

**핵심**: "하위 호환성 코드는 작성하지 않는다. 처음부터 올바른 패턴을 사용한다."
