/**
 * 일반 프로그램 API 에러 메시지 추출 · CONFLICT 한글화
 */

import {
  CMS_MASTER_CANNOT_BE_PROGRAM_OWNER_MESSAGE,
  CMS_OPERABLE_ADMIN_PROGRAM_VIEWER_FORBIDDEN_MESSAGE,
  CMS_VIEWER_PROGRAM_ROLE_ONLY_MESSAGE,
} from '@/entities/program/lib/program-pm-role-policy'
import { PROGRAM_CREATE_VIEWER_CANNOT_OWN_MESSAGE } from '@/features/program/shared/lib/program-create-admin-assignments'
import {
  PROGRAM_INLINE_IMAGE_ERROR_MESSAGES,
  isProgramInlineImageBindError,
} from '@/features/program/shared/api/program-inline-images'
import {
  isProgramEducationStructureGuardCode,
  PROGRAM_EDUCATION_STRUCTURE_GUARD_MESSAGES,
} from '@/features/program/general/lib/education-structure-guard'
import { formatOrganizationApplicationApproveErrorMessage } from '@/features/program/general/lib/organization-application-approve-slots'
import { INSTRUCTOR_ASSIGNMENT_WRITE_CONFLICT_MESSAGES } from '@/features/program/general/lib/instructor-assignment-availability'
import {
  programEditWindowErrorMessage,
  resolveProgramRecruitmentPolicyErrorMessage,
} from '@/shared/lib/program-edit-window-error-message'
import { resolveProgramScheduleLineErrorMessage } from '@/features/program/shared/lib/program-schedule-line-error'

const BUSINESS_START_LOCK_PATTERN =
  /business_start_date|schedule lock|only be modified before/i

const SPONSOR_INVALID_PATTERN = /sponsor|후원사|program_sponsor|sponsorId/i

const PUBLIC_SURVEY_FILE_QUESTION_NOT_SUPPORTED_MESSAGE =
  '파일 첨부 문항이 있는 설문은 비로그인 공유 링크를 만들 수 없습니다. 파일 문항을 빼고 다시 공유해 주세요.'

