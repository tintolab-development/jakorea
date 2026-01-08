/**
 * 중복 신청 알럿 모달 컴포넌트
 * Phase 1: 진행 프로그램 강사용 필터/탭/중복 신청 알럿 구현
 */

import { Modal } from 'antd'
import type { Program } from '@/types/domain'
import type { DuplicateCheckResult } from '@/shared/utils/duplicate-application-check'

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

  const getTitle = () => {
    if (duplicateResult.case === 'case1') {
      return '중복 신청 확인'
    }
    return '추가 신청 확인'
  }

  const handleConfirm = () => {
    onConfirm()
  }

  const handleCancel = () => {
    onCancel()
  }

  return (
    <Modal
      open={open}
      title={getTitle()}
      onOk={handleConfirm}
      onCancel={handleCancel}
      okText={duplicateResult.case === 'case1' ? '확인' : '추가 신청하기'}
      cancelText="취소"
      width={500}
    >
      <div style={{ whiteSpace: 'pre-line', padding: '16px 0' }}>
        {duplicateResult.message}
      </div>
      {duplicateResult.existingApplication && (
        <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
          <div style={{ fontSize: 12, color: '#666' }}>
            기존 신청일:{' '}
            {new Date(duplicateResult.existingApplication.submittedAt).toLocaleDateString('ko-KR')}
          </div>
        </div>
      )}
    </Modal>
  )
}
