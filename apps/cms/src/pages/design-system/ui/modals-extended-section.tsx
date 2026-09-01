import { useState } from 'react'
import { PermissionModal } from '@/shared/components/permission-modal'
import { PermissionButton } from '@/shared/components/permission-button'
import { ActionResultModal } from '@/shared/ui/action-result-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { ContentModal } from '@/shared/ui/content-modal'
import { DsDemo, DsSection } from './section'

export function ModalsExtendedSection() {
  const [approveOpen, setApproveOpen] = useState(false)
  const [contentOpen, setContentOpen] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)

  return (
    <DsSection
      id="modals-extended"
      title="Modals (extended)"
      description="권한 액션·결과 모달입니다. 표준 카드형은 ContentModal 섹션을 보세요."
    >
      <p className="ds-note">
        표준 카드형 →{' '}
        <a href="#modals">
          <code>ContentModal</code>
        </a>
        . <code>TealHeaderModal</code>은 내부 기반 셸(단독 사용 비권장).{' '}
        <code>PermissionModal</code> / <code>ActionResultModal</code>은 업무 플로우용입니다.
      </p>
      <p className="ds-note">
        카드형 셸 — 기본 800 · padding <code>26px 30px 34px</code> · radius 12 · shadow{' '}
        <code>0 0 25px rgba(0,0,0,0.35)</code> · 푸터 large 140×44 우측 정렬 (
        <code>cms-admin-ui/cms-button-action-sizes</code>).
      </p>

      <DsDemo label="ContentModal">
        <div className="ds-demo__row ds-demo__row--fluid">
          <CmsButton variant="primary" onClick={() => setContentOpen(true)}>
            ContentModal
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="PermissionButton → PermissionModal">
        <p className="ds-note" style={{ marginTop: 0 }}>
          버튼은 현재 인증 컨텍스트의 역할·관리자 레벨을 확인합니다. 권한 통과 후 승인 모달을 여는
          실제 조합입니다.
        </p>
        <PermissionButton type="primary" onClick={() => setApproveOpen(true)}>
          권한 확인 후 승인
        </PermissionButton>
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
        <code>TemplateFullpageModal</code>.
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

      <ContentModal
        open={contentOpen}
        onCancel={() => setContentOpen(false)}
        title="ContentModal"
        description="표준 카드형 모달입니다. 폼·표·확인 UI의 기본 셸입니다."
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="medium"
              type="button"
              onClick={() => setContentOpen(false)}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              type="button"
              onClick={() => setContentOpen(false)}
            >
              확인
            </CmsButton>
          </>
        }
      >
        <div />
      </ContentModal>

      <ActionResultModal
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        title="등록 완료"
        body="[데모 항목] 등록이 완료되었습니다."
      />
    </DsSection>
  )
}
