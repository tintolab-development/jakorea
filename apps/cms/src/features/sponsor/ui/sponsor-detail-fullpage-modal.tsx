import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { BulbOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Flex, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { buildSponsorManagementDetailView } from '@/data/mock/sponsor-management-detail'
import type {
  SponsorContactRow,
  SponsorProgramHistoryRow,
  SponsorManagementRow,
} from '@/features/sponsor/model/sponsor-management.types'
import {
  SponsorContactRegisterModal,
  type SponsorContactRegisterPayload,
} from '@/features/sponsor/ui/modal/sponsor-contact-register-modal'
import { SponsorDeleteBlockedModal } from '@/features/sponsor/ui/modal/sponsor-delete-blocked-modal'
import { SponsorDeleteModal } from '@/features/sponsor/ui/modal/sponsor-delete-modal'
import { SponsorContactTypeBadge } from '@/features/sponsor/ui/sponsor-contact-type-badge'
import {
  type BasicInfoEditState,
  SponsorBasicInfoSection,
  SponsorContactsSection,
} from '@/features/sponsor/ui/sponsor-detail-basic-info'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { StatusBadge } from '@/shared/components/status-badge'
import { FilterTableLayout, type FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import {
  DetailModalSidebar,
  type DetailModalSidebarNavItem,
} from '@/shared/ui/detail-modal-sidebar'
import { CmsButton } from '@/shared/ui'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { getEnrollmentDisplayStatusFromProgramLifecycle } from '@/shared/constants/status'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { buildProgressYearSelectOptions } from '@/shared/utils'
import { useAuthStore } from '@/features/auth/model/auth-store'

const LNB_DETAIL = 'sponsor-detail'
const LNB_PROGRAMS = 'sponsor-programs'
const CONTACT_TYPE_OPTIONS = [
  'lead',
  'assistant',
] as const satisfies readonly SponsorContactRow['contactType'][]
const ALL = ''

type SponsorProgramHistoryFilters = {
  title: string
  year: string
  lifecycleStatus: string
  educationTarget: string
  managerName: string
}

const INITIAL_PROGRAM_HISTORY_FILTERS: SponsorProgramHistoryFilters = {
  title: '',
  year: ALL,
  lifecycleStatus: ALL,
  educationTarget: ALL,
  managerName: '',
}

const LIFECYCLE_OPTIONS = [
  { label: '전체', value: ALL },
  { label: '프로그램 진행 예정', value: 'planned' },
  { label: '프로그램 진행 중', value: 'education_in_progress' },
  { label: '프로그램 진행 완료', value: 'education_completed' },
] as const

const EDUCATION_TARGET_OPTIONS = [
  { label: '전체', value: ALL },
  { label: '초등학생', value: 'elementary' },
  { label: '중학생', value: 'middle' },
  { label: '고등학생', value: 'high' },
  { label: '대학생', value: 'college' },
  { label: '성인', value: 'adult' },
] as const

const EDUCATION_TARGET_LABEL: Record<SponsorProgramHistoryRow['educationTarget'], string> = {
  elementary: '초등학생',
  middle: '중학생',
  high: '고등학생',
  college: '대학생',
  adult: '성인',
}

const programHistoryFilterFields: FilterFieldConfig[] = [
  {
    key: 'title',
    type: 'search',
    label: '프로그램명',
    placeholder: '프로그램명을 입력하세요',
    width: '20%',
  },
  {
    key: 'year',
    type: 'select',
    label: '진행년도',
    placeholder: '전체',
    options: buildProgressYearSelectOptions(ALL),
    width: '20%',
  },
  {
    key: 'lifecycleStatus',
    type: 'select',
    label: '프로그램 진행 현황',
    placeholder: '전체',
    options: [...LIFECYCLE_OPTIONS],
    width: '20%',
  },
  {
    key: 'educationTarget',
    type: 'select',
    label: '교육 대상',
    placeholder: '전체',
    options: [...EDUCATION_TARGET_OPTIONS],
    width: '20%',
  },
  {
    key: 'managerName',
    type: 'search',
    label: '담당자명',
    placeholder: '담당자명을 입력하세요',
    width: '20%',
  },
]

function splitAddress(address: string): { district: string; detailAddress: string } {
  const trimmed = address.trim()
  if (!trimmed) {
    return { district: '', detailAddress: '' }
  }
  const chunks = trimmed.split(' ').filter(Boolean)
  if (chunks.length <= 3) {
    return { district: trimmed, detailAddress: '' }
  }
  return {
    district: chunks.slice(0, 3).join(' '),
    detailAddress: chunks.slice(3).join(' '),
  }
}

export interface SponsorDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  sponsor: SponsorManagementRow | null
  onDeleteSponsor?: (sponsorId: string) => void
}

export function SponsorDetailFullPageModal({
  open,
  onClose,
  sponsor,
  onDeleteSponsor,
}: SponsorDetailFullPageModalProps) {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const [lnbKey, setLnbKey] = useState<string>(LNB_DETAIL)
  const [selectedContactKeys, setSelectedContactKeys] = useState<Key[]>([])
  const [contacts, setContacts] = useState<SponsorContactRow[]>([])
  const [openContactTypeDropdownId, setOpenContactTypeDropdownId] = useState<string | null>(null)
  const [contactRegisterModalOpen, setContactRegisterModalOpen] = useState(false)
  const [contactDeleteModalOpen, setContactDeleteModalOpen] = useState(false)
  const [sponsorDeleteModalOpen, setSponsorDeleteModalOpen] = useState(false)
  const [sponsorDeleteBlockedModalOpen, setSponsorDeleteBlockedModalOpen] = useState(false)
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false)
  const [basicInfo, setBasicInfo] = useState<BasicInfoEditState | null>(null)
  const [programHistoryPendingFilters, setProgramHistoryPendingFilters] =
    useState<SponsorProgramHistoryFilters>(INITIAL_PROGRAM_HISTORY_FILTERS)
  const [programHistoryFilters, setProgramHistoryFilters] = useState<SponsorProgramHistoryFilters>(
    INITIAL_PROGRAM_HISTORY_FILTERS
  )
  const [selectedProgramHistoryKeys, setSelectedProgramHistoryKeys] = useState<Key[]>([])

  useEffect(() => {
    if (sponsor?.id) {
      setLnbKey(LNB_DETAIL)
      setSelectedContactKeys([])
      setOpenContactTypeDropdownId(null)
      setContactRegisterModalOpen(false)
      setContactDeleteModalOpen(false)
      setSponsorDeleteModalOpen(false)
      setSponsorDeleteBlockedModalOpen(false)
      setIsEditingBasicInfo(false)
      setProgramHistoryPendingFilters(INITIAL_PROGRAM_HISTORY_FILTERS)
      setProgramHistoryFilters(INITIAL_PROGRAM_HISTORY_FILTERS)
      setSelectedProgramHistoryKeys([])
    }
  }, [sponsor?.id])

  const detail = useMemo(
    () => (sponsor ? buildSponsorManagementDetailView(sponsor) : null),
    [sponsor]
  )

  useEffect(() => {
    if (!detail) {
      setContacts([])
      setBasicInfo(null)
      return
    }
    setContacts(detail.contacts.map(contact => ({ ...contact })))
    const parsedAddress = splitAddress(detail.address)
    setBasicInfo({
      nameDisplayKo: detail.nameDisplayKo,
      nameDisplayEn: detail.nameDisplayEn,
      organizationKind: detail.organizationKind ?? 'corporate',
      businessNumber: detail.businessNumber,
      executives: detail.executives,
      district: parsedAddress.district,
      detailAddress: parsedAddress.detailAddress,
      sponsorshipStartDate: detail.sponsorshipStartDate,
      sponsorshipStatus: detail.sponsorshipStatus ?? 'active',
    })
  }, [detail])

  const sidebarItems = useMemo<DetailModalSidebarNavItem[]>(
    () => [
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
    ],
    []
  )

  const handleDeleteSponsor = useCallback(() => {
    if (!canWrite) return
    setSponsorDeleteModalOpen(true)
  }, [canWrite])

  const handleCancelSponsorDelete = useCallback(() => {
    setSponsorDeleteModalOpen(false)
  }, [])

  const handleCloseSponsorDeleteBlocked = useCallback(() => {
    setSponsorDeleteBlockedModalOpen(false)
  }, [])

  const handleConfirmSponsorDelete = useCallback(() => {
    if (!sponsor) return
    if ((sponsor.programCount ?? 0) > 0) {
      setSponsorDeleteModalOpen(false)
      setSponsorDeleteBlockedModalOpen(true)
      return
    }
    onDeleteSponsor?.(sponsor.id)
    setSponsorDeleteModalOpen(false)
    onClose()
  }, [onClose, onDeleteSponsor, sponsor])

  const handleToggleEditBasicInfo = useCallback(() => {
    if (!canWrite || !detail || !basicInfo) return
    if (isEditingBasicInfo) {
      setIsEditingBasicInfo(false)
      return
    }
    const parsedAddress = splitAddress(detail.address)
    setBasicInfo({
      nameDisplayKo: detail.nameDisplayKo,
      nameDisplayEn: detail.nameDisplayEn,
      organizationKind: detail.organizationKind ?? 'corporate',
      businessNumber: detail.businessNumber,
      executives: detail.executives,
      district: parsedAddress.district,
      detailAddress: parsedAddress.detailAddress,
      sponsorshipStartDate: detail.sponsorshipStartDate,
      sponsorshipStatus: detail.sponsorshipStatus ?? 'active',
    })
    setIsEditingBasicInfo(true)
  }, [basicInfo, canWrite, detail, isEditingBasicInfo])

  const handleContactRegister = useCallback(() => {
    if (!canWrite) return
    setContactRegisterModalOpen(true)
  }, [canWrite])

  const handleCloseContactRegisterModal = useCallback(() => {
    setContactRegisterModalOpen(false)
  }, [])

  const handleSubmitContactRegisterModal = useCallback(
    (payload: SponsorContactRegisterPayload) => {
      setContacts(prev => {
        const nextIndex = prev.length + 1
        const nextContact: SponsorContactRow = {
          id: `contact-${Date.now()}-${nextIndex}`,
          name: payload.name,
          position: payload.position,
          phone: payload.phone,
          email: payload.email,
          registeredAt: new Date().toISOString(),
          contactType: payload.contactType,
        }
        return [nextContact, ...prev]
      })
      setContactRegisterModalOpen(false)
    },
    []
  )

  const selectedContactNames = useMemo(() => {
    if (selectedContactKeys.length === 0) return []
    const selectedSet = new Set(selectedContactKeys.map(key => String(key)))
    return contacts.filter(contact => selectedSet.has(contact.id)).map(contact => contact.name)
  }, [contacts, selectedContactKeys])

  const handleOpenContactDeleteModal = useCallback(() => {
    if (!canWrite || selectedContactKeys.length === 0) return
    setContactDeleteModalOpen(true)
  }, [canWrite, selectedContactKeys.length])

  const handleCloseContactDeleteModal = useCallback(() => {
    setContactDeleteModalOpen(false)
  }, [])

  const handleConfirmContactDelete = useCallback(() => {
    const selectedSet = new Set(selectedContactKeys.map(key => String(key)))
    setContacts(prev => prev.filter(contact => !selectedSet.has(contact.id)))
    setSelectedContactKeys([])
    setContactDeleteModalOpen(false)
  }, [selectedContactKeys])

  const handleProgramHistoryFilterChange = useCallback(
    (key: string, value: string) => {
      setProgramHistoryPendingFilters(prev => ({ ...prev, [key]: value ?? '' }))
    },
    [setProgramHistoryPendingFilters]
  )

  const handleProgramHistorySearch = useCallback(() => {
    setProgramHistoryFilters(programHistoryPendingFilters)
  }, [programHistoryPendingFilters])

  const programHistoryRows = useMemo(() => {
    if (!detail) return []

    const titleQuery = programHistoryFilters.title.trim().toLowerCase()
    const managerQuery = programHistoryFilters.managerName.trim().toLowerCase()

    return detail.programHistories.filter(row => {
      if (titleQuery && !row.title.toLowerCase().includes(titleQuery)) return false
      if (programHistoryFilters.year !== ALL && String(row.year) !== programHistoryFilters.year) {
        return false
      }

      if (programHistoryFilters.lifecycleStatus !== ALL) {
        if (programHistoryFilters.lifecycleStatus === 'planned') {
          if (
            row.lifecycleStatus !== 'planned' &&
            row.lifecycleStatus !== 'instructor_recruitment_planned' &&
            row.lifecycleStatus !== 'volunteer_recruitment_planned' &&
            row.lifecycleStatus !== 'participant_instructor_recruitment_planned'
          ) {
            return false
          }
        } else if (programHistoryFilters.lifecycleStatus === 'education_in_progress') {
          if (
            row.lifecycleStatus !== 'education_in_progress' &&
            row.lifecycleStatus !== 'education_before_textbook' &&
            row.lifecycleStatus !== 'education_after_textbook' &&
            row.lifecycleStatus !== 'matching_completed'
          ) {
            return false
          }
        } else if (programHistoryFilters.lifecycleStatus === 'education_completed') {
          if (
            row.lifecycleStatus !== 'education_completed' &&
            row.lifecycleStatus !== 'document_processing_completed' &&
            row.lifecycleStatus !== 'participant_instructor_recruitment_completed'
          ) {
            return false
          }
        }
      }

      if (
        programHistoryFilters.educationTarget !== ALL &&
        row.educationTarget !== programHistoryFilters.educationTarget
      ) {
        return false
      }

      if (managerQuery && !row.managerName.toLowerCase().includes(managerQuery)) return false

      return true
    })
  }, [detail, programHistoryFilters])

  const handleDeleteProgramHistory = useCallback(() => {
    if (!canWrite || selectedProgramHistoryKeys.length === 0) return
    window.alert('준비 중입니다.')
  }, [canWrite, selectedProgramHistoryKeys.length])

  const programHistoryColumns: ColumnsType<SponsorProgramHistoryRow> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        align: 'center',
        render: (_: unknown, __: SponsorProgramHistoryRow, index: number) =>
          programHistoryRows.length - index,
      },
      {
        title: '프로그램명',
        dataIndex: 'title',
        key: 'title',
        width: 360,
        ellipsis: true,
      },
      {
        title: '진행년도',
        dataIndex: 'year',
        key: 'year',
        width: 90,
        align: 'center',
        render: (year: number) => `${year}년`,
      },
      {
        title: '프로그램 진행 현황',
        key: 'lifecycleStatus',
        width: 160,
        align: 'center',
        render: (_: unknown, row: SponsorProgramHistoryRow) => (
          <StatusBadge
            domain="programEnrollment"
            status={getEnrollmentDisplayStatusFromProgramLifecycle(row.lifecycleStatus)}
            variant="text"
          />
        ),
      },
      {
        title: '담당자명',
        dataIndex: 'managerName',
        key: 'managerName',
        width: 100,
        ellipsis: true,
        align: 'center',
      },
      {
        title: '참여자 모집 인원',
        dataIndex: 'participantCount',
        key: 'participantCount',
        width: 130,
        align: 'center',
      },
      {
        title: '참여자 유형',
        key: 'participantType',
        width: 120,
        align: 'center',
        render: (_: unknown, row: SponsorProgramHistoryRow) => {
          if (row.participantType === 'school') return '학교/기관'
          if (row.participantType === 'volunteer') return '봉사자'
          return '개인 학습자'
        },
      },
      {
        title: '교육 대상',
        key: 'educationTarget',
        width: 120,
        align: 'center',
        render: (_: unknown, row: SponsorProgramHistoryRow) =>
          EDUCATION_TARGET_LABEL[row.educationTarget],
      },
    ],
    [programHistoryRows.length]
  )

  const contactColumns: ColumnsType<SponsorContactRow> = useMemo(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        align: 'center',
        render: (_: unknown, __: SponsorContactRow, index: number) => contacts.length - index,
      },
      {
        title: '담당자명',
        dataIndex: 'name',
        key: 'name',
        width: TABLE_COLUMN_WIDTHS.name,
        ellipsis: true,
      },
      {
        title: '직급',
        dataIndex: 'position',
        key: 'position',
        width: 100,
        ellipsis: true,
      },
      {
        title: '연락처',
        dataIndex: 'phone',
        key: 'phone',
        width: TABLE_COLUMN_WIDTHS.phone,
        ellipsis: true,
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: TABLE_COLUMN_WIDTHS.email,
        ellipsis: true,
      },
      {
        title: '등록일시',
        dataIndex: 'registeredAt',
        key: 'registeredAt',
        width: 170,
        render: (v: string) => dayjs(v).format('YYYY.MM.DD HH:mm'),
      },
      {
        title: '담당자 유형',
        dataIndex: 'contactType',
        key: 'contactType',
        width: 150,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (_: SponsorContactRow['contactType'], row: SponsorContactRow) => (
          <StatusDropdownCell<SponsorContactRow['contactType']>
            status={row.contactType}
            statusOptions={CONTACT_TYPE_OPTIONS}
            renderBadge={type => <SponsorContactTypeBadge type={type} />}
            isItemDisabled={(cur, opt) => cur === opt}
            onChange={
              canWrite
                ? nextType => {
                    setContacts(prev =>
                      prev.map(contact =>
                        contact.id === row.id ? { ...contact, contactType: nextType } : contact
                      )
                    )
                    setOpenContactTypeDropdownId(null)
                  }
                : undefined
            }
            isOpen={openContactTypeDropdownId === row.id}
            onOpenChange={open => setOpenContactTypeDropdownId(open ? row.id : null)}
          />
        ),
      },
    ],
    [canWrite, contacts.length, openContactTypeDropdownId]
  )

  if (!open || !sponsor || !detail || !basicInfo) {
    return null
  }

  return (
    <DetailFullPageModal
      open={open}
      onClose={onClose}
      title={`후원사 상세_${detail.nameDisplayKo}`}
      sidebar={
        <DetailModalSidebar
          navAriaLabel="후원사 상세 메뉴"
          items={sidebarItems}
          activeKey={lnbKey}
          activeChildKey=""
          expandedGroupKeys={[]}
          onSelectTop={key => setLnbKey(key)}
          onSelectChild={() => {}}
        />
      }
      contentExtra={
        lnbKey === LNB_DETAIL ? (
          <div className="info-section-wrapper">
            <span className="info-section-title">기본 정보</span>
            <div className="info-section-buttons--wrapper">
              <CmsButton
                variant="delete"
                size="medium"
                onClick={handleDeleteSponsor}
                disabled={!canWrite}
              >
                후원사 삭제
              </CmsButton>
              <CmsButton
                variant="primary"
                size="medium"
                onClick={handleToggleEditBasicInfo}
                disabled={!canWrite}
              >
                {isEditingBasicInfo ? '수정 완료' : '정보 수정'}
              </CmsButton>
            </div>
          </div>
        ) : null
      }
    >
      {lnbKey === LNB_DETAIL ? (
        <Flex vertical gap="large">
          <SponsorBasicInfoSection
            value={basicInfo}
            isEditing={isEditingBasicInfo}
            onChange={updater => setBasicInfo(prev => (prev ? updater(prev) : prev))}
          />
          <SponsorContactsSection
            contacts={contacts}
            canWrite={canWrite}
            selectedContactKeys={selectedContactKeys}
            onSelectionChange={keys => setSelectedContactKeys(keys.map(k => String(k)))}
            columns={contactColumns}
            onDeleteClick={handleOpenContactDeleteModal}
            onRegisterClick={handleContactRegister}
            deleteModalOpen={contactDeleteModalOpen}
            deleteTargetNames={selectedContactNames}
            onDeleteCancel={handleCloseContactDeleteModal}
            onDeleteConfirm={handleConfirmContactDelete}
          />
        </Flex>
      ) : (
        <FilterTableLayout
          bordered={false}
          fields={programHistoryFilterFields}
          filters={{
            title: programHistoryPendingFilters.title,
            year: programHistoryPendingFilters.year,
            lifecycleStatus: programHistoryPendingFilters.lifecycleStatus,
            educationTarget: programHistoryPendingFilters.educationTarget,
            managerName: programHistoryPendingFilters.managerName,
          }}
          onFilterChange={handleProgramHistoryFilterChange}
          onSearch={handleProgramHistorySearch}
          title="프로그램 진행 이력"
          description={`총 ${programHistoryRows.length.toLocaleString()}건`}
          actions={
            <CmsButton
              variant="delete"
              onClick={handleDeleteProgramHistory}
              disabled={!canWrite || selectedProgramHistoryKeys.length === 0}
            >
              이력 삭제
            </CmsButton>
          }
        >
          <Table<SponsorProgramHistoryRow>
            rowKey="id"
            className="cms-data-table"
            columns={programHistoryColumns}
            dataSource={programHistoryRows}
            pagination={false}
            scroll={{ x: 'max-content' }}
            rowSelection={
              canWrite
                ? {
                    columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                    selectedRowKeys: selectedProgramHistoryKeys,
                    onChange: keys => setSelectedProgramHistoryKeys(keys.map(k => String(k))),
                    preserveSelectedRowKeys: false,
                  }
                : undefined
            }
          />
        </FilterTableLayout>
      )}
      <SponsorDeleteModal
        open={sponsorDeleteModalOpen}
        onCancel={handleCancelSponsorDelete}
        onConfirm={handleConfirmSponsorDelete}
        sponsorName={detail.nameDisplayKo}
      />
      <SponsorDeleteBlockedModal
        open={sponsorDeleteBlockedModalOpen}
        onClose={handleCloseSponsorDeleteBlocked}
      />
      <SponsorContactRegisterModal
        open={contactRegisterModalOpen}
        onCancel={handleCloseContactRegisterModal}
        onSubmit={handleSubmitContactRegisterModal}
      />
    </DetailFullPageModal>
  )
}
