/**
 * BE handoff 2026-09-29 — ProgramUpdateRequest top-level 문자열 필드.
 * `contactName` / `otherMatters` / `recruitmentTargetDetail`
 * 빈 문자열은 보내지 않고, 삭제는 `clearFields` canonical 이름만 사용한다.
 */

import type { GeneralProgramParticipantRecruitmentInfo, Program } from '@/types/domain'

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

function appendClearField(clearFields: string[], field: ProgramUpdateCommonStringClearField): void {
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
  if (dto.contactName !== undefined) {
    base.contactName = trimOrUndefined(dto.contactName)
  }
  if (dto.recruitmentTargetDetail !== undefined) {
    base.recruitmentTargetDetail = trimOrUndefined(dto.recruitmentTargetDetail)
  }
  return base
}

export function resolveOtherNotesFromProgramResponse(dto: {
  otherMatters?: string | null
  otherNotes?: string | null
}): string | undefined {
  if (dto.otherMatters !== undefined) {
    return trimOrUndefined(dto.otherMatters)
  }
  return trimOrUndefined(dto.otherNotes)
}

/** 참여자 모집 비고 — top-level remarks, 없으면 nested. otherNotes(otherMatters)와 분리. */
export function resolveParticipantRecruitmentRemarks(program: Program): string | undefined {
  return (
    trimOrUndefined(program.remarks) ||
    trimOrUndefined(program.generalCommonInfo?.participantRecruitmentInfo?.remarks)
  )
}

type RecruitmentParticipantColumnBody = {
  applicationMethod?: string | null
  remarks?: string | null
  clearFields?: string[] | null
}

/**
 * 모집 탭 부분 PATCH — `applicationMethod`·`remarks` 컬럼.
 * 키를 건드린 경우에만 싣고, 빈 값 삭제는 clearFields. otherNotes는 넣지 않는다.
 */
export function applyRecruitmentParticipantColumnFieldsToUpdateRequest(
  body: RecruitmentParticipantColumnBody,
  args: {
    merged: Program
    existing: Program
    patch: Partial<Program>
  }
): void {
  const clearFields = [...(body.clearFields ?? [])]

  if (patchHasKey(args.patch, 'applicationMethod')) {
    const next = trimOrUndefined(args.merged.applicationMethod)
    const previous = trimOrUndefined(args.existing.applicationMethod)
    if (next !== previous) {
      if (next) body.applicationMethod = next
      else if (previous) appendClearFieldName(clearFields, 'applicationMethod')
    }
  }

  if (patchHasKey(args.patch, 'remarks')) {
    const next = resolveParticipantRecruitmentRemarks(args.merged)
    const previous = resolveParticipantRecruitmentRemarks(args.existing)
    if (next !== previous) {
      if (next) body.remarks = next
      else if (previous) appendClearFieldName(clearFields, 'remarks')
    }
  }

  if (clearFields.length > 0) body.clearFields = clearFields
}

function appendClearFieldName(clearFields: string[], field: string): void {
  if (!clearFields.includes(field)) clearFields.push(field)
}

/**
 * GET 참여자 컬럼이 있으면 nested보다 우선한다.
 * 컬럼이 null/공백이면 참여자 nested의 같은 키를 비워 화면이 옛 값을 되살리지 않게 한다.
 * 응답에 키가 없으면(구 페이로드) nested를 유지한다.
 */
export function applyParticipantRecruitmentColumnsFromResponse(
  program: Program,
  dto: { applicationMethod?: string | null; remarks?: string | null }
): Program {
  const hasMethod = Object.prototype.hasOwnProperty.call(dto, 'applicationMethod')
  const hasRemarks = Object.prototype.hasOwnProperty.call(dto, 'remarks')
  if (!hasMethod && !hasRemarks) return program

  const method = hasMethod ? trimOrUndefined(dto.applicationMethod) : program.applicationMethod
  const remarks = hasRemarks ? trimOrUndefined(dto.remarks) : program.remarks
  const currentInfo = program.generalCommonInfo?.participantRecruitmentInfo
  const hasParticipantRow = (program.programRecruitments ?? []).some(
    row => (row.recruitmentType ?? '').toUpperCase() === 'PARTICIPANT'
  )
  const clearMethod = hasMethod && !method && Boolean(currentInfo?.applicationMethod)
  // 행 모집은 비고 SSOT가 nested다. 프로그램 remarks 컬럼이 비어 있다고 nested를 지우면 저장값이 사라진다.
  const clearRemarks = hasRemarks && !remarks && Boolean(currentInfo?.remarks) && !hasParticipantRow
  const participantRecruitmentInfo =
    clearMethod || clearRemarks
      ? {
          ...currentInfo,
          ...(clearMethod ? { applicationMethod: undefined } : {}),
          ...(clearRemarks ? { remarks: undefined } : {}),
        }
      : currentInfo

  return {
    ...program,
    ...(hasMethod ? { applicationMethod: method } : {}),
    ...(hasRemarks ? { remarks } : {}),
    ...(clearMethod || clearRemarks
      ? {
          generalCommonInfo: {
            ...program.generalCommonInfo,
            participantRecruitmentInfo,
          },
        }
      : {}),
  }
}
