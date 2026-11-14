import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { formTemplateQueryKeys } from '@/features/template/api/form-template-query-keys'
import {
  createWritingFormTemplateRemote,
  shouldUseFormsSurveysRemoteApi,
} from '@/features/template/api/admin-form-templates-service'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import './new-agreement-form.css'
import '@/features/template/ui/form-set/payment-statement-pre-consent/template-management-sheet.css'
import {
  buildTemplateManagementNavLine,
  resolveNavTitleNumberingStyle,
} from '@/features/template/lib/form-title-numbering'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import { isAgreementAdminProxyConfirmHostId } from '@/features/template/lib/agreement-admin-proxy-confirm-paragraphs'
import { resolveEducatorPledgeNavLabel } from '@/features/template/ui/form-set/agreement-expense/nav-labels'
import { titleWithPeriodPlaceholder } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel-heading'
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
import { isWritingFormTemplateStructureLocked } from '@/features/template/lib/form-template-delete-policy'
import { allocateUniqueWritingTemplateName } from '@/features/template/lib/allocate-unique-writing-template-name'
import {
  AGREEMENT_TEMPLATE_SAVE_SUCCESS_COPY,
  useFormTemplateSaveFeedback,
} from '@/features/template/lib/form-template-save-feedback'
import { useWritingFormMiddleParagraphActions } from '@/features/template/hooks/use-writing-form-middle-paragraph-actions'
import { useWritingFormSections } from '@/features/template/hooks/use-writing-form-sections'
import { useFormTemplateModalTitle } from '@/features/template/hooks/use-form-template-modal-title'
import { getWritingTemplateRowsByCategory } from '@/features/template/lib/writing-template-create-helpers'
import {
  loadWritingFormTemplateDraft,
  persistWritingFormTemplateDraft,
} from '@/features/template/lib/writing-form-template-local-save'
import { overlayPaymentStatementPreConsentSeedHorizontalTables } from '@/features/template/model/payment-statement-pre-consent-draft'
import { overlayReceiptPreConsentSeedHorizontalTables } from '@/features/template/model/receipt-pre-consent-draft'
import {
  ensureAgreementNoticeConfirmationClosing,
  ensureAgreementNoticeInstitutionPurposeParagraphs,
  ensureEducatorFacilitatorPledgeIntroParagraph,
  fillAgreementNoticeWriteDefaults,
  overlayAgreementNoticeSeedHorizontalTable,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/left-panel/form-editor-field-nav'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/hooks/use-table-row-selection-state'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel'
import { DIRECT_AGREEMENT_PARAGRAPH_BODY_OPTIONS } from '@/features/template/ui/form-set/agreement-direct/paragraph-config'
import { DIRECT_AGREEMENT_MODAL_DESCRIPTION } from '@/features/template/model/template-registry/template-registry'
import { useAgreementDocumentPdf } from '@/features/template/ui/form-set/editors/agreement-document-pdf'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'

import {
  type FormDocumentPreviewParagraphGapResolver,
  type FormDocumentPreviewRenderMode,
} from '@/features/template/lib/a4-document-preview'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

type NewAgreementFormQuery = {
  mode?: string
  type?: string
  id?: string
  userTemplate?: string
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
  /**
   * 템플릿 관리(`stripAgreementWritingFormStructureLocks`)에서 본문 잠금이 풀린 카탈로그 원본에도
   * 구조 조작(단락 추가·복제·삭제·이동, 표 행/열 추가·삭제, 유형 변경)만 막을 단락 id.
   * 본문·제목 문구 편집은 유지한다. 사용자 복제·신규(`isStructureLocked=false`)에는 적용하지 않는다.
   */
  authoringStructureControlLockedParagraphIds?: ReadonlySet<string>
  /** A4 미리보기 레이아웃 사용 여부 */
  previewLayout?: 'default' | 'a4-document'
  /** A4 미리보기 시 숨길 단락 id */
  a4HiddenParagraphIds?: ReadonlySet<string>
  /** A4 미리보기 — 해당 단락 앞에서 페이지 분절 */
  a4PageBreakBeforeParagraphIds?: ReadonlySet<string>
  /** A4 미리보기 렌더링 모드 */
  a4RenderMode?: FormDocumentPreviewRenderMode
  /** A4 미리보기 단락 간격 */
  a4ParagraphGapPx?: number | FormDocumentPreviewParagraphGapResolver
  /** 단락 본문 옵션 */
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
  /**
   * 우측 「커스텀 필드」 목록에서 뺄 단락 id. 생략 시 `paragraphBodyOptions.hiddenParagraphIds`.
   * 템플릿 관리 지급조서·영수증 사전 동의서는 캔버스에 날짜·서명·귀하 카드를 보이되 목록에서는 뺀다(시안 5767:42072·16046:109928).
   */
  navHiddenParagraphIds?: ReadonlySet<string>
  /**
   * 템플릿 편집·A4 미리보기 하단 귀하·작성완료.
   * 시안에 없으면 `showRecipient: false`, 작성완료는 항상 false(회원 fill만 버튼).
   */
  agreementClosingFooter?: {
    showSubmitButton?: boolean
    showRecipient?: boolean
  }
  /** forms-surveys draft API 연동 대상 templateCode */
  templateCode?: string
  /**
   * templateCode가 없을 때 저장 버튼에서 원격/로컬 템플릿을 최초 생성한다.
   * (템플릿 관리 > 동의 양식 신규 — 등록 시점이 아닌 저장 시점 create)
   */
  enableCreateOnSave?: boolean
  /** 목록 API systemTemplate — 사용자 복제본(false)은 편집 허용 */
  systemTemplate?: boolean
  /** 신규 등록 직후 — catalog code여도 편집 허용 */
  forceUserEditable?: boolean
  /** 템플릿 관리 저장 확인 후 (편집 모달 닫기·목록 복귀) */
  onTemplateDraftSaveConfirmed?: () => void
  /** enableCreateOnSave로 최초 생성 직후 — URL을 edit 모드로 전환할 때 사용 */
  onTemplateCreated?: (templateId: string) => void
  showDeleteButton?: boolean
  onDelete?: () => void
  deleteLoading?: boolean
}

type AgreementShellUrlQuery = {
  userPreview?: string
}

const DEFAULT_NEW_AGREEMENT_TEMPLATE_NAME = '동의 양식 신규 폼'

function resolveAgreementTemplateName(draft: WritingFormDraft): string {
  const titleParagraph = draft.paragraphs.find(
    p => p.id === DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.title
  )
  if (
    titleParagraph?.kind === 'description' &&
    titleParagraph.variant === 'survey_title_with_period'
  ) {
    const name = titleParagraph.surveyTitle?.trim()
    if (name != null && name !== '') return name
  }
  return DEFAULT_NEW_AGREEMENT_TEMPLATE_NAME
}

/** 제목형(문서 제목) 단락이 있고 제목이 비었는지 — 템플릿 관리 저장 차단용 */
function isAgreementDraftTitleMissing(draft: WritingFormDraft): boolean {
  const titleParagraph = draft.paragraphs.find(
    p => p.kind === 'description' && p.variant === 'survey_title_with_period'
  )
  if (titleParagraph == null || titleParagraph.requiredMark !== true) return false
  if (titleParagraph.kind !== 'description' || titleParagraph.variant !== 'survey_title_with_period')
    return false
  return (titleParagraph.surveyTitle ?? '').trim() === ''
}

/** 구조 잠금 해제 시에도 마무리+날짜+서명 확인 카드 옵션 유지 */
const EMPTY_PARAGRAPH_ID_SET: ReadonlySet<string> = new Set<string>()

function tableShape(p: WritingFormParagraph): string | null {
  if (p.kind !== 'single_item') return null
  if (p.variant === 'horizontal_table' || p.variant === 'vertical_table') {
    const t = p as unknown as {
      columnHeaders?: unknown[]
      rowHeaders?: unknown[]
      dataRows?: unknown[][]
      fieldDataRows?: unknown[][]
      rows?: unknown[]
    }
    const rows = (r?: unknown[][]) => (r == null ? '-' : r.map(x => x?.length ?? 0).join(','))
    return [
      t.columnHeaders?.length ?? '-',
      t.rowHeaders?.length ?? '-',
      rows(t.dataRows),
      rows(t.fieldDataRows),
      t.rows?.length ?? '-',
    ].join('|')
  }
  return null
}

/** 구조 조작 판정 — 단락 종류·표 행/열 수 변화. 문구(값) 변화는 허용 */
export function changesParagraphStructure(
  prev: WritingFormParagraph,
  next: WritingFormParagraph
): boolean {
  if (prev.id !== next.id || prev.kind !== next.kind || prev.variant !== next.variant) return true
  return tableShape(prev) !== tableShape(next)
}

function preserveUnlockedAgreementConfirmBodyOptions(
  options: RenderFormParagraphBodyOptions | undefined
): RenderFormParagraphBodyOptions | undefined {
  if (options == null) return undefined
  if (
    options.agreementAdminProxyConfirm !== true &&
    options.paymentPreConsentSheetLayout !== true &&
    (options.hiddenParagraphIds == null || options.hiddenParagraphIds.size === 0)
  ) {
    return undefined
  }
  return {
    agreementAdminProxyConfirm: options.agreementAdminProxyConfirm,
    paymentPreConsentSheetLayout: options.paymentPreConsentSheetLayout,
    hiddenParagraphIds: options.hiddenParagraphIds,
    agreementSystemParticipantName: options.agreementSystemParticipantName,
    agreementSystemNow: options.agreementSystemNow,
    agreementSystemDisplayMode: options.agreementSystemDisplayMode,
  }
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
  authoringStructureControlLockedParagraphIds,
  previewLayout = 'default',
  a4HiddenParagraphIds,
  a4PageBreakBeforeParagraphIds,
  a4RenderMode,
  a4ParagraphGapPx,
  paragraphBodyOptions,
  navHiddenParagraphIds: navHiddenParagraphIdsProp,
  agreementClosingFooter,
  templateCode,
  enableCreateOnSave = false,
  systemTemplate,
  forceUserEditable = false,
  onTemplateDraftSaveConfirmed,
  onTemplateCreated,
  showDeleteButton = false,
  onDelete,
  deleteLoading = false,
}: AgreementWritingFormShellProps) {
  const queryClient = useQueryClient()
  const { sections } = useWritingFormSections()
  const { showSaveSuccess, showSaveFailure } = useFormTemplateSaveFeedback()
  const { showAlert } = useCmsAlert()
  const isTemplateManagementSave = onTemplateDraftSaveConfirmed != null || enableCreateOnSave
  const [persistedTemplateCode, setPersistedTemplateCode] = useState<string | null>(
    templateCode != null && templateCode !== '' ? templateCode : null
  )
  const modalTitleText = typeof modalTitle === 'string' ? modalTitle : ''
  const { displayName: editableModalTitle, commitTitle: commitModalTitle } =
    useFormTemplateModalTitle({
      templateCode: persistedTemplateCode ?? templateCode,
      initialName: modalTitleText || '동의 양식',
    })
  const isStructureLocked = isWritingFormTemplateStructureLocked({
    templateCode: persistedTemplateCode ?? templateCode,
    systemTemplate,
    forceUserEditable: forceUserEditable || enableCreateOnSave,
  })
  /** 사용자 복제·신규 — 시드 잠금 props가 남아 있어도 편집 허용 */
  const effectiveStructureLockedParagraphIds = isStructureLocked
    ? structureLockedParagraphIds
    : undefined
  const effectiveHideDragHandleForParagraphIds = isStructureLocked
    ? hideDragHandleForParagraphIds
    : undefined
  /** 사용자 복제·신규 — 시드 잠금 props는 제거하되 확인 카드 옵션은 유지 */
  const effectiveParagraphBodyOptions = isStructureLocked
    ? paragraphBodyOptions
    : preserveUnlockedAgreementConfirmBodyOptions(paragraphBodyOptions)
  /** 구조 조작 전용 잠금 — 본문 잠금(`structureLockedParagraphIds`)이 없을 때만 */
  const structureControlLockedParagraphIds =
    isStructureLocked &&
    effectiveStructureLockedParagraphIds == null &&
    authoringStructureControlLockedParagraphIds != null &&
    authoringStructureControlLockedParagraphIds.size > 0
      ? authoringStructureControlLockedParagraphIds
      : undefined
  /** 좌측 카드 액션·표 행열·우측 유형 선택은 잠그고, 본문 렌더는 빈 잠금 집합으로 기존 편집 유지 */
  const leftPanelStructureLockedParagraphIds =
    effectiveStructureLockedParagraphIds ?? structureControlLockedParagraphIds
  const leftPanelParagraphBodyOptions = useMemo<RenderFormParagraphBodyOptions | undefined>(() => {
    const base =
      structureControlLockedParagraphIds == null
        ? effectiveParagraphBodyOptions
        : {
            ...effectiveParagraphBodyOptions,
            structureLockedParagraphIds: EMPTY_PARAGRAPH_ID_SET,
            structureLockedAuthoringOperationalFill: true,
          }
    // 템플릿 관리 동의 양식(시스템 초상권·지급조서·영수증 등 + 직접 등록·사용자 복제) — 하단 동의 라디오는 미선택 표시
    // (시드·저장 `bottomConsent: 'agree'`와 무관). 사용자 결정 2026-11-13: 시안에 선택돼 있어도 템플릿 관리 라디오는 모두 미선택.
    if (!isTemplateManagementSave) return base
    return { ...base, templateAuthoringConsentChoiceUnselected: true }
  }, [effectiveParagraphBodyOptions, structureControlLockedParagraphIds, isTemplateManagementSave])
  const leftPanelHideDragHandleForParagraphIds = useMemo<ReadonlySet<string> | undefined>(() => {
    if (structureControlLockedParagraphIds == null) return effectiveHideDragHandleForParagraphIds
    return new Set([
      ...(effectiveHideDragHandleForParagraphIds ?? []),
      ...structureControlLockedParagraphIds,
    ])
  }, [effectiveHideDragHandleForParagraphIds, structureControlLockedParagraphIds])

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
  const middleParagraphActions = useWritingFormMiddleParagraphActions(
    setDraft,
    setActiveParagraphId
  )
  const {
    openWritingUserPreview,
    syncWritingUserPreviewSession,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()
  const { params: shellUrlParams, setParams } = useQueryParams<AgreementShellUrlQuery>()
  const openedUserPreviewFromUrlRef = useRef(false)

  useEffect(() => {
    if (templateCode != null && templateCode !== '') {
      setPersistedTemplateCode(templateCode)
    }
  }, [templateCode])

  const updateParagraph = useCallback(
    (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => {
      setDraft(prev => ({
        ...prev,
        paragraphs: prev.paragraphs.map(p => {
          if (p.id !== id) return p
          const next = updater(p)
          if (
            structureControlLockedParagraphIds?.has(id) === true &&
            changesParagraphStructure(p, next)
          ) {
            return p
          }
          return next
        }),
      }))
    },
    [structureControlLockedParagraphIds]
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
      if (templateCode === 'agreement-receipt-pre-consent') {
        normalized = overlayReceiptPreConsentSeedHorizontalTables(normalized)
      }
      if (templateCode === 'agreement-notice') {
        normalized = ensureAgreementNoticeConfirmationClosing(normalized)
        normalized = ensureAgreementNoticeInstitutionPurposeParagraphs(normalized)
        normalized = overlayAgreementNoticeSeedHorizontalTable(normalized)
        // 편집 화면(C09): 빈 문구·누락 안내 단락만 시안 값으로 보강 — 저장 전까지 서버 원본 불변
        normalized = fillAgreementNoticeWriteDefaults(normalized)
      }
      if (templateCode === 'agreement-expense') {
        normalized = ensureEducatorFacilitatorPledgeIntroParagraph(normalized)
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

  const onReorderMiddle = useCallback(
    (activeId: string, overId: string) => {
      if (
        structureControlLockedParagraphIds?.has(activeId) === true ||
        structureControlLockedParagraphIds?.has(overId) === true
      ) {
        return
      }
      setDraft(prev => ({
        ...prev,
        paragraphs: reorderWritingFormMiddleParagraphs(prev.paragraphs, activeId, overId),
      }))
    },
    [structureControlLockedParagraphIds]
  )

  const onTitleNumberingChange = useCallback((style: FormTitleNumberingStyle) => {
    setDraft(prev => ({
      ...prev,
      formSettings: { ...prev.formSettings, titleNumbering: style },
    }))
  }, [])

  /** 좌측 캔버스에서 숨긴 단락(대리 확인 카드에 합친 날짜·서명, 「JA KOREA 귀하」 등)은 우측 목록에서도 뺀다 — 시안 5767:42072·16046:109928 */
  const navHiddenParagraphIds =
    navHiddenParagraphIdsProp ?? effectiveParagraphBodyOptions?.hiddenParagraphIds
  /** 템플릿 관리 화면에서 「미선택」이어도 우측 목록만 `1. 2. 3.` 번호 */
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const { pinnedTop, sortableMiddle, pinnedBottom } = useMemo(() => {
    const split = getWritingFormHeadMiddlePinnedTail(draft.paragraphs)
    const titleNumbering = resolveNavTitleNumberingStyle(
      draft.formSettings.titleNumbering,
      isTemplateManagementScreen
    )
    const isNavVisible = (p: WritingFormParagraph) => !(navHiddenParagraphIds?.has(p.id) ?? false)
    // 빈 제목 단락은 좌측 카드와 같은 안내 문구(시안: 「동의서 제목 입력」)·회색, 구조 잠금 단락은 핸들 없음
    const line = (p: WritingFormParagraph) =>
      buildTemplateManagementNavLine(draft.paragraphs, p, titleNumbering, {
        titlePlaceholder: titleWithPeriodPlaceholder('agreement'),
        // 시안 5767:49321 직접 등록 마무리글만 회색(서약서 등 시스템 동의서 마무리글은 본문색)
        closingPlaceholder: p.id === DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.closing,
        proxyConfirmHost: isAgreementAdminProxyConfirmHostId(p.id),
        pinnedIds: leftPanelHideDragHandleForParagraphIds,
        // 시안 12956:1678 — 교육진행자 서약서 목록 전용 문구(카드 제목·저장값은 그대로)
        navLabel: isTemplateManagementScreen ? resolveEducatorPledgeNavLabel : undefined,
      })
    if (split == null) {
      return {
        pinnedTop: null,
        sortableMiddle: [],
        pinnedBottom: [] as Array<{ id: string; displayLine: string }>,
      }
    }
    const { head, middle, pinnedTail } = split
    const pinnedBottomCards = pinnedTail.filter(
      p => !isAgreementLockedSystemParagraph(p) && isNavVisible(p)
    )
    return {
      pinnedTop: line(head),
      sortableMiddle: middle.filter(isNavVisible).map(line),
      pinnedBottom: pinnedBottomCards.map(line),
    }
  }, [
    draft,
    navHiddenParagraphIds,
    leftPanelHideDragHandleForParagraphIds,
    isTemplateManagementScreen,
  ])

  const writingPreviewSession = useMemo(
    () => ({
      draft,
      updateParagraph,
      headerTitle: writingPreviewHeaderTitle,
      editorKind: 'agreement' as const,
      previewLayout,
      a4HiddenParagraphIds,
      a4PageBreakBeforeParagraphIds,
      a4RenderMode,
      a4ParagraphGapPx,
      paragraphBodyOptions: effectiveParagraphBodyOptions,
      agreementClosingFooter,
      /** 사용자 모드(미리보기·응답 입력)에서도 필수(*) 표시 */
      hideParagraphRequiredChrome: false,
      focusedParagraphId: activeParagraphId,
    }),
    [
      draft,
      updateParagraph,
      writingPreviewHeaderTitle,
      previewLayout,
      a4HiddenParagraphIds,
      a4PageBreakBeforeParagraphIds,
      a4RenderMode,
      a4ParagraphGapPx,
      effectiveParagraphBodyOptions,
      agreementClosingFooter,
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
    // 필수 제목(제목형 단락) 미입력 시 공통 필수 안내 후 저장하지 않음 (QA 261113 #34)
    if (isTemplateManagementSave && isAgreementDraftTitleMissing(draft)) {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }
    void (async () => {
      try {
        let nextTemplateCode = persistedTemplateCode
        if ((nextTemplateCode == null || nextTemplateCode === '') && enableCreateOnSave) {
          const existingNames = getWritingTemplateRowsByCategory('agreement', sections).map(
            row => row.templateName
          )
          const templateName = allocateUniqueWritingTemplateName(
            resolveAgreementTemplateName(draft),
            existingNames
          )
          if (shouldUseFormsSurveysRemoteApi()) {
            nextTemplateCode = await createWritingFormTemplateRemote({
              target: 'agreement',
              templateName,
            })
          } else {
            nextTemplateCode = `agreement-custom-${crypto.randomUUID()}`
          }
          setPersistedTemplateCode(nextTemplateCode)
        }

        if (nextTemplateCode == null || nextTemplateCode === '') return

        await persistWritingFormTemplateDraft({
          templateId: nextTemplateCode,
          draft,
          publishAfterSave: isTemplateManagementSave,
        })

        // 저장 후 목록 최근 수정일 갱신 — 신규 생성뿐 아니라 기존 양식 저장도 목록 재조회 (QA 261113 #35)
        if (isTemplateManagementSave) {
          await queryClient.invalidateQueries({
            queryKey: formTemplateQueryKeys.writingSections(),
          })
        }

        if (isTemplateManagementSave) {
          showSaveSuccess(() => {
            if (enableCreateOnSave) {
              onTemplateCreated?.(nextTemplateCode)
            }
            onTemplateDraftSaveConfirmed?.()
          }, AGREEMENT_TEMPLATE_SAVE_SUCCESS_COPY)
        }
      } catch (error) {
        console.debug('agreementWritingFormShell save failed', error)
        if (isTemplateManagementSave) {
          showSaveFailure(error)
        }
      }
    })()
  }, [
    draft,
    enableCreateOnSave,
    isTemplateManagementSave,
    onTemplateCreated,
    onTemplateDraftSaveConfirmed,
    persistedTemplateCode,
    queryClient,
    sections,
    showAlert,
    showSaveFailure,
    showSaveSuccess,
  ])

  const handleSelectParagraph = useCallback((id: string) => {
    setActiveParagraphId(id)
    setSingleItemListActiveItemId(null)
  }, [])

  /** 템플릿 관리 편집기 상단 「문서 다운로드」 — 미리보기 A4 PDF와 동일 (QA 261113 #15·#71) */
  const documentPdf = useAgreementDocumentPdf({
    enabled: isTemplateManagementSave,
    draft,
    headerTitle: writingPreviewHeaderTitle,
    a4HiddenParagraphIds,
    a4PageBreakBeforeParagraphIds,
    a4RenderMode,
    a4ParagraphGapPx,
    paragraphBodyOptions: effectiveParagraphBodyOptions,
    agreementClosingFooter,
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

  return (
    <>
      {documentPdf.hostNode}
      <TemplateFullpageModal
        open
        onClose={onClose}
        title={modalTitleText !== '' ? editableModalTitle : modalTitle}
        description={modalDescription}
        templateTabType="writing"
        onTitleCommit={modalTitleText !== '' ? commitModalTitle : undefined}
        showHeaderCloseButton={!isTemplateManagementSave}
        onDownloadDocument={isTemplateManagementSave ? documentPdf.download : undefined}
        downloadDocumentLoading={documentPdf.loading}
        leftContent={
          <div
            className={[
              'agreement-writing-form-left',
              structureControlLockedParagraphIds != null
                ? 'agreement-writing-form-left--structure-control-locked'
                : '',
              leftPanelParagraphBodyOptions?.paymentPreConsentSheetLayout === true
                ? 'agreement-writing-form-left--pre-consent-sheet'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
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
            structureLockedParagraphIds={leftPanelStructureLockedParagraphIds}
            hideDragHandleForParagraphIds={leftPanelHideDragHandleForParagraphIds}
            paragraphBodyOptions={leftPanelParagraphBodyOptions}
            agreementClosingFooter={agreementClosingFooter}
            middleParagraphActions={
              leftPanelStructureLockedParagraphIds != null ? undefined : middleParagraphActions
            }
          />
          </div>
        }
        rightNavigation={
          <FormEditorFieldNav
            sectionTitle="커스텀 필드"
            pinnedTop={pinnedTop}
            sortableMiddle={sortableMiddle}
            pinnedBottom={pinnedBottom}
            hideSortableDragHandleForIds={leftPanelHideDragHandleForParagraphIds}
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
              /* 본문 잠금(회원 fill 등)만 잠금 패널로. 템플릿 관리 구조 잠금은 일반 패널 + 구조 조작만 막아
                 「입력창 안내 텍스트」 등 우측 문구 편집을 유지한다 (QA 261113 #16 — 문구만 수정) */
              structureLockedParagraphIds={effectiveStructureLockedParagraphIds}
              structureControlLockedParagraphIds={structureControlLockedParagraphIds}
            />
          </FormEditorFieldNav>
        }
        onPreview={handlePreview}
        onSave={handleSave}
        showDeleteButton={showDeleteButton}
        onDelete={onDelete}
        deleteLoading={deleteLoading}
      />
    </>
  )
}

export default function NewAgreementForm() {
  const { setParams } = useQueryParams<NewAgreementFormQuery>()
  const handleClose = useCallback(() => {
    setParams({ mode: undefined, type: undefined, id: undefined })
  }, [setParams])

  const handleTemplateCreated = useCallback(
    (templateId: string) => {
      setParams({
        mode: 'edit',
        id: templateId,
        type: 'agreement',
        userTemplate: '1',
      })
    },
    [setParams]
  )

  return (
    <AgreementWritingFormShell
      initialDraft={createDefaultDirectAgreementDraft}
      defaultActiveParagraphId={DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.title}
      modalTitle="동의 양식 신규 폼"
      modalDescription={DIRECT_AGREEMENT_MODAL_DESCRIPTION}
      paragraphBodyOptions={DIRECT_AGREEMENT_PARAGRAPH_BODY_OPTIONS}
      enableCreateOnSave
      forceUserEditable
      onClose={handleClose}
      onTemplateCreated={handleTemplateCreated}
    />
  )
}
