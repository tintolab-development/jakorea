/**
 * Gemini 승인 연수 서비스 — mock/localStorage 구현
 * TODO(api): 승인 연수 목록 API 연동 시 교체
 */

import {
  deleteGeminiApprovedTrainingRows,
  getGeminiApprovedTrainingRowsSnapshot,
  subscribeGeminiApprovedTrainingRows,
} from '../model/approved/approved-training-store'

export const geminiApprovedTrainingService = {
  subscribe: subscribeGeminiApprovedTrainingRows,
  getSnapshot: getGeminiApprovedTrainingRowsSnapshot,

  delete(ids: string[]): void {
    deleteGeminiApprovedTrainingRows(ids)
  },
}
