/**
 * 일반 프로그램 등록 폼 — API 연동 전 임시 저장 (localStorage).
 * `/programs/general` 목록·상세 mock 병합용.
 */

import dayjs from 'dayjs'
import type {
  GeneralProgramParticipantType,
  Program,
  ProgramCategory,
  ProgramLifecycleStatus,
  ProgramRound,
} from '@/types/domain'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type {
  ProgramRegistrationParticipantState,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import { mockSponsors } from '@/data/mock/sponsors'

export const GENERAL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX = 'general-local-'
export const COMPANY_SCHOOL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX = 'company-school-local-'

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
  return mockSponsors[0]?.id ?? 'sponsor-1'
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

function primaryCategoryFromParticipant(
  participant: ProgramRegistrationParticipantState
): ProgramCategory {
  if (participant.organization) return 'school'
  if (participant.teacherInstructor) return 'instructor'
  if (participant.volunteer) return 'volunteer'
  return 'individual'
}

function buildGeneralProgramListRowFromRegistrationSnapshot(args: {
  id: string
  participant: ProgramRegistrationParticipantState
  programType: ProgramRegistrationType
  variant: ProgramRegistrationFormVariant
}): Program {
  const now = new Date().toISOString()
  const y = dayjs().year()
  const isCompanySchool = args.variant === 'economy'
  const isTrainedTeachers = args.variant === 'trainedTeachers'
  const programLabel = isCompanySchool ? '1사1교' : isTrainedTeachers ? '교육받은 교사' : '일반'
  const title = `신규 ${programLabel} 프로그램 (${dayjs().format('YYYY-MM-DD HH:mm')})`
  const mainTitle = title
  const participantTypes = participantTypesFromState(args.participant)
  const capacity = 30

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

  return {
    id: args.id,
    sponsorId: resolveDefaultSponsorId(),
    title,
    mainTitle,
    type: 'offline',
    format: 'workshop',
    category:
      isCompanySchool || isTrainedTeachers
        ? 'school'
        : primaryCategoryFromParticipant(args.participant),
    description: `${programLabel} 프로그램 등록(임시 저장)`,
    startDate: dayjs(`${y}-04-01`).startOf('day').toISOString(),
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
    participatingSchoolCount: 0,
    participatingStudentCount: 0,
    scheduleTimeEnabled: true,
    startTime: '09:00',
    endTime: '18:00',
    studentListRequired: isCompanySchool ? 'not_required' : 'required',
    generalCommonInfo: isCompanySchool
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
          wageGradeRows: [
            { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 500,000원 | 장거리 : 500,000원' },
            { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 400,000원 | 장거리 : 400,000원' },
            { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 300,000원 | 장거리 : 300,000원' },
          ],
          paymentItems: '교통비(일사일교), 숙박비(일사일교)',
          deductionItems: '일용근로자 원천징수세액',
          participantRecruitmentInfo: {
            preEducationNoticeRequired: true,
            maxAssignableInstructors: 2,
            maxClassCount: 4,
            maxScheduleCount: 2,
            maxSessionsPerDay: 2,
          },
        }
      : undefined,
    generalParticipantTypes: participantTypes,
    generalSurveyMenuKeys: ['survey', 'satisfaction', 'lecture_evaluation'],
    rounds,
    createdAt: now,
    updatedAt: now,
  }
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
          row.id.startsWith(COMPANY_SCHOOL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX)) &&
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

export function findGeneralRegistrationLocalSaveProgramById(id: string): Program | undefined {
  return readGeneralRegistrationLocalSaveRecords().find(r => r.id === id)?.program
}

export function persistGeneralRegistrationFormLocal(args: {
  draft: WritingFormDraft
  participant: ProgramRegistrationParticipantState
  programType: ProgramRegistrationType
  variant?: ProgramRegistrationFormVariant
}): Program {
  const variant = args.variant ?? 'general'
  const id = variant === 'economy' ? newCompanySchoolLocalProgramId() : newLocalProgramId()
  const program = buildGeneralProgramListRowFromRegistrationSnapshot({
    id,
    participant: args.participant,
    programType: args.programType,
    variant,
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
