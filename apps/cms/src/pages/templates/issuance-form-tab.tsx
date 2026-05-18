import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import {
  getA4DocumentTitle,
  getA4PreviewParagraphs } from '@/features/template/lib/a4-document-preview'
import {
  collectFormDocumentPdfPageElements,
  downloadFormDocumentPdfFromPageElements } from '@/features/template/lib/generate-form-document-pdf'
import { useA4ParagraphPages } from '@/features/template/hooks/use-a4-paragraph-pages'
import {
  createDefaultSurveyDraft,
  createLectureReportIssuanceDraft,
  createSingleItemPreviewDraft,
  createUjatEducationJournalIssuanceDraft,
  createUjatEducationPlanIssuanceDraft,
  LECTURE_REPORT_HIDDEN_DRAG_HANDLE_IDS,
  UJAT_EDUCATION_JOURNAL_HIDDEN_DRAG_HANDLE_IDS,
  UJAT_EDUCATION_PLAN_HIDDEN_DRAG_HANDLE_IDS,
  UJAT_JOURNAL_EDUCATION_INFO_SAMPLE_INSTITUTION_NAME,
  type WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  getPaymentStatementA4ParagraphGap,
  PAYMENT_STATEMENT_A4_HIDDEN_PARAGRAPH_IDS } from '@/features/template/model/payment-statement-issuance-a4-preview'
import {
  getPaymentStatementPreConsentA4ParagraphGap,
  PAYMENT_STATEMENT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS } from '@/features/template/model/payment-statement-pre-consent-a4-preview'
import { createSettlementApplicationIssuanceDraft } from '@/features/template/model/settlement-application-issuance-draft'
import { createPaymentStatementPreConsentDraft } from '@/features/template/model/payment-statement-pre-consent-draft'
import {
  getSettlementApplicationA4ParagraphGap,
  SETTLEMENT_APPLICATION_A4_HIDDEN_PARAGRAPH_IDS } from '@/features/template/model/settlement-application-issuance-a4-preview'
import { TemplateListCard } from '@/features/template/ui/template-management/template-list-card'
import { CmsButton } from '@/shared/ui/cms-button'
import { A4DocumentPageLayout } from '@/features/template/ui/layout'
import { FormDocumentPreviewBody } from '@/features/template/ui/document-preview'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import {
  mergeLeftCardOrderByDragIds,
  normalizeLeftCardOrder,
  TemplateModalLeftContent,
  type TemplateModalLeftCardConfig } from '@/features/template/ui/template-management/template-modal-left-content'
import {
  TemplateModalRightNavigation,
  type TemplateModalRightNavigationConfig } from '@/features/template/ui/template-management/template-modal-right-navigation'
import { usePaymentStatementIssuanceEditor } from '@/features/template/hooks/use-payment-statement-issuance-editor'
import { usePaymentStatementPreConsentEditor } from '@/features/template/hooks/use-payment-statement-pre-consent-editor'
import { useSettlementApplicationIssuanceEditor } from '@/features/template/hooks/use-settlement-application-issuance-editor'
import { useLectureReportIssuanceEditor } from '@/features/template/hooks/use-lecture-report-issuance-editor'
import {
  useUjatEducationIssuanceEditor,
  type UjatEducationIssuanceVariant } from '@/features/template/hooks/use-ujat-education-plan-issuance-editor'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/left-panel/form-editor-field-nav'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel'
import {
  PaymentStatementIssuanceEditorLeftColumn,
  PaymentStatementIssuanceEditorRightColumn } from '@/features/template/ui/form-set/payment-statement-issuance'
import { PAYMENT_STATEMENT_ISSUANCE_PARAGRAPH_BODY_OPTIONS } from '@/features/template/ui/form-set/payment-statement-issuance/paragraph-config'
import {
  PaymentStatementPreConsentEditorLeftColumn,
  PaymentStatementPreConsentEditorRightColumn } from '@/features/template/ui/form-set/payment-statement-pre-consent/editor'
import { PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS } from '@/features/template/ui/form-set/payment-statement-pre-consent/paragraph-config'
import {
  SettlementApplicationIssuanceEditorLeftColumn,
  SettlementApplicationIssuanceEditorRightColumn } from '@/features/template/ui/form-set/settlement-application-issuance/editor'
import { SETTLEMENT_APPLICATION_ISSUANCE_PARAGRAPH_BODY_OPTIONS } from '@/features/template/ui/form-set/settlement-application-issuance/paragraph-config'
import { DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES } from '@/features/template/ui/template-management/template-custom-fields-form'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import {
  TEMPLATE_USER_PREVIEW_ACTIVE } from '@/features/template/lib/template-user-preview-url'
import { useWritingUserPreviewUrlAuxiliarySync } from '@/features/template/hooks/use-writing-user-preview-url-auxiliary-sync'
import {
  createContentOnlyA4PreviewOptions,
  isCertificateIssuanceTemplateName,
  shouldUseA4PreviewForIssuanceTemplate } from '@/features/template/lib/a4-preview-template-options'
import { FormCertificatePdfExportOverlay } from './form-certificate-pdf-export-overlay'
import { FormTemplateFullpageModal } from './form-template-fullpage-modal'
import './form-test-single-item-fullpage-modal.css'
import { handleError } from '@/shared/utils/error-handler'

