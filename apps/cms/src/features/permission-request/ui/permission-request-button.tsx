/**
 * 권한 요청 버튼 컴포넌트
 * Phase 0.5.2: 권한 요청 UX
 * 시니어 개발자 관점: 컴포넌트 분리
 */

import { useState } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import { SafetyOutlined } from '@ant-design/icons'
import { PermissionRequestModal } from './permission-request-modal'
import type { PermissionAction } from '@/types/permission-request'
import type { UUID } from '@/types'

interface PermissionRequestButtonProps {
  programId: UUID
  programName: string
  action: PermissionAction
  onRequestSubmitted?: () => void
}

export function PermissionRequestButton({
  programId,
  programName,
  action,
  onRequestSubmitted,
}: PermissionRequestButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <CmsButton variant="secondary" icon={<SafetyOutlined />} onClick={() => setModalOpen(true)}>
        권한 요청
      </CmsButton>

      <PermissionRequestModal
        open={modalOpen}
        programId={programId}
        programName={programName}
        requestedAction={action}
        onCancel={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false)
          onRequestSubmitted?.()
        }}
      />
    </>
  )
}
