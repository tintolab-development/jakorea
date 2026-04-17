import { useCallback, useState } from 'react'
import { BulbOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import { useProgramHistoryFilter } from '@/features/sponsor/hooks/use-program-history-filter'
import { useSponsorContacts } from '@/features/sponsor/hooks/use-sponsor-contacts'
import { useSponsorDelete } from '@/features/sponsor/hooks/use-sponsor-delete'
import { useSponsorDetail } from '@/features/sponsor/hooks/use-sponsor-detail'
import { useSponsorDetailModalTableColumns } from '@/features/sponsor/hooks/use-sponsor-detail-modal-table-columns'
import { SponsorContactRegisterModal } from '@/features/sponsor/ui/modal/sponsor-contact-register-modal'
import { SponsorDeleteBlockedModal } from '@/features/sponsor/ui/modal/sponsor-delete-blocked-modal'
import { SponsorDeleteModal } from '@/features/sponsor/ui/modal/sponsor-delete-modal'
import { SponsorDetailPanel } from '@/features/sponsor/ui/panels/sponsor-detail-panel'
import { SponsorProgramHistoryPanel } from '@/features/sponsor/ui/panels/sponsor-program-history-panel'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailModalSidebar, type DetailModalSidebarNavItem } from '@/shared/ui/detail-modal-sidebar'
import { CmsButton } from '@/shared/ui'
import { canPerformWriteAction } from '@/shared/utils/permissions'

const LNB_DETAIL = 'sponsor-detail'
const LNB_PROGRAMS = 'sponsor-programs'

const SPONSOR_DETAIL_MODAL_SIDEBAR_ITEMS: DetailModalSidebarNavItem[] = [
  {
    key: LNB_DETAIL,
    label: '후원사 상세 정보',
    icon: <BulbOutlined className="detail-fullpage-modal__lnb-icon" />,
  },
  {
    key: LNB_PROGRAMS,
    label: '프로그램 진행 이력',
    icon: <UnorderedListOutlined className="detail-fullpage-modal__lnb-icon" />,
  },
]

export interface SponsorDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  sponsor: SponsorManagementRow | null
  onDeleteSponsor?: (sponsorId: string) => void
}

/**
 * 후원사 상세 풀페이지 모달 — 스폰서 미선택·닫힘 시 null, 본문은 `SponsorDetailFullPageModalInner`에 위임합니다.
 */
export function SponsorDetailFullPageModal(props: SponsorDetailFullPageModalProps) {
  if (!props.open || !props.sponsor) return null
  return <SponsorDetailFullPageModalInner key={props.sponsor.id} {...props} sponsor={props.sponsor} />
}

type SponsorDetailFullPageModalInnerProps = Omit<SponsorDetailFullPageModalProps, 'sponsor'> & {
  sponsor: SponsorManagementRow
}

function SponsorDetailFullPageModalInner({
  open,
  onClose,
  sponsor,
  onDeleteSponsor,
}: SponsorDetailFullPageModalInnerProps) {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const [lnbKey, setLnbKey] = useState(LNB_DETAIL)

  const sponsorDetail = useSponsorDetail(sponsor)
  const {
    detail,
    basicInfo,
    contacts,
    handleBasicInfoChange,
    isEditingBasicInfo,
    handleToggleBasicInfoEdit,
    programHistories,
    removeProgramHistoryRows,
  } = sponsorDetail

  const sponsorDelete = useSponsorDelete(sponsor, canWrite, onDeleteSponsor, onClose)
  const sponsorContacts = useSponsorContacts(sponsorDetail.contacts, sponsorDetail.setContacts, canWrite)
  const { registerModalOpen, setRegisterModalOpen, handleRegister } = sponsorContacts
  const programHistory = useProgramHistoryFilter(programHistories)
  const { contactColumns, programHistoryColumns } = useSponsorDetailModalTableColumns({
    contacts,
    canWrite,
    sponsorContacts,
    filteredProgramHistoryRowCount: programHistory.filteredRows.length,
  })

  const handleSelectLnbTop = useCallback((key: string): void => {
    setLnbKey(key)
  }, [])
  const handleSelectLnbChild = useCallback((_g: string, _c: string): void => {}, [])
  const handleCloseContactRegisterModal = useCallback((): void => {
    setRegisterModalOpen(false)
  }, [setRegisterModalOpen])
  const handleToggleBasicInfoClick = useCallback((): void => {
    handleToggleBasicInfoEdit(canWrite)
  }, [canWrite, handleToggleBasicInfoEdit])

  if (!basicInfo) return null

  return (
    <DetailFullPageModal
      open={open}
      onClose={onClose}
      title={`후원사 상세_${detail.nameDisplayKo}`}
      sidebar={
        <DetailModalSidebar
          navAriaLabel="후원사 상세 메뉴"
          items={SPONSOR_DETAIL_MODAL_SIDEBAR_ITEMS}
          activeKey={lnbKey}
          activeChildKey=""
          expandedGroupKeys={[]}
          onSelectTop={handleSelectLnbTop}
          onSelectChild={handleSelectLnbChild}
        />
      }
      contentExtra={
        lnbKey === LNB_DETAIL ? (
          <div className="info-section-wrapper">
            <span className="info-section-title">기본 정보</span>
            <div className="info-section-buttons--wrapper">
              <CmsButton variant="delete" size="medium" onClick={sponsorDelete.openDeleteModal} disabled={!canWrite}>
                후원사 삭제
              </CmsButton>
              <CmsButton variant="primary" size="medium" onClick={handleToggleBasicInfoClick} disabled={!canWrite}>
                {isEditingBasicInfo ? '수정 완료' : '정보 수정'}
              </CmsButton>
            </div>
          </div>
        ) : null
      }
    >
      {lnbKey === LNB_DETAIL ? (
        <SponsorDetailPanel
          basicInfo={basicInfo}
          isEditing={isEditingBasicInfo}
          onChange={handleBasicInfoChange}
          contacts={contacts}
          canWrite={canWrite}
          contactsProps={sponsorContacts}
          columns={contactColumns}
        />
      ) : (
        <SponsorProgramHistoryPanel
          {...programHistory}
          columns={programHistoryColumns}
          canWrite={canWrite}
          onRemoveProgramHistories={removeProgramHistoryRows}
        />
      )}
      <SponsorDeleteModal
        open={sponsorDelete.deleteModalOpen}
        onCancel={sponsorDelete.cancelDelete}
        onConfirm={sponsorDelete.handleConfirm}
        sponsorName={detail.nameDisplayKo}
      />
      <SponsorDeleteBlockedModal open={sponsorDelete.deleteBlockedModalOpen} onClose={sponsorDelete.closeBlockedModal} />
      <SponsorContactRegisterModal
        open={registerModalOpen}
        onCancel={handleCloseContactRegisterModal}
        onSubmit={handleRegister}
      />
    </DetailFullPageModal>
  )
}
