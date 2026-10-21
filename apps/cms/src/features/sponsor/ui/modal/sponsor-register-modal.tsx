import { useCallback, useEffect, useMemo, useState } from 'react'
import { Space } from 'antd'
import dayjs from 'dayjs'
import type { SponsorRegisterPayload } from '@/features/sponsor/model/sponsor-management.types'
import { SPONSOR_SPONSORSHIP_STATUS_VALUES } from '@/features/sponsor/model/sponsorship-status'
import { SponsorSponsorshipStatusBadge } from '@/features/sponsor/ui/sponsor-sponsorship-status-badge'
import {
  STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME,
  StatusDropdownCell,
} from '@/shared/components/status-dropdown-cell'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { LAYOUT_CONSTANTS } from '@/shared/constants'
import {
  mergeSponsorLogoFiles,
  SPONSOR_LOGO_ACCEPT,
  SPONSOR_LOGO_GUIDE_LINES,
  validateSponsorLogoSelection,
} from '@/features/sponsor/lib/sponsor-logo-file-policy'
import {
  AddressSearch,
  CmsBusinessNumberInput,
  CmsButton,
  CmsDatePicker,
  CmsInput,
  CmsRadioGroup,
  ContentModal,
  FileSelectField,
  useCmsAlert,
} from '@/shared/ui'
import type { SponsorOrganizationKind, SponsorSponsorshipStatus } from '@/types/domain'

export interface SponsorRegisterModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (payload: SponsorRegisterPayload) => void | Promise<void>
  submitting?: boolean
}

type FormState = {
  nameDisplayKo: string
  nameDisplayEn: string
  organizationKind: SponsorOrganizationKind
  businessNumber: string
  sponsorshipStartDate: string
  sponsorshipStatus: SponsorSponsorshipStatus
  executives: string
  district: string
  detailAddress: string
  homepageUrl: string
  securityMemo: string
  logoFiles: File[]
}

const emptyForm = (): FormState => ({
  nameDisplayKo: '',
  nameDisplayEn: '',
  organizationKind: 'corporate',
  businessNumber: '',
  sponsorshipStartDate: '',
  sponsorshipStatus: 'active',
  executives: '',
  district: '',
  detailAddress: '',
  homepageUrl: '',
  securityMemo: '',
  logoFiles: [],
})

