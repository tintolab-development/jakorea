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
    case 'trained_teacher':
      return '/programs/trained-teachers?viewMode=calendar'
  }
}

export function programScheduleEventPath(kind: ProgramScheduleKind, programId: string): string {
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
    case 'trained_teacher':
      return `/programs/trained-teachers?programId=${encoded}`
  }
}

function normalizeRecruitmentProgramType(value?: string): string {
  return (value ?? '').trim().toLowerCase().replace(/-/g, '_')
}

export function recruitmentProgramDetailPath(programId: string, programType?: string): string {
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
  if (type.includes('trained_teacher')) {
    return `/programs/trained-teachers?programId=${encoded}`
  }
  return `/programs/general?programId=${encoded}`
}

export function kpiEducationRecordsPath(mainTitle?: string): string {
  if (!mainTitle?.trim()) return EDUCATION_RECORDS_PATH
  return `${EDUCATION_RECORDS_PATH}?er_main=${encodeURIComponent(mainTitle.trim())}`
}

/**
 * 문의 목록 링크. 필터 칸에는 프로그램명(`inq_prog`)을 보여 주고,
 * 조회는 프로그램 ID(`inq_pid`)로 한다. 이름과 ID를 같은 칸에 섞으면 서버가 두 조건을 함께 걸어 0건이 된다.
 */
export function inquiryListPath(programId?: string, programName?: string): string {
  const params = new URLSearchParams()
  const name = programName?.trim()
  const id = programId?.trim()
  if (name) params.set('inq_prog', name)
  if (id && /^\d+$/.test(id)) {
    params.set('inq_pid', id)
    if (!name) params.set('inq_prog', id)
  }
  const query = params.toString()
  return query ? `${ADMIN_POSTS_INQUIRIES_PATH}?${query}` : ADMIN_POSTS_INQUIRIES_PATH
}
