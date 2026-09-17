/**
 * 일반 프로그램 등록 폼 — API 연동 전 임시 저장 (localStorage).
 * 등록 에디터 재개용이며 관리 목록 카탈로그에 합치지 않는다.
 */

import dayjs from 'dayjs'
import type {
  GeneralProgramParticipantType,
  GeneralProgramScheduleDetailRow,
  Program,
  ProgramCategory,
  ProgramLifecycleStatus,
  ProgramRound,
} from '@/types/domain'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type {
  ProgramRegistrationEducationScheduleMode,
  ProgramRegistrationParticipantState,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import { createGeneralProgram } from '@/features/program/general/api/admin-general-programs-service'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { shouldUseCompanySchoolRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import { resolveScheduleTypeDetailedProgramNameFromDetails } from '@/features/program/general/lib/detail-common-info-display'
import {
  getProgramRegistrationOverlayRecord,
  readGeneralRegistrationOverlaySponsorIds,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  applyGeneralRegistrationOverlayToProgram,
  normalizeRegistrationOverlayForApply,
  type GeneralRegistrationEditorExtras,
} from '@/features/program/general/lib/registration-overlay-to-program'
import { readRegistrationOverlaySponsorId } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { applyGeneralRecruitOverlayToProgram } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { getApplicantRecruitInstitutionOverlayRecord } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { getGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'

export const GENERAL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX = 'general-local-'
export const COMPANY_SCHOOL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX = 'company-school-local-'
export const TRAINED_TEACHERS_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX = 'trained-teachers-local-'

const STORAGE_KEY = 'cms.jakorea.generalRegistrationLocalSaves.v1'

type LocalSaveFile = {
  version: 1
  items: GeneralRegistrationLocalSaveRecord[]
}

export type GeneralRegistrationLocalSaveRecord = {
  version: 1
  id: string
  savedAt: string
  program: Program
  registrationDraft: WritingFormDraft
}

function resolveDefaultSponsorId(): string {
  return ''
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function newLocalProgramId(): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  return `${GENERAL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX}${uuid ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`
}

function newCompanySchoolLocalProgramId(): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  return `${COMPANY_SCHOOL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX}${uuid ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`
}

function newTrainedTeachersLocalProgramId(): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  return `${TRAINED_TEACHERS_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX}${uuid ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`
}

function participantTypesFromState(
  participant: ProgramRegistrationParticipantState
): GeneralProgramParticipantType[] {
  const types: GeneralProgramParticipantType[] = []
  if (participant.individual) types.push('individual')
  if (participant.organization) types.push('school_institution')
  if (participant.teacherInstructor) types.push('teacher_instructor')
  if (participant.volunteer) types.push('volunteer')
  return types.length > 0 ? types : ['school_institution']
}

function audienceFromParticipant(
  participant: ProgramRegistrationParticipantState
): Program['generalProgramAudience'] {
  if (participant.individual && !participant.organization) return 'individual'
  if (participant.organization && !participant.individual) return 'organization'
  // 둘 다/둘 다 아님 → 미설정. applicationTargetMode 는 participantTypes 로 보정
  return undefined
}

function primaryCategoryFromParticipant(
  participant: ProgramRegistrationParticipantState
): ProgramCategory {
  // 대분류(개인/기관)가 category 1순위 — 강사·봉사는 generalParticipantTypes 로 표현
  if (participant.individual && !participant.organization) return 'individual'
  if (participant.organization && !participant.individual) return 'school'
  if (participant.organization) return 'school'
  if (participant.teacherInstructor) return 'instructor'
  if (participant.volunteer) return 'volunteer'
  return 'individual'
}

/** 등록 overlay 일정명 → scheduleDetails (단일·복수 공통). 실적 세부 프로그램명 반영용 */
export function buildScheduleDetailsFromRegistrationOverlay(
  overlay: Record<string, unknown>,
  detailCount: number
): GeneralProgramScheduleDetailRow[] {
  const count = Math.max(1, detailCount)
  const rawNames = overlay['generalRegistration.educationScheduleCurriculum.eventNameByDetail']
  const names =
    rawNames != null && typeof rawNames === 'object' && !Array.isArray(rawNames)
      ? (rawNames as Record<number, unknown>)
      : {}

  return Array.from({ length: count }, (_, index) => {
    const n = index + 1
    const nameRaw = names[n]
    const name = typeof nameRaw === 'string' ? nameRaw.trim() : ''
    return {
      scheduleLabel: `세부 일정 ${String(n).padStart(2, '0')}`,
      name,
    }
  })
}

export function buildGeneralProgramListRowFromRegistrationSnapshot(args: {
  id: string
  participant: ProgramRegistrationParticipantState
  programType: ProgramRegistrationType
  variant: ProgramRegistrationFormVariant
  /** 일반 등록 UI에서 선택한 후원사. 없으면 local mock 폴백 */
  sponsorId?: string
  /** 목록·생성 요청에 쓸 프로그램명. 없으면 자동 생성 */
  title?: string
  sessionRoundType?: ProgramRegistrationSessionRoundType
  educationScheduleMode?: ProgramRegistrationEducationScheduleMode
  educationScheduleLines?: string[]
  /** 일정형 — 세부 일정 블록 수(단일·복수). 실적 세부 프로그램명 반영 */
  scheduleCurriculumDetailCount?: number
  /** 일반 등록 — overlay 매핑용 editor 상태 (미전달 시 기본값) */
  editorExtras?: Omit<
    GeneralRegistrationEditorExtras,
    'programType' | 'sessionRoundType' | 'educationScheduleMode' | 'scheduleCurriculumDetailCount'
  >
}): Program {
  const now = new Date().toISOString()
  const y = dayjs().year()
  const isCompanySchool = args.variant === 'economy'
  const isTrainedTeachers = args.variant === 'trainedTeachers'
  const programLabel = isCompanySchool ? '1사1교' : isTrainedTeachers ? '교육받은 교사' : '일반'
  const title =
    args.title?.trim() ||
    `신규 ${programLabel} 프로그램 (${dayjs().format('YYYY-MM-DD HH:mm:ss')})`
  const mainTitle = title
  const participantTypes: GeneralProgramParticipantType[] = isCompanySchool
    ? ['school_institution', 'teacher_instructor']
    : isTrainedTeachers
      ? ['school_institution']
      : participantTypesFromState(args.participant)
  const capacity = 30
  const overlaySponsorId = isTrainedTeachers
    ? readRegistrationOverlaySponsorId('trainedTeachers')
    : readRegistrationOverlaySponsorId('general')
  const sponsorId =
    args.sponsorId?.trim() || overlaySponsorId || (isTrainedTeachers ? '' : resolveDefaultSponsorId())

  const rounds: ProgramRound[] = [
    {
      id: `${args.id}-round-1`,
      programId: args.id,
      roundNumber: 1,
      startDate: dayjs(`${y}-03-01`).startOf('day').toISOString(),
      endDate: dayjs(`${y}-03-15`).endOf('day').toISOString(),
      capacity,
      status: 'active',
      deliveryType: 'offline',
      curriculum: `${mainTitle} 커리큘럼`,
    },
  ]

  const lifecycleStatus: ProgramLifecycleStatus = 'recruiting_students'
  const generalProgramAudience: Program['generalProgramAudience'] =
    isCompanySchool || isTrainedTeachers
      ? 'organization'
      : audienceFromParticipant(args.participant)
  /** 개인 프로그램은 학생 명단 제출 기능을 쓸 수 없음 (BE `GENERAL_INDIVIDUAL_STUDENT_ROSTER_NOT_ALLOWED`) */
  const studentListRequired: Program['studentListRequired'] =
    isCompanySchool || generalProgramAudience === 'individual' ? 'not_required' : 'required'

  const isGeneralSchedule =
    !isCompanySchool && !isTrainedTeachers && args.programType === 'schedule'
  const scheduleDetails = isGeneralSchedule
    ? buildScheduleDetailsFromRegistrationOverlay(
        getProgramRegistrationOverlayRecord(),
        args.scheduleCurriculumDetailCount ?? 1
      )
    : undefined
  const scheduleDetailedProgramName = isGeneralSchedule
    ? resolveScheduleTypeDetailedProgramNameFromDetails(scheduleDetails)
    : undefined
  const sponsorManagementIds =
    !isCompanySchool && !isTrainedTeachers
      ? (() => {
          const fromOverlay = readGeneralRegistrationOverlaySponsorIds()
          if (fromOverlay.length > 0) return fromOverlay
          return sponsorId ? [sponsorId] : []
        })()
      : undefined

  const base: Program = {
    id: args.id,
    sponsorId,
    title,
    mainTitle,
    type: 'offline',
    format: 'workshop',
    category:
      isCompanySchool || isTrainedTeachers
        ? 'school'
        : primaryCategoryFromParticipant(args.participant),
    description: `${programLabel} 프로그램 등록(임시 저장)`,
    startDate: dayjs(`${y}-${isCompanySchool ? '01-01' : '04-01'}`)
      .startOf('day')
      .toISOString(),
    endDate: dayjs(`${y}-12-31`).endOf('day').toISOString(),
    applicationStartDate: dayjs().startOf('day').toISOString(),
    applicationEndDate: dayjs().add(30, 'day').endOf('day').toISOString(),
    status: 'pending',
    lifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'elementary',
    approvedStudentCount: 0,
    instructors: 0,
    instructorCapacity: isCompanySchool ? 30 : undefined,
    instructorApplicationStartDate: isCompanySchool
      ? dayjs(`${y}-01-01`).startOf('day').toISOString()
      : undefined,
    instructorApplicationEndDate: isCompanySchool
      ? dayjs(`${y}-12-31`).endOf('day').toISOString()
      : undefined,
    participatingSchoolCount: 0,
    participatingStudentCount: 0,
    scheduleTimeEnabled: true,
    startTime: '09:00',
    endTime: '18:00',
    studentListRequired,
    textbookName: scheduleDetailedProgramName,
    teamDivision: scheduleDetailedProgramName,
    generalProgramAudience,
    generalProgramEducationStructure:
      isCompanySchool || isTrainedTeachers ? 'curriculum' : args.programType,
    generalProgramSessionRound:
      isCompanySchool || isTrainedTeachers ? undefined : (args.sessionRoundType ?? 'single'),
    generalCommonInfo: isCompanySchool || isTrainedTeachers
      ? {
          educationScheduleMode: 'period',
          curriculumSessions: [
            {
              sessionLabel: '1차시',
              title: '1단원 나를 알리는 기술',
              description: '채용 공고 읽기, 이력서 작성하기 등 취업에 필요한 단계들을 알아봅니다.',
            },
            {
              sessionLabel: '2차시',
              title: '2단원 나를 보여주는 기술',
              description:
                '올바른 면접 태도에 대해 알아보고, 직접 면접 체험을 해보는 시간을 갖습니다.',
            },
          ],
          educationScheduleLines: [
            `${dayjs(`${y}-03-01`).format('YYYY. MM. DD')} ~ ${dayjs(`${y}-12-31`).format('YYYY. MM. DD')}`,
          ],
          wageGradeRows: isCompanySchool
            ? [
                {
                  grade: '1급 강사비',
                  pricing: '1시간 당 | 기본 : 500,000원 | 장거리 : 500,000원',
                },
                {
                  grade: '2급 강사비',
                  pricing: '1시간 당 | 기본 : 400,000원 | 장거리 : 400,000원',
                },
                {
                  grade: '3급 강사비',
                  pricing: '1시간 당 | 기본 : 300,000원 | 장거리 : 300,000원',
                },
              ]
            : undefined,
          paymentItems: isCompanySchool ? '교통비(일사일교), 숙박비(일사일교)' : undefined,
          deductionItems: isCompanySchool ? '일용근로자 원천징수세액' : undefined,
          participantRecruitmentInfo: {
            preEducationNoticeRequired: true,
            maxAssignableInstructors: isCompanySchool ? 2 : undefined,
            maxClassCount: 4,
            maxScheduleCount: 2,
            maxSessionsPerDay: 2,
          },
        }
      : {
          educationScheduleMode: args.educationScheduleMode ?? 'date',
          educationScheduleLines: [...(args.educationScheduleLines ?? [])],
          ...(sponsorManagementIds && sponsorManagementIds.length > 0
            ? {
                sponsorManagementId: sponsorManagementIds[0],
                sponsorManagementIds,
              }
            : {}),
          ...(isGeneralSchedule
            ? {
                detailedProgramName: '해당없음',
                scheduleDetails,
              }
            : {}),
        },
    generalParticipantTypes: participantTypes,
    generalSurveyMenuKeys: ['survey', 'satisfaction', 'lecture_evaluation'],
    rounds,
    createdAt: now,
    updatedAt: now,
  }

  if (isCompanySchool) return base

  const overlay = normalizeRegistrationOverlayForApply(
    getProgramRegistrationOverlayRecord(),
    isTrainedTeachers ? 'trainedTeachers' : 'general'
  )

  const withRegistration = applyGeneralRegistrationOverlayToProgram(base, overlay, {
    programType: isTrainedTeachers ? 'curriculum' : args.programType,
    sessionRoundType: isTrainedTeachers ? 'single' : (args.sessionRoundType ?? 'single'),
    educationScheduleMode: args.educationScheduleMode,
    scheduleCurriculumDetailCount: args.scheduleCurriculumDetailCount,
    participantOrganization: isTrainedTeachers ? true : args.participant.organization,
    ...args.editorExtras,
  })

  return applyGeneralRecruitOverlayToProgram(
    withRegistration,
    {
      ...getApplicantRecruitInstitutionOverlayRecord(),
      ...getGeneralRecruitOverlayRecord(),
    },
    { preferOverlay: true }
  )
}

export function readGeneralRegistrationLocalSaveRecords(): GeneralRegistrationLocalSaveRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LocalSaveFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) return []
    return parsed.items.filter(
      (row): row is GeneralRegistrationLocalSaveRecord =>
        row != null &&
        typeof row === 'object' &&
        row.version === 1 &&
        typeof row.id === 'string' &&
        (row.id.startsWith(GENERAL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX) ||
          row.id.startsWith(COMPANY_SCHOOL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX) ||
          row.id.startsWith(TRAINED_TEACHERS_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX)) &&
        row.program != null &&
        typeof row.program === 'object'
    )
  } catch {
    return []
  }
}

