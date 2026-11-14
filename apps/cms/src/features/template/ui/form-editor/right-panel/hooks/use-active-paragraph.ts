import { useMemo } from 'react'
import type {
  WritingFormDraft,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { isAgreementLockedSystemParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  formEditorRightPanelSectionTitle,
  paragraphKindLabel,
} from '@/features/template/model/writing-form/paragraph-labels'
import { paragraphVariantLabel } from '@/features/template/ui/form-editor/right-panel/config/paragraph-editor.registry'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import {
  paragraphDetailSelectValue,
  paragraphKindSelectValue,
} from '@/features/template/model/writing-form/paragraph-selectors'

/** 템플릿 관리 우측 패널 — 제목형(설문 제목형) 단락 섹션 타이틀 (시안 5767:41434·5767:42989 등) */
export const TEMPLATE_TITLE_PARAGRAPH_SECTION_TITLE = '제목 없음'

export function isTitleWithPeriodSectionParagraph(p: WritingFormParagraph): boolean {
  return p.kind === 'description' && p.variant === 'survey_title_with_period'
}

export function useActiveParagraphState({
  draft,
  activeParagraphId,
  activeParagraph: activeParagraphProp,
  structureLockedParagraphIds,
}: {
  draft: WritingFormDraft
  activeParagraphId: string | null
  /** 지정 시 draft.paragraphs 전체 스캔 대신 활성 단락만 구독 */
  activeParagraph?: WritingFormParagraph | null
  structureLockedParagraphIds?: ReadonlySet<string>
}) {
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const draftActiveParagraph =
    activeParagraphProp === undefined
      ? draft.paragraphs.find(paragraph => paragraph.id === activeParagraphId) ?? null
      : null

  return useMemo(() => {
    const active =
      activeParagraphProp !== undefined ? activeParagraphProp : draftActiveParagraph
    const structureLockedActive =
      activeParagraphId != null && (structureLockedParagraphIds?.has(activeParagraphId) ?? false)

    const outline =
      active && active.kind === 'description' && active.variant === 'closing'
        ? `${paragraphKindLabel(active)}_${paragraphVariantLabel(active)}`
        : active && isTemplateManagementScreen && isTitleWithPeriodSectionParagraph(active)
          ? TEMPLATE_TITLE_PARAGRAPH_SECTION_TITLE
          : active
            ? formEditorRightPanelSectionTitle(active)
            : ''

    const activeKindValue = active ? paragraphKindSelectValue(active) : null
    const activeDetailValue = active ? paragraphDetailSelectValue(active) : null
    const activeKindLocked = active ? isAgreementLockedSystemParagraph(active) : false

    return {
      active,
      structureLockedActive,
      outline,
      activeKindValue,
      activeDetailValue,
      activeKindLocked,
    }
  }, [
    activeParagraphId,
    activeParagraphProp,
    structureLockedParagraphIds,
    draftActiveParagraph,
    isTemplateManagementScreen,
  ])
}
