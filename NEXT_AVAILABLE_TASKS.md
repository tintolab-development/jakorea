# 다음 진행 가능한 작업 리스트

> **기준**: `apps/cms/docs/requirements-specification/progress.md`  
> **최종 업데이트**: 2026-01-26

---

## 📊 현재 완료 상태

### ✅ 최근 완료된 작업 (2026-01-26)
- ✅ **FR-C03**: 템플릿 기반 동적 신청서 폼 생성
- ✅ **FR-C04**: 실제 문자/이메일 발송 기능 (Provider 인터페이스 + Mock)
- ✅ **FR-F01**: 신청서 수정 기능 (학교/개인)
- ✅ **FR-F02**: 매칭 로직 완성 (자동 매칭 알고리즘, 수동 배정 검증)
- ✅ **FR-F03**: 실제 매칭 데이터 연동 (캘린더/목록 동기화)
- ✅ **FR-G01**: 거리 계산·통행료 증빙·일사일교 사업 특수성
- ✅ **FR-G03**: 이체 리스트 엑셀 포맷 완성 (은행 업로드용/일반)

---

## 🔴 우선순위 1: 요구사항 기반 기능 (P1, 부분 완료)

### 1. **FR-E03: 강의보고서 제출 프로세스 완성** ⚠️ 부분 완료
**예상 시간**: 2-3일

**현재 상태**:
- ✅ 강의보고서 제출 페이지 존재
- ✅ 보고서 작성 화면 존재
- ❌ 실제 제출 프로세스 미구현
- ❌ 제출 상태 관리 미완성 (미제출/제출완료/승인)

**구현 작업**:
1. 보고서 제출 API 서비스 구현
   - `reportService.submit()` - 제출 처리
   - 제출 상태 업데이트 (`submitted` → `reviewing`)
   - 제출 이력 기록
   - 파일: `src/entities/report/api/report-service.ts` 수정

2. 제출 상태 관리 로직
   - 강의별 보고서 제출 상태 추적
   - 미제출/제출완료/승인 상태 전환
   - 파일: `src/features/report/hooks/use-report-submission.ts` (신규)

3. 보고서 제출 폼 연동
   - 제출 버튼 클릭 시 실제 제출 처리
   - 제출 완료 후 상태 업데이트
   - 파일: `src/pages/instructors/instructor-reports-page.tsx` 수정

**참고 파일**:
- `src/pages/instructors/instructor-reports-page.tsx`
- `src/entities/report/api/report-service.ts`
- `src/types/domain.ts` (Report 타입)

---

### 2. **FR-H01: 템플릿 복사/저장 기능** ⚠️ 부분 완료
**예상 시간**: 2-3일

**현재 상태**:
- ✅ 템플릿 목록 페이지 존재
- ✅ 템플릿 관리 UI 존재
- ❌ 템플릿 복사 기능 미구현
- ❌ 템플릿 저장 기능 미구현

**구현 작업**:
1. 템플릿 복사 기능
   - 기존 템플릿을 복사하여 새 템플릿 생성
   - 복사 시 이름 자동 생성 ("원본명 (복사본)")
   - 파일: `src/entities/template/api/template-service.ts` 수정

2. 템플릿 저장 기능
   - 템플릿 생성/수정 시 저장 처리
   - 템플릿 메타데이터 관리 (이름, 설명, 타입 등)
   - 파일: `src/features/template/hooks/use-template-crud.ts` (신규)

3. 템플릿 목록 UI 개선
   - "복사하기" 버튼 추가
   - "저장하기" 기능 연동
   - 파일: `src/pages/templates/template-list-page.tsx` 수정

**참고 파일**:
- `src/pages/templates/template-list-page.tsx`
- `src/entities/template/api/template-service.ts`
- `src/types/template.ts`

---

### 3. **FR-C01: 신청 프로세스 실제 구현** ⚠️ 부분 완료
**예상 시간**: 2-3일

**현재 상태**:
- ✅ 프로그램 목록 페이지 존재
- ✅ 프로그램 상세 Drawer 존재
- ✅ 신청 CTA 제공
- ❌ 실제 신청 프로세스 미구현 (Mock 데이터 기반)
- ❌ 로그인/회원가입 유도 동선 미명확

