/**
 * Legacy Overlay → Canonical 읽기 전용 importer.
 * 정상 등록 persist 는 이 모듈의 결과를 CREATE 빌더에만 넘긴다.
 */
import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import type { GeneralRegistrationEditorExtras } from '@/features/program/general/lib/registration-overlay-to-program'
import {
  applyGeneralRegistrationOverlayToProgram,
  normalizeRegistrationOverlayForApply,
} from '@/features/program/general/lib/registration-overlay-to-program'
import { resolveTrainedTeacherEducationJournalEnabled } from '@/features/program/general/lib/registration-local-save'
import { getProgramRegistrationOverlayRecord } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { collectTrainedTeachersApplicationFormState } from './application-form-state'
import { collectTrainedTeachersRecruitFormState } from './recruit-form-state'
import {
  TRAINED_TEACHERS_REGISTRATION_CANONICAL_VERSION,
  type TrainedTeachersRegistrationCanonical,
  type TrainedTeachersRegistrationCommonCanonical,
  type TrainedTeachersRegistrationEditorMeta,
} from './registration-canonical-types'

const TEXTBOOK_KEY = 'trainedTeachersRegistration.basicInfo.textbookName'
const CONTACT_IDS_TT = 'trainedTeachersRegistration.basicInfo.managerContactIds'
const CONTACT_IDS_GEN = 'generalRegistration.basicInfo.managerContactIds'
const JOURNAL_KEY = 'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled'

function stringList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  return value.map(item => String(item).trim()).filter(id => id !== '')
}

function createImportBaseline(id: string, editor: TrainedTeachersRegistrationEditorMeta): Program {
  const y = dayjs().year()
  return {
    id,
    sponsorId: '',
    title: '',
    mainTitle: '',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    startDate: dayjs(`${y}-04-01`).startOf('day').toISOString(),
    endDate: dayjs(`${y}-12-31`).endOf('day').toISOString(),
    applicationStartDate: dayjs().startOf('day').toISOString(),
    applicationEndDate: dayjs().add(30, 'day').endOf('day').toISOString(),
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    studentListRequired: 'required',
    generalProgramAudience: 'organization',
    generalParticipantTypes: ['school_institution'],
    generalProgramEducationStructure: editor.educationStructure,
    generalProgramSessionRound: editor.sessionRound,
    generalSurveyMenuKeys: [],
    generalCommonInfo: {
      educationScheduleMode: editor.educationScheduleMode,
      educationScheduleLines: [],
      curriculumSessions: [],
      scheduleDetails: [],
      teacherTrainingEnabled: editor.teacherTrainingEnabled,
      educationJournalEnabled: false,
    },
    rounds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function extractCommon(
  program: Program,
  overlay: Record<string, unknown>,
  editor: TrainedTeachersRegistrationEditorMeta
): TrainedTeachersRegistrationCommonCanonical {
  const explicitContacts = stringList(overlay[CONTACT_IDS_TT]) ?? stringList(overlay[CONTACT_IDS_GEN])
  const textbookName =
    typeof overlay[TEXTBOOK_KEY] === 'string' ? overlay[TEXTBOOK_KEY] : (program.textbookName ?? '')
  return {
    title: program.title,
    mainTitle: program.mainTitle ?? program.title,
    titleEn: program.titleEn ?? '',
    announcementTitle: program.generalCommonInfo?.announcementTitle ?? program.title,
    detailedProgramId: program.detailedProgramId ?? '',
    detailedProgramName: program.generalCommonInfo?.detailedProgramName ?? '',
    textbookName,
    businessArea: program.businessArea ?? '',
    educationProcess: program.educationProcess,
    ipOwned: program.ipOwned,
    courseDeliveredBy: program.courseDeliveredBy,
    partnerInvolvement: program.partnerInvolvement !== false,
    sponsorManagementIds: program.generalCommonInfo?.sponsorManagementIds ?? [],
    sponsorManagerContactIds:
      explicitContacts ?? program.generalCommonInfo?.sponsorManagerContactIds ?? [],
    venueKind: program.generalCommonInfo?.venueKind,
    venueDetail: program.generalCommonInfo?.venueDetail ?? '',
    startDate: typeof program.startDate === 'string' ? program.startDate : undefined,
    endDate: typeof program.endDate === 'string' ? program.endDate : undefined,
    educationStructure: editor.educationStructure,
    sessionRound: editor.sessionRound,
    teacherTrainingEnabled: editor.teacherTrainingEnabled,
    educationJournalEnabled: resolveTrainedTeacherEducationJournalEnabled(
      overlay[JOURNAL_KEY],
      program.generalCommonInfo?.educationJournalEnabled
    ),
    curriculumSessions: [...(program.generalCommonInfo?.curriculumSessions ?? [])],
    scheduleDetails: [...(program.generalCommonInfo?.scheduleDetails ?? [])],
    educationScheduleMode: editor.educationScheduleMode,
    educationScheduleLines: [...(program.generalCommonInfo?.educationScheduleLines ?? [])],
    generalSurveyMenuKeys: [...(program.generalSurveyMenuKeys ?? [])],
    ips: program.ips ?? undefined,
    programCategory: program.programCategory ?? undefined,
    programChannel: program.programChannel ?? undefined,
    educationForm: program.type,
  }
}

export function importLegacyOverlayToTrainedTeachersCanonical(args: {
  id: string
  editor: TrainedTeachersRegistrationEditorMeta
  overlay?: Record<string, unknown>
}): TrainedTeachersRegistrationCanonical {
  const overlay = args.overlay ?? getProgramRegistrationOverlayRecord()
  const normalized = normalizeRegistrationOverlayForApply(overlay, 'trainedTeachers')
  const extras: GeneralRegistrationEditorExtras = {
    programType: args.editor.educationStructure,
    sessionRoundType: args.editor.sessionRound,
    educationFormScheduleDetail: args.editor.educationFormScheduleDetail,
    participationScheduleDetail: args.editor.participationScheduleDetail,
    ipsScheduleDetail: args.editor.ipsScheduleDetail,
    curriculumSessionCount: args.editor.curriculumSessionCount,
    curriculumChartSessionCount: args.editor.curriculumChartSessionCount,
    scheduleCurriculumDetailCount: args.editor.scheduleCurriculumDetailCount,
    educationScheduleMode: args.editor.educationScheduleMode,
    scheduleCurriculumPreEducation: args.editor.teacherTrainingEnabled,
    teacherTrainingEnabled: args.editor.teacherTrainingEnabled,
    participantOrganization: true,
    isTrainedTeachers: true,
  }
  const applied = applyGeneralRegistrationOverlayToProgram(
    createImportBaseline(args.id, args.editor),
    normalized,
    extras
  )
  return {
    schemaVersion: TRAINED_TEACHERS_REGISTRATION_CANONICAL_VERSION,
    editor: args.editor,
    common: extractCommon(applied, overlay, args.editor),
    recruit: collectTrainedTeachersRecruitFormState(overlay),
    application: collectTrainedTeachersApplicationFormState(),
  }
}
