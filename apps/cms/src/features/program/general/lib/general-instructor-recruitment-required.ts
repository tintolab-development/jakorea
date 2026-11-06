import type { Program, ProgramRecruitmentWindow } from '@/types/domain'

const INACTIVE_RECRUITMENT_STATUSES = new Set(['CANCELLED', 'CANCELED', 'DELETED', 'DRAFT'])

const INSTRUCTOR_RECRUITMENT_TYPES = new Set(['INSTRUCTOR', 'LECTURER'])

function readRecruitmentStatus(row: ProgramRecruitmentWindow & { status?: string | null }): string {
  return row.status?.trim().toUpperCase() ?? ''
}

function isInstructorRecruitmentType(row: ProgramRecruitmentWindow): boolean {
  const type = (row.recruitmentType ?? row.targetType ?? row.applicationType ?? '').trim().toUpperCase()
  return INSTRUCTOR_RECRUITMENT_TYPES.has(type)
}

export const GENERAL_INSTRUCTOR_ASSIGNMENT_REQUIRES_RECRUITMENT_MESSAGE =
  '강사 모집이 없는 일반 기관 프로그램에는 강사를 배정할 수 없습니다.'

/** 일반 기관 프로그램에 활성 강사(INSTRUCTOR/LECTURER) 모집 행이 있는지. */
export function programHasActiveInstructorRecruitment(program: Pick<Program, 'programRecruitments'>): boolean {
  const rows = program.programRecruitments ?? []
  return rows.some(row => {
    if (!isInstructorRecruitmentType(row)) return false
    const status = readRecruitmentStatus(row)
    return status === '' || !INACTIVE_RECRUITMENT_STATUSES.has(status)
  })
}
