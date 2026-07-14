import { useState } from 'react'
import { PermissionModal } from '@/shared/components/permission-modal'
import { ActionResultModal } from '@/shared/ui/action-result-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { PlainHeaderModal } from '@/shared/ui/plain-header-modal'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { DsDemo, DsSection } from './section'

export function ModalsExtendedSection() {
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [tealOpen, setTealOpen] = useState(false)
  const [plainOpen, setPlainOpen] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)

  return (
    <DsSection
      id="modals-extended"
      title="Modals (extended)"
      description="ContentModal 바깥의 권한·결과·헤더 셸 패턴입니다. ContentModal은 TealHeaderModal을 감싼 표준 컨텐츠 모달입니다."
    >
      <p className="ds-note">
        raw <code>TealHeaderModal</code>은 커스텀 셸이 필요할 때, <code>PlainHeaderModal</code>은
        문서·내역처럼 흰 헤더가 필요할 때 사용합니다. 일반 폼/안내는 ContentModal을 우선합니다.
      </p>

      <DsDemo label="Triggers">
        <div className="ds-demo__row ds-demo__row--fluid">
          <CmsButton variant="primary" onClick={() => setApproveOpen(true)}>
            Permission approve
          </CmsButton>
          <CmsButton variant="delete" onClick={() => setRejectOpen(true)}>
            Permission reject
          </CmsButton>
          <CmsButton variant="secondary" onClick={() => setTealOpen(true)}>
            TealHeaderModal
          </CmsButton>
          <CmsButton variant="default" onClick={() => setPlainOpen(true)}>
            PlainHeaderModal
          </CmsButton>
          <CmsButton variant="primary" onClick={() => setResultOpen(true)}>
            ActionResultModal
          </CmsButton>
        </div>
      </DsDemo>

      <PermissionModal
        open={approveOpen}
        onCancel={() => setApproveOpen(false)}
        onConfirm={() => setApproveOpen(false)}
        variant="approve"
        title="승인"
        message="선택한 항목을 **승인**합니다."
        showNotifyTiming={false}
      />

      <PermissionModal
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onConfirm={() => setRejectOpen(false)}
        variant="reject"
        title="반려"
        message="선택한 항목을 **반려**합니다.\n사유를 입력해 주세요."
      />

      <TealHeaderModal
        open={tealOpen}
        onCancel={() => setTealOpen(false)}
        title="Teal 헤더 모달"
        footer={
          <CmsButton variant="primary" onClick={() => setTealOpen(false)}>
            닫기
          </CmsButton>
        }
      >
        <p style={{ margin: 0, color: 'var(--color-text-body)' }}>
          ContentModal의 기반 셸입니다. 커스텀 푸터·바디가 필요할 때 직접 사용합니다.
        </p>
      </TealHeaderModal>

      <PlainHeaderModal
        open={plainOpen}
        onCancel={() => setPlainOpen(false)}
        title="Plain 헤더 모달"
        footer={
          <CmsButton variant="secondary" onClick={() => setPlainOpen(false)}>
            닫기
          </CmsButton>
        }
      >
        <p style={{ margin: 0, color: 'var(--color-text-body)' }}>
          청록 헤더 대신 흰 배경 헤더가 필요할 때 사용합니다.
        </p>
      </PlainHeaderModal>

      <ActionResultModal
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        title="등록 완료"
        body="[데모 항목] 등록이 완료되었습니다."
      />
    </DsSection>
  )
}