export function readGeneralRegistrationLocalSavePrograms(): Program[] {
  return readGeneralRegistrationLocalSaveRecords()
    .filter(r => r.id.startsWith(GENERAL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX))
    .map(r => r.program)
}

export function readCompanySchoolRegistrationLocalSavePrograms(): Program[] {
  return readGeneralRegistrationLocalSaveRecords()
    .filter(r => r.id.startsWith(COMPANY_SCHOOL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX))
    .map(r => r.program)
}

export function updateCompanySchoolRegistrationLocalSaveProgram(
  programId: string,
  patch: Partial<Program>
): Program | null {
  const records = readGeneralRegistrationLocalSaveRecords()
  const index = records.findIndex(record => record.id === programId)
  if (index < 0) return null

  const current = records[index]
  const updatedAt = new Date().toISOString()
  const updatedProgram: Program = {
    ...current.program,
    ...patch,
    id: current.program.id,
    createdAt: current.program.createdAt,
    updatedAt,
  }
  records[index] = {
    ...current,
    savedAt: updatedAt,
    program: updatedProgram,
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 1, items: records } satisfies LocalSaveFile)
  )
  return updatedProgram
}

export function deleteCompanySchoolRegistrationLocalSaveProgram(programId: string): boolean {
  const records = readGeneralRegistrationLocalSaveRecords()
  const nextRecords = records.filter(record => record.id !== programId)
  if (nextRecords.length === records.length) return false
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 1, items: nextRecords } satisfies LocalSaveFile)
  )
  return true
}

