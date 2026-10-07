/**
 * 프로그램 진행 현황 위젯 (목록/대시보드)
 * Phase 4.5: 전체 프로그램 진행 현황 (상태별 집계)
 * 경로 기반 선택: /programs/general, /programs/company-school, /programs/trained-teachers
 * (및 레거시 education·economy-education URL)
 */

import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  OVERVIEW_STAGE_REFRESH_MIN_AGE_MS,
  refreshOverviewCachesOnStageChange,
  type OverviewStageProgramType,
} from '@/features/program/shared/lib/refresh-overview-on-stage-change'
import { prefetchOverviewStageList } from '@/features/program/shared/lib/prefetch-overview-stage-list'
import {
  getProgramProgressStages,
  type ProgramProgressStagesResult,
  type ProgramProgressStages,
  type ProgramOverviewStages,
} from '../api/admin-dashboard-service'
import { useGeneralProgramOverviewStages } from '@/features/program/general/hooks/use-general-program-overview-stages'
import { useCompanySchoolOverviewStages } from '@/features/program/1c-1s/api/hooks'
import { useTrainedTeacherOverviewStages } from '@/features/program/trained-teachers/api/hooks'
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
  const queryClient = useQueryClient()
  const [legacyProgress, setLegacyProgress] = useState<ProgramProgressStagesResult | null>(null)
  const [loading, setLoading] = useState(false)
  /**
   * 클릭한 카드를 URL 반영 전에 먼저 선택 표시한다.
   * react-router v7은 searchParams 갱신을 transition으로 커밋하므로, 목록 렌더가 끝날 때까지 선택 표시가 늦어진다.
   * 클릭 시점의 search와 현재 search가 같을 때만 유효 — URL이 바뀌면 자동으로 URL 값을 따른다.
   */
  const [pendingStage, setPendingStage] = useState<{ key: string; search: string } | null>(null)
  /** 7단계(비 React Query) 건수 재조회 트리거 */
  const [legacyReloadToken, setLegacyReloadToken] = useState(0)
  const legacyLoadedAtRef = useRef(0)
  const legacyLoadedTypeRef = useRef<string | null>(null)

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
    const status = new URLSearchParams(location.search).get('status')
    if (status === 'recruiting_instructors') return 'instructorRecruitment'
    if (status === 'recruiting_students') return 'studentRecruitment'
    if (p === '/programs/education/student-recruitment' || p === '/programs/general/student-recruitment')
      return 'studentRecruitment'
    return 'total'
  }, [location.pathname, location.search])

  const selectedStatus = useMemo<string | null>(() => {
    if (selectedFromPath !== null) return null
    if (pendingStage && pendingStage.search === location.search) {
      return pendingStage.key === 'total' ? null : pendingStage.key
    }
    const sp = new URLSearchParams(location.search)
    return sp.get('status') || null
  }, [location.search, selectedFromPath, pendingStage])

  const generalOverviewQuery = useGeneralProgramOverviewStages(programType === 'general')
  const companySchoolOverviewQuery = useCompanySchoolOverviewStages(
    programType === 'company_school'
  )
  const trainedTeacherOverviewQuery = useTrainedTeacherOverviewStages(
    programType === 'trained_teachers'
  )

  useEffect(() => {
    if (
      programType === 'general' ||
      programType === 'company_school' ||
      programType === 'trained_teachers'
    ) {
      return
    }

    const isBackgroundReload = legacyLoadedTypeRef.current === programType
    const loadData = async () => {
      if (!isBackgroundReload) setLoading(true)
      try {
        const data = await getProgramProgressStages({
          programType:
            programType === 'all'
              ? undefined
              : programType,
        })
        setLegacyProgress(data)
        legacyLoadedAtRef.current = Date.now()
        legacyLoadedTypeRef.current = programType
      } catch (error) {
        handleError(error, { defaultMessage: MESSAGES.error.programProgressLoadFailed })
      } finally {
        if (!isBackgroundReload) setLoading(false)
      }
    }
    loadData()
  }, [programType, legacyReloadToken])

  /** 4카드(일반·1사1교·교육받은 교사) 건수 쿼리 — 7단계 레거시 경로면 null */
  const overviewQuery =
    programType === 'general'
      ? generalOverviewQuery
      : programType === 'company_school'
        ? companySchoolOverviewQuery
        : programType === 'trained_teachers'
          ? trainedTeacherOverviewQuery
          : null
  const overviewStageProgramType: OverviewStageProgramType | null =
    overviewQuery != null ? (programType as OverviewStageProgramType) : null

  const overviewError = overviewQuery?.isError ? overviewQuery.error : null
  useEffect(() => {
    if (overviewError == null) return
    handleError(overviewError, { defaultMessage: MESSAGES.error.programProgressLoadFailed })
  }, [overviewError])

  // 단계 이동마다 건수를 재조회하므로, 재조회 실패 시에도 직전 건수를 유지한다 (위젯이 사라졌다 나타나는 점프 방지)
  const overviewData = overviewQuery?.data
  const overviewProgress = useMemo<ProgramOverviewStages | null>(() => {
    if (!overviewData) return null
    return {
      total: overviewData.total,
      scheduled: overviewData.scheduled,
      inProgress: overviewData.inProgress,
      completed: overviewData.completed,
    }
  }, [overviewData])

  const progress: ProgramProgressStagesResult | null =
    overviewQuery != null ? overviewProgress : legacyProgress

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

  const handleStageIntent = useCallback(
    (key: string) => {
      if (overviewStageProgramType == null) return
      if (stages.some(stage => stage.key === key && stage.isSelected)) return
      prefetchOverviewStageList(queryClient, overviewStageProgramType, key, location.search)
    },
    [location.search, overviewStageProgramType, queryClient, stages]
  )

  const handleStageClick = (key: string) => {
    onBeforeStageChange?.()

    if (overviewStageProgramType != null) {
      refreshOverviewCachesOnStageChange(queryClient, overviewStageProgramType, {
        sameStage: stages.some(stage => stage.key === key && stage.isSelected),
      })
      setPendingStage({ key, search: location.search })
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

    if (Date.now() - legacyLoadedAtRef.current >= OVERVIEW_STAGE_REFRESH_MIN_AGE_MS) {
      setLegacyReloadToken(token => token + 1)
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
        mergeQuery('/programs/general', 'recruiting_instructors')
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
      onStageIntent={overviewStageProgramType != null ? handleStageIntent : undefined}
      loading={overviewQuery != null ? overviewQuery.isLoading : loading}
      loadingCardCount={overviewQuery != null ? 4 : 8}
    />
  )
}
