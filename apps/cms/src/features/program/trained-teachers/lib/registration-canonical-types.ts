/**
 * 교육받은 교사 신규 등록 — Overlay가 아닌 typed canonical snapshot.
 * 신규 저장·필수검사·CREATE 의 정본. Legacy overlay 는 importer 전용.
 */
import type {
  GeneralProgramCurriculumSessionRow,
  GeneralProgramScheduleDetailRow,
  GeneralProgramSurveyMenuKey,
  Program,
} from '@/types/domain'
import type { ProgramRegistrationParticipantSelection } from '@/features/template/lib/program-registration-editor-state'
import type {
  ProgramRegistrationEducationScheduleMode,
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'

export const TRAINED_TEACHERS_REGISTRATION_CANONICAL_VERSION = 1 as const

export type TrainedTeachersRegistrationEditorMeta = {
  educationStructure: ProgramRegistrationType
  sessionRound: ProgramRegistrationSessionRoundType
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
  curriculumSessionCount: number
  curriculumChartSessionCount: number
  scheduleCurriculumDetailCount: number
  scheduleCurriculumGroupCount: number
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  teacherTrainingEnabled: boolean
  participant: ProgramRegistrationParticipantSelection
}

export type TrainedTeachersRegistrationCommonCanonical = {
  title: string
  mainTitle: string
  titleEn: string
  announcementTitle: string
  detailedProgramId: string
  detailedProgramName: string
  textbookName: string
  businessArea: string
  educationProcess?: Program['educationProcess']
  ipOwned?: Program['ipOwned']
  courseDeliveredBy?: Program['courseDeliveredBy']
  partnerInvolvement: boolean
  sponsorManagementIds: string[]
  sponsorManagerContactIds: string[]
  venueKind?: 'inside' | 'outside' | 'other'
  venueDetail: string
  startDate?: string
  endDate?: string
  educationStructure: ProgramRegistrationType
  sessionRound: ProgramRegistrationSessionRoundType
  teacherTrainingEnabled: boolean
  educationJournalEnabled: boolean
  curriculumSessions: GeneralProgramCurriculumSessionRow[]
  scheduleDetails: GeneralProgramScheduleDetailRow[]
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  educationScheduleLines: string[]
  /** period 줄에서 산출. date이거나 파싱 불가하면 null. lines와 독립 편집하지 않는다. */
  educationScheduleRange: { start: string; end: string } | null
  generalSurveyMenuKeys: GeneralProgramSurveyMenuKey[]
  ips?: Program['ips']
  programCategory?: Program['programCategory']
  programChannel?: Program['programChannel']
  educationForm?: Program['type']
}

export type TrainedTeachersRecruitRange = {
  start?: string | null
  end?: string | null
}

export type TrainedTeachersRecruitFormState = {
  announcementPublished: string
  studentListRequired: string
  maxClassCount?: number
  maxScheduleCount?: number
  maxSessionsPerDay?: number
  programAnchorIso: string | null
  programRangeSeal: TrainedTeachersRecruitRange | null
  recruitAnchorIso: string | null
  recruitRangeSeal: TrainedTeachersRecruitRange | null
  finalAnnounceIso: string | null
  finalAnnounceMethod: string
  targetLevels: string[]
  targetLevelDetail: string
  inquiryContact: string
  inquiryTel: string
  inquiryEmail: string
  notesNotApplicable: boolean
  notes: string
  programDescription: string
  recruitmentGuide: string
  applicationMethod: string
  learningSupportContent: string
  additionalContentHtml: string
  otherNotes: string
  thumbFileObjectId?: number
  thumbContentUrl?: string
  thumbFileName?: string
  attachmentFileNames?: string[]
  attachmentFileObjectIds?: number[]
}

export type TrainedTeachersApplicationBasicInfoState = {
  applicationGrade: string
  classCount: string
  educationFormat: string
  educationPlace: string
  detailAddress: string
  totalStudents: string
  educationPlaceDetail: string
  teacherTel: string
  teacherMobile: string
  teacherEmail: string
  applicationReason: string
  otherRequests: string
}

export type TrainedTeachersPreferredScheduleBlock = {
  date: string | null
  session?: string
  times: Array<{ classPeriod: string; start: string | null; end: string | null }>
}

export type TrainedTeachersApplicationFormState = {
  basicInfo: TrainedTeachersApplicationBasicInfoState
  preferredSchedules: TrainedTeachersPreferredScheduleBlock[]
}

export type TrainedTeachersRegistrationCanonical = {
  schemaVersion: typeof TRAINED_TEACHERS_REGISTRATION_CANONICAL_VERSION
  editor: TrainedTeachersRegistrationEditorMeta
  common: TrainedTeachersRegistrationCommonCanonical
  recruit: TrainedTeachersRecruitFormState
  application: TrainedTeachersApplicationFormState
  /** UI overlay-shaped maps. CREATE는 쓰지 않고 임시저장 복원만 사용한다. */
  sidecar?: Record<string, unknown>
}

export const TRAINED_TEACHERS_REGISTRATION_SETTINGS_KEY =
  'trainedTeachersRegistrationCanonical' as const

export const TRAINED_TEACHERS_RECRUIT_EDITOR_KIND = 'trainedTeachersRecruitCanonical' as const
export const TRAINED_TEACHERS_APPLICATION_EDITOR_KIND =
  'trainedTeachersApplicationCanonical' as const