const PAYMENT_STATEMENT_ISSUANCE_TEMPLATE_NAME = '지급조서(발급용)'
const PAYMENT_STATEMENT_PRE_CONSENT_TEMPLATE_NAME = '지급조서 사전 동의서'
const PAYMENT_STATEMENT_PRE_CONSENT_ROW_KEY = 'document-payment-order-pre-consent'
const SETTLEMENT_APPLICATION_TEMPLATE_NAME = '정산 신청서'
const UJAT_EDUCATION_PLAN_TEMPLATE_NAME = 'UJAT 교육계획서'
const UJAT_EDUCATION_JOURNAL_TEMPLATE_NAME = 'UJAT 교육일지'
const LECTURE_REPORT_TEMPLATE_NAME = '강의보고서'

const UJAT_STRUCTURED_ISSUANCE_HIDDEN_DRAG_HANDLES: Record<
  UjatEducationIssuanceVariant,
  Set<string>
> = {
  plan: UJAT_EDUCATION_PLAN_HIDDEN_DRAG_HANDLE_IDS,
  journal: UJAT_EDUCATION_JOURNAL_HIDDEN_DRAG_HANDLE_IDS }
const MULTI_PAGE_ISSUANCE_PREVIEW_TEMPLATE_NAMES = new Set(['결과보고서'])

function getIssuanceUserPreviewDraft(templateName?: string): WritingFormDraft {
  if (templateName === UJAT_EDUCATION_PLAN_TEMPLATE_NAME) {
    return createUjatEducationPlanIssuanceDraft()
  }
  if (templateName === UJAT_EDUCATION_JOURNAL_TEMPLATE_NAME) {
    return createUjatEducationJournalIssuanceDraft()
  }
  if (templateName === LECTURE_REPORT_TEMPLATE_NAME) {
    return createLectureReportIssuanceDraft()
  }
  if (templateName === SETTLEMENT_APPLICATION_TEMPLATE_NAME) {
    return createSettlementApplicationIssuanceDraft()
  }
  if (templateName === PAYMENT_STATEMENT_PRE_CONSENT_TEMPLATE_NAME) {
    return createPaymentStatementPreConsentDraft()
  }
  if (templateName != null && MULTI_PAGE_ISSUANCE_PREVIEW_TEMPLATE_NAMES.has(templateName)) {
    return createSingleItemPreviewDraft()
  }
  return createDefaultSurveyDraft()
}

function safePdfFileName(title: string): string {
  const base = title.trim().replace(/[^\w가-힣-]+/gu, '_').replace(/_+/g, '_').slice(0, 80) || 'form'
  return `${base}.pdf`
}

type IssuanceFormTabQuery = {
  mode?: string
  id?: string
  userPreview?: string
}

interface IssuanceTemplateRow {
  key: string
  no: number
  templateName: string
  creator: string
  createdAt: string
  updatedAt: string
}

