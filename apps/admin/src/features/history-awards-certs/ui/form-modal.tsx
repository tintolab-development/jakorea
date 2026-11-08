import { useCallback, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  AwardCreateInput,
  AwardItem,
  CertCreateInput,
  CertItem,
  HistoryCreateInput,
  HistoryItem,
} from '@/entities/history-awards-certs/model/types'
import { deleteConfirmContent } from '@/features/history-awards-certs/lib/delete-guards'
import { coerceRadioBoolean } from '@/features/history-awards-certs/lib/format'
import {
  isDatedFormRequiredIncomplete,
  isHistoryFormRequiredIncomplete,
} from '@/features/history-awards-certs/lib/history-form-required'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  CmsButton,
  CmsDatePicker,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  CmsTextArea,
  ConfirmModal,
  CONTENT_MODAL_FOOTER_START_CLASS,
  ContentModal,
  useCmsAlert,
} from '@/shared/ui'

import './form-modal.css'

type FormVariant = 'create' | 'edit'

const KIND_COPY = {
  history: {
    resourceLabel: '연혁',
    description: '연도와 월, 내용을 기재해 주세요.',
  },
  award: {
    resourceLabel: '수상',
    description:
      '수상일과 상명, 수여 기관명을 기재해 주세요.\n수상일은 관리자 화면에서 일까지 노출되며, 홈페이지에서는 연도와 월까지만 노출됩니다.',
    dateLabel: '수상일',
    datePlaceholder: '수상일을 선택해 주세요',
    nameLabel: '상명',
    namePlaceholder: '상명을 입력해 주세요',
    orgLabel: '수여 기관명',
    orgPlaceholder: '수여 기관명을 입력해 주세요',
  },
  cert: {
    resourceLabel: '인증',
    description:
      '인증일과 내용, 인증 기관명을 기재해 주세요.\n인증일은 관리자 화면에서 일까지 노출되며, 홈페이지에서는 연도와 월까지만 노출됩니다.',
    dateLabel: '인증일',
    datePlaceholder: '인증일을 선택해 주세요',
    nameLabel: '내용',
    namePlaceholder: '내용을 입력해 주세요',
    orgLabel: '인증 기관명',
    orgPlaceholder: '인증 기관명을 입력해 주세요',
  },
} as const

type SharedProps = {
  open: boolean
  variant: FormVariant
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onDelete?: () => void
}

export type HacFormModalProps =
  | (SharedProps & {
      kind: 'history'
      initial?: HistoryItem | null
      onSubmit: (values: HistoryCreateInput) => void
    })
  | (SharedProps & {
      kind: 'award'
      initial?: AwardItem | null
      onSubmit: (values: AwardCreateInput) => void
    })
  | (SharedProps & {
      kind: 'cert'
      initial?: CertItem | null
      onSubmit: (values: CertCreateInput) => void
    })

export function HacFormModal(props: HacFormModalProps) {
  if (!props.open) return null
  return (
    <HacFormBody
      key={props.variant === 'edit' ? (props.initial?.id ?? 'edit') : 'create'}
      {...props}
    />
  )
}

export type HistoryFormModalProps = Omit<Extract<HacFormModalProps, { kind: 'history' }>, 'kind'>
export type AwardFormModalProps = Omit<Extract<HacFormModalProps, { kind: 'award' }>, 'kind'>
export type CertFormModalProps = Omit<Extract<HacFormModalProps, { kind: 'cert' }>, 'kind'>

export function HistoryFormModal(props: HistoryFormModalProps) {
  return <HacFormModal kind="history" {...props} />
}

export function AwardFormModal(props: AwardFormModalProps) {
  return <HacFormModal kind="award" {...props} />
}

