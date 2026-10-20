import type { AxiosError } from 'axios'
import { MemberFileRejectedError } from '@/features/mypage/instructor-apply/api/member-file-upload'

import { STUDENT_DOCUMENTS_UNSUPPORTED_MESSAGE } from './student-documents-policy'

const STUDENT_DOCUMENTS_ERROR_MESSAGES: Record<string, string> = {
  PROGRAM_STUDENT_DOCUMENTS_NOT_SUPPORTED: STUDENT_DOCUMENTS_UNSUPPORTED_MESSAGE,
  STUDENT_ROSTER_DEADLINE_PASSED: '학생 명단 제출 및 수정 기한이 지났습니다.',
  PORTRAIT_CONSENT_DEADLINE_PASSED: '초상권 동의서 제출 및 수정 기한이 지났습니다.',
  INVALID_REQUEST: '요청 내용을 확인해 주세요.',
  INVALID_IDENTIFIER: '신청 정보가 올바르지 않습니다.',
  FORBIDDEN: '학생 명단·초상권 동의서를 제출할 수 없습니다.',
  UPLOAD_NOT_ALLOWED: '제출 기한이 지났거나 제출할 수 없습니다.',
  STUDENT_ROSTER_UPLOAD_NOT_ALLOWED: '학생 명단 제출 및 수정 기한이 지났습니다.',
  PORTRAIT_CONSENT_UPLOAD_NOT_ALLOWED: '초상권 동의서 제출 및 수정 기한이 지났습니다.',
  ROSTER_IMPORT_FAILED: '학생 명단 파일을 확인해 주세요. 양식·필수 항목·형식을 다시 확인해 주세요.',
  VALIDATION_FAILED: '학생명, 성별, 생년월일, 학급, 연락처, 이메일은 필수 입력값입니다.',
  STUDENT_ROSTER_REVISION_CONFLICT:
    '학생 명단이 다른 화면에서 변경되었습니다. 최신 명단을 다시 확인해 주세요.',
  STUDENT_ROSTER_MEMBER_ID_CONFLICT:
    '학생 명단의 회원 정보가 현재 신청 정보와 일치하지 않습니다.',
  FILE_NOT_AVAILABLE: '파일 검사가 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.',
  PERMISSION_DENIED: '해당 기관 신청에 접근할 권한이 없습니다.',
  PORTRAIT_CONSENT_NOT_FOUND: '취소할 초상권 동의서가 없습니다.',
  PORTRAIT_CONSENT_REVISION_CONFLICT:
    '초상권 동의서가 다른 화면에서 변경되었습니다. 최신 상태를 다시 확인해 주세요.',
  PORTRAIT_CONSENT_ALREADY_APPROVED:
    '승인된 초상권 동의서는 업로드를 취소할 수 없습니다. 변경이 필요하면 담당자에게 문의해 주세요.',
  AUDIT_LOG_UNAVAILABLE: '일시적인 오류로 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
}

export function readStudentDocumentsErrorCode(error: unknown): string | undefined {
  return readPortalErrorCode((error as AxiosError<unknown> | null)?.response?.data)
}

function readPortalErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as { error?: { code?: string; message?: string } }
  const code = record.error?.code
  return typeof code === 'string' ? code.trim() : undefined
}

function readPortalErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as { message?: string; error?: { message?: string } }
  const nested = record.error?.message
  if (typeof nested === 'string' && nested.trim()) return nested.trim()
  const top = record.message
  return typeof top === 'string' && top.trim() ? top.trim() : undefined
}

export function resolveStudentDocumentsErrorMessage(
  error: unknown,
  fallback = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
): string {
  if (error instanceof MemberFileRejectedError) {
    return error.message
  }
  if (error instanceof Error && error.message.trim() && !(error as AxiosError).isAxiosError) {
    return error.message.trim()
  }
  const axiosError = error as AxiosError<unknown>
  const responseData = axiosError.response?.data
  const code = readPortalErrorCode(responseData)
  const mapped = code ? STUDENT_DOCUMENTS_ERROR_MESSAGES[code] : undefined
  const apiMessage = readPortalErrorMessage(responseData)

  if (apiMessage) return apiMessage
  if (mapped) return mapped
  return fallback
}
