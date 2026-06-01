import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { programLifecycleStatusConfig } from '@/shared/constants/status'
import {
  getVolunteerPrograms,
  getEducationPrograms,
  getEconomyPrograms,
} from '@/data/mock'
import type { Program, ProgramLifecycleStatus, ProgramCategory } from '@/types/domain'
import type { User } from '@/types/user'

/** 개요형 목록 전용 상태 (예정/진행 중/완료) */
export type OverviewStatusFilter = 'scheduled' | 'in_progress' | 'completed'

export interface ProgramListQueryParams extends Record<string, string | undefined> {
  programId?: string
  category?: ProgramCategory | 'all'
  status?:
    | ProgramLifecycleStatus
    | OverviewStatusFilter
    | 'economy_scheduled'
    | 'economy_in_progress'
    | 'economy_completed'
}

const OVERVIEW_STATUS_VALUES: readonly OverviewStatusFilter[] = ['scheduled', 'in_progress', 'completed']

export function useProgramListFilters(
  programs: Program[],
  user: Omit<User, 'password'> | null | undefined
) {
  const location = useLocation()
  const { params, setParam } = useQueryParams<ProgramListQueryParams>()

  // 프로그램 타입 구분 (교육/경제교육/봉사)
  const programType = useMemo<'education' | 'company_school' | 'volunteer' | 'all'>(() => {
    const p = location.pathname.replace(/\/$/, '') || '/'
    if (p === '/programs/economy-education' || p.startsWith('/programs/economy-education/'))
      return 'company_school'
    if (p === '/programs/company-school' || p.startsWith('/programs/company-school/'))
      return 'company_school'
    if (p === '/programs/education' || p.startsWith('/programs/education/')) return 'education'
    if (p === '/programs/general' || p.startsWith('/programs/general/')) return 'education'
    if (p === '/programs/volunteer') return 'volunteer'
    return 'all'
  }, [location.pathname])

  const isAdmin = user?.role === 'ADMIN'
  const isInstructor = user?.role === 'INSTRUCTOR'
  const isUserRole = isInstructor || user?.role === 'INDIVIDUAL' || user?.role === 'SCHOOL'
  const categoryTab = (params.category as ProgramCategory | 'all') || 'all'

  // 진행현황 단일 소스: URL params.status
  const p = location.pathname.replace(/\/$/, '') || '/'
  const isStudentRecruitmentRoute =
    p === '/programs/education/student-recruitment' ||
    p === '/programs/general/student-recruitment' ||
    p === '/programs/company-school/student-recruitment' ||
    p === '/programs/economy-education/student-recruitment'
  const isInstructorRecruitmentRoute =
    p === '/programs/education/instructor-recruitment' ||
    p === '/programs/general/instructor-recruitment' ||
    p === '/programs/company-school/instructor-recruitment' ||
    p === '/programs/economy-education/instructor-recruitment'
  const statusFilter = useMemo<ProgramLifecycleStatus | OverviewStatusFilter | null>(() => {
    const value = params.status as string | null
    if (
      programType === 'company_school' &&
      value &&
      (OVERVIEW_STATUS_VALUES as readonly string[]).includes(value)
    ) {
      return value as OverviewStatusFilter
    }
    if (programType === 'company_school' && value === 'economy_scheduled') return 'scheduled'
    if (programType === 'company_school' && value === 'economy_in_progress') return 'in_progress'
    if (programType === 'company_school' && value === 'economy_completed') return 'completed'
    if (programType === 'education' && value === 'economy_scheduled') return 'scheduled'
    if (programType === 'education' && value === 'economy_in_progress') return 'in_progress'
    if (programType === 'education' && value === 'economy_completed') return 'completed'
    if (
      programType === 'education' &&
      value &&
      (OVERVIEW_STATUS_VALUES as readonly string[]).includes(value)
    ) {
      return value as OverviewStatusFilter
    }
    const validStatuses = new Set(programLifecycleStatusConfig.order)
    if (value && (value === 'education_before_textbook' || validStatuses.has(value as ProgramLifecycleStatus))) {
      return value === 'education_before_textbook' ? 'matching_completed' : (value as ProgramLifecycleStatus)
    }
    if (isStudentRecruitmentRoute) return 'recruiting_students'
    if (isInstructorRecruitmentRoute) return 'recruiting_instructors'
    return null
  }, [
    params.status,
    programType,
    isStudentRecruitmentRoute,
    isInstructorRecruitmentRoute,
  ])

  const filteredPrograms = useMemo(() => {
    let filtered: Program[]

    if (isAdmin && programType === 'company_school') {
      filtered = getEconomyPrograms()
    } else if (isAdmin && programType === 'education') {
      filtered = getEducationPrograms()
    } else {
      filtered = programs
    }

    // 관리자용: 봉사 프로그램 필터링
    if (isAdmin && programType === 'volunteer') {
      const volunteerPrograms = getVolunteerPrograms()
      const volunteerProgramIds = new Set(volunteerPrograms.map(p => p.id))
      filtered = filtered.filter(program => volunteerProgramIds.has(program.id))
    }

    // 1사1교: 4단계 필터
    if (programType === 'company_school' && statusFilter) {
      const s = statusFilter as OverviewStatusFilter
      if (s === 'scheduled') {
        filtered = filtered.filter(program =>
          ['recruiting_students', 'recruiting_instructors', 'matching_completed', 'education_before_textbook'].includes(
            program.lifecycleStatus || ''
          )
        )
      } else if (s === 'in_progress') {
        filtered = filtered.filter(
          program => program.lifecycleStatus === 'education_after_textbook'
        )
      } else if (s === 'completed') {
        filtered = filtered.filter(program =>
          ['education_completed', 'document_processing_completed'].includes(
            program.lifecycleStatus || ''
          )
        )
      }
    }

    // status 쿼리 파라미터 필터링
    if (programType !== 'company_school' && statusFilter) {
      const s = statusFilter as ProgramLifecycleStatus
      if (s === 'matching_completed') {
        filtered = filtered.filter(
          program =>
            program.lifecycleStatus === 'matching_completed' ||
            program.lifecycleStatus === 'education_before_textbook'
        )
      } else if (s === 'education_after_textbook') {
        filtered = filtered.filter(
          program => program.lifecycleStatus === 'education_after_textbook'
        )
      } else {
        filtered = filtered.filter(program => program.lifecycleStatus === s)
      }
    }

    // 강사용일 경우 신청 가능한 프로그램 및 진행 단계 프로그램 표시
    if (isUserRole && !isAdmin) {
      filtered = filtered.filter(program => {
        const status = program.lifecycleStatus
        if (!status) return false
        const available: ProgramLifecycleStatus[] = [
          'recruiting_students',
          'recruiting_instructors',
          'matching_completed',
          'education_before_textbook',
          'education_after_textbook',
          'education_completed',
          'document_processing_completed',
        ]
        return available.includes(status)
      })
    }

    // 카테고리 필터 (강사용)
    if (isUserRole && categoryTab !== 'all') {
      filtered = filtered.filter(program => program.category === categoryTab)
    }

    return filtered
  }, [programs, isUserRole, isAdmin, categoryTab, statusFilter, programType])

  const handleCategoryTabChange = (category: ProgramCategory | 'all') => {
    if (category === 'all') {
      setParam('category', null)
    } else {
      setParam('category', category)
    }
  }

  return {
    programType,
    statusFilter,
    filteredPrograms,
    categoryTab,
    handleCategoryTabChange,
    params,
    setParam,
  }
}