/** Portal 희망 교육 일정 서버 검증 — BE 회신 2026-09-18 */
const PROGRESS_INSTRUCTOR_ERROR_MESSAGES: Record<string, string> = {
  PARTICIPANT_TYPE_UNSUPPORTED: '이 경로로는 강사 참여자만 등록할 수 있습니다.',
  INSTRUCTOR_MEMBER_REQUIRED: '강사 역할이 있는 회원만 등록할 수 있습니다.',
  PROGRAM_PARTICIPANT_ALREADY_EXISTS: '이미 이 프로그램에 참여 중입니다.',
  PARTICIPANT_MEMBER_TYPE_INVALID: '이 회원은 해당 유형으로 등록할 수 없습니다.',
  TEXTBOOK_DELIVERY_NOT_APPLICABLE: '이 기관에는 교재가 없어 배송 상태를 변경할 수 없습니다.',
  VOLUNTEER_ASSIGNMENT_REVISION_CONFLICT: '봉사 배정이 변경되어 다시 시도해 주세요.',
  VOLUNTEER_ASSIGNMENT_STARTED_USE_GIVE_UP:
    '이미 시작된 봉사 일정은 배정 해제가 아니라 활동 포기로 처리해야 합니다.',
  VOLUNTEER_ASSIGNMENT_SCHEDULE_REQUIRED: '활성 교육 일정이 있는 기관만 배정할 수 있습니다.',
  INSTRUCTOR_REPRESENTATIVE_NOT_CURRENT: '현재 대표 강사가 아니면 일반 강사로 변경할 수 없습니다.',
  PROGRAM_PARTICIPANT_GIVE_UP_BEFORE_FIRST_ACTIVITY:
    '첫 교육이 시작되기 전에는 활동 포기할 수 없습니다.',
  INVALID_BUSINESS_INCOME_EARNER_STATUS: '사업소득자 여부는 해당 또는 해당 없음만 저장할 수 있습니다.',
  FORBIDDEN_APPLICATION_ACTION: '이 프로그램 유형에서는 해당 작업을 할 수 없습니다.',
  FORM_RESPONSE_ALREADY_SUBMITTED:
    '이미 제출된 응답입니다. 수정은 응답 수정으로 해 주세요.',
  INSTRUCTOR_PARTICIPATION_CONSENT_REQUIRED:
    '강사 활동에 필요한 동의가 부족합니다. 해당 동의를 다시 받은 뒤 처리해 주세요.',
  UJAT_VOLUNTEER_PARTICIPATION_CONSENT_REQUIRED:
    'UJAT 봉사 활동에 필요한 동의가 부족합니다. 해당 동의를 다시 받은 뒤 처리해 주세요.',
  VOLUNTEER_APPLICATION_ALREADY_EXISTS: '이미 이 프로그램에 봉사 신청이 있습니다.',
  VOLUNTEER_1365_ID_REQUIRED: '1365 ID를 입력해 주세요.',
  VOLUNTEER_PERSONAL_INFO_CONSENT_REQUIRED: '개인정보 수집·이용에 동의해 주세요.',
  VOLUNTEER_THIRD_PARTY_CONSENT_REQUIRED: '개인정보 제3자 정보 제공·이용에 동의해 주세요.',
  VOLUNTEER_PREVIOUS_JA_REQUIRED:
    '동의서 제출 요청 시 이전 참여 JA 봉사 프로그램 정보와 증빙서류가 필요합니다.',
  VOLUNTEER_PREVIOUS_UJAT_FILE_INVALID:
    '이전 기수 수료증 파일이 올바르지 않습니다. 본인이 업로드한 신청 증빙(스캔 완료)만 연결할 수 있습니다.',
  VOLUNTEER_PREVIOUS_UJAT_FILE_PENDING_SCAN:
    '이전 기수 수료증 파일의 보안 검사가 아직 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.',
  VOLUNTEER_PREVIOUS_UJAT_FILE_QUESTION_MISSING:
    '이전 기수 수료증을 연결할 신청서 문항을 찾을 수 없습니다. 프로그램 신청 양식 바인딩을 확인해 주세요.',
  VOLUNTEER_FREE_TEXT_REQUIRED: '자유 작성 항목을 모두 작성해 주세요.',
  VOLUNTEER_FREE_TEXT_INVALID: '자유 작성 항목 글자 수를 확인해 주세요.',
  VOLUNTEER_RECRUITMENT_NOT_CONFIGURED:
    '이 프로그램에 봉사 모집·신청 양식이 설정되지 않았습니다. 프로그램 모집 설정을 확인해 주세요.',
  VOLUNTEER_APPLICATION_TYPE_INVALID: '지원 형태를 확인해 주세요.',
  UJAT_EDUCATION_REGION_CODE_UNKNOWN: '등록되지 않은 교육 지역입니다. 지역 목록을 다시 확인해 주세요.',
  CMS_PROGRESS_VOLUNTEER_REGISTER_GENERAL_ONLY:
    '진행 현황 봉사자 추가 등록은 일반 봉사자만 지원합니다.',
  EMPLOYEE_VOLUNTEER_ORGANIZATION_SCOPE_REQUIRED:
    '기관을 선택한 뒤 임직원 자원봉사자 수를 저장해 주세요.',
  EMPLOYEE_VOLUNTEER_ORGANIZATION_NOT_APPROVED:
    '승인된 기관만 임직원 자원봉사자 수를 등록할 수 있습니다.',
  EMPLOYEE_VOLUNTEER_ORGANIZATION_SCOPE_NOT_ALLOWED:
    '개인 프로그램에는 기관 정보를 함께 저장할 수 없습니다.',
  EMPLOYEE_VOLUNTEER_SCHEDULE_SET_MISMATCH:
    '교육 일정 구성이 변경되어 저장할 수 없습니다. 화면을 닫은 뒤 다시 열어 최신 일정을 확인해 주세요.',
  EMPLOYEE_VOLUNTEER_REVISION_CONFLICT:
    '다른 관리자가 먼저 저장했습니다. 화면을 닫은 뒤 다시 열어 최신 값을 확인해 주세요.',
  EMPLOYEE_VOLUNTEER_PERFORMANCE_ALREADY_REBUILT:
    '실적이 이미 생성되어 임직원 자원봉사자 수를 수정할 수 없습니다. 정산·실적 정책에 따라 정정해 주세요.',
  EMPLOYEE_VOLUNTEER_NOT_APPLICABLE:
    '이 프로그램에서는 임직원 자원봉사자 수 등록을 사용할 수 없습니다.',
}

const PARTICIPATION_CONSENT_REQUIRED_CODES = new Set([
  'INSTRUCTOR_PARTICIPATION_CONSENT_REQUIRED',
  'UJAT_VOLUNTEER_PARTICIPATION_CONSENT_REQUIRED',
])

