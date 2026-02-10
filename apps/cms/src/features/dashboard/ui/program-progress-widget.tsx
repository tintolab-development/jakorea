/**
 * 프로그램 진행 현황 위젯 (목록/대시보드)
 * Phase 4.5: 전체 프로그램 진행 현황 (상태별 집계)
 * FR-C01: 7단계 위젯 — 범용 ProgressStagesWidget 사용, 첫 카드 청록(전체 프로그램)
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import {
  getProgramProgress7Stage,
  type ProgramProgress7Stage,
} from '../api/admin-dashboard-service'
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

interface ProgramProgressWidgetProps {
  title?: string | null
  showDetailLink?: boolean
}

export function ProgramProgressWidget({
  title: _title = '전체 프로그램 진행 현황',
  showDetailLink: _showDetailLink = true,
}: ProgramProgressWidgetProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [progress, setProgress] = useState<ProgramProgress7Stage | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedStatus = useMemo<ProgramLifecycleStatus | null>(() => {
    const searchParams = new URLSearchParams(location.search)
    return (searchParams.get('status') as ProgramLifecycleStatus | null) || null
  }, [location.search])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const data = await getProgramProgress7Stage()
        setProgress(data)
      } catch (error) {
        handleError(error, { defaultMessage: MESSAGES.error.programProgressLoadFailed })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const stages = useMemo((): ProgressStageItem[] => {
    if (!progress) return []

    const totalItem: ProgressStageItem = {
      key: 'total',
      label: '전체 프로그램',
      count: progress.total,
      showArrowAfter: false,
      isSelected: !selectedStatus,
    }

    const stageItems: ProgressStageItem[] = PROGRAM_PROGRESS_STAGE_ORDER.flatMap(
      (stageKey: ProgramProgressStageKey) => {
        if (stageKey === 'educationBeforeTextbook') return []

        let count = progress[stageKey]
        let label = PROGRAM_PROGRESS_STAGE_LABELS[stageKey]
        const showArrowAfter = STAGE_HAS_ARROW_AFTER.has(stageKey)
        const lifecycleStatus = STAGE_TO_LIFECYCLE[stageKey]

        if (stageKey === 'matchingCompleted') {
          count = progress.matchingCompleted + progress.educationBeforeTextbook
          label = '매칭 완료 / 교재 준비 중'
        }

        const isSelected =
          selectedStatus === lifecycleStatus ||
          (stageKey === 'matchingCompleted' &&
            (selectedStatus === 'matching_completed' ||
              selectedStatus === 'education_before_textbook'))

        return [
          {
            key: stageKey,
            label,
            count,
            showArrowAfter,
            isMatchingStyle: false /* 매칭 완료 / 교재 준비 중도 기본 텍스트 스타일 */,
            isSelected,
          },
        ]
      }
    )

    return [totalItem, ...stageItems]
  }, [progress, selectedStatus])

  const handleStageClick = (key: string) => {
    const searchParams = new URLSearchParams(location.search)
    if (key === 'total') {
      searchParams.delete('status')
      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: false })
      return
    }
    const stageKey = key as ProgramProgressStageKey
    const current = searchParams.get('status')
    const isSelected =
      current === (STAGE_TO_LIFECYCLE[stageKey] ?? null) ||
      (stageKey === 'matchingCompleted' &&
        (current === 'matching_completed' || current === 'education_before_textbook'))
    if (isSelected) {
      searchParams.delete('status')
    } else {
      const value = STAGE_TO_PROGRAMS_QUERY[stageKey]?.value
      if (value) searchParams.set('status', value)
    }
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: false })
  }

  return (
    <ProgressStagesWidget
      stages={stages}
      firstCardVariant="teal"
      showDividerAfterFirstCard
      showBottomDivider
      onStageClick={handleStageClick}
      loading={loading}
      loadingCardCount={7}
    />
  )
}
