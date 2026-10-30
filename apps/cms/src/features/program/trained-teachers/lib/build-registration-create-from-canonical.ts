/**
 * 교육받은 교사 신규 등록 CREATE — canonical values → Program.
 * Overlay apply 를 persist SSOT 로 쓰지 않는다.
 */
import dayjs from 'dayjs'
import { educationScheduleRangeFromPeriodLines } from '@/features/template/lib/format-education-schedule-line'
import type {
  GeneralProgramCurriculumSessionRow,
  GeneralProgramScheduleDetailRow,
  Program,
} from '@/types/domain'
import { resolvePersistedProgramTargetLevels } from '@/features/program/shared/lib/program-detail-info-constants'
import { collectTrainedTeachersCommonInfoState } from './collect-registration-common-info-state'
import { importLegacyOverlayToTrainedTeachersCanonical } from './import-legacy-registration-overlay'
import { collectTrainedTeachersApplicationState } from './registration-rhf-application'
import { applyTrainedTeachersRecruitToProgram } from './recruit-form-state'
import { collectTrainedTeachersRecruitmentState } from './registration-rhf-recruitment'
import { educationFormLabelFromValue } from '@/features/program/general/lib/overlay-phase1/common-info-domain'
import { registrationPendingSnapshotId } from '@/features/program/general/lib/registration-local-save'
import {
  TRAINED_TEACHERS_REGISTRATION_CANONICAL_VERSION,
  TRAINED_TEACHERS_REGISTRATION_SETTINGS_KEY,
  type TrainedTeachersRegistrationCanonical,
} from './registration-canonical-types'
import { peekTrainedTeachersRegistrationRhf } from './registration-rhf-api'
import {
  fillEmptyTrainedTeachersTitlesFromOverlay,
  isTrainedTeachersRegistrationCanonicalSnapshot,
  trainedTeachersRhfToEditorMeta,
  type TrainedTeachersRegistrationRhfValues,
} from './registration-rhf-values'

function withoutAssignment<T extends GeneralProgramCurriculumSessionRow | GeneralProgramScheduleDetailRow>(
  row: T
): T {
  const next = { ...row }
  delete (next as { assignmentEnabled?: boolean }).assignmentEnabled
  delete (next as { assignmentPeriod?: string }).assignmentPeriod
  return next
}

function scheduleDetailFieldsFromEditor(
  editor: TrainedTeachersRegistrationCanonical['editor'],
  educationForm: Program['type'] | undefined
) {
  return {
    educationFormScheduleDetail: editor.educationFormScheduleDetail,
    ipsScheduleDetail: editor.ipsScheduleDetail,
    participationScheduleDetail: editor.participationScheduleDetail,
    ...(editor.educationFormScheduleDetail === 'common' && educationForm
      ? { educationFormLabel: educationFormLabelFromValue(educationForm) }
      : {}),
  }
}

export const TRAINED_TEACHER_DRAFT_RHF_REQUIRED_ERROR =
  'TRAINED_TEACHER registration RHF is not mounted; refusing draft save'

/**
 * @param registrationOverlay 등록 overlay 레코드(빈 RHF 제목 보정용). 호출부가 넘긴다 — 이 모듈은 overlay 스토어를 읽지 않는다.
 */
export function trainedTeachersWizardDraftSettingsJson(registrationOverlay: Record<string, unknown>): {
  [TRAINED_TEACHERS_REGISTRATION_SETTINGS_KEY]: TrainedTeachersRegistrationCanonical
} {
  const ttRhf = peekTrainedTeachersRegistrationRhf()
  if (ttRhf == null) {
    throw new Error(TRAINED_TEACHER_DRAFT_RHF_REQUIRED_ERROR)
  }
  const values = fillEmptyTrainedTeachersTitlesFromOverlay(
    ttRhf.getValues(),
    registrationOverlay
  )
  const snapshot = buildTrainedTeachersCanonicalFromRhf({
    id: registrationPendingSnapshotId('trainedTeachers'),
    values,
  })
  if (!isTrainedTeachersRegistrationCanonicalSnapshot(snapshot)) {
    throw new Error(TRAINED_TEACHER_DRAFT_RHF_REQUIRED_ERROR)
  }
  return { [TRAINED_TEACHERS_REGISTRATION_SETTINGS_KEY]: snapshot }
}

