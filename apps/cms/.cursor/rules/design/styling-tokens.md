---
priority: high
always_include: true
category: design
---

# 스타일링 토큰 사용 규칙

**목적**: CSS 작성 시 디자인 토큰(CSS 변수)만 사용하여 색상·간격·타이포·radius·shadow를 단일 소스로 관리합니다.

**토큰 정의 위치**: `src/app/providers/theme-provider.css`

---

## 규칙 요약

- **색상**: `#hex`, `rgb()`, `rgba()` 직접 사용 금지. `var(--color-*)` 사용.
- **간격 (padding, margin, gap)**: `XXpx` 직접 사용 금지. `var(--spacing-*)` 사용.
- **폰트 크기/굵기/줄간격**: `var(--font-size-*)`, `var(--font-weight-*)`, `var(--line-height-*)` 사용.
- **border-radius**: `var(--radius-4)`, `var(--radius-8)` 사용.
- **box-shadow**: `var(--shadow-card)`, `var(--shadow-modal)` 사용.

---

## 사용 가능한 토큰

### 색상 (`--color-*`)

- 브랜드: `--color-brand-primary`, `--color-brand-secondary-1`, `--color-brand-secondary-2`
- 도메인: `--color-program`, `--color-program-light`, `--color-program-dark` 등 (school, instructor, sponsor, application, schedule, matching, settlement)
- 텍스트: `--color-text-heading`, `--color-text-body`, `--color-text-secondary`, `--color-link`, `--color-link-hover`
- 배경: `--color-bg-base`, `--color-bg-secondary`, `--color-bg-accent`, `--color-bg-hover`
- 테두리: `--color-border`, `--color-border-light`
- UI: `--color-ui-more-button`, `--color-ui-more-button-hover`, `--color-required-mark`

### 간격 (`--spacing-*`)

- `--spacing-4`, `--spacing-8`, `--spacing-12`, `--spacing-16`, `--spacing-20`, `--spacing-24`, `--spacing-32`

### 타이포그래피

- `--font-size-13`, `--font-size-14`, `--font-size-15`, `--font-size-18`
- `--font-weight-regular`, `--font-weight-700`
- `--line-height-tight`, `--line-height-normal`

### 모서리·그림자

- `--radius-4`, `--radius-8`
- `--shadow-card`, `--shadow-modal`

---

## 올바른 예시

```css
.card {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-8);
  padding: var(--spacing-16) var(--spacing-24);
  box-shadow: var(--shadow-card);
}

.title {
  font-size: var(--font-size-18);
  font-weight: var(--font-weight-700);
  color: var(--color-text-heading);
  line-height: var(--line-height-tight);
}
```

---

## 잘못된 예시 (하드코딩 금지)

```css
/* ❌ 색상 하드코딩 */
background: #fff;
border: 1px solid #e0e0e0;

/* ❌ 간격 하드코딩 */
padding: 16px 24px;
margin-bottom: 8px;

/* ❌ 폰트/radius 하드코딩 */
font-size: 18px;
border-radius: 8px;
```

---

## 예외

- **Ant Design 등 써드파티 컴포넌트 오버라이드**에서 해당 라이브러리가 px/색상을 요구하는 경우, 주석으로 예외 사유를 남긴 뒤 최소한만 하드코딩 허용.
- **토큰에 없는 값**이 필요한 경우, 먼저 `theme-provider.css`에 토큰을 추가한 뒤 사용하는 것을 원칙으로 한다.

---

## 관련 규칙

- [색상 팔레트](./color-palette.md) - 색상 의미 및 도메인별 사용
- [색상 시스템](./color-system.md) - 색상 체계 및 접근성