export function readTrainedTeachersRegistrationLocalSavePrograms(): Program[] {
  return readGeneralRegistrationLocalSaveRecords()
    .filter(r => r.id.startsWith(TRAINED_TEACHERS_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX))
    .map(r => r.program)
}

export function findGeneralRegistrationLocalSaveProgramById(id: string): Program | undefined {
  return readGeneralRegistrationLocalSaveRecords().find(r => r.id === id)?.program
}

export function persistGeneralRegistrationFormLocal(args: {
  draft: WritingFormDraft
  participant: ProgramRegistrationParticipantState
  programType: ProgramRegistrationType
  variant?: ProgramRegistrationFormVariant
  sponsorId?: string
  title?: string
  sessionRoundType?: ProgramRegistrationSessionRoundType
  educationScheduleMode?: ProgramRegistrationEducationScheduleMode
  educationScheduleLines?: string[]
  scheduleCurriculumDetailCount?: number
  editorExtras?: Omit<
    GeneralRegistrationEditorExtras,
    'programType' | 'sessionRoundType' | 'educationScheduleMode' | 'scheduleCurriculumDetailCount'
  >
}): Program {
  const variant = args.variant ?? 'general'
  const id =
    variant === 'economy'
      ? newCompanySchoolLocalProgramId()
      : variant === 'trainedTeachers'
        ? newTrainedTeachersLocalProgramId()
        : newLocalProgramId()
  const program = buildGeneralProgramListRowFromRegistrationSnapshot({
    id,
    participant: args.participant,
    programType: args.programType,
    variant,
    sponsorId: args.sponsorId,
    title: args.title,
    sessionRoundType: args.sessionRoundType,
    educationScheduleMode: args.educationScheduleMode,
    educationScheduleLines: args.educationScheduleLines,
    scheduleCurriculumDetailCount: args.scheduleCurriculumDetailCount,
    editorExtras: args.editorExtras,
  })
  const record: GeneralRegistrationLocalSaveRecord = {
    version: 1,
    id,
    savedAt: new Date().toISOString(),
    program,
    registrationDraft: cloneJson(args.draft),
  }

  const prev = readGeneralRegistrationLocalSaveRecords()
  const nextFile: LocalSaveFile = { version: 1, items: [...prev, record] }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFile))

  return program
}

