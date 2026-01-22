# 하위 호환성 코드 정리 프롬프트

## 작업 목표
Phase 0.1.1에서 추가한 하위 호환성 코드(`@deprecated` 타입/함수)를 제거하고, 모든 코드를 새로운 타입 체계로 마이그레이션합니다.

## 작업 범위

### 1. 타입 마이그레이션
- `STUDENT` → `INDIVIDUAL` (모든 사용처)
- `VOLUNTEER` → `INDIVIDUAL` (모든 사용처)
- `AdminRole` → `AdminLevel` (모든 사용처)
- `AdminProgramRole` → `ProgramRole` (모든 사용처)
- `StudentType` → 제거 (사용처 없음 확인 후)

### 2. 필드 마이그레이션
- `user.adminRole` → `user.adminLevel`
- `user.adminProgramRole` → `user.programRoles[programId]`
- `user.studentType` → 제거
- `user.schoolName` → `user.schoolInfo?.schoolName`
- `user.bankInfo` → `user.instructorInfo`

### 3. 함수 마이그레이션
- `hasAdminRole()` → `hasAdminLevel()`
- `hasAdminProgramRole()` → `hasProgramRole(programId, role)`
- `isInstructorOrStudent()` → `isInstructorOrIndividual()`
- `isStudent()` → `isIndividual()`
- `getAdminProgramRoleLabel()` → `getProgramRoleLabel()`

### 4. 타입 정의 정리
- `apps/cms/src/types/user.ts`에서 deprecated 타입/필드 제거
- `apps/cms/src/shared/utils/permissions.ts`에서 deprecated 함수 제거
- `apps/cms/src/shared/ui/role-badge.tsx`에서 deprecated 함수 제거

## 작업 지침

### 단계별 접근
1. **검색 및 분석** (먼저 수행)
   - `STUDENT`, `VOLUNTEER`, `AdminRole`, `AdminProgramRole` 사용처 전체 검색
   - 각 사용처의 컨텍스트 파악
   - 마이그레이션 영향도 분석

2. **타입 정의 정리**
   - `user.ts`에서 deprecated 타입 제거
   - 타입 오류 발생 시 해당 사용처 수정

3. **필드 사용처 수정**
   - `adminRole` → `adminLevel` 변경
   - `adminProgramRole` → `programRoles` 변경
   - `schoolName` → `schoolInfo.schoolName` 변경

4. **함수 사용처 수정**
   - deprecated 함수 호출을 새 함수로 변경
   - 함수 시그니처 변경에 따른 인자 수정

5. **검증**
   - `npx tsc --noEmit` 실행하여 타입 오류 확인
   - `eslint` 실행하여 린트 오류 확인
   - 주요 기능 동작 확인

### 주의사항
- **점진적 수정**: 한 번에 하나의 타입/필드씩 마이그레이션
- **타입 안전성 유지**: 모든 변경 후 TypeScript 컴파일 확인
- **기능 보존**: 마이그레이션 후 동일한 기능이 작동해야 함
- **하위 호환성 제거**: deprecated 코드는 완전히 제거 (별칭 유지 안 함)

### 예외 처리
- Mock 데이터는 하위 호환성을 위해 일부 유지 가능 (테스트용)
- 외부 API 응답 타입은 별도 처리 필요 시 주석 추가

## 검증 체크리스트
- [ ] `npx tsc --noEmit` 통과
- [ ] `eslint` 통과
- [ ] `STUDENT`, `VOLUNTEER` 타입 사용처 없음
- [ ] `AdminRole`, `AdminProgramRole` 타입 사용처 없음
- [ ] deprecated 함수 호출 없음
- [ ] deprecated 필드 접근 없음
- [ ] 모든 테스트 계정 정상 작동

## 예상 작업 시간
- 타입 정의 정리: 10분
- 필드 마이그레이션: 30-40분
- 함수 마이그레이션: 20-30분
- 검증 및 수정: 20-30분
- **총 예상 시간: 1.5-2시간**

## 시작 프롬프트

```
Phase 0.1.1에서 추가한 하위 호환성 코드를 정리해주세요.

1. 먼저 다음 항목들의 사용처를 전체 검색해주세요:
   - STUDENT, VOLUNTEER (타입 및 값)
   - AdminRole, AdminProgramRole (타입)
   - adminRole, adminProgramRole (필드)
   - studentType, schoolName, bankInfo (필드)
   - hasAdminRole, hasAdminProgramRole, isInstructorOrStudent, isStudent, getAdminProgramRoleLabel (함수)

2. 각 사용처를 분석하고 마이그레이션 계획을 세워주세요.

3. 점진적으로 마이그레이션을 진행하되, 각 단계마다 타입 체크를 수행해주세요.

4. 모든 작업 완료 후 최종 검증을 수행해주세요.
```
