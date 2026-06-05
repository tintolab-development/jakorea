import { z } from 'zod'
import type { SchoolDetailForModal } from '@/features/program/general/model/school-detail-types'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import type { CombinedClassApplicationStatus } from '@/features/program/general/lib/applicant-institution-detail-edit'
import type { Program } from '@/types/domain'
import { listTextbooksFromStore } from '@/features/textbook/api/textbook-service'
import {
  calculateParticipatingTextbookKitQuantity,
  resolveTextbookFieldsFromSelection,
} from '@/features/program/general/lib/participating-institution-textbook'
import type { InstitutionApplicationDetailEditFields } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-edit-fields'
import { buildInstitutionApplicationEditFieldsFromParticipatingDetail } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-edit-fields'

export interface ParticipatingInstitutionEditDraft
  extends InstitutionApplicationDetailEditFields {
  adminComment: string
  textbookId: string
  textbookName: string
  /** 합반 시 선택 교재 학년 (실적 취합용) */
  textbookGrade: string
  combinedClassApplication: CombinedClassApplicationStatus
  combinedClassPartnerSchoolIds: string[]
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

/** 저장값·레거시(진행/미진행) → 신청/미신청 */
export function toCombinedClassApplicationStatus(value?: string): CombinedClassApplicationStatus {
  if (value === '신청' || value === '진행') return '신청'
  return '미신청'
}

function buildParticipatingInstitutionEditSchema(requiresTextbookSelection: boolean) {
  return z
    .object({
      adminComment: z.string(),
      textbookId: requiresTextbookSelection
        ? z.string().min(1, '교재명을 선택해 주세요.')
        : z.string(),
      textbookName: requiresTextbookSelection
        ? z.string().min(1, '교재명을 선택해 주세요.')
        : z.string(),
      textbookGrade: z.string(),
      combinedClassApplication: z.enum(['신청', '미신청']),
      combinedClassPartnerSchoolIds: z.array(z.string()),
    })
    .merge(applicationFieldsSchema)
    .superRefine((data, ctx) => {
      if (
        data.combinedClassApplication === '신청' &&
        data.combinedClassPartnerSchoolIds.length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '합반 신청 시 대상 학년을 1개 이상 선택해 주세요.',
          path: ['combinedClassPartnerSchoolIds'],
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
}

export const participatingInstitutionEditSchema = buildParticipatingInstitutionEditSchema(true)

export type ParticipatingInstitutionEditFormValues = z.infer<
  typeof participatingInstitutionEditSchema
>

export function detailToParticipatingInstitutionEditDraft(
  detail: SchoolDetailForModal,
  textbookIdFallback = '',
  textbookGradeFallback = ''
): ParticipatingInstitutionEditDraft {
  const applicationFields = buildInstitutionApplicationEditFieldsFromParticipatingDetail(detail)
  return {
    adminComment: detail.adminComment ?? '',
    textbookId: detail.textbookId ?? textbookIdFallback,
    textbookName: detail.textbookName ?? '',
    textbookGrade: detail.textbookGrade ?? textbookGradeFallback,
    combinedClassApplication: toCombinedClassApplicationStatus(detail.combinedClassApplication),
    combinedClassPartnerSchoolIds: detail.combinedClassPartnerSchoolIds ?? [],
    ...applicationFields,
  }
}

export interface ParticipatingInstitutionEditPatchContext {
  program: Program
  studentCount: number
  requiresTextbook: boolean
}

export function participatingInstitutionEditDraftToDetailPatch(
  draft: ParticipatingInstitutionEditDraft,
  partnerGrades: string[],
  context: ParticipatingInstitutionEditPatchContext
): Partial<SchoolDetailForModal> {
  const schema = buildParticipatingInstitutionEditSchema(
    requiresParticipatingTextbookSelection(context.requiresTextbook, draft)
  )
  const parsed = schema.safeParse(draft)
  if (!parsed.success) return {}

  const adminTrimmed = parsed.data.adminComment.trim()
  const isApplied = parsed.data.combinedClassApplication === '신청'
  const kitQuantity = calculateParticipatingTextbookKitQuantity(
    context.program,
    context.studentCount
  )

  const selectedTextbook = parsed.data.textbookId
    ? listTextbooksFromStore().find(row => row.id === parsed.data.textbookId)
    : undefined

  const textbookFields =
    context.requiresTextbook && isApplied && selectedTextbook
      ? resolveTextbookFieldsFromSelection(
          context.program,
          selectedTextbook,
          context.studentCount
        )
      : context.requiresTextbook
        ? {
            textbookKits: kitQuantity.textbookKits,
            textbookQuantity: kitQuantity.textbookQuantity,
          }
        : {}

  return {
    adminComment: adminTrimmed || undefined,
    ...textbookFields,
    addressDetail: parsed.data.addressDetail.trim() || undefined,
    educationFormat: parsed.data.educationFormat.trim() || undefined,
    applicationReason: parsed.data.applicationReason.trim() || undefined,
    otherRequests: parsed.data.otherRequests.trim() || undefined,
    computerInRoom: parsed.data.computerInRoom.trim() || undefined,
    waitingRoomAvailable: parsed.data.waitingRoomAvailable,
    waitingRoomLocation: parsed.data.waitingRoomAvailable
      ? parsed.data.waitingRoomLocation.trim() || undefined
      : undefined,
    mealProvided: parsed.data.mealProvided,
    mealNotice: parsed.data.mealProvided
      ? parsed.data.mealNotice.trim() || undefined
      : undefined,
    parkingInfo: parsed.data.parkingInfo.trim() || undefined,
    teacherName: parsed.data.teacherName.trim() || undefined,
    teacherPhone: parsed.data.teacherPhone.trim() || undefined,
    teacherMobile: parsed.data.teacherMobile.trim() || undefined,
    teacherEmail: parsed.data.teacherEmail.trim() || undefined,
    combinedClassApplication: parsed.data.combinedClassApplication,
    combinedClassPartnerSchoolIds: isApplied ? parsed.data.combinedClassPartnerSchoolIds : [],
    combinedClassPartnerGrades: isApplied ? partnerGrades.filter(Boolean) : [],
  }
}

export function requiresParticipatingTextbookSelection(
  usesTextbook: boolean,
  draft: Pick<ParticipatingInstitutionEditDraft, 'combinedClassApplication'>
): boolean {
  return usesTextbook && draft.combinedClassApplication === '신청'
}

export function parseParticipatingInstitutionEditDraft(
  draft: ParticipatingInstitutionEditDraft,
  options?: { usesTextbook?: boolean }
):
  | { success: true; data: ParticipatingInstitutionEditFormValues }
  | { success: false; errors: Record<string, string> } {
  const schema = buildParticipatingInstitutionEditSchema(
    requiresParticipatingTextbookSelection(options?.usesTextbook ?? true, draft)
  )
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

export function formatParticipatingCombinedClassDisplay(
  detail: Pick<
    SchoolDetailForModal,
    'combinedClassApplication' | 'combinedClassPartnerGrades'
  >
): string {
  const status = toCombinedClassApplicationStatus(detail.combinedClassApplication)
  if (status === '미신청') {
    return '미신청'
  }
  const grades = detail.combinedClassPartnerGrades?.filter(Boolean) ?? []
  if (grades.length === 0) return '신청'
  return `신청 | ${grades.join(', ')}`
}

export function resolveTextbookIdFromName(
  textbookName: string | undefined,
  options: Array<{ value: string; textbookName: string }>
): string {
  const name = textbookName?.trim()
  if (!name) return ''
  const matched = options.find(option => option.textbookName === name)
  return matched?.value ?? ''
}

export function resolvePartnerGradesFromSchoolIds(
  schoolIds: string[],
  schoolList: ParticipatingSchoolRow[]
): string[] {
  const idSet = new Set(schoolIds)
  return schoolList.filter(row => idSet.has(row.id)).map(row => row.educationGrade)
}
