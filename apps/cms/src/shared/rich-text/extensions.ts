/**
 * CMS Rich Text — Tiptap **MIT / 무료(open-source) extension만** 사용.
 *
 * 사용하지 않음 (유료·Cloud): Collaboration, Comments, AI, Pages, Import/Export Pro,
 * Drag Handle Pro, Snapshot, Bubble/Floating Menu UI Components 템플릿 등.
 *
 * @see https://tiptap.dev/docs/editor/getting-started/overview
 * @see apps/cms/docs/implementation/rich-text-editor-tiptap-migration.md
 */
import type { Extensions } from '@tiptap/core'
import { Image } from '@tiptap/extension-image'
import { Link } from '@tiptap/extension-link'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import Underline from '@tiptap/extension-underline'
import { Markdown } from '@tiptap/markdown'
import StarterKit from '@tiptap/starter-kit'
import type { CreateRichTextExtensionsOptions } from './types'

/** Toast UI WYSIWYG 툴바와 동등한 무료 스키마 (커스텀 툴바는 headless로 별도 구현) */
export function createRichTextExtensions(
  options: CreateRichTextExtensionsOptions = {}
): Extensions {
  const { placeholder, openLinksOnClick = false } = options

  const extensions: Extensions = [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Underline,
    Link.configure({
      openOnClick: openLinksOnClick,
      autolink: true,
      linkOnPaste: true,
    }),
    Image.configure({
      allowBase64: true,
      HTMLAttributes: {
        class: 'rich-text-content__image',
      },
    }),
    Table.configure({
      /** 무료 플랜: Pro Table UI 없이 기본 테이블만 */
      resizable: false,
    }),
    TableRow,
    TableHeader,
    TableCell,
    /** 공지 Markdown 저장·뷰어 (@tiptap/markdown, MIT) */
    Markdown,
  ]

  if (placeholder?.trim()) {
    extensions.push(
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'rich-text-editor--is-empty',
      })
    )
  }

  return extensions
}
