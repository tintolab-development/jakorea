import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import type { TemplateWritingUserPreviewSession } from '@/features/template/context/template-writing-preview-context'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import type { FormEditorKind } from '@/features/template/model/writing-form-draft.schema'
import {
  getWritingFormHeadMiddlePinnedTail,
  normalizeWritingFormDraft,
  reorderHeadMiddleTail,
  type FormTitleNumberingStyle,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  useWritingFormMiddleParagraphActions,
  type MiddleParagraphActionsHandlers,
} from '@/features/template/hooks/use-writing-form-middle-paragraph-actions'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

export type UseWritingFormEditorWithUserPreviewOptions = {
  /** 편집 UI(풀페이지 등) 열림 */
  open: boolean
  /** `open`이 true로 전환될 때마다 초안을 다시 만든다 */
  getInitialDraft: () => WritingFormDraft
  /** 리셋 직후 선택할 단락 id */
  getDefaultActiveParagraphId: (draft: WritingFormDraft) => string | null
  /** `TemplateWritingPreview` 상단 제목 */
  previewHeaderTitle: string
  editorKind?: FormEditorKind
  /** 미리보기 모달 z-index (선택) */
  previewZIndex?: number
  /** 사용자 미리보기(`TemplatePreviewModal`) 본문 옵션 — UJAT 교육일지 학교명 자동 표시 등 */
  previewParagraphBodyOptions?: RenderFormParagraphBodyOptions
  a4PreviewOptions?: Pick<
    TemplateWritingUserPreviewSession,
    | 'previewLayout'
    | 'hideParagraphRequiredChrome'
    | 'a4HiddenParagraphIds'
    | 'a4RenderMode'
    | 'a4ParagraphGapPx'
  >
  onSave?: () => void
}

export type FormEditorNavLine = { id: string; displayLine: string }

