import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { UJAT_PROGRAM_REGISTRATION_IDS } from '@/features/template/model/ujat-program-registration-draft'
import { UjatBasicInfoParagraph } from '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-basic-info-paragraph'
import { UjatBusinessKpiParagraph } from '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-business-kpi-paragraph'
import { UjatEducationClassCapacityByRegionParagraph } from '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-education-class-capacity-by-region-paragraph'
import { UjatEducationScheduleSettingsParagraph } from '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-education-schedule-settings-paragraph'
import { UjatHalfEducationScheduleParagraph } from '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-first-half-education-schedule-paragraph'
import { UjatWageInfoParagraph } from '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-wage-info-paragraph'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

export function renderUjatProgramRegistrationParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled?: boolean,
  options?: Pick<
    RenderFormParagraphBodyOptions,
    | 'ujatProgramRegistrationBasicInfoForm'
    | 'ujatProgramRegistrationBasicInfoOverlayFree'
    | 'ujatProgramRegistrationEducationScheduleForm'
  >
) {
  if (!enabled) return null

  switch (paragraph.id) {
    case UJAT_PROGRAM_REGISTRATION_IDS[0]:
      return (
        <UjatBasicInfoParagraph
          infoForm={options?.ujatProgramRegistrationBasicInfoForm}
          overlayFree={options?.ujatProgramRegistrationBasicInfoOverlayFree}
        />
      )
    case UJAT_PROGRAM_REGISTRATION_IDS[1]:
      return (
        <UjatBusinessKpiParagraph infoForm={options?.ujatProgramRegistrationBasicInfoForm} />
      )
    case UJAT_PROGRAM_REGISTRATION_IDS[2]:
      return <UjatWageInfoParagraph infoForm={options?.ujatProgramRegistrationBasicInfoForm} />
    case UJAT_PROGRAM_REGISTRATION_IDS[3]:
      return (
        <UjatHalfEducationScheduleParagraph
          half="h1"
          scheduleForm={options?.ujatProgramRegistrationEducationScheduleForm}
        />
      )
    case UJAT_PROGRAM_REGISTRATION_IDS[4]:
      return (
        <UjatHalfEducationScheduleParagraph
          half="h2"
          scheduleForm={options?.ujatProgramRegistrationEducationScheduleForm}
        />
      )
    case UJAT_PROGRAM_REGISTRATION_IDS[5]:
      return (
        <UjatEducationScheduleSettingsParagraph
          scheduleForm={options?.ujatProgramRegistrationEducationScheduleForm}
        />
      )
    case UJAT_PROGRAM_REGISTRATION_IDS[6]:
      return (
        <UjatEducationClassCapacityByRegionParagraph
          infoForm={options?.ujatProgramRegistrationBasicInfoForm}
        />
      )
    default:
      return null
  }
}
