import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import {
  applyInfoEditDraft,
  detailToInfoEditDraft,
  type GeminiRecruitmentInfoEditDraft,
} from '../model/recruitment/info-edit-draft'
import type { GeminiRecruitmentDetail } from '../model/recruitment/detail-types'
import { getRecruitmentDetailById, patchRecruitmentDetail } from '../model/recruitment/detail-mock'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const activeLnb = parseGeminiRecruitmentDetailLnb(searchParams.get(GEMINI_RECRUITMENT_LNB_PARAM))
  const editTab = searchParams.get(GEMINI_RECRUITMENT_EDIT_PARAM)
  const [detailVersion, setDetailVersion] = useState(0)

  const detail = useMemo(() => {
    if (!recruitmentId) return null
    return getRecruitmentDetailById(recruitmentId, dayjs(todayKey))
  }, [recruitmentId, todayKey, detailVersion])

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

  const trainingContentSource =
    isEditMode && draft != null ? draft.trainingContent : detail?.trainingContent ?? ''

  const { editor, editorMinHeight, getMarkdown } = useNoticeWysiwygEditor(
    isEditMode && detail != null,
    trainingContentSource,
    `gemini-recruitment-info-edit-${recruitmentId ?? 'none'}-${isEditMode ? 'edit' : 'view'}`,
    {
      placeholder: '모집 내용을 입력해 주세요. (ex. 연수 모집 절차, 연수 내용 등)',
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

  const handleSave = useCallback(() => {
    if (detail == null || draft == null) return
    const nextDraft: GeminiRecruitmentInfoEditDraft = {
      ...draft,
      trainingContent: getMarkdown() || draft.trainingContent,
    }
    const nextDetail = applyInfoEditDraft(detail, nextDraft)
    patchRecruitmentDetail(detail.id, {
      title: nextDetail.title,
      announcementPublished: nextDetail.announcementPublished,
      applicationPeriodStart: nextDetail.applicationPeriodStart,
      applicationPeriodEnd: nextDetail.applicationPeriodEnd,
      trainingRequestPeriodStart: nextDetail.trainingRequestPeriodStart,
      trainingRequestPeriodEnd: nextDetail.trainingRequestPeriodEnd,
      minStudentCount: nextDetail.minStudentCount,
      trainingContent: nextDetail.trainingContent,
      updatedAt: nextDetail.updatedAt,
    })
    setEditMode(false)
    setDetailVersion(v => v + 1)
  }, [detail, draft, getMarkdown, setEditMode])

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
  }
}
