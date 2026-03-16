/**
 * 프로그램 상세 페이지용 진행 현황 위젯 (단일 프로그램)
 * 가로형 스텝바(원 42px + 막대 4px), lifecycleStatus와 동기화
 */

import { useState, useEffect, useMemo } from 'react'
import {
  getProgramProgressStagesByProgramId,
  type ProgramProgressStages,
} from '../api/admin-dashboard-service'
import {
  PROGRAM_PROGRESS_STAGE_LABELS,
  PROGRAM_PROGRESS_STAGE_ORDER,
  type ProgramProgressStageKey,
} from '@/shared/config/program-progress-stages'
import type { ProgramLifecycleStatus } from '@/types/domain'
import {
  ProgressStepBar,
  type ProgressStepBarItem,
  type StepStatus,
} from '@/features/dashboard/ui/progress-step-bar'
import './program-detail-progress-widget.css'

/** lifecycleStatus → 6단계 인덱스 (0~5). 없으면 -1 (전부 대기) */
function getCurrentStageIndex(status: ProgramLifecycleStatus | null | undefined): number {
  if (!status) return -1
  switch (status) {
    case 'recruiting_students':
      return 0
    case 'recruiting_instructors':
      return 1
    case 'matching_completed':
    case 'education_before_textbook':
      return 2
    case 'education_after_textbook':
      return 3
    case 'education_completed':
      return 4
    case 'document_processing_completed':
      return 5
    default:
      return -1
  }
}

interface ProgramDetailProgressWidgetProps {
  programId: string
  currentLifecycleStatus?: ProgramLifecycleStatus | null
}

export function ProgramDetailProgressWidget({
  programId,
  currentLifecycleStatus,
}: ProgramDetailProgressWidgetProps) {
  const [_progress, setProgress] = useState<ProgramProgressStages | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const data = await getProgramProgressStagesByProgramId(programId)
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

  const stepBarStages = useMemo((): ProgressStepBarItem[] => {
    const currentIndex = getCurrentStageIndex(currentLifecycleStatus ?? null)
    const lastIndex = PROGRAM_PROGRESS_STAGE_ORDER.length - 1

    return PROGRAM_PROGRESS_STAGE_ORDER.map((stageKey: ProgramProgressStageKey, index) => {
      let status: StepStatus = 'pending'
      if (currentIndex >= 0) {
        if (index < currentIndex) status = 'completed'
        else if (index === currentIndex) {
          /* 서류 처리 완료(마지막 단계)일 때는 해당 단계도 체크(completed)로 표시 */
          status = currentIndex === lastIndex ? 'completed' : 'current'
        }
      }
      return {
        key: stageKey,
        label: PROGRAM_PROGRESS_STAGE_LABELS[stageKey],
        status,
      }
    })
  }, [currentLifecycleStatus])

  return (
    <div className="program-detail-progress-widget">
      <div className="program-detail-progress-widget__container">
        <ProgressStepBar stages={stepBarStages} loading={loading} />
      </div>
    </div>
  )
}
