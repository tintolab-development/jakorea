/**
 * 회원 상세 — 프로그램 수강·봉사 이력 — 발급 사유 선택 모달
 * (추후 선택 사유·선택 행 기준 파일 다운로드 API 연동)
 */

import { useEffect, useState } from 'react'
import { FEATURE_COMING_SOON_ALERT_MESSAGE, CERTIFICATE_ISSUE_REASON_REQUIRED_ALERT_MESSAGE } from '@/shared/constants/messages'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsSelect } from '@/shared/ui/cms-select'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import './certificate-bulk-issue-reason-modal.css'

const REASON_OPTIONS = [
  { value: 'institution_submission', label: '기관 제출용' },
  { value: 'company_submission', label: '회사 제출용' },
  { value: 'school_submission', label: '학교 제출용' },
  { value: 'financial_institution_submission', label: '금융기관 제출용' },
]

export interface CertificateBulkIssueReasonModalProps {
  open: boolean
  onCancel: () => void
  /** 발급 대상 신청·이력 id (추후 다운로드 요청에 사용) */
  applicationIds: readonly string[]
  /** 제목·설명에 들어가는 발급 문서명 (기본: 수료증/참여인증서) */
  certificateDocumentLabel?: string
}

export function CertificateBulkIssueReasonModal({
  open,
  onCancel,
  applicationIds,
  certificateDocumentLabel = '수료증/참여인증서',
}: CertificateBulkIssueReasonModalProps) {
  void applicationIds
  const { showAlert } = useCmsAlert()
  const [reason, setReason] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (open) setReason(undefined)
  }, [open])

  const handleIssue = () => {
    if (reason == null || String(reason).trim() === '') {
      showAlert({ title: '안내', content: CERTIFICATE_ISSUE_REASON_REQUIRED_ALERT_MESSAGE })
      return
    }
    onCancel()
    showAlert({ title: '안내', content: FEATURE_COMING_SOON_ALERT_MESSAGE })
  }

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={`${certificateDocumentLabel} 발급 사유`}
      description={`${certificateDocumentLabel} 발급 사유를 선택해 주세요.\n선택한 사유는 발급 문서에 기입됩니다.`}
      width={560}
      footer={
        <>
          <CmsButton variant="secondary" size="medium" width={120} onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton variant="primary" size="medium" width={120} onClick={handleIssue}>
            발급
          </CmsButton>
        </>
      }
    >
      <div className="certificate-bulk-issue-reason-modal__field">
        <div
          className="certificate-bulk-issue-reason-modal__label"
          id="certificate-issue-reason-label"
        >
          발급 사유{' '}
          <span className="certificate-bulk-issue-reason-modal__required" aria-hidden>
            *
          </span>
        </div>
        <CmsSelect
          aria-labelledby="certificate-issue-reason-label"
          placeholder="사유를 선택해 주세요"
          value={reason}
          onChange={v => setReason(v as string)}
          options={REASON_OPTIONS}
          inputSize="medium"
          width="100%"
          withAllOption={false}
        />
      </div>
    </ContentModal>
  )
}
