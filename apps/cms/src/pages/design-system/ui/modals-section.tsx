import { useState } from 'react'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { CmsButton } from '@/shared/ui/cms-button'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { ContentModal } from '@/shared/ui/content-modal'
import { DeleteGuideModal } from '@/shared/ui/delete-guide-modal'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import { DsDemo, DsSection } from './section'

export function ModalsSection() {
  const { showAlert } = useCmsAlert()
  const [contentOpen, setContentOpen] = useState(false)
  const [contentLargeOpen, setContentLargeOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmDangerOpen, setConfirmDangerOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTypedOpen, setDeleteTypedOpen] = useState(false)
  const [fullpageOpen, setFullpageOpen] = useState(false)
  const [fullpageSidebarOpen, setFullpageSidebarOpen] = useState(false)
  const [fullpageBreadcrumbOpen, setFullpageBreadcrumbOpen] = useState(false)

  return (
    <DsSection
      id="modals"
      title="Modals"
      description="컨텐츠·확인·삭제 안내는 ContentModal 계열, 상세는 DetailFullPageModal. 피드백은 useCmsAlert / cmsAlertModal을 쓰고 antd message는 쓰지 않습니다."
    >
      <p className="ds-note--warn ds-note">
        antd `message` / `notification` 토스트는 CMS에서 금지입니다. AlertModal(useCmsAlert /
        cmsAlertModal)을 사용하세요.
      </p>

      <DsDemo label="Triggers">
        <div className="ds-demo__row ds-demo__row--fluid">
          <CmsButton variant="primary" onClick={() => setContentOpen(true)}>
            ContentModal
          </CmsButton>
          <CmsButton variant="secondary" onClick={() => setContentLargeOpen(true)}>
            ContentModal large
          </CmsButton>
          <CmsButton variant="default" onClick={() => setConfirmOpen(true)}>
            ConfirmModal
          </CmsButton>
          <CmsButton variant="delete" onClick={() => setConfirmDangerOpen(true)}>
            Confirm danger
          </CmsButton>
          <CmsButton variant="delete" onClick={() => setDeleteOpen(true)}>
            DeleteGuideModal
          </CmsButton>
          <CmsButton variant="delete" onClick={() => setDeleteTypedOpen(true)}>
            Delete + typed confirm
          </CmsButton>
          <CmsButton
            variant="primary"
            onClick={() =>
              showAlert({
                title: '알림',
                content: '작업이 완료되었습니다. (useCmsAlert)',
              })
            }
          >
            useCmsAlert
          </CmsButton>
          <CmsButton
            variant="secondary"
            onClick={() =>
              cmsAlertModal.show({
                title: '알림',
                content: '작업이 완료되었습니다. (cmsAlertModal.show)',
              })
            }
          >
            cmsAlertModal
          </CmsButton>
          <CmsButton variant="secondary" onClick={() => setFullpageOpen(true)}>
            DetailFullPage (no sidebar)
          </CmsButton>
          <CmsButton variant="secondary" onClick={() => setFullpageSidebarOpen(true)}>
            DetailFullPage + sidebar
          </CmsButton>
          <CmsButton variant="secondary" onClick={() => setFullpageBreadcrumbOpen(true)}>
            DetailFullPage + breadcrumb
          </CmsButton>
        </div>
      </DsDemo>

      <ContentModal
        open={contentOpen}
        onCancel={() => setContentOpen(false)}
        title="컨텐츠 모달"
        description="기본 size(default, 약 800px). 본문과 푸터 패턴을 확인합니다."
        footer={
          <>
            <CmsButton variant="secondary" onClick={() => setContentOpen(false)}>
              취소
            </CmsButton>
            <CmsButton variant="primary" onClick={() => setContentOpen(false)}>
              확인
            </CmsButton>
          </>
        }
      >
        <p style={{ margin: 0, color: 'var(--color-text-body)' }}>
          ContentModal은 TealHeaderModal을 감싼 표준 컨텐츠 모달입니다.
        </p>
      </ContentModal>

      <ContentModal
        open={contentLargeOpen}
        onCancel={() => setContentLargeOpen(false)}
        title="Large 컨텐츠 모달"
        size="large"
        footer={
          <CmsButton variant="primary" onClick={() => setContentLargeOpen(false)}>
            닫기
          </CmsButton>
        }
      >
        <p style={{ margin: 0, color: 'var(--color-text-body)' }}>
          size=&quot;large&quot;는 넓은 표·폼에 사용합니다.
        </p>
      </ContentModal>

      <ConfirmModal
        open={confirmOpen}
        title="저장하시겠습니까?"
        content="변경한 내용이 저장됩니다."
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmModal
        open={confirmDangerOpen}
        title="삭제하시겠습니까?"
        content="선택한 항목을 삭제합니다."
        danger
        warningMessage="삭제된 항목은 복구할 수 없습니다."
        confirmText="삭제"
        onConfirm={() => setConfirmDangerOpen(false)}
        onCancel={() => setConfirmDangerOpen(false)}
      />

      <DeleteGuideModal
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => setDeleteOpen(false)}
        title="삭제 안내"
        lines={[
          '선택한 항목 **[데모 프로그램]** 을 삭제합니다.',
          '삭제된 항목은 복구할 수 없습니다.',
        ]}
      />

      <DeleteGuideModal
        open={deleteTypedOpen}
        onCancel={() => setDeleteTypedOpen(false)}
        onConfirm={() => setDeleteTypedOpen(false)}
        title="삭제 확인 입력"
        lines={['계속하려면 아래에 **삭제** 를 입력하세요.']}
        requiredConfirmInput="삭제"
      />

      <DetailFullPageModal
        open={fullpageOpen}
        onClose={() => setFullpageOpen(false)}
        title="상세 풀페이지 모달"
      >
        <p style={{ margin: 0, color: 'var(--color-text-body)' }}>
          사이드바 없이 메인만 풀폭으로 쓰는 패턴입니다.
        </p>
      </DetailFullPageModal>

      <DetailFullPageModal
        open={fullpageSidebarOpen}
        onClose={() => setFullpageSidebarOpen(false)}
        title="상세 풀페이지 + LNB"
        sidebar={
          <aside
            style={{
              width: 200,
              padding: 16,
              borderRight: '1px solid var(--color-border)',
              color: 'var(--color-text-body)',
              fontSize: 14,
            }}
          >
            <div>기본 정보</div>
            <div style={{ marginTop: 8, color: 'var(--color-brand-primary)', fontWeight: 600 }}>
              신청 현황
            </div>
            <div style={{ marginTop: 8 }}>이력</div>
          </aside>
        }
      >
        <p style={{ margin: 0, color: 'var(--color-text-body)' }}>
          왼쪽 LNB + 메인 스크롤 영역의 상세 편집 셸입니다.
        </p>
      </DetailFullPageModal>

      <DetailFullPageModal
        open={fullpageBreadcrumbOpen}
        onClose={() => setFullpageBreadcrumbOpen(false)}
        title="상세 풀페이지 + breadcrumb"
        headerTrailing={
          <DetailFullpageBreadcrumb
            items={[
              {
                label: '목록',
                onClick: () => setFullpageBreadcrumbOpen(false),
              },
              { label: '데모 상세' },
            ]}
          />
        }
      >
        <p style={{ margin: 0, color: 'var(--color-text-body)' }}>
          headerTrailing에 DetailFullpageBreadcrumb를 넣는 패턴입니다.
        </p>
      </DetailFullPageModal>
    </DsSection>
  )
}
