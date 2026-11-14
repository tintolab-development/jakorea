---
priority: high
always_include: true
category: design
---

# Custom SVG icons

## Location

- 원본 SVG 파일: `apps/cms/src/shared/assets/icons/{buttons,inputs,lnb,gnb,file-types,table,…}/` — **Figma CMS 디자인 시스템(`U6QntWGwBOxMszahPxjmGX`) 원본 내보내기**(Design Guide 컴포넌트 · Image Sprite).
- 컴포넌트: `apps/cms/src/shared/ui/icons/` — `MaskIcon`(CSS mask, 색은 `currentColor`)으로 원본 SVG를 그리는 래퍼(`ButtonIcons`, `LnbIcons`, `GnbIcons` …).
- Re-export from `index.ts`; import via `@/shared/ui/icons` or `@/shared/ui`.

## Source of truth (2026-11 아이콘 점검)

- **모든 UI 아이콘은 Figma 시안 원본 SVG**를 쓴다. 비슷한 모양이라도 직접 그리거나 다른 아이콘 세트로 대체하지 않는다.
- **`@ant-design/icons`는 새로 쓰지 않는다.** 기존 사용처는 섹션별로 Figma 원본으로 교체 중이며, 시안에 대응 아이콘이 없으면 임의로 고르지 말고 확인을 받는다.
- 색만 다른 원본 여러 벌은 파일 하나 + `MaskIcon`(currentColor)으로 대체할 수 있다. 모양이 다른 상태(예: 알림 on/off)는 원본을 각각 둔다.
- Figma 프레임 여백을 유지한다(글리프만 잘라 상자를 꽉 채우지 않음). 표시 크기는 시안 프레임 크기(24·20 등)를 따른다.

## Naming

- File & component: **PascalCase** + `Icon` suffix (`LogoutIcon.tsx`).

## Implementation

- Preserve `viewBox`; expose `size`, `fill`, `className`, etc.  
- Use `useId()` for `mask`/`clipPath` ids to avoid collisions.  
- Decorative icons: `aria-hidden`; meaningful icons: proper `role` / `aria-label`.

## Sharing rule

If more than one feature needs the asset, move it to `shared/ui/icons`.

## Related

- [ant-design-usage.md](../libraries/ant-design-usage.md)  
- [ui-principles.md](./ui-principles.md)  

**Last updated:** 2026-11-13
