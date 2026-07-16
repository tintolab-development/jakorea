/**
 * 중복 신청 알럿 모달
 */

import type { Program } from '@/types/domain'
import type { DuplicateCheckResult } from '@/features/application/lib/duplicate-application-check'
import { CmsButton } from '@/shared/ui/cms-button'
import { ContentModal } from '@/shared/ui/content-modal'

interface DuplicateApplicationAlertProps {
  open: boolean
  program: Program | null
  duplicateResult: DuplicateCheckResult
  onConfirm: () => void
  onCancel: () => void
}

export function DuplicateApplicationAlert({
  open,
  program,
  duplicateResult,
  onConfirm,
  onCancel,
}: DuplicateApplicationAlertProps) {
  if (!program || !duplicateResult.isDuplicate) {
    return null
  }

  const title = duplicateResult.case === 'case1' ? '중복 신청 확인' : '추가 신청 확인'
  const confirmText = duplicateResult.case === 'case1' ? '확인' : '추가 신청하기'

  return (
    <ContentModal
      open={open}
      title={title}
      onCancel={onCancel}
      width={500}
      zIndex={1001}
      footer={
        <>
          <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="button"
            className="cms-button--footer-auto"
            onClick={onConfirm}
          >
            {confirmText}
          </CmsButton>
        </>
      }
    >
      <div style={{ whiteSpace: 'pre-line' }}>{duplicateResult.message}</div>
      {duplicateResult.existingApplication ? (
        <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
          <div style={{ fontSize: 12, color: '#666' }}>
            기존 신청일:{' '}
            {new Date(duplicateResult.existingApplication.submittedAt).toLocaleDateString('ko-KR')}
          </div>
        </div>
      ) : null}
    </ContentModal>
  )
}
