import {
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { UJAT_REGISTRATION_SECTION_IDS } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-section-ids'
import { UJAT_REGISTRATION_SECTION_META } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-section-meta'

export const UJAT_PROGRAM_REGISTRATION_IDS = UJAT_REGISTRATION_SECTION_IDS

export const UJAT_PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS = new Set<string>(
  UJAT_PROGRAM_REGISTRATION_IDS
)

function createSeedParagraph(
  id: string,
  title: string,
  paragraphDescription: string
): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    id,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    answerRequired: true,
    participatesInTitleNumbering: true,
    paragraphTitle: title,
    paragraphDescription,
    tableFlavor: 'text',
    columnHeaders: ['항목', '내용'],
    dataRows: [['', '']],
    columnFields: [],
    fieldDataRows: [],
    bottomText: '',
    showBottomText: false,
    showBottomConsent: false,
    bottomConsent: 'agree',
  })
}

export function createUjatProgramRegistrationDraft(): WritingFormDraft {
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [
      createSeedParagraph(
        UJAT_PROGRAM_REGISTRATION_IDS[0],
        UJAT_REGISTRATION_SECTION_META.basic.title,
        UJAT_REGISTRATION_SECTION_META.basic.description
      ),
      createSeedParagraph(
        UJAT_PROGRAM_REGISTRATION_IDS[1],
        UJAT_REGISTRATION_SECTION_META.businessKpi.title,
        UJAT_REGISTRATION_SECTION_META.businessKpi.description
      ),
      createSeedParagraph(
        UJAT_PROGRAM_REGISTRATION_IDS[2],
        UJAT_REGISTRATION_SECTION_META.payment.title,
        UJAT_REGISTRATION_SECTION_META.payment.description
      ),
      createSeedParagraph(
        UJAT_PROGRAM_REGISTRATION_IDS[3],
        UJAT_REGISTRATION_SECTION_META.firstHalfEducationSchedule.title,
        UJAT_REGISTRATION_SECTION_META.firstHalfEducationSchedule.description
      ),
      createSeedParagraph(
        UJAT_PROGRAM_REGISTRATION_IDS[4],
        UJAT_REGISTRATION_SECTION_META.secondHalfEducationSchedule.title,
        UJAT_REGISTRATION_SECTION_META.secondHalfEducationSchedule.description
      ),
      createSeedParagraph(
        UJAT_PROGRAM_REGISTRATION_IDS[5],
        UJAT_REGISTRATION_SECTION_META.educationScheduleSettings.title,
        UJAT_REGISTRATION_SECTION_META.educationScheduleSettings.description
      ),
      createSeedParagraph(
        UJAT_PROGRAM_REGISTRATION_IDS[6],
        UJAT_REGISTRATION_SECTION_META.educationClassCapacityByRegion.title,
        UJAT_REGISTRATION_SECTION_META.educationClassCapacityByRegion.description
      ),
      createSeedParagraph(
        UJAT_PROGRAM_REGISTRATION_IDS[7],
        UJAT_REGISTRATION_SECTION_META.gradeWiseClassTime.title,
        UJAT_REGISTRATION_SECTION_META.gradeWiseClassTime.description
      ),
    ],
  })
}
