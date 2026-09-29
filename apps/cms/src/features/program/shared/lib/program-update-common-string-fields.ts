/**
 * BE handoff 2026-09-29 — ProgramUpdateRequest top-level 문자열 필드.
 * `contactName` / `otherMatters` / `recruitmentTargetDetail`
 * 빈 문자열은 보내지 않고, 삭제는 `clearFields` canonical 이름만 사용한다.
 */

import type {
  GeneralProgramParticipantRecruitmentInfo,
  Program,
} from '@/types/domain'

export const PROGRAM_UPDATE_COMMON_STRING_CLEAR_FIELDS = [
  'contactName',
  'otherMatters',
  'recruitmentTargetDetail',
] as const

export type ProgramUpdateCommonStringClearField =
  (typeof PROGRAM_UPDATE_COMMON_STRING_CLEAR_FIELDS)[number]

export type ProgramUpdateCommonStringFieldsBody = {
  contactName?: string | null
  otherMatters?: string | null
  recruitmentTargetDetail?: string | null
  clearFields?: string[] | null
}

function trimOrUndefined(value: string | null | undefined): string | undefined {
  const next = value?.trim()
  return next ? next : undefined
}

/** 문의처/담당자 표시명 — nested contactName → org name (BE alias). managerName과 분리. */
export function resolveProgramInquiryContactName(program: Program): string | undefined {
  const info = program.generalCommonInfo?.participantRecruitmentInfo
  return (
    trimOrUndefined(program.contactName) ||
    trimOrUndefined(info?.contactName) ||
    trimOrUndefined(info?.contactOrganizationName) ||
    undefined
  )
}

/** 기타 안내 — domain `otherNotes` ↔ BE `otherMatters` (remarks와 분리) */
export function resolveProgramOtherMatters(program: Program): string | undefined {
  return trimOrUndefined(program.otherNotes)
}

/** 모집 대상 상세 — top-level → nested recruitmentTargetDetail → educationTargetDetail */
export function resolveProgramRecruitmentTargetDetail(program: Program): string | undefined {
  const info = program.generalCommonInfo?.participantRecruitmentInfo
  return (
    trimOrUndefined(program.recruitmentTargetDetail) ||
    trimOrUndefined(info?.recruitmentTargetDetail) ||
    trimOrUndefined(info?.educationTargetDetail) ||
    trimOrUndefined(program.educationTargetDetail) ||
    undefined
  )
}

function patchHasKey(patch: Partial<Program>, key: keyof Program): boolean {
  return Object.prototype.hasOwnProperty.call(patch, key)
}

function patchTouchesContactName(patch: Partial<Program>): boolean {
  return patchHasKey(patch, 'contactName') || patchHasKey(patch, 'generalCommonInfo')
}

function patchTouchesOtherMatters(patch: Partial<Program>): boolean {
  return patchHasKey(patch, 'otherNotes') || patchHasKey(patch, 'generalCommonInfo')
}

function patchTouchesRecruitmentTargetDetail(patch: Partial<Program>): boolean {
  return (
    patchHasKey(patch, 'recruitmentTargetDetail') ||
    patchHasKey(patch, 'educationTargetDetail') ||
    patchHasKey(patch, 'generalCommonInfo')
  )
}

function appendClearField(
  clearFields: string[],
  field: ProgramUpdateCommonStringClearField
): void {
  if (!clearFields.includes(field)) clearFields.push(field)
}

function wireNullableStringField(args: {
  body: ProgramUpdateCommonStringFieldsBody
  clearFields: string[]
  apiField: ProgramUpdateCommonStringClearField
  next: string | undefined
  previous: string | undefined
  include: boolean
}): void {
  if (!args.include) return
  // 변경된 필드만 body에 실음 (키 생략 = 유지)
  if (args.next === args.previous) return
  if (args.next) {
    args.body[args.apiField] = args.next
    return
  }
  // 빈 값: "" 금지. 이전 값이 있을 때만 clearFields
  if (args.previous) {
    appendClearField(args.clearFields, args.apiField)
  }
}

/**
 * UpdateRequest에 세 필드를 실는다.
 * - mode `full`: 항상 평가 (전체 직렬화·TT 등)
 * - mode `patch`: patch가 해당 도메인 키를 건드릴 때만
 */
export function applyProgramMissingCommonStringFieldsToUpdateRequest(
  body: ProgramUpdateCommonStringFieldsBody,
  args: {
    merged: Program
    existing?: Program
    patch?: Partial<Program>
    mode: 'full' | 'patch'
  }
): void {
  const existing = args.existing ?? args.merged
  const clearFields = [...(body.clearFields ?? [])]
  const isFull = args.mode === 'full'
  const patch = args.patch

  wireNullableStringField({
    body,
    clearFields,
    apiField: 'contactName',
    next: resolveProgramInquiryContactName(args.merged),
    previous: resolveProgramInquiryContactName(existing),
    include: isFull || (patch != null && patchTouchesContactName(patch)),
  })
  wireNullableStringField({
    body,
    clearFields,
    apiField: 'otherMatters',
    next: resolveProgramOtherMatters(args.merged),
    previous: resolveProgramOtherMatters(existing),
    include: isFull || (patch != null && patchTouchesOtherMatters(patch)),
  })
  wireNullableStringField({
    body,
    clearFields,
    apiField: 'recruitmentTargetDetail',
    next: resolveProgramRecruitmentTargetDetail(args.merged),
    previous: resolveProgramRecruitmentTargetDetail(existing),
    include: isFull || (patch != null && patchTouchesRecruitmentTargetDetail(patch)),
  })

  if (clearFields.length > 0) {
    body.clearFields = clearFields
  }
}

/**
 * GET ProgramResponse 컬럼 → nested participantRecruitmentInfo hydrate.
 * top-level이 있으면 nested stale 값을 덮는다.
 */
export function mergeProgramResponseCommonStringFieldsIntoRecruitmentInfo(
  info: GeneralProgramParticipantRecruitmentInfo | undefined,
  dto: {
    contactName?: string | null
    recruitmentTargetDetail?: string | null
  }
): GeneralProgramParticipantRecruitmentInfo {
  const base: GeneralProgramParticipantRecruitmentInfo = { ...(info ?? {}) }
  const contactName = trimOrUndefined(dto.contactName ?? undefined)
  const recruitmentTargetDetail = trimOrUndefined(dto.recruitmentTargetDetail ?? undefined)
  if (contactName) base.contactName = contactName
  if (recruitmentTargetDetail) base.recruitmentTargetDetail = recruitmentTargetDetail
  return base
}

export function resolveOtherNotesFromProgramResponse(dto: {
  otherMatters?: string | null
  otherNotes?: string | null
}): string | undefined {
  return trimOrUndefined(dto.otherMatters ?? undefined) || trimOrUndefined(dto.otherNotes ?? undefined)
}
