/**
 * 일반 신규 등록 CREATE — RHF UI → Independent builder → Create Request.
 * overlay apply 를 먼저 거친 base에 Independent를 겹치지 않는다.
 */
import dayjs from 'dayjs'
import type { Program, ProgramCategory } from '@/types/domain'
import { mapGeneralProgramToCreateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import { collectSelectedRecruitOverlaysForProgram } from '@/features/program/general/lib/registration-operational-form-drafts'
import { withGeneralRecruitRadioDefaults } from '@/features/program/general/lib/recruit-radio-defaults'
import { resolvePersistedProgramTargetLevels } from '@/features/program/shared/lib/program-detail-info-constants'
import type { GeneralRegistrationEditorExtras } from '@/features/program/general/lib/registration-overlay-to-program'
import type { ProgramRegistrationParticipantState } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { COMMON_INFO_OWNED_PERSIST_KEY_SET } from './common-info-persist-keys'
import { buildIndependentCommonInfo } from './build-independent-common-info'
import {
  buildIndependentRecruitmentDraft,
  splitIndependentRecruitmentCatalogOverlays,
} from './build-independent-recruitment'
import { overlayKvToRecruitmentFormValues, overlayKvToRecruitmentSidecars } from './overlay-kv-to-recruitment-form-values'
import {
  isWizardRecruitOwnedOverlayKey,
  participantFromWizardUi,
  pickRecruitMediaPersistOverlay,
  selectRecruitmentKvForParticipant,
} from './registration-wizard-recruitment-rhf'
import {
  REGISTRATION_WIZARD_FOOTER_IPS_KEY,
  REGISTRATION_WIZARD_OPERATION_ANCHOR_KEY,
  REGISTRATION_WIZARD_PERIOD_DATE_ISO_KEY,
  REGISTRATION_WIZARD_SINGLE_DATE_ISO_KEY,
} from './registration-wizard-overlay-path-map'
import { createRegistrationCreateSessionAuthoring } from './registration-wizard-structure'
import {
  stripApplicationKeysFromOverlay,
  uiValuesToCommonInfoFormValues,
} from './registration-wizard-ui-to-common-info'
import type { RegistrationWizardUiValues } from './registration-wizard-ui-values'

function participantTypesFromState(participant: ProgramRegistrationParticipantState) {
  const types: Program['generalParticipantTypes'] = []
  if (participant.individual) types.push('individual')
  if (participant.organization) types.push('school_institution')
  if (participant.teacherInstructor) types.push('teacher_instructor')
  if (participant.volunteer) types.push('volunteer')
  return types.length > 0 ? types : (['school_institution'] as const)
}

function audienceFromParticipant(
  participant: ProgramRegistrationParticipantState
): Program['generalProgramAudience'] {
  if (participant.individual && !participant.organization) return 'individual'
  if (participant.organization && !participant.individual) return 'organization'
  return undefined
}

function primaryCategoryFromParticipant(
  participant: ProgramRegistrationParticipantState
): ProgramCategory {
  if (participant.individual && !participant.organization) return 'individual'
  if (participant.organization && !participant.individual) return 'school'
  if (participant.organization) return 'school'
  if (participant.teacherInstructor) return 'instructor'
  if (participant.volunteer) return 'volunteer'
  return 'individual'
}

function withPersistedTargetLevels(program: Program): Program {
  const targetLevels = resolvePersistedProgramTargetLevels(program)
  if (targetLevels.length === 0) return program
  return { ...program, targetLevels, targetLevel: targetLevels[0] }
}

function isEphemeralBlobUrl(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith('blob:')
}

export function collectUnownedWizardOverlay(args: {
  uiValues: RegistrationWizardUiValues
  overlay?: Record<string, unknown>
}): Record<string, unknown> {
  const unowned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(args.overlay ?? {})) {
    if (COMMON_INFO_OWNED_PERSIST_KEY_SET.has(key)) continue
    if (key.startsWith('application.')) continue
    if (isWizardRecruitOwnedOverlayKey(key)) continue
    if (isEphemeralBlobUrl(value)) continue
    unowned[key] = value
  }
  unowned[REGISTRATION_WIZARD_OPERATION_ANCHOR_KEY] = args.uiValues.operationAnchorIso
  unowned[REGISTRATION_WIZARD_SINGLE_DATE_ISO_KEY] = args.uiValues.singleDateIso
  unowned[REGISTRATION_WIZARD_PERIOD_DATE_ISO_KEY] = args.uiValues.periodDateIso
  unowned[REGISTRATION_WIZARD_FOOTER_IPS_KEY] = args.uiValues.footerIpsType
  return stripApplicationKeysFromOverlay(unowned)
}

