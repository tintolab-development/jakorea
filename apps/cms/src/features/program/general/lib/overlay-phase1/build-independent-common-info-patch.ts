/**
 * Independent 전용 PATCH 조각. 제품 mapGeneralProgramToUpdateRequest 를 바꾸지 않는다.
 * 변경되지 않은 nested 배열은 키를 생략한다. 명시적 삭제는 [].
 */
import type { Program } from '@/types/domain'
import {
  mapGeneralProgramToUpdateRequest,
  type ProgramUpdateRequestBody,
} from '@/features/program/general/api/adapters/general-program-adapters'
import type {
  IndependentCommonInfoBuildResult,
  IndependentSessionAuthoring,
} from './common-info-form-values'
import {
  kpiCommonInfoFieldsUnchanged,
  wageCommonInfoFieldsUnchanged,
} from '@/features/program/general/lib/general-program-service-detail-json'
import {
  nestedRowsEqual,
  resolveNestedArrayIntent,
  type NestedArrayPatchIntent,
} from './independent-session-authoring'
import { toWireSponsorManagerContactIds } from '@/features/program/shared/lib/sponsor-contact-unselected-option'

const NESTED_INTENT_KEYS = new Set(['curriculumSessions', 'scheduleDetails'])

const INDEPENDENT_ROOT_PATCH_FIELDS = [
  { key: 'title', dirty: ['mainTitle'] },
  { key: 'mainTitle', dirty: ['mainTitle'] },
  { key: 'titleEn', dirty: ['titleEn'] },
  { key: 'startDate', dirty: ['startDate'] },
  { key: 'endDate', dirty: ['endDate'] },
  { key: 'educationProcess', dirty: ['educationProcess'] },
  { key: 'ipOwned', dirty: ['ipOwned'] },
  { key: 'courseDeliveredBy', dirty: ['courseDeliveredBy'] },
  { key: 'businessArea', dirty: ['businessArea'] },
  { key: 'partnerInvolvement', dirty: ['partnerInvolvement'] },
  { key: 'type', dirty: ['educationForm'] },
  { key: 'generalProgramEducationStructure', dirty: ['educationStructure'] },
  { key: 'generalProgramSessionRound', dirty: ['sessionRound'] },
] as const satisfies ReadonlyArray<{
  key: keyof Program
  dirty: readonly string[]
}>

const GENERATED_DEFAULT_COMMON_INFO_DEPENDENCIES = {
  educationFormLabel: ['educationForm', 'educationFormScheduleDetail'],
  educationFormScheduleDetail: ['educationFormScheduleDetail'],
  participationScheduleDetail: ['participationScheduleDetail'],
  ipsScheduleDetail: ['ipsScheduleDetail'],
  educationScheduleMode: ['educationScheduleMode', 'participantOrganization', 'sessionRound'],
  ipsTypeSummary: ['ipsScheduleDetail', 'ipsCategory', 'ipsDetail'],
  participationMethod: [
    'participantIndividual',
    'participantOrganization',
    'participationMethod',
    'participationScheduleDetail',
  ],
  scheduleCurriculumPreEducation: ['scheduleCurriculumPreEducation'],
} as const

function isEmptyCommonInfoValue(value: unknown): boolean {
  if (value == null || value === '') return true
  return Array.isArray(value) && value.length === 0
}

function commonInfoValueUnchanged(next: unknown, existing: unknown): boolean {
  if (JSON.stringify(next ?? null) === JSON.stringify(existing ?? null)) return true
  return isEmptyCommonInfoValue(next) && isEmptyCommonInfoValue(existing)
}

function omitUnchangedCommonInfoKeys(
  patchCommon: NonNullable<Program['generalCommonInfo']>,
  baselineCommon: Program['generalCommonInfo']
) {
  for (const key of Object.keys(patchCommon) as Array<keyof typeof patchCommon>) {
    if (NESTED_INTENT_KEYS.has(key)) continue
    if (commonInfoValueUnchanged(patchCommon[key], baselineCommon?.[key])) {
      delete patchCommon[key]
    }
  }
}

