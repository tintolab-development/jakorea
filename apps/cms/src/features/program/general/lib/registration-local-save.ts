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
import { mockSponsors } from '@/data/mock/sponsors'

export const GENERAL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX = 'general-local-'

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
}): Program {
  const now = new Date().toISOString()
  const y = dayjs().year()
  const title = `신규 일반 프로그램 (${dayjs().format('YYYY-MM-DD HH:mm')})`
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
    category: primaryCategoryFromParticipant(args.participant),
    description: '일반 프로그램 등록(임시 저장)',
    startDate: dayjs(`${y}-04-01`).startOf('day').toISOString(),
    endDate: dayjs(`${y}-06-30`).endOf('day').toISOString(),
    applicationStartDate: dayjs().startOf('day').toISOString(),
    applicationEndDate: dayjs().add(30, 'day').endOf('day').toISOString(),
    status: 'pending',
    lifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'elementary',
    approvedStudentCount: 0,
    scheduleTimeEnabled: true,
    startTime: '09:00',
    endTime: '18:00',
    generalParticipantTypes: participantTypes,
    generalSurveyMenuKeys: ['survey', 'student_satisfaction', 'teacher_satisfaction', 'lecture_evaluation'],
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
        row.id.startsWith(GENERAL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX) &&
        row.program != null &&
        typeof row.program === 'object'
    )
  } catch {
    return []
  }
}

export function readGeneralRegistrationLocalSavePrograms(): Program[] {
  return readGeneralRegistrationLocalSaveRecords().map(r => r.program)
}

export function findGeneralRegistrationLocalSaveProgramById(id: string): Program | undefined {
  return readGeneralRegistrationLocalSaveRecords().find(r => r.id === id)?.program
}

export function persistGeneralRegistrationFormLocal(args: {
  draft: WritingFormDraft
  participant: ProgramRegistrationParticipantState
  programType: ProgramRegistrationType
}): Program {
  const id = newLocalProgramId()
  const program = buildGeneralProgramListRowFromRegistrationSnapshot({
    id,
    participant: args.participant,
    programType: args.programType,
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
