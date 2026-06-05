/**
 * CMS Rich Text — Tiptap **MIT / 무료(open-source) extension만** 사용.
 *
 * @see https://tiptap.dev/docs/editor/getting-started/overview
 * @see apps/cms/docs/implementation/rich-text-editor-tiptap-migration.md
 */
import type { Extensions } from '@tiptap/core'
import { Color } from '@tiptap/extension-color'
import { FontFamily } from '@tiptap/extension-font-family'
import { Link } from '@tiptap/extension-link'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { Markdown } from '@tiptap/markdown'
import StarterKit from '@tiptap/starter-kit'
import { FontSize } from './lib/font-size-extension'
import {
  RichTextHeading,
  RichTextHighlight,
  RichTextImageResize,
  RichTextParagraph,
  RichTextTextStyle,
  RichTextYoutube,
} from './lib/markdown-serializers'
import type { CreateRichTextExtensionsOptions } from './types'

export function createRichTextExtensions(
  options: CreateRichTextExtensionsOptions = {}
): Extensions {
  const { placeholder, openLinksOnClick = false } = options

  const extensions: Extensions = [
    StarterKit.configure({
      paragraph: false,
      heading: false,
    }),
    RichTextParagraph,
    RichTextHeading.configure({ levels: [1, 2, 3] }),
    RichTextTextStyle,
    FontFamily,
    FontSize,
    Color.configure({ types: ['textStyle'] }),
    RichTextHighlight,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    Underline,
    Link.configure({
      openOnClick: openLinksOnClick,
      autolink: true,
      linkOnPaste: true,
    }),
    RichTextImageResize,
    RichTextYoutube,
    Table.configure({
      resizable: false,
    }),
    TableRow,
    TableHeader,
    TableCell,
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
