import { useCallback, useMemo } from 'react'
import { TemplateListCard } from '@/shared/components/template/template-list-card'
import './template-form-tab.css'
import { TemplateFullpageModal } from '@/shared/components/template/template-fullpage-modal'
import { TemplateModalLeftContent } from '@/shared/components/template/template-modal-left-content'
import { TemplateModalRightNavigation } from '@/shared/components/template/template-modal-right-navigation'
import { BasicInfoCurriculumSection } from '@/features/template/ui/basic-info-curriculum-section'
import { EducationCurriculumSection } from '@/features/template/ui/education-curriculum-section'
import { KpiGoalsCurriculumSection } from '@/features/template/ui/kpi-goals-curriculum-section'
import { TemplateTable } from '@/features/template/ui/template-table'
import { WageInfoCurriculumSection } from '@/features/template/ui/wage-info-curriculum-section'
import { useTemplateModal } from '@/features/template/hooks/use-template-modal'
import { writingSections } from '@/features/template/model/template.schema'
import {
  buildRightNavigationConfig,
  buildTemplateConfig,
} from '@/features/template/lib/build-template-config'

export default function TemplateFormTab() {
  const curriculumSections = useMemo(
    () => ({
      '기본 정보': <BasicInfoCurriculumSection />,
      '사업 KPI 목표': <KpiGoalsCurriculumSection />,
      '임금 정보': <WageInfoCurriculumSection />,
      '교육 커리큘럼': <EducationCurriculumSection />,
    }),
    []
  )
  const buildBaseLeftContentConfig = useCallback(
    (selectedTemplate: Parameters<typeof buildTemplateConfig>[0]['selectedTemplate']) =>
      buildTemplateConfig({
        selectedTemplate,
        orderedLeftContentConfig: [],
        curriculumSections,
      }).baseLeftContentConfig,
    [curriculumSections]
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
        description="해당 폼은 기존 항목의 삭제가 불가하며, 수정에 제한이 있습니다."
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
