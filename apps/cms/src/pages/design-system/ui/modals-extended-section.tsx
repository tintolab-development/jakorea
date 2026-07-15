import { useState } from 'react'
import { PermissionModal } from '@/shared/components/permission-modal'
import { PermissionButton } from '@/shared/components/permission-button'
import { ActionResultModal } from '@/shared/ui/action-result-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { PlainHeaderModal } from '@/shared/ui/plain-header-modal'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { DsDemo, DsSection } from './section'

export function ModalsExtendedSection() {
  const [approveOpen, setApproveOpen] = useState(false)
  const [tealOpen, setTealOpen] = useState(false)
  const [plainOpen, setPlainOpen] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)

  return (
    <DsSection
      id="modals-extended"
      title="Modals (extended)"
      description="권한 액션·결과·헤더 셸 패턴입니다. 승인·반려·취소 등 업무 흐름은 Modal processes에서 확인합니다."
    >
      <p className="ds-note">
        <code>TealHeaderModal</code>은 ContentModal의 기반 셸(커스텀 바디·푸터).{' '}
        <code>PlainHeaderModal</code>은 문서·내역처럼 흰 헤더가 필요할 때.{' '}
        <code>PermissionModal</code>은 승인/반려 플로우, <code>ActionResultModal</code>은 등록·삭제
        완료 결과 안내입니다.
      </p>

      <DsDemo label="PermissionButton → PermissionModal">
        <p className="ds-note" style={{ marginTop: 0 }}>
          버튼은 현재 인증 컨텍스트의 역할·관리자 레벨을 확인합니다. 권한 통과 후 승인 모달을 여는
          실제 조합입니다.
        </p>
        <PermissionButton type="primary" onClick={() => setApproveOpen(true)}>
          권한 확인 후 승인
        </PermissionButton>
      </DsDemo>

      <DsDemo label="Header shells">
        <div className="ds-demo__row ds-demo__row--fluid">
          <CmsButton variant="secondary" onClick={() => setTealOpen(true)}>
            TealHeaderModal
          </CmsButton>
          <CmsButton variant="default" onClick={() => setPlainOpen(true)}>
            PlainHeaderModal
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="ActionResultModal">
        <div className="ds-demo__row ds-demo__row--fluid">
          <CmsButton variant="primary" onClick={() => setResultOpen(true)}>
            등록 완료
          </CmsButton>
        </div>
      </DsDemo>

      <p className="ds-note">
        <strong>Not catalogued</strong> — 화면 상태와 API 의존성이 큰 도메인 모달은 전체 화면에서
        확인합니다: <code>InquiryModal</code>, <code>ProfileEditModal</code>,{' '}
        <code>TemplateFullpageModal</code>. 공통 셸의 사용법은 위 라이브 데모로 대표합니다.
      </p>

      <PermissionModal
        open={approveOpen}
        onCancel={() => setApproveOpen(false)}
        onConfirm={() => setApproveOpen(false)}
        variant="approve"
        title="승인"
        message="선택한 항목을 **승인**합니다."
        showNotifyTiming={false}
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
