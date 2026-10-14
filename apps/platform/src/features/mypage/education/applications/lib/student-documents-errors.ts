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
  FILE_NOT_AVAILABLE: '파일 검사가 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.',
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

  if (code === 'BAD_REQUEST' && apiMessage) {
    return apiMessage
  }
  if (mapped) return mapped
  if (apiMessage) return apiMessage
  return fallback
}
