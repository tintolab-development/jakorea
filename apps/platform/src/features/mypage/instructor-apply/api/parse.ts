import type {
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
