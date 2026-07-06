/**
 * Gemini 찾아가는 연수 모집 공고 서비스 — mock/localStorage 구현
 * TODO(api): GeminiRecruitmentListResponse 연동 시 교체
 */

import type { GeminiRecruitmentAddFormSnapshot } from '../lib/recruitment/add-local-save'
import {
  deleteGeminiRecruitmentRows,
  getGeminiRecruitmentRowsSnapshot,
  registerGeminiRecruitmentFromSnapshot,
  subscribeGeminiRecruitmentRows,
} from '../model/recruitment/recruitment-store'
import type { GeminiRecruitmentRow } from '../model/recruitment/types'

export const geminiRecruitmentService = {
  subscribe: subscribeGeminiRecruitmentRows,
  getSnapshot: getGeminiRecruitmentRowsSnapshot,

  register(snapshot: GeminiRecruitmentAddFormSnapshot): GeminiRecruitmentRow {
    return registerGeminiRecruitmentFromSnapshot(snapshot)
  },

  delete(ids: string[]): void {
    deleteGeminiRecruitmentRows(ids)
  },
}
