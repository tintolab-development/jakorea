# CMS 관리자 권한 비즈니스 로직 수정 요약

**수정 일자**: 2026-01-23  
**수정 범위**: CMS 프로젝트 관리자 권한 체계 강화

---

## 수정 완료 항목

### ✅ 1. 권한 체크 유틸리티 함수 추가

**파일**: `apps/cms/src/shared/utils/permissions.ts`

추가된 함수:

- `isGeneralAdmin()`: GENERAL 관리자 여부 확인
- `canPerformWriteAction()`: 쓰기 작업(create/update/delete) 가능 여부 확인
- `hasAdminLevelOrAbove()`: 특정 관리자 레벨 이상 권한 확인

### ✅ 2. PermissionButton 컴포넌트 개선

**파일**: `apps/cms/src/shared/components/permission-button.tsx`

추가된 props:

- `isWriteAction`: 쓰기 작업 여부 (GENERAL 제한 적용)
- `minAdminLevel`: 최소 관리자 레벨 요구사항

### ✅ 3. 프로그램 관리 페이지 수정

**파일**: `apps/cms/src/pages/programs/program-list-page.tsx`
**파일**: `apps/cms/src/features/program/ui/program-detail-drawer.tsx`

수정 내용:

- 프로그램 등록 버튼에 `isWriteAction={true}` 추가
- 수정/삭제 액션에 `canWrite` 체크 추가
- 상태 변경 기능에 GENERAL 제한 적용

### ✅ 4. 신청 관리 페이지 수정

**파일**: `apps/cms/src/features/application/ui/application-detail-drawer.tsx`

수정 내용:

- 신청 수정/삭제 버튼에 `canWrite` 체크 추가
- GENERAL 관리자는 신청 승인/반려 불가

### ✅ 5. 강사 관리 페이지 수정

**파일**: `apps/cms/src/pages/instructors/instructor-list-page.tsx`

수정 내용:

- 강사 등록 버튼에 `isWriteAction={true}` 추가

---

## 적용된 권한 정책

### GENERAL 관리자 제한

- ✅ 모든 쓰기 작업(create/update/delete) 금지
- ✅ 조회(read) 기능만 허용
- ✅ 프로그램 등록/수정/삭제 불가
- ✅ 신청 승인/반려/수정/삭제 불가
- ✅ 강사 등록/수정/삭제 불가

### ADMIN 관리자 권한

- ✅ 프로그램 운영 전반 (담당 프로그램만)
- ✅ 신청 승인/반려
- ✅ 강사 매칭
- ✅ 정산 관리

### MASTER 관리자 권한

- ✅ 모든 기능 접근 가능
- ✅ 회원/권한 총괄 관리
- ✅ 시스템 설정

---

## 다음 단계 (권장)

### 우선순위 P1

1. 템플릿 관리 페이지 수정
2. 정산 관리 페이지 수정
3. 게시글 관리 페이지 수정
4. ProtectedRoute 개선 (쓰기 작업 경로 차단)

### 우선순위 P2

5. 기타 관리 페이지들 수정
6. API 서비스 레벨 권한 체크 추가
7. 테스트 코드 작성

---

## 테스트 체크리스트

### GENERAL 관리자 테스트

- [ ] 프로그램 목록 조회 가능
- [ ] 프로그램 등록 버튼 비활성화/숨김
- [ ] 프로그램 수정/삭제 불가
- [ ] 신청 목록 조회 가능
- [ ] 신청 승인/반려 불가
- [ ] 강사 목록 조회 가능
- [ ] 강사 등록 불가

### ADMIN 관리자 테스트

- [ ] 프로그램 등록/수정/삭제 가능 (담당 프로그램만)
- [ ] 신청 승인/반려 가능
- [ ] 강사 등록/수정 가능

### MASTER 관리자 테스트

- [ ] 모든 기능 접근 가능
- [ ] 모든 프로그램 관리 가능
- [ ] 회원/권한 관리 가능
