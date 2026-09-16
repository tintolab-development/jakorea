/**
 * Gemini 찾아가는 연수 모집 공고 — remote API.
 * 폼 임시저장은 add-local-save. 목록 카탈로그 localStorage는 사용하지 않는다.
 */

import type { GeminiRecruitmentAddFormSnapshot } from '../lib/recruitment/add-local-save'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import type { GeminiRecruitmentRow } from '../model/recruitment/types'
import { shouldUseGeminiVisitingTrainingRemoteApi } from './visiting-training/capabilities'
import {
  createGeminiRecruitment,
  deleteGeminiRecruitments,
} from './visiting-training/service'

const REMOTE_ONLY_MESSAGE =
  'Gemini 찾아가는 연수는 Admin visiting-training API를 사용하세요. mock 카탈로그는 제거되었습니다.'

export const geminiRecruitmentService = {
  async register(snapshot: GeminiRecruitmentAddFormSnapshot): Promise<GeminiRecruitmentRow | { id: string }> {
    if (shouldUseGeminiVisitingTrainingRemoteApi()) {
      return createGeminiRecruitment(snapshot)
    }
    notifyProgramApiUnavailable('gemini-recruitment-register', 'Gemini 찾아가는 연수 · 모집 공고 등록')
    throw new Error(REMOTE_ONLY_MESSAGE)
  },

  async delete(ids: string[]): Promise<void> {
    if (shouldUseGeminiVisitingTrainingRemoteApi()) {
      await deleteGeminiRecruitments(ids)
      return
    }
    notifyProgramApiUnavailable('gemini-recruitment-delete', 'Gemini 찾아가는 연수 · 모집 공고 삭제')
    throw new Error(REMOTE_ONLY_MESSAGE)
  },
}
