/**
 * 프로그램 진행 현황 위젯 (목록/대시보드)
 * Phase 4.5: 전체 프로그램 진행 현황 (상태별 집계)
 * 경로 기반 선택: /programs/education, /programs/education/student-recruitment, /programs/education/instructor-recruitment
 *
 * 테이블과 숫자 동기화: 교육 프로그램일 때 useProgramStore.programs를 의존성에 넣어
 * 목록 페이지에서 생성/수정/삭제 후 fetchPrograms()가 호출되면 위젯도 재조회하여 건수를 맞춤.
 */

import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import {
  getProgramProgress7Stage,
  type ProgramProgress7Stage,
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
import './program-progress-widget.css'

/** 교육 프로그램 레이아웃 하위 경로인지 (위젯에서 라우팅 사용) */
const isEducationLayoutPath = (pathname: string) =>
  pathname === '/programs/education' || pathname.startsWith('/programs/education/')

/** 의존성 배열용 빈 배열 (동일 참조 유지 — programType !== 'education'일 때 불필요한 재조회 방지) */
const EMPTY_PROGRAMS: readonly unknown[] = []

interface ProgramProgressWidgetProps {
  title?: string | null
  showDetailLink?: boolean
}

export function ProgramProgressWidget({
  title: _title = '전체 프로그램 진행 현황',
  showDetailLink: _showDetailLink = true,
}: ProgramProgressWidgetProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [progress, setProgress] = useState<ProgramProgress7Stage | null>(null)
  const [loading, setLoading] = useState(false)

  // 경로 기반 선택 (교육 프로그램 레이아웃 하위일 때) — 그 외는 쿼리 status 사용
  const selectedFromPath = useMemo<
    'total' | 'studentRecruitment' | 'instructorRecruitment' | null
  >(() => {
    if (!isEducationLayoutPath(location.pathname)) return null
    if (location.pathname === '/programs/education/student-recruitment') return 'studentRecruitment'
    if (location.pathname === '/programs/education/instructor-recruitment') return 'instructorRecruitment'
    return 'total'
  }, [location.pathname])

  const selectedStatus = useMemo<ProgramLifecycleStatus | null>(() => {
    if (selectedFromPath !== null) return null
    const sp = new URLSearchParams(location.search)
    return (sp.get('status') as ProgramLifecycleStatus | null) || null
  }, [location.search, selectedFromPath])

  // 목록 페이지(교육 프로그램)와 동기화: 교육 탭에서는 교육 프로그램만 집계
  const programType = useMemo<'education' | 'volunteer' | 'all'>(() => {
    if (location.pathname === '/programs/education' || location.pathname.startsWith('/programs/education/'))
      return 'education'
    if (location.pathname === '/programs/volunteer') return 'volunteer'
    return 'all'
  }, [location.pathname])

  // 교육 프로그램일 때 목록(스토어)이 바뀌면 위젯도 재조회 — 테이블 건수와 동기화
  const programs = useProgramStore(state =>
    programType === 'education' ? state.programs : EMPTY_PROGRAMS
  )

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const data = await getProgramProgress7Stage({
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
    // programType 변경 시 + 교육 프로그램일 때 목록(생성/수정/삭제) 반영을 위해 programs 의존
  }, [programType, programs])

  const stages = useMemo((): ProgressStageItem[] => {
    if (!progress) return []

    const totalSelected =
      selectedFromPath === 'total' || (selectedFromPath === null && !selectedStatus)
    const totalItem: ProgressStageItem = {
      key: 'total',
      label: '전체 프로그램',
      count: progress.total,
      showArrowAfter: false,
      isSelected: totalSelected,
    }

    const stageItems: ProgressStageItem[] = PROGRAM_PROGRESS_STAGE_ORDER.map(
      (stageKey: ProgramProgressStageKey) => {
        const count = progress[stageKey]
        const label = PROGRAM_PROGRESS_STAGE_LABELS[stageKey]
        const showArrowAfter = STAGE_HAS_ARROW_AFTER.has(stageKey)
        const lifecycleStatus = STAGE_TO_LIFECYCLE[stageKey]

        const isSelectedByPath = selectedFromPath === stageKey
        const isSelectedByStatus =
          selectedFromPath === null && selectedStatus === lifecycleStatus

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
  }, [progress, selectedStatus, selectedFromPath])

  const handleStageClick = (key: string) => {
    if (isEducationLayoutPath(location.pathname)) {
      // 단일 소스: URL query(status 등). 위젯 클릭 = navigate, 필터 카드 조회 = setSearchParams → 동일 URL로 페이지·테이블 필터 동기화
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
    const isSelected = current === (STAGE_TO_LIFECYCLE[stageKey] ?? null)
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
      firstCardVariant="white"
      showDividerAfterFirstCard={false}
      showBottomDivider
      onStageClick={handleStageClick}
      loading={loading}
      loadingCardCount={8}
    />
  )
}
