/**
 * UJAT 프로그램 등록 폼 — API 연동 전 임시 저장 (localStorage).
 * 저장 시 목록/상세에서 `programService` 병합 조회로 노출된다.
 */

import dayjs from 'dayjs'
import type { Program, ProgramRound } from '@/types/domain'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { mockSponsors } from '@/data/mock/sponsors'

export const UJAT_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX = 'ujat-local-'

const STORAGE_KEY = 'cms.jakorea.ujatRegistrationLocalSaves.v1'

const SPONSOR_ALL_VALUE = '__all__'

type LocalSaveFile = {
  version: 1
  items: UjatRegistrationLocalSaveRecord[]
}

export type UjatRegistrationLocalSaveRecord = {
  version: 1
  id: string
  idempotencyKey?: string
  savedAt: string
  program: Program
  registrationDraft: WritingFormDraft
  registrationOverlay: Record<string, unknown>
}

function resolveDefaultSponsorId(): string {
  const ja = mockSponsors.find(
    s => s.name.includes('JA Korea') || s.name.includes('고유목적') || s.name.includes('JA')
  )
  return ja?.id ?? mockSponsors[0].id
}

function overlayString(overlay: Record<string, unknown>, key: string): string | undefined {
  const v = overlay[key]
  return typeof v === 'string' ? v : undefined
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function newLocalProgramId(): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  return `${UJAT_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX}${uuid ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`
}

export function buildUjatProgramListRowFromRegistrationSnapshot(args: {
  id: string
  overlay: Record<string, unknown>
}): Program {
  const now = new Date().toISOString()
  const sponsorRaw = overlayString(args.overlay, 'ujat.basicInfo.sponsorId')
  const sponsorId =
    sponsorRaw && sponsorRaw !== SPONSOR_ALL_VALUE ? sponsorRaw : resolveDefaultSponsorId()

  const repKo =
    overlayString(args.overlay, 'ujat.basicInfo.repKo')?.trim() || '대학생경제교육봉사단'
  const programManagementName =
    overlayString(args.overlay, 'ujat.basicInfo.programManagementName')?.trim() ||
    `${dayjs().year()}년 JA Korea 초등 경제교육 대상 학교 및 대학생경제교육봉사단 모집`

  const title = programManagementName

  const seal = args.overlay['ujat.basicInfo.operationRangeSeal'] as
    | { start?: string | null; end?: string | null }
    | undefined
    | null

  let startDate: string
  let endDate: string
  if (seal?.start && seal?.end) {
    startDate = dayjs(seal.start).startOf('day').toISOString()
    endDate = dayjs(seal.end).endOf('day').toISOString()
  } else {
    const y = dayjs().year()
    startDate = `${y}-01-01T00:00:00.000Z`
    endDate = `${y}-12-31T23:59:59.999Z`
  }

  const id = args.id
  const round: ProgramRound = {
    id: `${id}-round-1`,
    programId: id,
    roundNumber: 1,
    startDate,
    endDate,
    capacity: 30,
    status: 'active',
    deliveryType: 'offline',
  }

  return {
    id,
    sponsorId,
    title,
    type: 'offline',
    format: 'course',
    category: 'school',
    rounds: [round],
    startDate,
    endDate,
    status: 'active',
    lifecycleStatus: 'planned',
    ujatProgressStatus: 'EDUCATION_SCHEDULED',
    participatingSchoolCount: 0,
    instructorCapacity: 30,
    generalVolunteers: 0,
    staffVolunteers: 0,
    returningVolunteers: 0,
    approvedStudentCount: 0,
    targetLevel: 'elementary',
    mainTitle: repKo,
    createdAt: now,
    updatedAt: now,
  }
}

export function readUjatRegistrationLocalSaveRecords(): UjatRegistrationLocalSaveRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LocalSaveFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) return []
    return parsed.items.filter(
      (row): row is UjatRegistrationLocalSaveRecord =>
        row != null &&
        typeof row === 'object' &&
        row.version === 1 &&
        typeof row.id === 'string' &&
        row.id.startsWith(UJAT_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX) &&
        row.program != null &&
        typeof row.program === 'object'
    )
  } catch {
    return []
  }
}

export function readUjatRegistrationLocalSavePrograms(): Program[] {
  return readUjatRegistrationLocalSaveRecords().map(r => r.program)
}

export function findUjatRegistrationLocalSaveProgramById(id: string): Program | undefined {
  return readUjatRegistrationLocalSaveRecords().find(r => r.id === id)?.program
}

export function persistUjatRegistrationFormLocal(args: {
  draft: WritingFormDraft
  overlay: Record<string, unknown>
  idempotencyKey?: string
}): Program {
  const prev = readUjatRegistrationLocalSaveRecords()
  const existing = args.idempotencyKey
    ? prev.find(record => record.idempotencyKey === args.idempotencyKey)
    : undefined
  if (existing) return existing.program

  const id = newLocalProgramId()
  const program = buildUjatProgramListRowFromRegistrationSnapshot({ id, overlay: args.overlay })
  const record: UjatRegistrationLocalSaveRecord = {
    version: 1,
    id,
    idempotencyKey: args.idempotencyKey,
    savedAt: new Date().toISOString(),
    program,
    registrationDraft: cloneJson(args.draft),
    registrationOverlay: cloneJson(args.overlay),
  }

  const nextFile: LocalSaveFile = { version: 1, items: [...prev, record] }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFile))

  return program
}

export function updateUjatRegistrationLocalProgram(
  id: string,
  patch: Partial<Program>
): Program | undefined {
  const records = readUjatRegistrationLocalSaveRecords()
  const index = records.findIndex(record => record.id === id)
  if (index < 0) return undefined

  const current = records[index]
  const program: Program = {
    ...current.program,
    ...patch,
    id,
    createdAt: current.program.createdAt,
    updatedAt: new Date().toISOString(),
  }
  records[index] = { ...current, savedAt: program.updatedAt.toString(), program }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: records } satisfies LocalSaveFile))
  return program
}

export function deleteUjatRegistrationLocalProgram(id: string): boolean {
  const records = readUjatRegistrationLocalSaveRecords()
  const next = records.filter(record => record.id !== id)
  if (next.length === records.length) return false
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: next } satisfies LocalSaveFile))
  return true
}
