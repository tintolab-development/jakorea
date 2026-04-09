import { useCallback, useMemo } from 'react'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { TemplateListCard } from '@/shared/components/template/template-list-card'
import { IssuanceFormTab } from './issuance-form-tab'
import './template-form-tab.css'
import { TemplateFullpageModal } from '@/shared/components/template/template-fullpage-modal'
import { TemplateModalLeftContent } from '@/shared/components/template/template-modal-left-content'
import { TemplateModalRightNavigation } from '@/shared/components/template/template-modal-right-navigation'
import { BasicInfoCurriculumSection } from './components/basic-info-curriculum-section'
import { TemplateTable } from './components/template-table'
import { useTemplateModal } from './hooks/use-template-modal'
import { writingSections } from './schemas/template.schema'
import { buildRightNavigationConfig, buildTemplateConfig } from './utils/build-template-config'

export default function TemplateFormTab() {
  const { params } = useQueryParams<{ tab?: string }>()
  const curriculumSection = useMemo(() => <BasicInfoCurriculumSection />, [])
  const buildBaseLeftContentConfig = useCallback(
    (selectedTemplate: Parameters<typeof buildTemplateConfig>[0]['selectedTemplate']) =>
      buildTemplateConfig({
        selectedTemplate,
        orderedLeftContentConfig: [],
        curriculumSection,
      }).baseLeftContentConfig,
    [curriculumSection]
  )

  const {
    isPreviewOpen,
    selectedTemplate,
    orderedLeftContentConfig,
    activeCardId,
    setActiveCardId,
    openTemplatePreview,
    closeTemplatePreview,
    applyOrderedCards,
  } = useTemplateModal({
    buildBaseLeftContentConfig,
  })

  const rightNavigationConfig = useMemo(
    () => buildRightNavigationConfig(orderedLeftContentConfig),
    [orderedLeftContentConfig]
  )

  if (params.tab === 'issuance-form') {
    return <IssuanceFormTab />
  }

  return (
    <>
      <div className="template-form-tab__content">
        {writingSections.map(section => (
          <TemplateListCard
            key={section.key}
            title={section.title}
            description={section.description}
          >
            <TemplateTable rows={section.rows} onPreview={openTemplatePreview} />
          </TemplateListCard>
        ))}
      </div>

      <TemplateFullpageModal
        open={isPreviewOpen}
        onClose={closeTemplatePreview}
        title={selectedTemplate?.templateName ?? '양식 미리보기'}
        description="해당 폼은 각 항목 삭제가 불가하며, 수정에 제한이 있습니다."
        templateTabType="writing"
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
          />
        }
      />
    </>
  )
}