export function SponsorRegisterModal({
  open,
  onCancel,
  onSubmit,
  submitting = false,
}: SponsorRegisterModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isSponsorshipStatusOpen, setIsSponsorshipStatusOpen] = useState(false)
  const { showAlert } = useCmsAlert()

  /* eslint-disable react-hooks/set-state-in-effect -- 모달이 열릴 때 등록 폼을 초기 상태로 리셋 */
  useEffect(() => {
    if (open) {
      setForm(emptyForm())
      setIsSponsorshipStatusOpen(false)
    }
  }, [open])
  /* eslint-enable react-hooks/set-state-in-effect */

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSubmit = useCallback((): void => {
    const nameDisplayKo = form.nameDisplayKo.trim()
    const nameDisplayEn = form.nameDisplayEn.trim()
    if (!nameDisplayKo || !nameDisplayEn || !form.sponsorshipStartDate) return

    onSubmit({
      nameDisplayKo,
      nameDisplayEn,
      organizationKind: form.organizationKind,
      businessNumber: form.businessNumber,
      sponsorshipStartDate: form.sponsorshipStartDate,
      sponsorshipStatus: form.sponsorshipStatus,
      executives: form.executives,
      district: form.district,
      detailAddress: form.detailAddress,
      homepageUrl: form.homepageUrl,
      securityMemo: form.securityMemo,
      logoFiles: form.logoFiles,
    })
  }, [form, onSubmit])

  const noopView = <span />

  const canSubmit = useMemo(
    () =>
      form.nameDisplayKo.trim().length > 0 &&
      form.nameDisplayEn.trim().length > 0 &&
      form.sponsorshipStartDate.length > 0,
    [form.nameDisplayEn, form.nameDisplayKo, form.sponsorshipStartDate]
  )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="후원사 신규 등록"
      width={LAYOUT_CONSTANTS.widths.modal.large}
      footer={
        <>
          <CmsButton variant="secondary" type="button" disabled={submitting} onClick={onCancel}>
            닫기
          </CmsButton>
          <CmsButton
            variant="primary"
            type="button"
            disabled={!canSubmit || submitting}
            loading={submitting}
            onClick={handleSubmit}
          >
            신규 등록
          </CmsButton>
        </>
      }
    >
      <DetailInfoForm title="기본 정보" mode="edit">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="후원사명 (국문)"
            required
            view={noopView}
            edit={
              <CmsInput
                value={form.nameDisplayKo}
                onChange={e => setField('nameDisplayKo', e.target.value)}
                placeholder="후원사명(국문)을 입력하세요"
                inputSize="small"
                width="100%"
              />
            }
          />
          <DetailInfoForm.Field
            label="후원사명 (영문)"
            required
            view={noopView}
            edit={
              <CmsInput
                value={form.nameDisplayEn}
                onChange={e => setField('nameDisplayEn', e.target.value)}
                placeholder="후원사명(영문)을 입력하세요"
                inputSize="small"
                width="100%"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="구분"
            required
            view={noopView}
            edit={
              <CmsRadioGroup
                value={form.organizationKind}
                onChange={e =>
                  setField('organizationKind', e.target.value as SponsorOrganizationKind)
                }
                options={[
                  { label: '기업', value: 'corporate' },
                  { label: '재단', value: 'foundation' },
                ]}
                size="medium"
              />
            }
          />
          <DetailInfoForm.Field
            label="사업자번호"
            view={noopView}
            edit={
              <CmsBusinessNumberInput
                value={form.businessNumber}
                onChange={e => setField('businessNumber', e.target.value)}
                placeholder="사업자번호를 입력하세요"
                inputSize="small"
                width="100%"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="후원 시작일"
            required
            view={noopView}
            edit={
              <CmsDatePicker inputSize="small"
                value={form.sponsorshipStartDate ? dayjs(form.sponsorshipStartDate) : null}
                onChange={date =>
                  setField(
                    'sponsorshipStartDate',
                    date ? date.startOf('day').toISOString() : ''
                  )
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
            required
            view={noopView}
            edit={
              <span className={STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME}>
                <StatusDropdownCell<SponsorSponsorshipStatus>
                  status={form.sponsorshipStatus}
                  statusOptions={SPONSOR_SPONSORSHIP_STATUS_VALUES}
                  renderBadge={status => <SponsorSponsorshipStatusBadge status={status} />}
                  isItemDisabled={(currentStatus, optionStatus) => currentStatus === optionStatus}
                  onChange={next => setField('sponsorshipStatus', next)}
                  isOpen={isSponsorshipStatusOpen}
                  onOpenChange={setIsSponsorshipStatusOpen}
                  tagLayout="tag100"
                />
              </span>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="대표이사"
            colSpan={2}
            view={noopView}
            edit={
              <CmsInput
                value={form.executives}
                onChange={e => setField('executives', e.target.value)}
                placeholder="대표이사명을 입력하세요"
                inputSize="small"
                width="100%"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="소재지"
            colSpan={2}
            view={noopView}
            edit={
              <Space.Compact block>
                <AddressSearch
                  value={form.district}
                  onChange={next => setField('district', next)}
                  onSelect={() => setField('detailAddress', '')}
                  inputSize="small"
                  width="100%"
                />
                <DetailInfoForm.InputsSeparator />
                <CmsInput
                  value={form.detailAddress}
                  onChange={e => setField('detailAddress', e.target.value)}
                  placeholder="상세 주소"
                  inputSize="small"
                  width="100%"
                />
              </Space.Compact>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="홈페이지"
            colSpan={2}
            view={noopView}
            edit={
              <CmsInput
                value={form.homepageUrl}
                onChange={e => setField('homepageUrl', e.target.value)}
                placeholder="홈페이지 주소를 입력하세요"
                inputSize="small"
                width="100%"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="후원사 로고"
            colSpan={2}
            view={noopView}
            edit={
              <FileSelectField
                multiple
                accept={SPONSOR_LOGO_ACCEPT}
                maxTotalBytes={0}
                fileNames={form.logoFiles.map(file => file.name)}
                currentTotalBytes={0}
                onFilesChange={files => {
                  const next = mergeSponsorLogoFiles(form.logoFiles, files)
                  if (next.length === form.logoFiles.length && files.length > 0) {
                    const message = validateSponsorLogoSelection([
                      ...form.logoFiles,
                      ...files,
                    ])
                    if (message) {
                      showAlert({ title: '안내', content: message })
                    }
                    return
                  }
                  setField('logoFiles', next)
                }}
                onRemoveFile={index =>
                  setField(
                    'logoFiles',
                    form.logoFiles.filter((_, fileIndex) => fileIndex !== index)
                  )
                }
                guideLines={[...SPONSOR_LOGO_GUIDE_LINES]}
                uploading={submitting && form.logoFiles.length > 0}
                disabled={submitting}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="비고"
            colSpan={2}
            view={noopView}
            edit={
              <CmsInput
                value={form.securityMemo}
                onChange={e => setField('securityMemo', e.target.value)}
                placeholder="비고를 입력하세요"
                inputSize="small"
                width="100%"
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}
