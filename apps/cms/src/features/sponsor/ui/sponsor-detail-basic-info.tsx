import { useState, type Key } from 'react'
import { Flex, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type {
  SponsorContactRow,
  SponsorLogoFile,
  SponsorManagementRow,
} from '@/features/sponsor/model/sponsor-management.types'
import { SPONSOR_SPONSORSHIP_STATUS_VALUES } from '@/features/sponsor/model/sponsorship-status'
import { SponsorContactDeleteModal } from '@/features/sponsor/ui/modal/sponsor-contact-delete-modal'
import { SponsorSponsorshipStatusBadge } from '@/features/sponsor/ui/sponsor-sponsorship-status-badge'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import {
  AddressSearch,
  CmsBusinessNumberInput,
  CmsButton,
  CmsDatePicker,
  CmsInput,
  CmsRadioGroup,
  FileSelectField,
} from '@/shared/ui'
import { FileDownloadRowIcon } from '@/shared/ui/icons/FileDownloadRowIcon'
import type { SponsorOrganizationKind } from '@/types/domain'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { formatKoreanBusinessNumber } from '@jakorea/domain/shared/korean-business-number'
import './sponsor-detail-basic-info.css'

const ORG_LABEL: Record<SponsorOrganizationKind, string> = {
  corporate: '기업',
  foundation: '재단',
}

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
  homepageUrl: string
  securityMemo: string
  logos: SponsorLogoFile[]
  pendingLogoFiles: File[]
}

const LOGO_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

function displayText(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  return trimmed.length > 0 ? trimmed : '-'
}

function HomepageValue({ url }: { url: string }) {
  const trimmed = url.trim()
  if (!trimmed) return <span>-</span>
  const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {trimmed}
    </a>
  )
}

function SponsorLogoViewList({ files }: { files: SponsorLogoFile[] }) {
  if (files.length === 0) return <span>-</span>
  return (
    <ul className="sponsor-detail-basic-info__logos">
      {files.map(file => (
        <li key={file.id} className="sponsor-detail-basic-info__logo-item">
          <span className="sponsor-detail-basic-info__logo-name">{file.fileName}</span>
          <span className="sponsor-detail-basic-info__logo-download" aria-hidden>
            <FileDownloadRowIcon />
          </span>
        </li>
      ))}
    </ul>
  )
}

interface SponsorBasicInfoSectionProps {
  value: BasicInfoEditState
  isEditing: boolean
  onChange: (updater: (prev: BasicInfoEditState) => BasicInfoEditState) => void
  /** 조회 모드에서도 후원 상태 드롭다운으로 즉시 변경(API). 수정 모드에서는 로컬만. */
  onSponsorshipStatusChange?: (next: SponsorshipStatus) => void
  /** true면 조회 모드에서도 후원 상태를 배지·드롭다운으로 변경 가능 */
  canWrite?: boolean
}

