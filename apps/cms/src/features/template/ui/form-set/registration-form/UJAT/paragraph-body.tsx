import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { UJAT_PROGRAM_REGISTRATION_IDS } from '@/features/template/model/ujat-program-registration-draft'
import { UjatBasicInfoParagraph } from '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-basic-info-paragraph'
import { UjatBusinessKpiParagraph } from '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-business-kpi-paragraph'
import { UjatEducationClassCapacityByRegionParagraph } from '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-education-class-capacity-by-region-paragraph'
import { UjatEducationScheduleSettingsParagraph } from '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-education-schedule-settings-paragraph'
import { UjatFirstHalfEducationScheduleParagraph } from '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-first-half-education-schedule-paragraph'
import { UjatGradeWiseClassTimeParagraph } from '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-grade-wise-class-time-paragraph'
import { UjatPaymentInfoParagraph } from '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-payment-info-paragraph'
import type { UjatGradeWiseClassTimeParagraphOptions } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-body-options'

export function renderUjatProgramRegistrationParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled?: boolean,
  gradeWiseClassTime?: UjatGradeWiseClassTimeParagraphOptions | null
) {
  if (!enabled) return null

  switch (paragraph.id) {
    case UJAT_PROGRAM_REGISTRATION_IDS[0]:
      return <UjatBasicInfoParagraph />
    case UJAT_PROGRAM_REGISTRATION_IDS[1]:
      return <UjatBusinessKpiParagraph />
    case UJAT_PROGRAM_REGISTRATION_IDS[2]:
      return <UjatPaymentInfoParagraph />
    case UJAT_PROGRAM_REGISTRATION_IDS[3]:
      return <UjatFirstHalfEducationScheduleParagraph />
    case UJAT_PROGRAM_REGISTRATION_IDS[4]:
      return <UjatFirstHalfEducationScheduleParagraph />
    case UJAT_PROGRAM_REGISTRATION_IDS[5]:
      return <UjatEducationScheduleSettingsParagraph />
    case UJAT_PROGRAM_REGISTRATION_IDS[6]:
      return <UjatEducationClassCapacityByRegionParagraph />
    case UJAT_PROGRAM_REGISTRATION_IDS[7]:
      return (
        <UjatGradeWiseClassTimeParagraph
          slotCount={Math.max(1, gradeWiseClassTime?.lessonTimeSlotCount ?? 1)}
        />
      )
    default:
      return null
  }
}
