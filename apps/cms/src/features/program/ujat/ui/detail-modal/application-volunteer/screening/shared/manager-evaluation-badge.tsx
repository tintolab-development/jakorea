import type { UjatManagerEvaluation } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { StatusTag } from '@/shared/components/status-tag'
import { getManagerEvaluationTag } from '@/shared/lib/status-tag-specs'

export interface ManagerEvaluationBadgeProps {
  evaluation: UjatManagerEvaluation
}

/** 담당자 서류 평가 태그 (공통 StatusTag) */
export function ManagerEvaluationBadge({ evaluation }: ManagerEvaluationBadgeProps) {
  return <StatusTag {...getManagerEvaluationTag(evaluation)} />
}
