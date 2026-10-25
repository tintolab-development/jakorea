/**
 * UJAT 프로그램 등록 폼 — API 연동 전 임시 저장 (localStorage).
 * 등록 에디터 재개용이며 관리 목록 카탈로그에 합치지 않는다.
 */

import dayjs from 'dayjs'
import type { Program, ProgramRound } from '@/types/domain'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  stripUjatBasicInfoOverlay,
  type UjatBasicInfoFormValues,
} from './ujat-basic-info-form'
import { applyUjatRegistrationOverlayToProgram } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import {
  applyUjatRecruitInstitutionOverlayOntoProgram,
  pickUjatRecruitInstitutionOverlay,
} from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import {
  applyUjatRecruitVolunteerOverlayOntoProgram,
  pickUjatRecruitVolunteerOverlay,
  stampUjatVolunteerActivityTermsOnRounds,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import { collectSelectedRecruitOverlaysForProgram } from '@/features/program/general/lib/registration-operational-form-drafts'
import { completeUjatRecruitDateSelections } from '@/features/program/ujat/lib/complete-recruit-date-selections'
import { getUjatApplicationInstitutionOverlayRecord } from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import {
  getUjatApplicationVolunteerProgramOverlayRecord,
  stripUjatApplicationVolunteerProgramOnlyFields,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'

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
  return ''
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

const UJAT_RECRUIT_SNAPSHOT_PROGRAM = {
  id: 'ujat-registration-snapshot',
  ujatProgressStatus: 'EDUCATION_SCHEDULED',
} as Program

/** 등록 공통 + 모집·신청 탭 overlay. 상세·formBindings가 같은 스냅샷을 보게 한다. */
export function collectUjatRegistrationCreateOverlay(
  registrationOverlay: Record<string, unknown> = {}
): Record<string, unknown> {
  return stripUjatApplicationVolunteerProgramOnlyFields(
    completeUjatRecruitDateSelections({
      ...getUjatApplicationInstitutionOverlayRecord(),
      ...getUjatApplicationVolunteerProgramOverlayRecord(),
      ...registrationOverlay,
      ...collectSelectedRecruitOverlaysForProgram(UJAT_RECRUIT_SNAPSHOT_PROGRAM),
    })
  )
}

export function buildUjatProgramListRowFromRegistrationSnapshot(args: {
  id: string
  overlay: Record<string, unknown>
  basicInfo?: Partial<UjatBasicInfoFormValues>
}): Program {
  const now = new Date().toISOString()
  const overlay = args.basicInfo
    ? stripUjatBasicInfoOverlay(args.overlay)
    : args.overlay
  const sponsorRaw =
    args.basicInfo?.sponsorId?.trim() || overlayString(overlay, 'ujat.basicInfo.sponsorId')
  const sponsorId =
    sponsorRaw && sponsorRaw !== SPONSOR_ALL_VALUE ? sponsorRaw : resolveDefaultSponsorId()

  const repKo = args.basicInfo?.mainTitle?.trim() || overlayString(overlay, 'ujat.basicInfo.repKo') || ''
  const programManagementName =
    args.basicInfo?.title?.trim() ||
    overlayString(overlay, 'ujat.basicInfo.programManagementName') ||
    ''

  const title = programManagementName

  const seal = overlay['ujat.basicInfo.operationRangeSeal'] as
    | { start?: string | null; end?: string | null }
    | undefined
    | null

  let startDate = ''
  let endDate = ''
  const basicInfoStart = args.basicInfo?.startDate?.trim()
  const basicInfoEnd = args.basicInfo?.endDate?.trim()
  if (basicInfoStart && basicInfoEnd) {
    startDate = dayjs(basicInfoStart).startOf('day').toISOString()
    endDate = dayjs(basicInfoEnd).endOf('day').toISOString()
  } else if (seal?.start && seal?.end) {
    startDate = dayjs(seal.start).startOf('day').toISOString()
    endDate = dayjs(seal.end).endOf('day').toISOString()
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

  const participantTypes = args.basicInfo?.generalParticipantTypes
  const surveyKeys = [
    args.basicInfo?.surveySurvey ? 'survey' : null,
    args.basicInfo?.surveyVolunteerSatisfaction ? 'volunteer_satisfaction' : null,
    args.basicInfo?.surveySchoolSatisfaction ? 'school_satisfaction' : null,
    args.basicInfo?.surveyLectureEvaluation ? 'lecture_evaluation' : null,
  ].filter((key): key is string => key != null)
  const base: Program = {
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
    titleEn:
      args.basicInfo?.titleEn?.trim() || overlayString(overlay, 'ujat.basicInfo.repEn') || '',
    businessArea:
      args.basicInfo?.businessArea?.trim() ||
      overlayString(overlay, 'ujat.basicInfo.businessField') ||
      undefined,
    detailedProgramId:
      args.basicInfo?.detailedProgramId?.trim() ||
      overlayString(overlay, 'ujat.basicInfo.detailedProgramId') ||
      undefined,
    educationProcess:
      args.basicInfo?.educationProcess?.trim() ||
      overlayString(overlay, 'ujat.basicInfo.educationCourse') ||
      undefined,
    ipOwned: args.basicInfo?.ipOwned ?? overlayString(overlay, 'ujat.basicInfo.ipOwned'),
    courseDeliveredBy:
      args.basicInfo?.courseDeliveredBy ??
      (overlayString(overlay, 'ujat.basicInfo.courseDeliveredBy') as Program['courseDeliveredBy']),
    partnerInvolvement:
      args.basicInfo?.partnerInvolvement ??
      (overlayString(overlay, 'ujat.basicInfo.partnerInvolvement') === 'yes'),
    generalParticipantTypes: participantTypes as Program['generalParticipantTypes'],
    generalSurveyMenuKeys: surveyKeys as Program['generalSurveyMenuKeys'],
    generalCommonInfo: {
      sponsorManagerContactIds: args.basicInfo?.sponsorManagerContactIds,
      sponsorManagerContactId: args.basicInfo?.sponsorManagerContactId,
      sponsorManagerLine: args.basicInfo?.managerName,
      educationProcess: args.basicInfo?.educationProcess,
      ipOwned: args.basicInfo?.ipOwned,
      courseDeliveredBy: args.basicInfo?.courseDeliveredBy,
      partnerInvolvement: args.basicInfo?.partnerInvolvement,
    },
    createdAt: now,
    updatedAt: now,
  }

  // 버그 수정: 예전엔 제목·기간만 있는 뼈대를 그대로 create에 써서
  // 등록 실입력(영문명·사업분야·IP·KPI 등)이 1차 컬럼에 안 실렸다.
  return applyUjatRegistrationCreateOverlaysToProgram(base, overlay)
}

/** 등록 공통정보가 운영 식별·기간 SSOT. 모집 overlay는 담당자·모집기간만 얹는다. */
function applyUjatRegistrationCreateOverlaysToProgram(
  program: Program,
  overlay: Record<string, unknown>
): Program {
  const withRegistration = applyUjatRegistrationOverlayToProgram(program, overlay, {
    fillDefaults: false,
  })
  const withInstitution = applyUjatRecruitInstitutionOverlayOntoProgram(
    withRegistration,
    pickUjatRecruitInstitutionOverlay(overlay)
  )
  const withVolunteer = applyUjatRecruitVolunteerOverlayOntoProgram(
    withInstitution,
    pickUjatRecruitVolunteerOverlay(overlay)
  )

  return {
    ...withVolunteer,
    title: withRegistration.title,
    mainTitle: withRegistration.mainTitle,
    titleEn: withRegistration.titleEn,
    startDate: withRegistration.startDate,
    endDate: withRegistration.endDate,
    detailedProgramId: withRegistration.detailedProgramId,
    businessArea: withRegistration.businessArea,
    teamDivision: withRegistration.teamDivision,
    rounds: stampUjatVolunteerActivityTermsOnRounds(
      withRegistration.rounds,
      pickUjatRecruitVolunteerOverlay(overlay)
    ),
    ujatRegistrationOverlay: overlay,
    generalCommonInfo: {
      ...withVolunteer.generalCommonInfo,
      detailedProgramName: withRegistration.generalCommonInfo?.detailedProgramName,
      announcementTitle: withRegistration.generalCommonInfo?.announcementTitle,
      kpi: withRegistration.generalCommonInfo?.kpi,
      paymentItems: withRegistration.generalCommonInfo?.paymentItems,
      deductionItems: withRegistration.generalCommonInfo?.deductionItems,
      sponsorManagerLine: withRegistration.generalCommonInfo?.sponsorManagerLine,
    },
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
