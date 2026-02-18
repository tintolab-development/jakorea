/**
 * 프로그램 상세 페이지용 진행 현황 위젯 (단일 프로그램)
 * 범용 ProgressStagesWidget 사용, 첫 카드 흰색 배경
 */

import { useState, useEffect, useMemo } from 'react'
import {
  getProgramProgress7StageByProgramId,
  type ProgramProgress7Stage,
} from '../api/admin-dashboard-service'
import {
  PROGRAM_PROGRESS_STAGE_LABELS,
  PROGRAM_PROGRESS_STAGE_ORDER,
  type ProgramProgressStageKey,
} from '@/shared/config/program-progress-stages'
import type { ProgramLifecycleStatus } from '@/types/domain'
import {
  ProgressStagesWidget,
  type ProgressStageItem,
} from '@/features/dashboard/ui/progress-stages-widget'
import './program-progress-widget.css'
import './program-detail-progress-widget.css'

const DETAIL_STAGE_HAS_ARROW_AFTER = new Set<ProgramProgressStageKey>([
  'instructorRecruitment',
  'matchingCompleted',
  'educationAfterTextbook',
  'educationCompleted',
])

interface ProgramDetailProgressWidgetProps {
  programId: string
  currentLifecycleStatus?: ProgramLifecycleStatus | null
}

export function ProgramDetailProgressWidget({
  programId,
  currentLifecycleStatus,
}: ProgramDetailProgressWidgetProps) {
  const [progress, setProgress] = useState<ProgramProgress7Stage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const data = await getProgramProgress7StageByProgramId(programId)
        if (!cancelled) setProgress(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [programId])

  const stages = useMemo((): ProgressStageItem[] => {
    if (!progress) return []

    const isMatchingStatus = (s: ProgramLifecycleStatus) =>
      s === 'matching_completed' || s === 'education_before_textbook'
    const isEducationInProgress = (s: ProgramLifecycleStatus) =>
      s === 'education_before_textbook' || s === 'education_after_textbook'

    return PROGRAM_PROGRESS_STAGE_ORDER.map((stageKey: ProgramProgressStageKey) => {
      let count: number
      if (stageKey === 'matchingCompleted') {
        count = progress.matchingCompleted + progress.educationBeforeTextbook
      } else if (stageKey === 'educationAfterTextbook') {
        count = progress.educationBeforeTextbook + progress.educationAfterTextbook
      } else {
        count = progress[stageKey]
      }
      const label = PROGRAM_PROGRESS_STAGE_LABELS[stageKey]
      const showArrowAfter = DETAIL_STAGE_HAS_ARROW_AFTER.has(stageKey)

      const isSelected = currentLifecycleStatus
        ? currentLifecycleStatus === 'recruiting_students'
          ? stageKey === 'studentRecruitment'
          : currentLifecycleStatus === 'recruiting_instructors'
            ? stageKey === 'instructorRecruitment'
            : isMatchingStatus(currentLifecycleStatus)
              ? stageKey === 'matchingCompleted'
              : isEducationInProgress(currentLifecycleStatus)
                ? stageKey === 'educationAfterTextbook'
                : (currentLifecycleStatus === 'education_completed' &&
                    stageKey === 'educationCompleted') ||
                  (currentLifecycleStatus === 'document_processing_completed' &&
                    stageKey === 'documentProcessingCompleted')
        : false

      return {
        key: stageKey,
        label,
        count,
        showArrowAfter,
        isMatchingStyle: false,
        isSelected,
      }
    })
  }, [progress, currentLifecycleStatus])

  return (
    <ProgressStagesWidget
      stages={stages}
      firstCardVariant="white"
      showDividerAfterFirstCard={false}
      showBottomDivider={false}
      loading={loading}
      loadingCardCount={6}
      className="program-detail-progress-widget"
    />
  )
}
