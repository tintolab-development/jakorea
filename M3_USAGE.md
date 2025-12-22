# Material Design 3 활용 현황 및 개선 방안

## 현재 활용 현황 검증

### ✅ 현재 활용 중인 부분

1. **CSS 변수 (Color Tokens)**
   - M3 색상 시스템 (`--md-sys-color-*`) 전역 CSS 변수로 정의
   - 모든 컴포넌트에서 일관된 색상 사용
   - 위치: `apps/lms/src/index.css`

2. **타입스케일 (Typography)**
   - 기본 폰트: Roboto
   - M3 타입스케일 규칙 적용 (h1, h2, h3 등)
   - 위치: `apps/lms/src/index.css`

3. **M3 웹 컴포넌트 Import**
   - `@material/web/all.js` import 완료
   - 위치: `apps/lms/src/main.tsx`

### ❌ 미활용 부분

1. **M3 웹 컴포넌트 미사용**
   - 현재: 기본 HTML 요소 (`<input>`, `<button>`) + 커스텀 CSS
   - 문제: M3의 웹 컴포넌트를 실제로 사용하지 않음
   - 예시: `MdTextField`가 실제 `md-outlined-text-field` 대신 `<input>` 사용

2. **컴포넌트 Wrapper 부재**
   - M3 웹 컴포넌트를 React에서 쉽게 사용할 수 있는 Wrapper 부재
   - 개발 생산성 저하 (매번 웹 컴포넌트 직접 다뤄야 함)

## 개선 방안

### 1. M3 React Wrapper 컴포넌트 생성 (진행 중)

생성된 컴포넌트:
- `apps/lms/src/components/m3/MdButton.tsx` - M3 Button Wrapper
- `apps/lms/src/components/m3/MdTextField.tsx` - M3 TextField Wrapper
- `apps/lms/src/components/m3/index.ts` - Export 모음

**장점:**
- React에서 M3 컴포넌트를 쉽게 사용 가능
- 타입 안정성 보장
- 일관된 API 제공
- 개발 생산성 향상

### 2. 추가 필요한 M3 Wrapper 컴포넌트

다음 단계에서 필요한 컴포넌트들:
- `MdCheckbox` - 체크박스
- `MdSelect` - 셀렉트
- `MdChip` - 칩 (전문분야 태그 등)
- `MdCard` - 카드
- `MdDialog` - 다이얼로그
- `MdMenu` - 메뉴
- `MdIconButton` - 아이콘 버튼

### 3. 기존 컴포넌트 M3 전환 계획

**우선순위 1 (즉시 전환):**
- `MdTextField` → 실제 `md-outlined-text-field` 사용
- 버튼들 → `MdButton` 사용

**우선순위 2 (Phase별 전환):**
- 체크박스 (강사 등록 폼의 전문분야)
- 셀렉트 (필터 드롭다운)
- 카드 (상세 정보 표시)

## 개발 생산성 향상 전략

### 1. 공통 M3 컴포넌트 라이브러리 구축

**목표:**
- 모든 M3 컴포넌트를 React에서 쉽게 사용할 수 있는 Wrapper 제공
- 타입 안정성과 일관된 API 보장
- 재사용 가능한 컴포넌트 집합

**구조:**
```
apps/lms/src/components/m3/
  ├── MdButton.tsx
  ├── MdTextField.tsx
  ├── MdCheckbox.tsx
  ├── MdSelect.tsx
  ├── MdChip.tsx
  ├── MdCard.tsx
  └── index.ts (통합 export)
```

### 2. 사용 예시

**Before (현재):**
```tsx
<input
  type="text"
  value={value}
  onChange={(e) => onChange(e.target.value)}
  className="md-text-field"
/>
```

**After (개선 후):**
```tsx
<MdTextField
  label="이름"
  value={value}
  onChange={onChange}
  required
  error={!!errors.name}
  errorText={errors.name?.message}
/>
```

**장점:**
- 더 적은 코드
- 자동으로 M3 스타일 적용
- 타입 안정성
- 일관된 UX

### 3. 단계적 전환 계획

**Phase 1 (즉시 적용 가능):**
- 새로운 컴포넌트부터 M3 Wrapper 사용
- 기존 컴포넌트는 필요시 점진적 전환

**Phase 2 (개선):**
- 자주 사용되는 컴포넌트 우선 전환
- 공통 패턴 추출 및 문서화

**Phase 3 (최적화):**
- 모든 컴포넌트 M3 전환 완료
- 커스텀 CSS 최소화

## 체크리스트

### 현재 상태
- [x] M3 CSS 변수 설정
- [x] M3 타입스케일 적용
- [x] M3 웹 컴포넌트 Import
- [ ] M3 웹 컴포넌트 실제 사용
- [x] M3 React Wrapper 기본 구조 생성
- [ ] 공통 M3 컴포넌트 라이브러리 완성

### 다음 단계
- [ ] 기존 컴포넌트 M3 전환
- [ ] 추가 M3 Wrapper 컴포넌트 생성
- [ ] M3 컴포넌트 사용 가이드 문서화
- [ ] 개발자 도구/템플릿 제공

## 참고 자료

- [Material Design 3 공식 문서](https://m3.material.io/)
- [Material Web Components](https://github.com/material-components/material-web)
- [M3 색상 시스템](https://m3.material.io/styles/color/the-color-system/overview)
- [M3 타입스케일](https://m3.material.io/styles/typography/overview)






