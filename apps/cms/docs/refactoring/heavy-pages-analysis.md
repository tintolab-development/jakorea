# 페이지 단위 코드 복잡도 분석 및 리팩토링 제안

## 📊 큰 파일 목록 (300줄 이상)

### 🔴 매우 큰 파일 (500줄 이상)

1. **template-email-page.tsx** (627줄)
2. **template-sms-page.tsx** (603줄)
3. **register-page.tsx** (592줄)
4. **monthly-settlement-page.tsx** (486줄)

### 🟡 큰 파일 (300-500줄)

5. **my-volunteer-schedule-page.tsx** (421줄)
6. **my-settlement-list-page.tsx** (412줄)
7. **template-files-page.tsx** (409줄)
8. **admin-notice-list-page.tsx** (408줄)
9. **program-list-page.tsx** (401줄)
10. **instructor-schedule-page.tsx** (358줄)
11. **instructor-application-page.tsx** (353줄)
12. **report-list-page.tsx** (350줄)
13. **application-result-page.tsx** (349줄)
14. **admin-inquiry-page.tsx** (345줄)
15. **admin-faq-page.tsx** (332줄)

## 🔍 주요 문제점

### 1. template-email-page.tsx / template-sms-page.tsx

**문제점:**

- 에디터 초기화/관리 로직이 페이지에 직접 포함
- 필터링, CRUD, 미리보기 로직이 모두 한 파일에
- template-email과 template-sms가 거의 동일한 구조 (중복)

**개선 방안:**

```typescript
// hooks/use-template-editor.ts
export function useTemplateEditor() {
  // 에디터 초기화/관리 로직
}

// hooks/use-template-filters.ts
export function useTemplateFilters() {
  // 필터링 로직
}

// components/template-form-modal.tsx
export function TemplateFormModal() {
  // 폼 모달 컴포넌트
}

// components/template-preview-modal.tsx
export function TemplatePreviewModal() {
  // 미리보기 모달 컴포넌트
}

// 공통 템플릿 페이지 로직 추출
// pages/templates/template-base-page.tsx
```

### 2. register-page.tsx

**문제점:**

- 3단계 폼 관리 로직이 모두 한 파일에
- 역할별 분기 로직이 복잡
- 폼 검증 로직이 분산

**개선 방안:**

```typescript
// components/register/role-selection-step.tsx
// components/register/consent-step.tsx
// components/register/info-input-step.tsx
// hooks/use-register-flow.ts
```

### 3. admin-inquiry-page.tsx / admin-faq-page.tsx

**문제점:**

- 필터링 로직이 페이지에 직접 포함
- 모달 관리 로직이 복잡
- CRUD 로직이 분산

**개선 방안:**

```typescript
// hooks/use-inquiry-filters.ts
export function useInquiryFilters() {
  // 필터링 로직
}

// hooks/use-inquiry-modals.ts
export function useInquiryModals() {
  // 모달 관리 로직
}

// components/inquiry-detail-modal.tsx
// components/inquiry-answer-modal.tsx
```

### 4. monthly-settlement-page.tsx

**문제점:**

- 복잡한 필터링 로직
- 테이블 컬럼 정의가 길음
- 통계 계산 로직이 페이지에 포함

**개선 방안:**

```typescript
// hooks/use-settlement-filters.ts
// components/settlement-summary-cards.tsx
// components/settlement-table.tsx
// utils/settlement-calculations.ts
```

## 📋 리팩토링 우선순위

### 우선순위 1 (즉시)

1. **template-email-page.tsx / template-sms-page.tsx**
   - 중복 코드가 많음
   - 공통 로직 추출로 코드 50% 이상 감소 가능

2. **admin-inquiry-page.tsx / admin-faq-page.tsx**
   - 비슷한 패턴 반복
   - 커스텀 훅으로 로직 분리

### 우선순위 2 (단기)

3. **register-page.tsx**
   - 단계별 컴포넌트 분리
   - 폼 검증 로직 통합

4. **monthly-settlement-page.tsx**
   - 통계/필터링 로직 분리
   - 컴포넌트 분할

### 우선순위 3 (중기)

5. 나머지 300줄 이상 파일들
   - 패턴별로 공통 훅/컴포넌트 추출

## 🎯 리팩토링 원칙

1. **단일 책임 원칙**: 각 컴포넌트/훅은 하나의 책임만
2. **커스텀 훅 추출**: 상태 관리 및 비즈니스 로직 분리
3. **컴포넌트 분할**: 큰 컴포넌트를 작은 단위로 분리
4. **공통 로직 추출**: 중복 코드 제거
5. **SSOT 패턴 적용**: 상태 관리는 스토어로 통합

## 📝 리팩토링 체크리스트

각 페이지 리팩토링 시:

- [ ] 상태 관리 로직을 커스텀 훅으로 분리
- [ ] UI 컴포넌트를 별도 파일로 분리
- [ ] 필터링/검색 로직을 selector로 이동 (SSOT)
- [ ] 모달/드로어를 별도 컴포넌트로 분리
- [ ] 공통 로직을 유틸리티 함수로 추출
- [ ] 타입 정의를 별도 파일로 분리 (필요시)
- [ ] 테스트 가능한 구조로 변경
