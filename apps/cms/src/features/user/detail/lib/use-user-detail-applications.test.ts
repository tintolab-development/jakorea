import { describe, expect, it } from 'vitest'
import type { Application } from '@/types/domain'
import { mergeMemberApplicationsWithProgramHistory } from './use-user-detail-applications'

function app(id: string, subjectType: Application['subjectType']): Application {
  return {
    id,
    programId: `p-${id}`,
    status: 'approved',
    subjectType,
    subjectId: 'u1',
    submittedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
}

describe('mergeMemberApplicationsWithProgramHistory', () => {
  it('강사는 신청(강사)과 참여(학생)를 나눈다', () => {
    const result = mergeMemberApplicationsWithProgramHistory(
      [app('a1', 'instructor'), app('a2', 'student')],
      [app('h1', 'student')],
      'INSTRUCTOR'
    )
    expect(result.applications.map(a => a.id)).toEqual(['a1'])
    expect(result.enrollmentApplications.map(a => a.id).sort()).toEqual(['a2', 'h1'])
  })

  it('동일 id는 한 건만 남긴다', () => {
    const result = mergeMemberApplicationsWithProgramHistory(
      [app('dup', 'student')],
      [app('dup', 'student')],
      'INDIVIDUAL'
    )
    expect(result.applications).toHaveLength(1)
    expect(result.enrollmentApplications).toEqual([])
  })
})
