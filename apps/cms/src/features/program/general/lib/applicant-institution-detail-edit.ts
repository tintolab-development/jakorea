import { z } from 'zod'
import type {
  ApplicantInstitutionDetailSavePayload,
  ApplicantSchoolRow,
} from '@/data/mock/applicant-institutions'
import {
  formatInstitutionApplicationGradeDisplay,
  formatInstitutionTeacherInfoForDetail,
} from '@/features/program/general/lib/institution-application-detail-edit-policy'
import {
  buildInstitutionApplicationEditFieldsFromApplicantDetail,
  type InstitutionApplicationDetailEditFields,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-edit-fields'
import { parsePositiveIntInput } from '@/features/template/lib/participant-recruitment-institution-limits'

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
  educationGrade: z.string().min(1, '신청 학년을 선택해 주세요.'),
  classCount: z.string().min(1, '신청 학급 수를 선택해 주세요.'),
  studentCount: z.string().min(1, '총 학생 수를 입력해 주세요.'),
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
  teacherName: z.string().min(1, '담당 교사를 선택해 주세요.'),
  teacherPhone: z.string(),
  teacherMobile: z.string(),
  teacherEmail: z.string(),
})

export interface ApplicantInstitutionEditValidationOptions {
  showEducationFormatField?: boolean
}

export function createApplicantInstitutionEditSchema(
  options: ApplicantInstitutionEditValidationOptions = {}
) {
  return z
    .object({
      adminComment: z.string(),
      textbookId: z.string().min(1, '교재명을 선택해 주세요.'),
      textbookName: z.string().min(1, '교재명을 선택해 주세요.'),
      combinedClassApplication: z.enum(['신청', '미신청']),
      combinedClassPartnerApplicantIds: z.array(z.string()),
    })
    .merge(applicationFieldsSchema)
    .superRefine((data, ctx) => {
      if (
        data.combinedClassApplication === '신청' &&
        data.combinedClassPartnerApplicantIds.length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '합반 신청 시 대상 학년을 1개 이상 선택해 주세요.',
          path: ['combinedClassPartnerApplicantIds'],
        })
      }
      if (parsePositiveIntInput(data.studentCount) == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '총 학생 수를 숫자로 입력해 주세요.',
          path: ['studentCount'],
        })
      }
      if (options.showEducationFormatField && !data.educationFormat.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '희망 교육 형태를 선택해 주세요.',
          path: ['educationFormat'],
        })
      }
    })
}

export const applicantInstitutionEditSchema = createApplicantInstitutionEditSchema()

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

export function draftToSavePayload(
  draft: ApplicantInstitutionEditDraft,
  row: ApplicantSchoolRow,
  options: ApplicantInstitutionEditValidationOptions = {}
): ApplicantInstitutionDetailSavePayload | null {
  const schema = createApplicantInstitutionEditSchema(options)
  const parsed = schema.safeParse(draft)
  if (!parsed.success) return null

  const adminTrimmed = parsed.data.adminComment.trim()
  const classCount = parsePositiveIntInput(parsed.data.classCount)
  const studentCount = parsePositiveIntInput(parsed.data.studentCount)
  if (classCount == null || studentCount == null) return null

  const teacherInfo = formatInstitutionTeacherInfoForDetail({
    teacherName: parsed.data.teacherName,
    teacherPhone: parsed.data.teacherPhone,
    teacherMobile: parsed.data.teacherMobile,
    teacherEmail: parsed.data.teacherEmail,
  })

  return {
    adminComment: adminTrimmed || undefined,
    educationGrade: formatInstitutionApplicationGradeDisplay(parsed.data.educationGrade),
    classCount,
    studentCount,
    addressDetail: parsed.data.addressDetail.trim() || undefined,
    educationType: options.showEducationFormatField
      ? parsed.data.educationFormat.trim() || undefined
      : row.detail?.educationType,
    applicationReason: row.detail?.applicationReason,
    otherRequests: row.detail?.otherRequests,
    computerInSpace: row.detail?.computerInSpace,
    waitingPlaceGuide: row.detail?.waitingPlaceGuide ?? row.detail?.waitingRoom,
    mealInfo: row.detail?.mealInfo,
    otherSpecialNotes: row.detail?.otherSpecialNotes ?? row.detail?.parkingInfo,
    textbookId: parsed.data.textbookId,
    textbookName: parsed.data.textbookName,
    combinedClassApplication: parsed.data.combinedClassApplication,
    combinedClassPartnerApplicantIds:
      parsed.data.combinedClassApplication === '신청'
        ? parsed.data.combinedClassPartnerApplicantIds
        : [],
    teacherName: parsed.data.teacherName.trim(),
    contact: parsed.data.teacherPhone.trim() || undefined,
    teacherInfo,
  }
}

export function parseApplicantInstitutionEditDraft(
  draft: ApplicantInstitutionEditDraft,
  options: ApplicantInstitutionEditValidationOptions = {}
):
  | { success: true; data: ApplicantInstitutionEditFormValues }
  | { success: false; errors: Record<string, string> } {
  const schema = createApplicantInstitutionEditSchema(options)
  const result = schema.safeParse(draft)

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