/**
 * 연간 참여 동의 부족(409) — 서버 `error.message`에 부족한 동의·사유가 나열되므로 그대로 쓴다.
 * 동의 코드가 아니면 undefined (화면별 기존 문구 유지).
 */
export function getParticipationConsentRequiredMessage(error: unknown): string | undefined {
  const code = extractApiErrorCode(error)
  if (!code || !PARTICIPATION_CONSENT_REQUIRED_CODES.has(code)) return undefined
  return getGeneralProgramApiErrorMessage(error, PROGRESS_INSTRUCTOR_ERROR_MESSAGES[code]!)
}

/** POST/PATCH program form-bindings — 슬롯 409 (BE V29+) */
export type ProgramFormBindingErrorContext = {
  formType?: string
  targetScope?: string
}

const FORM_BINDING_ACTIVE_SLOT_CONFLICT_SURVEY_SCHEDULE_MESSAGE =
  '선택한 교육 일정에 동일한 설문 양식 버전이 이미 연결되어 있습니다. 다른 템플릿을 선택하거나 기존 설문을 확인해 주세요.'

const FORM_BINDING_ACTIVE_SLOT_CONFLICT_LECTURE_EVAL_PROGRAM_MESSAGE =
  '이 프로그램에 등록된 강의평가가 이미 있습니다. 기존 강의평가를 확인하거나 삭제한 뒤 다시 등록해 주세요.'

const FORM_BINDING_ACTIVE_SLOT_CONFLICT_DEFAULT_MESSAGE =
  '같은 프로그램 양식 슬롯에 이미 활성 양식이 연결되어 있습니다. 기존 바인딩을 확인하거나 다른 대상을 선택해 주세요.'

const TRAINED_TEACHER_SATISFACTION_TEACHER_ONLY_MESSAGE =
  '교육받은 교사 프로그램의 만족도조사는 교사만 대상으로 할 수 있습니다.'

const PROGRAM_EDUCATION_SLOT_KEY_MISMATCH_MESSAGE =
  '교육 일정의 논리 슬롯 식별자(educationSlotKey)는 변경할 수 없습니다. 일정 시간만 수정하거나 새 일정을 추가해 주세요.'

const PROGRAM_SCHEDULE_NOT_ACTIVE_MESSAGE =
  '비활성·취소된 교육 일정에는 새로 배정할 수 없습니다. 프로그램 일정 목록을 확인해 주세요.'

const PROGRAM_SCHEDULE_NOT_EDUCATION_SLOT_MESSAGE =
  '사전교육·폐회 등 교육 슬롯이 아닌 일정에는 배정할 수 없습니다. EDUCATION·SESSION 일정을 선택해 주세요.'

const PROGRAM_SCHEDULE_NOT_EDUCATION_SLOT_SURVEY_MESSAGE =
  '교육 진행 예정일만 설문 대상으로 지정할 수 있습니다.'

const PROGRAM_FORM_BINDING_REQUIRES_PUBLISHED_VERSION_MESSAGE =
  '새로 연결하거나 교체할 양식은 현재 발행된 버전만 선택할 수 있습니다.'

const FORM_BINDING_TEMPLATE_LOCKED_MESSAGE =
  '이미 응답이 있는 양식은 연결된 템플릿 버전을 변경할 수 없습니다.'

export function getProgramFormBindingErrorMessage(
  error: unknown,
  fallback: string,
  context?: ProgramFormBindingErrorContext
): string {
  const code = extractApiErrorCode(error)
  if (code === 'PROGRAM_FORM_BINDING_REQUIRES_PUBLISHED_VERSION') {
    return PROGRAM_FORM_BINDING_REQUIRES_PUBLISHED_VERSION_MESSAGE
  }
  if (code === 'FORM_BINDING_TEMPLATE_LOCKED') {
    return FORM_BINDING_TEMPLATE_LOCKED_MESSAGE
  }
  if (code === 'TRAINED_TEACHER_SATISFACTION_TEACHER_ONLY') {
    const raw = extractRawApiMessage(error)?.replace(/^CONFLICT:\s*/i, '').trim()
    if (raw && raw !== code) return raw
    return TRAINED_TEACHER_SATISFACTION_TEACHER_ONLY_MESSAGE
  }
  if (code === 'PROGRAM_FORM_BINDING_ACTIVE_SLOT_CONFLICT') {
    const isLectureEvalProgram =
      context?.formType === 'LECTURE_EVALUATION' && context?.targetScope === 'PROGRAM'
    if (isLectureEvalProgram) {
      return FORM_BINDING_ACTIVE_SLOT_CONFLICT_LECTURE_EVAL_PROGRAM_MESSAGE
    }
    const isSurveySchedulePoll =
      context?.formType === 'SURVEY' && context?.targetScope === 'SCHEDULE'
    if (isSurveySchedulePoll) {
      return FORM_BINDING_ACTIVE_SLOT_CONFLICT_SURVEY_SCHEDULE_MESSAGE
    }
    const raw = extractRawApiMessage(error)?.replace(/^CONFLICT:\s*/i, '').trim()
    if (raw && raw !== code) return raw
    return FORM_BINDING_ACTIVE_SLOT_CONFLICT_DEFAULT_MESSAGE
  }
  if (code === 'PROGRAM_SCHEDULE_NOT_EDUCATION_SLOT' && context?.formType === 'SURVEY') {
    return PROGRAM_SCHEDULE_NOT_EDUCATION_SLOT_SURVEY_MESSAGE
  }
  return getGeneralProgramApiErrorMessage(error, fallback)
}

