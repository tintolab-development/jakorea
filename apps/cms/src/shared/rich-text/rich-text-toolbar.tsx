import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import type { MenuProps } from 'antd'
import { useCallback, useMemo, useRef, type ChangeEvent } from 'react'
import {
  insertHorizontalRule,
  insertImageFromFile,
  insertImageFromUrl,
  insertTable,
  insertYoutubeFromUrl,
  promptImageUrl,
  promptLinkUrl,
  promptYoutubeUrl,
  RICH_TEXT_IMAGE_ACCEPT,
} from './lib/rich-text-insert-actions'
import {
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  HEADING_OPTIONS,
  HIGHLIGHT_OPTIONS,
  TEXT_ALIGN_OPTIONS,
  TEXT_COLOR_OPTIONS,
  type HeadingLevel,
  type TextAlignValue,
} from './rich-text-toolbar.constants'
import { ColorSwatchGrid, ToolbarDropdown } from './rich-text-toolbar-dropdown'
import {
  AlignLeftIcon,
  BulletListIcon,
  FontFamilyIcon,
  OrderedListIcon,
  PaletteIcon,
  ToolbarGlyphToggle,
  ToolbarToggle,
} from './rich-text-toolbar-toggle'
import './rich-text-toolbar.css'

export type RichTextToolbarProps = {
  editor: Editor | null
}

const EMPTY_TOOLBAR_STATE = {
  canEdit: false,
  heading: 'p' as HeadingLevel,
  fontFamily: '',
  fontSize: '',
  textColor: '',
  highlightColor: '',
  textAlign: 'left' as TextAlignValue,
  isBold: false,
  isItalic: false,
  isStrike: false,
  isUnderline: false,
  isBulletList: false,
  isOrderedList: false,
}

function getHeadingLevel(editor: Editor): HeadingLevel {
  if (editor.isActive('heading', { level: 1 })) return '1'
  if (editor.isActive('heading', { level: 2 })) return '2'
  if (editor.isActive('heading', { level: 3 })) return '3'
  return 'p'
}

function getTextStyleAttr(editor: Editor, attr: string): string {
  const attrs = editor.getAttributes('textStyle') as Record<string, string | undefined>
  return attrs[attr] ?? ''
}

function getActiveTextAlign(editor: Editor): TextAlignValue {
  if (editor.isActive({ textAlign: 'center' })) return 'center'
  if (editor.isActive({ textAlign: 'right' })) return 'right'
  if (editor.isActive({ textAlign: 'justify' })) return 'justify'
  return 'left'
}

/**
 * Figma 스펙 커스텀 툴바 — 드롭다운 + B/I/U/S·목록·삽입(이미지·YouTube 등).
 * 이미지 선택 시 `tiptap-extension-resize-image`가 크기·좌/중/우 정렬 UI를 표시한다.
 */
