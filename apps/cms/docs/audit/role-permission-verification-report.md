# 역할 및 권한 구조 검증 보고서

> **검증 일자**: 2026-01-27  
> **검증자**: PM 기획자  
> **검증 목적**: 로그인에 따른 역할 및 권한 구조가 요구사항에 맞게 구성되어 있는지 검증

---

## 📋 요구사항

### 목표 구조
1. **관리자**: 마스터 관리자, 중간 관리자, 일반 관리자
2. **사용자**: 학교, 강사, 학생

---

## ✅ 현재 구현 상태

### 1. 관리자 역할 구조

#### 타입 정의 (`src/types/user.ts`)
```typescript
export type UserRole = 'INDIVIDUAL' | 'SCHOOL' | 'INSTRUCTOR' | 'ADMIN'
export type AdminLevel = 'MASTER' | 'ADMIN' | 'GENERAL'
```

#### 권한 정의 (`src/shared/config/permissions.ts`)
```typescript
export const ADMIN_PERMISSIONS: Record<AdminLevel, AdminPermission> = {
  MASTER: {
    label: '마스터 관리자',  // ✅ 올바름
    description: '회원/권한 총괄 관리, 시스템 설정, 모든 기능 접근',
    // ... 모든 권한 true
  },
  ADMIN: {
    label: '관리자',  // ⚠️ "중간 관리자"로 명시되지 않음
    description: '프로그램 운영 전반, 신청 승인/반려, 강사 매칭, 정산',
    // ... 제한된 권한
  },
  GENERAL: {
    label: '일반',  // ⚠️ "일반 관리자"로 명시되지 않음
    description: '조회 기능만 (기본값, 권한부여 0)',
    // ... 모든 권한 false (조회만)
  },
}
```

#### 계층 구조
- **MASTER (레벨 3)**: 전체 시스템 접근, 사용자 관리, 시스템 설정
- **ADMIN (레벨 2)**: 프로그램 운영, 승인/반려, 강사 매칭, 정산 (담당 프로그램만)
- **GENERAL (레벨 1)**: 조회 기능만 (쓰기 작업 불가)

#### 검증 결과
- ✅ **마스터 관리자 (MASTER)**: 올바르게 구현됨
- ⚠️ **중간 관리자 (ADMIN)**: 기능적으로는 올바르지만, 라벨이 "관리자"로만 표시됨
- ⚠️ **일반 관리자 (GENERAL)**: 기능적으로는 올바르지만, 라벨이 "일반"으로만 표시됨

---

### 2. 사용자 역할 구조

#### 타입 정의
```typescript
export type UserRole = 'INDIVIDUAL' | 'SCHOOL' | 'INSTRUCTOR' | 'ADMIN'
```

#### 역할별 라벨 (`src/shared/components/role-badge.tsx`)
```typescript
const roleConfig: Record<UserRole, { label: string; ... }> = {
  ADMIN: { label: '관리자', ... },
  INSTRUCTOR: { label: '강사', ... },  // ✅ 올바름
  INDIVIDUAL: { label: '개인(참여자)', ... },  // ⚠️ "학생"으로 표시되지 않음
  SCHOOL: { label: '학교', ... },  // ✅ 올바름
}
```

#### 검증 결과
- ✅ **학교 (SCHOOL)**: 올바르게 구현됨
- ✅ **강사 (INSTRUCTOR)**: 올바르게 구현됨
- ⚠️ **학생 (INDIVIDUAL)**: 기능적으로는 올바르지만, 라벨이 "개인(참여자)"로 표시됨

---

## 🔍 상세 검증

### 1. 관리자 레벨별 권한 검증

#### MASTER (마스터 관리자)
- ✅ `canManageUsers: true` - 사용자 관리 가능
- ✅ `canManageSystemSettings: true` - 시스템 설정 가능
- ✅ `canAccessAllPrograms: true` - 모든 프로그램 접근
- ✅ `canDeleteUsers: true` - 사용자 삭제 가능
- ✅ `canApprovePermissionRequests: true` - 권한 요청 승인 가능

