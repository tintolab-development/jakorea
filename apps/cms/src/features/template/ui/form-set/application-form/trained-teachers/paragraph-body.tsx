import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@/features/template/model/program-application-form-trained-teachers-draft'
import { TrainedTeachersProgramApplicationBasicInfoParagraph } from '@/features/template/ui/form-set/application-form/trained-teachers/paragraphs/basic-info-paragraph'
import { TrainedTeachersProgramApplicationPreferredScheduleParagraph } from '@/features/template/ui/form-set/application-form/trained-teachers/paragraphs/preferred-schedule-paragraph'

/** 교육받은 교사 프로그램 참여자 신청 폼 — 시드 단락 본문 */
export function renderTrainedTeachersProgramApplicationParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined,
  isTemplateAuthoringMode = false
): ReactNode | null {
  if (!enabled) return null

  switch (paragraph.id) {
    case PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo:
      return (
        <TrainedTeachersProgramApplicationBasicInfoParagraph
          isTemplateAuthoringMode={isTemplateAuthoringMode}
        />
      )
    case PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule:
      return <TrainedTeachersProgramApplicationPreferredScheduleParagraph />
    default:
      return null
  }
}
