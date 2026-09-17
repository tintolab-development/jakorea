/**
 * Gemini 승인 연수 — 목록은 visiting-training API. mock 카탈로그 삭제 없음.
 */

import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import { shouldUseGeminiVisitingTrainingRemoteApi } from './visiting-training/capabilities'

const REMOTE_ONLY_MESSAGE =
  'Gemini 승인 연수는 Admin visiting-training API를 사용하세요. mock 카탈로그는 제거되었습니다.'

export const geminiApprovedTrainingService = {
  delete(_ids: string[]): void {
    void _ids
    notifyProgramApiUnavailable(
      'gemini-approved-training-delete',
      'Gemini 찾아가는 연수 · 승인 연수 삭제'
    )
    if (!shouldUseGeminiVisitingTrainingRemoteApi()) {
      throw new Error(REMOTE_ONLY_MESSAGE)
    }
    throw new Error('승인 연수 삭제 API가 아직 연동되지 않았습니다.')
  },
}
