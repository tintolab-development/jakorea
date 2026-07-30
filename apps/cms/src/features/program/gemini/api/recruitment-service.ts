/**
 * Gemini 찾아가는 연수 모집 공고 서비스 — mock/localStorage + remote hybrid
 */

import type { GeminiRecruitmentAddFormSnapshot } from '../lib/recruitment/add-local-save'
import {
  deleteGeminiRecruitmentRows,
  getGeminiRecruitmentRowsSnapshot,
  registerGeminiRecruitmentFromSnapshot,
  subscribeGeminiRecruitmentRows,
} from '../model/recruitment/recruitment-store'
import type { GeminiRecruitmentRow } from '../model/recruitment/types'
import { shouldUseGeminiVisitingTrainingRemoteApi } from './visiting-training/capabilities'
import {
  createGeminiRecruitment,
  deleteGeminiRecruitments,
} from './visiting-training/service'

export const geminiRecruitmentService = {
  subscribe: subscribeGeminiRecruitmentRows,
  getSnapshot: getGeminiRecruitmentRowsSnapshot,

  async register(snapshot: GeminiRecruitmentAddFormSnapshot): Promise<GeminiRecruitmentRow | { id: string }> {
    if (shouldUseGeminiVisitingTrainingRemoteApi()) {
      return createGeminiRecruitment(snapshot)
    }
    return registerGeminiRecruitmentFromSnapshot(snapshot)
  },

  async delete(ids: string[]): Promise<void> {
    if (shouldUseGeminiVisitingTrainingRemoteApi()) {
      await deleteGeminiRecruitments(ids)
      return
    }
    deleteGeminiRecruitmentRows(ids)
  },
}
