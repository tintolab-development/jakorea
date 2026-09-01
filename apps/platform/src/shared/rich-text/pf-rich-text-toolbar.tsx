import '@jakorea/rich-text/extension-types'
import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import { useCallback, useMemo, useRef, type ChangeEvent } from 'react'
import {
  insertEmoji,
  insertHorizontalRule,
  insertImageFromFile,
  insertImageFromUrl,
  insertTable,
  insertYoutubeFromUrl,
  LINE_HEIGHT_OPTIONS,
  LIST_OPTIONS,
  promptImageUrl,
  promptLinkUrl,
  promptYoutubeUrl,
  RICH_TEXT_IMAGE_ACCEPT,
} from '@jakorea/rich-text'
import {
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  HEADING_OPTIONS,
  HIGHLIGHT_OPTIONS,
  TEXT_ALIGN_OPTIONS,
  TEXT_COLOR_OPTIONS,
  type HeadingLevel,
  type ListTypeValue,
  type TextAlignValue,
} from './pf-rich-text-toolbar.constants'
import {
  PfColorSwatchGrid,
  PfEmojiPickerGrid,
  PfToolbarDropdown,
} from './pf-rich-text-toolbar-dropdown'
import {
  PfAlignLeftIcon,
  PfBoldIcon,
  PfEmojiIcon,
  PfFontFamilyIcon,
  PfHighlightIcon,
  PfHorizontalRuleIcon,
  PfItalicIcon,
  PfLineHeightIcon,
  PfListIcon,
  PfPaletteIcon,
  PfStrikeIcon,
  PfSuperscriptIcon,
  PfTableIcon,
  PfToolbarToggle,
  PfUnderlineIcon,
} from './pf-rich-text-toolbar-toggle'
import styles from './pf-rich-text-toolbar.module.css'

export type PfRichTextToolbarProps = {
  editor: Editor | null
}