export function SponsorBasicInfoSection({
  value,
  isEditing,
  onChange,
  onSponsorshipStatusChange,
  canWrite = false,
}: SponsorBasicInfoSectionProps) {
  const [isSponsorshipStatusDropdownOpen, setIsSponsorshipStatusDropdownOpen] = useState(false)

  const sponsorshipStartDisplay = value.sponsorshipStartDate
    ? dayjs(value.sponsorshipStartDate).format('YYYY.MM.DD')
    : '-'

  const sponsorshipStatusFieldContent =
    canWrite ? (
      <span className={STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME}>
        <StatusDropdownCell<SponsorshipStatus>
          status={value.sponsorshipStatus ?? 'active'}
          statusOptions={SPONSOR_SPONSORSHIP_STATUS_VALUES}
          renderBadge={status => <SponsorSponsorshipStatusBadge status={status} />}
          isItemDisabled={(currentStatus, optionStatus) => currentStatus === optionStatus}
          onChange={next => {
            if (onSponsorshipStatusChange) {
              onSponsorshipStatusChange(next)
              return
            }
            onChange(prev => ({
              ...prev,
              sponsorshipStatus: next,
            }))
          }}
          isOpen={isSponsorshipStatusDropdownOpen}
          onOpenChange={setIsSponsorshipStatusDropdownOpen}
          tagLayout="tag100"
        />
      </span>
    ) : (
      <SponsorSponsorshipStatusBadge status={value.sponsorshipStatus ?? 'active'} />
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
                <CmsBusinessNumberInput
                  value={value.businessNumber}
                  onChange={event =>
                    onChange(prev => ({ ...prev, businessNumber: event.target.value }))
                  }
                  placeholder="000-00-00000"
                  inputSize="medium"
                  width="100%"
                />
              ) : (
                <span>
                  {value.businessNumber
                    ? formatKoreanBusinessNumber(value.businessNumber)
                    : '-'}
                </span>
              ),
            },
          ]}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double" className="sponsor-detail-basic-info__status-row">
        <DetailInfoForm.Field
          label="후원 시작일"
          view={<span>{sponsorshipStartDisplay}</span>}
          edit={
            <CmsDatePicker
              value={value.sponsorshipStartDate ? dayjs(value.sponsorshipStartDate) : null}
              onChange={date =>
                onChange(prev => ({
                  ...prev,
                  sponsorshipStartDate: date ? date.startOf('day').toISOString() : undefined,
                }))
              }
              placeholder="후원 시작일을 입력하세요"
              format="YYYY.MM.DD"
              allowClear
              style={{ width: '100%' }}
            />
          }
        />
        <DetailInfoForm.Field
          label="후원 상태"
          view={sponsorshipStatusFieldContent}
          edit={sponsorshipStatusFieldContent}
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="대표이사"
          view={<span>{displayText(value.executives)}</span>}
          edit={
            <CmsInput
              value={value.executives}
              onChange={event => onChange(prev => ({ ...prev, executives: event.target.value }))}
              placeholder="대표이사명을 입력하세요"
              inputSize="medium"
              width="100%"
            />
          }
        />
        <DetailInfoForm.Field
          label="소재지"
          view={
            <span>{displayText([value.district, value.detailAddress].filter(Boolean).join(' '))}</span>
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
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="홈페이지"
          view={<HomepageValue url={value.homepageUrl} />}
          edit={
            <CmsInput
              value={value.homepageUrl}
              onChange={event => onChange(prev => ({ ...prev, homepageUrl: event.target.value }))}
              placeholder="홈페이지 주소를 입력하세요"
              inputSize="medium"
              width="100%"
            />
          }
        />
        <DetailInfoForm.Field
          label="후원사 로고"
          view={<SponsorLogoViewList files={value.logos} />}
          edit={
            <FileSelectField
              multiple
              accept=".jpg,.jpeg,.png"
              buttonLabel="파일 추가"
              fileNames={[
                ...value.logos.map(file => file.fileName),
                ...value.pendingLogoFiles.map(file => file.name),
              ]}
              currentTotalBytes={value.pendingLogoFiles.reduce((sum, file) => sum + file.size, 0)}
              onFilesChange={files =>
                onChange(prev => ({
                  ...prev,
                  pendingLogoFiles: [...prev.pendingLogoFiles, ...files],
                }))
              }
              onRemoveFile={index =>
                onChange(prev => {
                  if (index < prev.logos.length) {
                    return { ...prev, logos: prev.logos.filter((_, i) => i !== index) }
                  }
                  const pendingIndex = index - prev.logos.length
                  return {
                    ...prev,
                    pendingLogoFiles: prev.pendingLogoFiles.filter((_, i) => i !== pendingIndex),
                  }
                })
              }
              guideLines={LOGO_GUIDE_LINES}
            />
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="비고"
          colSpan={2}
          view={<span>{displayText(value.securityMemo)}</span>}
          edit={
            <CmsInput
              value={value.securityMemo}
              onChange={event => onChange(prev => ({ ...prev, securityMemo: event.target.value }))}
              placeholder="비고를 입력하세요"
              inputSize="medium"
              width="100%"
            />
          }
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
            disabled={selectedContactKeys.length === 0}
          >
            담당자 삭제
          </CmsButton>
          <CmsButton variant="primary" size="medium" onClick={onRegisterClick}>
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
