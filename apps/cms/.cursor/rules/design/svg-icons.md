---
priority: high
always_include: true
category: design
---

# 커스텀 SVG 아이콘

## 위치

- **경로**: `apps/cms/src/shared/ui/icons/`
- **배럴**: `index.ts`에서 컴포넌트·타입을 export 한다.
- **재사용 import**: `@/shared/ui/icons` 또는 `@/shared/ui`에서 동일 아이콘을 가져온다.

Ant Design [`@ant-design/icons`](https://ant.design/components/icon)에 있는 아이콘은 그대로 사용하고, **디자인 시안 전용·브랜드·일러스트성 SVG**만 이 폴더에 둔다.

## 파일·이름 규칙

- 파일명: **PascalCase** + `Icon` 접미사 (예: `LogoutIcon.tsx`, `GoogleMarkIcon.tsx`).
- 컴포넌트명은 파일명과 동일.
- 한 파일에 **하나의 루트 SVG 컴포넌트**를 둔다 (작은 세트가 강하게 묶여 있을 때만 예외적으로 한 파일에 여러 export 가능).

## 구현 패턴

- 루트 요소는 `<svg>`이며, `viewBox`는 원본 에셋과 동일하게 유지한다.
- 공통으로 조절할 값은 props로 노출한다: `size`, `fill`, `className`, `stroke` 등. 나머지는 `SVGProps<SVGSVGElement>`를 확장해 `...rest`로 전달해도 된다.
- **고유 ID**가 필요한 경우(`mask`, `clipPath`, `linearGradient` 등): `useId()`로 접두사를 붙여 DOM 충돌을 방지한다 (`ProfileAvatarIcon` 참고).
- 장식용 아이콘에는 `aria-hidden`을 두고, 의미가 있는 아이콘만 `role`/`aria-label`을 부여한다.

## Ant Design과의 역할 분담

- 버튼·폼·테이블 등 **UI 패턴용 아이콘** → `@ant-design/icons` 우선.
- **한 화면·한 기능에만 쓰이고 mask id 등으로 해당 파일에 강하게 묶인 SVG**는 해당 feature 파일에 둘 수 있다. 다만 두 곳 이상에서 쓰이면 `shared/ui/icons`로 올린다.

## 관련 규칙

- [Ant Design 사용법](../libraries/ant-design-usage.md)
- [UI 원칙](ui-principles.md)
