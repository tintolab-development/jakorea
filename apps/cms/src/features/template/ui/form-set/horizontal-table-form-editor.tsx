import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { message } from 'antd'
import { TemplateFullpageModal } from '@/features/template/ui/template-fullpage-modal'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import {
  cloneHorizontalTableParagraph,
  cloneVerticalTableParagraph,
  createDefaultHorizontalTableDraft,
  createHorizontalTableParagraph,
  DEFAULT_HORIZONTAL_TABLE_PARAGRAPH_IDS,
  type FormTitleNumberingStyle,
  type HorizontalTableFlavor,
  type HorizontalTableParagraph,
  type HorizontalTableRowSelection,
  horizontalTableSetFlavor,
  normalizeHorizontalTableParagraph,
  normalizeVerticalTableParagraph,
  paragraphsAreOnlyTableLayoutParagraphs,
  type VerticalTableParagraph,
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

function stripLegacyHorizontalTableSurveyTitle(paragraphs: WritingFormParagraph[]): WritingFormParagraph[] {
  const first = paragraphs[0]
  if (
    first &&
    first.kind === 'description' &&
    first.variant === 'survey_title_with_period' &&
    paragraphs.length >= 3
  ) {
    return paragraphs.slice(1)
  }
  return paragraphs
}

/** 예전 초안 `[…가로형들, 마무리]`를 테이블만 남기도록 정리 */
function stripTrailingClosingAfterHorizontalTablesOnly(paragraphs: WritingFormParagraph[]): WritingFormParagraph[] {
  if (paragraphs.length < 2) return paragraphs
  const last = paragraphs[paragraphs.length - 1]
  if (last?.kind !== 'description' || last.variant !== 'closing') return paragraphs
  const rest = paragraphs.slice(0, -1)
  if (
    rest.every(
      p =>
        p.kind === 'single_item' &&
        (p.variant === 'horizontal_table' || p.variant === 'vertical_table')
    )
  ) {
    return rest
  }
  return paragraphs
}

function normalizeHorizontalTableDraft(d: WritingFormDraft): WritingFormDraft {
  let paragraphs = stripLegacyHorizontalTableSurveyTitle(d.paragraphs)
  paragraphs = stripTrailingClosingAfterHorizontalTablesOnly(paragraphs)
  paragraphs = paragraphs.map(p => {
    if (p.kind === 'single_item' && p.variant === 'horizontal_table') {
      return normalizeHorizontalTableParagraph(p)
    }
    if (p.kind === 'single_item' && p.variant === 'vertical_table') {
      return normalizeVerticalTableParagraph(p)
    }
    return p
  })
  return { ...d, paragraphs }
}

function createInitialHorizontalTableDraft(tableFlavor: HorizontalTableFlavor): WritingFormDraft {
  const base = normalizeHorizontalTableDraft(createDefaultHorizontalTableDraft())
  if (tableFlavor === 'text') {
    return base
  }
  return {
    ...base,
    paragraphs: base.paragraphs.map(p => {
      if (p.id !== DEFAULT_HORIZONTAL_TABLE_PARAGRAPH_IDS.table) return p
      if (p.kind !== 'single_item' || p.variant !== 'horizontal_table') return p
      const withField = horizontalTableSetFlavor(p, 'field')
      return {
        ...withField,
        paragraphTitle: '테이블_가로형 (필드 형)',
      }
    }),
  }
}

export type HorizontalTableFormEditorVariant = 'fullpage-modal' | 'embedded'

export interface HorizontalTableFormEditorProps {
  variant: HorizontalTableFormEditorVariant
  /** fullpage-modal 전용: 닫기 시 호출 */
  onClose?: () => void
  /**
   * 최초 마운트 시 기본 테이블 단락 `tableFlavor`.
   * `initialDraft`가 있으면 이 값은 초기 state 생성에 쓰이지 않음(동일 draft 안에서 여러 가로형 단락을 두는 경우 등).
   */
  initialTableFlavor?: HorizontalTableFlavor
  /**
   * 가로형/마무리 단락을 미리 잡은 초안(예: 양식 테스트에서 텍스트형·필드형 테이블을 한 폼·우측 커스텀 필드만 공유).
   * 지정 시 `createDefaultHorizontalTableDraft` + `initialTableFlavor` 기반 초기화 대신 이 값이 사용됨.
   */
  initialDraft?: WritingFormDraft
  /** `initialDraft` 사용 시 기본 선택 단락. 생략 시 `initialDraft.paragraphs[0]` */
  initialActiveParagraphId?: string
}

/** 텍스트형·필드형(`tableFlavor`)은 단일 컴포넌트; 우측 상단 라디오로도 전환 가능. */
export function HorizontalTableFormEditor({
  variant,
  onClose,
  initialTableFlavor = 'text',
  initialDraft,
  initialActiveParagraphId,
}: HorizontalTableFormEditorProps) {
  const [draft, setDraft] = useState<WritingFormDraft>(() =>
    initialDraft != null
      ? normalizeHorizontalTableDraft(initialDraft)
      : createInitialHorizontalTableDraft(initialTableFlavor)
  )
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(
    () =>
      initialActiveParagraphId ??
      (initialDraft?.paragraphs[0]?.id ?? DEFAULT_HORIZONTAL_TABLE_PARAGRAPH_IDS.table)
  )
  const [horizontalTableRowSelectionsByParagraphId, setHorizontalTableRowSelectionsByParagraphId] =
    useState<Record<string, HorizontalTableRowSelection | null>>({})
  const [verticalTableBodyRowSelection, setVerticalTableBodyRowSelection] = useState<{
    paragraphId: string
    row: number
  } | null>(null)
  const previousActiveParagraphIdRef = useRef<string | null>(activeParagraphId)

  const onHorizontalTableRowSelectionChange = useCallback(
    (paragraphId: string, next: HorizontalTableRowSelection | null) => {
      setHorizontalTableRowSelectionsByParagraphId(prev => {
        if (next == null) {
          if (!(paragraphId in prev)) return prev
          const { [paragraphId]: _, ...rest } = prev
          return rest
        }
        return { [paragraphId]: next }
      })
      if (next != null) {
        setVerticalTableBodyRowSelection(null)
      }
    },
    []
  )

  const onVerticalTableBodyRowSelectionChange = useCallback((paragraphId: string, row: number | null) => {
    setVerticalTableBodyRowSelection(row == null ? null : { paragraphId, row })
    if (row != null) {
      setHorizontalTableRowSelectionsByParagraphId({})
    }
  }, [])

  useEffect(() => {
    const ids = new Set(draft.paragraphs.map(p => p.id))
    setHorizontalTableRowSelectionsByParagraphId(prev => {
      let changed = false
      const next = { ...prev }
      for (const k of Object.keys(next)) {
        if (!ids.has(k)) {
          delete next[k]
          changed = true
        }
      }
      return changed ? next : prev
    })
    setVerticalTableBodyRowSelection(v => (v != null && !ids.has(v.paragraphId) ? null : v))
  }, [draft.paragraphs])

  useEffect(() => {
    const prev = previousActiveParagraphIdRef.current
    previousActiveParagraphIdRef.current = activeParagraphId
    if (prev === activeParagraphId) return
    if (prev != null) {
      setHorizontalTableRowSelectionsByParagraphId(p => {
        if (!(prev in p)) return p
        const { [prev]: _, ...rest } = p
        return rest
      })
    }
    setVerticalTableBodyRowSelection(null)
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
      if (paras.length < 2) return prev
      if (paragraphsAreOnlyTableLayoutParagraphs(paras)) {
        const oldIdx = paras.findIndex(p => p.id === activeId)
        const newIdx = paras.findIndex(p => p.id === overId)
        if (oldIdx === -1 || newIdx === -1) return prev
        const next = [...paras]
        const [removed] = next.splice(oldIdx, 1)
        next.splice(newIdx, 0, removed)
        return { ...prev, paragraphs: next }
      }
      const tail = paras[paras.length - 1]!
      const middle = paras.slice(0, -1)
      const oldIdx = middle.findIndex(p => p.id === activeId)
      const newIdx = middle.findIndex(p => p.id === overId)
      if (oldIdx === -1 || newIdx === -1) return prev
      const nextMiddle = [...middle]
      const [removed] = nextMiddle.splice(oldIdx, 1)
      nextMiddle.splice(newIdx, 0, removed)
      return { ...prev, paragraphs: [...nextMiddle, tail] }
    })
  }, [])

  const onAddMiddleParagraphAfter = useCallback((paragraphId: string) => {
    const newId = crypto.randomUUID()
    setDraft(prev => {
      const idx = prev.paragraphs.findIndex(p => p.id === paragraphId)
      if (idx === -1) return prev
      const anchor = prev.paragraphs[idx]!
      const next = [...prev.paragraphs]
      let p: HorizontalTableParagraph = createHorizontalTableParagraph(newId)
      if (anchor.kind === 'single_item' && anchor.variant === 'horizontal_table') {
        const a = anchor as HorizontalTableParagraph
        if (a.tableFlavor === 'field') {
          p = {
            ...horizontalTableSetFlavor(p, 'field'),
            paragraphTitle: '테이블_가로형 (필드 형)',
          }
        }
      }
      next.splice(idx + 1, 0, p)
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
      if (p.kind !== 'single_item') return prev
      if (p.variant === 'vertical_table') {
        const clone = cloneVerticalTableParagraph(p as VerticalTableParagraph, newId)
        const next = [...prev.paragraphs]
        next.splice(idx + 1, 0, clone)
        return { ...prev, paragraphs: next }
      }
      if (p.variant !== 'horizontal_table') return prev
      const clone = cloneHorizontalTableParagraph(p as HorizontalTableParagraph, newId)
      const next = [...prev.paragraphs]
      next.splice(idx + 1, 0, clone)
      return { ...prev, paragraphs: next }
    })
    setActiveParagraphId(newId)
  }, [])

  const onDeleteMiddleParagraph = useCallback((paragraphId: string) => {
    let nextActiveId: string | null = null
    setDraft(prev => {
      const onlyTables = paragraphsAreOnlyTableLayoutParagraphs(prev.paragraphs)
      const middle = onlyTables ? prev.paragraphs : prev.paragraphs.slice(0, -1)
      if (middle.length <= 1) {
        message.warning('테이블 단락은 최소 1개 이상 유지해야 합니다.')
        return prev
      }
      if (!middle.some(p => p.id === paragraphId)) {
        message.warning('마무리 단락은 삭제할 수 없습니다.')
        return prev
      }
      const idx = prev.paragraphs.findIndex(p => p.id === paragraphId)
      const nextParagraphs = prev.paragraphs.filter(p => p.id !== paragraphId)
      nextActiveId = idx > 0 ? prev.paragraphs[idx - 1]!.id : nextParagraphs[0]!.id
      return { ...prev, paragraphs: nextParagraphs }
    })
    if (nextActiveId != null) {
      setActiveParagraphId(nextActiveId)
    }
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

  const { sortableMiddle, pinnedBottom } = useMemo(() => {
    const ps = draft.paragraphs
    const { titleNumbering } = draft.formSettings
    const line = (p: WritingFormParagraph) => ({
      id: p.id,
      displayLine: getFormNavDisplayLine(draft.paragraphs, p, titleNumbering),
    })
    if (paragraphsAreOnlyTableLayoutParagraphs(ps)) {
      return {
        sortableMiddle: ps.map(line),
        pinnedBottom: null as { id: string; displayLine: string } | null,
      }
    }
    if (ps.length < 2) {
      return {
        sortableMiddle: [] as { id: string; displayLine: string }[],
        pinnedBottom: null as { id: string; displayLine: string } | null,
      }
    }
    const tail = ps[ps.length - 1]!
    const tableBlocks = ps.slice(0, -1)
    return {
      sortableMiddle: tableBlocks.map(line),
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
      horizontalTableRowSelectionsByParagraphId={horizontalTableRowSelectionsByParagraphId}
      onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
      verticalTableBodyRowSelection={verticalTableBodyRowSelection}
      onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
      middleParagraphActions={middleParagraphActions}
    />
  )

  const rightNav = (
    <FormEditorFieldNav
      sectionTitle="커스텀 필드"
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
        horizontalTableRowSelection={
          activeParagraphId != null
            ? (horizontalTableRowSelectionsByParagraphId[activeParagraphId] ?? null)
            : null
        }
        onHorizontalTableBodyRowDeleted={nextRowIndex => {
          if (activeParagraphId == null) return
          setHorizontalTableRowSelectionsByParagraphId(prev => ({
            ...prev,
            [activeParagraphId]: { area: 'body', row: nextRowIndex },
          }))
        }}
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