function formFieldChanged(
  changedFormKeys: ReadonlySet<string> | undefined,
  keys: readonly string[]
): boolean {
  // Undefined means the caller cannot tell what changed; preserve legacy behavior.
  if (!changedFormKeys) return true
  return keys.some(key => changedFormKeys.has(key))
}

function assignChangedIndependentRootFields(
  patch: Partial<Program>,
  draft: Program,
  baseline: Program,
  changedFormKeys: ReadonlySet<string> | undefined
) {
  for (const field of INDEPENDENT_ROOT_PATCH_FIELDS) {
    const next = draft[field.key]
    const existing = baseline[field.key]
    if (commonInfoValueUnchanged(next, existing)) continue
    if (changedFormKeys && !formFieldChanged(changedFormKeys, field.dirty)) continue
    ;(patch as Record<string, unknown>)[field.key] = next
  }
}

const SPONSOR_ASSIGNMENT_COMMON_INFO_KEYS = [
  'sponsorDisplayName',
  'sponsorManagementId',
  'sponsorManagementIds',
  'sponsorManagerContactIds',
  'sponsorManagerContactId',
  'sponsorManagerLine',
  'sponsorManagerContactNames',
  'sponsorManagementNames',
  'sponsorAssignmentDetails',
  'sponsorManagerContactDetails',
] as const

function normalizeSponsorIdList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(id => String(id).trim()).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

function sponsorIdListsEqual(next: unknown, existing: unknown): boolean {
  const left = normalizeSponsorIdList(next)
  const right = normalizeSponsorIdList(existing)
  return left.length === right.length && left.every((id, index) => id === right[index])
}

function contactIdListsEqual(next: unknown, existing: unknown): boolean {
  const left = toWireSponsorManagerContactIds([
    ...(Array.isArray(next) ? next.map(id => String(id)) : typeof next === 'string' ? [next] : []),
  ])
  const right = toWireSponsorManagerContactIds([
    ...(Array.isArray(existing)
      ? existing.map(id => String(id))
      : typeof existing === 'string'
        ? [existing]
        : []),
  ])
  return left.length === right.length && left.every((id, index) => id === right[index])
}

function sponsorAssignmentsUnchanged(
  patchCommon: NonNullable<Program['generalCommonInfo']>,
  baselineCommon: Program['generalCommonInfo']
): boolean {
  const nextIds = patchCommon.sponsorManagementIds ?? patchCommon.sponsorManagementId
  const existingIds = baselineCommon?.sponsorManagementIds ?? baselineCommon?.sponsorManagementId
  const nextContacts = patchCommon.sponsorManagerContactIds ?? patchCommon.sponsorManagerContactId
  const existingContacts =
    baselineCommon?.sponsorManagerContactIds ?? baselineCommon?.sponsorManagerContactId
  return sponsorIdListsEqual(nextIds, existingIds) && contactIdListsEqual(nextContacts, existingContacts)
}

function omitUnchangedSponsorAssignments(
  patchCommon: NonNullable<Program['generalCommonInfo']>,
  baselineCommon: Program['generalCommonInfo']
) {
  // 이름 map은 선택 SSOT가 아니다. 변경/미변경 모두 write source로 보내지 않는다.
  delete patchCommon.sponsorManagerContactNames
  delete patchCommon.sponsorManagementNames
  delete patchCommon.sponsorAssignmentDetails
  delete patchCommon.sponsorManagerContactDetails
  const hasAssignmentIds = [
    'sponsorManagementIds',
    'sponsorManagementId',
    'sponsorManagerContactIds',
    'sponsorManagerContactId',
  ].some(key => Object.prototype.hasOwnProperty.call(patchCommon, key))
  if (!hasAssignmentIds) {
    for (const key of SPONSOR_ASSIGNMENT_COMMON_INFO_KEYS) {
      delete patchCommon[key]
    }
    return
  }
  if (!sponsorAssignmentsUnchanged(patchCommon, baselineCommon)) return
  for (const key of SPONSOR_ASSIGNMENT_COMMON_INFO_KEYS) {
    delete patchCommon[key]
  }
}

