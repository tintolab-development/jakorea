import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/paragraph-body-interaction-mode'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/ujat-program-application-form-institution-draft'
import { UjatProgramApplicationBasicInfoParagraph } from '@/features/template/ui/form-set/application-form/UJAT-institution/paragraphs/ujat-program-application-basic-info-paragraph'
import { UjatProgramApplicationGradeInfoParagraph } from '@/features/template/ui/form-set/application-form/UJAT-institution/paragraphs/ujat-program-application-grade-info-paragraph'
import { UjatProgramApplicationRegionParagraph } from '@/features/template/ui/form-set/application-form/UJAT-institution/paragraphs/ujat-program-application-region-paragraph'
import { UjatProgramApplicationGradeClassTimeParagraph } from '@/features/template/ui/form-set/application-form/UJAT-institution/paragraphs/ujat-program-application-grade-class-time-paragraph'
import { UjatProgramApplicationPreferredEducationScheduleParagraph } from '@/features/template/ui/form-set/application-form/UJAT-institution/paragraphs/ujat-program-application-preferred-education-schedule-paragraph'
import type {
  UjatProgramApplicationGradeClassTimeParagraphOptions,
  UjatProgramApplicationGradeInfoParagraphOptions,
} from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-program-application-institution-body-options'

/** 템플릿 편집기 — UJAT 프로그램 학교 신청 폼 시드 단락 본문 */
export function renderUjatProgramApplicationFormInstitutionParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined,
  gradeInfo?: UjatProgramApplicationGradeInfoParagraphOptions | null,
  gradeClassTime?: UjatProgramApplicationGradeClassTimeParagraphOptions | null,
  paragraphInteractionMode: ParagraphBodyInteractionMode = 'authoring'
): ReactNode | null {
  if (!enabled) return null
  switch (paragraph.id) {
    case UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.applicationRegion:
      return <UjatProgramApplicationRegionParagraph />
    case UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo:
      return <UjatProgramApplicationBasicInfoParagraph />
    case UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeApplicationInfo:
      return (
        <UjatProgramApplicationGradeInfoParagraph
          applicationGradeBlockIds={gradeInfo?.applicationGradeBlockIds ?? ['ujat-grade-solo']}
          applicationGradeByBlockId={gradeInfo?.applicationGradeByBlockId ?? {}}
          onApplicationGradeByBlockChange={gradeInfo?.onApplicationGradeByBlockChange ?? (() => {})}
          onRemoveApplicationGradeAtIndex={gradeInfo?.onRemoveApplicationGradeAtIndex ?? (() => {})}
        />
      )
    case UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeClassTime:
      return (
        <UjatProgramApplicationGradeClassTimeParagraph
          classTimeBlockIds={gradeClassTime?.classTimeBlockIds ?? ['ujat-class-time-solo']}
          onRemoveClassTimeBlockAtIndex={gradeClassTime?.onRemoveClassTimeBlockAtIndex ?? (() => {})}
          applicationGradeValuesForClassTime={gradeClassTime?.applicationGradeValuesForClassTime ?? []}
        />
      )
    case UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule:
      return (
        <UjatProgramApplicationPreferredEducationScheduleParagraph
          paragraphInteractionMode={paragraphInteractionMode}
        />
      )
    default:
      return null
  }
}
