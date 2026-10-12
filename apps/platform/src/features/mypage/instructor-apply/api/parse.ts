import type {
  InstructorRoleRequestDetail,
  InstructorRoleRequestSummary,
  InstructorRoleWorkflowResponse,
} from './types'

function unwrapData(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  if (root.success === true && root.data && typeof root.data === 'object') {
    return root.data as Record<string, unknown>
  }
  return root
}

function optionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function optionalNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function optionalBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}

export function parseInstructorRoleWorkflowResponse(
  payload: unknown,
): InstructorRoleWorkflowResponse {
  const root = unwrapData(payload)
  if (!root) {
    throw new Error('강사 신청 응답을 해석할 수 없습니다.')
  }

  return {
    requestId: optionalNumber(root.requestId),
    memberId: optionalNumber(root.memberId),
    instructorProfileId: optionalNumber(root.instructorProfileId),
    status: optionalString(root.status),
    message: optionalString(root.message),
  }
}

export function parseInstructorRoleRequestSummary(
  payload: unknown,
): InstructorRoleRequestSummary {
  const root = unwrapData(payload)
  if (!root) {
    throw new Error('강사 신청 상태를 해석할 수 없습니다.')
  }

  return {
    status: optionalString(root.status),
    requestId: optionalNumber(root.requestId),
    requestedAt: optionalString(root.requestedAt),
    decidedAt: optionalString(root.decidedAt),
    rejectedReason: optionalString(root.rejectedReason),
    canRequest: optionalBoolean(root.canRequest),
    canReapply: optionalBoolean(root.canReapply),
  }
}

function optionalObject(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return undefined
}

function optionalTermsAgreements(value: unknown) {
  if (!Array.isArray(value)) return undefined
  return value
    .filter((row): row is Record<string, unknown> => row != null && typeof row === 'object')
    .map(row => ({
      termsType: optionalString(row.termsType) ?? '',
      version: optionalString(row.version) ?? '',
      required: optionalBoolean(row.required) ?? false,
      agreed: optionalBoolean(row.agreed) ?? false,
      ...(optionalString(row.agreedAt) ? { agreedAt: optionalString(row.agreedAt) } : {}),
    }))
}

export function parseInstructorRoleRequestDetail(payload: unknown): InstructorRoleRequestDetail {
  const root = unwrapData(payload)
  if (!root) {
    throw new Error('강사 신청 상세를 해석할 수 없습니다.')
  }

  const profile = optionalObject(root.profile)
  const settlement = optionalObject(root.settlement)

  return {
    requestId: optionalNumber(root.requestId),
    memberId: optionalNumber(root.memberId),
    status: optionalString(root.status),
    requestedActivityType: optionalString(root.requestedActivityType),
    requestedAt: optionalString(root.requestedAt),
    decidedAt: optionalString(root.decidedAt),
    rejectedReason: optionalString(root.rejectedReason),
    name: optionalString(root.name),
    gender: optionalString(root.gender),
    birthDate: optionalString(root.birthDate),
    phone: optionalString(root.phone),
    email: optionalString(root.email),
    ...(profile ? { profile: profile as InstructorRoleRequestDetail['profile'] } : {}),
    ...(settlement ? { settlement: settlement as InstructorRoleRequestDetail['settlement'] } : {}),
    ...(optionalTermsAgreements(root.termsAgreements)
      ? { termsAgreements: optionalTermsAgreements(root.termsAgreements) }
      : {}),
  }
}
