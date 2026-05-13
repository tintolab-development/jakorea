import { useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import {
  type HorizontalTableFlavor,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/left-panel/form-editor-field-nav'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel'
import { useHorizontalTableFormDraft } from '@/features/template/ui/form-editor/hooks/use-horizontal-table-form-draft'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/hooks/use-table-row-selection-state'
import '@/features/template/ui/form-set/editors/horizontal-table-form-editor.css'

export type HorizontalTableFormEditorVariant = 'fullpage-modal' | 'embedded'

export interface HorizontalTableFormEditorProps {
  variant: HorizontalTableFormEditorVariant
  /** fullpage-modal 전용: 닫기 시 호출 */
  onClose?: () => void
  /** 미리보기 직전에 호출 — URL에 userPreview push 등 */
  onBeforeUserPreview?: () => void
  /** URL에 userPreview=1일 때(뒤로가기·직접 입력 복원) 모달이 닫혀 있으면 미리보기 오픈 */
  urlUserPreviewActive?: boolean
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
  onBeforeUserPreview,
  urlUserPreviewActive = false,
  initialTableFlavor = 'text',
  initialDraft,
  initialActiveParagraphId,
}: HorizontalTableFormEditorProps) {
  const {
    draft,
    activeParagraphId,
    setActiveParagraphId,
    updateParagraph,
    onReorderMiddle,
    middleParagraphActions,
    onTitleNumberingChange,
    sortableMiddle,
    pinnedBottom,
  } = useHorizontalTableFormDraft({
    initialTableFlavor,
    initialDraft,
    initialActiveParagraphId,
  })
  const {
    horizontalTableRowSelectionsByParagraphId,
    verticalTableBodyRowSelection,
    activeHorizontalTableRowSelection,
    onHorizontalTableRowSelectionChange,
    onVerticalTableBodyRowSelectionChange,
    focusHorizontalTableBodyRow,
    focusVerticalTableBodyRow,
  } = useTableRowSelectionState({
    paragraphs: draft.paragraphs,
    activeParagraphId,
  })
  const { openWritingUserPreview, syncWritingUserPreviewSession, isWritingUserPreviewOpen } =
    useTemplateWritingPreview()

  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)

  const handleSelectParagraph = useCallback(
    (id: string) => {
      setActiveParagraphId(id)
      setSingleItemListActiveItemId(null)
    },
    [setActiveParagraphId]
  )

  const writingPreviewSession = useMemo(
    () => ({
      draft,
      updateParagraph,
      headerTitle: '테이블 가로형',
      editorKind: 'horizontal_table' as const,
    }),
    [draft, updateParagraph]
  )

  useEffect(() => {
    if (!isWritingUserPreviewOpen) return
    syncWritingUserPreviewSession(writingPreviewSession)
  }, [isWritingUserPreviewOpen, syncWritingUserPreviewSession, writingPreviewSession])

  useEffect(() => {
    if (!urlUserPreviewActive) return
    if (isWritingUserPreviewOpen) return
    openWritingUserPreview(writingPreviewSession)
  }, [
    urlUserPreviewActive,
    isWritingUserPreviewOpen,
    openWritingUserPreview,
    writingPreviewSession,
  ])

  const handlePreview = useCallback(() => {
    onBeforeUserPreview?.()
    openWritingUserPreview(writingPreviewSession)
  }, [onBeforeUserPreview, openWritingUserPreview, writingPreviewSession])

  const handleSave = useCallback(() => {
    message.success('저장 API 연동 전입니다.')
  }, [])

  const leftPane = (
    <FormEditorLeftPanel
      paragraphs={draft.paragraphs}
      titleNumbering={draft.formSettings.titleNumbering}
      selectedCardId={activeParagraphId}
      onSelectCard={handleSelectParagraph}
      onReorderMiddle={onReorderMiddle}
      updateParagraph={updateParagraph}
      editorKind="horizontal_table"
      layout="three"
      horizontalTableRowSelectionsByParagraphId={horizontalTableRowSelectionsByParagraphId}
      onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
      verticalTableBodyRowSelection={verticalTableBodyRowSelection}
      onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
      middleParagraphActions={middleParagraphActions}
      singleItemListActiveItemId={singleItemListActiveItemId}
      onSelectSingleItemListItem={(paragraphId, itemId) => {
        setActiveParagraphId(paragraphId)
        setSingleItemListActiveItemId(itemId)
      }}
    />
  )

  const rightNav = (
    <FormEditorFieldNav
      sectionTitle="커스텀 필드"
      sortableMiddle={sortableMiddle}
      pinnedBottom={pinnedBottom}
      selectedItemId={activeParagraphId}
      onSelectItem={handleSelectParagraph}
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
        singleItemListActiveItemId={singleItemListActiveItemId}
        horizontalTableRowSelection={activeHorizontalTableRowSelection}
        onHorizontalTableBodyRowDeleted={focusHorizontalTableBodyRow}
        verticalTableBodyRowSelection={verticalTableBodyRowSelection}
        onVerticalTableBodyRowDeleted={focusVerticalTableBodyRow}
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
