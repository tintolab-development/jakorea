export type LectureReportContextType = 'INSTRUCTOR_APPLICATION' | 'INSTRUCTOR_ASSIGNMENT'

export const INVALID_LECTURE_REPORT_BINDING_MESSAGE = '강의보고서 양식 정보가 올바르지 않습니다.'
export const LECTURE_REPORT_BINDING_UNAVAILABLE_MESSAGE = '현재 활성화된 강의보고서 양식을 사용할 수 없습니다.'
export const LECTURE_REPORT_CANONICAL_TEMPLATE_UNAVAILABLE_MESSAGE =
  '강의보고서 양식을 준비 중입니다. 잠시 후 다시 시도해 주세요.'

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
  programScheduleId: number
  contextType: LectureReportContextType
  contextId: number
  answers: Record<string, unknown>
  fileObjectIdsByQuestion: Record<string, number[]>
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
    programScheduleId: input.programScheduleId,
    contextType: input.contextType,
    contextId: input.contextId,
    answers: input.answers,
    fileObjectIdsByQuestion: input.fileObjectIdsByQuestion,
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
    ? data as {
        success?: unknown
        code?: unknown
        message?: unknown
        error?: { code?: unknown; message?: unknown }
      }
    : undefined
  const serverCode =
    typeof body?.error?.code === 'string' && body.error.code.trim()
      ? body.error.code.trim().toUpperCase()
      : typeof body?.code === 'string' && body.code.trim()
        ? body.code.trim().toUpperCase()
        : undefined
  const serverMessage =
    typeof body?.error?.message === 'string' && body.error.message.trim()
      ? body.error.message.trim()
      : typeof body?.message === 'string' && body.message.trim()
        ? body.message.trim()
        : undefined
  switch (serverCode) {
    case 'LECTURE_REPORT_CANONICAL_TEMPLATE_UNAVAILABLE':
      return LECTURE_REPORT_CANONICAL_TEMPLATE_UNAVAILABLE_MESSAGE
    case 'LECTURE_REPORT_FORM_BINDING_NOT_FOUND':
    case 'LECTURE_REPORT_CONTENT_NOT_FOUND':
      return LECTURE_REPORT_BINDING_UNAVAILABLE_MESSAGE
    case 'LECTURE_REPORT_SCHEDULE_NOT_COMPLETED':
      return '강의 종료 후 강의보고서를 작성할 수 있습니다.'
    case 'LECTURE_REPORT_BUSINESS_PERIOD_CLOSED':
      return '사업 운영 기간이 종료되어 강의보고서를 제출할 수 없습니다.'
    case 'LECTURE_REPORT_ALREADY_SUBMITTED':
      return '이미 제출된 강의보고서입니다.'
    case 'FORM_SUBMISSION_NOT_STARTED':
      return '아직 강의보고서 제출 기간이 시작되지 않았습니다.'
    case 'FORM_SUBMISSION_CLOSED':
      return '강의보고서 제출 기간이 종료되었습니다.'
    default:
      break
  }
  if (data !== undefined && !serverCode) return fallback
  if (status === 400) return serverMessage ?? '양식 응답과 강사 배정 정보가 일치하지 않아 제출할 수 없습니다.'
  if (status === 403) return serverMessage ?? '강의보고서에 접근하거나 제출할 권한이 없습니다.'
  if (serverMessage) return serverMessage
  if (typeof data === 'string' && data.trim()) return data.trim()
  return fallback
}