export async function persistGeneralProgramRegistration(args: {
  draft: WritingFormDraft
  participant: ProgramRegistrationParticipantState
  programType: ProgramRegistrationType
  variant?: ProgramRegistrationFormVariant
  sponsorId?: string
  title?: string
  sessionRoundType?: ProgramRegistrationSessionRoundType
  educationScheduleMode?: ProgramRegistrationEducationScheduleMode
  educationScheduleLines?: string[]
  scheduleCurriculumDetailCount?: number
  editorExtras?: Omit<
    GeneralRegistrationEditorExtras,
    'programType' | 'sessionRoundType' | 'educationScheduleMode' | 'scheduleCurriculumDetailCount'
  >
}): Promise<Program> {
  const variant = args.variant ?? 'general'
  const id =
    variant === 'economy'
      ? newCompanySchoolLocalProgramId()
      : variant === 'trainedTeachers'
        ? newTrainedTeachersLocalProgramId()
        : newLocalProgramId()
  const program = buildGeneralProgramListRowFromRegistrationSnapshot({
    id,
    participant: args.participant,
    programType: args.programType,
    variant,
    sponsorId: args.sponsorId,
    title: args.title,
    sessionRoundType: args.sessionRoundType,
    educationScheduleMode: args.educationScheduleMode,
    educationScheduleLines: args.educationScheduleLines,
    scheduleCurriculumDetailCount: args.scheduleCurriculumDetailCount,
    editorExtras: args.editorExtras,
  })

  if (variant === 'economy' && shouldUseCompanySchoolRemoteApi()) {
    const { createCompanySchoolProgram } = await import(
      '@/features/program/1c-1s/api/service'
    )
    return createCompanySchoolProgram(program)
  }

  if (variant === 'trainedTeachers' && shouldUseTrainedTeacherProgramsRemoteApi()) {
    const { createTrainedTeacherProgram } = await import(
      '@/features/program/trained-teachers/api/service'
    )
    return createTrainedTeacherProgram(program)
  }

  if (
    variant !== 'economy' &&
    variant !== 'trainedTeachers' &&
    shouldUseGeneralProgramsRemoteApi()
  ) {
    const created = await createGeneralProgram(program)
    try {
      const { attachRegistrationFormDraftsToProgram } = await import(
        '@/features/program/general/lib/sync-registration-form-bindings'
      )
      await attachRegistrationFormDraftsToProgram(created)
    } catch (error) {
      console.warn('[general-program] attach registration form drafts failed', error)
    }
    return created
  }

  return persistGeneralRegistrationFormLocal(args)
}
