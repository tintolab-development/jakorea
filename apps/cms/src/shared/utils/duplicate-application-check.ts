/**
 * 중복 신청 체크 유틸리티
 * Phase 1: 진행 프로그램 강사용 필터/탭/중복 신청 알럿 구현
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

/**
 * Case 1: 동일한 정보의 신청 이력이 있는 경우
 */
function checkCase1(
  programId: UUID,
  userId: UUID,
  applications: Application[]
): DuplicateCheckResult | null {
  // 동일한 프로그램에 대한 신청 이력 확인
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

/**
 * Case 2: 학교 프로그램 신청 시 동일한 학교에서의 신청 이력이 있는 경우
 * (학교명은 같되, 학년/날짜/신청자 중 하나가 다른 경우)
 */
function checkCase2(
  program: Program,
  _userId: UUID,
  applications: Application[]
): DuplicateCheckResult | null {
  // 학교 프로그램인 경우에만 체크
  if (program.category !== 'school') {
    return null
  }

  // 현재 프로그램의 학교 정보 확인
  if (!program.schoolId) {
    return null
  }

  const school = schoolService.getByIdSync(program.schoolId)
  if (!school) {
    return null
  }

  // 동일한 학교에서의 신청 이력 확인
  // TODO: 실제로는 프로그램의 학교 정보와 신청 이력의 학교 정보를 비교해야 함
  // 현재는 mockApplications에서 programId로 찾아서 학교 정보를 추론
  const schoolPrograms = applications.filter(app => {
    // 같은 학교 프로그램인지 확인 (실제로는 프로그램의 schoolId를 비교해야 함)
    // 임시로 동일한 프로그램 카테고리가 학교인 것들만 체크
    return app.subjectType === 'school' && app.status !== 'cancelled'
  })

  if (schoolPrograms.length > 0) {
    // 기존 신청 정보 포맷팅
    const existingApp = schoolPrograms[0]
    const programStartDate = dayjs(program.startDate).format('MM.DD')
    const targetLevel = program.targetLevel
      ? { elementary: '초등학교', middle: '중학교', high: '고등학교' }[program.targetLevel] || ''
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
  // Case 1 체크 (우선순위 높음)
  const case1Result = checkCase1(program.id, userId, applications)
  if (case1Result) {
    return case1Result
  }

  // Case 2 체크
  const case2Result = checkCase2(program, userId, applications)
  if (case2Result) {
    return case2Result
  }

  return {
    isDuplicate: false,
  }
}
