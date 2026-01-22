/**
 * 프로그램 신청 관련 로직 커스텀 훅
 */

import { useMemo } from 'react'
import type { Program, ApplicationPath } from '@/types/domain'
import type { User } from '@/types/user'
import { mockApplications } from '@/data/mock'
import {
  isApplicationAvailable,
  getApplicationUrl,
  getApplicationUnavailableReason,
  getRemainingCapacity,
  isCapacityAlmostFull,
  isCapacityFull,
  getApplicationCountByProgram,
  getConfirmedRounds,
} from '../lib/program-helpers'
import { checkDuplicateApplication } from '@/shared/utils/duplicate-application-check'

interface UseProgramApplicationProps {
  program: Program | null
  user: Omit<User, 'password'> | null
  applicationPath?: ApplicationPath | null
}

export function useProgramApplication({
  program,
  user,
  applicationPath,
}: UseProgramApplicationProps) {
  // 현재 사용자의 역할에 따른 신청 주체 타입 결정
  // Phase 0.1.1: STUDENT → INDIVIDUAL, VOLUNTEER 제거
  const userSubjectType = useMemo(() => {
    if (!user || user.role === 'ADMIN') return undefined
    if (user.role === 'INSTRUCTOR') return 'instructor' as const
    if (user.role === 'INDIVIDUAL') return 'student' as const // 개인(참여자)는 student 타입으로 매핑
    if (user.role === 'SCHOOL') return 'school' as const
    // 하위 호환성: 기존 STUDENT, VOLUNTEER 역할 지원
    if (user.role === 'STUDENT') return 'student' as const
    if (user.role === 'VOLUNTEER') return 'volunteer' as const
    return undefined
  }, [user])

  // 신청 가능 여부 및 URL
  const applicationInfo = useMemo(() => {
    if (!program) {
      return {
        applicationAvailable: false,
        unavailableReason: null,
        applicationUrl: undefined,
      }
    }

    const eligibilitySubjectType =
      userSubjectType === 'volunteer' ? 'instructor' : userSubjectType
    const applicationAvailable = isApplicationAvailable(program, eligibilitySubjectType)
    const unavailableReason = getApplicationUnavailableReason(program, eligibilitySubjectType)
    let applicationUrl: string | undefined

    if (applicationAvailable && applicationPath && applicationPath.isActive) {
      if (applicationPath.pathType === 'google_form' && applicationPath.googleFormUrl) {
        applicationUrl = applicationPath.googleFormUrl
      } else if (applicationPath.pathType === 'internal') {
        applicationUrl = getApplicationUrl(program.id)
      }
    }

    return {
      applicationAvailable,
      unavailableReason,
      applicationUrl,
    }
  }, [program, userSubjectType, applicationPath])

  // 사용자가 이미 신청했는지 확인
  const userHasApplied = useMemo(() => {
    if (!program || !user || !userSubjectType) return false

    const subjectId = userSubjectType === 'instructor' ? user.instructorId : user.id
    if (!subjectId) return false

    return mockApplications.some(
      app =>
        app.programId === program.id &&
        app.subjectId === subjectId &&
        (app.subjectType === userSubjectType ||
          // 하위 호환성: 기존 STUDENT 역할 지원
          ((user?.role === 'STUDENT' || user?.role === 'INDIVIDUAL') && app.subjectType === 'volunteer')) &&
        app.status !== 'cancelled'
    )
  }, [program, user, userSubjectType])

  // 정원 정보 계산
  const capacityInfo = useMemo(() => {
    if (!program) {
      return {
        remainingCapacity: undefined,
        capacityFull: false,
        capacityAlmostFull: false,
      }
    }

    return {
      remainingCapacity: getRemainingCapacity(program),
      capacityFull: isCapacityFull(program),
      capacityAlmostFull: isCapacityAlmostFull(program),
    }
  }, [program])

  // 신청 수 계산
  const applicationCount = useMemo(() => {
    if (!program) return 0
    return getApplicationCountByProgram(program.id)
  }, [program])

  // 확정된 일정 (DateValue를 string으로 변환)
  const confirmedRounds = useMemo<Array<{
    id: string
    roundNumber: number
    startDate: string
    endDate: string
    capacity?: number
  }>>(() => {
    if (!program) return []
    const rounds = getConfirmedRounds(program.rounds)
    return rounds.map(round => ({
      id: round.id,
      roundNumber: round.roundNumber,
      startDate: typeof round.startDate === 'string' ? round.startDate : round.startDate.toISOString(),
      endDate: typeof round.endDate === 'string' ? round.endDate : round.endDate.toISOString(),
      capacity: round.capacity,
    }))
  }, [program])

  // 중복 신청 체크
  const checkDuplicate = (program: Program, userId: string) => {
    return checkDuplicateApplication(program, userId, mockApplications)
  }

  return {
    userSubjectType,
    applicationInfo,
    userHasApplied,
    capacityInfo,
    applicationCount,
    confirmedRounds,
    checkDuplicate,
  }
}
