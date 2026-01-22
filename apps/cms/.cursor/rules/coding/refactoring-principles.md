# 리팩토링 원칙 (Refactoring Principles)

**작성 일자**: 2025-01-19  
**기준**: 시니어 개발자 관점의 코드 품질 원칙  
**적용 범위**: 모든 컴포넌트 및 Hook 작성 시 준수

---

## 🎯 핵심 원칙

코드 작성 시 다음 5가지 원칙을 반드시 준수해야 합니다:

### 1. 재사용성 (Reusability)
**원칙**: 각 컴포넌트를 독립적으로 재사용 가능하게 작성

**적용 방법**:
- 단일 책임 원칙 준수
- Props 인터페이스 명확히 정의
- 외부 의존성 최소화
- 범용 컴포넌트는 `shared/ui/`에 배치

**✅ 좋은 예시**:
```typescript
// 재사용 가능한 헤더 컴포넌트
export function MfaModalHeader({ phoneNumber }: MfaModalHeaderProps) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <SafetyOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
      <Title level={3}>2단계 인증</Title>
      {phoneNumber && (
        <Text type="secondary">{phoneNumber}</Text>
      )}
    </div>
  )
}
```

**❌ 나쁜 예시**:
```typescript
// 특정 컨텍스트에 종속된 컴포넌트
export function MfaModalHeader() {
  const { user } = useAuthStore() // 외부 의존성
  // ...
}
```

---

### 2. 테스트 용이성 (Testability)
**원칙**: Hook과 컴포넌트를 각각 독립적으로 테스트 가능하게 작성

**적용 방법**:
- 비즈니스 로직은 Hook으로 분리
- UI 컴포넌트는 Props만 받아서 렌더링
- 의존성 주입 가능하게 설계
- Side effect 최소화

**✅ 좋은 예시**:
```typescript
// Hook: 비즈니스 로직 분리
export function useMfaVerification({ open }: UseMfaVerificationOptions) {
  // 모든 로직과 상태 관리
  return { form, otpCode, handleVerify, ... }
}

// 컴포넌트: UI만 담당
export function MfaVerificationModal({ open }: Props) {
  const verification = useMfaVerification({ open })
  return <Modal>{/* UI 렌더링 */}</Modal>
}
```

**❌ 나쁜 예시**:
```typescript
// 로직과 UI가 혼재
export function MfaVerificationModal({ open }: Props) {
  const [otpCode, setOtpCode] = useState('')
  // 복잡한 useEffect들...
  // 비즈니스 로직...
  // UI 렌더링...
}
```

---

### 3. 유지보수성 (Maintainability)
**원칙**: 관심사 분리로 수정 범위 최소화

**적용 방법**:
- 관심사별로 파일 분리
- 변경 영향 범위 최소화
- 명확한 책임 분리
- 단일 수정 원칙 (Single Responsibility Principle)

**✅ 좋은 예시**:
```
features/auth/ui/
├── mfa-verification-modal.tsx    (메인 컴포넌트, 조합만 담당)
├── mfa-modal-header.tsx          (헤더 UI)
├── mfa-otp-input.tsx             (입력 UI)
├── mfa-otp-status.tsx            (상태 표시 UI)
└── mfa-action-buttons.tsx         (버튼 UI)

features/auth/hooks/
└── use-mfa-verification.ts       (비즈니스 로직)
```

**❌ 나쁜 예시**:
```
features/auth/ui/
└── mfa-verification-modal.tsx    (모든 것이 하나의 파일에)
    - 모든 useEffect
    - 모든 핸들러 함수
    - 모든 UI 컴포넌트
    - 모든 상태 관리
```

---

### 4. 가독성 (Readability)
**원칙**: 각 파일이 단일 책임을 가져 이해하기 쉽게 작성

**적용 방법**:
- 파일당 하나의 명확한 책임
- 함수/컴포넌트 크기 제한 (200줄 이내 권장)
- 명확한 네이밍
- 주석보다는 코드 자체로 의도 표현

**✅ 좋은 예시**:
```typescript
// mfa-otp-input.tsx (단일 책임: OTP 입력 UI)
export function MfaOtpInput({ value, onChange, disabled }: MfaOtpInputProps) {
  return (
    <Form.Item name="otpCode" rules={[...]}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Input.OTP value={value} onChange={onChange} disabled={disabled} />
      </div>
    </Form.Item>
  )
}
```

**❌ 나쁜 예시**:
```typescript
// 500줄짜리 거대 컴포넌트
export function MfaVerificationModal({ open }: Props) {
  // 50줄의 useState
  // 100줄의 useEffect
  // 200줄의 핸들러 함수
  // 150줄의 JSX
}
```

