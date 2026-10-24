/**
 * 1사1교 상세 공통정보 폼 → 호환 overlay 조각.
 * 지급항목 ID·강사비 원숫자·KPI presence는 라벨/0 fallback보다 이 값이 정본이다.
 */
export type CompanySchoolDetailCompatFormValues = {
  announcementTitle?: string
  wagePaymentItemIds?: string[]
  wageGrade1Amount?: string
  wageGrade2Amount?: string
  wageGrade3Amount?: string
  wageGrade1LongDistanceAmount?: string
  wageGrade2LongDistanceAmount?: string
  wageGrade3LongDistanceAmount?: string
  kpiFinalParticipants?: number
  kpiInstructorCount?: number
  kpiFinalSchools?: number
  kpiFinalClasses?: number
}

const WAGE = 'economyRegistration.wageInfo' as const
const KPI = 'economyRegistration.kpi' as const

function overlayNumberFromFormAmount(value: string | undefined): number | null | undefined {
  if (value === undefined) return undefined
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed.replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

export function companySchoolCompatibilityOverlayFromDetailEditValues(
  values: CompanySchoolDetailCompatFormValues
): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  if (values.announcementTitle !== undefined) {
    next['economyRegistration.basicInfo.publicProgramTitle'] = values.announcementTitle
  }
  if (values.wagePaymentItemIds != null) {
    next[`${WAGE}.paymentItemValues`] = [...values.wagePaymentItemIds]
  }
  const wages: Array<[string, string | undefined]> = [
    [`${WAGE}.grade1Fee`, values.wageGrade1Amount],
    [`${WAGE}.grade1DistanceFee`, values.wageGrade1LongDistanceAmount],
    [`${WAGE}.grade2Fee`, values.wageGrade2Amount],
    [`${WAGE}.grade2DistanceFee`, values.wageGrade2LongDistanceAmount],
    [`${WAGE}.grade3Fee`, values.wageGrade3Amount],
    [`${WAGE}.grade3DistanceFee`, values.wageGrade3LongDistanceAmount],
  ]
  for (const [key, raw] of wages) {
    const parsed = overlayNumberFromFormAmount(raw)
    if (parsed !== undefined) next[key] = parsed
  }
  if (values.kpiFinalParticipants !== undefined) {
    next[`${KPI}.participantCount`] = values.kpiFinalParticipants
  }
  if (values.kpiInstructorCount !== undefined) {
    next[`${KPI}.instructor`] = values.kpiInstructorCount
  }
  if (values.kpiFinalSchools !== undefined) {
    next[`${KPI}.dispatchedSchool`] = values.kpiFinalSchools
  }
  if (values.kpiFinalClasses !== undefined) {
    next[`${KPI}.dispatchedClass`] = values.kpiFinalClasses
  }
  return next
}
