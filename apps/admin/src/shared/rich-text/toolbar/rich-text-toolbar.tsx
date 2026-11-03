import '@jakorea/rich-text/extension-types'
import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import type { MenuProps } from 'antd'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import {
  insertEmoji,
  insertHorizontalRule,
  insertImageFromFile,
  insertImageFromUrl,
  insertTable,
  insertYoutubeFromUrl,
  EMPTY_RICH_TEXT_TABLE_COMMAND_AVAILABILITY,
  getRichTextTableCommandAvailability,
  isRichTextTableActive,
  listRichTextTableToolbarItems,
  runRichTextTableCommand,
  LINE_HEIGHT_OPTIONS,
  LIST_OPTIONS,
  promptImageUrl,
  promptLinkUrl,
  promptYoutubeUrl,
  RICH_TEXT_IMAGE_ACCEPT,
  registerRawHtmlImageUploader,
  registerRawHtmlSourceRequester,
  type RawHtmlSourceRequest,
} from '@jakorea/rich-text'
import { RawHtmlSourceModal } from './raw-html-source-modal'
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
} from './rich-text-toolbar.constants'
import {
  ColorSwatchGrid,
  EmojiPickerGrid,
  ToolbarDropdown,
} from './rich-text-toolbar-dropdown'
import {
  AlignLeftIcon,
  BoldIcon,
  EmojiIcon,
  FontFamilyIcon,
  HighlightIcon,
  HorizontalRuleIcon,
  ItalicIcon,
  LineHeightIcon,
  ListMenuIcon,
  PaletteIcon,
  StrikeIcon,
  SuperscriptIcon,
  TableIcon,
  ToolbarToggle,
  UnderlineIcon,
} from './rich-text-toolbar-toggle'
import './rich-text-toolbar.css'

export type RichTextToolbarProps = {
  editor: Editor | null
  /**
   * 인라인 이미지·YouTube 삽입 허용 (기본 true).
   * Homepage 공지 API는 body에서 img/iframe을 sanitize로 제거하므로 remote 공지는 false.
   */
  allowInlineMedia?: boolean
  /**
   * remote 저장 시 본문 data URL 대신 업로드 주소.
   * HTML 원본 블록의 이미지 업로드(블록 안 '이미지'·소스 모달 '이미지 업로드')도 같은 함수를 쓴다.
   */
  resolveImageSrc?: (file: File) => Promise<string>
  /**
   * 삽입 메뉴에 'HTML 소스 붙여넣기'(HTML 원본 블록) 노출. 기본 false.
   * Markdown으로 저장하는 화면(교재)은 켜지 않는다.
   */
  allowRawHtmlBlock?: boolean
}

