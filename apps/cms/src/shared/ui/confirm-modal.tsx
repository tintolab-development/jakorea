/**
 * 확인 모달 컴포넌트
 * Phase 2.1: 공통 확인 다이얼로그
 *
 * 삭제 기능 사용 시:
 * - danger={true} 필수
 * - warningMessage로 경고 메시지 표시
 * - confirmText="삭제", cancelText="취소" 권장
 */

import { Modal } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

interface ConfirmModalProps {
  open: boolean
  title: string
  content: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  danger?: boolean
  /** 삭제 시 표시할 경고 메시지 (예: "삭제된 항목은 복구할 수 없습니다.") */
  warningMessage?: string
}

export function ConfirmModal({
  open,
  title,
  content,
  onConfirm,
  onCancel,
  confirmText = '확인',
  cancelText = '취소',
  danger = false,
  warningMessage,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      title={
        <span>
          <ExclamationCircleOutlined
            style={{ color: danger ? '#ff4d4f' : '#1890ff', marginRight: 8 }}
          />
          {title}
        </span>
      }
      onOk={onConfirm}
      onCancel={onCancel}
      okText={confirmText}
      cancelText={cancelText}
      okButtonProps={{ danger }}
      zIndex={1001}
    >
      <p>{content}</p>
      {warningMessage && (
        <p style={{ color: '#ff4d4f', fontSize: '12px', marginTop: 8, marginBottom: 0 }}>
          {warningMessage}
        </p>
      )}
    </Modal>
  )
}