**구현 작업**:
1. 신청 프로세스 로직 완성
   - 비로그인 사용자 → 로그인/회원가입 유도
   - 신청 제출 시 실제 Application 생성
   - 신청 상태 초기화 및 이력 기록
   - 파일: `src/features/application/hooks/use-application-submit.ts` (신규)

2. 로그인/회원가입 유도
   - 신청 버튼 클릭 시 로그인 상태 확인
   - 비로그인 시 로그인 모달 또는 리다이렉트
   - 파일: `src/pages/programs/program-list-page.tsx` 수정

**참고 파일**:
- `src/pages/programs/program-list-page.tsx`
- `src/features/program/ui/program-detail-drawer.tsx`
- `src/entities/application/api/application-service.ts`

---

### 4. **FR-E01: 강사 제출 서류 프로세스** ⚠️ 부분 완료
**예상 시간**: 1-2일

**현재 상태**:
- ✅ 제출 서류 관리 페이지 존재
- ❌ 실제 제출 프로세스 미구현

**구현 작업**:
1. 서류 제출 API 구현
   - 파일 업로드 처리
   - 제출 상태 관리
   - 파일: `src/entities/instructor/api/instructor-document-service.ts` (신규)

2. 제출 서류 관리 페이지 연동
   - 업로드 버튼 → 실제 제출 처리
   - 제출 완료 후 목록 갱신
   - 파일: `src/pages/instructors/instructor-documents-page.tsx` 수정

**참고 파일**:
- `src/pages/instructors/instructor-documents-page.tsx`
- `src/types/domain.ts` (InstructorDocument 타입)

---

## 🟡 우선순위 2: 리팩토링 작업 (코드 품질 향상)

### 5. **List 페이지 리팩토링 패턴 적용** (High Priority)
**예상 시간**: 3-5일

**대상 페이지** (10개):
- `pages/programs/program-list-page.tsx`
- `pages/applications/application-list-page.tsx`
- `pages/reports/report-list-page.tsx`
- `pages/matchings/matching-list-page.tsx`
- `pages/settlements/payment-statement-list-page.tsx`
- `pages/schools/school-list-page.tsx`
- `pages/instructors/instructor-list-page.tsx`
- `pages/users/user-list-page.tsx`
- `pages/interviews/interview-list-page.tsx`
- `pages/schedules/schedule-calendar-page.tsx`

**적용할 패턴**:
- `useListCRUD`, `useListFilters` 훅 사용
- `ListPageFilters` 컴포넌트로 필터 UI 통일
- `StatusBadge` 컴포넌트로 상태 표시 통일
- `PAGINATION_CONFIG` 상수 사용
- `MESSAGES` 상수로 메시지 통일
- `LAYOUT_CONSTANTS`로 스타일 통일

**참고 파일**:
- `src/shared/hooks/use-list-crud.ts`
- `src/shared/ui/status-badge.tsx`
- `src/shared/constants/pagination.ts`

---

### 6. **서비스 레이어 훅 래핑** (High Priority)
**예상 시간**: 2-3일

**대상 서비스**:
- `applicationService` → `useApplicationService`
- `programService` → `useProgramService` (일부 존재, 확장)
- `reportService` → `useReportService`
- `settlementService` → `useSettlementService`
- `matchingService` → `useMatchingService` (일부 존재, 확장)
- `instructorService`, `schoolService`, `userService` 등

**구현 패턴**:
```typescript
export function useApplicationService() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = useCallback(async (data) => {
    setLoading(true)
    try {
      return await applicationService.create(data)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { create, update, delete: deleteApp, loading, error }
}
```

**참고 파일**:
- `src/features/program/hooks/use-program-service.ts` (기존 예시)
- `src/entities/application/api/application-service.ts`

---

### 7. **StatusBadge 활용도 높이기** (Medium Priority)
**예상 시간**: 1-2일

**대상 파일**:
- 모든 List 페이지 및 컴포넌트
- 하드코딩된 `<Tag color={...}>{label}</Tag>` → `<StatusBadge />` 교체