/** 일정 상세를 사용자가 건드리지 않았으면 mapper 기본값 차이로 배열을 재전송하지 않는다. */
const SCHEDULE_DETAILS_DIRTY_KEYS = [
  'scheduleDetails',
  'scheduleCurriculumPreEducation',
  'educationScheduleMode',
  'sessionRound',
  'educationStructure',
  'educationFormScheduleDetail',
  'participationScheduleDetail',
  'ipsScheduleDetail',
] as const

const COMMON_INFO_FORM_DEPENDENCIES = {
  announcementTitle: ['announcementTitle'],
  detailedProgramName: ['detailedProgramId'],
  sponsorDisplayName: ['sponsorManagementIds'],
  sponsorManagementId: ['sponsorManagementIds'],
  sponsorManagementIds: ['sponsorManagementIds'],
  sponsorManagerContactIds: ['sponsorManagerContactIds', 'sponsorManagerContactId'],
  sponsorManagerContactId: ['sponsorManagerContactIds', 'sponsorManagerContactId'],
  sponsorManagerLine: ['sponsorManagerContactIds', 'sponsorManagerContactId'],
  venueKind: ['venueKind'],
  venueDetail: ['venueDetail'],
  educationScheduleLines: ['educationScheduleLines', 'educationScheduleMode'],
  educationScheduleMode: ['educationScheduleMode'],
  kpi: [
    'kpiFinalParticipants',
    'kpiInstructorCount',
    'kpiVolunteerCount',
    'kpiFinalSchools',
    'kpiFinalClasses',
  ],
  wageGradeRows: ['wageGrade1Amount', 'wageGrade2Amount', 'wageGrade3Amount'],
  paymentItems: ['wagePaymentItemIds'],
  deductionItems: ['wagePaymentItemIds'],
} as const

function omitUndirtiedScheduleDetailsReplace<T>(
  schedule: { intent: NestedArrayPatchIntent; value?: T[] },
  changedFormKeys: ReadonlySet<string> | undefined
): { intent: NestedArrayPatchIntent; value?: T[] } {
  if (schedule.intent !== 'replace') return schedule
  if (formFieldChanged(changedFormKeys, SCHEDULE_DETAILS_DIRTY_KEYS)) return schedule
  return { intent: 'omit' }
}

function omitUndirtiedMapperRewrites(
  patchCommon: NonNullable<Program['generalCommonInfo']>,
  changedFormKeys: ReadonlySet<string> | undefined
) {
  if (!changedFormKeys) return
  for (const [key, dependencies] of Object.entries(COMMON_INFO_FORM_DEPENDENCIES)) {
    if (!Object.prototype.hasOwnProperty.call(patchCommon, key)) continue
    if (formFieldChanged(changedFormKeys, dependencies)) continue
    delete patchCommon[key as keyof typeof patchCommon]
  }
}

function omitGeneratedDefaultsWithoutDirtyInput(
  patchCommon: NonNullable<Program['generalCommonInfo']>,
  baselineCommon: Program['generalCommonInfo'],
  changedFormKeys: ReadonlySet<string> | undefined
) {
  for (const [key, dependencies] of Object.entries(GENERATED_DEFAULT_COMMON_INFO_DEPENDENCIES)) {
    if (!Object.prototype.hasOwnProperty.call(patchCommon, key)) continue
    if (baselineCommon && Object.prototype.hasOwnProperty.call(baselineCommon, key)) continue
    if (formFieldChanged(changedFormKeys, dependencies)) continue
    delete patchCommon[key as keyof typeof patchCommon]
  }
}

export type IndependentCommonInfoPatchResult = {
  programDraft: Program
  /** 제품 훅에 넘기기 전 Independent 계약 PATCH. registrationOverlay 기본 생략 */
  patch: Partial<Program>
  generalCommonInfoPatch: NonNullable<Program['generalCommonInfo']>
  curriculumSessionsIntent: 'omit' | 'clear' | 'replace'
  scheduleDetailsIntent: 'omit' | 'clear' | 'replace'
  /**
   * 제품 mapper는 generalCommonInfo 객체를 통째로 serialize 한다.
   * Independent 는 overlayMerge nested-ssot 로 stale unit map 복원을 막는다.
   */
  productMapperReserializesUnchangedNested: true
}

