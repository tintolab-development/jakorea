/**
 * 중복 신청 체크 유틸리티
 * Phase 1: 진행 프로그램 강사용 필터/탭/중복 신청 알럿 구현
 * FSD: features/application으로 이동 (shared는 entities 미참조)
 */

import type { Application, Program } from '@/types/domain'
import type { UUID } from '@/types'
import { mockApplications } from '@/data/mock/applications'
import { schoolService } from '@/entities/school/api/school-service'
import dayjs from 'dayjs'

export interface DuplicateCheckResult {
  isDuplicate: boolean
  case?: 'case1' | 'case2'
  message?: string
  existingApplication?: Application
}

function checkCase1(
  programId: UUID,
  userId: UUID,
  applications: Application[]
): DuplicateCheckResult | null {
  const existingApp = applications.find(
    app => app.programId === programId && app.subjectId === userId
  )

  if (existingApp) {
    return {
      isDuplicate: true,
      case: 'case1',
      message: '동일한 프로그램에 이미 신청한 이력이 있습니다.',
      existingApplication: existingApp,
    }
  }

  return null
}

function checkCase2(
  program: Program,
  _userId: UUID,
  applications: Application[]
): DuplicateCheckResult | null {
  if (program.category !== 'school') {
    return null
  }

  if (!program.schoolId) {
    return null
  }

  const school = schoolService.getByIdSync(program.schoolId)
  if (!school) {
    return null
  }

  const schoolPrograms = applications.filter(app => {
    return app.subjectType === 'school' && app.status !== 'cancelled'
  })

  if (schoolPrograms.length > 0) {
    const existingApp = schoolPrograms[0]
    const programStartDate = dayjs(program.startDate).format('MM.DD')
    const targetLevel = program.targetLevel
      ? {
          elementary: '초등학교',
          middle: '중학교',
          high: '고등학교',
          university: '대학생',
          adult: '성인',
        }[program.targetLevel] || ''
      : ''

    return {
      isDuplicate: true,
      case: 'case2',
      message: `아래와 같이 해당 학교명으로 신청된 이력이 있습니다.\n[${school.name} / ${targetLevel} 대상 / ${programStartDate} 진행 희망]\n추가 신청하시겠습니까?`,
      existingApplication: existingApp,
    }
  }

  return null
}

/**
 * 프로그램 신청 전 중복 체크
 */
export function checkDuplicateApplication(
  program: Program,
  userId: UUID,
  applications: Application[] = mockApplications
): DuplicateCheckResult {
  const case1Result = checkCase1(program.id, userId, applications)
  if (case1Result) {
    return case1Result
  }

  const case2Result = checkCase2(program, userId, applications)
  if (case2Result) {
    return case2Result
  }

  return {
    isDuplicate: false,
  }
}
