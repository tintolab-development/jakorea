import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import { mapGeneralProgramToCreateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import { mapCompanySchoolToCreateRequest } from '@/features/program/1c-1s/api/adapters'
import { mapTrainedTeacherToCreateRequest } from '@/features/program/trained-teachers/api/adapters'
import { enrichProgramCreateRequestWithRegistrationFormBindings } from '@/features/program/general/lib/enrich-program-create-request'
import type { RegistrationCreateFormBindingsPayload } from '@/features/program/general/lib/build-registration-create-form-bindings'
import type { Program } from '@/types/domain'

export type RegistrationCreatePayloadVariant = ProgramRegistrationFormVariant | 'ujat'

export type RegistrationWizardPhaseKey = 'program' | 'recruitment' | 'application'

export const REGISTRATION_PHASE_LABELS: Record<RegistrationWizardPhaseKey, string> = {
  program: '공통정보',
  recruitment: '모집정보',
  application: '신청정보',
}

export function formatRegistrationStepTransitionLabel(
  from: RegistrationWizardPhaseKey,
  to: RegistrationWizardPhaseKey
): string {
  return `${REGISTRATION_PHASE_LABELS[from]} → ${REGISTRATION_PHASE_LABELS[to]}`
}

export function mapRegistrationProgramToCreateRequest(
  program: Program,
  variant: RegistrationCreatePayloadVariant,
  ujatBaseRequest?: ProgramCreateRequest
): ProgramCreateRequest {
  if (variant === 'ujat') {
    if (ujatBaseRequest == null) {
      throw new Error('ujatBaseRequest is required when variant is ujat')
    }
    return ujatBaseRequest
  }
  if (variant === 'economy') return mapCompanySchoolToCreateRequest(program)
  if (variant === 'trainedTeachers') return mapTrainedTeacherToCreateRequest(program)
  return mapGeneralProgramToCreateRequest(program)
}

/** 단계 전환 — base create request (formBindings 미포함) */
export function logRegistrationStepTransitionPayload(args: {
  program: Program
  variant: RegistrationCreatePayloadVariant
  stepLabel: string
  ujatBaseRequest?: ProgramCreateRequest
}): void {
  const request = mapRegistrationProgramToCreateRequest(
    args.program,
    args.variant,
    args.ujatBaseRequest
  )
  console.log(`[program registration create] ${args.stepLabel}`, request)
}

/** 등록 완료 — enriched create request(서버 임시저장 ID 없음) + CREATE 후 적용할 양식 코드 */
export async function logProgramRegistrationCreatePayload(args: {
  program: Program
  variant: RegistrationCreatePayloadVariant
  preparedFormBindings?: RegistrationCreateFormBindingsPayload | null
  ujatBaseRequest?: ProgramCreateRequest
  stepLabel?: string
}): Promise<void> {
  const base = mapRegistrationProgramToCreateRequest(
    args.program,
    args.variant,
    args.ujatBaseRequest
  )
  const request = enrichProgramCreateRequestWithRegistrationFormBindings(args.program, base)
  const formsAfterCreate = (args.preparedFormBindings?.forms ?? []).map(item => item.templateCode)
  const prefix = args.stepLabel
    ? `[program registration create] ${args.stepLabel}`
    : '[program registration create]'
  console.log(prefix, request, { formsAfterCreate })
}