export type WritingFormEditorWithUserPreviewResult = {
  headerTitle: string
  draft: WritingFormDraft
  activeParagraphId: string | null
  singleItemListActiveItemId: string | null
  pinnedTop: FormEditorNavLine | null
  sortableMiddle: FormEditorNavLine[]
  pinnedBottom: FormEditorNavLine | FormEditorNavLine[] | null
  handleSelectCard: (id: string) => void
  onReorderMiddle: (activeId: string, overId: string) => void
  onTitleNumberingChange: (style: FormTitleNumberingStyle) => void
  updateParagraph: (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => void
  onSelectSingleItemListItem: (paragraphId: string, itemId: string | null) => void
  handlePreview: () => void
  handleSave: () => void
  middleParagraphActions: MiddleParagraphActionsHandlers
}

/**
 * 설문/작성 양식 `WritingFormDraft` 로컬 편집 + 우측 네비용 단락 라인 + `TemplateWritingPreview` 동기화
 */
export function useWritingFormEditorWithUserPreview(
  options: UseWritingFormEditorWithUserPreviewOptions
): WritingFormEditorWithUserPreviewResult {
  const {
    open,
    getInitialDraft,
    getDefaultActiveParagraphId,
    previewHeaderTitle,
    editorKind = 'survey',
    previewZIndex,
    previewParagraphBodyOptions,
    a4PreviewOptions,
    onSave,
  } = options

  const {
    openWritingUserPreview,
    syncWritingUserPreviewSession,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()

  const [draft, setDraft] = useState<WritingFormDraft>(() =>
    normalizeWritingFormDraft(getInitialDraft())
  )
  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(() =>
    getDefaultActiveParagraphId(normalizeWritingFormDraft(getInitialDraft()))
  )

  useEffect(() => {
    if (!open) return
    const next = normalizeWritingFormDraft(getInitialDraft())
    setDraft(next)
    setActiveParagraphId(getDefaultActiveParagraphId(next))
    setSingleItemListActiveItemId(null)
  }, [open, getInitialDraft, getDefaultActiveParagraphId])

  useEffect(() => {
    if (!open) closeWritingUserPreview()
  }, [open, closeWritingUserPreview])

  const handleSelectCard = useCallback((id: string) => {
    setActiveParagraphId(id)
    setSingleItemListActiveItemId(null)
  }, [])

  const updateParagraph = useCallback(
    (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => {
      setDraft(prev => ({
        ...prev,
        paragraphs: prev.paragraphs.map(p => (p.id === id ? updater(p) : p)),
      }))
    },
    []
  )

  const writingPreviewSession = useMemo((): TemplateWritingUserPreviewSession => {
    return {
      draft,
      updateParagraph,
      headerTitle: previewHeaderTitle,
      editorKind,
      zIndex: previewZIndex,
      paragraphBodyOptions: previewParagraphBodyOptions,
      previewLayout: a4PreviewOptions?.previewLayout,
      hideParagraphRequiredChrome: a4PreviewOptions?.hideParagraphRequiredChrome,
      a4HiddenParagraphIds: a4PreviewOptions?.a4HiddenParagraphIds,
      a4RenderMode: a4PreviewOptions?.a4RenderMode,
      a4ParagraphGapPx: a4PreviewOptions?.a4ParagraphGapPx,
      focusedParagraphId: activeParagraphId,
    }
  }, [
    draft,
    updateParagraph,
    previewHeaderTitle,
    editorKind,
    previewZIndex,
    previewParagraphBodyOptions,
    a4PreviewOptions,
    activeParagraphId,
  ])

  useEffect(() => {
    if (!open) return
    if (!isWritingUserPreviewOpen) return
    syncWritingUserPreviewSession(writingPreviewSession)
  }, [open, isWritingUserPreviewOpen, syncWritingUserPreviewSession, writingPreviewSession])

  const onReorderMiddle = useCallback((activeId: string, overId: string) => {
    setDraft(prev => ({
      ...prev,
      paragraphs: reorderHeadMiddleTail(prev.paragraphs, activeId, overId),
    }))
  }, [])

  const onTitleNumberingChange = useCallback((style: FormTitleNumberingStyle) => {
    setDraft(prev => ({
      ...prev,
      formSettings: { ...prev.formSettings, titleNumbering: style },
    }))
  }, [])

  const { pinnedTop, sortableMiddle, pinnedBottom } = useMemo(() => {
    const { titleNumbering } = draft.formSettings
    const line = (p: WritingFormParagraph) => ({
      id: p.id,
      displayLine: getFormNavDisplayLine(draft.paragraphs, p, titleNumbering),
    })
    const split = getWritingFormHeadMiddlePinnedTail(draft.paragraphs)
    if (split == null) {
      return {
        pinnedTop: null as ReturnType<typeof line> | null,
        sortableMiddle: [] as ReturnType<typeof line>[],
        pinnedBottom: null as ReturnType<typeof line> | ReturnType<typeof line>[] | null,
      }
    }
    const { head, middle, pinnedTail } = split
    const bottomLines = pinnedTail.map(line)
    return {
      pinnedTop: line(head),
      sortableMiddle: middle.map(line),
      pinnedBottom:
        bottomLines.length === 1 ? bottomLines[0]! : bottomLines.length > 1 ? bottomLines : null,
    }
  }, [draft])

  const handlePreview = useCallback(() => {
    openWritingUserPreview(writingPreviewSession)
  }, [openWritingUserPreview, writingPreviewSession])

  const handleSave = useCallback(() => {
    onSave?.()
  }, [onSave])

  const onSelectSingleItemListItem = useCallback((paragraphId: string, itemId: string | null) => {
    setActiveParagraphId(paragraphId)
    setSingleItemListActiveItemId(itemId)
  }, [])

  const middleParagraphActions = useWritingFormMiddleParagraphActions(
    setDraft,
    setActiveParagraphId
  )

  return {
    headerTitle: previewHeaderTitle,
    draft,
    activeParagraphId,
    singleItemListActiveItemId,
    pinnedTop,
    sortableMiddle,
    pinnedBottom,
    handleSelectCard,
    onReorderMiddle,
    onTitleNumberingChange,
    updateParagraph,
    onSelectSingleItemListItem,
    handlePreview,
    handleSave,
    middleParagraphActions,
  }
}
