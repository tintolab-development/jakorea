/**
 * Gemini 승인 연수 — remote API. mock 카탈로그 삭제 없음.
 */

import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import { shouldUseGeminiVisitingTrainingRemoteApi } from './visiting-training/capabilities'
import {
  deleteGeminiApprovedTrainings,
  type GeminiApprovedTrainingsDeleteResult,
} from './visiting-training/service'

const REMOTE_ONLY_MESSAGE =
  'Gemini 승인 연수는 Admin visiting-training API를 사용하세요. mock 카탈로그는 제거되었습니다.'

export const geminiApprovedTrainingService = {
  async delete(ids: string[]): Promise<GeminiApprovedTrainingsDeleteResult> {
    if (shouldUseGeminiVisitingTrainingRemoteApi()) {
      return deleteGeminiApprovedTrainings(ids)
    }
    notifyProgramApiUnavailable(
      'gemini-approved-training-delete',
      'Gemini 찾아가는 연수 · 승인 연수 삭제'
    )
    throw new Error(REMOTE_ONLY_MESSAGE)
  },
}
