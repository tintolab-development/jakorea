# CMS coding rule wrappers 이관 기록 (canonical=모노레포 루트 규칙)

이관일: 2026-10-10
원본 수: 3

원본 경로 목록:

- `apps/cms/.cursor/rules/coding/react-component-render-as-jsx.mdc`
- `apps/cms/.cursor/rules/coding/react-hooks-after-early-return.mdc`
- `apps/cms/.cursor/rules/coding/rich-text-compose-input-perf.mdc`

---

### Source: `apps/cms/.cursor/rules/coding/react-component-render-as-jsx.mdc`

---
description: CMS — 훅 쓰는 컴포넌트를 일반 함수로 호출 금지 (모노레포 규칙 위임)
globs:
  - "apps/cms/src/**/*.{tsx,jsx}"
alwaysApply: false
---

# React component as JSX (CMS)

모노레포 규칙을 따른다:

→ **[.cursor/rules/react-component-render-as-jsx.mdc](../../../../../.cursor/rules/react-component-render-as-jsx.mdc)**

요약: `AdminSection(shared)` 금지 → `<AdminSection {...shared} />`. 훅이 있는 PascalCase 컴포넌트는 렌더러·헬퍼에서도 JSX로만 마운트한다.


---

### Source: `apps/cms/.cursor/rules/coding/react-hooks-after-early-return.mdc`

---
description: CMS — early return 뒤 React 훅 호출 금지 (모노레포 규칙 위임)
globs:
  - "apps/cms/src/**/*.{tsx,jsx}"
  - "apps/cms/src/**/hooks/**/*.{ts,tsx}"
alwaysApply: false
---

# React hooks order (CMS)

모노레포 규칙을 따른다:

→ **[.cursor/rules/react-hooks-after-early-return.mdc](../../../../../.cursor/rules/react-hooks-after-early-return.mdc)**

요약: 같은 컴포넌트에서 early `return` **이후**에 `useEffect` / `useFieldArray` / 기타 `use*` 를 두지 않는다. 훅 전부 → 그다음 `return null`.


---

### Source: `apps/cms/.cursor/rules/coding/rich-text-compose-input-perf.mdc`

---
description: CMS — rich text·메일 템플릿 작성 폼 입력 버벅임·제목 검증 불일치 방지 (모노레포 규칙 위임)
globs:
  - apps/cms/src/shared/rich-text/**/*.{ts,tsx}
  - apps/cms/src/features/notifications/ui/mail-template/**/*.{ts,tsx}
  - apps/cms/src/features/notifications/ui/mail-send/**/*.{ts,tsx}
  - apps/cms/src/features/notifications/ui/sms-*/**/*.{ts,tsx}
alwaysApply: false
---

# Rich text compose 입력 성능·검증 SSOT (CMS)

모노레포 규칙을 따른다:

→ **[.cursor/rules/rich-text-compose-input-perf.mdc](../../../../../.cursor/rules/rich-text-compose-input-perf.mdc)**

요약:
- `shouldRerenderOnTransaction` 기본 `false`
- 제목·발신자명은 **로컬 state + ref SSOT** (타이핑 시 부모 setState 금지)
- ❌ 매 렌더 `subjectRef.current = subject` 금지 → UI엔 제목 있는데 「제목을 작성하세요」회귀
- ❌ `.ProseMirror { min-height: 0 }` 금지 → 빈 여백 클릭 시 커서 안 잡힘
- `getDraft`/`validate`는 ref·에디터 api만 사용
- harvest/시드는 open당 1회


---
