import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  REGISTRATION_DRAFT_MODE_CONTINUE,
  REGISTRATION_DRAFT_MODE_FRESH,
  REGISTRATION_DRAFT_MODE_QUERY_KEY,
} from '@/features/program/shared/lib/registration-draft-notice'
import {
  GEMINI_RECRUITMENT_ADD_ACTIVE,
  GEMINI_RECRUITMENT_ADD_PARAM,
  isGeminiRecruitmentAddOpen,
  type GeminiRecruitmentAddDraftMode,
} from '../../lib/recruitment/add-url'
import {
  GEMINI_RECRUITMENT_ID_PARAM,
  GEMINI_RECRUITMENT_LNB_PARAM,
} from '../../lib/recruitment/detail-url'

export function useGeminiRecruitmentAddUrl() {
  const [searchParams, setSearchParams] = useSearchParams()
  const isAddOpen = isGeminiRecruitmentAddOpen(searchParams.get(GEMINI_RECRUITMENT_ADD_PARAM))

  const openAdd = useCallback(
    (draftMode?: GeminiRecruitmentAddDraftMode) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set(GEMINI_RECRUITMENT_ADD_PARAM, GEMINI_RECRUITMENT_ADD_ACTIVE)
          next.delete(GEMINI_RECRUITMENT_ID_PARAM)
          next.delete(GEMINI_RECRUITMENT_LNB_PARAM)
          if (draftMode === 'continue') {
            next.set(REGISTRATION_DRAFT_MODE_QUERY_KEY, REGISTRATION_DRAFT_MODE_CONTINUE)
          } else {
            next.set(REGISTRATION_DRAFT_MODE_QUERY_KEY, REGISTRATION_DRAFT_MODE_FRESH)
          }
          return next
        },
        { replace: false }
      )
    },
    [setSearchParams]
  )

  const closeAdd = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(GEMINI_RECRUITMENT_ADD_PARAM)
        next.delete(REGISTRATION_DRAFT_MODE_QUERY_KEY)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  return { isAddOpen, openAdd, closeAdd }
}
