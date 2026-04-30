import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import {
  createDefaultSurveyDraft,
  createSingleItemPreviewDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { TemplateListCard } from '@/features/template/ui/template-list-card'
import { CmsButton } from '@/shared/ui/cms-button'
import { TemplateFullpageModal } from '@/features/template/ui/template-fullpage-modal'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/render-form-paragraph-body'
import {
  mergeLeftCardOrderByDragIds,
  normalizeLeftCardOrder,
  TemplateModalLeftContent,
  type TemplateModalLeftCardConfig,
} from '@/features/template/ui/template-modal-left-content'
import {
  TemplateModalRightNavigation,
  type TemplateModalRightNavigationConfig,
} from '@/features/template/ui/template-modal-right-navigation'
import { usePaymentStatementIssuanceEditor } from '@/features/template/hooks/use-payment-statement-issuance-editor'
import {
  PaymentStatementIssuanceEditorLeftColumn,
  PaymentStatementIssuanceEditorRightColumn,
} from '@/features/template/ui/form-set/payment-statement-issuance'
import { useQueryParams } from '@/shared/hooks/use-query-params'

const PAYMENT_STATEMENT_ISSUANCE_TEMPLATE_NAME = '지급조서(발급용)'

type IssuanceFormTabQuery = {
  mode?: string
  id?: string
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
    updatedAt: '-',
  },
  {
    key: 'issuance-2',
    no: 2,
    templateName: 'UJAT 교육일지',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-',
  },
  {
    key: 'issuance-3',
    no: 3,
    templateName: '강의보고서',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-',
  },
  {
    key: 'issuance-4',
    no: 4,
    templateName: '정산 신청서',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-',
  },
  {
    key: 'issuance-5',
    no: 5,
    templateName: '결과보고서',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-',
  },
]

const documentRows: IssuanceTemplateRow[] = [
  {
    key: 'document-payment-order-issue',
    no: 1,
    templateName: PAYMENT_STATEMENT_ISSUANCE_TEMPLATE_NAME,
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-',
  },
  {
    key: 'document-1',
    no: 2,
    templateName: '지출증빙서류(필수폼)',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-',
  },
  {
    key: 'document-2',
    no: 3,
    templateName: '휴가 인증서',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-',
  },
  {
    key: 'document-3',
    no: 4,
    templateName: '수료증',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-',
  },
  {
    key: 'document-4',
    no: 5,
    templateName: '감사 활동 인증서',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-',
  },
  {
    key: 'document-5',
    no: 6,
    templateName: '봉사 활동 인증서',
    creator: '시스템 생성',
    createdAt: '2025. 09. 15',
    updatedAt: '-',
  },
]

const issuanceRowsByKey = new Map<string, IssuanceTemplateRow>(
  [...issuanceRows, ...documentRows].map(row => [row.key, row])
)

export function IssuanceFormTab() {
  const { openWritingUserPreview } = useTemplateWritingPreview()
  const { params, setParams } = useQueryParams<IssuanceFormTabQuery>()
  const isPreviewOpen = params.mode === 'edit'
  const [selectedTemplate, setSelectedTemplate] = useState<IssuanceTemplateRow | null>(null)

  const isPaymentStatementIssuance =
    selectedTemplate?.templateName === PAYMENT_STATEMENT_ISSUANCE_TEMPLATE_NAME

  const paymentStatementVm = usePaymentStatementIssuanceEditor(
    isPreviewOpen && isPaymentStatementIssuance,
    selectedTemplate?.templateName ?? PAYMENT_STATEMENT_ISSUANCE_TEMPLATE_NAME
  )

  const openTemplatePreview = useCallback(
    (row: IssuanceTemplateRow) => {
      setParams({ mode: 'edit', id: row.key })
    },
    [setParams]
  )

  const closeTemplatePreview = useCallback(() => {
    setParams({ mode: undefined, id: undefined })
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
    setParams({ mode: undefined, id: undefined })
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
      ),
    },
  ]

  const baseLeftContentConfig = useMemo<TemplateModalLeftCardConfig[]>(
    () => [
      {
        id: 'issuance-card-1',
        title: '문서 기본 정보',
        required: true,
        description: '발급 문서 유형별 기본 제목과 안내문을 설정합니다.',
      },
      {
        id: 'issuance-card-2',
        title: '발급 대상/조건',
        description: '발급 대상과 노출 조건을 문서별로 설정하세요.',
      },
      {
        id: 'issuance-card-3',
        title: '출력 옵션',
        description: '서명, 직인, 발급번호 등 출력 요소를 문서 유형별로 구성합니다.',
      },
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
    items: orderedLeftContentConfig.map(item => ({ id: item.id, label: item.title })),
  }

  const applyOrderedCards = (orderedIds: string[]) => {
    setOrderedLeftContentConfig(prev => mergeLeftCardOrderByDragIds(prev, orderedIds))
  }

  const multiPageTemplateNames = new Set(['정산 신청서', '결과보고서', '강의보고서'])
  const getIssuancePreviewDraft = (templateName?: string): WritingFormDraft => {
    if (templateName != null && multiPageTemplateNames.has(templateName)) {
      return createSingleItemPreviewDraft()
    }
    return createDefaultSurveyDraft()
  }
  const noopUpdateParagraph: FormUpdateParagraph = () => {}
  const handleOpenUserPreview = () => {
    openWritingUserPreview({
      draft: getIssuancePreviewDraft(selectedTemplate?.templateName),
      updateParagraph: noopUpdateParagraph,
      headerTitle: selectedTemplate?.templateName ?? '발급 양식 미리보기',
      editorKind: 'survey',
    })
  }

  const handleModalPreview = () => {
    if (isPaymentStatementIssuance) {
      paymentStatementVm.handlePreview()
      return
    }
    handleOpenUserPreview()
  }

  return (
    <>
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
        open={isPreviewOpen}
        onClose={closeTemplatePreview}
        title={selectedTemplate?.templateName ?? '발급 양식 미리보기'}
        description="* 해당 폼은 기존 항목의 삭제가 불가하며, 수정에 제한이 있습니다."
        templateTabType="issuance"
        onPreview={handleModalPreview}
        onSave={isPaymentStatementIssuance ? paymentStatementVm.handleSave : undefined}
        leftContent={
          isPaymentStatementIssuance ? (
            <PaymentStatementIssuanceEditorLeftColumn vm={paymentStatementVm} />
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
    </>
  )
}
