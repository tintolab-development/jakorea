import { useState, type Key } from 'react'
import { Flex, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type {
  SponsorContactRow,
  SponsorManagementRow,
} from '@/features/sponsor/model/sponsor-management.types'
import { SponsorContactDeleteModal } from '@/features/sponsor/ui/modal/sponsor-contact-delete-modal'
import { SponsorSponsorshipStatusBadge } from '@/features/sponsor/ui/sponsor-sponsorship-status-badge'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { StatusDropdownCell } from '@/shared/components/status-dropdown-cell'
import { AddressSearch, CmsButton, CmsInput, CmsRadioGroup } from '@/shared/ui'
import type { SponsorOrganizationKind } from '@/types/domain'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import './sponsor-detail-basic-info.css'

const ORG_LABEL: Record<SponsorOrganizationKind, string> = {
  corporate: '기업',
  foundation: '재단',
}

const SPONSORSHIP_STATUS_OPTIONS = ['active', 'ended'] as const
type SponsorshipStatus = NonNullable<SponsorManagementRow['sponsorshipStatus']>

export type BasicInfoEditState = {
  nameDisplayKo: string
  nameDisplayEn: string
  organizationKind: SponsorOrganizationKind
  businessNumber: string
  executives: string
  district: string
  detailAddress: string
  sponsorshipStartDate?: SponsorManagementRow['sponsorshipStartDate']
  sponsorshipStatus: SponsorManagementRow['sponsorshipStatus']
}

interface SponsorBasicInfoSectionProps {
  value: BasicInfoEditState
  isEditing: boolean
  onChange: (updater: (prev: BasicInfoEditState) => BasicInfoEditState) => void
  /** true면 조회 모드에서도 후원 상태를 배지·드롭다운으로 변경 가능 */
  canWrite?: boolean
}

export function SponsorBasicInfoSection({
  value,
  isEditing,
  onChange,
  canWrite = false,
}: SponsorBasicInfoSectionProps) {
  const [isSponsorshipStatusDropdownOpen, setIsSponsorshipStatusDropdownOpen] = useState(false)

  const sponsorshipStartDisplay = value.sponsorshipStartDate
    ? dayjs(value.sponsorshipStartDate).format('YYYY.MM.DD')
    : '-'

  const sponsorshipStatusFieldContent =
    canWrite ? (
      <StatusDropdownCell<SponsorshipStatus>
        status={value.sponsorshipStatus ?? 'active'}
        statusOptions={SPONSORSHIP_STATUS_OPTIONS}
        renderBadge={status => (
          <SponsorSponsorshipStatusBadge status={status} variant="table" />
        )}
        isItemDisabled={(currentStatus, optionStatus) => currentStatus === optionStatus}
        onChange={next =>
          onChange(prev => ({
            ...prev,
            sponsorshipStatus: next,
          }))
        }
        isOpen={isSponsorshipStatusDropdownOpen}
        onOpenChange={setIsSponsorshipStatusDropdownOpen}
        style={{ width: '120px' }}
      />
    ) : (
      <SponsorSponsorshipStatusBadge status={value.sponsorshipStatus ?? 'active'} variant="table" />
    )

  return (
    <DetailInfoForm title="기본 정보" hideHeader mode={isEditing ? 'edit' : 'view'}>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.NameBlock
          title="후원사명"
          rows={[
            {
              subLabel: '한글',
              main: isEditing ? (
                <CmsInput
                  value={value.nameDisplayKo}
                  onChange={event =>
                    onChange(prev => ({ ...prev, nameDisplayKo: event.target.value }))
                  }
                  placeholder="후원사명(한글)"
                  inputSize="medium"
                  width="100%"
                />
              ) : (
                <span>{value.nameDisplayKo}</span>
              ),
              sideLabel: '구분',
              side: isEditing ? (
                <CmsRadioGroup
                  value={value.organizationKind}
                  onChange={event =>
                    onChange(prev => ({
                      ...prev,
                      organizationKind: event.target.value as SponsorOrganizationKind,
                    }))
                  }
                  options={[
                    { label: '기업', value: 'corporate' },
                    { label: '재단', value: 'foundation' },
                  ]}
                  size="medium"
                />
              ) : (
                <span>{ORG_LABEL[value.organizationKind]}</span>
              ),
            },
            {
              subLabel: '영문',
              main: isEditing ? (
                <CmsInput
                  value={value.nameDisplayEn}
                  onChange={event =>
                    onChange(prev => ({ ...prev, nameDisplayEn: event.target.value }))
                  }
                  placeholder="후원사명(영문)"
                  inputSize="medium"
                  width="100%"
                />
              ) : (
                <span>{value.nameDisplayEn}</span>
              ),
              sideLabel: '사업자번호',
              side: isEditing ? (
                <CmsInput
                  value={value.businessNumber}
                  onChange={event =>
                    onChange(prev => ({ ...prev, businessNumber: event.target.value }))
                  }
                  placeholder="사업자 번호"
                  inputSize="medium"
                  width="100%"
                />
              ) : (
                <span>{value.businessNumber}</span>
              ),
            },
          ]}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="대표이사"
          view={<span>{value.executives}</span>}
          edit={
            <CmsInput
              value={value.executives}
              onChange={event => onChange(prev => ({ ...prev, executives: event.target.value }))}
              placeholder="대표이사"
              inputSize="medium"
              width="100%"
            />
          }
        />
        <DetailInfoForm.Field
          label="소재지"
          view={
            <span>{[value.district, value.detailAddress].filter(Boolean).join(' ') || '-'}</span>
          }
          edit={
            <Space.Compact block>
              <AddressSearch
                value={value.district}
                onChange={next => onChange(prev => ({ ...prev, district: next }))}
                onSelect={() => onChange(prev => ({ ...prev, detailAddress: '' }))}
                inputSize="medium"
                width="100%"
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                value={value.detailAddress}
                onChange={event =>
                  onChange(prev => ({ ...prev, detailAddress: event.target.value }))
                }
                placeholder="상세 주소"
                inputSize="medium"
                width="100%"
              />
            </Space.Compact>
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double" className="sponsor-detail-basic-info__status-row">
        <DetailInfoForm.Field
          label="후원 시작일"
          view={<span>{sponsorshipStartDisplay}</span>}
          edit={<span>{sponsorshipStartDisplay}</span>}
        />
        <DetailInfoForm.Field
          label="후원 상태"
          view={sponsorshipStatusFieldContent}
          edit={sponsorshipStatusFieldContent}
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}

interface SponsorContactsSectionProps {
  contacts: SponsorContactRow[]
  canWrite: boolean
  selectedContactKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  columns: ColumnsType<SponsorContactRow>
  onDeleteClick: () => void
  onRegisterClick: () => void
  deleteModalOpen: boolean
  deleteTargetNames: string[]
  onDeleteCancel: () => void
  onDeleteConfirm: () => void
}

export function SponsorContactsSection({
  contacts,
  canWrite,
  selectedContactKeys,
  onSelectionChange,
  columns,
  onDeleteClick,
  onRegisterClick,
  deleteModalOpen,
  deleteTargetNames,
  onDeleteCancel,
  onDeleteConfirm,
}: SponsorContactsSectionProps) {
  return (
    <Flex vertical gap="middle">
      <div className="info-section-wrapper">
        <div>
          <span className="info-section-title">담당자 목록</span>
          <span className="info-section-desc">{contacts.length}건</span>
        </div>

        <div className="info-section-buttons--wrapper">
          <CmsButton
            variant="delete"
            size="medium"
            onClick={onDeleteClick}
            disabled={!canWrite || selectedContactKeys.length === 0}
          >
            담당자 삭제
          </CmsButton>
          <CmsButton variant="primary" size="medium" onClick={onRegisterClick} disabled={!canWrite}>
            담당자 등록
          </CmsButton>
        </div>
      </div>
      <Table<SponsorContactRow>
        rowKey="id"
        className="cms-data-table"
        columns={columns}
        dataSource={contacts}
        pagination={false}
        rowSelection={
          canWrite
            ? {
                columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                selectedRowKeys: selectedContactKeys,
                onChange: onSelectionChange,
                preserveSelectedRowKeys: false,
              }
            : undefined
        }
      />
      <SponsorContactDeleteModal
        open={deleteModalOpen}
        onCancel={onDeleteCancel}
        onConfirm={onDeleteConfirm}
        contactNames={deleteTargetNames}
      />
    </Flex>
  )
}
