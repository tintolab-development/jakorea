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

/** 경제 교육 프로그램 전용 상태 (예정/진행 중/완료) */
export type EconomyStatusFilter = 'economy_scheduled' | 'economy_in_progress' | 'economy_completed'

export interface ProgramListQueryParams extends Record<string, string | undefined> {
  programId?: string
  category?: ProgramCategory | 'all'
  status?: ProgramLifecycleStatus | EconomyStatusFilter
}

export function useProgramListFilters(
  programs: Program[],
  user: Omit<User, 'password'> | null | undefined
) {
  const location = useLocation()
  const { params, setParam } = useQueryParams<ProgramListQueryParams>()

  // 프로그램 타입 구분 (교육/경제교육/봉사)
  const programType = useMemo<'education' | 'economy' | 'volunteer' | 'all'>(() => {
    if (location.pathname === '/programs/economy-education') return 'economy'
    if (
      location.pathname === '/programs/education' ||
      location.pathname.startsWith('/programs/education/')
    )
      return 'education'
    if (location.pathname === '/programs/volunteer') return 'volunteer'
    return 'all'
  }, [location.pathname])

  const isAdmin = user?.role === 'ADMIN'
  const isInstructor = user?.role === 'INSTRUCTOR'
  const isUserRole = isInstructor || user?.role === 'INDIVIDUAL' || user?.role === 'SCHOOL'
  const categoryTab = (params.category as ProgramCategory | 'all') || 'all'

  // 진행현황 단일 소스: URL params.status
  const isStudentRecruitmentRoute = location.pathname === '/programs/education/student-recruitment'
  const isInstructorRecruitmentRoute =
    location.pathname === '/programs/education/instructor-recruitment'
  const economyStatusValues: EconomyStatusFilter[] = [
    'economy_scheduled',
    'economy_in_progress',
    'economy_completed',
  ]

  const statusFilter = useMemo<ProgramLifecycleStatus | EconomyStatusFilter | null>(() => {
    const value = params.status as string | null
    if (programType === 'economy' && value && economyStatusValues.includes(value as EconomyStatusFilter)) {
      return value as EconomyStatusFilter
    }
    const validStatuses = new Set(programLifecycleStatusConfig.order)
    if (value && (value === 'education_before_textbook' || validStatuses.has(value as ProgramLifecycleStatus))) {
      return value === 'education_before_textbook' ? 'matching_completed' : (value as ProgramLifecycleStatus)
    }
    if (isStudentRecruitmentRoute) return 'recruiting_students'
    if (isInstructorRecruitmentRoute) return 'recruiting_instructors'
    return null
  }, [params.status, programType, isStudentRecruitmentRoute, isInstructorRecruitmentRoute])

  const filteredPrograms = useMemo(() => {
    let filtered: Program[]

    if (isAdmin && programType === 'economy') {
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

    // 경제 교육: 4단계 필터
    if (programType === 'economy' && statusFilter) {
      const s = statusFilter as EconomyStatusFilter
      if (s === 'economy_scheduled') {
        filtered = filtered.filter(program =>
          ['recruiting_students', 'recruiting_instructors', 'matching_completed', 'education_before_textbook'].includes(
            program.lifecycleStatus || ''
          )
        )
      } else if (s === 'economy_in_progress') {
        filtered = filtered.filter(
          program => program.lifecycleStatus === 'education_after_textbook'
        )
      } else if (s === 'economy_completed') {
        filtered = filtered.filter(program =>
          ['education_completed', 'document_processing_completed'].includes(
            program.lifecycleStatus || ''
          )
        )
      }
    }

    // status 쿼리 파라미터 필터링
    if (programType !== 'economy' && statusFilter) {
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

  const economyStages = useMemo(() => {
    if (programType !== 'economy') return []
    const economyPrograms = getEconomyPrograms()
    const scheduled = economyPrograms.filter(p =>
      ['recruiting_students', 'recruiting_instructors', 'matching_completed', 'education_before_textbook'].includes(
        p.lifecycleStatus || ''
      )
    ).length
    const inProgress = economyPrograms.filter(
      p => p.lifecycleStatus === 'education_after_textbook'
    ).length
    const completed = economyPrograms.filter(p =>
      ['education_completed', 'document_processing_completed'].includes(
        p.lifecycleStatus || ''
      )
    ).length
    const total = economyPrograms.length
    const s = statusFilter as EconomyStatusFilter | null
    
    return [
      {
        key: 'total',
        label: '전체 프로그램',
        count: total,
        showArrowAfter: true,
        isSelected: !s || !economyStatusValues.includes(s),
      },
      {
        key: 'economy_scheduled',
        label: '예정 프로그램',
        count: scheduled,
        showArrowAfter: true,
        isSelected: s === 'economy_scheduled',
      },
      {
        key: 'economy_in_progress',
        label: '진행 중인 프로그램',
        count: inProgress,
        showArrowAfter: true,
        isSelected: s === 'economy_in_progress',
      },
      {
        key: 'economy_completed',
        label: '완료 프로그램',
        count: completed,
        showArrowAfter: false,
        isSelected: s === 'economy_completed',
      },
    ]
  }, [statusFilter, programType, economyStatusValues])

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
    economyStages,
    categoryTab,
    handleCategoryTabChange,
    params,
    setParam,
  }
}
