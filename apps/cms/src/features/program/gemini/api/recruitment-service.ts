/**
 * Gemini 찾아가는 연수 모집 공고 — remote API.
 * 임시저장은 DRAFT create/update. 목록 카탈로그 localStorage는 사용하지 않는다.
 */

import type { GeminiRecruitmentAddFormSnapshot } from '../lib/recruitment/add-local-save'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import { addSnapshotToInfoEditDraft } from '../model/recruitment/info-edit-draft'
import type { GeminiRecruitmentDetail } from '../model/recruitment/detail-types'
import { shouldUseGeminiVisitingTrainingRemoteApi } from './visiting-training/capabilities'
import {
  createGeminiRecruitment,
  deleteGeminiRecruitments,
  updateGeminiRecruitment,
} from './visiting-training/service'

const REMOTE_ONLY_MESSAGE =
  'Gemini 찾아가는 연수는 Admin visiting-training API를 사용하세요. mock 카탈로그는 제거되었습니다.'

export const geminiRecruitmentService = {
  async register(
    snapshot: GeminiRecruitmentAddFormSnapshot
  ): Promise<{ id: string; detail: GeminiRecruitmentDetail | null }> {
    if (shouldUseGeminiVisitingTrainingRemoteApi()) {
      return createGeminiRecruitment(snapshot)
    }
    notifyProgramApiUnavailable('gemini-recruitment-register', 'Gemini 찾아가는 연수 · 모집 공고 등록')
    throw new Error(REMOTE_ONLY_MESSAGE)
  },

  async saveDraft(
    snapshot: GeminiRecruitmentAddFormSnapshot,
    existingId?: string | null
  ): Promise<{ id: string; detail: GeminiRecruitmentDetail | null }> {
    if (!shouldUseGeminiVisitingTrainingRemoteApi()) {
      notifyProgramApiUnavailable(
        'gemini-recruitment-draft',
        'Gemini 찾아가는 연수 · 모집 공고 임시저장'
      )
      throw new Error(REMOTE_ONLY_MESSAGE)
    }
    const draftSnapshot: GeminiRecruitmentAddFormSnapshot = {
      ...snapshot,
      announcementPublished: 'unpublished',
    }
    if (existingId) {
      await updateGeminiRecruitment(existingId, addSnapshotToInfoEditDraft(draftSnapshot))
      return { id: existingId, detail: null }
    }
    return createGeminiRecruitment(draftSnapshot)
  },

  async publishExisting(
    existingId: string,
    snapshot: GeminiRecruitmentAddFormSnapshot
  ): Promise<void> {
    if (!shouldUseGeminiVisitingTrainingRemoteApi()) {
      notifyProgramApiUnavailable(
        'gemini-recruitment-publish',
        'Gemini 찾아가는 연수 · 모집 공고 등록'
      )
      throw new Error(REMOTE_ONLY_MESSAGE)
    }
    await updateGeminiRecruitment(existingId, addSnapshotToInfoEditDraft(snapshot))
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
