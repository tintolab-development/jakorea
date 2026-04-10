import type { ReactNode } from 'react'
import type { TemplateModalLeftCardConfig } from '@/shared/components/template/template-modal-left-content'
import type { TemplateModalRightNavigationConfig } from '@/shared/components/template/template-modal-right-navigation'
import {
  CURRICULUM_MODAL_SECTIONS,
  TEMPLATE_MODAL_SECTIONS_BY_VARIANT,
  type CurriculumModalSectionTitle,
  type TemplateRow,
  type TemplateVariant,
} from '@/features/template/model/template.schema'

interface BuildTemplateConfigParams {
  selectedTemplate: TemplateRow | null
  orderedLeftContentConfig: TemplateModalLeftCardConfig[]
  /** 교육 커리큘럼 variant 전용: 섹션 타이틀 → 본문 슬롯 */
  curriculumSections?: Partial<Record<CurriculumModalSectionTitle, ReactNode>>
}

const resolveCardDescription = (index: number): string => {
  if (index === 0) return '선택형 공통 필드 노출영역입니다.'
  if (index === 1) return '행별 템플릿 분기 시 카드 내부 폼 컴포넌트를 교체해서 사용하세요.'
  return '카드 단위로 필요한 입력 컴포넌트를 추가해 템플릿을 구성할 수 있습니다.'
}

const resolveVariant = (selectedTemplate: TemplateRow | null): TemplateVariant =>
  selectedTemplate?.variant ?? 'default'

const isCurriculumSectionTitle = (title: string): title is CurriculumModalSectionTitle =>
  (CURRICULUM_MODAL_SECTIONS as readonly string[]).includes(title)

export const buildBaseLeftContentConfig = (
  selectedTemplate: TemplateRow | null,
  curriculumSections?: Partial<Record<CurriculumModalSectionTitle, ReactNode>>
): TemplateModalLeftCardConfig[] => {
  const variant = resolveVariant(selectedTemplate)
  const sections = TEMPLATE_MODAL_SECTIONS_BY_VARIANT[variant]
  const isCurriculumTemplate = variant === 'curriculum'

  return sections.map((title, index) => ({
    id: `card-${index + 1}`,
    title,
    required: isCurriculumTemplate ? true : index === 0,
    description: isCurriculumTemplate ? '설명 입력' : resolveCardDescription(index),
    children:
      isCurriculumTemplate && isCurriculumSectionTitle(title)
        ? curriculumSections?.[title]
        : undefined,
  }))
}

export const buildRightNavigationConfig = (
  orderedLeftContentConfig: TemplateModalLeftCardConfig[]
): TemplateModalRightNavigationConfig => ({
  sectionTitle: '커스텀 필드',
  items: orderedLeftContentConfig.map(item => ({ id: item.id, label: item.title })),
})

export const buildTemplateConfig = ({
  selectedTemplate,
  orderedLeftContentConfig,
  curriculumSections,
}: BuildTemplateConfigParams): {
  baseLeftContentConfig: TemplateModalLeftCardConfig[]
  rightNavigationConfig: TemplateModalRightNavigationConfig
} => {
  const baseLeftContentConfig = buildBaseLeftContentConfig(selectedTemplate, curriculumSections)
  const rightNavigationConfig = buildRightNavigationConfig(orderedLeftContentConfig)

  return {
    baseLeftContentConfig,
    rightNavigationConfig,
  }
}