export function CertFormModal(props: CertFormModalProps) {
  return <HacFormModal kind="cert" {...props} />
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
type BodyProps = DistributiveOmit<HacFormModalProps, 'open'>

function editSeed<T>(variant: FormVariant, initial: T | null | undefined): T | null {
  return variant === 'edit' && initial ? initial : null
}

function HacFormBody(props: BodyProps) {
  const { kind, variant, confirmLoading, deleteLoading, onCancel, onDelete } = props
  const copy = KIND_COPY[kind]
  const { showAlert } = useCmsAlert()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const historySeed = props.kind === 'history' ? editSeed(variant, props.initial) : null
  const awardSeed = props.kind === 'award' ? editSeed(variant, props.initial) : null
  const certSeed = props.kind === 'cert' ? editSeed(variant, props.initial) : null
  const publicSeed = historySeed ?? awardSeed ?? certSeed

  const [isPublic, setIsPublic] = useState(() => publicSeed?.isPublic ?? true)
  const [year, setYear] = useState(() => (historySeed ? String(historySeed.year) : ''))
  const [month, setMonth] = useState(() => (historySeed ? String(historySeed.month) : ''))
  const [historyContent, setHistoryContent] = useState(() => historySeed?.content ?? '')
  const [eventOn, setEventOn] = useState<Dayjs | null>(() => {
    if (awardSeed?.awardedOn) return dayjs(awardSeed.awardedOn)
    if (certSeed?.certifiedOn) return dayjs(certSeed.certifiedOn)
    return null
  })
  const [name, setName] = useState(() => awardSeed?.title ?? certSeed?.content ?? '')
  const [organization, setOrganization] = useState(
    () => awardSeed?.organization ?? certSeed?.organization ?? ''
  )

  const handleSubmit = useCallback(() => {
    if (props.kind === 'history') {
      if (isHistoryFormRequiredIncomplete({ year, month, content: historyContent })) {
        showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
        return
      }
      const yearN = Number(year)
      const monthN = Number(month)
      if (!Number.isInteger(yearN) || yearN < 1900 || yearN > 2100) {
        showAlert({ title: '연도 확인', content: '올바른 연혁 연도를 입력해 주세요.' })
        return
      }
      if (!Number.isInteger(monthN) || monthN < 1 || monthN > 12) {
        showAlert({ title: '월 확인', content: '월은 1~12 사이의 숫자로 입력해 주세요.' })
        return
      }
      props.onSubmit({ isPublic, year: yearN, month: monthN, content: historyContent.trim() })
      return
    }

    if (!eventOn || isDatedFormRequiredIncomplete({ date: eventOn, name, organization })) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    const trimmedName = name.trim()
    const org = organization.trim()
    const date = eventOn.format('YYYY-MM-DD')
    if (props.kind === 'award') {
      props.onSubmit({ isPublic, title: trimmedName, organization: org, awardedOn: date })
      return
    }
    props.onSubmit({ isPublic, content: trimmedName, organization: org, certifiedOn: date })
  }, [eventOn, historyContent, isPublic, month, name, organization, props, showAlert, year])

  const modalTitle =
    variant === 'create' ? `${copy.resourceLabel} 등록` : `${copy.resourceLabel} 수정`
  const primaryLabel = variant === 'create' ? `${copy.resourceLabel} 등록` : '수정'
  const datedCopy = kind === 'history' ? null : KIND_COPY[kind]

  return (
    <>
      <ContentModal
        open
        onCancel={onCancel}
        title={modalTitle}
        description={copy.description}
        width={800}
        className="hac-form-modal"
        footer={
          <>
            {variant === 'edit' && onDelete ? (
              <CmsButton
                className={CONTENT_MODAL_FOOTER_START_CLASS}
                variant="delete"
                size="medium"
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(true)
                }}
                disabled={confirmLoading || deleteLoading}
                loading={deleteLoading}
              >
                {copy.resourceLabel} 삭제
              </CmsButton>
            ) : null}
            <CmsButton
              variant="secondary"
              size="medium"
              type="button"
              onClick={onCancel}
              disabled={confirmLoading || deleteLoading}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              type="button"
              loading={confirmLoading}
              disabled={deleteLoading}
              onClick={handleSubmit}
            >
              {primaryLabel}
            </CmsButton>
          </>
        }
      >
        <DetailInfoForm title={modalTitle} hideHeader mode="edit">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="공개 여부"
              required
              view={null}
              edit={
                <CmsRadioGroup
                  size="medium"
                  value={isPublic}
                  onChange={e => setIsPublic(coerceRadioBoolean(e.target.value))}
                >
                  <CmsRadio size="medium" value={true}>
                    공개
                  </CmsRadio>
                  <CmsRadio size="medium" value={false}>
                    비공개
                  </CmsRadio>
                </CmsRadioGroup>
              }
            />
          </DetailInfoForm.Row>
          {kind === 'history' ? (
            <>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="연혁 연도/월"
                  required
                  view={null}
                  edit={
                    <div
                      className="hac-form-modal__year-month"
                      role="group"
                      aria-label="연혁 연도/월"
                    >
                      <label className="hac-form-modal__unit-field">
                        <CmsInput
                          inputSize="medium"
                          width={100}
                          value={year}
                          onChange={e => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="연도"
                          aria-label="연혁 연도"
                        />
                        <span className="hac-form-modal__unit" aria-hidden>
                          년
                        </span>
                      </label>
                      <label className="hac-form-modal__unit-field">
                        <CmsInput
                          inputSize="medium"
                          width={72}
                          value={month}
                          onChange={e => setMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                          placeholder="월"
                          aria-label="연혁 월"
                        />
                        <span className="hac-form-modal__unit" aria-hidden>
                          월
                        </span>
                      </label>
                    </div>
                  }
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="내용"
                  required
                  view={null}
                  edit={
                    <CmsTextArea
                      className="hac-form-modal__content-field"
                      inputSize="medium"
                      width="100%"
                      rows={1}
                      autoSize={false}
                      value={historyContent}
                      onChange={e => setHistoryContent(e.target.value)}
                      placeholder="내용을 입력해 주세요"
                    />
                  }
                />
              </DetailInfoForm.Row>
            </>
          ) : datedCopy ? (
            <>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label={datedCopy.dateLabel}
                  required
                  view={null}
                  edit={
                    <CmsDatePicker
                      inputSize="medium"
                      width="100%"
                      value={eventOn}
                      onChange={d => setEventOn(d)}
                      placeholder={datedCopy.datePlaceholder}
                      allowClear
                    />
                  }
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label={datedCopy.nameLabel}
                  required
                  view={null}
                  edit={
                    <CmsInput
                      inputSize="medium"
                      width="100%"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={datedCopy.namePlaceholder}
                    />
                  }
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label={datedCopy.orgLabel}
                  required
                  view={null}
                  edit={
                    <CmsInput
                      inputSize="medium"
                      width="100%"
                      value={organization}
                      onChange={e => setOrganization(e.target.value)}
                      placeholder={datedCopy.orgPlaceholder}
                    />
                  }
                />
              </DetailInfoForm.Row>
            </>
          ) : null}
        </DetailInfoForm>
      </ContentModal>

      <ConfirmModal
        open={deleteConfirmOpen}
        title={`${copy.resourceLabel} 삭제`}
        content={deleteConfirmContent(copy.resourceLabel)}
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={deleteLoading}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false)
          onDelete?.()
        }}
      />
    </>
  )
}
