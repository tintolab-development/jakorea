---
priority: high
always_include: false
category: process
---

# 스타일링 토큰 미적용 부분 리팩토링 — 개발자 위임

**대상**: 시니어 개발자  
**근거 규칙**: [persona.md](./persona.md), [styling-tokens.md](../design/styling-tokens.md)  
**목적**: CMS 전역에서 토큰화된 CSS(`theme-provider.css`의 `var(--*)`)를 사용하지 않는 스타일을 단계적으로 토큰 기반으로 리팩토링한다.

---

## 1. 범위 요약

- **토큰 정의 위치**: `src/app/providers/theme-provider.css`
- **규칙**: 색상·간격·타이포·radius·shadow는 하드코딩 금지, `var(--토큰명)` 사용 ([styling-tokens.md](../design/styling-tokens.md)).
- **미적용 영역**: 전역 CSS, 레이아웃 CSS, feature/페이지별 CSS, TSX 인라인 스타일.

---

## 2. 우선순위 및 할당 작업

### P0 — 전역·레이아웃 (최우선) ✅ 완료

| 순서 | 대상 | 내용 | 비고 |
|------|------|------|------|
| 2.1 | `src/index.css` | ✅ 완료. `:root`/`a`/`button`/`body` 등 토큰 교체. 다크 스킴은 토큰 미정의로 주석 처리 | — |
| 2.2 | `src/widgets/layout/sidebar.css` | ✅ 완료. 사이드바 전용 토큰(`--color-sidebar-*`) 추가 후 적용 | theme-provider.css에 토큰 추가됨 |
| 2.3 | `src/widgets/layout/main-header.css` | ✅ 완료. `--header-height`, `--sidebar-width`, `--shadow-header` 등 적용 | — |

**검증**: 위 파일에서 `#hex`/`rgb(a)`/숫자+px 직접 사용이 예외(주석 명시)를 제외하고 없어야 함.

---

### P1 — 공유 UI (shared) ✅ 완료

| 순서 | 대상 | 내용 | 비고 |
|------|------|------|------|
| 2.4 | `src/shared/ui/app-button.css` | ✅ 완료. `--default-WT`, `--color-border-input`, `--color-text-disabled`, `--color-danger-fill-hover` 등 적용 | theme-provider.css에 토큰 추가됨 |
| 2.5 | `src/shared/ui/teal-header-modal.css` | ✅ 완료. `--max-height-modal-scroll`, `--font-family-primary`, `--spacing-30` 적용 | — |
| 2.6 | `src/shared/ui/filter-controls-common.css` | ✅ 완료. `--filter-control-min-width` 추가, `120px` → 토큰. `11px` 패딩은 Ant Design 예외 주석 유지 | — |

**검증**: [styling-tokens.md](../design/styling-tokens.md) 규칙 요약 기준으로 위 파일들 통과.

---

### P2 — feature/페이지 CSS ✅ 대부분 완료

아래 파일들은 하드코딩 사용 빈도가 높은 순으로 정리. **한 번에 하나의 feature 또는 페이지 묶음**으로 진행 권장.

| 순서 | 대상 (예시) | 내용 |
|------|-------------|------|
| 2.7 | `src/pages/dashboard.css` | ✅ 완료. 토큰 적용 |
| 2.8 | `src/features/dashboard/ui/*.css` | ✅ `program-progress-widget.css`, `program-schedule-widget.css`, `menu-shortcut-widget.css` 토큰 적용 |
| 2.9 | `src/features/program/ui/*.css` | ✅ `program-progress-tab.css`, `program-list.css` 토큰 적용 |
| 2.10 | `src/features/schedule/ui/schedule-calendar.css` | ✅ 일부 토큰 적용 |
| 2.11 | `src/pages/auth/*.css`, `src/widgets/layout/header.css` | ✅ `login-page.css`, `register-page.css`, `header.css`, `router.css`, `mfa-page.css` 일부 적용 |
| — | 잔여 | ✅ `add-instructor-modal.css`, `applicant-instructor-detail-modal.css`, `program-calendar-view.css`, `program-managers-tab.css`, `draggable-dashboard.css` 토큰 적용 완료 |

**검증**: 파일 단위로 grep 등으로 `#hex`/`rgb(a)`/숫자+px 잔여 여부 확인. 예외는 주석으로 사유 남기기.

---

### P3 — TSX 인라인 스타일

| 순서 | 대상 | 내용 |
|------|------|------|
| 2.12 | 인라인 `style={{ }}` 사용처 | 색상·간격·폰트 등이 하드코딩된 TSX 파일들. 우선 **노출도 높은 페이지/공유 컴포넌트**부터: `main-header`, `sidebar` 연관, `dashboard`, `application-form`, `settlement-*` 등 |
| 2.13 | 방식 | 가능한 경우 해당 컴포넌트 CSS/모듈로 이동하고 `var(--토큰명)` 사용. 동적 값만 인라인 유지 |

**검증**: 리팩토링한 컴포넌트에서 상수 색상/간격/폰트가 인라인에 남지 않도록.

---

## 3. 기술적 제약·예외

- **Ant Design 등 써드파티 오버라이드**: 해당 라이브러리가 px/색상을 요구하는 경우, **주석으로 예외 사유**를 남긴 뒤 최소한만 하드코딩 허용 ([styling-tokens.md](../design/styling-tokens.md) 예외 조항).
- **토큰에 없는 값**: 먼저 `theme-provider.css`에 토큰을 추가한 뒤 사용하는 것을 원칙으로 한다.
- **전역 스타일 로드 순서**: `index.css`에서 `var(--color-bg-tertiary)` 등을 쓰려면 `theme-provider.css`가 그보다 먼저 적용되어야 함. `main.tsx`에서 `ThemeProvider` 상단에 `theme-provider.css`를 import하거나, `index.css` 상단에서 `@import` 하는 방식 등으로 순서 확정 필요.

---

## 4. 완료 기준 (개발자 체크리스트)

- [x] P0 대상 파일에서 예외를 제외한 하드코딩 제거
- [x] P1 대상 파일에서 토큰 적용 완료
- [x] P2 주요 파일 토큰 적용 완료 (dashboard, program-progress-widget, program-schedule-widget, menu-shortcut, program-progress-tab, program-list, schedule-calendar, auth 페이지, header, router)
- [x] P2 잔여 CSS (`add-instructor-modal`, `applicant-instructor-detail-modal`, `program-calendar-view`, `program-managers-tab`, `draggable-dashboard`) 토큰 적용 완료
- [ ] P3 TSX 인라인 스타일: 상수 색상·간격·폰트를 `style={{ x: 'var(--토큰)' }}` 또는 CSS 모듈로 이전
- [x] 새로 추가하는 CSS/스타일은 [styling-tokens.md](../design/styling-tokens.md) 준수

---

## 5. 관련 규칙

- [스타일링 토큰 사용 규칙](../design/styling-tokens.md)
- [색상 시스템](../design/color-system.md)
- [역할별 Persona](./persona.md) — 개발자: 기술적 타당성, 코드 품질, FSD 준수

---

**마지막 업데이트**: 2025-02
