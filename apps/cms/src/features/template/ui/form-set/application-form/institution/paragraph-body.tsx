import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import { ProgramApplicationFormInstitutionBasicInfoParagraph } from '@/features/template/ui/form-set/application-form/institution/paragraphs/institution-basic-info-paragraph'
import { ProgramApplicationFormInstitutionGuidanceParagraph } from '@/features/template/ui/form-set/application-form/institution/paragraphs/institution-guidance-paragraph'
import { ProgramApplicationFormInstitutionSexOffenseConsentInquiryParagraph } from '@/features/template/ui/form-set/application-form/institution/paragraphs/institution-sex-offense-consent-inquiry-paragraph'
import { ProgramApplicationFormInstitutionSexOffenseConsentSubmissionParagraph } from '@/features/template/ui/form-set/application-form/institution/paragraphs/institution-sex-offense-consent-submission-paragraph'

export type ProgramApplicationFormInstitutionBodyOptions = {
  enabled: boolean
  readOnlyPreview?: boolean
  /** 템플릿 작성 모드 — 자동 반영 필드는 힌트만 표시 */
  isTemplateAuthoringMode?: boolean
  paragraph?: HorizontalTableParagraph
  onParagraphChange?: (next: HorizontalTableParagraph) => void
}

/** 템플릿 편집기·미리보기에서 학교 신청 폼 시드 단락 본문을 `DetailInfoForm`으로 렌더 */
export function renderProgramApplicationFormInstitutionParagraphBody(
  paragraph: HorizontalTableParagraph,
  options: boolean | ProgramApplicationFormInstitutionBodyOptions | undefined
): ReactNode | null {
  const resolvedOptions =
    typeof options === 'object' && options != null ? options : undefined
  const enabled = typeof options === 'boolean' ? options : resolvedOptions?.enabled
  if (!enabled) return null
  switch (paragraph.id) {
    case PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo:
      return (
        <ProgramApplicationFormInstitutionBasicInfoParagraph
          isTemplateAuthoringMode={resolvedOptions?.isTemplateAuthoringMode === true}
        />
      )
    case PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance:
      return (
        <ProgramApplicationFormInstitutionGuidanceParagraph
          paragraph={resolvedOptions?.paragraph ?? paragraph}
          onParagraphChange={resolvedOptions?.onParagraphChange}
        />
      )
    case PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentSubmissionRequest:
      return <ProgramApplicationFormInstitutionSexOffenseConsentSubmissionParagraph />
    case PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod:
      return <ProgramApplicationFormInstitutionSexOffenseConsentInquiryParagraph />
    default:
      return null
  }
}
