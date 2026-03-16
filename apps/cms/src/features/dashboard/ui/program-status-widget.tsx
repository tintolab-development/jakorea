/**
 * 프로그램 진행 현황 위젯 (목록/대시보드)
 * Phase 4.5: 전체 프로그램 진행 현황 (상태별 집계)
 * 경로 기반 선택: /programs/education, /programs/economy-education, student-recruitment, instructor-recruitment
 */

import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import {
  getProgramProgressStages,
  type ProgramProgressStagesResult,
  type ProgramProgressStages,
  type ProgramEconomyStages,
} from '../api/admin-dashboard-service'
import { useProgramStore } from '@/features/program/model/program-store'
import {
  PROGRAM_PROGRESS_STAGE_LABELS,
  PROGRAM_PROGRESS_STAGE_ORDER,
  STAGE_TO_PROGRAMS_QUERY,
  STAGE_HAS_ARROW_AFTER,
  STAGE_TO_LIFECYCLE,
  type ProgramProgressStageKey,
} from '@/shared/config/program-progress-stages'
import { handleError } from '@/shared/utils/error-handler'
import { MESSAGES } from '@/shared/constants'
import type { ProgramLifecycleStatus } from '@/types/domain'
import {
  ProgressStagesWidget,
  type ProgressStageItem,
} from '@/features/dashboard/ui/progress-stages-widget'
import './program-status-widget.css'

/** 교육/경제 교육 프로그램 레이아웃 하위 경로인지 */
const isEducationLayoutPath = (pathname: string) =>
  pathname === '/programs/education' || pathname.startsWith('/programs/education/')

const isEconomyLayoutPath = (pathname: string) => pathname === '/programs/economy-education'

/** 의존성 배열용 빈 배열 */
const EMPTY_PROGRAMS: readonly unknown[] = []

interface ProgramStatusWidgetProps {
  title?: string | null
  showDetailLink?: boolean
}

export function ProgramStatusWidget({
  title: _title = '전체 프로그램 진행 현황',
  showDetailLink: _showDetailLink = true,
}: ProgramStatusWidgetProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [progress, setProgress] = useState<ProgramProgressStagesResult | null>(null)
  const [loading, setLoading] = useState(false)

  const programType = useMemo<'education' | 'economy' | 'volunteer' | 'all'>(() => {
    if (isEducationLayoutPath(location.pathname)) return 'education'
    if (isEconomyLayoutPath(location.pathname)) return 'economy'
    if (location.pathname === '/programs/volunteer') return 'volunteer'
    return 'all'
  }, [location.pathname])

  // 경로 기반 선택 (교육 프로그램 레이아웃 하위일 때)
  const selectedFromPath = useMemo<
    'total' | 'studentRecruitment' | 'instructorRecruitment' | null
  >(() => {
    if (!isEducationLayoutPath(location.pathname)) return null
    if (location.pathname === '/programs/education/student-recruitment') return 'studentRecruitment'
    if (location.pathname === '/programs/education/instructor-recruitment')
      return 'instructorRecruitment'
    return 'total'
  }, [location.pathname])

  const selectedStatus = useMemo<string | null>(() => {
    if (selectedFromPath !== null) return null
    const sp = new URLSearchParams(location.search)
    return sp.get('status') || null
  }, [location.search, selectedFromPath])

  const programs = useProgramStore(state =>
    programType === 'education' || programType === 'economy' ? state.programs : EMPTY_PROGRAMS
  )

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const data = await getProgramProgressStages({
          programType: programType === 'all' ? undefined : programType,
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

  const stages = useMemo((): ProgressStageItem[] => {
    if (!progress) return []

    // 경제 교육 4단계 UI (Total, Scheduled, In Progress, Completed)
    if (programType === 'economy') {
      const p = progress as ProgramEconomyStages
      const s = selectedStatus
      return [
        {
          key: 'total',
          label: '전체 프로그램',
          count: p.total,
          showArrowAfter: true,
          isSelected:
            !s || !['economy_scheduled', 'economy_in_progress', 'economy_completed'].includes(s),
        },
        {
          key: 'economy_scheduled',
          label: '예정 프로그램',
          count: p.scheduled,
          showArrowAfter: true,
          isSelected: s === 'economy_scheduled',
        },
        {
          key: 'economy_in_progress',
          label: '진행 중인 프로그램',
          count: p.inProgress,
          showArrowAfter: true,
          isSelected: s === 'economy_in_progress',
        },
        {
          key: 'economy_completed',
          label: '완료 프로그램',
          count: p.completed,
          showArrowAfter: false,
          isSelected: s === 'economy_completed',
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
    if (programType === 'economy') {
      const nextParams = new URLSearchParams(searchParams)
      if (key === 'total') {
        nextParams.delete('status')
      } else {
        nextParams.set('status', key)
      }
      setSearchParams(nextParams, { replace: true })
      return
    }

    if (isEducationLayoutPath(location.pathname)) {
      const mergeQuery = (path: string, statusValue: string | null) => {
        const next = new URLSearchParams(searchParams)
        if (statusValue) next.set('status', statusValue)
        else next.delete('status')
        const query = next.toString()
        navigate(`${path}${query ? `?${query}` : ''}`, { replace: true })
      }
      if (key === 'total') {
        mergeQuery('/programs/education', null)
        return
      }
      if (key === 'studentRecruitment') {
        mergeQuery('/programs/education/student-recruitment', 'recruiting_students')
        return
      }
      if (key === 'instructorRecruitment') {
        mergeQuery('/programs/education/instructor-recruitment', 'recruiting_instructors')
        return
      }
      const stageKey = key as ProgramProgressStageKey
      const value = STAGE_TO_PROGRAMS_QUERY[stageKey]?.value
      if (value) mergeQuery('/programs/education', value)
      return
    }

    const nextParams = new URLSearchParams(searchParams)
    if (key === 'total') {
      nextParams.delete('status')
      setSearchParams(nextParams, { replace: false })
      return
    }
    const stageKey = key as ProgramProgressStageKey
    const current = nextParams.get('status') as ProgramLifecycleStatus | null
    const isSelected =
      current === (STAGE_TO_LIFECYCLE[stageKey] ?? null) ||
      (stageKey === 'matchingCompleted' && current === 'education_before_textbook')
    if (isSelected) {
      nextParams.delete('status')
    } else {
      const value = STAGE_TO_PROGRAMS_QUERY[stageKey]?.value
      if (value) nextParams.set('status', value)
    }
    setSearchParams(nextParams, { replace: false })
  }

  return (
    <ProgressStagesWidget
      stages={stages}
      firstCardVariant={'white'}
      showDividerAfterFirstCard={false}
      showBottomDivider
      onStageClick={handleStageClick}
      loading={loading}
      loadingCardCount={programType === 'economy' ? 4 : 8}
    />
  )
}
