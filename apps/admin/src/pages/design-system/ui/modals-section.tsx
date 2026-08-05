import { useState } from 'react'
import { AlertModal, CmsButton, ConfirmModal, ContentModal, useCmsAlert } from '@/shared/ui'
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
      description="ContentModal · ConfirmModal · AlertModal / useCmsAlert."
    >
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
              showAlert({
                title: '선택 항목 없음',
                content: '삭제할 배너를 선택해 주세요.',
              })
            }
          >
            useCmsAlert
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
        content={"선택한 배너를 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다."}
        confirmText="삭제"
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
      />

      <AlertModal
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        title="안내"
        content="파일은 총 최대 15MB까지 업로드 가능합니다."
      />
    </DsSection>
  )
}
