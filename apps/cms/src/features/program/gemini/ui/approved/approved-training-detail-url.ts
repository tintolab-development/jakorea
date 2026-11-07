import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GEMINI_RECRUITMENT_ADD_PARAM } from '../../lib/recruitment/add-url'
import {
  GEMINI_RECRUITMENT_EDIT_PARAM,
  GEMINI_RECRUITMENT_ID_PARAM,
  GEMINI_RECRUITMENT_LNB_PARAM,
} from '../../lib/recruitment/detail-url'
import {
  GEMINI_APPROVED_TRAINING_ID_PARAM,
  GEMINI_APPROVED_TRAINING_LNB_PARAM,
  GEMINI_APPROVED_INSTRUCTOR_APPLICATION_ID_PARAM,
} from '../../lib/approved/detail-url'

export function useGeminiApprovedTrainingDetailUrl() {
  const [searchParams, setSearchParams] = useSearchParams()
  const approvedTrainingId = searchParams.get(GEMINI_APPROVED_TRAINING_ID_PARAM)?.trim() || null

  const openDetail = useCallback(
    (id: string) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set(GEMINI_APPROVED_TRAINING_ID_PARAM, id)
          next.delete(GEMINI_APPROVED_TRAINING_LNB_PARAM)
          next.delete(GEMINI_APPROVED_INSTRUCTOR_APPLICATION_ID_PARAM)
          next.delete(GEMINI_RECRUITMENT_ADD_PARAM)
          next.delete(GEMINI_RECRUITMENT_ID_PARAM)
          next.delete(GEMINI_RECRUITMENT_LNB_PARAM)
          next.delete(GEMINI_RECRUITMENT_EDIT_PARAM)
          return next
        },
        { replace: false }
      )
    },
    [setSearchParams]
  )

  const closeDetail = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(GEMINI_APPROVED_TRAINING_ID_PARAM)
        next.delete(GEMINI_APPROVED_TRAINING_LNB_PARAM)
        next.delete(GEMINI_APPROVED_INSTRUCTOR_APPLICATION_ID_PARAM)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  return { approvedTrainingId, openDetail, closeDetail }
}
