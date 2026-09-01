import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@/features/template/model/program-application-form-individual-draft'
import { ProgramApplicationFormIndividualTeamInfoParagraph } from '@/features/template/ui/form-set/application-form/individual/paragraphs/individual-team-info-paragraph'

export type ProgramApplicationFormIndividualBodyOptions = {
  enabled: boolean
}

/** 템플릿 편집기·미리보기에서 개인 참여자 신청 폼 시드 단락 본문을 `DetailInfoForm`으로 렌더 */
export function renderProgramApplicationFormIndividualParagraphBody(
  paragraph: HorizontalTableParagraph,
  options: boolean | ProgramApplicationFormIndividualBodyOptions | undefined
): ReactNode | null {
  const resolvedOptions =
    typeof options === 'object' && options != null ? options : undefined
  const enabled = typeof options === 'boolean' ? options : resolvedOptions?.enabled
  if (!enabled) return null
  switch (paragraph.id) {
    case PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo:
      return <ProgramApplicationFormIndividualTeamInfoParagraph />
    default:
      return null
  }
}
