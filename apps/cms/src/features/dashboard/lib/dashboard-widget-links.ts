import type { ProgramScheduleKind } from '@/features/dashboard/model/program-schedule-keys'

const ADMIN_POSTS_INQUIRIES_PATH = '/admin/posts/inquiries'
const EDUCATION_RECORDS_PATH = '/education-records'

export const RECRUITMENT_STATUS_MORE_PATH = '/programs/general?viewMode=list'

export function programScheduleMorePath(kind: ProgramScheduleKind): string {
  switch (kind) {
    case 'general':
      return '/programs/general?viewMode=calendar'
    case 'company_school':
      return '/programs/company-school?viewMode=calendar'
    case 'ujat':
      return '/programs/ujat?viewMode=calendar'
    case 'gemini':
      return '/programs/gemini/visiting-training'
  }
}

export function programScheduleEventPath(
  kind: ProgramScheduleKind,
  programId: string
): string {
  const encoded = encodeURIComponent(programId)
  switch (kind) {
    case 'general':
      return `/programs/general?programId=${encoded}`
    case 'company_school':
      return `/programs/company-school?programId=${encoded}`
    case 'ujat':
      return `/programs/ujat?programId=${encoded}`
    case 'gemini':
      return `/programs/gemini/visiting-training?programId=${encoded}`
  }
}

function normalizeRecruitmentProgramType(value?: string): string {
  return (value ?? '').trim().toLowerCase().replace(/-/g, '_')
}

export function recruitmentProgramDetailPath(
  programId: string,
  programType?: string
): string {
  const encoded = encodeURIComponent(programId)
  const type = normalizeRecruitmentProgramType(programType)
  if (type.includes('company_school') || type.includes('one_company')) {
    return `/programs/company-school?programId=${encoded}`
  }
  if (type.includes('ujat')) {
    return `/programs/ujat?programId=${encoded}`
  }
  if (type.includes('gemini')) {
    return `/programs/gemini/visiting-training?programId=${encoded}`
  }
  return `/programs/general?programId=${encoded}`
}

export function kpiEducationRecordsPath(mainTitle?: string): string {
  if (!mainTitle?.trim()) return EDUCATION_RECORDS_PATH
  return `${EDUCATION_RECORDS_PATH}?er_main=${encodeURIComponent(mainTitle.trim())}`
}

export function inquiryListPath(programId?: string, programName?: string): string {
  const filter = programId || programName
  if (!filter) return ADMIN_POSTS_INQUIRIES_PATH
  return `${ADMIN_POSTS_INQUIRIES_PATH}?inq_prog=${encodeURIComponent(filter)}`
}