const issuanceRows: IssuanceTemplateRow[] = [
  {
    key: 'issuance-1',
    no: 1,
    templateName: 'UJAT 결과리포트',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-' },
  {
    key: 'issuance-2',
    no: 2,
    templateName: 'UJAT 교육계획서',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-' },
  {
    key: 'issuance-ujat-edu-journal',
    no: 3,
    templateName: 'UJAT 교육일지',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-' },
  {
    key: 'issuance-3',
    no: 4,
    templateName: '강의보고서',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-' },
  {
    key: 'issuance-4',
    no: 5,
    templateName: '정산 신청서',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-' },
  {
    key: 'issuance-5',
    no: 6,
    templateName: '결과보고서',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-' },
]

const documentRows: IssuanceTemplateRow[] = [
  {
    key: 'document-payment-order-issue',
    no: 1,
    templateName: PAYMENT_STATEMENT_ISSUANCE_TEMPLATE_NAME,
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-' },
  {
    key: PAYMENT_STATEMENT_PRE_CONSENT_ROW_KEY,
    no: 2,
    templateName: PAYMENT_STATEMENT_PRE_CONSENT_TEMPLATE_NAME,
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-' },
  {
    key: 'document-1',
    no: 3,
    templateName: '지출증빙서류(필수폼)',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-' },
  {
    key: 'document-2',
    no: 4,
    templateName: '휴가 인증서',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-' },
  {
    key: 'document-3',
    no: 5,
    templateName: '수료증',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-' },
  {
    key: 'document-4',
    no: 6,
    templateName: '강사 활동 인증서',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-' },
  {
    key: 'document-5',
    no: 7,
    templateName: '봉사 활동 인증서',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-' },
]

const issuanceRowsByKey = new Map<string, IssuanceTemplateRow>(
  [...issuanceRows, ...documentRows].map(row => [row.key, row])
)

export function IssuanceFormTab() {
  const {
    openWritingUserPreview,
    closeWritingUserPreview,
    isWritingUserPreviewOpen } = useTemplateWritingPreview()
  const { params, setParams } = useQueryParams<IssuanceFormTabQuery>()
  useWritingUserPreviewUrlAuxiliarySync(
    params,
    setParams,
    isWritingUserPreviewOpen,
    closeWritingUserPreview
  )
  const isPreviewOpen = params.mode === 'edit'
  const [selectedTemplate, setSelectedTemplate] = useState<IssuanceTemplateRow | null>(null)

  const isPaymentStatementIssuance =
    selectedTemplate?.templateName === PAYMENT_STATEMENT_ISSUANCE_TEMPLATE_NAME
  const isPaymentStatementPreConsent =
    selectedTemplate?.key === PAYMENT_STATEMENT_PRE_CONSENT_ROW_KEY ||
    selectedTemplate?.templateName === PAYMENT_STATEMENT_PRE_CONSENT_TEMPLATE_NAME
  const isUjatEducationPlan = selectedTemplate?.templateName === UJAT_EDUCATION_PLAN_TEMPLATE_NAME
  const isUjatEducationJournal = selectedTemplate?.templateName === UJAT_EDUCATION_JOURNAL_TEMPLATE_NAME
  const ujatStructuredIssuanceVariant: UjatEducationIssuanceVariant | null = isUjatEducationPlan
    ? 'plan'
    : isUjatEducationJournal
      ? 'journal'
      : null
  const isUjatStructuredIssuance = ujatStructuredIssuanceVariant != null
  const isLectureReportIssuance = selectedTemplate?.templateName === LECTURE_REPORT_TEMPLATE_NAME
  const isSettlementApplicationIssuance =
    selectedTemplate?.templateName === SETTLEMENT_APPLICATION_TEMPLATE_NAME
  const isCertificateIssuance =
    selectedTemplate != null && isCertificateIssuanceTemplateName(selectedTemplate.templateName)
  const certificateInitialStringValues = useMemo(() => {
    if (!isCertificateIssuance || selectedTemplate == null) return undefined
    return {
      ...DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES,
      titleName: selectedTemplate.templateName }
  }, [isCertificateIssuance, selectedTemplate])
  const certificateIssueDate = useMemo(() => new Date(), [selectedTemplate?.key])

  const paymentStatementVm = usePaymentStatementIssuanceEditor(
    isPreviewOpen && isPaymentStatementIssuance,
    selectedTemplate?.templateName ?? PAYMENT_STATEMENT_ISSUANCE_TEMPLATE_NAME
  )
  const paymentStatementPreConsentVm = usePaymentStatementPreConsentEditor(
    isPreviewOpen && isPaymentStatementPreConsent,
    selectedTemplate?.templateName ?? PAYMENT_STATEMENT_PRE_CONSENT_TEMPLATE_NAME
  )
  const ujatStructuredIssuanceVm = useUjatEducationIssuanceEditor(
    Boolean(isPreviewOpen && !isCertificateIssuance && isUjatStructuredIssuance),
    ujatStructuredIssuanceVariant ?? 'plan'
  )
  const lectureReportVm = useLectureReportIssuanceEditor(
    Boolean(isPreviewOpen && !isCertificateIssuance && isLectureReportIssuance)
  )
  const settlementVm = useSettlementApplicationIssuanceEditor(
    Boolean(isPreviewOpen && !isCertificateIssuance && isSettlementApplicationIssuance),
    selectedTemplate?.templateName ?? SETTLEMENT_APPLICATION_TEMPLATE_NAME
  )
  const paymentStatementPdfHostRef = useRef<HTMLDivElement>(null)
  const [paymentStatementPdfLoading, setPaymentStatementPdfLoading] = useState(false)
  const paymentStatementPreviewParagraphs = useMemo(
    () =>
      getA4PreviewParagraphs(
        paymentStatementVm.draft.paragraphs,
        PAYMENT_STATEMENT_A4_HIDDEN_PARAGRAPH_IDS
      ),
    [paymentStatementVm.draft.paragraphs]
  )
  const paymentStatementA4Title = useMemo(
    () => getA4DocumentTitle(paymentStatementVm.draft, selectedTemplate?.templateName ?? PAYMENT_STATEMENT_ISSUANCE_TEMPLATE_NAME),
    [paymentStatementVm.draft, selectedTemplate?.templateName]
  )
  const {
    pages: paymentStatementPdfPages,
    overflowParagraphIds: paymentStatementPdfOverflowParagraphIds,
    measureLayer: paymentStatementPdfMeasureLayer } = useA4ParagraphPages({
    allParagraphs: paymentStatementPreviewParagraphs,
    titleNumbering: paymentStatementVm.draft.formSettings.titleNumbering,
    editorKind: 'horizontal_table',
    enabled: isPreviewOpen && isPaymentStatementIssuance,
    paragraphBodyOptions: PAYMENT_STATEMENT_ISSUANCE_PARAGRAPH_BODY_OPTIONS,
    renderMode: 'contentOnly',
    paragraphGapPx: getPaymentStatementA4ParagraphGap })

  const paymentStatementPreConsentPdfHostRef = useRef<HTMLDivElement>(null)
  const [paymentStatementPreConsentPdfLoading, setPaymentStatementPreConsentPdfLoading] = useState(false)
  const paymentStatementPreConsentPreviewParagraphs = useMemo(
    () =>
      getA4PreviewParagraphs(
        paymentStatementPreConsentVm.draft.paragraphs,
        PAYMENT_STATEMENT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS
      ),
    [paymentStatementPreConsentVm.draft.paragraphs]
  )
  const paymentStatementPreConsentA4Title = useMemo(
    () =>
      getA4DocumentTitle(
        paymentStatementPreConsentVm.draft,
        selectedTemplate?.templateName ?? PAYMENT_STATEMENT_PRE_CONSENT_TEMPLATE_NAME
      ),
    [paymentStatementPreConsentVm.draft, selectedTemplate?.templateName]
  )
  const {
    pages: paymentStatementPreConsentPdfPages,
    overflowParagraphIds: paymentStatementPreConsentPdfOverflowParagraphIds,
    measureLayer: paymentStatementPreConsentPdfMeasureLayer } = useA4ParagraphPages({
    allParagraphs: paymentStatementPreConsentPreviewParagraphs,
    titleNumbering: paymentStatementPreConsentVm.draft.formSettings.titleNumbering,
    editorKind: 'agreement',
    enabled: isPreviewOpen && isPaymentStatementPreConsent,
    paragraphBodyOptions: PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS,
    renderMode: 'contentOnly',
    paragraphGapPx: getPaymentStatementPreConsentA4ParagraphGap })

  const settlementPdfHostRef = useRef<HTMLDivElement>(null)
  const [settlementPdfLoading, setSettlementPdfLoading] = useState(false)
  const settlementPreviewParagraphs = useMemo(
    () =>
      getA4PreviewParagraphs(
        settlementVm.draft.paragraphs,
        SETTLEMENT_APPLICATION_A4_HIDDEN_PARAGRAPH_IDS
      ),
    [settlementVm.draft.paragraphs]
  )
  const settlementA4Title = useMemo(
    () =>
      getA4DocumentTitle(
        settlementVm.draft,
        selectedTemplate?.templateName ?? SETTLEMENT_APPLICATION_TEMPLATE_NAME
      ),
    [settlementVm.draft, selectedTemplate?.templateName]
  )
  const {
    pages: settlementPdfPages,
    overflowParagraphIds: settlementPdfOverflowParagraphIds,
    measureLayer: settlementPdfMeasureLayer } = useA4ParagraphPages({
    allParagraphs: settlementPreviewParagraphs,
    titleNumbering: settlementVm.draft.formSettings.titleNumbering,
    editorKind: 'horizontal_table',
    enabled: isPreviewOpen && isSettlementApplicationIssuance,
    paragraphBodyOptions: SETTLEMENT_APPLICATION_ISSUANCE_PARAGRAPH_BODY_OPTIONS,
    renderMode: 'contentOnly',
    paragraphGapPx: getSettlementApplicationA4ParagraphGap })

  const openTemplatePreview = useCallback(
    (row: IssuanceTemplateRow) => {
      setParams(
        { mode: 'edit', id: row.key, userPreview: undefined },
        { replace: false }
      )
    },
    [setParams]
  )

  const closeTemplatePreview = useCallback(() => {
    setParams({ mode: undefined, id: undefined, userPreview: undefined })
  }, [setParams])

  useEffect(() => {
    if (params.mode !== 'edit' || params.id == null || params.id === '') {
      setSelectedTemplate(null)
      return
    }
    const row = issuanceRowsByKey.get(params.id)
    if (row != null) {
      setSelectedTemplate(row)
      return
    }
    setParams({ mode: undefined, id: undefined, userPreview: undefined })
    setSelectedTemplate(null)
  }, [params.mode, params.id, setParams])

  const issuanceColumns: ColumnsType<IssuanceTemplateRow> = [
    { title: 'No.', dataIndex: 'no', key: 'no', width: 88, align: 'center' },
    { title: '템플릿명', dataIndex: 'templateName', key: 'templateName' },
    { title: '생성자', dataIndex: 'creator', key: 'creator', width: 180, align: 'center' },
    { title: '최초 생성일', dataIndex: 'createdAt', key: 'createdAt', width: 180, align: 'center' },
    { title: '최근 수정일', dataIndex: 'updatedAt', key: 'updatedAt', width: 180, align: 'center' },
    {
      title: '양식 관리',
      key: 'action',
      width: 150,
      align: 'center',
      render: (_, row) => (
        <CmsButton size="medium" variant="default" onClick={() => openTemplatePreview(row)}>
          양식 상세보기
        </CmsButton>
      ) },
  ]

  const baseLeftContentConfig = useMemo<TemplateModalLeftCardConfig[]>(
    () => [
      {
        id: 'issuance-card-1',
        title: '문서 기본 정보',
        required: true,
        description: '발급 문서 유형별 기본 제목과 안내문을 설정합니다.' },
      {
        id: 'issuance-card-2',
        title: '발급 대상/조건',
        description: '발급 대상과 노출 조건을 문서별로 설정하세요.' },
      {
        id: 'issuance-card-3',
        title: '출력 옵션',
        description: '서명, 직인, 발급번호 등 출력 요소를 문서 유형별로 구성합니다.' },
    ],
    []
  )
  const [orderedLeftContentConfig, setOrderedLeftContentConfig] = useState<TemplateModalLeftCardConfig[]>(
    []
  )
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

  useEffect(() => {
    if (!isPreviewOpen) return
    const ordered = normalizeLeftCardOrder(baseLeftContentConfig)
    setOrderedLeftContentConfig(ordered)
    setActiveCardId(ordered[0]?.id ?? null)
  }, [baseLeftContentConfig, isPreviewOpen])

  const rightNavigationConfig: TemplateModalRightNavigationConfig = {
    sectionTitle: '발급 필드',
    items: orderedLeftContentConfig.map(item => ({ id: item.id, label: item.title })) }

  const applyOrderedCards = (orderedIds: string[]) => {
    setOrderedLeftContentConfig(prev => mergeLeftCardOrderByDragIds(prev, orderedIds))
  }

  const noopUpdateParagraph: FormUpdateParagraph = () => {}
  const handleOpenUserPreview = useCallback(() => {
    if (selectedTemplate == null) return
    const useA4Preview = shouldUseA4PreviewForIssuanceTemplate(selectedTemplate.templateName)
    const baseA4Options = useA4Preview ? createContentOnlyA4PreviewOptions() : undefined
    const isJournalPreview = selectedTemplate.templateName === UJAT_EDUCATION_JOURNAL_TEMPLATE_NAME
    const isSettlementPreview =
      selectedTemplate.templateName === SETTLEMENT_APPLICATION_TEMPLATE_NAME
    const isPreConsentPreview =
      selectedTemplate.key === PAYMENT_STATEMENT_PRE_CONSENT_ROW_KEY ||
      selectedTemplate.templateName === PAYMENT_STATEMENT_PRE_CONSENT_TEMPLATE_NAME
    const previewEditorKind =
      isSettlementPreview ? 'horizontal_table' : isPreConsentPreview ? 'agreement' : 'survey'
    openWritingUserPreview({
      draft: getIssuanceUserPreviewDraft(selectedTemplate.templateName),
      updateParagraph: noopUpdateParagraph,
      headerTitle: selectedTemplate.templateName ?? '발급 양식 미리보기',
      editorKind: previewEditorKind,
      previewLayout: baseA4Options?.previewLayout,
      paragraphBodyOptions: isJournalPreview
        ? {
            ujatJournalEducationInfoAutofill: {
              institutionName: UJAT_JOURNAL_EDUCATION_INFO_SAMPLE_INSTITUTION_NAME } }
        : isSettlementPreview
          ? SETTLEMENT_APPLICATION_ISSUANCE_PARAGRAPH_BODY_OPTIONS
          : isPreConsentPreview
            ? PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS
          : undefined,
      a4HiddenParagraphIds: isSettlementPreview
        ? SETTLEMENT_APPLICATION_A4_HIDDEN_PARAGRAPH_IDS
        : isPreConsentPreview
          ? PAYMENT_STATEMENT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS
        : undefined,
      a4RenderMode: baseA4Options?.a4RenderMode,
      a4ParagraphGapPx: isSettlementPreview
        ? getSettlementApplicationA4ParagraphGap
        : isPreConsentPreview
          ? getPaymentStatementPreConsentA4ParagraphGap
          : undefined,
      hideParagraphRequiredChrome: baseA4Options?.hideParagraphRequiredChrome })
  }, [selectedTemplate, openWritingUserPreview])

  const handleModalPreview = useCallback(() => {
    setParams({ userPreview: TEMPLATE_USER_PREVIEW_ACTIVE }, { replace: false })
    if (isPaymentStatementIssuance) {
      paymentStatementVm.handlePreview()
      return
    }
    if (isPaymentStatementPreConsent) {
      paymentStatementPreConsentVm.handlePreview()
      return
    }
    if (isSettlementApplicationIssuance) {
      settlementVm.handlePreview()
      return
    }
    if (isUjatStructuredIssuance) {
      ujatStructuredIssuanceVm.handlePreview()
      return
    }
    if (isLectureReportIssuance) {
      lectureReportVm.handlePreview()
      return
    }
    handleOpenUserPreview()
  }, [
    setParams,
    handleOpenUserPreview,
    isPaymentStatementIssuance,
    isPaymentStatementPreConsent,
    isSettlementApplicationIssuance,
    isUjatStructuredIssuance,
    isLectureReportIssuance,
    paymentStatementVm,
    paymentStatementPreConsentVm,
    settlementVm,
    ujatStructuredIssuanceVm,
    lectureReportVm,
  ])

  useEffect(() => {
    if (params.userPreview !== TEMPLATE_USER_PREVIEW_ACTIVE) return
    if (params.mode !== 'edit') return
    if (selectedTemplate == null) return
    if (isWritingUserPreviewOpen) return
    if (isCertificateIssuance) return

    if (isPaymentStatementIssuance) {
      paymentStatementVm.handlePreview()
      return
    }
    if (isPaymentStatementPreConsent) {
      paymentStatementPreConsentVm.handlePreview()
      return
    }
    if (isSettlementApplicationIssuance) {
      settlementVm.handlePreview()
      return
    }
    if (isUjatStructuredIssuance) {
      ujatStructuredIssuanceVm.handlePreview()
      return
    }
    if (isLectureReportIssuance) {
      lectureReportVm.handlePreview()
      return
    }
    handleOpenUserPreview()
  }, [
    params.userPreview,
    params.mode,
    selectedTemplate,
    isWritingUserPreviewOpen,
    isCertificateIssuance,
    isPaymentStatementIssuance,
    isPaymentStatementPreConsent,
    isSettlementApplicationIssuance,
    isUjatStructuredIssuance,
    isLectureReportIssuance,
    paymentStatementVm,
    paymentStatementPreConsentVm,
    settlementVm,
    ujatStructuredIssuanceVm,
    lectureReportVm,
    handleOpenUserPreview,
  ])

  const handleDownloadPaymentStatementDocument = useCallback(async () => {
    const root = paymentStatementPdfHostRef.current
    if (root == null) return
    setPaymentStatementPdfLoading(true)
    try {
      const pageEls = collectFormDocumentPdfPageElements(root)
      await downloadFormDocumentPdfFromPageElements(pageEls, safePdfFileName(paymentStatementA4Title))
    } catch (e) {
      handleError(e, { context: 'issuanceFormTab.downloadPaymentStatementPdf' })
    } finally {
      setPaymentStatementPdfLoading(false)
    }
  }, [paymentStatementA4Title])

  const handleDownloadPaymentStatementPreConsentDocument = useCallback(async () => {
    const root = paymentStatementPreConsentPdfHostRef.current
    if (root == null) return
    setPaymentStatementPreConsentPdfLoading(true)
    try {
      const pageEls = collectFormDocumentPdfPageElements(root)
      await downloadFormDocumentPdfFromPageElements(
        pageEls,
        safePdfFileName(paymentStatementPreConsentA4Title)
      )
    } catch (e) {
      handleError(e, { context: 'issuanceFormTab.downloadPaymentStatementPreConsentPdf' })
    } finally {
      setPaymentStatementPreConsentPdfLoading(false)
    }
  }, [paymentStatementPreConsentA4Title])

  const handleDownloadSettlementApplicationDocument = useCallback(async () => {
    const root = settlementPdfHostRef.current
    if (root == null) return
    setSettlementPdfLoading(true)
    try {
      const pageEls = collectFormDocumentPdfPageElements(root)
      await downloadFormDocumentPdfFromPageElements(pageEls, safePdfFileName(settlementA4Title))
    } catch (e) {
      handleError(e, { context: 'issuanceFormTab.downloadSettlementApplicationPdf' })
    } finally {
      setSettlementPdfLoading(false)
    }
  }, [settlementA4Title])

  return (
    <>
      <FormCertificatePdfExportOverlay
        visible={
          paymentStatementPdfLoading ||
          paymentStatementPreConsentPdfLoading ||
          settlementPdfLoading
        }
      />
      {isPreviewOpen && isPaymentStatementIssuance ? paymentStatementPdfMeasureLayer : null}
      {isPreviewOpen && isPaymentStatementPreConsent ? paymentStatementPreConsentPdfMeasureLayer : null}
      {isPreviewOpen && isSettlementApplicationIssuance ? settlementPdfMeasureLayer : null}
      <div className="template-form-tab__content">
        <TemplateListCard
          title="보고 양식"
          description="모든 프로그램에 동일한 구조로 노출되는 양식입니다."
          headerInline
        >
          <Table
            className="cms-data-table"
            rowKey="key"
            columns={issuanceColumns}
            dataSource={issuanceRows}
            pagination={false}
          />
        </TemplateListCard>
        <TemplateListCard
          title="서류 양식"
          description="모든 프로그램에 동일한 구조로 노출되는 양식입니다."
          headerInline
        >
          <Table
            className="cms-data-table"
            rowKey="key"
            columns={issuanceColumns}
            dataSource={documentRows}
            pagination={false}
          />
        </TemplateListCard>
      </div>

      <TemplateFullpageModal
        className={
          isUjatStructuredIssuance || isLectureReportIssuance
            ? 'form-test-single-item-fullpage-modal'
            : undefined
        }
        open={isPreviewOpen && !isCertificateIssuance}
        onClose={closeTemplatePreview}
        title={selectedTemplate?.templateName ?? '발급 양식 미리보기'}
        description="* 해당 폼은 기존 항목의 삭제가 불가하며, 수정에 제한이 있습니다."
        templateTabType="issuance"
        onPreview={handleModalPreview}
        onSave={
          isPaymentStatementIssuance
            ? paymentStatementVm.handleSave
            : isPaymentStatementPreConsent
              ? paymentStatementPreConsentVm.handleSave
            : isSettlementApplicationIssuance
              ? settlementVm.handleSave
              : isUjatStructuredIssuance
                ? ujatStructuredIssuanceVm.handleSave
                : isLectureReportIssuance
                  ? lectureReportVm.handleSave
                  : undefined
        }
        onDownloadDocument={
          isPaymentStatementIssuance
            ? () => void handleDownloadPaymentStatementDocument()
            : isPaymentStatementPreConsent
              ? () => void handleDownloadPaymentStatementPreConsentDocument()
            : isSettlementApplicationIssuance
              ? () => void handleDownloadSettlementApplicationDocument()
              : undefined
        }
        downloadDocumentLoading={
          isPaymentStatementIssuance
            ? paymentStatementPdfLoading
            : isPaymentStatementPreConsent
              ? paymentStatementPreConsentPdfLoading
            : isSettlementApplicationIssuance
              ? settlementPdfLoading
              : false
        }
        leftContent={
          isPaymentStatementIssuance ? (
            <PaymentStatementIssuanceEditorLeftColumn vm={paymentStatementVm} />
          ) : isPaymentStatementPreConsent ? (
            <PaymentStatementPreConsentEditorLeftColumn vm={paymentStatementPreConsentVm} />
          ) : isSettlementApplicationIssuance ? (
            <SettlementApplicationIssuanceEditorLeftColumn vm={settlementVm} />
          ) : isUjatStructuredIssuance ? (
            <FormEditorLeftPanel
              paragraphs={ujatStructuredIssuanceVm.draft.paragraphs}
              titleNumbering={ujatStructuredIssuanceVm.draft.formSettings.titleNumbering}
              selectedCardId={ujatStructuredIssuanceVm.activeParagraphId}
              onSelectCard={ujatStructuredIssuanceVm.handleSelectCard}
              onReorderMiddle={ujatStructuredIssuanceVm.onReorderMiddle}
              updateParagraph={ujatStructuredIssuanceVm.updateParagraph}
              editorKind="survey"
              singleItemListActiveItemId={ujatStructuredIssuanceVm.singleItemListActiveItemId}
              onSelectSingleItemListItem={ujatStructuredIssuanceVm.onSelectSingleItemListItem}
              middleParagraphActions={ujatStructuredIssuanceVm.middleParagraphActions}
              structureLockedParagraphIds={ujatStructuredIssuanceVm.structureLockedParagraphIds}
              hideDragHandleForParagraphIds={
                UJAT_STRUCTURED_ISSUANCE_HIDDEN_DRAG_HANDLES[ujatStructuredIssuanceVariant ?? 'plan']
              }
              hideParagraphRequiredChrome
              headingDescriptionExtraClassName="paragraph-input-explanation-title"
              paragraphBodyOptions={
                ujatStructuredIssuanceVariant === 'journal'
                  ? {
                      ujatJournalEducationInfoAutofill: {
                        institutionName: UJAT_JOURNAL_EDUCATION_INFO_SAMPLE_INSTITUTION_NAME } }
                  : undefined
              }
            />
          ) : isLectureReportIssuance ? (
            <FormEditorLeftPanel
              paragraphs={lectureReportVm.draft.paragraphs}
              titleNumbering={lectureReportVm.draft.formSettings.titleNumbering}
              selectedCardId={lectureReportVm.activeParagraphId}
              onSelectCard={lectureReportVm.handleSelectCard}
              onReorderMiddle={lectureReportVm.onReorderMiddle}
              updateParagraph={lectureReportVm.updateParagraph}
              editorKind="survey"
              singleItemListActiveItemId={lectureReportVm.singleItemListActiveItemId}
              onSelectSingleItemListItem={lectureReportVm.onSelectSingleItemListItem}
              middleParagraphActions={lectureReportVm.middleParagraphActions}
              structureLockedParagraphIds={lectureReportVm.structureLockedParagraphIds}
              hideDragHandleForParagraphIds={LECTURE_REPORT_HIDDEN_DRAG_HANDLE_IDS}
              hideParagraphRequiredChrome
              headingDescriptionExtraClassName="paragraph-input-explanation-title"
            />
          ) : (
            <TemplateModalLeftContent
              config={orderedLeftContentConfig}
              selectedCardId={activeCardId}
              onSelectCard={setActiveCardId}
              onReorderCards={cards => applyOrderedCards(cards.map(card => card.id))}
            />
          )
        }
        rightNavigation={
          isPaymentStatementIssuance ? (
            <PaymentStatementIssuanceEditorRightColumn vm={paymentStatementVm} />
          ) : isPaymentStatementPreConsent ? (
            <PaymentStatementPreConsentEditorRightColumn vm={paymentStatementPreConsentVm} />
          ) : isSettlementApplicationIssuance ? (
            <SettlementApplicationIssuanceEditorRightColumn vm={settlementVm} />
          ) : isUjatStructuredIssuance ? (
            <FormEditorFieldNav
              sectionTitle="커스텀 필드"
              pinnedTop={ujatStructuredIssuanceVm.pinnedTop}
              sortableMiddle={ujatStructuredIssuanceVm.sortableMiddle}
              pinnedBottom={ujatStructuredIssuanceVm.pinnedBottom}
              selectedItemId={ujatStructuredIssuanceVm.activeParagraphId}
              onSelectItem={ujatStructuredIssuanceVm.handleSelectCard}
              onReorderMiddle={ujatStructuredIssuanceVm.onReorderMiddle}
              fieldListBottomSlot={
                <FormEditorTitleNumberingField
                  value={ujatStructuredIssuanceVm.draft.formSettings.titleNumbering}
                  onChange={ujatStructuredIssuanceVm.onTitleNumberingChange}
                />
              }
            >
              <FormEditorRightPanel
                draft={ujatStructuredIssuanceVm.draft}
                activeParagraphId={ujatStructuredIssuanceVm.activeParagraphId}
                onTitleNumberingChange={ujatStructuredIssuanceVm.onTitleNumberingChange}
                updateParagraph={ujatStructuredIssuanceVm.updateParagraph}
                editorKind="survey"
                showTitleNumbering={false}
                singleItemListActiveItemId={ujatStructuredIssuanceVm.singleItemListActiveItemId}
                structureLockedParagraphIds={ujatStructuredIssuanceVm.structureLockedParagraphIds}
              />
            </FormEditorFieldNav>
          ) : isLectureReportIssuance ? (
            <FormEditorFieldNav
              sectionTitle="커스텀 필드"
              pinnedTop={lectureReportVm.pinnedTop}
              sortableMiddle={lectureReportVm.sortableMiddle}
              pinnedBottom={lectureReportVm.pinnedBottom}
              selectedItemId={lectureReportVm.activeParagraphId}
              onSelectItem={lectureReportVm.handleSelectCard}
              onReorderMiddle={lectureReportVm.onReorderMiddle}
              fieldListBottomSlot={
                <FormEditorTitleNumberingField
                  value={lectureReportVm.draft.formSettings.titleNumbering}
                  onChange={lectureReportVm.onTitleNumberingChange}
                />
              }
            >
              <FormEditorRightPanel
                draft={lectureReportVm.draft}
                activeParagraphId={lectureReportVm.activeParagraphId}
                onTitleNumberingChange={lectureReportVm.onTitleNumberingChange}
                updateParagraph={lectureReportVm.updateParagraph}
                editorKind="survey"
                showTitleNumbering={false}
                singleItemListActiveItemId={lectureReportVm.singleItemListActiveItemId}
                structureLockedParagraphIds={lectureReportVm.structureLockedParagraphIds}
              />
            </FormEditorFieldNav>
          ) : (
            <TemplateModalRightNavigation
              config={rightNavigationConfig}
              selectedItemId={activeCardId}
              onSelectItem={setActiveCardId}
              onReorderItems={items => applyOrderedCards(items.map(item => item.id))}
            >
              <span className="full-page-modal__nav-title">문서 설정</span>
              <CmsButton variant="default" size="medium" width="100%">
                시트 내 필드
              </CmsButton>
            </TemplateModalRightNavigation>
          )
        }
      />
      <FormTemplateFullpageModal
        open={isPreviewOpen && isCertificateIssuance}
        onClose={closeTemplatePreview}
        title={selectedTemplate?.templateName ?? '인증서'}
        initialStringValues={certificateInitialStringValues}
        issueDate={certificateIssueDate}
        buildFilenameTitle={selectedTemplate?.templateName}
      />
      {isPreviewOpen && isPaymentStatementIssuance ? (
        <div
          ref={paymentStatementPdfHostRef}
          style={{
            position: 'fixed',
            left: -20000,
            top: 0,
            width: 1464,
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'none',
            zIndex: -1 }}
          aria-hidden="true"
        >
          {paymentStatementPdfPages.map((pageParagraphs, pageIndex) => (
            <A4DocumentPageLayout
              key={pageIndex}
              title={paymentStatementA4Title}
              pageIndex={pageIndex}
              pdfCapture
            >
              <div style={{ width: '100%', paddingBottom: 16, boxSizing: 'border-box' }}>
                <FormDocumentPreviewBody
                  paragraphs={pageParagraphs}
                  allParagraphs={paymentStatementPreviewParagraphs}
                  titleNumbering={paymentStatementVm.draft.formSettings.titleNumbering}
                  editorKind="horizontal_table"
                  overflowParagraphIds={paymentStatementPdfOverflowParagraphIds}
                  paragraphBodyOptions={PAYMENT_STATEMENT_ISSUANCE_PARAGRAPH_BODY_OPTIONS}
                  renderMode="contentOnly"
                  paragraphGapPx={getPaymentStatementA4ParagraphGap}
                />
              </div>
            </A4DocumentPageLayout>
          ))}
        </div>
      ) : null}
      {isPreviewOpen && isPaymentStatementPreConsent ? (
        <div
          ref={paymentStatementPreConsentPdfHostRef}
          style={{
            position: 'fixed',
            left: -20000,
            top: 0,
            width: 1464,
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'none',
            zIndex: -1 }}
          aria-hidden="true"
        >
          {paymentStatementPreConsentPdfPages.map((pageParagraphs, pageIndex) => (
            <A4DocumentPageLayout
              key={pageIndex}
              title={paymentStatementPreConsentA4Title}
              pageIndex={pageIndex}
              pdfCapture
            >
              <div style={{ width: '100%', paddingBottom: 16, boxSizing: 'border-box' }}>
                <FormDocumentPreviewBody
                  paragraphs={pageParagraphs}
                  allParagraphs={paymentStatementPreConsentPreviewParagraphs}
                  titleNumbering={paymentStatementPreConsentVm.draft.formSettings.titleNumbering}
                  editorKind="agreement"
                  overflowParagraphIds={paymentStatementPreConsentPdfOverflowParagraphIds}
                  paragraphBodyOptions={PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS}
                  renderMode="contentOnly"
                  paragraphGapPx={getPaymentStatementPreConsentA4ParagraphGap}
                />
              </div>
            </A4DocumentPageLayout>
          ))}
        </div>
      ) : null}
      {isPreviewOpen && isSettlementApplicationIssuance ? (
        <div
          ref={settlementPdfHostRef}
          style={{
            position: 'fixed',
            left: -20000,
            top: 0,
            width: 1464,
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'none',
            zIndex: -1 }}
          aria-hidden="true"
        >
          {settlementPdfPages.map((pageParagraphs, pageIndex) => (
            <A4DocumentPageLayout
              key={pageIndex}
              title={settlementA4Title}
              pageIndex={pageIndex}
              pdfCapture
            >
              <div style={{ width: '100%', paddingBottom: 16, boxSizing: 'border-box' }}>
                <FormDocumentPreviewBody
                  paragraphs={pageParagraphs}
                  allParagraphs={settlementPreviewParagraphs}
                  titleNumbering={settlementVm.draft.formSettings.titleNumbering}
                  editorKind="horizontal_table"
                  overflowParagraphIds={settlementPdfOverflowParagraphIds}
                  paragraphBodyOptions={SETTLEMENT_APPLICATION_ISSUANCE_PARAGRAPH_BODY_OPTIONS}
                  renderMode="contentOnly"
                  paragraphGapPx={getSettlementApplicationA4ParagraphGap}
                />
              </div>
            </A4DocumentPageLayout>
          ))}
        </div>
      ) : null}
    </>
  )
}
