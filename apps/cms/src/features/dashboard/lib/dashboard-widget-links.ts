import type { ProgramScheduleKind } from '@/data/mock/program-schedule-keys'

const ADMIN_POSTS_INQUIRIES_PATH = '/admin/posts/inquiries'
const EDUCATION_RECORDS_PATH = '/education-records'

export const RECRUITMENT_STATUS_MORE_PATH =
  '/programs/general?status=in_progress&viewMode=list'

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

export function recruitmentProgramDetailPath(programId: string): string {
  return `/programs/general?programId=${encodeURIComponent(programId)}`
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
