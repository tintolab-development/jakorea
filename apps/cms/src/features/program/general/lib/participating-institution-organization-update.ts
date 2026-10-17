import type { ParticipatingInstitutionEditDraft } from '@/features/program/general/lib/participating-institution-detail-edit'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from '@/features/program/general/lib/individual-applicant-textbook'
import {
  formatInstitutionApplicationGradeDisplay,
  type InstitutionAffiliatedTeacherOption,
} from '@/features/program/general/lib/institution-application-detail-edit-policy'
import { toRequestedEducationFormatApiValue } from '@/features/program/general/api/adapters/general-applications-adapters'
import type { OrganizationApplicationUpdateRequest } from '@/shared/api/generated/dashboard/schemas/organizationApplicationUpdateRequest'
import type { SchoolDetailForModal } from '@/features/program/general/model/school-detail-types'

/** OpenAPI는 number만 표기하지만 교재 미지정은 null 전송이 계약 */
export type OrganizationApplicationUpdateRequestWithNullTextbook =
  OrganizationApplicationUpdateRequest & {
    textbookId?: number | null
  }

export function resolveParticipatingInstitutionApplicationId(params: {
  organizationApplicationId?: string | null
  detailId?: string | null
  rowId?: string | null
}): string | null {
  const candidates = [params.organizationApplicationId, params.detailId, params.rowId]
  for (const value of candidates) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return null
}

export function buildParticipatingInstitutionOrganizationUpdateRequest(params: {
  draft: ParticipatingInstitutionEditDraft
  teacherOptions: InstitutionAffiliatedTeacherOption[]
  fallbackTeacherMemberId?: number | null
  textbookQuantity?: number
  textbookKits?: number
  textbookGrade?: string
  /** 저장 전 교육 형태. 같으면 PATCH에서 뺀다. */
  baselineEducationFormat?: string | null
  /** 교재를 실제로 변경한 경우에만 textbookId/수량 필드를 전송한다. */
  includeTextbookFields?: boolean
  /**
   * 프로그램 교육형태가 참여자 선택일 때만 true.
   * false면 값이 달라도 requestedEducationFormat을 넣지 않는다.
   */
  allowEducationFormatChange?: boolean
}): OrganizationApplicationUpdateRequestWithNullTextbook {
  const { draft, teacherOptions, fallbackTeacherMemberId } = params
  const selectedTeacher = teacherOptions.find(option => option.label === draft.teacherName)
  const teacherMemberIdRaw = selectedTeacher ? Number(selectedTeacher.value) : undefined
  const teacherMemberId =
    teacherMemberIdRaw != null && Number.isFinite(teacherMemberIdRaw)
      ? teacherMemberIdRaw
      : fallbackTeacherMemberId != null && Number.isFinite(fallbackTeacherMemberId)
        ? fallbackTeacherMemberId
        : undefined

  const classCount = Number(draft.classCount)
  const studentCount = Number(draft.studentCount)
  const textbookIdRaw = draft.textbookId?.trim() ?? ''
  const isTextbookNotUsed =
    textbookIdRaw === TEXTBOOK_NOT_USED_OPTION_VALUE ||
    draft.textbookName?.trim() === '해당 없음' ||
    !textbookIdRaw
  const textbookIdNum = Number(textbookIdRaw)

  const gradeTrimmed = draft.educationGrade.trim()
  const textbookId: number | null | undefined = isTextbookNotUsed
    ? null
    : Number.isFinite(textbookIdNum)
      ? textbookIdNum
      : undefined
  const requestedEducationFormat = toRequestedEducationFormatApiValue(draft.educationFormat)
  const baselineEducationFormat = toRequestedEducationFormatApiValue(params.baselineEducationFormat)
  const body: Record<string, unknown> = {
    requestedGrade: gradeTrimmed
      ? formatInstitutionApplicationGradeDisplay(gradeTrimmed)
      : undefined,
    organizationAddressDetail: draft.addressDetail.trim() || undefined,
    requestedClassCount: Number.isFinite(classCount) ? classCount : undefined,
    requestedStudentCount: Number.isFinite(studentCount) ? studentCount : undefined,
    ...(params.allowEducationFormatChange !== false &&
    requestedEducationFormat &&
    requestedEducationFormat !== baselineEducationFormat
      ? { requestedEducationFormat }
      : {}),
    teacherMemberId,
    teacherPhone: draft.teacherMobile.trim() || draft.teacherPhone.trim() || undefined,
    teacherEmail: draft.teacherEmail.trim() || undefined,
    applicationReason: draft.applicationReason.trim() || undefined,
    otherRequests: draft.otherRequests.trim() || undefined,
    computerInRoom: draft.computerInRoom.trim() || undefined,
    waitingRoomAvailable: draft.waitingRoomAvailable,
    waitingRoomLocation: draft.waitingRoomAvailable
      ? draft.waitingRoomLocation.trim() || undefined
      : undefined,
    mealProvided: draft.mealProvided,
    mealNotice: draft.mealProvided ? draft.mealNotice.trim() || undefined : undefined,
    parkingInfo: draft.parkingInfo.trim() || undefined,
  }

  if (params.includeTextbookFields !== false) {
    body.textbookId = textbookId
    if (!isTextbookNotUsed) {
      if (params.textbookGrade?.trim()) body.textbookGrade = params.textbookGrade.trim()
    }
  }

  return body as OrganizationApplicationUpdateRequestWithNullTextbook
}

export function buildParticipatingInstitutionLocalSavePatch(params: {
  detailId: string
  draft: ParticipatingInstitutionEditDraft
  patch: Partial<SchoolDetailForModal>
  fallbackClassCount: number
  fallbackStudentCount: number
}): Partial<SchoolDetailForModal> & { id: string } {
  const classCount = Number(params.draft.classCount)
  const studentCount = Number(params.draft.studentCount)
  return {
    id: params.detailId,
    ...params.patch,
    educationGrade: params.draft.educationGrade.trim() || undefined,
    classCount: Number.isFinite(classCount) ? classCount : params.fallbackClassCount,
    studentCount: Number.isFinite(studentCount) ? studentCount : params.fallbackStudentCount,
  }
}
