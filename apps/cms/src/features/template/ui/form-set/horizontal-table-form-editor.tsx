import { useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { TemplateFullpageModal } from '@/features/template/ui/template-fullpage-modal'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import {
  cloneHorizontalTableParagraph,
  createDefaultHorizontalTableDraft,
  createHorizontalTableParagraph,
  DEFAULT_HORIZONTAL_TABLE_PARAGRAPH_IDS,
  type FormTitleNumberingStyle,
  type HorizontalTableParagraph,
  type HorizontalTableRowSelection,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/form-editor-field-nav'
import { FormEditorLeftPane } from '@/features/template/ui/form-editor/form-editor-left-pane'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/form-editor-right-panel'
import '@/features/template/ui/form-set/horizontal-table-form-editor.css'

export type HorizontalTableFormEditorVariant = 'fullpage-modal' | 'embedded'

export interface HorizontalTableFormEditorProps {
  variant: HorizontalTableFormEditorVariant
  /** fullpage-modal 전용: 닫기 시 호출 */
  onClose?: () => void
}

export function HorizontalTableFormEditor({ variant, onClose }: HorizontalTableFormEditorProps) {
  const [draft, setDraft] = useState<WritingFormDraft>(() => createDefaultHorizontalTableDraft())
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(
    DEFAULT_HORIZONTAL_TABLE_PARAGRAPH_IDS.title
  )
  const [horizontalTableRowSelection, setHorizontalTableRowSelection] =
    useState<HorizontalTableRowSelection | null>(null)

  useEffect(() => {
    setHorizontalTableRowSelection(null)
  }, [activeParagraphId])

  useEffect(() => {
    if (activeParagraphId == null) return
    if (!draft.paragraphs.some(p => p.id === activeParagraphId)) {
      setActiveParagraphId(draft.paragraphs[0]?.id ?? null)
    }
  }, [draft.paragraphs, activeParagraphId])

  const updateParagraph = useCallback(
    (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => {
      setDraft(prev => ({
        ...prev,
        paragraphs: prev.paragraphs.map(p => (p.id === id ? updater(p) : p)),
      }))
    },
    []
  )

  const onReorderMiddle = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return
    setDraft(prev => {
      const paras = prev.paragraphs
      if (paras.length < 3) return prev
      const head = paras[0]!
      const tail = paras[paras.length - 1]!
      const middle = paras.slice(1, -1)
      const oldIdx = middle.findIndex(p => p.id === activeId)
      const newIdx = middle.findIndex(p => p.id === overId)
      if (oldIdx === -1 || newIdx === -1) return prev
      const nextMiddle = [...middle]
      const [removed] = nextMiddle.splice(oldIdx, 1)
      nextMiddle.splice(newIdx, 0, removed)
      return { ...prev, paragraphs: [head, ...nextMiddle, tail] }
    })
  }, [])

  const onAddMiddleParagraphAfter = useCallback((paragraphId: string) => {
    const newId = crypto.randomUUID()
    setDraft(prev => {
      const idx = prev.paragraphs.findIndex(p => p.id === paragraphId)
      if (idx === -1) return prev
      const next = [...prev.paragraphs]
      next.splice(idx + 1, 0, createHorizontalTableParagraph(newId))
      return { ...prev, paragraphs: next }
    })
    setActiveParagraphId(newId)
  }, [])

  const onDuplicateMiddleParagraph = useCallback((paragraphId: string) => {
    const newId = crypto.randomUUID()
    setDraft(prev => {
      const idx = prev.paragraphs.findIndex(p => p.id === paragraphId)
      if (idx === -1) return prev
      const p = prev.paragraphs[idx]
      if (p.kind !== 'single_item' || p.variant !== 'horizontal_table') return prev
      const clone = cloneHorizontalTableParagraph(p as HorizontalTableParagraph, newId)
      const next = [...prev.paragraphs]
      next.splice(idx + 1, 0, clone)
      return { ...prev, paragraphs: next }
    })
    setActiveParagraphId(newId)
  }, [])

  const onDeleteMiddleParagraph = useCallback((paragraphId: string) => {
    setDraft(prev => {
      const middle = prev.paragraphs.slice(1, -1)
      if (middle.length <= 1) {
        message.warning('중간 단락은 최소 1개 이상 유지해야 합니다.')
        return prev
      }
      if (!middle.some(p => p.id === paragraphId)) {
        message.warning('제목·마무리 단락은 삭제할 수 없습니다.')
        return prev
      }
      return { ...prev, paragraphs: prev.paragraphs.filter(p => p.id !== paragraphId) }
    })
  }, [])

  const middleParagraphActions = useMemo(
    () => ({
      onAddAfter: onAddMiddleParagraphAfter,
      onDuplicate: onDuplicateMiddleParagraph,
      onDelete: onDeleteMiddleParagraph,
    }),
    [onAddMiddleParagraphAfter, onDuplicateMiddleParagraph, onDeleteMiddleParagraph]
  )

  const onTitleNumberingChange = useCallback((style: FormTitleNumberingStyle) => {
    setDraft(prev => ({
      ...prev,
      formSettings: { ...prev.formSettings, titleNumbering: style },
    }))
  }, [])

  const { pinnedTop, sortableMiddle, pinnedBottom } = useMemo(() => {
    const [head, ...rest] = draft.paragraphs
    const tail = rest[rest.length - 1]
    const middle = rest.slice(0, -1)
    const { titleNumbering } = draft.formSettings
    const line = (p: WritingFormParagraph) => ({
      id: p.id,
      displayLine: getFormNavDisplayLine(draft.paragraphs, p, titleNumbering),
    })
    return {
      pinnedTop: line(head),
      sortableMiddle: middle.map(line),
      pinnedBottom: line(tail),
    }
  }, [draft])

  const handlePreview = useCallback(() => {
    message.info('미리보기는 추후 연동 예정입니다.')
  }, [])

  const handleSave = useCallback(() => {
    message.success('저장 API 연동 전입니다.')
  }, [])

  const leftPane = (
    <FormEditorLeftPane
      paragraphs={draft.paragraphs}
      titleNumbering={draft.formSettings.titleNumbering}
      selectedCardId={activeParagraphId}
      onSelectCard={setActiveParagraphId}
      onReorderMiddle={onReorderMiddle}
      updateParagraph={updateParagraph}
      editorKind="horizontal_table"
      layout="three"
      horizontalTableRowSelection={horizontalTableRowSelection}
      onHorizontalTableRowSelectionChange={setHorizontalTableRowSelection}
      middleParagraphActions={middleParagraphActions}
    />
  )

  const rightNav = (
    <FormEditorFieldNav
      sectionTitle="커스텀 필드"
      pinnedTop={pinnedTop}
      sortableMiddle={sortableMiddle}
      pinnedBottom={pinnedBottom}
      selectedItemId={activeParagraphId}
      onSelectItem={setActiveParagraphId}
      onReorderMiddle={onReorderMiddle}
      fieldListBottomSlot={
        <FormEditorTitleNumberingField
          value={draft.formSettings.titleNumbering}
          onChange={onTitleNumberingChange}
        />
      }
    >
      <FormEditorRightPanel
        draft={draft}
        activeParagraphId={activeParagraphId}
        onTitleNumberingChange={onTitleNumberingChange}
        updateParagraph={updateParagraph}
        editorKind="horizontal_table"
        showTitleNumbering={false}
        horizontalTableRowSelection={horizontalTableRowSelection}
        onHorizontalTableBodyRowDeleted={() => setHorizontalTableRowSelection(null)}
      />
    </FormEditorFieldNav>
  )

  if (variant === 'embedded') {
    return (
      <div className="horizontal-table-form-editor horizontal-table-form-editor--embedded">
        <div className="horizontal-table-form-editor__contents full-page-modal__contents">
          <div className="full-page-modal__left">{leftPane}</div>
          <aside className="full-page-modal__right-wrap">
            <div className="full-page-modal__right">{rightNav}</div>
          </aside>
        </div>
      </div>
    )
  }

  return (
    <TemplateFullpageModal
      open
      onClose={onClose ?? (() => {})}
      title="테이블 가로형"
      description="* 등록 시 최소 1개의 단락은 존재해야 합니다."
      templateTabType="writing"
      leftContent={leftPane}
      rightNavigation={rightNav}
      onPreview={handlePreview}
      onSave={handleSave}
    />
  )
}
