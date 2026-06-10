import { useCallback } from 'react'
import { Typography } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import {
  GEMINI_APPROVED_TRAINING_ID_PARAM,
  GEMINI_APPROVED_TRAINING_LNB_PARAM,
} from '../../lib/approved/detail-url'
import {
  GEMINI_PERFORMANCE_REPORT_ADD_ACTIVE,
  GEMINI_PERFORMANCE_REPORT_ADD_PARAM,
  isGeminiPerformanceReportAddOpen,
} from '../../lib/performance/report-add-url'
import { GEMINI_RECRUITMENT_ADD_PARAM } from '../../lib/recruitment/add-url'
import {
  GEMINI_RECRUITMENT_EDIT_PARAM,
  GEMINI_RECRUITMENT_ID_PARAM,
  GEMINI_RECRUITMENT_LNB_PARAM,
} from '../../lib/recruitment/detail-url'
import '@/features/program/general/ui/detail-modal/program-detail-fullpage-modal.css'

export function GeminiPerformanceReportAddFullpageModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <DetailFullPageModal
      open={open}
      onClose={onClose}
      title="연수 보고서 등록"
      className="program-detail-fullpage-modal"
    >
      <Typography.Paragraph type="secondary">
        연수 보고서 등록 화면은 준비 중입니다.
      </Typography.Paragraph>
    </DetailFullPageModal>
  )
}

export function useGeminiPerformanceReportAddUrl() {
  const [searchParams, setSearchParams] = useSearchParams()
  const isAddOpen = isGeminiPerformanceReportAddOpen(
    searchParams.get(GEMINI_PERFORMANCE_REPORT_ADD_PARAM)
  )

  const openAdd = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.set(GEMINI_PERFORMANCE_REPORT_ADD_PARAM, GEMINI_PERFORMANCE_REPORT_ADD_ACTIVE)
        next.delete(GEMINI_APPROVED_TRAINING_ID_PARAM)
        next.delete(GEMINI_APPROVED_TRAINING_LNB_PARAM)
        next.delete(GEMINI_RECRUITMENT_ADD_PARAM)
        next.delete(GEMINI_RECRUITMENT_ID_PARAM)
        next.delete(GEMINI_RECRUITMENT_LNB_PARAM)
        next.delete(GEMINI_RECRUITMENT_EDIT_PARAM)
        return next
      },
      { replace: false }
    )
  }, [setSearchParams])

  const closeAdd = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(GEMINI_PERFORMANCE_REPORT_ADD_PARAM)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  return { isAddOpen, openAdd, closeAdd }
}
