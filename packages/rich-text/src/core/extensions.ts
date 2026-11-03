/**
 * JaKorea Rich Text — Tiptap **MIT / 무료(open-source) extension만** 사용.
 *
 * @see https://tiptap.dev/docs/editor/getting-started/overview
 */
import type { Extensions } from '@tiptap/core'
import { Color } from '@tiptap/extension-color'
import Dropcursor from '@tiptap/extension-dropcursor'
import { FontFamily } from '@tiptap/extension-font-family'
import { Link } from '@tiptap/extension-link'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { Markdown } from '@tiptap/markdown'
import StarterKit from '@tiptap/starter-kit'
import { RichTextEmoji } from './emoji-extension'
import { createRichTextFileHandler } from './file-handler-extension'
import { FontSize } from './font-size-extension'
import { LineHeight } from './line-height-extension'
import {
  RichTextHeading,
  RichTextHighlight,
  RichTextImageResize,
  RichTextParagraph,
  RichTextTextStyle,
  RichTextYoutube,
} from './markdown-serializers'
import { RawHtmlBlock } from './raw-html-block'
import { RichTextSuperscript } from './superscript-extension'
import type { CreateRichTextExtensionsOptions } from './types'

export function createRichTextExtensions(
  options: CreateRichTextExtensionsOptions = {}
): Extensions {
  const {
    placeholder,
    openLinksOnClick = false,
    preset = 'full',
    extraExtensions,
    getResolveImageSrc,
  } = options
  const isFull = preset === 'full'

  const extensions: Extensions = [
    StarterKit.configure({
      paragraph: false,
      heading: false,
      dropcursor: false,
      link: false,
      underline: false,
    }),
    Dropcursor.configure({
      color: 'var(--rt-dropcursor, #01A1AF)',
      width: 2,
    }),
    RichTextParagraph,
    RichTextHeading.configure({ levels: [1, 2, 3] }),
    RichTextTextStyle,
    FontFamily,
    FontSize,
    LineHeight,
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
    // 모든 뷰어가 렌더하도록 항상 등록. 삽입 메뉴는 앱 툴바에서 선택적으로 노출
    RawHtmlBlock,
    Table.configure({
      resizable: false,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Markdown,
  ]

  if (isFull) {
    extensions.push(
      RichTextSuperscript,
      RichTextEmoji,
      createRichTextFileHandler(getResolveImageSrc),
    )
  }

  if (placeholder?.trim()) {
    extensions.push(
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'rich-text-editor--is-empty',
      })
    )
  }

  if (extraExtensions?.length) {
    extensions.push(...extraExtensions)
  }

  return extensions
}
