/**
 * 수강자 수강 프로그램 Mock 데이터
 */

import type { Program } from '@/types/domain'
import { mockApplications } from './applications'
import { mockPrograms, mockProgramsMap } from './programs'

export function getStudentEnrolledPrograms(userId: string): Program[] {
  const approvedApplications = mockApplications.filter(
    app => app.subjectType === 'student' && app.subjectId === userId && app.status === 'approved'
  )

  if (approvedApplications.length > 0) {
    const programIds = new Set(approvedApplications.map(app => app.programId))
    return Array.from(programIds)
      .map(id => mockProgramsMap.get(id))
      .filter((program): program is Program => Boolean(program))
  }

  // 기본 fallback: 최소한의 수강 프로그램 노출
  return mockPrograms.slice(0, 6)
}
