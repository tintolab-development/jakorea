import { formatRequestedEducationFormat } from '@/features/program/general/api/adapters/general-applications-adapters'
import type { SchoolDetailForModal } from '@/features/program/general/model/school-detail-types'
import type { OrganizationApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationDetailResponse'
import { readOrganizationTextbookKitFields } from '@/features/program/general/lib/school-detail'

/**
 * 기관 신청 상세 GET → 진행 현황 상세 편집 draft에 넣을 필드.
 * 목록 행에 없는 교재 id·교사 연락처·신청 사유 등을 채운다.
 */
export function mapOrganizationApplicationDetailToParticipatingEditFields(
  dto: OrganizationApplicationDetailResponse
): Partial<SchoolDetailForModal> {
  const addressDetail = dto.organizationAddressDetail?.trim() || undefined
  const educationFormat = formatRequestedEducationFormat(dto.requestedEducationFormat) || undefined
  const applicationReason = dto.applicationReason?.trim() || undefined
  const otherRequests = dto.otherRequests?.trim() || undefined
  const teacherName = dto.teacherName?.trim() || undefined
  const teacherTel = Object.prototype.hasOwnProperty.call(dto, 'teacherTel')
    ? (dto.teacherTel?.trim() || undefined)
    : undefined
  const teacherMobile = dto.teacherPhone?.trim() || undefined
  const teacherEmail = dto.teacherEmail?.trim() || undefined
  const educationGrade = dto.requestedGrade?.trim() || undefined
  const textbookNameRaw = dto.textbookName?.trim() || undefined
  const textbookName =
    textbookNameRaw && textbookNameRaw !== '해당 없음' ? textbookNameRaw : undefined
  const textbookId =
    dto.textbookId != null && Number.isFinite(dto.textbookId) ? String(dto.textbookId) : undefined
  const textbookGrade = dto.textbookGrade?.trim() || undefined
  const { textbookKits, textbookQuantity } = readOrganizationTextbookKitFields(dto)
  const classCount =
    typeof dto.requestedClassCount === 'number' && Number.isFinite(dto.requestedClassCount)
      ? dto.requestedClassCount
      : undefined
  const studentCount =
    typeof dto.requestedStudentCount === 'number' && Number.isFinite(dto.requestedStudentCount)
      ? dto.requestedStudentCount
      : undefined
  const computerInRoom = dto.computerInRoom?.trim() || undefined
  const waitingRoomLocation = dto.waitingRoomLocation?.trim() || undefined
  const mealNotice = dto.mealNotice?.trim() || undefined
  const parkingInfo = dto.parkingInfo?.trim() || undefined

  const patch: Partial<SchoolDetailForModal> = {
    ...(addressDetail ? { addressDetail } : {}),
    ...(educationFormat ? { educationFormat } : {}),
    ...(applicationReason ? { applicationReason } : {}),
    ...(otherRequests ? { otherRequests } : {}),
    ...(teacherName ? { teacherName } : {}),
    ...(teacherTel ? { teacherPhone: teacherTel } : {}),
    ...(teacherMobile ? { teacherMobile } : {}),
    ...(teacherEmail ? { teacherEmail } : {}),
    ...(educationGrade ? { educationGrade } : {}),
    ...(textbookId ? { textbookId } : {}),
    ...(textbookName ? { textbookName } : {}),
    ...(textbookGrade ? { textbookGrade } : {}),
    ...(textbookKits != null ? { textbookKits } : {}),
    ...(textbookQuantity != null ? { textbookQuantity } : {}),
    ...(classCount != null ? { classCount } : {}),
    ...(studentCount != null ? { studentCount } : {}),
    ...(computerInRoom ? { computerInRoom } : {}),
    ...(typeof dto.waitingRoomAvailable === 'boolean'
      ? { waitingRoomAvailable: dto.waitingRoomAvailable }
      : {}),
    ...(waitingRoomLocation ? { waitingRoomLocation } : {}),
    ...(typeof dto.mealProvided === 'boolean' ? { mealProvided: dto.mealProvided } : {}),
    ...(mealNotice ? { mealNotice } : {}),
    ...(parkingInfo ? { parkingInfo } : {}),
  }

  if (dto.textbookId === null && !textbookName) {
    patch.textbookName = '해당 없음'
  }

  return patch
}
