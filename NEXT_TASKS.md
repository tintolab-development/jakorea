# 다음 진행 사항 리스트

**작성 일자**: 2026-01-26  
**현재 상태**: CMS 리팩토링 Phase 2 일부 완료  
**마지막 커밋**: bee1e7e - CMS 리팩토링 Phase 2 완료

---

## 🔴 우선순위 1: 타입 에러 수정 (즉시)

커밋 시 발생한 타입 에러들을 수정해야 합니다.

### 주요 타입 에러
1. **MESSAGES 상수 누락**
   - `templateEmailUpdated`, `templateEmailCreated` - success 섹션에 추가 필요
   - `interviewScheduleRegisterFailed` - error 섹션에 추가 필요
   - `studentInfoNotFound` - error 섹션에 추가 필요
   - `programNotFound`, `programLoadFailed` - error 섹션 확인 필요

2. **Import 누락**
   - `use-register.ts`: MESSAGES import 누락
   - `use-download-quota.ts`: MESSAGES import 누락
   - `use-performance-stats.ts`: MESSAGES import 누락
   - `use-permission-request.ts`: MESSAGES import 누락
   - `history-detail-page.tsx`: MESSAGES import 누락
   - `my-program-list-page.tsx`: MESSAGES import 누락
   - `my-schedule-calendar-page.tsx`: MESSAGES import 누락
   - `my-settlement-submission-page.tsx`: MESSAGES import 누락

3. **직접 서비스 호출 남아있음**
   - `admin-settlement-review-page.tsx`: `programService` 직접 호출
   - `settlement-pending-page.tsx`: `programService` 직접 호출
   - `settlement-review-page.tsx`: `programService` 직접 호출
   - `instructor-reports-page.tsx`: `programService` 직접 호출

4. **기타 타입 에러**
   - `report-form-page.tsx`: LAYOUT_CONSTANTS 중복 import
   - `program-progress-widget.tsx`: 사용하지 않는 변수
   - `participant-list.tsx`: 사용하지 않는 Tag import
   - `audit-log-list-page.tsx`: 타입 불일치
   - `application-path-list-page.tsx`: 타입 불일치
   - `login-page.tsx`: null 체크 필요
   - `template-email-page.tsx`: 타입 불일치

**예상 시간**: 2-3시간

---

## 🔴 우선순위 2: 나머지 List 페이지 리팩토링 (High Priority)

### 완료된 페이지
- ✅ `school-list-page.tsx` - useListFilters 적용
- ✅ `user-list-page.tsx` - useModalState 적용
- ✅ `matching-list-page.tsx` - 메시지/스타일 상수화
- ✅ `interview-list-page.tsx` - 이미 완료
- ✅ `schedule-negotiation-list-page.tsx` - useProgramService 적용

### 남은 페이지
1. **`report-list-page.tsx`**
   - useListCRUD, useListFilters 적용
   - ListPageFilters 컴포넌트 적용
   - StatusBadge 교체
   - PAGINATION_CONFIG 적용

2. **`payment-statement-list-page.tsx`** (settlements)
   - useListCRUD, useListFilters 적용
   - ListPageFilters 컴포넌트 적용
   - StatusBadge 교체

3. **`instructor-list-page.tsx`** (pages/instructors)
   - useListCRUD, useListFilters 적용
   - ListPageFilters 컴포넌트 적용
   - StatusBadge 교체

4. **`schedule-calendar-page.tsx`**
   - useListFilters 적용
   - 메시지/스타일 상수화

**참고**: `program-list-page.tsx`, `application-list-page.tsx`는 Zustand Store 패턴 사용으로 제외

**예상 시간**: 1-2일

---

## 🔴 우선순위 3: 서비스 레이어 훅 래핑 완료 (High Priority)

### 완료된 서비스
- ✅ `useProgramService` - getByIdSync() 대부분 교체 완료
- ✅ `useReportService` - report-form-page, instructor-reports-page 적용
- ✅ `useApplicationService` - 존재 확인 필요
- ✅ `useSettlementService` - 존재 확인 필요
- ✅ `useMatchingService` - 존재 확인 필요
- ✅ `useInstructorService` - 존재 확인 필요
- ✅ `useSchoolService` - 존재 확인 필요

### 남은 작업
1. **직접 서비스 호출 제거**
   - `admin-settlement-review-page.tsx`: `programService` → `useProgramService`
   - `settlement-pending-page.tsx`: `programService` → `useProgramService`
   - `settlement-review-page.tsx`: `programService` → `useProgramService`
   - `instructor-reports-page.tsx`: `programService` → `useProgramService`

