import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import { ProgramApplicationFormInstitutionBasicInfoParagraph } from '@/features/template/ui/form-set/program-application-form-institution/paragraphs/institution-basic-info-paragraph'
import { ProgramApplicationFormInstitutionGuidanceParagraph } from '@/features/template/ui/form-set/program-application-form-institution/paragraphs/institution-guidance-paragraph'

/** 템플릿 편집기·미리보기에서 학교 신청 폼 시드 단락 본문을 `DetailInfoForm`으로 렌더 */
export function renderProgramApplicationFormInstitutionParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined
): ReactNode | null {
  if (!enabled) return null
  switch (paragraph.id) {
    case PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo:
      return <ProgramApplicationFormInstitutionBasicInfoParagraph />
    case PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance:
      return <ProgramApplicationFormInstitutionGuidanceParagraph />
    default:
      return null
  }
}
