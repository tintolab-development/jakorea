import { z } from 'zod'
import type {
  ApplicantInstitutionDetailSavePayload,
  ApplicantSchoolRow,
} from '@/data/mock/applicant-institutions'
import {
  buildInstitutionApplicationEditFieldsFromApplicantDetail,
  type InstitutionApplicationDetailEditFields,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-edit-fields'

export type CombinedClassApplicationStatus = '신청' | '미신청'

export interface ApplicantInstitutionEditDraft
  extends InstitutionApplicationDetailEditFields {
  adminComment: string
  textbookId: string
  textbookName: string
  combinedClassApplication: CombinedClassApplicationStatus
  combinedClassPartnerApplicantIds: string[]
}

const applicationFieldsSchema = z.object({
  addressDetail: z.string(),
  educationFormat: z.string(),
  applicationReason: z.string(),
  otherRequests: z.string(),
  computerInRoom: z.string(),
  waitingRoomAvailable: z.boolean(),
  waitingRoomLocation: z.string(),
  mealProvided: z.boolean(),
  mealNotice: z.string(),
  parkingInfo: z.string(),
  teacherName: z.string(),
  teacherPhone: z.string(),
  teacherMobile: z.string(),
  teacherEmail: z.string(),
})

export const applicantInstitutionEditSchema = z
  .object({
    adminComment: z.string(),
    textbookId: z.string().min(1, '교재명을 선택해 주세요.'),
    textbookName: z.string().min(1, '교재명을 선택해 주세요.'),
    combinedClassApplication: z.enum(['신청', '미신청']),
    combinedClassPartnerApplicantIds: z.array(z.string()),
  })
  .merge(applicationFieldsSchema)
  .superRefine((data, ctx) => {
    if (data.combinedClassApplication === '신청' && data.combinedClassPartnerApplicantIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '합반 신청 시 대상 학년을 1개 이상 선택해 주세요.',
        path: ['combinedClassPartnerApplicantIds'],
      })
    }
    if (data.waitingRoomAvailable && !data.waitingRoomLocation.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '대기 장소를 입력해 주세요.',
        path: ['waitingRoomLocation'],
      })
    }
  })

export type ApplicantInstitutionEditFormValues = z.infer<typeof applicantInstitutionEditSchema>

export function rowToEditDraft(row: ApplicantSchoolRow): ApplicantInstitutionEditDraft {
  const detail = row.detail
  const combinedStatus: CombinedClassApplicationStatus =
    detail?.combinedClassApplication === '신청' ? '신청' : '미신청'
  const applicationFields = buildInstitutionApplicationEditFieldsFromApplicantDetail(detail, row)

  return {
    adminComment: row.adminComment ?? '',
    textbookId: detail?.textbookId ?? '',
    textbookName: detail?.textbookName ?? '',
    combinedClassApplication: combinedStatus,
    combinedClassPartnerApplicantIds: detail?.combinedClassPartnerApplicantIds ?? [],
    ...applicationFields,
  }
}

function formatApplicantMealInfo(mealProvided: boolean, mealNotice: string): string {
  if (!mealProvided) return '불가'
  const notice = mealNotice.trim()
  return notice ? `가능 | ${notice}` : '가능'
}

function formatApplicantWaitingGuide(available: boolean, location: string): string {
  if (!available) return '없음'
  return location.trim()
}

export function draftToSavePayload(
  draft: ApplicantInstitutionEditDraft,
  row: ApplicantSchoolRow
): ApplicantInstitutionDetailSavePayload | null {
  const parsed = applicantInstitutionEditSchema.safeParse(draft)
  if (!parsed.success) return null

  const adminTrimmed = parsed.data.adminComment.trim()

  return {
    adminComment: adminTrimmed || undefined,
    educationGrade: row.educationGrade,
    classCount: row.classCount,
    studentCount: row.studentCount,
    addressDetail: parsed.data.addressDetail.trim() || undefined,
    educationType: parsed.data.educationFormat.trim() || undefined,
    applicationReason: parsed.data.applicationReason.trim() || undefined,
    otherRequests: parsed.data.otherRequests.trim() || undefined,
    computerInSpace: parsed.data.computerInRoom.trim() || undefined,
    waitingPlaceGuide: formatApplicantWaitingGuide(
      parsed.data.waitingRoomAvailable,
      parsed.data.waitingRoomLocation
    ),
    mealInfo: formatApplicantMealInfo(parsed.data.mealProvided, parsed.data.mealNotice),
    otherSpecialNotes: parsed.data.parkingInfo.trim() || undefined,
    textbookId: parsed.data.textbookId,
    textbookName: parsed.data.textbookName,
    combinedClassApplication: parsed.data.combinedClassApplication,
    combinedClassPartnerApplicantIds:
      parsed.data.combinedClassApplication === '신청'
        ? parsed.data.combinedClassPartnerApplicantIds
        : [],
  }
}

export function parseApplicantInstitutionEditDraft(
  draft: ApplicantInstitutionEditDraft
): { success: true; data: ApplicantInstitutionEditFormValues } | { success: false; errors: Record<string, string> } {
  const result = applicantInstitutionEditSchema.safeParse(draft)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'form'
    if (!errors[key]) {
      errors[key] = issue.message
    }
  }
  return { success: false, errors }
}

export function formatCombinedClassDisplay(detail?: ApplicantSchoolRow['detail']): string {
  if (!detail?.combinedClassApplication || detail.combinedClassApplication === '미신청') {
    return '미신청'
  }
  const grades = detail.combinedClassPartnerGrades?.filter(Boolean) ?? []
  if (grades.length === 0) return '신청'
  return `신청 | ${grades.join(', ')}`
}
