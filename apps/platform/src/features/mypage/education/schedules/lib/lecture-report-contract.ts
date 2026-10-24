export type LectureReportContextType = 'INSTRUCTOR_APPLICATION' | 'INSTRUCTOR_ASSIGNMENT'

export const INVALID_LECTURE_REPORT_BINDING_MESSAGE = '강의보고서 양식 정보가 올바르지 않습니다.'

export type LectureReportFormBinding = {
  assignmentId: number
  programId: number
  programScheduleId: number
  bindingId: number
  templateVersionId: number
  contextType: LectureReportContextType
  contextId: number
}

export type LectureReportFormResponseInput = {
  templateVersionId: number
  programId: number
  programFormBindingId: number
  contextType: LectureReportContextType
  contextId: number
  answers: Record<string, unknown>
  fileObjectIdsByQuestion?: Record<string, number[]>
}

type LectureReportBindingContextValidationInput = {
  contextType: unknown
  contextId: unknown
  assignmentId: unknown
  instructorApplicationId: unknown
}

export function isValidLectureReportBindingContext(
  input: LectureReportBindingContextValidationInput,
): boolean {
  if (
    (input.contextType !== 'INSTRUCTOR_APPLICATION' && input.contextType !== 'INSTRUCTOR_ASSIGNMENT') ||
    typeof input.contextId !== 'number' ||
    !Number.isSafeInteger(input.contextId) ||
    input.contextId <= 0
  ) {
    return false
  }

  if (input.contextType === 'INSTRUCTOR_ASSIGNMENT') {
    return input.contextId === input.assignmentId
  }

  return input.instructorApplicationId != null && input.contextId === input.instructorApplicationId
}

export function buildLectureReportFormResponseBody(input: LectureReportFormResponseInput) {
  return {
    templateVersionId: input.templateVersionId,
    programId: input.programId,
    programFormBindingId: input.programFormBindingId,
    contextType: input.contextType,
    contextId: input.contextId,
    answers: input.answers,
    ...(input.fileObjectIdsByQuestion ? { fileObjectIdsByQuestion: input.fileObjectIdsByQuestion } : {}),
  }
}

export function getLectureReportApiErrorMessage(
  error: unknown,
  fallback = '요청 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.',
): string {
  const response =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { status?: unknown; data?: unknown } }).response
      : undefined
  const status = typeof response?.status === 'number' ? response.status : undefined
  const data = response?.data
  const body = data && typeof data === 'object'
    ? data as { message?: unknown; error?: { message?: unknown } }
    : undefined
  const serverMessage =
    typeof body?.error?.message === 'string' && body.error.message.trim()
      ? body.error.message.trim()
      : typeof body?.message === 'string' && body.message.trim()
        ? body.message.trim()
        : undefined
  if (status === 400) return serverMessage ?? '양식 응답과 강사 배정 정보가 일치하지 않아 제출할 수 없습니다.'
  if (status === 403) return serverMessage ?? '강의보고서에 접근하거나 제출할 권한이 없습니다.'
  if (serverMessage) return serverMessage
  if (typeof data === 'string' && data.trim()) return data.trim()
  return fallback
}
