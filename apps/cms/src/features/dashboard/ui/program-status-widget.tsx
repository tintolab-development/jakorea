/**
 * 프로그램 진행 현황 위젯 (목록/대시보드)
 * Phase 4.5: 전체 프로그램 진행 현황 (상태별 집계)
 * 경로 기반 선택: /programs/general, /programs/company-school, /programs/trained-teachers
 * (및 레거시 education·economy-education URL)
 */

import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import {
  getProgramProgressStages,
  type ProgramProgressStagesResult,
  type ProgramProgressStages,
  type ProgramOverviewStages,
} from '../api/admin-dashboard-service'
import { useProgramStore } from '@/features/program/general/model/program-store'
import { useGeneralProgramOverviewStages } from '@/features/program/general/hooks/use-general-program-overview-stages'
import { useCompanySchoolOverviewStages } from '@/features/program/1c-1s/api/hooks'
import {
  PROGRAM_PROGRESS_STAGE_LABELS,
  PROGRAM_PROGRESS_STAGE_ORDER,
  STAGE_TO_PROGRAMS_QUERY,
  STAGE_HAS_ARROW_AFTER,
  STAGE_TO_LIFECYCLE,
  type ProgramProgressStageKey,
} from '@/shared/config/program-progress-stages'
import { MESSAGES } from '@/shared/constants'
import { handleError } from '@/shared/utils/error-handler'
import type { ProgramLifecycleStatus } from '@/types/domain'
import {
  ProgressStagesWidget,
  type ProgressStageItem,
} from '@/features/dashboard/ui/progress-stages-widget'
import './program-status-widget.css'
/** `/programs/general` 루트 — 4카드(예정/진행/완료) 목록 */
const isGeneralProgramListRoot = (pathname: string) => {
  const p = pathname.replace(/\/$/, '') || '/'
  return p === '/programs/general'
}

/** 레거시 education·general 하위(모집 등) — 7단계 위젯 */
const isEducationLayoutPath = (pathname: string) => {
  const p = pathname.replace(/\/$/, '') || '/'
  if (isGeneralProgramListRoot(pathname)) return false
  return (
    p === '/programs/education' ||
    p.startsWith('/programs/education/') ||
    p.startsWith('/programs/general/')
  )
}

const isCompanySchoolLayoutPath = (pathname: string) => {
  const p = pathname.replace(/\/$/, '') || '/'
  return (
    p === '/programs/economy-education' ||
    p === '/programs/company-school' ||
    p.startsWith('/programs/company-school/')
  )
}

const isTrainedTeachersLayoutPath = (pathname: string) => {
  const p = pathname.replace(/\/$/, '') || '/'
  return p === '/programs/trained-teachers' || p.startsWith('/programs/trained-teachers/')
}

/** 의존성 배열용 빈 배열 */
const EMPTY_PROGRAMS: readonly unknown[] = []

interface ProgramStatusWidgetProps {
  title?: string | null
  showDetailLink?: boolean
  /** 상태 카드 클릭 직전 호출 (일반 프로그램 상세 URL 정리 등) */
  onBeforeStageChange?: () => void
}