function withTargetLevels(program: Program): Program {
  const targetLevels = resolvePersistedProgramTargetLevels(program)
  if (targetLevels.length === 0) return program
  return { ...program, targetLevels, targetLevel: targetLevels[0] }
}

export function buildTrainedTeacherProgramFromCanonical(args: {
  id: string
  canonical: TrainedTeachersRegistrationCanonical
}): Program {
  const { common, editor, recruit } = args.canonical
  const now = new Date().toISOString()
  const y = dayjs().year()
  const title = common.announcementTitle.trim() || '교육받은 교사 프로그램'
  const startDate = common.startDate ?? dayjs(`${y}-04-01`).startOf('day').toISOString()
  const endDate = common.endDate ?? dayjs(`${y}-12-31`).endOf('day').toISOString()
  const sponsorId = common.sponsorManagementIds[0] ?? ''
  const isSchedule = common.educationStructure === 'schedule'
  const curriculumSessions = isSchedule
    ? []
    : common.curriculumSessions.map(row => withoutAssignment(row))
  const scheduleDetails = isSchedule
    ? common.scheduleDetails.map(row => withoutAssignment(row))
    : []

  const base: Program = {
    id: args.id,
    sponsorId,
    title,
    mainTitle: common.mainTitle.trim() || undefined,
    titleEn: common.titleEn || undefined,
    textbookName: common.textbookName,
    type: common.educationForm ?? 'offline',
    format: 'workshop',
    category: 'school',
    backendProgramType: 'TRAINED_TEACHER',
    description: title,
    startDate,
    endDate,
    applicationStartDate: dayjs().startOf('day').toISOString(),
    applicationEndDate: dayjs().add(30, 'day').endOf('day').toISOString(),
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    businessArea: common.businessArea || undefined,
    detailedProgramId: common.detailedProgramId || undefined,
    educationProcess: common.educationProcess,
    ipOwned: common.ipOwned,
    courseDeliveredBy: common.courseDeliveredBy,
    partnerInvolvement: common.partnerInvolvement,
    ips: common.ips,
    programCategory: common.programCategory,
    programChannel: common.programChannel,
    studentListRequired: 'required',
    generalProgramAudience: 'organization',
    generalParticipantTypes: ['school_institution'],
    generalProgramEducationStructure: common.educationStructure,
    generalProgramSessionRound: common.sessionRound,
    generalSurveyMenuKeys: [...common.generalSurveyMenuKeys],
    venue: common.venueKind === 'other' ? common.venueDetail || undefined : undefined,
    institutionType:
      common.venueKind === 'inside'
        ? 'inside_school'
        : common.venueKind === 'outside'
          ? 'outside_school'
          : undefined,
    generalCommonInfo: {
      announcementTitle: common.announcementTitle,
      detailedProgramName: common.detailedProgramName,
      sponsorManagementIds: [...common.sponsorManagementIds],
      sponsorManagementId: sponsorId || undefined,
      sponsorManagerContactIds: [...common.sponsorManagerContactIds],
      sponsorManagerContactId: common.sponsorManagerContactIds[0],
      venueKind: common.venueKind,
      venueDetail: common.venueDetail,
      educationScheduleMode: common.educationScheduleMode,
      educationScheduleLines: [...common.educationScheduleLines],
      educationScheduleRange: educationScheduleRangeFromPeriodLines({
        mode: common.educationScheduleMode,
        lines: common.educationScheduleLines,
      }),
      curriculumSessions,
      scheduleDetails,
      teacherTrainingEnabled: common.teacherTrainingEnabled,
      educationJournalEnabled: common.educationJournalEnabled,
      ...scheduleDetailFieldsFromEditor(editor, common.educationForm),
      participantRecruitmentInfo: {
        maxAssignableInstructors: 0,
        preEducationNoticeRequired: false,
      },
    },
    rounds: [
      {
        id: `${args.id}-round-1`,
        programId: args.id,
        roundNumber: 1,
        startDate,
        endDate,
        capacity: 0,
        status: 'active',
        deliveryType: common.educationForm ?? 'offline',
        curriculum: `${title} 커리큘럼`,
      },
    ],
    createdAt: now,
    updatedAt: now,
  }

  const withRecruit = applyTrainedTeachersRecruitToProgram(base, recruit)
  return withTargetLevels({
    ...withRecruit,
    generalParticipantTypes: ['school_institution'],
    generalProgramAudience: 'organization',
    generalSurveyMenuKeys: [...common.generalSurveyMenuKeys],
    textbookName: common.textbookName,
    generalCommonInfo: {
      ...withRecruit.generalCommonInfo,
      announcementTitle: common.announcementTitle,
      detailedProgramName: common.detailedProgramName,
      sponsorManagementIds: [...common.sponsorManagementIds],
      sponsorManagerContactIds: [...common.sponsorManagerContactIds],
      curriculumSessions,
      scheduleDetails,
      educationScheduleLines: [...common.educationScheduleLines],
      educationScheduleRange: educationScheduleRangeFromPeriodLines({
        mode: common.educationScheduleMode,
        lines: common.educationScheduleLines,
      }),
      teacherTrainingEnabled: editor.teacherTrainingEnabled,
      educationJournalEnabled: common.educationJournalEnabled,
      ...scheduleDetailFieldsFromEditor(editor, common.educationForm),
      participantRecruitmentInfo: {
        ...withRecruit.generalCommonInfo?.participantRecruitmentInfo,
        maxAssignableInstructors: 0,
        preEducationNoticeRequired: false,
      },
    },
  })
}