export function buildIndependentRegistrationCreateBaseline(args: {
  id: string
  uiValues: RegistrationWizardUiValues
  editorExtras: GeneralRegistrationEditorExtras
}): Program {
  const now = new Date().toISOString()
  const y = dayjs().year()
  const participant = {
    individual: args.editorExtras.participantIndividual === true,
    organization: args.editorExtras.participantOrganization === true,
    teacherInstructor: args.editorExtras.participantTeacherInstructor === true,
    volunteer: args.editorExtras.participantVolunteer === true,
  }
  const title =
    args.uiValues.programTitleKo.trim() ||
    `신규 일반 프로그램 (${dayjs().format('YYYY-MM-DD HH:mm:ss')})`
  const sponsorId =
    args.uiValues.sponsorId.trim() || args.uiValues.sponsorIds.find(id => id.trim())?.trim() || ''
  const sponsorManagementIds =
    args.uiValues.sponsorIds.filter(id => id.trim()).length > 0
      ? args.uiValues.sponsorIds.filter(id => id.trim())
      : sponsorId
        ? [sponsorId]
        : []
  const generalProgramAudience = audienceFromParticipant(participant)
  const studentListRequired: Program['studentListRequired'] =
    generalProgramAudience === 'individual' ? 'not_required' : 'required'

  return {
    id: args.id,
    sponsorId,
    title,
    mainTitle: title,
    type: 'offline',
    format: 'workshop',
    category: primaryCategoryFromParticipant(participant),
    description: '일반 프로그램 등록(임시 저장)',
    startDate: dayjs(`${y}-04-01`).startOf('day').toISOString(),
    endDate: dayjs(`${y}-12-31`).endOf('day').toISOString(),
    applicationStartDate: dayjs().startOf('day').toISOString(),
    applicationEndDate: dayjs().add(30, 'day').endOf('day').toISOString(),
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    businessArea: '경제금융',
    targetLevel: 'elementary',
    approvedStudentCount: 0,
    instructors: 0,
    participatingSchoolCount: 0,
    participatingStudentCount: 0,
    scheduleTimeEnabled: true,
    startTime: '09:00',
    endTime: '18:00',
    studentListRequired,
    generalProgramAudience,
    generalProgramEducationStructure: args.editorExtras.programType,
    generalProgramSessionRound: args.editorExtras.sessionRoundType ?? 'single',
    generalCommonInfo: {
      educationScheduleMode: args.editorExtras.educationScheduleMode ?? 'date',
      educationScheduleLines: [...args.uiValues.scheduleLines],
      ...(sponsorManagementIds.length > 0
        ? {
            sponsorManagementId: sponsorManagementIds[0],
            sponsorManagementIds,
          }
        : {}),
    },
    generalParticipantTypes: [...participantTypesFromState(participant)],
    generalSurveyMenuKeys: ['survey', 'satisfaction', 'lecture_evaluation'],
    rounds: [
      {
        id: `${args.id}-round-1`,
        programId: args.id,
        roundNumber: 1,
        startDate: dayjs(`${y}-03-01`).startOf('day').toISOString(),
        endDate: dayjs(`${y}-03-15`).endOf('day').toISOString(),
        capacity: 30,
        status: 'active',
        deliveryType: 'offline',
        curriculum: `${title} 커리큘럼`,
      },
    ],
    createdAt: now,
    updatedAt: now,
  }
}

export function editorExtrasFromWizardUi(
  values: RegistrationWizardUiValues
): GeneralRegistrationEditorExtras {
  const extras = values.extras
  return {
    programType: extras.programType,
    sessionRoundType: extras.sessionRoundType,
    educationScheduleMode: extras.educationScheduleMode,
    educationFormScheduleDetail: extras.educationFormScheduleDetail,
    participationScheduleDetail: extras.participationScheduleDetail,
    ipsScheduleDetail: extras.ipsScheduleDetail,
    curriculumSessionCount: extras.curriculumSessionCount,
    curriculumChartSessionCount: extras.curriculumChartSessionCount,
    scheduleCurriculumDetailCount: extras.scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount: extras.scheduleCurriculumGroupCount,
    scheduleCurriculumPreEducation: extras.scheduleCurriculumPreEducation,
    participantOrganization: extras.participant.organization,
    participantIndividual: extras.participant.individual,
    participantTeacherInstructor: extras.participant.teacherInstructor,
    participantVolunteer: extras.participant.volunteer,
  }
}

