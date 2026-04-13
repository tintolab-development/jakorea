import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { TemplateListCard } from '@/features/template/ui/template-list-card'
import { CmsButton } from '@/shared/ui/cms-button'
import { TemplateFullpageModal } from '@/features/template/ui/template-fullpage-modal'
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
    templateName: '수료증 발급 안내문',
    creator: '시스템 생성',
    createdAt: '2026. 09. 15',
    updatedAt: '-',
  },
  {
    key: 'issuance-2',
    no: 2,
    templateName: '활동확인서 발급 요청서',
    creator: '시스템 생성',
    createdAt: '2026. 09. 15',
    updatedAt: '-',
  },
]

export function IssuanceFormTab() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<IssuanceTemplateRow | null>(null)

  const openTemplatePreview = (row: IssuanceTemplateRow) => {
    setSelectedTemplate(row)
    setIsPreviewOpen(true)
  }

  const closeTemplatePreview = () => {
    setIsPreviewOpen(false)
    setSelectedTemplate(null)
  }

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

  return (
    <>
      <div className="template-form-tab__content">
        <TemplateListCard
          title="발급 양식"
          description="발급 요청 및 안내에 사용하는 기본 양식입니다."
        >
          <Table
            className="cms-data-table cms-data-table--border"
            rowKey="key"
            columns={issuanceColumns}
            dataSource={issuanceRows}
            pagination={false}
          />
        </TemplateListCard>
      </div>

      <TemplateFullpageModal
        open={isPreviewOpen}
        onClose={closeTemplatePreview}
        title={selectedTemplate?.templateName ?? '발급 양식 미리보기'}
        description="발급 양식은 문서별 기본 설정과 출력 옵션을 공통으로 사용합니다."
        templateTabType="issuance"
        leftContent={
          <TemplateModalLeftContent
            config={orderedLeftContentConfig}
            selectedCardId={activeCardId}
            onSelectCard={setActiveCardId}
            onReorderCards={cards => applyOrderedCards(cards.map(card => card.id))}
          />
        }
        rightNavigation={
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
        }
      />
    </>
  )
}