**참고 파일**:
- `src/shared/ui/status-badge.tsx`
- `src/shared/constants/status.ts`

---

### 8. **메시지 상수화 완료** (Medium Priority)
**예상 시간**: 1-2일

**작업 내용**:
- `MESSAGES` 상수에 누락된 메시지 추가
- 모든 하드코딩된 `message.success/error/warning()` 메시지 교체
- Form validation 메시지 상수화

**참고 파일**:
- `src/shared/constants/messages.ts`

---

## 🔵 우선순위 3: 보안/컴플라이언스 (NFR)

### 9. **NFR-SEC-AUT-01: MFA(2FA) 적용** ❌ 미구현
**예상 시간**: 3-5일

**요구사항**: 백오피스 로그인 시 항상 MFA 필수(SMS OTP 기본)

**구현 작업**:
1. OTP 발송 기능 (Mock → 실제 API 연동 준비)
2. OTP 검증 로직
3. 로그인 플로우에 MFA 단계 추가
4. OTP 이벤트 로그

**참고 파일**:
- `src/pages/auth/login-page.tsx`
- `src/entities/user/api/auth-service.ts`

---

### 10. **NFR-SEC-AUT-02: 비인가 접근 통제** ❌ 미구현
**예상 시간**: 2-3일

**요구사항**: 로그인 시도 레이트리밋/쿨다운/잠금, 세션/쿠키 보안 속성

**구현 작업**:
1. 로그인 시도 레이트리밋 (Mock)
2. 계정 잠금 기능
3. 세션 보안 속성 설정

---

### 11. **NFR-SEC-ACC-01: 최소권한 원칙** ⚠️ 부분 완료
**예상 시간**: 2-3일

**현재 상태**:
- ✅ 권한 타입 정의 완료
- ✅ 권한 정책 파일 존재
- ❌ 실제 권한 검증 로직 미구현
- ❌ 프로그램 ACL 적용 미구현

**구현 작업**:
1. 권한 검증 로직 구현
2. 프로그램 단위 접근 제어 적용
3. UI에서 권한별 기능 표시/숨김

**참고 파일**:
- `src/shared/config/permissions.ts`
- `src/shared/utils/permissions.ts`

---

### 12. **NFR-DATA-01: 다운로드 마스킹** ❌ 미구현
**예상 시간**: 2-3일

**요구사항**: 엑셀/CSV/PDF 다운로드 시 개인정보 필드 기본 마스킹

**구현 작업**:
1. 마스킹 유틸리티 함수 (`maskPersonalInfo`)
2. 다운로드 시 마스킹 적용 옵션
3. 권한별 마스킹 해제 기능

**참고 파일**:
- `src/shared/utils/file-download.ts`
- `src/shared/utils/masking.ts` (기존 존재)

---

## 📋 추천 작업 순서

### 단기 (1-2주)
1. **FR-E03**: 강의보고서 제출 프로세스 (2-3일) - 가장 구체적이고 완성도 높음
2. **FR-H01**: 템플릿 복사/저장 (2-3일) - UI가 이미 존재하여 빠르게 완성 가능
3. **List 페이지 리팩토링** (3-5일) - 코드 품질 향상, 유지보수성 개선

### 중기 (2-4주)
4. **서비스 레이어 훅 래핑** (2-3일)
5. **FR-C01**: 신청 프로세스 실제 구현 (2-3일)
6. **FR-E01**: 강사 제출 서류 프로세스 (1-2일)
7. **StatusBadge/메시지 상수화** (2-3일)

### 장기 (1-2개월)
8. **NFR 보안 요구사항들** (MFA, 레이트리밋, 권한 검증 등)

---

## 💡 선택 가이드

- **기능 완성도 높이기**: FR-E03 → FR-H01 → FR-C01 → FR-E01
- **코드 품질 향상**: List 리팩토링 → 서비스 훅 래핑 → StatusBadge/메시지
- **보안 강화**: NFR-SEC-ACC-01 → NFR-SEC-AUT-01 → NFR-SEC-AUT-02

---

**다음 작업 선택 시**: 원하는 우선순위나 작업 번호를 알려주시면 해당 작업부터 진행하겠습니다.
