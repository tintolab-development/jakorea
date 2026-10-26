import dayjs from 'dayjs'
import type { GeminiTrainingDateCandidate } from '@/shared/api/generated/dashboard/schemas/geminiTrainingDateCandidate'
import type { GeminiApprovedTrainingDateCandidate } from '../../model/approved/types'

/** 서버 정렬(preferenceRank 오름차순)을 그대로 유지한다. */
export function mapGeminiTrainingDateCandidates(
  candidates: GeminiTrainingDateCandidate[] | null | undefined
): GeminiApprovedTrainingDateCandidate[] {
  if (!Array.isArray(candidates)) return []
  return candidates.flatMap(candidate => {
    const trainingDate = candidate.trainingDate?.trim() ?? ''
    if (!trainingDate || candidate.preferenceRank == null) return []
    return [
      {
        preferenceRank: candidate.preferenceRank,
        trainingDate,
        trainingTimeText: candidate.trainingTimeText?.trim() ?? '',
      },
    ]
  })
}

/** `1지망 11/10 10:00~12:00(1차시) | 2지망 11/12 …` — 후보가 없으면 `-` */
export function formatTrainingDateCandidatesDisplay(
  candidates: readonly GeminiApprovedTrainingDateCandidate[]
): string {
  const segments = candidates.flatMap(candidate => {
    const date = dayjs(candidate.trainingDate)
    if (!date.isValid()) return []
    return [
      [`${candidate.preferenceRank}지망`, date.format('MM/DD'), candidate.trainingTimeText]
        .filter(Boolean)
        .join(' '),
    ]
  })
  return segments.length > 0 ? segments.join(' | ') : '-'
}
