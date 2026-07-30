import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import { TEMPLATE_USER_PREVIEW_ACTIVE } from '@/features/template/lib/template-user-preview-url'
import {
  createDefaultDirectAgreementDraft,
  DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS,
  getWritingFormHeadMiddlePinnedTail,
  isAgreementLockedSystemParagraph,
  normalizeWritingFormDraft,
  reorderWritingFormMiddleParagraphs,
  type FormTitleNumberingStyle,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { useWritingFormMiddleParagraphActions } from '@/features/template/hooks/use-writing-form-middle-paragraph-actions'
import { useFormTemplateSaveFeedback } from '@/features/template/lib/form-template-save-feedback'
import {
  loadWritingFormTemplateDraft,
  persistWritingFormTemplateDraft,
} from '@/features/template/lib/writing-form-template-local-save'
import { overlayPaymentStatementPreConsentSeedHorizontalTables } from '@/features/template/model/payment-statement-pre-consent-draft'
import { ensureAgreementNoticeConfirmationClosing } from '@/features/template/model/writing-form-draft.schema'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/left-panel/form-editor-field-nav'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/hooks/use-table-row-selection-state'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel'

import {
  type FormDocumentPreviewParagraphGapResolver,
  type FormDocumentPreviewRenderMode,
} from '@/features/template/lib/a4-document-preview'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

type NewAgreementFormQuery = {
  mode?: string
  type?: string
  id?: string
}

export type AgreementWritingFormShellProps = {
  /** 초안 — 매 렌더 새 객체를 넘기지 말고 팩토리 또는 메모된 값 사용 권장 */
  initialDraft: WritingFormDraft | (() => WritingFormDraft)
  /** 최초 선택 단락 id — 생략 시 초안의 첫 단락 id */
  defaultActiveParagraphId?: string | null
  modalTitle: ReactNode
  modalDescription?: ReactNode
  onClose: () => void
  /** 미리보기 컨텍스트 헤더 — 생략 시 `동의 양식` */
  writingPreviewHeaderTitle?: string
  /** 고정 템플릿 단락 — 표 구조·드래그·본문 편집 잠금 등 */
  structureLockedParagraphIds?: ReadonlySet<string>
  /** 제목형 등 — 드래그 핸들 비노출 */
  hideDragHandleForParagraphIds?: ReadonlySet<string>
  /** A4 미리보기 레이아웃 사용 여부 */
  previewLayout?: 'default' | 'a4-document'
  /** A4 미리보기 시 숨길 단락 id */
  a4HiddenParagraphIds?: ReadonlySet<string>
  /** A4 미리보기 렌더링 모드 */
  a4RenderMode?: FormDocumentPreviewRenderMode
  /** A4 미리보기 단락 간격 */
  a4ParagraphGapPx?: number | FormDocumentPreviewParagraphGapResolver
  /** 단락 본문 옵션 */
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
  /** forms-surveys draft API 연동 대상 templateCode */
  templateCode?: string
  /** 템플릿 관리 저장 확인 후 (편집 모달 닫기·목록 복귀) */
  onTemplateDraftSaveConfirmed?: () => void
}

type AgreementShellUrlQuery = {
  userPreview?: string
}

export function AgreementWritingFormShell({
  initialDraft,
  defaultActiveParagraphId,
  modalTitle,
  modalDescription = '* 등록 시 최소 1개의 단락은 존재해야 하며, 동의 양식은 화면 전반에 동일한 구조로 노출될 수 있습니다.',
  onClose,
  writingPreviewHeaderTitle = '동의 양식',
  structureLockedParagraphIds,
  hideDragHandleForParagraphIds,
  previewLayout = 'default',
  a4HiddenParagraphIds,
  a4RenderMode,
  a4ParagraphGapPx,
  paragraphBodyOptions,
  templateCode,
  onTemplateDraftSaveConfirmed,
}: AgreementWritingFormShellProps) {
  const { showSaveSuccess, showSaveFailure } = useFormTemplateSaveFeedback()
  const isTemplateManagementSave = onTemplateDraftSaveConfirmed != null

  const resolveInitialDraft = useCallback((): WritingFormDraft => {
    const raw = typeof initialDraft === 'function' ? initialDraft() : initialDraft
    return normalizeWritingFormDraft(raw)
  }, [initialDraft])

  const [draft, setDraft] = useState<WritingFormDraft>(() => resolveInitialDraft())
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(() => {
    if (defaultActiveParagraphId != null) return defaultActiveParagraphId
    return resolveInitialDraft().paragraphs[0]?.id ?? null
  })
  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)
  const {
    openWritingUserPreview,
    syncWritingUserPreviewSession,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()
  const { params: shellUrlParams, setParams } = useQueryParams<AgreementShellUrlQuery>()
  const openedUserPreviewFromUrlRef = useRef(false)

  const updateParagraph = useCallback(
    (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => {
      setDraft(prev => ({
        ...prev,
        paragraphs: prev.paragraphs.map(p => (p.id === id ? updater(p) : p)),
      }))
    },
    []
  )

  useEffect(() => {
    const applyDraft = (nextDraft: WritingFormDraft) => {
      let normalized = normalizeWritingFormDraft(nextDraft)
      // 지급조서 사전 동의서: 구 저장본 1행 표 → 최신 시드(p3 2행 등) overlay
      if (
        templateCode === 'agreement-third-party' ||
        templateCode === 'document-payment-order-pre-consent'
      ) {
        normalized = overlayPaymentStatementPreConsentSeedHorizontalTables(normalized)
      }
      if (templateCode === 'agreement-notice') {
        normalized = ensureAgreementNoticeConfirmationClosing(normalized)
      }
      setDraft(normalized)
      setActiveParagraphId(defaultActiveParagraphId ?? normalized.paragraphs[0]?.id ?? null)
      setSingleItemListActiveItemId(null)
    }

    if (templateCode != null && templateCode !== '') {
      let cancelled = false
      void loadWritingFormTemplateDraft(templateCode).then(saved => {
        if (cancelled) return
        if (saved?.draft) {
          applyDraft(saved.draft)
          return
        }
        applyDraft(resolveInitialDraft())
      })
      return () => {
        cancelled = true
      }
    }

    applyDraft(resolveInitialDraft())
  }, [defaultActiveParagraphId, resolveInitialDraft, templateCode])

  const onReorderMiddle = useCallback((activeId: string, overId: string) => {
    setDraft(prev => ({
      ...prev,
      paragraphs: reorderWritingFormMiddleParagraphs(prev.paragraphs, activeId, overId),
    }))
  }, [])

  const onTitleNumberingChange = useCallback((style: FormTitleNumberingStyle) => {
    setDraft(prev => ({
      ...prev,
      formSettings: { ...prev.formSettings, titleNumbering: style },
    }))
  }, [])

  const { pinnedTop, sortableMiddle, pinnedBottom } = useMemo(() => {
    const split = getWritingFormHeadMiddlePinnedTail(draft.paragraphs)
    const { titleNumbering } = draft.formSettings
    const line = (p: WritingFormParagraph) => ({
      id: p.id,
      displayLine: getFormNavDisplayLine(draft.paragraphs, p, titleNumbering),
    })
    if (split == null) {
      return {
        pinnedTop: null,
        sortableMiddle: [],
        pinnedBottom: [] as Array<{ id: string; displayLine: string }>,
      }
    }
    const { head, middle, pinnedTail } = split
    const pinnedBottomCards = pinnedTail.filter(p => !isAgreementLockedSystemParagraph(p))
    return {
      pinnedTop: line(head),
      sortableMiddle: middle.map(line),
      pinnedBottom: pinnedBottomCards.map(line),
    }
  }, [draft])

  const writingPreviewSession = useMemo(
    () => ({
      draft,
      updateParagraph,
      headerTitle: writingPreviewHeaderTitle,
      editorKind: 'agreement' as const,
      previewLayout,
      a4HiddenParagraphIds,
      a4RenderMode,
      a4ParagraphGapPx,
      paragraphBodyOptions,
      hideParagraphRequiredChrome: previewLayout === 'a4-document',
      focusedParagraphId: activeParagraphId,
    }),
    [
      draft,
      updateParagraph,
      writingPreviewHeaderTitle,
      previewLayout,
      a4HiddenParagraphIds,
      a4RenderMode,
      a4ParagraphGapPx,
      paragraphBodyOptions,
      activeParagraphId,
    ]
  )

  useEffect(() => {
    if (shellUrlParams.userPreview !== TEMPLATE_USER_PREVIEW_ACTIVE) {
      openedUserPreviewFromUrlRef.current = false
    }
  }, [shellUrlParams.userPreview])

  useLayoutEffect(() => {
    if (shellUrlParams.userPreview !== TEMPLATE_USER_PREVIEW_ACTIVE) return
    if (openedUserPreviewFromUrlRef.current) return
    openedUserPreviewFromUrlRef.current = true
    openWritingUserPreview(writingPreviewSession)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- URL 진입 시 초기 세션으로 사용자 미리보기를 한 번만 연다
  }, [shellUrlParams.userPreview, openWritingUserPreview])

  useEffect(() => {
    if (!isWritingUserPreviewOpen) return
    syncWritingUserPreviewSession(writingPreviewSession)
  }, [isWritingUserPreviewOpen, syncWritingUserPreviewSession, writingPreviewSession])

  useEffect(() => {
    return () => {
      closeWritingUserPreview()
    }
  }, [closeWritingUserPreview])

  const handlePreview = useCallback(() => {
    setParams({ userPreview: TEMPLATE_USER_PREVIEW_ACTIVE }, { replace: false })
    openedUserPreviewFromUrlRef.current = true
    openWritingUserPreview(writingPreviewSession)
  }, [setParams, openWritingUserPreview, writingPreviewSession])

  const handleSave = useCallback(() => {
    if (templateCode == null || templateCode === '') return
    void (async () => {
      try {
        await persistWritingFormTemplateDraft({
          templateId: templateCode,
          draft,
        })
        if (isTemplateManagementSave) {
          showSaveSuccess(onTemplateDraftSaveConfirmed)
        }
      } catch (error) {
        console.debug('agreementWritingFormShell save failed', error)
        if (isTemplateManagementSave) {
          showSaveFailure()
        }
      }
    })()
  }, [
    draft,
    isTemplateManagementSave,
    onTemplateDraftSaveConfirmed,
    showSaveFailure,
    showSaveSuccess,
    templateCode,
  ])

  const handleSelectParagraph = useCallback((id: string) => {
    setActiveParagraphId(id)
    setSingleItemListActiveItemId(null)
  }, [])

  const middleParagraphActions = useWritingFormMiddleParagraphActions(
    setDraft,
    setActiveParagraphId
  )
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

  return (
    <TemplateFullpageModal
      open
      onClose={onClose}
      title={modalTitle}
      description={modalDescription}
      templateTabType="writing"
      leftContent={
        <FormEditorLeftPanel
          paragraphs={draft.paragraphs}
          titleNumbering={draft.formSettings.titleNumbering}
          selectedCardId={activeParagraphId}
          onSelectCard={handleSelectParagraph}
          onReorderMiddle={onReorderMiddle}
          updateParagraph={updateParagraph}
          editorKind="agreement"
          singleItemListActiveItemId={singleItemListActiveItemId}
          onSelectSingleItemListItem={(paragraphId, itemId) => {
            setActiveParagraphId(paragraphId)
            setSingleItemListActiveItemId(itemId)
          }}
          horizontalTableRowSelectionsByParagraphId={horizontalTableRowSelectionsByParagraphId}
          onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
          verticalTableBodyRowSelection={verticalTableBodyRowSelection}
          onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
          middleParagraphActions={middleParagraphActions}
          structureLockedParagraphIds={structureLockedParagraphIds}
          hideDragHandleForParagraphIds={hideDragHandleForParagraphIds}
          paragraphBodyOptions={paragraphBodyOptions}
        />
      }
      rightNavigation={
        <FormEditorFieldNav
          sectionTitle="커스텀 필드"
          pinnedTop={pinnedTop}
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
            editorKind="agreement"
            showTitleNumbering={false}
            singleItemListActiveItemId={singleItemListActiveItemId}
            horizontalTableRowSelection={activeHorizontalTableRowSelection}
            onHorizontalTableBodyRowDeleted={focusHorizontalTableBodyRow}
            verticalTableBodyRowSelection={verticalTableBodyRowSelection}
            onVerticalTableBodyRowDeleted={focusVerticalTableBodyRow}
            structureLockedParagraphIds={structureLockedParagraphIds}
          />
        </FormEditorFieldNav>
      }
      onPreview={handlePreview}
      onSave={handleSave}
    />
  )
}

export default function NewAgreementForm() {
  const { setParams } = useQueryParams<NewAgreementFormQuery>()
  const handleClose = useCallback(() => {
    setParams({ mode: undefined, type: undefined, id: undefined })
  }, [setParams])

  return (
    <AgreementWritingFormShell
      initialDraft={createDefaultDirectAgreementDraft}
      defaultActiveParagraphId={DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.title}
      modalTitle="동의 양식"
      onClose={handleClose}
    />
  )
}