export function buildIndependentCommonInfoPatch(args: {
  draft: IndependentCommonInfoBuildResult
  baseline: Program
  sessionAuthoring?: IndependentSessionAuthoring
  includeRegistrationOverlay?: boolean
  changedFormKeys?: ReadonlySet<string>
}): IndependentCommonInfoPatchResult {
  const draftCommon = args.draft.programDraft.generalCommonInfo
  const baselineCommon = args.baseline.generalCommonInfo
  const curriculum = resolveNestedArrayIntent(
    args.sessionAuthoring?.curriculum,
    draftCommon?.curriculumSessions,
    baselineCommon?.curriculumSessions
  )
  const schedule = omitUndirtiedScheduleDetailsReplace(
    resolveNestedArrayIntent(
      args.sessionAuthoring?.schedule,
      draftCommon?.scheduleDetails,
      baselineCommon?.scheduleDetails
    ),
    args.changedFormKeys
  )

  const generalCommonInfoPatch: NonNullable<Program['generalCommonInfo']> = {
    ...(draftCommon ?? {}),
  }
  if (curriculum.intent === 'omit') {
    delete generalCommonInfoPatch.curriculumSessions
  } else {
    generalCommonInfoPatch.curriculumSessions = curriculum.value ?? []
  }
  if (schedule.intent === 'omit') {
    delete generalCommonInfoPatch.scheduleDetails
  } else {
    generalCommonInfoPatch.scheduleDetails = schedule.value ?? []
  }
  if (wageCommonInfoFieldsUnchanged(draftCommon, baselineCommon)) {
    delete generalCommonInfoPatch.wageGradeRows
    delete generalCommonInfoPatch.paymentItems
    delete generalCommonInfoPatch.deductionItems
  }
  if (kpiCommonInfoFieldsUnchanged(draftCommon, baselineCommon)) {
    delete generalCommonInfoPatch.kpi
  }
  delete generalCommonInfoPatch.participantRecruitmentInfo
  delete generalCommonInfoPatch.instructorRecruitmentInfo
  delete generalCommonInfoPatch.volunteerRecruitmentInfo
  delete generalCommonInfoPatch.volunteerInterviewScheduleInfo
  omitUnchangedCommonInfoKeys(generalCommonInfoPatch, baselineCommon)
  omitGeneratedDefaultsWithoutDirtyInput(
    generalCommonInfoPatch,
    baselineCommon,
    args.changedFormKeys
  )
  omitUndirtiedMapperRewrites(generalCommonInfoPatch, args.changedFormKeys)
  omitUnchangedSponsorAssignments(generalCommonInfoPatch, baselineCommon)

  const patch: Partial<Program> = {}
  assignChangedIndependentRootFields(
    patch,
    args.draft.programDraft,
    args.baseline,
    args.changedFormKeys
  )
  if (Object.keys(generalCommonInfoPatch).length > 0) {
    patch.generalCommonInfo = generalCommonInfoPatch
  }
  if (args.includeRegistrationOverlay) {
    patch.registrationOverlay = args.draft.persistOverlay
  }

  return {
    programDraft: args.draft.programDraft,
    patch,
    generalCommonInfoPatch,
    curriculumSessionsIntent: curriculum.intent,
    scheduleDetailsIntent: schedule.intent,
    productMapperReserializesUnchangedNested: true,
  }
}

export function independentCurriculumSessionsUnchanged(
  draft: Program,
  baseline: Program
): boolean {
  return nestedRowsEqual(
    draft.generalCommonInfo?.curriculumSessions,
    baseline.generalCommonInfo?.curriculumSessions
  )
}

/**
 * Independent PATCH → 기존 제품 Mapper. 제품 저장 훅은 호출하지 않는다.
 * 제품 mutation과 같이 draft + patch + baseline 순서를 쓴다.
 */
export function mapIndependentCommonInfoPatchToUpdateRequest(
  baseline: Program,
  aligned: IndependentCommonInfoPatchResult
): ProgramUpdateRequestBody {
  return mapGeneralProgramToUpdateRequest(aligned.programDraft, aligned.patch, baseline, {
    overlayMerge: 'nested-ssot',
  })
}