2. **features 폴더 내 직접 서비스 호출**
   - `schedule-negotiation-detail-drawer.tsx`
   - `settlement-list.tsx`
   - `settlement-detail-review-drawer.tsx`
   - `instructor-detail.tsx`
   - `schedule-negotiation-form.tsx`
   - 기타 features 내 컴포넌트들

3. **누락된 서비스 훅 생성**
   - `useUserService` - userService 래핑
   - `useApplicationPathService` - applicationPathService 래핑
   - 기타 누락된 서비스들

**예상 시간**: 1일

---

## 🟡 우선순위 4: StatusBadge 교체 확대 (Medium Priority)

### 완료된 교체
- ✅ `participant-list.tsx` - 역할 Tag
- ✅ `application-list.tsx` - subjectType, pathType
- ✅ `my-program-list-page.tsx` - category, status

### 남은 교체 대상
1. **리스트 컴포넌트들**
   - `program-list.tsx` (features/program/ui)
   - `matching-list.tsx` (features/matching/ui)
   - `settlement-list.tsx` (features/settlement/ui)
   - `payment-statement-list.tsx` (features/settlement/ui)
   - 기타 features/*/ui/*-list.tsx 파일들

2. **페이지 컴포넌트들**
   - `report-list-page.tsx`
   - `payment-statement-list-page.tsx`
   - `instructor-list-page.tsx`
   - 기타 list 페이지들

**예상 시간**: 0.5일

---

## 🟡 우선순위 5: 메시지 상수화 완료 (Medium Priority)

### 완료된 영역
- ✅ 인증 페이지 (login, mfa, register)
- ✅ 폼 페이지 (program, instructor, sponsor, school)
- ✅ 템플릿 페이지 (files, sms, email)
- ✅ 정산 페이지 (settlement-pending, settlement-review)
- ✅ 기타 여러 페이지

### 남은 작업
1. **누락된 메시지 추가**
   - MESSAGES.success에 템플릿 메시지 추가 확인
   - MESSAGES.error에 누락된 에러 메시지 추가
   - MESSAGES.validation에 추가 검증 메시지

2. **하드코딩된 메시지 찾기**
   - `message.success()`, `message.error()`, `message.warning()` 호출 부분
   - Form validation 메시지
   - Popconfirm description 메시지
   - Tooltip 메시지

**예상 시간**: 0.5일

---

## 🟡 우선순위 6: LAYOUT_CONSTANTS 적용 확대 (Medium Priority)

### 완료된 페이지
- ✅ `audit-log-list-page.tsx`
- ✅ `faq-page.tsx`
- ✅ `notice-list-page.tsx`
- ✅ `inquiry-page.tsx`
- ✅ `my-program-detail-page.tsx`
- ✅ `matching-list-page.tsx`

### 남은 작업
1. **하드코딩된 스타일 값 찾기**
   - `width`, `height`, `padding`, `margin`, `fontSize` 등
   - 모든 페이지 및 컴포넌트 파일

2. **LAYOUT_CONSTANTS로 교체**
   - 반복되는 값들을 상수로 통일
   - 디자인 시스템 구축

**예상 시간**: 1일

---

## 🟢 우선순위 7: 기존 훅 활용도 높이기 (Low Priority)

### 대상 훅
1. **`usePagination`**
   - 페이지네이션 로직이 있는 모든 페이지에 적용
   - 현재 사용률 낮음

2. **`useQueryParams`**
   - URL 쿼리 파라미터를 사용하는 모든 페이지에 적용
   - 일부 페이지에만 적용됨

3. **`useModalState`**
   - 모달 상태 관리가 필요한 모든 페이지에 적용
   - 일부 페이지에만 적용됨

**예상 시간**: 1일

---

## 📋 작업 순서 권장사항

1. **타입 에러 수정** (즉시) - 2-3시간
2. **나머지 List 페이지 리팩토링** - 1-2일
3. **서비스 레이어 훅 래핑 완료** - 1일
4. **StatusBadge 교체 확대** - 0.5일
5. **메시지 상수화 완료** - 0.5일
6. **LAYOUT_CONSTANTS 적용 확대** - 1일
7. **기존 훅 활용도 높이기** - 1일

**총 예상 시간**: 약 5-7일

---

## 📝 참고사항

### 제외된 작업
- `program-list-page.tsx`, `application-list-page.tsx`는 Zustand Store 패턴 사용으로 useListCRUD 적용 제외
- 아키텍처 차이로 인한 복잡한 리팩토링 필요

### FSD 아키텍처 준수
- 모든 변경사항은 FSD 구조를 준수해야 함
- `shared/` 레이어 활용 최대화

### 점진적 마이그레이션
- 한 번에 하나씩 작업 진행
- 기존 기능 동작 유지 (회귀 테스트)
- 타입 안정성 유지
