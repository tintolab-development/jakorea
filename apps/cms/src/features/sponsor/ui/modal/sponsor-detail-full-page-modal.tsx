import { useCallback, useEffect, useMemo } from 'react'
import { Spin } from 'antd'
import { useLocation, useSearchParams } from 'react-router-dom'
import {
  addSponsorContact,
  deleteSponsorContacts,
  updateSponsorContact,
} from '@/features/sponsor/api/admin-sponsors-service'
import { getDataManagementApiErrorMessage } from '@/features/data-management/api/get-data-management-api-error'
import type { SponsorContactsRemoteActions } from '@/features/sponsor/hooks/use-sponsor-contacts'
import { BulbOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import { useSponsorProgramHistoryFilter } from '@/features/sponsor/hooks/use-sponsor-program-history-filter'
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
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import {
  buildSearchParams,
  makeBreadcrumbItem,
} from '@/shared/lib/detail-fullpage-query-stack'
import { DetailModalSidebar, type DetailModalSidebarNavItem } from '@/shared/ui/detail-modal-sidebar'
import { CmsButton } from '@/shared/ui'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import './sponsor-detail-full-page-modal.css'

const LNB_DETAIL = 'sponsor-detail'
const LNB_PROGRAMS = 'sponsor-programs'
const SPONSOR_LNB_PARAM = 'sponsorLnb'
const SPONSOR_DETAIL_LNB_KEYS = [LNB_DETAIL, LNB_PROGRAMS] as const
type SponsorDetailLnbKey = (typeof SPONSOR_DETAIL_LNB_KEYS)[number]

function isSponsorDetailLnbKey(value: string | null): value is SponsorDetailLnbKey {
  return (SPONSOR_DETAIL_LNB_KEYS as readonly string[]).includes(value ?? '')
}

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
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const rawLnbKey = searchParams.get(SPONSOR_LNB_PARAM)
  const lnbKey: SponsorDetailLnbKey = isSponsorDetailLnbKey(rawLnbKey) ? rawLnbKey : LNB_DETAIL

  const sponsorDetail = useSponsorDetail(sponsor)
  const {
    detail,
    basicInfo,
    contacts,
    handleBasicInfoChange,
    isEditingBasicInfo,
    handleToggleBasicInfoEdit,
    removeProgramHistoryRows,
    programHistoryDeleteDisabled,
    refetchDetail,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = sponsorDetail

  const remoteContactActions = useMemo((): SponsorContactsRemoteActions => ({
      onRegister: async (payload, contactType) => {
        try {
          await addSponsorContact(sponsor.id, payload, contactType)
          await refetchDetail()
        } catch (error) {
          console.debug(
            'sponsorContact register failed',
            getDataManagementApiErrorMessage(error, '담당자 등록에 실패했습니다.')
          )
        }
      },
      onDelete: async ids => {
        try {
          await deleteSponsorContacts(ids)
          await refetchDetail()
        } catch (error) {
          console.debug(
            'sponsorContact delete failed',
            getDataManagementApiErrorMessage(error, '담당자 삭제에 실패했습니다.')
          )
        }
      },
      onTypeChange: async (row, nextType) => {
        try {
          await updateSponsorContact({ ...row, contactType: nextType })
          await refetchDetail()
        } catch (error) {
          console.debug(
            'sponsorContact type change failed',
            getDataManagementApiErrorMessage(error, '담당자 유형 변경에 실패했습니다.')
          )
        }
      },
  }), [refetchDetail, sponsor.id])

  const sponsorDelete = useSponsorDelete(sponsor, canWrite, onDeleteSponsor, onClose)
  const sponsorContacts = useSponsorContacts(
    sponsorDetail.contacts,
    sponsorDetail.setContacts,
    canWrite,
    remoteContactActions
  )
  const { registerModalOpen, setRegisterModalOpen, handleRegister } = sponsorContacts
  const programHistory = useSponsorProgramHistoryFilter(sponsor.id)
  const { contactColumns, programHistoryColumns } = useSponsorDetailModalTableColumns({
    contacts,
    canWrite,
    sponsorContacts,
    filteredProgramHistoryRowCount: programHistory.filteredRows.length,
  })

  useEffect(() => {
    if (!open) return
    const raw = searchParams.get(SPONSOR_LNB_PARAM)
    if (isSponsorDetailLnbKey(raw)) return
    const next = new URLSearchParams(searchParams)
    next.set('sponsorId', sponsor.id)
    next.set(SPONSOR_LNB_PARAM, LNB_DETAIL)
    setSearchParams(next, { replace: true })
  }, [open, searchParams, setSearchParams, sponsor.id])

  const handleSelectLnbTop = useCallback(
    (key: string): void => {
      if (!isSponsorDetailLnbKey(key)) return
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set('sponsorId', sponsor.id)
          next.set(SPONSOR_LNB_PARAM, key)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams, sponsor.id]
  )
  const handleSelectLnbChild = useCallback((_g: string, _c: string): void => {}, [])
  const handleCloseContactRegisterModal = useCallback((): void => {
    setRegisterModalOpen(false)
  }, [setRegisterModalOpen])
  const handleToggleBasicInfoClick = useCallback((): void => {
    handleToggleBasicInfoEdit(canWrite)
  }, [canWrite, handleToggleBasicInfoEdit])

  if (isDetailLoading && !basicInfo) {
    return (
      <DetailFullPageModal open={open} onClose={onClose} title="후원사 상세" className="sponsor-detail-fullpage-modal">
        <div className="sponsor-detail-fullpage-modal__loading">
          <Spin size="large" />
        </div>
      </DetailFullPageModal>
    )
  }

  if (isDetailError || !basicInfo) return null

  const title = `후원사 상세_${detail.nameDisplayKo}`
  const activeLnbItem =
    SPONSOR_DETAIL_MODAL_SIDEBAR_ITEMS.find(item => item.key === lnbKey) ??
    SPONSOR_DETAIL_MODAL_SIDEBAR_ITEMS[0]
  const headerBreadcrumbItems = [
    makeBreadcrumbItem(
      '후원사 관리',
      location.pathname,
      buildSearchParams(searchParams, { delete: ['sponsorId', SPONSOR_LNB_PARAM] })
    ),
    makeBreadcrumbItem(
      title,
      location.pathname,
      buildSearchParams(searchParams, {
        set: { sponsorId: sponsor.id, [SPONSOR_LNB_PARAM]: LNB_DETAIL },
      })
    ),
    { label: activeLnbItem.label },
  ]

  return (
    <DetailFullPageModal
      open={open}
      onClose={onClose}
      title={title}
      headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
      className="sponsor-detail-fullpage-modal"
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
          deleteDisabled={programHistoryDeleteDisabled}
          totalCount={programHistory.totalElements}
          loading={programHistory.isLoading}
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
        existingContactCount={contacts.length}
      />
    </DetailFullPageModal>
  )
}
