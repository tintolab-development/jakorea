import type { ReactNode } from 'react'
import type { TemplateModalLeftCardConfig } from '@/shared/components/template/template-modal-left-content'
import type { TemplateModalRightNavigationConfig } from '@/shared/components/template/template-modal-right-navigation'
import {
  TEMPLATE_MODAL_SECTIONS_BY_VARIANT,
  type TemplateRow,
  type TemplateVariant,
} from '@/features/template/model/template.schema'

interface BuildTemplateConfigParams {
  selectedTemplate: TemplateRow | null
  orderedLeftContentConfig: TemplateModalLeftCardConfig[]
  curriculumSection?: ReactNode
}

const resolveCardDescription = (index: number): string => {
  if (index === 0) return '선택형 공통 필드 노출영역입니다.'
  if (index === 1) return '행별 템플릿 분기 시 카드 내부 폼 컴포넌트를 교체해서 사용하세요.'
  return '카드 단위로 필요한 입력 컴포넌트를 추가해 템플릿을 구성할 수 있습니다.'
}

const resolveVariant = (selectedTemplate: TemplateRow | null): TemplateVariant =>
  selectedTemplate?.variant ?? 'default'

export const buildBaseLeftContentConfig = (
  selectedTemplate: TemplateRow | null,
  curriculumSection?: ReactNode
): TemplateModalLeftCardConfig[] => {
  const variant = resolveVariant(selectedTemplate)
  const sections = TEMPLATE_MODAL_SECTIONS_BY_VARIANT[variant]
  const isCurriculumTemplate = variant === 'curriculum'

  return sections.map((title, index) => ({
    id: `card-${index + 1}`,
    title,
    required: index === 0,
    description: resolveCardDescription(index),
    children: isCurriculumTemplate && title === '기본 정보' ? curriculumSection : undefined,
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
  curriculumSection,
}: BuildTemplateConfigParams): {
  baseLeftContentConfig: TemplateModalLeftCardConfig[]
  rightNavigationConfig: TemplateModalRightNavigationConfig
} => {
  const baseLeftContentConfig = buildBaseLeftContentConfig(selectedTemplate, curriculumSection)
  const rightNavigationConfig = buildRightNavigationConfig(orderedLeftContentConfig)

  return {
    baseLeftContentConfig,
    rightNavigationConfig,
  }
}
