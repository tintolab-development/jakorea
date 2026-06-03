import {
  BoldOutlined,
  CodeOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  PictureOutlined,
  StrikethroughOutlined,
  TableOutlined,
  UnderlineOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import type { ReactNode } from 'react'
import { useCallback, useMemo } from 'react'
import './rich-text-toolbar.css'

export type RichTextToolbarProps = {
  editor: Editor | null
}

type HeadingLevel = 'p' | '1' | '2' | '3'

const HEADING_OPTIONS: { value: HeadingLevel; label: string }[] = [
  { value: 'p', label: '본문' },
  { value: '1', label: '제목 1' },
  { value: '2', label: '제목 2' },
  { value: '3', label: '제목 3' },
]

const EMPTY_TOOLBAR_STATE = {
  canEdit: false,
  heading: 'p' as HeadingLevel,
  isBold: false,
  isItalic: false,
  isStrike: false,
  isUnderline: false,
  isBulletList: false,
  isOrderedList: false,
  isBlockquote: false,
  isCode: false,
  isCodeBlock: false,
}

function getHeadingLevel(editor: Editor): HeadingLevel {
  if (editor.isActive('heading', { level: 1 })) return '1'
  if (editor.isActive('heading', { level: 2 })) return '2'
  if (editor.isActive('heading', { level: 3 })) return '3'
  return 'p'
}

function ToolbarButton({
  title,
  active,
  disabled,
  onAction,
  children,
}: {
  title: string
  active?: boolean
  disabled?: boolean
  onAction: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={[
        'rich-text-toolbar__btn',
        active ? 'rich-text-toolbar__btn--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={event => event.preventDefault()}
      onClick={onAction}
    >
      {children}
    </button>
  )
}

function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="rich-text-toolbar__group">{children}</div>
}

/**
 * Toast UI WYSIWYG 툴바 parity — headless Tiptap용 기본 툴바.
 * @see apps/cms/docs/implementation/rich-text-editor-tiptap-migration.md §7.2
 */
export function RichTextToolbar({ editor }: RichTextToolbarProps) {
  const state =
    useEditorState({
      editor,
      selector: ({ editor: ed }) => {
        if (!ed) return EMPTY_TOOLBAR_STATE
        return {
          canEdit: ed.isEditable,
          heading: getHeadingLevel(ed),
          isBold: ed.isActive('bold'),
          isItalic: ed.isActive('italic'),
          isStrike: ed.isActive('strike'),
          isUnderline: ed.isActive('underline'),
          isBulletList: ed.isActive('bulletList'),
          isOrderedList: ed.isActive('orderedList'),
          isBlockquote: ed.isActive('blockquote'),
          isCode: ed.isActive('code'),
          isCodeBlock: ed.isActive('codeBlock'),
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

  const handleLink = useCallback(() => {
    run(ed => {
      const previousUrl = ed.getAttributes('link').href as string | undefined
      const url = window.prompt('링크 URL', previousUrl ?? 'https://')
      if (url === null) return
      const trimmed = url.trim()
      if (trimmed === '') {
        ed.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }
      ed.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run()
    })
  }, [run])

  const handleImage = useCallback(() => {
    run(ed => {
      const url = window.prompt('이미지 URL')
      if (url == null) return
      const trimmed = url.trim()
      if (!trimmed) return
      ed.chain().focus().setImage({ src: trimmed }).run()
    })
  }, [run])

  const handleTable = useCallback(() => {
    run(ed => {
      ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    })
  }, [run])

  const headingValue = useMemo(() => state.heading, [state.heading])

  if (!editor) return null

  return (
    <div className="rich-text-toolbar">
      <ToolbarGroup>
        <select
          className="rich-text-toolbar__heading-select"
          value={headingValue}
          disabled={disabled}
          aria-label="제목 단계"
          onMouseDown={event => event.preventDefault()}
          onChange={event => handleHeadingChange(event.target.value as HeadingLevel)}
        >
          {HEADING_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton
          title="굵게"
          active={state.isBold}
          disabled={disabled}
          onAction={() => run(ed => ed.chain().focus().toggleBold().run())}
        >
          <BoldOutlined className="rich-text-toolbar__btn-icon" />
        </ToolbarButton>
        <ToolbarButton
          title="기울임"
          active={state.isItalic}
          disabled={disabled}
          onAction={() => run(ed => ed.chain().focus().toggleItalic().run())}
        >
          <ItalicOutlined className="rich-text-toolbar__btn-icon" />
        </ToolbarButton>
        <ToolbarButton
          title="취소선"
          active={state.isStrike}
          disabled={disabled}
          onAction={() => run(ed => ed.chain().focus().toggleStrike().run())}
        >
          <StrikethroughOutlined className="rich-text-toolbar__btn-icon" />
        </ToolbarButton>
        <ToolbarButton
          title="밑줄"
          active={state.isUnderline}
          disabled={disabled}
          onAction={() => run(ed => ed.chain().focus().toggleUnderline().run())}
        >
          <UnderlineOutlined className="rich-text-toolbar__btn-icon" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton
          title="구분선"
          disabled={disabled}
          onAction={() => run(ed => ed.chain().focus().setHorizontalRule().run())}
        >
          <span className="rich-text-toolbar__btn-icon">―</span>
        </ToolbarButton>
        <ToolbarButton
          title="인용"
          active={state.isBlockquote}
          disabled={disabled}
          onAction={() => run(ed => ed.chain().focus().toggleBlockquote().run())}
        >
          <span className="rich-text-toolbar__btn-icon">&ldquo;</span>
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton
          title="글머리 목록"
          active={state.isBulletList}
          disabled={disabled}
          onAction={() => run(ed => ed.chain().focus().toggleBulletList().run())}
        >
          <UnorderedListOutlined className="rich-text-toolbar__btn-icon" />
        </ToolbarButton>
        <ToolbarButton
          title="번호 목록"
          active={state.isOrderedList}
          disabled={disabled}
          onAction={() => run(ed => ed.chain().focus().toggleOrderedList().run())}
        >
          <OrderedListOutlined className="rich-text-toolbar__btn-icon" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton title="표 삽입" disabled={disabled} onAction={handleTable}>
          <TableOutlined className="rich-text-toolbar__btn-icon" />
        </ToolbarButton>
        <ToolbarButton title="링크" disabled={disabled} onAction={handleLink}>
          <LinkOutlined className="rich-text-toolbar__btn-icon" />
        </ToolbarButton>
        <ToolbarButton title="이미지" disabled={disabled} onAction={handleImage}>
          <PictureOutlined className="rich-text-toolbar__btn-icon" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton
          title="인라인 코드"
          active={state.isCode}
          disabled={disabled}
          onAction={() => run(ed => ed.chain().focus().toggleCode().run())}
        >
          <CodeOutlined className="rich-text-toolbar__btn-icon" />
        </ToolbarButton>
        <ToolbarButton
          title="코드 블록"
          active={state.isCodeBlock}
          disabled={disabled}
          onAction={() => run(ed => ed.chain().focus().toggleCodeBlock().run())}
        >
          <span className="rich-text-toolbar__btn-icon">{'{}'}</span>
        </ToolbarButton>
      </ToolbarGroup>
    </div>
  )
}
