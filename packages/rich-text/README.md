# @jakorea/rich-text

JaKorea 모노레포 공통 Tiptap rich text 패키지 (CMS·Platform).

## Exports

| Import | 내용 |
|--------|------|
| `@jakorea/rich-text` | core — extensions, content 직렬화, editor-api, insert-actions |
| `@jakorea/rich-text/react` | `useRichTextEditor`, `RichTextEditor`, `RichTextViewer` |
| `@jakorea/rich-text/styles/content.css` | 본문 prose (`.rich-text-content`) |
| `@jakorea/rich-text/styles/editor.css` | 에디터 셸 (`.rich-text-editor`) |

## 앱별 툴바

패키지 shell은 **툴바 UI를 포함하지 않습니다.** Ant Design(CMS) 또는 PF(Platform) 툴바를 `toolbar` 슬롯으로 주입합니다.

```tsx
import { RichTextEditor, useRichTextEditor } from '@jakorea/rich-text/react'
import '@jakorea/rich-text/styles/content.css'
import '@jakorea/rich-text/styles/editor.css'

const { editor } = useRichTextEditor({ enabled: true, initialContent: '' })

<RichTextEditor editor={editor} toolbar={<AppToolbar editor={editor} />} />
```

## CSS 변수

`editor.css` / `content.css` / `toolbar.css`는 `--rt-*` 변수로 테마 오버라이드 가능:

- `--rt-border`, `--rt-background`, `--rt-toolbar-bg`
- `--rt-content-color`, `--rt-link-color`
- `--rt-min-height`, `--rt-body-padding`
- `--rt-toolbar-gap` (기본 8px), `--rt-toolbar-padding`, `--rt-toolbar-trigger-gap`

앱별 노드(메일 `#{변수}` atom 등)는 `useRichTextEditor({ extraExtensions })` / `RichTextViewer extraExtensions`로 주입합니다.

## CMS 마이그레이션

기존 `@/shared/rich-text`는 re-export 어댑터로 유지. 상세: `apps/cms/docs/implementation/rich-text-editor-tiptap-migration.md`

## 개발

```bash
pnpm --filter @jakorea/rich-text build
pnpm --filter @jakorea/rich-text typecheck
```
