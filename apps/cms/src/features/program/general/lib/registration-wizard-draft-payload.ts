export const REGISTRATION_PROGRAM_DRAFT_PAYLOAD_VERSION = 1 as const

export type RegistrationProgramDraftFormVersionRef = {
  templateId: number
  draftVersionId: number
}

export type RegistrationProgramDraftPayloadV1 = {
  version: typeof REGISTRATION_PROGRAM_DRAFT_PAYLOAD_VERSION
  activeStep?: string
  registrationTemplateCode: string
  formVersions: Record<string, RegistrationProgramDraftFormVersionRef>
  savedAt: string
  /** peekRegistrationDraftNotice — 제목 표시용 */
  programTitleKo?: string
  /** 모집/신청 탭별 선택 양식 code (기본이면 키 생략) */
  selectedOperationalTemplates?: Record<string, string>
  /** UJAT 등록 Draft — 기관/H1/H2 typed 모집 행 */
  recruitments?: unknown[]
}

export function isRegistrationProgramDraftPayloadV1(
  value: unknown
): value is RegistrationProgramDraftPayloadV1 {
  if (value == null || typeof value !== 'object') return false
  const record = value as RegistrationProgramDraftPayloadV1
  return (
    record.version === REGISTRATION_PROGRAM_DRAFT_PAYLOAD_VERSION &&
    typeof record.registrationTemplateCode === 'string' &&
    typeof record.formVersions === 'object' &&
    record.formVersions != null
  )
}

export function parseRegistrationProgramDraftPayload(
  draftPayload: unknown
): RegistrationProgramDraftPayloadV1 | null {
  if (isRegistrationProgramDraftPayloadV1(draftPayload)) return draftPayload
  return null
}

export function createRegistrationProgramDraftPayload(args: {
  registrationTemplateCode: string
  activeStep?: string
  formVersions?: Record<string, RegistrationProgramDraftFormVersionRef>
  programTitleKo?: string
  selectedOperationalTemplates?: Record<string, string>
  recruitments?: unknown[]
}): RegistrationProgramDraftPayloadV1 {
  return {
    version: REGISTRATION_PROGRAM_DRAFT_PAYLOAD_VERSION,
    activeStep: args.activeStep,
    registrationTemplateCode: args.registrationTemplateCode,
    formVersions: args.formVersions ?? {},
    savedAt: new Date().toISOString(),
    programTitleKo: args.programTitleKo,
    selectedOperationalTemplates: args.selectedOperationalTemplates,
    ...(args.recruitments != null ? { recruitments: args.recruitments } : {}),
  }
}
