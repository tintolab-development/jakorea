import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/ujat-program-application-form-institution-draft'
import { UjatProgramApplicationBasicInfoParagraph } from '@/features/template/ui/form-set/application-form/UJAT-institution/paragraphs/ujat-program-application-basic-info-paragraph'
import { UjatProgramApplicationGradeInfoParagraph } from '@/features/template/ui/form-set/application-form/UJAT-institution/paragraphs/ujat-program-application-grade-info-paragraph'
import { UjatProgramApplicationRegionParagraph } from '@/features/template/ui/form-set/application-form/UJAT-institution/paragraphs/ujat-program-application-region-paragraph'

/** 템플릿 편집기 — UJAT 프로그램 학교 신청 폼 시드 단락 본문 */
export function renderUjatProgramApplicationFormInstitutionParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined
): ReactNode | null {
  if (!enabled) return null
  switch (paragraph.id) {
    case UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.applicationRegion:
      return <UjatProgramApplicationRegionParagraph />
    case UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo:
      return <UjatProgramApplicationBasicInfoParagraph />
    case UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeApplicationInfo:
      return <UjatProgramApplicationGradeInfoParagraph />
    default:
      return null
  }
}
