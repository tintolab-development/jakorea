/**
 * 확인 모달 컴포넌트
 * Phase 2.1: 공통 확인 다이얼로그
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
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      title={
        <span>
          <ExclamationCircleOutlined style={{ color: danger ? '#ff4d4f' : '#1890ff', marginRight: 8 }} />
          {title}
        </span>
      }
      onOk={onConfirm}
      onCancel={onCancel}
      okText={confirmText}
      cancelText={cancelText}
      okButtonProps={{ danger }}
    >
      <p>{content}</p>
    </Modal>
  )
}






