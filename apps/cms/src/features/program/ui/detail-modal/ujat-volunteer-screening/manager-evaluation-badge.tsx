import type { UjatManagerEvaluation } from '@/features/program/model/ujat-volunteer-screening-constants'
import { UJAT_MANAGER_EVALUATION_LABELS } from '@/features/program/model/ujat-volunteer-screening-constants'
import './manager-evaluation-badge.css'

export interface ManagerEvaluationBadgeProps {
  evaluation: UjatManagerEvaluation
}

export function ManagerEvaluationBadge({ evaluation }: ManagerEvaluationBadgeProps) {
  return (
    <span
      className={`ujat-manager-evaluation-badge ujat-manager-evaluation-badge--${evaluation}`}
    >
      {UJAT_MANAGER_EVALUATION_LABELS[evaluation]}
    </span>
  )
}