export function buildTrainedTeachersCanonicalFromRhf(args: {
  id: string
  values: TrainedTeachersRegistrationRhfValues
  recruit?: TrainedTeachersRegistrationCanonical['recruit']
  application?: TrainedTeachersRegistrationCanonical['application']
}): TrainedTeachersRegistrationCanonical {
  return {
    schemaVersion: TRAINED_TEACHERS_REGISTRATION_CANONICAL_VERSION,
    editor: trainedTeachersRhfToEditorMeta(args.values),
    common: collectTrainedTeachersCommonInfoState(args.values),
    recruit:
      args.recruit ?? collectTrainedTeachersRecruitmentState(args.values.recruitment),
    application: args.application ?? collectTrainedTeachersApplicationState(args.values.application),
    sidecar: { ...args.values.sidecar },
  }
}

export function buildTrainedTeachersProgramFromRhf(args: {
  id: string
  values: TrainedTeachersRegistrationRhfValues
  recruit?: TrainedTeachersRegistrationCanonical['recruit']
  application?: TrainedTeachersRegistrationCanonical['application']
}): Program {
  return buildTrainedTeacherProgramFromCanonical({
    id: args.id,
    canonical: buildTrainedTeachersCanonicalFromRhf(args),
  })
}

/** Legacy overlay snapshot → Program. 정상 신규 등록 CREATE 는 사용하지 않는다. */
export function buildTrainedTeachersCreateSnapshot(args: {
  id: string
  editor: TrainedTeachersRegistrationCanonical['editor']
  overlay: Record<string, unknown>
}): Program {
  const canonical = importLegacyOverlayToTrainedTeachersCanonical({
    id: args.id,
    editor: args.editor,
    overlay: args.overlay,
  })
  return buildTrainedTeacherProgramFromCanonical({ id: args.id, canonical })
}