#### ADMIN (중간 관리자)
- ✅ `canManageUsers: false` - 사용자 관리 불가
- ✅ `canManageSystemSettings: false` - 시스템 설정 불가
- ✅ `canAccessAllPrograms: false` - 담당 프로그램만 접근
- ✅ `canDeleteUsers: false` - 사용자 삭제 불가
- ✅ `canApprovePermissionRequests: false` - 권한 요청 승인 불가
- ✅ 프로그램 운영, 승인/반려, 강사 매칭, 정산 기능 가능

#### GENERAL (일반 관리자)
- ✅ `canManageUsers: false` - 사용자 관리 불가
- ✅ `canManageSystemSettings: false` - 시스템 설정 불가
- ✅ `canAccessAllPrograms: false` - 담당 프로그램만 접근
- ✅ `canDeleteUsers: false` - 사용자 삭제 불가
- ✅ `canApprovePermissionRequests: false` - 권한 요청 승인 불가
- ✅ `canPerformWriteAction: false` - 모든 쓰기 작업 불가 (조회만)

### 2. 사용자 역할별 기능 검증

#### SCHOOL (학교)
- ✅ 학교 정보 관리 (`schoolInfo`)
- ✅ 학생 명단 업로드
- ✅ 학교 단위 수료증 다운로드
- ✅ 프로그램 신청 (학교 단위)

#### INSTRUCTOR (강사)
- ✅ 강사 정보 관리 (`instructorInfo`)
- ✅ 강의 신청, 매칭/일정 확인
- ✅ 강의보고서 제출
- ✅ 강사비/교통비 산출내역 확인

#### INDIVIDUAL (학생)
- ✅ 프로그램 신청 (개인)
- ✅ 신청내역/진행상황 확인
- ✅ 일정 확인, 과제 제출
- ✅ 수료증/활동 확인서 발급

---

## ⚠️ 발견된 이슈

### 1. 라벨 명확성 문제

#### 문제점
1. **ADMIN 레벨**: 라벨이 "관리자"로만 표시되어 "중간 관리자"임을 명확히 알 수 없음
2. **GENERAL 레벨**: 라벨이 "일반"으로만 표시되어 "일반 관리자"임을 명확히 알 수 없음
3. **INDIVIDUAL 역할**: 라벨이 "개인(참여자)"로 표시되어 "학생"임을 명확히 알 수 없음

#### 영향도
- **중간**: 사용자 경험 측면에서 혼란 가능성
- 기능적으로는 문제 없음 (권한 체계는 올바르게 작동)

#### 권장 조치
1. `ADMIN` 레벨 라벨을 "중간 관리자"로 변경
2. `GENERAL` 레벨 라벨을 "일반 관리자"로 변경
3. `INDIVIDUAL` 역할 라벨을 "학생"으로 변경 (또는 "학생(개인)"으로 변경)

---

## ✅ 검증 결론

### 구조적 측면
- ✅ **관리자 3단계 구조**: MASTER, ADMIN, GENERAL이 올바르게 구현됨
- ✅ **사용자 3가지 역할**: SCHOOL, INSTRUCTOR, INDIVIDUAL이 올바르게 구현됨
- ✅ **권한 계층 구조**: 각 레벨별 권한이 올바르게 분리됨
- ✅ **인증/인가 로직**: 역할 및 권한 검증이 올바르게 작동함

### UI/UX 측면
- ⚠️ **라벨 명확성**: 일부 라벨이 요구사항과 다르게 표시됨
- ✅ **기능 분리**: 각 역할별 기능이 올바르게 분리됨
- ✅ **접근 제어**: ProtectedRoute 및 권한 체크가 올바르게 작동함

### 최종 평가
**구조적으로는 요구사항에 맞게 구현되어 있으나, UI 라벨 명확성 개선이 필요합니다.**

---

## 📝 권장 사항

### 즉시 조치 필요
1. **라벨 명확화**
   - `ADMIN` → "중간 관리자"
   - `GENERAL` → "일반 관리자"
   - `INDIVIDUAL` → "학생" (또는 "학생(개인)")

### 향후 개선 사항
1. **관리자 레벨 설명 강화**: 각 레벨별 권한 설명을 UI에 더 명확히 표시
2. **역할별 가이드**: 각 역할별로 접근 가능한 기능을 안내하는 가이드 제공

---

**보고서 작성자**: PM 기획자  
**검증 완료 일자**: 2026-01-27