const PREFERRED_SCHEDULE_ERROR_MESSAGES: Record<string, string> = {
  PREFERRED_SCHEDULE_OUTSIDE_EDUCATION_RANGE:
    '희망 교육 일정이 프로그램 교육 가능 기간을 벗어났습니다.',
  PREFERRED_SCHEDULE_EXCEEDS_MAX_SCHEDULE_COUNT:
    '희망 교육 일정 지망 수가 모집 상한을 초과했습니다.',
  PREFERRED_SCHEDULE_EXCEEDS_MAX_SESSIONS_PER_DAY:
    '하루 희망 차시 수가 모집 상한을 초과했습니다.',
}

export function getGeneralProgramApiErrorCode(error: unknown): string | undefined {
  return extractApiErrorCode(error)
}

export function getGeneralProgramApiErrorMessage(error: unknown, fallback: string): string {
  if (isProgramInlineImageBindError(error) && error.message.trim()) {
    return error.message
  }

  const organizationAssignmentMessage = formatOrganizationApplicationApproveErrorMessage(error)
  if (organizationAssignmentMessage) return organizationAssignmentMessage

  const code = extractApiErrorCode(error)
  if (code && PROGRAM_INLINE_IMAGE_ERROR_MESSAGES[code]) {
    return PROGRAM_INLINE_IMAGE_ERROR_MESSAGES[code]
  }
  if (code === 'PUBLIC_SURVEY_FILE_QUESTION_NOT_SUPPORTED') {
    return PUBLIC_SURVEY_FILE_QUESTION_NOT_SUPPORTED_MESSAGE
  }
  if (isProgramEducationStructureGuardCode(code)) {
    return PROGRAM_EDUCATION_STRUCTURE_GUARD_MESSAGES[code]
  }
  if (code === 'VERSION_CONFLICT') {
    return PROGRAM_EDUCATION_STRUCTURE_GUARD_MESSAGES.PROGRAM_EDUCATION_STRUCTURE_CHANGE_CONCURRENT
  }
  if (code === 'PROGRAM_EDUCATION_SLOT_KEY_MISMATCH') {
    const raw = extractRawApiMessage(error)?.replace(/^CONFLICT:\s*/i, '').trim()
    if (raw && raw !== code) return raw
    return PROGRAM_EDUCATION_SLOT_KEY_MISMATCH_MESSAGE
  }
  if (code === 'PROGRAM_SCHEDULE_NOT_ACTIVE') {
    const raw = extractRawApiMessage(error)?.replace(/^CONFLICT:\s*/i, '').trim()
    if (raw && raw !== code) return raw
    return PROGRAM_SCHEDULE_NOT_ACTIVE_MESSAGE
  }
  if (code === 'PROGRAM_SCHEDULE_NOT_EDUCATION_SLOT') {
    const raw = extractRawApiMessage(error)?.replace(/^CONFLICT:\s*/i, '').trim()
    if (raw && raw !== code) return raw
    return PROGRAM_SCHEDULE_NOT_EDUCATION_SLOT_MESSAGE
  }
  if (code === 'PROGRAM_DATE_OUTSIDE_OPEN_PERIOD') {
    return '모집·운영 기간이 사업(오픈) 기간 밖입니다. 모집 창은 모집 행으로만 저장되고, 신청일·프로그램 운영일은 사업 기간 안에 있을 때만 함께 전송됩니다.'
  }
  const scheduleLineMessage = resolveProgramScheduleLineErrorMessage(
    code,
    extractRawApiMessage(error)
  )
  if (scheduleLineMessage) return scheduleLineMessage
  const policyMessage = resolveProgramRecruitmentPolicyErrorMessage(
    code,
    extractRawApiMessage(error)
  )
  if (policyMessage) return policyMessage
  const editWindowMessage = programEditWindowErrorMessage(code)
  if (editWindowMessage) return editWindowMessage
  if (code === 'INVALID_PROGRAM_ASSIGNMENT_ROLE') {
    return CMS_VIEWER_PROGRAM_ROLE_ONLY_MESSAGE
  }
  if (code === 'PROGRAM_OWNER_ROLE_REQUIRES_ACCOUNTING_OR_PROGRAM_MANAGER') {
    return CMS_MASTER_CANNOT_BE_PROGRAM_OWNER_MESSAGE
  }
  if (code === 'ACCOUNTING_OR_PROGRAM_MANAGER_REQUIRED_FOR_OWNER_OR_ASSISTANT') {
    return CMS_OPERABLE_ADMIN_PROGRAM_VIEWER_FORBIDDEN_MESSAGE
  }
  if (code === 'PROGRAM_VIEWER_GLOBAL_ROLE_CANNOT_BE_ELEVATED') {
    return CMS_VIEWER_PROGRAM_ROLE_ONLY_MESSAGE
  }
  if (error instanceof Error && error.message === PROGRAM_CREATE_VIEWER_CANNOT_OWN_MESSAGE) {
    return error.message
  }
  if (code && INSTRUCTOR_ASSIGNMENT_WRITE_CONFLICT_MESSAGES[code]) {
    const raw = extractRawApiMessage(error)?.replace(/^CONFLICT:\s*/i, '').trim()
    if (raw && raw !== code) return raw
    return INSTRUCTOR_ASSIGNMENT_WRITE_CONFLICT_MESSAGES[code]
  }
  if (code && PROGRESS_INSTRUCTOR_ERROR_MESSAGES[code]) {
    const raw = extractRawApiMessage(error)?.replace(/^CONFLICT:\s*/i, '').trim()
    if (raw && raw !== code) return raw
    return PROGRESS_INSTRUCTOR_ERROR_MESSAGES[code]
  }
  if (code && PREFERRED_SCHEDULE_ERROR_MESSAGES[code]) {
    const raw = extractRawApiMessage(error)?.replace(/^CONFLICT:\s*/i, '').trim()
    // 서버가 동일/구체 메시지를 주면 우선, code만 오면 FE 매핑
    if (raw && raw !== code) return raw
    return PREFERRED_SCHEDULE_ERROR_MESSAGES[code]
  }
  const raw = extractRawApiMessage(error)
  if (raw && BUSINESS_START_LOCK_PATTERN.test(raw)) {
    return '사업 시작일이 지난 프로그램은 수정할 수 없습니다. 시작일 이전에만 정보 수정이 가능합니다.'
  }
  if (raw && SPONSOR_INVALID_PATTERN.test(raw)) {
    return '유효한 후원사를 선택해 주세요. 존재하지 않거나 사용할 수 없는 후원사입니다.'
  }
  if (raw?.trim()) {
    // CONFLICT: prefix 제거
    return raw.replace(/^CONFLICT:\s*/i, '').trim() || fallback
  }
  return fallback
}

/** 후보 API 등 hand-wrap endpoint 미배포(404) 판별 */
export function isHttpNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('response' in error)) return false
  const status = (error as { response?: { status?: number } }).response?.status
  return status === 404
}

function extractApiErrorPayload(error: unknown): Record<string, unknown> | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (!data || typeof data !== 'object') return undefined
  return data as Record<string, unknown>
}

function extractApiErrorCode(error: unknown): string | undefined {
  const data = extractApiErrorPayload(error)
  if (!data) return undefined
  if (typeof data.error === 'object' && data.error && 'code' in data.error) {
    const nested = (data.error as { code?: unknown }).code
    if (typeof nested === 'string' && nested.trim()) return nested.trim()
  }
  if (typeof data.code === 'string' && data.code.trim()) return data.code.trim()
  return undefined
}

function extractRawApiMessage(error: unknown): string | undefined {
  const data = extractApiErrorPayload(error)
  if (data) {
    if (typeof data.message === 'string') return data.message
    if (typeof data.error === 'object' && data.error && 'message' in data.error) {
      const nested = (data.error as { message?: unknown }).message
      if (typeof nested === 'string') return nested
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return undefined
}
