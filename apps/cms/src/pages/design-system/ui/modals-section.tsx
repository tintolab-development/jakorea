import { useState } from 'react'
import { BookOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsModal } from '@/shared/ui/cms-modal'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { ContentModal } from '@/shared/ui/content-modal'
import { DeleteGuideModal } from '@/shared/ui/delete-guide-modal'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import { DetailModalSidebar, type DetailModalSidebarNavItem } from '@/shared/ui/detail-modal-sidebar'
import {
  ModalSpecTable,
  ModalSpecTableRadioCell,
  ModalSpecTableRow,
} from '@/shared/ui/modal-spec-table/modal-spec-table'
import { DsDemo, DsSection } from './section'

const SIDEBAR_DEMO_ITEMS: DetailModalSidebarNavItem[] = [
  {
    key: 'basic',
    label: '기본 정보',
    icon: <UserOutlined className="detail-fullpage-modal__lnb-icon" />,
  },
  {
    key: 'applicants',
    label: '신청 현황',
    icon: <TeamOutlined className="detail-fullpage-modal__lnb-icon" />,
    children: [
      { key: 'list', label: '신청 목록' },
      { key: 'status', label: '상태별 집계' },
    ],
  },
  {
    key: 'history',
    label: '이력',
    icon: <BookOutlined className="detail-fullpage-modal__lnb-icon" />,
  },
]