export function RichTextToolbar({ editor }: RichTextToolbarProps) {
  const imageFileInputRef = useRef<HTMLInputElement>(null)
  const state =
    useEditorState({
      editor,
      selector: ({ editor: ed }) => {
        if (!ed) return EMPTY_TOOLBAR_STATE
        return {
          canEdit: ed.isEditable,
          heading: getHeadingLevel(ed),
          fontFamily: getTextStyleAttr(ed, 'fontFamily'),
          fontSize: getTextStyleAttr(ed, 'fontSize'),
          textColor: getTextStyleAttr(ed, 'color'),
          highlightColor: (ed.getAttributes('highlight').color as string | undefined) ?? '',
          textAlign: getActiveTextAlign(ed),
          isBold: ed.isActive('bold'),
          isItalic: ed.isActive('italic'),
          isStrike: ed.isActive('strike'),
          isUnderline: ed.isActive('underline'),
          isBulletList: ed.isActive('bulletList'),
          isOrderedList: ed.isActive('orderedList'),
        }
      },
    }) ?? EMPTY_TOOLBAR_STATE

  const disabled = !editor || !state.canEdit

  const run = useCallback(
    (action: (ed: Editor) => void) => {
      if (!editor) return
      action(editor)
    },
    [editor]
  )

  const handleHeadingChange = useCallback(
    (value: HeadingLevel) => {
      run(ed => {
        const chain = ed.chain().focus()
        if (value === 'p') {
          chain.setParagraph().run()
          return
        }
        chain.setHeading({ level: Number(value) as 1 | 2 | 3 }).run()
      })
    },
    [run]
  )

  const headingTriggerLabel = useMemo(() => {
    return HEADING_OPTIONS.find(o => o.value === state.heading)?.triggerLabel ?? 'H₁'
  }, [state.heading])

  const fontFamilyMenuItems: MenuProps['items'] = useMemo(
    () =>
      FONT_FAMILY_OPTIONS.map(opt => ({
        key: opt.value || 'default',
        label: opt.label,
        onClick: () =>
          run(ed => {
            if (!opt.value) {
              ed.chain().focus().unsetFontFamily().run()
              return
            }
            ed.chain().focus().setFontFamily(opt.value).run()
          }),
      })),
    [run]
  )

  const fontSizeMenuItems: MenuProps['items'] = useMemo(
    () =>
      FONT_SIZE_OPTIONS.map(opt => ({
        key: opt.value || 'default',
        label: opt.label,
        onClick: () =>
          run(ed => {
            if (!opt.value) {
              ed.chain().focus().unsetFontSize().run()
              return
            }
            ed.chain().focus().setFontSize(opt.value).run()
          }),
      })),
    [run]
  )

  const headingMenuItems: MenuProps['items'] = useMemo(
    () =>
      HEADING_OPTIONS.map(opt => ({
        key: opt.value,
        label: opt.label,
        onClick: () => handleHeadingChange(opt.value),
      })),
    [handleHeadingChange]
  )

  const textAlignMenuItems: MenuProps['items'] = useMemo(
    () =>
      TEXT_ALIGN_OPTIONS.map(opt => ({
        key: opt.value,
        label: opt.label,
        onClick: () => run(ed => ed.chain().focus().setTextAlign(opt.value).run()),
      })),
    [run]
  )

  const insertMenuItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'image-url',
        label: '이미지 (URL)',
        onClick: () => {
          const src = promptImageUrl()
          if (src) run(ed => insertImageFromUrl(ed, src))
        },
      },
      {
        key: 'image-file',
        label: '이미지 (파일)',
        onClick: () => imageFileInputRef.current?.click(),
      },
      {
        key: 'youtube',
        label: 'YouTube 동영상',
        onClick: () => {
          const url = promptYoutubeUrl()
          if (url) run(ed => insertYoutubeFromUrl(ed, url))
        },
      },
      { type: 'divider' },
      {
        key: 'link',
        label: '링크',
        onClick: () => run(ed => promptLinkUrl(ed)),
      },
      {
        key: 'table',
        label: '표',
        onClick: () => run(ed => insertTable(ed)),
      },
      {
        key: 'hr',
        label: '구분선',
        onClick: () => run(ed => insertHorizontalRule(ed)),
      },
    ],
    [run]
  )

  const handleImageFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file || !editor) return
      insertImageFromFile(editor, file)
    },
    [editor]
  )

  if (!editor) return null

  return (
    <div className="rich-text-toolbar" role="toolbar" aria-label="서식">
      <input
        ref={imageFileInputRef}
        type="file"
        accept={RICH_TEXT_IMAGE_ACCEPT}
        className="rich-text-toolbar__file-input"
        tabIndex={-1}
        aria-hidden
        onChange={handleImageFileChange}
      />
      <ToolbarDropdown
        ariaLabel="글꼴"
        label="글꼴"
        leadingIcon={<FontFamilyIcon />}
        menuItems={fontFamilyMenuItems}
        disabled={disabled}
      />

      <ToolbarDropdown
        ariaLabel="글자 크기"
        label="크기"
        valueLabel={
          state.fontSize
            ? FONT_SIZE_OPTIONS.find(o => o.value === state.fontSize)?.label
            : undefined
        }
        menuItems={fontSizeMenuItems}
        disabled={disabled}
      />

      <ToolbarDropdown
        ariaLabel="제목"
        label="제목"
        valueLabel={headingTriggerLabel}
        menuItems={headingMenuItems}
        disabled={disabled}
      />

      <ToolbarGlyphToggle
        title="굵게"
        glyph="B"
        active={state.isBold}
        disabled={disabled}
        onAction={() => run(ed => ed.chain().focus().toggleBold().run())}
      />
      <ToolbarGlyphToggle
        title="기울임"
        glyph="I"
        active={state.isItalic}
        disabled={disabled}
        onAction={() => run(ed => ed.chain().focus().toggleItalic().run())}
      />
      <ToolbarGlyphToggle
        title="밑줄"
        glyph="U"
        underline
        active={state.isUnderline}
        disabled={disabled}
        onAction={() => run(ed => ed.chain().focus().toggleUnderline().run())}
      />
      <ToolbarGlyphToggle
        title="취소선"
        glyph="S"
        active={state.isStrike}
        disabled={disabled}
        onAction={() => run(ed => ed.chain().focus().toggleStrike().run())}
      />

      <ToolbarDropdown
        ariaLabel="텍스트 색상"
        label="텍스트 색상"
        leadingIcon={<PaletteIcon />}
        disabled={disabled}
        panel={
          <ColorSwatchGrid
            colors={TEXT_COLOR_OPTIONS}
            activeValue={state.textColor}
            disabled={disabled}
            onPick={color =>
              run(ed => ed.chain().focus().setColor(color).run())
            }
            onClear={() => run(ed => ed.chain().focus().unsetColor().run())}
          />
        }
      />

      <ToolbarDropdown
        ariaLabel="하이라이트"
        label="하이라이트"
        disabled={disabled}
        panel={
          <ColorSwatchGrid
            colors={HIGHLIGHT_OPTIONS}
            activeValue={state.highlightColor}
            disabled={disabled}
            onPick={color =>
              run(ed => ed.chain().focus().setHighlight({ color }).run())
            }
            onClear={() => run(ed => ed.chain().focus().unsetHighlight().run())}
            clearLabel="하이라이트 제거"
          />
        }
      />

      <ToolbarDropdown
        ariaLabel="정렬"
        label="정렬"
        leadingIcon={<AlignLeftIcon />}
        menuItems={textAlignMenuItems}
        disabled={disabled}
      />

      <ToolbarToggle
        title="글머리 목록"
        active={state.isBulletList}
        disabled={disabled}
        onAction={() => run(ed => ed.chain().focus().toggleBulletList().run())}
      >
        <BulletListIcon />
      </ToolbarToggle>
      <ToolbarToggle
        title="번호 목록"
        active={state.isOrderedList}
        disabled={disabled}
        onAction={() => run(ed => ed.chain().focus().toggleOrderedList().run())}
      >
        <OrderedListIcon />
      </ToolbarToggle>

      <ToolbarDropdown
        ariaLabel="삽입"
        label="삽입"
        menuItems={insertMenuItems}
        disabled={disabled}
      />
    </div>
  )
}
