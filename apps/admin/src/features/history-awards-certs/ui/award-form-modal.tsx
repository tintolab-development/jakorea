import { useCallback, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { AwardCreateInput, AwardItem } from '@/entities/history-awards-certs/model/types'
import { coerceRadioBoolean } from '@/features/history-awards-certs/lib/format'
import {
  deleteConfirmContent,
  publishedMustUnpublishAlert,
} from '@/features/history-awards-certs/lib/delete-guards'
import {
  CmsButton,
  CmsDatePicker,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  ConfirmModal,
  ContentModal,
  useCmsAlert,
} from '@/shared/ui'

import './form-modal.css'

const CREATE_DESCRIPTION =
  '수상일과 상명, 수여 기관명을 기재해 주세요.\n수상일은 관리자 화면에서 일까지 노출되며, 홈페이지에서는 연도와 월까지만 노출됩니다.'

type Props = {
  open: boolean
  variant: 'create' | 'edit'
  initial?: AwardItem | null
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onSubmit: (values: AwardCreateInput) => void
  onDelete?: () => void
}

export function AwardFormModal({
  open,
  variant,
  initial,
  confirmLoading,
  deleteLoading,
  onCancel,
  onSubmit,
  onDelete,
}: Props) {
  if (!open) return null
  return (
    <AwardFormBody
      key={variant === 'edit' ? initial?.id ?? 'edit' : 'create'}
      variant={variant}
      initial={initial}
      confirmLoading={confirmLoading}
      deleteLoading={deleteLoading}
      onCancel={onCancel}
      onSubmit={onSubmit}
      onDelete={onDelete}
    />
  )
}

type BodyProps = Omit<Props, 'open'>

function AwardFormBody({
  variant,
  initial,
  confirmLoading,
  deleteLoading,
  onCancel,
  onSubmit,
  onDelete,
}: BodyProps) {
  const { showAlert } = useCmsAlert()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isPublic, setIsPublic] = useState(() =>
    variant === 'edit' && initial ? initial.isPublic : true
  )
  const [awardedOn, setAwardedOn] = useState<Dayjs | null>(() =>
    variant === 'edit' && initial?.awardedOn ? dayjs(initial.awardedOn) : null
  )
  const [title, setTitle] = useState(() =>
    variant === 'edit' && initial ? initial.title : ''
  )
  const [organization, setOrganization] = useState(() =>
    variant === 'edit' && initial ? initial.organization : ''
  )

  const handleSubmit = useCallback(() => {
    if (!awardedOn || !awardedOn.isValid()) {
      showAlert({ title: '수상일 필수', content: '수상일을 선택해 주세요.' })
      return
    }
    const t = title.trim()
    if (!t) {
      showAlert({ title: '상명 필수', content: '상명을 입력해 주세요.' })
      return
    }
    const org = organization.trim()
    if (!org) {
      showAlert({ title: '수여 기관명 필수', content: '수여 기관명을 입력해 주세요.' })
      return
    }
    onSubmit({
      isPublic,
      title: t,
      organization: org,
      awardedOn: awardedOn.format('YYYY-MM-DD'),
    })
  }, [awardedOn, isPublic, onSubmit, organization, showAlert, title])

  const modalTitle = variant === 'create' ? '수상 등록' : '수상 수정'
  const primaryLabel = variant === 'create' ? '수상 등록' : '수정'

  return (
    <>
      <ContentModal
        open
        onCancel={onCancel}
        title={modalTitle}
        description={CREATE_DESCRIPTION}
        width={720}
        className="hac-form-modal"
        footer={
          <>
            <div className="hac-form-modal__footer-start">
              {variant === 'edit' && onDelete ? (
                <CmsButton
                  variant="delete"
                  size="large"
                  type="button"
                  onClick={() => {
                    if (initial?.isPublic) {
                      showAlert(publishedMustUnpublishAlert('수상'))
                      return
                    }
                    setDeleteConfirmOpen(true)
                  }}
                  disabled={confirmLoading || deleteLoading}
                  loading={deleteLoading}
                >
                  수상 삭제
                </CmsButton>
              ) : null}
            </div>
            <div className="hac-form-modal__footer-end">
              <CmsButton
                variant="secondary"
                size="large"
                type="button"
                onClick={onCancel}
                disabled={confirmLoading || deleteLoading}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
                type="button"
                loading={confirmLoading}
                disabled={deleteLoading}
                onClick={handleSubmit}
              >
                {primaryLabel}
              </CmsButton>
            </div>
          </>
        }
      >
        <DetailInfoForm title={modalTitle} hideHeader mode="edit">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="공개 여부"
              view={null}
              edit={
                <CmsRadioGroup
                  value={isPublic}
                  onChange={e => setIsPublic(coerceRadioBoolean(e.target.value))}
                >
                  <CmsRadio value={true}>공개</CmsRadio>
                  <CmsRadio value={false}>비공개</CmsRadio>
                </CmsRadioGroup>
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="수상일"
              view={null}
              edit={
                <CmsDatePicker
                  inputSize="medium"
                  width="100%"
                  value={awardedOn}
                  onChange={d => setAwardedOn(d)}
                  placeholder="수상일을 선택하세요"
                  allowClear
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="상명"
              view={null}
              edit={
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="상명을 입력하세요"
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="수여 기관명"
              view={null}
              edit={
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  placeholder="수여 기관명을 입력하세요"
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </ContentModal>

      <ConfirmModal
        open={deleteConfirmOpen}
        title="수상 삭제"
        content={deleteConfirmContent('수상')}
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