export function mergeWizardEditorExtras(
  uiValues: RegistrationWizardUiValues,
  editorExtras?: GeneralRegistrationEditorExtras
): GeneralRegistrationEditorExtras {
  const fromUi = editorExtrasFromWizardUi(uiValues)
  if (editorExtras == null) return fromUi
  return {
    ...fromUi,
    ...editorExtras,
    participantOrganization:
      editorExtras.participantOrganization ?? fromUi.participantOrganization,
    participantIndividual: editorExtras.participantIndividual ?? fromUi.participantIndividual,
    participantTeacherInstructor:
      editorExtras.participantTeacherInstructor ?? fromUi.participantTeacherInstructor,
    participantVolunteer: editorExtras.participantVolunteer ?? fromUi.participantVolunteer,
  }
}

export function buildGeneralProgramCreateFromWizardRhf(args: {
  id: string
  uiValues: RegistrationWizardUiValues
  editorExtras?: GeneralRegistrationEditorExtras
  overlay?: Record<string, unknown>
}): {
  program: Program
  createRequest: ReturnType<typeof mapGeneralProgramToCreateRequest>
  persistOverlay: Record<string, unknown>
} {
  const editorExtras = mergeWizardEditorExtras(args.uiValues, args.editorExtras)
  const baseline = buildIndependentRegistrationCreateBaseline({
    id: args.id,
    uiValues: args.uiValues,
    editorExtras,
  })
  const independent = buildIndependentCommonInfo({
    formValues: uiValuesToCommonInfoFormValues(args.uiValues),
    editorExtras,
    baseline,
    mode: 'create',
    sessionAuthoring: createRegistrationCreateSessionAuthoring(editorExtras.programType),
    sidecars: {
      unownedOverlay: collectUnownedWizardOverlay({
        uiValues: args.uiValues,
        overlay: args.overlay,
      }),
    },
  })
  const participant = participantFromWizardUi(args.uiValues)
  // 라디오를 건드리지 않아 화면 기본값만 보이던 공고 게시·명단·사전안내·면접 유무를 필수 검사와 같은 값으로 채운다.
  const selectedRecruitKv = withGeneralRecruitRadioDefaults(
    selectRecruitmentKvForParticipant(args.uiValues.recruitmentKv, participant),
    participant,
    { wizardKv: true }
  )
  const mediaPersist = pickRecruitMediaPersistOverlay(
    collectSelectedRecruitOverlaysForProgram(independent.programDraft)
  )
  const splitCatalogs = splitIndependentRecruitmentCatalogOverlays(selectedRecruitKv)
  const recruit = buildIndependentRecruitmentDraft({
    formValues: overlayKvToRecruitmentFormValues(selectedRecruitKv),
    baseline: independent.programDraft,
    mode: 'create',
    catalogOverlays: {
      'recruitment-participant-school': participant.organization
        ? splitCatalogs['recruitment-participant-school']
        : {},
      'recruitment-participant-individual': participant.individual
        ? splitCatalogs['recruitment-participant-individual']
        : {},
      'recruitment-instructor': participant.teacherInstructor
        ? splitCatalogs['recruitment-instructor']
        : {},
      'recruitment-volunteer': participant.volunteer ? splitCatalogs['recruitment-volunteer'] : {},
    },
    sidecars: {
      unownedOverlay: {},
      media: overlayKvToRecruitmentSidecars(mediaPersist).media,
      preferOverlay: true,
    },
  })
  const persistOverlay = stripApplicationKeysFromOverlay({
    ...independent.persistOverlay,
    ...recruit.persistOverlay,
    ...mediaPersist,
  })
  const program = withPersistedTargetLevels({
    ...recruit.programDraft,
    registrationOverlay: persistOverlay,
  })
  return {
    program,
    createRequest: mapGeneralProgramToCreateRequest(program),
    persistOverlay,
  }
}