---

### 5. 타입 안전성 (Type Safety)
**원칙**: 모든 타입 체크 통과, 런타임 에러 방지

**적용 방법**:
- 모든 Props에 타입 정의
- 반환 타입 명시
- `any` 사용 금지 (예외: 타입 추론 불가능한 경우만)
- 타입 체크 통과 확인 (`pnpm typecheck`)

**✅ 좋은 예시**:
```typescript
interface MfaOtpInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function MfaOtpInput({ value, onChange, disabled }: MfaOtpInputProps) {
  // ...
}
```

**❌ 나쁜 예시**:
```typescript
export function MfaOtpInput(props: any) { // any 사용 금지
  // ...
}
```

---

## 📋 리팩토링 체크리스트

코드 작성/수정 시 다음 항목을 확인하세요:

### 컴포넌트 분리
- [ ] 컴포넌트가 200줄을 초과하는가? → 분리 고려
- [ ] 하나의 컴포넌트가 여러 책임을 가지는가? → 분리 필요
- [ ] UI 부분을 독립 컴포넌트로 추출할 수 있는가? → 추출 권장
- [ ] 재사용 가능한 부분이 있는가? → 공통 컴포넌트로 분리

### Hook 분리
- [ ] 비즈니스 로직이 컴포넌트에 직접 있는가? → Hook으로 분리
- [ ] 여러 useEffect가 복잡하게 얽혀 있는가? → Hook으로 통합
- [ ] 상태 관리 로직이 복잡한가? → Hook으로 분리
- [ ] 테스트하기 어려운 구조인가? → Hook 분리로 개선

### 타입 안전성
- [ ] 모든 Props에 타입이 정의되어 있는가?
- [ ] `any` 타입이 사용되었는가? → 구체적 타입으로 변경
- [ ] `pnpm typecheck`가 통과하는가?
- [ ] 타입 에러가 무시되지 않았는가?

### 가독성
- [ ] 파일 이름이 책임을 명확히 나타내는가?
- [ ] 함수/컴포넌트 이름이 의도를 명확히 전달하는가?
- [ ] 불필요한 주석이 있는가? → 코드로 의도 표현
- [ ] 복잡한 로직에 설명 주석이 있는가?

---

## 🔄 리팩토링 프로세스

### 1단계: 분석
- 현재 코드의 책임 파악
- 분리 가능한 부분 식별
- 의존성 관계 분석

### 2단계: 설계
- 분리할 컴포넌트/Hook 설계
- Props 인터페이스 정의
- 타입 정의

### 3단계: 구현
- 작은 단위로 분리
- 각각 독립적으로 동작 확인
- 타입 체크 통과 확인

### 4단계: 통합
- 분리된 컴포넌트/Hook 조합
- 전체 동작 확인
- 테스트 (가능한 경우)

---

## 📚 참고 예시

### MFA 인증 모달 리팩토링 사례

**Before (235줄, 단일 파일)**:
```typescript
// mfa-verification-modal.tsx (235줄)
export function MfaVerificationModal({ open }: Props) {
  // 모든 로직과 UI가 혼재
  const [otpCode, setOtpCode] = useState('')
  // 5개의 useEffect
  // 3개의 핸들러 함수
  // 복잡한 JSX
}
```

**After (관심사 분리)**:
```typescript
// use-mfa-verification.ts (비즈니스 로직)
export function useMfaVerification({ open }: Options) {
  // 모든 로직과 상태 관리
  return { form, otpCode, handleVerify, ... }
}

// mfa-verification-modal.tsx (조합, 약 60줄)
export function MfaVerificationModal({ open }: Props) {
  const verification = useMfaVerification({ open })
  return (
    <Modal>
      <MfaModalHeader phoneNumber={verification.mfaState?.phoneNumber} />
      <MfaOtpInput {...verification} />
      <MfaOtpStatus {...verification} />
      <MfaActionButtons {...verification} />
    </Modal>
  )
}

// mfa-modal-header.tsx (헤더 UI)
// mfa-otp-input.tsx (입력 UI)
// mfa-otp-status.tsx (상태 UI)
// mfa-action-buttons.tsx (버튼 UI)
```

---

## 🔗 관련 규칙

- [컴포넌트 패턴](./component-patterns.md)
- [Custom Hooks 작성 가이드](./custom-hooks.md)
- [코딩 스타일](./code-style.md)
- [타입 안전성 및 일관성](./type-safety-and-consistency.md) - Deprecated 코드 사용 금지, 타입 일관성 유지

---

**마지막 업데이트**: 2025-01-19
