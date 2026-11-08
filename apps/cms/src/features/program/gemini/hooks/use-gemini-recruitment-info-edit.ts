import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { beginBlockingOverlay } from '@/shared/ui/blocking-overlay-store'
import { buildGeminiRecruitmentDevAutofillSnapshot } from '../lib/recruitment/dev-autofill'
import {
  applyInfoEditDraft,
  detailToInfoEditDraft,
  type GeminiRecruitmentInfoEditDraft,
} from '../model/recruitment/info-edit-draft'
import type { GeminiRecruitmentDetail } from '../model/recruitment/detail-types'
import { getRecruitmentDetailById, patchRecruitmentDetail } from '../model/recruitment/recruitment-detail-cache'
import { shouldUseGeminiVisitingTrainingRemoteApi } from '../api/visiting-training/capabilities'
import { useGeminiRecruitmentDetailQuery } from '../api/visiting-training/hooks'
import { geminiVisitingTrainingQueryKeys } from '../api/visiting-training/query-keys'
import { updateGeminiRecruitment } from '../api/visiting-training/service'
import { canGeminiRecruitmentInfoEdit } from '../lib/recruitment/info-edit-policy'
import { useGeminiRecruitmentRichTextGetters } from './use-gemini-recruitment-rich-text-getters'
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
  const { registerRichTextGetter, overlayRichText } = useGeminiRecruitmentRichTextGetters()

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
    detail != null &&
    canGeminiRecruitmentInfoEdit(detail.applicationPeriodStart)

  const [draft, setDraft] = useState<GeminiRecruitmentInfoEditDraft | null>(null)
  const draftRef = useRef(draft)
  draftRef.current = draft

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
    if (!canGeminiRecruitmentInfoEdit(detail.applicationPeriodStart)) return
    resetDraftFromDetail()
    setEditMode(true)
  }, [detail, resetDraftFromDetail, setEditMode])

  const handleCancel = useCallback(() => {
    resetDraftFromDetail()
    setEditMode(false)
  }, [resetDraftFromDetail, setEditMode])

  const handleSave = useCallback(async () => {
    const currentDraft = draftRef.current
    if (detail == null || currentDraft == null || !recruitmentId) return
    const nextDraft = overlayRichText(currentDraft)
    const endOverlay = beginBlockingOverlay()
    try {
      if (remoteEnabled) {
        const saved = await updateGeminiRecruitment(recruitmentId, nextDraft, {
          existingApplicationPeriodStart: detail.applicationPeriodStart,
        })
        const detailKey = geminiVisitingTrainingQueryKeys.recruitmentDetail(recruitmentId)
        await queryClient.cancelQueries({ queryKey: detailKey })
        if (saved) {
          // 저장 응답 직후 서비스가 상세(+첨부)를 다시 받아 왔다 — 같은 값을 한 번 더 GET하지 않는다.
          queryClient.setQueryData(detailKey, saved)
        } else {
          await queryClient.invalidateQueries({ queryKey: detailKey })
        }
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
    } finally {
      endOverlay()
    }
  }, [detail, overlayRichText, queryClient, recruitmentId, remoteEnabled, setEditMode])

  const patchDraft = useCallback((patch: Partial<GeminiRecruitmentInfoEditDraft>) => {
    setDraft(prev => {
      if (prev == null) return prev
      const next = { ...prev, ...patch }
      draftRef.current = next
      return next
    })
  }, [])

  /** 개발용 — 수정 중인 모집 정보만 채운다. 등록일·첨부·썸네일은 유지한다. */
  const applyDevAutofill = useCallback(() => {
    if (!import.meta.env.DEV) return
    const snapshot = buildGeminiRecruitmentDevAutofillSnapshot()
    const recruitmentWindowLocked = !canGeminiRecruitmentInfoEdit(detail?.applicationPeriodStart)
    setDraft(prev => {
      if (prev == null) return prev
      if (recruitmentWindowLocked) {
        return {
          ...prev,
          programDescription: snapshot.programDescription,
          recruitmentGuide: snapshot.recruitmentGuide,
          applicationMethod: snapshot.applicationMethod,
          learningSupportContent: snapshot.learningSupportContent,
          additionalContentMarkdown: snapshot.additionalContentMarkdown,
        }
      }
      return {
        ...prev,
        title: snapshot.title,
        announcementPublished: snapshot.announcementPublished,
        educationTargetLevels: snapshot.educationTargetLevels,
        educationTargetDetail: snapshot.educationTargetDetail,
        applicationPeriodStart: snapshot.applicationPeriodStart ?? prev.applicationPeriodStart,
        applicationPeriodEnd: snapshot.applicationPeriodEnd ?? prev.applicationPeriodEnd,
        trainingRequestPeriodStart:
          snapshot.trainingRequestPeriodStart ?? prev.trainingRequestPeriodStart,
        trainingRequestPeriodEnd:
          snapshot.trainingRequestPeriodEnd ?? prev.trainingRequestPeriodEnd,
        minStudentCount: snapshot.minStudentCount,
        educationForm: snapshot.educationForm,
        educationStructure: snapshot.educationStructure,
        inquiryContactName: snapshot.inquiryContactName,
        inquiryTel: snapshot.inquiryTel,
        inquiryEmail: snapshot.inquiryEmail,
        notesNotApplicable: snapshot.notesNotApplicable,
        notes: snapshot.notes,
        programDescription: snapshot.programDescription,
        recruitmentGuide: snapshot.recruitmentGuide,
        applicationMethod: snapshot.applicationMethod,
        learningSupportContent: snapshot.learningSupportContent,
        additionalContentMarkdown: snapshot.additionalContentMarkdown,
      }
    })
  }, [detail?.applicationPeriodStart])

  // displayDetail는 미리보기/저장 merge용. 수정 타이핑 경로에서는 쓰지 않음.
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
    applyDevAutofill,
    handleEdit,
    handleCancel,
    handleSave,
    registerRichTextGetter,
    overlayRichText,
    remoteEnabled,
    isDetailFetching: remoteEnabled ? remoteDetailQuery.isFetching : false,
    isDetailError: remoteEnabled ? remoteDetailQuery.isError : false,
  }
}