export function ModalsSection() {
  const { showAlert } = useCmsAlert()
  const [contentOpen, setContentOpen] = useState(false)
  const [contentLargeOpen, setContentLargeOpen] = useState(false)
  const [cmsModalOneOpen, setCmsModalOneOpen] = useState(false)
  const [cmsModalTwoOpen, setCmsModalTwoOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmDangerOpen, setConfirmDangerOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTypedOpen, setDeleteTypedOpen] = useState(false)
  const [specTableOpen, setSpecTableOpen] = useState(false)
  const [specRadio, setSpecRadio] = useState<'required' | 'not_required'>('required')
  const [fullpageOpen, setFullpageOpen] = useState(false)
  const [fullpageSidebarOpen, setFullpageSidebarOpen] = useState(false)
  const [fullpageBreadcrumbOpen, setFullpageBreadcrumbOpen] = useState(false)
  const [fullpageLoadingOpen, setFullpageLoadingOpen] = useState(false)
  const [sidebarActiveKey, setSidebarActiveKey] = useState('applicants')
  const [sidebarChildKey, setSidebarChildKey] = useState('list')
  const [sidebarExpanded, setSidebarExpanded] = useState<readonly string[]>(['applicants'])

  return (
    <DsSection
      id="modals"
      title="Modals (core)"
      description="표준 오버레이는 ContentModal 계열, 상세는 DetailFullPageModal입니다. 피드백은 useCmsAlert / cmsAlertModal을 쓰고 antd message는 쓰지 않습니다."
    >
      <p className="ds-note">
        <strong>선택 순서</strong> — 안내(1버튼)→{' '}
        <code>useCmsAlert</code> / <code>CmsModal</code> · 확인·취소→ <code>ConfirmModal</code> ·
        삭제 안내→ <code>DeleteGuideModal</code> · 폼·표 컨텐츠→ <code>ContentModal</code> (+{' '}
        <code>ModalSpecTable</code>) · 상세 화면→ <code>DetailFullPageModal</code> (+{' '}
        <code>DetailModalSidebar</code>). 뷰포트 중앙 정렬은{' '}
        <code>modal-viewport-centering</code> 규칙을 따릅니다. z-index는 Alert가{' '}
        <code>CMS_ALERT_MODAL_Z_INDEX</code>(10000)로 항상 최상위입니다.
      </p>
      <p className="ds-note--warn ds-note">
        antd <code>message</code> / <code>notification</code> 토스트는 CMS에서 금지입니다. Alert는
        페이지에 <code>AlertModal</code>을 직접 마운트하지 말고 <code>useCmsAlert</code> /{' '}
        <code>cmsAlertModal</code>만 사용하세요.
      </p>

      <DsDemo label="ContentModal">
        <div className="ds-demo__row ds-demo__row--fluid">
          <CmsButton variant="primary" onClick={() => setContentOpen(true)}>
            default (~800px)
          </CmsButton>
          <CmsButton variant="secondary" onClick={() => setContentLargeOpen(true)}>
            size=&quot;large&quot; (~1400px)
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="CmsModal (1~2 버튼 프리셋)">
        <div className="ds-demo__row ds-demo__row--fluid">
          <CmsButton variant="primary" onClick={() => setCmsModalOneOpen(true)}>
            1버튼 안내
          </CmsButton>
          <CmsButton variant="secondary" onClick={() => setCmsModalTwoOpen(true)}>
            2버튼 확인
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="ConfirmModal / DeleteGuideModal">
        <div className="ds-demo__row ds-demo__row--fluid">
          <CmsButton variant="default" onClick={() => setConfirmOpen(true)}>
            Confirm
          </CmsButton>
          <CmsButton variant="delete" onClick={() => setConfirmDangerOpen(true)}>
            Confirm danger
          </CmsButton>
          <CmsButton variant="delete" onClick={() => setDeleteOpen(true)}>
            DeleteGuide
          </CmsButton>
          <CmsButton variant="delete" onClick={() => setDeleteTypedOpen(true)}>
            Delete + typed confirm
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="Alert (useCmsAlert / cmsAlertModal)">
        <div className="ds-demo__row ds-demo__row--fluid">
          <CmsButton
            variant="primary"
            onClick={() =>
              showAlert({
                title: '알림',
                content: '작업이 완료되었습니다.\n(useCmsAlert)',
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
                content: '작업이 완료되었습니다.\n(cmsAlertModal.show)',
              })
            }
          >
            cmsAlertModal (비 React)
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="ModalSpecTable (본문 스펙 표)">
        <div className="ds-demo__row ds-demo__row--fluid">
          <CmsButton variant="secondary" onClick={() => setSpecTableOpen(true)}>
            ContentModal + ModalSpecTable
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="DetailFullPageModal">
        <div className="ds-demo__row ds-demo__row--fluid">
          <CmsButton variant="secondary" onClick={() => setFullpageOpen(true)}>
            no sidebar
          </CmsButton>
          <CmsButton variant="secondary" onClick={() => setFullpageSidebarOpen(true)}>
            + DetailModalSidebar
          </CmsButton>
          <CmsButton variant="secondary" onClick={() => setFullpageBreadcrumbOpen(true)}>
            + breadcrumb / contentExtra
          </CmsButton>
          <CmsButton variant="default" onClick={() => setFullpageLoadingOpen(true)}>
            loading (empty 전)
          </CmsButton>
        </div>
      </DsDemo>

      <ContentModal
        open={contentOpen}
        onCancel={() => setContentOpen(false)}
        title="컨텐츠 모달"
        description="기본 size(default). description은 **볼드**와\n줄바꿈을 지원합니다."
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
          ContentModal은 TealHeaderModal을 감싼 표준 컨텐츠 모달입니다. 일반 폼·안내에 우선
          사용합니다.
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

      <CmsModal
        open={cmsModalOneOpen}
        onClose={() => setCmsModalOneOpen(false)}
        title="안내"
        content="CmsModal은 ContentModal 위에 버튼 1~2개 푸터를 프리셋으로 둡니다."
        buttons={[{ label: '확인', onClick: () => setCmsModalOneOpen(false) }]}
      />

      <CmsModal
        open={cmsModalTwoOpen}
        onClose={() => setCmsModalTwoOpen(false)}
        title="저장하시겠습니까?"
        content="변경한 내용을 저장합니다."
        buttons={[
          { label: '취소', onClick: () => setCmsModalTwoOpen(false), variant: 'secondary' },
          { label: '저장', onClick: () => setCmsModalTwoOpen(false), variant: 'primary' },
        ]}
      />

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

      <ContentModal
        open={specTableOpen}
        onCancel={() => setSpecTableOpen(false)}
        title="스펙 표 데모"
        description="모달 본문의 라벨·값 2열 표는 ModalSpecTable을 사용합니다."
        footer={
          <CmsButton variant="primary" onClick={() => setSpecTableOpen(false)}>
            닫기
          </CmsButton>
        }
      >
        <ModalSpecTable aria-label="데모 스펙">
          <ModalSpecTableRow label="산정 기준" labelVariant="basis">
            <span style={{ color: 'var(--color-text-body)' }}>인당 지급</span>
          </ModalSpecTableRow>
          <ModalSpecTableRow label="비고" labelVariant="remark">
            <CmsInput placeholder="비고 입력" style={{ width: '100%' }} />
          </ModalSpecTableRow>
          <ModalSpecTableRow label="증빙 제출" labelVariant="paymentRequirementShort">
            <ModalSpecTableRadioCell
              value={specRadio}
              onChange={setSpecRadio}
              options={[
                { value: 'required', label: '필요' },
                { value: 'not_required', label: '불필요' },
              ]}
            />
          </ModalSpecTableRow>
        </ModalSpecTable>
      </ContentModal>

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
        title="상세 풀페이지 + DetailModalSidebar"
        sidebar={
          <DetailModalSidebar
            navAriaLabel="상세 메뉴 데모"
            items={SIDEBAR_DEMO_ITEMS}
            activeKey={sidebarActiveKey}
            activeChildKey={sidebarChildKey}
            expandedGroupKeys={sidebarExpanded}
            onSelectTop={key => {
              setSidebarActiveKey(key)
              const item = SIDEBAR_DEMO_ITEMS.find(i => i.key === key)
              if (item?.children?.length) {
                setSidebarExpanded(prev => (prev.includes(key) ? prev : [...prev, key]))
                setSidebarChildKey(item.children[0]?.key ?? '')
              } else {
                setSidebarChildKey('')
              }
            }}
            onSelectChild={(groupKey, childKey) => {
              setSidebarActiveKey(groupKey)
              setSidebarChildKey(childKey)
            }}
          />
        }
      >
        <p style={{ margin: 0, color: 'var(--color-text-body)' }}>
          raw <code>&lt;aside&gt;</code> 대신 <code>DetailModalSidebar</code>를 표준 LNB로
          사용합니다. 선택 키: {sidebarActiveKey}
          {sidebarChildKey ? ` / ${sidebarChildKey}` : ''}.
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
        contentExtra={
          <CmsButton variant="primary" size="medium" onClick={() => undefined}>
            정보 수정
          </CmsButton>
        }
      >
        <p style={{ margin: 0, color: 'var(--color-text-body)' }}>
          <code>headerTrailing</code>에 breadcrumb, <code>contentExtra</code>에 액션 버튼을 둡니다.
        </p>
      </DetailFullPageModal>

      <DetailFullPageModal
        open={fullpageLoadingOpen}
        onClose={() => setFullpageLoadingOpen(false)}
        title="상세 로딩"
      >
        <div
          className="detail-fullpage-modal__loading"
          role="status"
          aria-label="상세 불러오는 중"
        >
          <Spin size="large" />
        </div>
      </DetailFullPageModal>
    </DsSection>
  )
}