type PendingRawHtmlRequest = RawHtmlSourceRequest & {
  resolve: (html: string | null) => void
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
  isBlockquote: false,
  isBulletList: false,
  isOrderedList: false,
  isTable: false,
  tableCommandAvailability: EMPTY_RICH_TEXT_TABLE_COMMAND_AVAILABILITY,
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

/**
 * Figma 스펙 커스텀 툴바 — 드롭다운 + B/I/U/S·목록·삽입(이미지·YouTube 등).
 * 이미지 선택 시 `tiptap-extension-resize-image`가 크기·좌/중/우 정렬 UI를 표시한다.
 */
export function RichTextToolbar({
  editor,
  allowInlineMedia = true,
  resolveImageSrc,
  allowRawHtmlBlock = false,
}: RichTextToolbarProps) {
  const [rawHtmlRequest, setRawHtmlRequest] = useState<PendingRawHtmlRequest | null>(null)
  const imageFileInputRef = useRef<HTMLInputElement>(null)
  const imageFileInputId = useId()
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
          isBlockquote: ed.isActive('blockquote'),
          isBulletList: ed.isActive('bulletList'),
          isOrderedList: ed.isActive('orderedList'),
          isTable: isRichTextTableActive(ed),
          tableCommandAvailability: getRichTextTableCommandAvailability(ed),
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

  const requestRawHtmlSource = useCallback(
    (request: RawHtmlSourceRequest) =>
      new Promise<string | null>(resolve => {
        setRawHtmlRequest(prev => {
          prev?.resolve(null)
          return { ...request, resolve }
        })
      }),
    []
  )

  // 블록의 '소스 편집' 버튼이 이 모달을 쓰도록 에디터에 연결
  useEffect(() => {
    if (!editor || !allowRawHtmlBlock) return
    return registerRawHtmlSourceRequester(editor, requestRawHtmlSource)
  }, [editor, allowRawHtmlBlock, requestRawHtmlSource])

  // 블록 안 '이미지' 버튼 — 본문 이미지와 같은 업로드 경로. 업로더가 없으면 버튼을 숨긴다
  useEffect(() => {
    if (!editor || !allowRawHtmlBlock || !resolveImageSrc) return
    return registerRawHtmlImageUploader(editor, resolveImageSrc)
  }, [editor, allowRawHtmlBlock, resolveImageSrc])

  const closeRawHtmlModal = useCallback((html: string | null) => {
    setRawHtmlRequest(prev => {
      prev?.resolve(html)
      return null
    })
  }, [])

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

  const lineHeightMenuItems: MenuProps['items'] = useMemo(
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

  const textAlignMenuItems: MenuProps['items'] = useMemo(
    () =>
      TEXT_ALIGN_OPTIONS.map(opt => ({
        key: opt.value,
        label: opt.label,
        onClick: () => run(ed => ed.chain().focus().setTextAlign(opt.value).run()),
      })),
    [run]
  )

  const listMenuItems: MenuProps['items'] = useMemo(
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

  const tableMenuItems: MenuProps['items'] = useMemo(
    () =>
      listRichTextTableToolbarItems({
        inTable: state.isTable,
        availability: state.tableCommandAvailability,
      }).map(item => {
        if (item.kind === 'divider') return { type: 'divider' as const }
        if (item.kind === 'insert') {
          return {
            key: 'insert-table',
            label: item.label,
            onClick: () => run(ed => insertTable(ed)),
          }
        }
        return {
          key: item.command,
          label: item.label,
          disabled: item.disabled,
          onClick: () => run(ed => runRichTextTableCommand(ed, item.command)),
        }
      }),
    [run, state.isTable, state.tableCommandAvailability]
  )

  const insertMenuItems: MenuProps['items'] = useMemo(() => {
    const mediaItems: MenuProps['items'] = allowInlineMedia
      ? [
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
            // Dropdown 메뉴의 onClick 안에서 input.click()/showPicker()를
            // 호출하면 브라우저에 따라 사용자 제스처가 끊겨 파일 선택창이
            // 열리지 않는다. native label 연결은 메뉴 클릭 자체를 파일
            // input 활성화로 전달하므로 이 경로를 사용한다.
            label: (
              <label htmlFor={imageFileInputId} className="rich-text-toolbar__file-menu-label">
                이미지 (파일)
              </label>
            ),
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
        ]
      : [
          {
            key: 'inline-media-disabled',
            label: '이미지는 하단 첨부 파일을 사용해 주세요',
            disabled: true,
          },
          { type: 'divider' },
        ]

    const rawHtmlItems: MenuProps['items'] = allowRawHtmlBlock
      ? [
          {
            key: 'raw-html-block',
            label: 'HTML 소스 붙여넣기',
            onClick: () => {
              void requestRawHtmlSource({ initialHtml: '', mode: 'insert' }).then(html => {
                if (html == null) return
                run(ed => ed.chain().focus().insertRawHtmlBlock(html).run())
              })
            },
          },
        ]
      : []

    return [
      ...mediaItems,
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
      ...rawHtmlItems,
    ]
  }, [allowInlineMedia, allowRawHtmlBlock, imageFileInputId, requestRawHtmlSource, run])

  const handleImageFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file || !editor) return
      insertImageFromFile(editor, file, resolveImageSrc)
    },
    [editor, resolveImageSrc]
  )

  if (!editor) return null

  return (
    <div className="rich-text-toolbar-shell">
    <div className="rich-text-toolbar" role="toolbar" aria-label="서식">
      <input
        ref={imageFileInputRef}
        id={imageFileInputId}
        type="file"
        accept={RICH_TEXT_IMAGE_ACCEPT}
        className="rich-text-toolbar__file-input"
        tabIndex={-1}
        aria-hidden
        disabled={!allowInlineMedia}
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

      <ToolbarToggle
        title="굵게"
        active={state.isBold}
        disabled={disabled}
        onAction={() => run(ed => ed.chain().focus().toggleBold().run())}
      >
        <BoldIcon />
      </ToolbarToggle>
      <ToolbarToggle
        title="기울임"
        active={state.isItalic}
        disabled={disabled}
        onAction={() => run(ed => ed.chain().focus().toggleItalic().run())}
      >
        <ItalicIcon />
      </ToolbarToggle>
      <ToolbarToggle
        title="밑줄"
        active={state.isUnderline}
        disabled={disabled}
        onAction={() => run(ed => ed.chain().focus().toggleUnderline().run())}
      >
        <UnderlineIcon />
      </ToolbarToggle>
      <ToolbarToggle
        title="취소선"
        active={state.isStrike}
        disabled={disabled}
        onAction={() => run(ed => ed.chain().focus().toggleStrike().run())}
      >
        <StrikeIcon />
      </ToolbarToggle>

      <ToolbarDropdown
        ariaLabel="줄간격"
        label="줄간격"
        leadingIcon={<LineHeightIcon />}
        iconOnly
        valueLabel={
          state.lineHeight
            ? LINE_HEIGHT_OPTIONS.find(o => o.value === state.lineHeight)?.label
            : undefined
        }
        menuItems={lineHeightMenuItems}
        disabled={disabled}
      />

      <ToolbarToggle
        title="위 첨자"
        active={state.isSuperscript}
        disabled={disabled}
        onAction={() => run(ed => ed.chain().focus().toggleSuperscript().run())}
      >
        <SuperscriptIcon />
      </ToolbarToggle>

      <ToolbarDropdown
        ariaLabel="이모지"
        label="이모지"
        leadingIcon={<EmojiIcon />}
        iconOnly
        disabled={disabled}
        panel={
          <EmojiPickerGrid
            disabled={disabled}
            onPick={name => run(ed => insertEmoji(ed, name))}
          />
        }
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
        leadingIcon={<HighlightIcon />}
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
        iconOnly
        menuItems={textAlignMenuItems}
        disabled={disabled}
      />

      <ToolbarDropdown
        ariaLabel="목록"
        label="목록"
        leadingIcon={<ListMenuIcon />}
        iconOnly
        valueLabel={
          activeListType
            ? LIST_OPTIONS.find(o => o.value === activeListType)?.label
            : undefined
        }
        menuItems={listMenuItems}
        disabled={disabled}
      />

      <ToolbarToggle
        title="구분선"
        disabled={disabled}
        onAction={() => run(ed => insertHorizontalRule(ed))}
      >
        <HorizontalRuleIcon />
      </ToolbarToggle>

      <ToolbarDropdown
        ariaLabel="표"
        label="표"
        leadingIcon={<TableIcon />}
        iconOnly
        menuItems={tableMenuItems}
        disabled={disabled}
      />

      <ToolbarDropdown
        ariaLabel="삽입"
        label="삽입"
        menuItems={insertMenuItems}
        disabled={disabled}
      />
    </div>
    {allowRawHtmlBlock ? (
      <RawHtmlSourceModal
        request={rawHtmlRequest}
        onSubmit={html => closeRawHtmlModal(html)}
        onCancel={() => closeRawHtmlModal(null)}
        uploadImage={resolveImageSrc}
      />
    ) : null}
    </div>
  )
}
