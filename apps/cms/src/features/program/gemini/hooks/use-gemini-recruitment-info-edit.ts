import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import {
  applyInfoEditDraft,
  detailToInfoEditDraft,
  type GeminiRecruitmentInfoEditDraft,
} from '../model/recruitment/info-edit-draft'
import type { GeminiRecruitmentDetail } from '../model/recruitment/detail-types'
import { getRecruitmentDetailById, patchRecruitmentDetail } from '../model/recruitment/detail-mock'
import { shouldUseGeminiVisitingTrainingRemoteApi } from '../api/visiting-training/capabilities'
import { useGeminiRecruitmentDetailQuery } from '../api/visiting-training/hooks'
import { geminiVisitingTrainingQueryKeys } from '../api/visiting-training/query-keys'
import { updateGeminiRecruitment } from '../api/visiting-training/service'
import {
  GEMINI_RECRUITMENT_EDIT_INFO_VALUE,
  GEMINI_RECRUITMENT_EDIT_PARAM,
  GEMINI_RECRUITMENT_ID_PARAM,
  GEMINI_RECRUITMENT_LNB_PARAM,
  parseGeminiRecruitmentDetailLnb,
} from '../lib/recruitment/detail-url'

export function useGeminiRecruitmentInfoEdit(
  recruitmentId: string | null,
  todayKey: string
) {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeLnb = parseGeminiRecruitmentDetailLnb(searchParams.get(GEMINI_RECRUITMENT_LNB_PARAM))
  const editTab = searchParams.get(GEMINI_RECRUITMENT_EDIT_PARAM)
  const [detailVersion, setDetailVersion] = useState(0)
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  const remoteDetailQuery = useGeminiRecruitmentDetailQuery(
    recruitmentId ?? undefined,
    remoteEnabled && Boolean(recruitmentId)
  )

  const detail = useMemo(() => {
    if (!recruitmentId) return null
    if (remoteEnabled) return remoteDetailQuery.data ?? null
    return getRecruitmentDetailById(recruitmentId, dayjs(todayKey))
  }, [
    recruitmentId,
    todayKey,
    detailVersion,
    remoteEnabled,
    remoteDetailQuery.data,
  ])

  const isEditMode =
    Boolean(recruitmentId) &&
    activeLnb === 'info' &&
    editTab === GEMINI_RECRUITMENT_EDIT_INFO_VALUE &&
    detail != null

  const [draft, setDraft] = useState<GeminiRecruitmentInfoEditDraft | null>(null)

  const resetDraftFromDetail = useCallback(() => {
    if (detail == null) {
      setDraft(null)
      return
    }
    setDraft(detailToInfoEditDraft(detail))
  }, [detail])

  useEffect(() => {
    if (!isEditMode) {
      setDraft(null)
      return
    }
    resetDraftFromDetail()
  }, [isEditMode, resetDraftFromDetail])

  const additionalContentSource =
    isEditMode && draft != null
      ? draft.additionalContentMarkdown
      : detail?.additionalContentMarkdown ?? ''

  const { editor, editorMinHeight, getMarkdown } = useNoticeWysiwygEditor(
    isEditMode && detail != null,
    additionalContentSource,
    `gemini-recruitment-info-edit-${recruitmentId ?? 'none'}-${isEditMode ? 'edit' : 'view'}`,
    {
      placeholder: '내용을 작성하세요',
    }
  )

  const setEditMode = useCallback(
    (enabled: boolean) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (enabled) {
            next.set(GEMINI_RECRUITMENT_EDIT_PARAM, GEMINI_RECRUITMENT_EDIT_INFO_VALUE)
          } else {
            next.delete(GEMINI_RECRUITMENT_EDIT_PARAM)
          }
          if (recruitmentId) {
            next.set(GEMINI_RECRUITMENT_ID_PARAM, recruitmentId)
          }
          return next
        },
        { replace: true }
      )
    },
    [recruitmentId, setSearchParams]
  )

  const handleEdit = useCallback(() => {
    if (detail == null) return
    resetDraftFromDetail()
    setEditMode(true)
  }, [detail, resetDraftFromDetail, setEditMode])

  const handleSave = useCallback(async () => {
    if (detail == null || draft == null || !recruitmentId) return
    const nextDraft: GeminiRecruitmentInfoEditDraft = {
      ...draft,
      additionalContentMarkdown: getMarkdown() || draft.additionalContentMarkdown,
    }
    if (remoteEnabled) {
      await updateGeminiRecruitment(recruitmentId, nextDraft)
      await queryClient.invalidateQueries({
        queryKey: geminiVisitingTrainingQueryKeys.recruitmentDetail(recruitmentId),
      })
      await queryClient.invalidateQueries({
        queryKey: geminiVisitingTrainingQueryKeys.recruitmentList(),
      })
    } else {
      const nextDetail = applyInfoEditDraft(detail, nextDraft)
      patchRecruitmentDetail(detail.id, {
        ...nextDraft,
        title: nextDetail.title,
        updatedAt: nextDetail.updatedAt,
      })
      setDetailVersion(v => v + 1)
    }
    setEditMode(false)
  }, [
    detail,
    draft,
    getMarkdown,
    queryClient,
    recruitmentId,
    remoteEnabled,
    setEditMode,
  ])

  const patchDraft = useCallback((patch: Partial<GeminiRecruitmentInfoEditDraft>) => {
    setDraft(prev => (prev == null ? prev : { ...prev, ...patch }))
  }, [])

  const displayDetail = useMemo((): GeminiRecruitmentDetail | null => {
    if (detail == null) return null
    if (!isEditMode || draft == null) return detail
    return applyInfoEditDraft(detail, draft)
  }, [detail, draft, isEditMode])

  return {
    detail,
    displayDetail,
    isEditMode,
    draft,
    patchDraft,
    handleEdit,
    handleSave,
    editor,
    editorMinHeight,
    remoteEnabled,
    isDetailFetching: remoteEnabled ? remoteDetailQuery.isFetching : false,
    isDetailError: remoteEnabled ? remoteDetailQuery.isError : false,
  }
}
