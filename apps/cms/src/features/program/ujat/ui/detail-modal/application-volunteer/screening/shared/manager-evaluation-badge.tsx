import type { UjatManagerEvaluation } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { UJAT_MANAGER_EVALUATION_LABELS } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { EditableStatusBadge } from '@/shared/components'
import { getManagerEvaluationBadgeTone } from '@/shared/constants/editable-status-badge-tones'

export interface ManagerEvaluationBadgeProps {
  evaluation: UjatManagerEvaluation
}

export function ManagerEvaluationBadge({ evaluation }: ManagerEvaluationBadgeProps) {
  return (
    <EditableStatusBadge
      label={UJAT_MANAGER_EVALUATION_LABELS[evaluation]}
      tone={getManagerEvaluationBadgeTone(evaluation)}
    />
  )
}
