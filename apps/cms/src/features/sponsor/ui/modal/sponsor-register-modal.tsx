import { useCallback, useEffect, useMemo, useState } from 'react'
import { Space } from 'antd'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { LAYOUT_CONSTANTS } from '@/shared/constants'
import { AddressSearch, CmsBusinessNumberInput, CmsButton, CmsInput, CmsRadioGroup, ContentModal } from '@/shared/ui'
import type { SponsorOrganizationKind } from '@/types/domain'

export interface SponsorRegisterModalProps {
  open: boolean
  onCancel: () => void
  /** 검증 통과 시 목록에 반영할 행을 넘깁니다. */
  onSubmit: (row: SponsorManagementRow) => void
}

type FormState = {
  nameDisplayKo: string
  nameDisplayEn: string
  organizationKind: SponsorOrganizationKind
  businessNumber: string
  executives: string
  district: string
  detailAddress: string
}

const emptyForm = (): FormState => ({
  nameDisplayKo: '',
  nameDisplayEn: '',
  organizationKind: 'corporate',
  businessNumber: '',
  executives: '',
  district: '',
  detailAddress: '',
})

function buildDescription(f: FormState): string | undefined {
  const parts: string[] = []
  if (f.businessNumber.trim()) parts.push(`사업자번호: ${f.businessNumber.trim()}`)
  if (f.executives.trim()) parts.push(`대표이사: ${f.executives.trim()}`)
  const addr = [f.district.trim(), f.detailAddress.trim()].filter(Boolean).join(' ')
  if (addr) parts.push(`소재지: ${addr}`)
  return parts.length > 0 ? parts.join('\n') : undefined
}

export function SponsorRegisterModal({ open, onCancel, onSubmit }: SponsorRegisterModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm)

  /* eslint-disable react-hooks/set-state-in-effect -- 모달이 열릴 때 등록 폼을 초기 상태로 리셋 */
  useEffect(() => {
    if (open) setForm(emptyForm())
  }, [open])
  /* eslint-enable react-hooks/set-state-in-effect */

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSubmit = useCallback((): void => {
    const name = form.nameDisplayKo.trim()
    if (!name) {
      return
    }

    const now = new Date().toISOString()
    const id = `sponsor-new-${Date.now()}`
    const address = [form.district.trim(), form.detailAddress.trim()].filter(Boolean).join(' ')
    const row: SponsorManagementRow = {
      id,
      name,
      nameEn: form.nameDisplayEn.trim() || undefined,
      description: buildDescription(form),
      contactInfo: address || undefined,
      createdAt: now,
      updatedAt: now,
      organizationKind: form.organizationKind,
      sponsorshipStatus: 'active',
      sponsorshipStartDate: now.split('T')[0] + 'T00:00:00.000Z',
      managers: [],
      programCount: 0,
    }

    onSubmit(row)
  }, [form, onSubmit])

  const noopView = <span />

  /** DetailInfoForm `required`와 동일: 후원사명(국문). 구분은 라디오 기본값으로 항상 있음 */
  const canSubmit = useMemo(() => form.nameDisplayKo.trim().length > 0, [form.nameDisplayKo])

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="후원사 신규 등록"
      width={LAYOUT_CONSTANTS.widths.modal.large}
      footer={
        <>
          <CmsButton variant="secondary" type="button" onClick={onCancel}>
            닫기
          </CmsButton>
          <CmsButton variant="primary" type="button" disabled={!canSubmit} onClick={handleSubmit}>
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
                placeholder="후원사명"
                inputSize="medium"
                width="100%"
              />
            }
          />
          <DetailInfoForm.Field
            label="후원사명 (영문)"
            view={noopView}
            edit={
              <CmsInput
                value={form.nameDisplayEn}
                onChange={e => setField('nameDisplayEn', e.target.value)}
                placeholder="후원사명"
                inputSize="medium"
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
                placeholder="000-00-00000"
                inputSize="medium"
                width="100%"
              />
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
                placeholder="대표이사"
                inputSize="medium"
                width="100%"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="후원사 소재지"
            colSpan={2}
            view={noopView}
            edit={
              <Space.Compact block>
                <AddressSearch
                  value={form.district}
                  onChange={next => setField('district', next)}
                  onSelect={() => setField('detailAddress', '')}
                  inputSize="medium"
                  width="100%"
                />
                <DetailInfoForm.InputsSeparator />
                <CmsInput
                  value={form.detailAddress}
                  onChange={e => setField('detailAddress', e.target.value)}
                  placeholder="상세 주소"
                  inputSize="medium"
                  width="100%"
                />
              </Space.Compact>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}
