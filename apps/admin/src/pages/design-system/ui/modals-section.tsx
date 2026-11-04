import { useState } from 'react'
import {
  AlertModal,
  CmsButton,
  ConfirmModal,
  ContentModal,
  NO_SELECTION_ALERT,
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  useCmsAlert,
} from '@/shared/ui'
import { DsDemo, DsSection } from './section'

export function ModalsSection() {
  const { showAlert } = useCmsAlert()
  const [contentOpen, setContentOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)

  return (
    <DsSection
      id="modals"
      title="Modals"
      description="ContentModal · ConfirmModal · AlertModal. 푸터 버튼 large 140×44 (content-modal CSS 강제)."
    >
      <p className="ds-note">
        푸터 취소/등록/확인 = <code>size=&quot;large&quot;</code>. SSOT:{' '}
        <code>cms-admin-ui/cms-button-action-sizes.mdc</code>
      </p>
      <DsDemo label="Triggers">
        <div className="ds-demo__row">
          <CmsButton variant="secondary" size="medium" onClick={() => setContentOpen(true)}>
            ContentModal
          </CmsButton>
          <CmsButton variant="delete" size="medium" onClick={() => setConfirmOpen(true)}>
            ConfirmModal
          </CmsButton>
          <CmsButton variant="default" size="medium" onClick={() => setAlertOpen(true)}>
            AlertModal
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            onClick={() =>
              showAlert(NO_SELECTION_ALERT)
            }
          >
            useCmsAlert
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            onClick={() => showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)}
          >
            필수 항목 입력 안내
          </CmsButton>
        </div>
      </DsDemo>

      <ContentModal
        open={contentOpen}
        onCancel={() => setContentOpen(false)}
        title="배너 등록"
        description="메인 화면에 노출할 배너 이미지와 문구를 선정해 주세요."
        width={800}
        footer={
          <>
            <CmsButton variant="secondary" size="medium" onClick={() => setContentOpen(false)}>
              취소
            </CmsButton>
            <CmsButton variant="primary" size="medium" onClick={() => setContentOpen(false)}>
              배너 등록
            </CmsButton>
          </>
        }
      >
        <p className="ds-demo__hint">모달 본문 영역</p>
      </ContentModal>

      <ConfirmModal
        open={confirmOpen}
        title="배너 삭제"
        content={'선택한 배너를 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.'}
        confirmText="삭제"
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
      />

      <AlertModal
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        title="안내"
        content="20MB를 초과한 파일은 등록할 수 없습니다."
      />
    </DsSection>
  )
}