export function ProgramStatusWidget({
  title: _title = '전체 프로그램 진행 현황',
  showDetailLink: _showDetailLink = true,
  onBeforeStageChange,
}: ProgramStatusWidgetProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [, setSearchParams] = useSearchParams()
  const [progress, setProgress] = useState<ProgramProgressStagesResult | null>(null)
  const [loading, setLoading] = useState(false)

  const programType = useMemo<
    'education' | 'company_school' | 'general' | 'trained_teachers' | 'volunteer' | 'all'
  >(() => {
    if (isGeneralProgramListRoot(location.pathname)) return 'general'
    if (isEducationLayoutPath(location.pathname)) return 'education'
    if (isCompanySchoolLayoutPath(location.pathname)) return 'company_school'
    if (isTrainedTeachersLayoutPath(location.pathname)) return 'trained_teachers'
    if (location.pathname === '/programs/volunteer') return 'volunteer'
    return 'all'
  }, [location.pathname])

  // 경로 기반 선택 (교육 프로그램 레이아웃 하위일 때)
  const selectedFromPath = useMemo<
    'total' | 'studentRecruitment' | 'instructorRecruitment' | null
  >(() => {
    if (!isEducationLayoutPath(location.pathname)) return null
    const p = location.pathname.replace(/\/$/, '') || '/'
    if (p === '/programs/education/student-recruitment' || p === '/programs/general/student-recruitment')
      return 'studentRecruitment'
    if (
      p === '/programs/education/instructor-recruitment' ||
      p === '/programs/general/instructor-recruitment'
    )
      return 'instructorRecruitment'
    return 'total'
  }, [location.pathname])

  const selectedStatus = useMemo<string | null>(() => {
    if (selectedFromPath !== null) return null
    const sp = new URLSearchParams(location.search)
    return sp.get('status') || null
  }, [location.search, selectedFromPath])

  const programs = useProgramStore(state =>
    programType === 'education' ||
    programType === 'trained_teachers'
      ? state.programs
      : EMPTY_PROGRAMS
  )

  const generalOverviewQuery = useGeneralProgramOverviewStages(programType === 'general')
  const companySchoolOverviewQuery = useCompanySchoolOverviewStages(
    programType === 'company_school'
  )

  useEffect(() => {
    if (programType === 'general' || programType === 'company_school') return

    const loadData = async () => {
      setLoading(true)
      try {
        const data = await getProgramProgressStages({
          programType:
            programType === 'all'
              ? undefined
              : programType,
        })
        setProgress(data)
      } catch (error) {
        handleError(error, { defaultMessage: MESSAGES.error.programProgressLoadFailed })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [programType, programs])

  useEffect(() => {
    if (programType !== 'general') return
    if (generalOverviewQuery.isError) {
      handleError(generalOverviewQuery.error, {
        defaultMessage: MESSAGES.error.programProgressLoadFailed,
      })
      setProgress(null)
      return
    }
    if (!generalOverviewQuery.data) {
      setProgress(null)
      return
    }
    const d = generalOverviewQuery.data
    setProgress({
      total: d.total,
      scheduled: d.scheduled,
      inProgress: d.inProgress,
      completed: d.completed,
    } satisfies ProgramOverviewStages)
  }, [
    programType,
    generalOverviewQuery.data,
    generalOverviewQuery.isError,
    generalOverviewQuery.error,
  ])

  useEffect(() => {
    if (programType !== 'company_school') return
    if (companySchoolOverviewQuery.isError) {
      handleError(companySchoolOverviewQuery.error, {
        defaultMessage: MESSAGES.error.programProgressLoadFailed,
      })
      setProgress(null)
      return
    }
    if (!companySchoolOverviewQuery.data) {
      setProgress(null)
      return
    }
    const d = companySchoolOverviewQuery.data
    setProgress({
      total: d.total,
      scheduled: d.scheduled,
      inProgress: d.inProgress,
      completed: d.completed,
    } satisfies ProgramOverviewStages)
  }, [
    programType,
    companySchoolOverviewQuery.data,
    companySchoolOverviewQuery.isError,
    companySchoolOverviewQuery.error,
  ])

  const stages = useMemo((): ProgressStageItem[] => {
    if (!progress) return []

    // 일반·1사1교·교육받은 교사 프로그램 루트 4단계 UI
    if (
      programType === 'company_school' ||
      programType === 'general' ||
      programType === 'trained_teachers'
    ) {
      const p = progress as ProgramOverviewStages
      const s = selectedStatus
      return [
        {
          key: 'total',
          label: '전체 프로그램',
          count: p.total,
          showArrowAfter: true,
          isSelected:
            !s || !['scheduled', 'in_progress', 'completed'].includes(s),
        },
        {
          key: 'scheduled',
          label: '예정 프로그램',
          count: p.scheduled,
          showArrowAfter: true,
          isSelected: s === 'scheduled',
        },
        {
          key: 'in_progress',
          label: '진행 중인 프로그램',
          count: p.inProgress,
          showArrowAfter: true,
          isSelected: s === 'in_progress',
        },
        {
          key: 'completed',
          label: '완료 프로그램',
          count: p.completed,
          showArrowAfter: false,
          isSelected: s === 'completed',
        },
      ]
    }

    // 교육/봉사 7단계 UI
    const p = progress as ProgramProgressStages
    const totalSelected =
      selectedFromPath === 'total' || (selectedFromPath === null && !selectedStatus)
    const totalItem: ProgressStageItem = {
      key: 'total',
      label: '전체 프로그램',
      count: p.total,
      showArrowAfter: false,
      isSelected: totalSelected,
    }

    const stageItems: ProgressStageItem[] = PROGRAM_PROGRESS_STAGE_ORDER.map(
      (stageKey: ProgramProgressStageKey) => {
        let count: number
        if (stageKey === 'matchingCompleted') {
          count = p.matchingCompleted + p.educationBeforeTextbook
        } else if (stageKey === 'educationAfterTextbook') {
          count = p.educationAfterTextbook
        } else {
          count = p[stageKey]
        }
        const label = PROGRAM_PROGRESS_STAGE_LABELS[stageKey]
        const showArrowAfter = STAGE_HAS_ARROW_AFTER.has(stageKey)
        const lifecycleStatus = STAGE_TO_LIFECYCLE[stageKey]

        const isSelectedByPath = selectedFromPath === stageKey
        const isSelectedByStatus =
          selectedFromPath === null &&
          (selectedStatus === lifecycleStatus ||
            (stageKey === 'matchingCompleted' && selectedStatus === 'education_before_textbook'))

        return {
          key: stageKey,
          label,
          count,
          showArrowAfter,
          isMatchingStyle: false,
          isSelected: isSelectedByPath || isSelectedByStatus,
        }
      }
    )

    return [totalItem, ...stageItems]
  }, [progress, selectedStatus, selectedFromPath, programType])

  const handleStageClick = (key: string) => {
    onBeforeStageChange?.()

    if (
      programType === 'company_school' ||
      programType === 'general' ||
      programType === 'trained_teachers'
    ) {
      setSearchParams(
        prev => {
          const nextParams = new URLSearchParams(prev)
          if (key === 'total') {
            nextParams.delete('status')
          } else {
            nextParams.set('status', key)
          }
          return nextParams
        },
        { replace: true }
      )
      return
    }

    if (isEducationLayoutPath(location.pathname)) {
      const mergeQuery = (path: string, statusValue: string | null) => {
        const next = new URLSearchParams(location.search)
        if (statusValue) next.set('status', statusValue)
        else next.delete('status')
        const query = next.toString()
        navigate(`${path}${query ? `?${query}` : ''}`, { replace: true })
      }
      if (key === 'total') {
        mergeQuery('/programs/general', null)
        return
      }
      if (key === 'studentRecruitment') {
        mergeQuery('/programs/general/student-recruitment', 'recruiting_students')
        return
      }
      if (key === 'instructorRecruitment') {
        mergeQuery('/programs/general/instructor-recruitment', 'recruiting_instructors')
        return
      }
      const stageKey = key as ProgramProgressStageKey
      const value = STAGE_TO_PROGRAMS_QUERY[stageKey]?.value
      if (value) mergeQuery('/programs/general', value)
      return
    }

    setSearchParams(
      prev => {
        const nextParams = new URLSearchParams(prev)
        if (key === 'total') {
          nextParams.delete('status')
          return nextParams
        }
        const stageKey = key as ProgramProgressStageKey
        const current = nextParams.get('status') as ProgramLifecycleStatus | null
        const isSelected = current === (STAGE_TO_LIFECYCLE[stageKey] ?? null)
        if (isSelected) {
          nextParams.delete('status')
        } else {
          const value = STAGE_TO_PROGRAMS_QUERY[stageKey]?.value
          if (value) nextParams.set('status', value)
        }
        return nextParams
      },
      { replace: false }
    )
  }

  return (
    <ProgressStagesWidget
      stages={stages}
      firstCardVariant={'white'}
      showDividerAfterFirstCard={false}
      showBottomDivider
      onStageClick={handleStageClick}
      loading={
        programType === 'general'
          ? generalOverviewQuery.isFetching
          : programType === 'company_school'
            ? companySchoolOverviewQuery.isFetching
            : loading
      }
      loadingCardCount={
        programType === 'company_school' ||
        programType === 'general' ||
        programType === 'trained_teachers'
          ? 4
          : 8
      }
    />
  )
}