const EMPTY_TOOLBAR_STATE = {
  canEdit: false,
  heading: 'p' as HeadingLevel,
  fontFamily: '',
  fontSize: '',
  lineHeight: '',
  textColor: '',
  highlightColor: '',
  textAlign: 'left' as TextAlignValue,
  isBold: false,
  isItalic: false,
  isStrike: false,
  isUnderline: false,
  isSuperscript: false,
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

function getLineHeight(editor: Editor): string {
  if (editor.isActive('heading')) {
    return (editor.getAttributes('heading').lineHeight as string | undefined) ?? ''
  }
  return (editor.getAttributes('paragraph').lineHeight as string | undefined) ?? ''
}

function getActiveTextAlign(editor: Editor): TextAlignValue {
  if (editor.isActive({ textAlign: 'center' })) return 'center'
  if (editor.isActive({ textAlign: 'right' })) return 'right'
  if (editor.isActive({ textAlign: 'justify' })) return 'justify'
  return 'left'
}

export function PfRichTextToolbar({ editor }: PfRichTextToolbarProps) {
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
          lineHeight: getLineHeight(ed),
          textColor: getTextStyleAttr(ed, 'color'),
          highlightColor: (ed.getAttributes('highlight').color as string | undefined) ?? '',
          textAlign: getActiveTextAlign(ed),
          isBold: ed.isActive('bold'),
          isItalic: ed.isActive('italic'),
          isStrike: ed.isActive('strike'),
          isUnderline: ed.isActive('underline'),
          isSuperscript: ed.isActive('superscript'),
          isBulletList: ed.isActive('bulletList'),
          isOrderedList: ed.isActive('orderedList'),
        }
      },
    }) ?? EMPTY_TOOLBAR_STATE

  const disabled = !editor || !state.canEdit
  const activeListType: ListTypeValue | '' = state.isBulletList
    ? 'bullet'
    : state.isOrderedList
      ? 'ordered'
      : ''

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

  const fontFamilyMenuItems = useMemo(
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

  const fontSizeMenuItems = useMemo(
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

  const headingMenuItems = useMemo(
    () =>
      HEADING_OPTIONS.map(opt => ({
        key: opt.value,
        label: opt.label,
        onClick: () => handleHeadingChange(opt.value),
      })),
    [handleHeadingChange]
  )

  const lineHeightMenuItems = useMemo(
    () =>
      LINE_HEIGHT_OPTIONS.map(opt => ({
        key: opt.value || 'default',
        label: opt.label,
        onClick: () =>
          run(ed => {
            if (!opt.value) {
              ed.chain().focus().unsetLineHeight().run()
              return
            }
            ed.chain().focus().setLineHeight(opt.value).run()
          }),
      })),
    [run]
  )

  const textAlignMenuItems = useMemo(
    () =>
      TEXT_ALIGN_OPTIONS.map(opt => ({
        key: opt.value,
        label: opt.label,
        onClick: () => run(ed => ed.chain().focus().setTextAlign(opt.value).run()),
      })),
    [run]
  )

  const listMenuItems = useMemo(
    () =>
      LIST_OPTIONS.map(opt => ({
        key: opt.value,
        label: opt.label,
        onClick: () =>
          run(ed => {
            if (opt.value === 'bullet') {
              ed.chain().focus().toggleBulletList().run()
              return
            }
            ed.chain().focus().toggleOrderedList().run()
          }),
      })),
    [run]
  )

  const insertMenuItems = useMemo(
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
        label: 'YouTube',
        onClick: () => {
          const url = promptYoutubeUrl()
          if (url) run(ed => insertYoutubeFromUrl(ed, url))
        },
      },
      {
        key: 'link',
        label: '링크',
        onClick: () => run(ed => promptLinkUrl(ed)),
      },
      {
        key: 'blockquote',
        label: '인용',
        onClick: () => run(ed => ed.chain().focus().toggleBlockquote().run()),
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

  const headingLabel =
    HEADING_OPTIONS.find(o => o.value === state.heading)?.triggerLabel ?? '본문'
  const fontSizeLabel = state.fontSize
    ? FONT_SIZE_OPTIONS.find(o => o.value === state.fontSize)?.label
    : undefined
  const lineHeightLabel = state.lineHeight
    ? LINE_HEIGHT_OPTIONS.find(o => o.value === state.lineHeight)?.label
    : undefined
  const listLabel = activeListType
    ? LIST_OPTIONS.find(o => o.value === activeListType)?.label
    : undefined

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="서식">
      <input
        ref={imageFileInputRef}
        type="file"
        accept={RICH_TEXT_IMAGE_ACCEPT}
        className={styles.fileInput}
        tabIndex={-1}
        aria-hidden
        onChange={handleImageFileChange}
      />

      <PfToolbarDropdown
        ariaLabel="글꼴"
        label="글꼴"
        leadingIcon={<PfFontFamilyIcon />}
        disabled={disabled}
        menuItems={fontFamilyMenuItems}
      />
      <PfToolbarDropdown
        ariaLabel="글자 크기"
        label="크기"
        valueLabel={fontSizeLabel}
        disabled={disabled}
        menuItems={fontSizeMenuItems}
      />
      <PfToolbarDropdown
        ariaLabel="제목"
        label="제목"
        valueLabel={headingLabel}
        disabled={disabled}
        menuItems={headingMenuItems}
      />

      <PfToolbarToggle
        title="굵게"
        active={state.isBold}
        disabled={disabled}
        onAction={() => run(ed => ed.chain().focus().toggleBold().run())}
      >
        <PfBoldIcon />
      </PfToolbarToggle>
      <PfToolbarToggle
        title="기울임"
        active={state.isItalic}
        disabled={disabled}
        onAction={() => run(ed => ed.chain().focus().toggleItalic().run())}
      >
        <PfItalicIcon />
      </PfToolbarToggle>
      <PfToolbarToggle
        title="밑줄"
        active={state.isUnderline}
        disabled={disabled}
        onAction={() => run(ed => ed.chain().focus().toggleUnderline().run())}
      >
        <PfUnderlineIcon />
      </PfToolbarToggle>
      <PfToolbarToggle
        title="취소선"
        active={state.isStrike}
        disabled={disabled}
        onAction={() => run(ed => ed.chain().focus().toggleStrike().run())}
      >
        <PfStrikeIcon />
      </PfToolbarToggle>

      <PfToolbarDropdown
        ariaLabel="줄간격"
        label="줄간격"
        leadingIcon={<PfLineHeightIcon />}
        iconOnly
        valueLabel={lineHeightLabel}
        disabled={disabled}
        menuItems={lineHeightMenuItems}
      />

      <PfToolbarToggle
        title="위 첨자"
        active={state.isSuperscript}
        disabled={disabled}
        onAction={() => run(ed => ed.chain().focus().toggleSuperscript().run())}
      >
        <PfSuperscriptIcon />
      </PfToolbarToggle>

      <PfToolbarDropdown
        ariaLabel="이모지"
        label="이모지"
        leadingIcon={<PfEmojiIcon />}
        iconOnly
        disabled={disabled}
        panel={
          <PfEmojiPickerGrid
            disabled={disabled}
            onPick={name => run(ed => insertEmoji(ed, name))}
          />
        }
      />

      <PfToolbarDropdown
        ariaLabel="텍스트 색상"
        label="텍스트 색상"
        leadingIcon={<PfPaletteIcon />}
        disabled={disabled}
        panel={
          <PfColorSwatchGrid
            colors={TEXT_COLOR_OPTIONS}
            activeValue={state.textColor}
            disabled={disabled}
            onPick={color => run(ed => ed.chain().focus().setColor(color).run())}
            onClear={() => run(ed => ed.chain().focus().unsetColor().run())}
          />
        }
      />

      <PfToolbarDropdown
        ariaLabel="하이라이트"
        label="하이라이트"
        leadingIcon={<PfHighlightIcon />}
        disabled={disabled}
        panel={
          <PfColorSwatchGrid
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

      <PfToolbarDropdown
        ariaLabel="정렬"
        label="정렬"
        leadingIcon={<PfAlignLeftIcon />}
        iconOnly
        disabled={disabled}
        menuItems={textAlignMenuItems}
      />

      <PfToolbarDropdown
        ariaLabel="목록"
        label="목록"
        leadingIcon={<PfListIcon />}
        iconOnly
        valueLabel={listLabel}
        disabled={disabled}
        menuItems={listMenuItems}
      />

      <PfToolbarToggle
        title="구분선"
        disabled={disabled}
        onAction={() => run(ed => insertHorizontalRule(ed))}
      >
        <PfHorizontalRuleIcon />
      </PfToolbarToggle>

      <PfToolbarToggle
        title="표"
        disabled={disabled}
        onAction={() => run(ed => insertTable(ed))}
      >
        <PfTableIcon />
      </PfToolbarToggle>

      <PfToolbarDropdown
        ariaLabel="삽입"
        label="삽입"
        disabled={disabled}
        menuItems={insertMenuItems}
      />
    </div>
  )
}
