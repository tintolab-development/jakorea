import { useCallback, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { CertCreateInput, CertItem } from '@/entities/history-awards-certs/model/types'
import { coerceRadioBoolean } from '@/features/history-awards-certs/lib/format'
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
  '인증일과 내용, 인증 기관명을 기재해 주세요.\n인증일은 관리자 화면에서 일까지 노출되며, 홈페이지에서는 연도와 월까지만 노출됩니다.'

type Props = {
  open: boolean
  variant: 'create' | 'edit'
  initial?: CertItem | null
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onSubmit: (values: CertCreateInput) => void
  onDelete?: () => void
}

export function CertFormModal({
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
    <CertFormBody
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

function CertFormBody({
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
  const [certifiedOn, setCertifiedOn] = useState<Dayjs | null>(() =>
    variant === 'edit' && initial?.certifiedOn ? dayjs(initial.certifiedOn) : null
  )
  const [content, setContent] = useState(() =>
    variant === 'edit' && initial ? initial.content : ''
  )
  const [organization, setOrganization] = useState(() =>
    variant === 'edit' && initial ? initial.organization : ''
  )

  const handleSubmit = useCallback(() => {
    if (!certifiedOn || !certifiedOn.isValid()) {
      showAlert({ title: '인증일 필수', content: '인증일을 선택해 주세요.' })
      return
    }
    const c = content.trim()
    if (!c) {
      showAlert({ title: '내용 필수', content: '내용을 입력해 주세요.' })
      return
    }
    const org = organization.trim()
    if (!org) {
      showAlert({ title: '인증 기관명 필수', content: '인증 기관명을 입력해 주세요.' })
      return
    }
    onSubmit({
      isPublic,
      content: c,
      organization: org,
      certifiedOn: certifiedOn.format('YYYY-MM-DD'),
    })
  }, [certifiedOn, content, isPublic, onSubmit, organization, showAlert])

  const modalTitle = variant === 'create' ? '인증 등록' : '인증 수정'
  const primaryLabel = variant === 'create' ? '인증 등록' : '수정'

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
                  size="medium"
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={confirmLoading || deleteLoading}
                  loading={deleteLoading}
                >
                  인증 삭제
                </CmsButton>
              ) : null}
            </div>
            <div className="hac-form-modal__footer-end">
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
              label="인증일"
              view={null}
              edit={
                <CmsDatePicker
                  inputSize="medium"
                  width="100%"
                  value={certifiedOn}
                  onChange={d => setCertifiedOn(d)}
                  placeholder="인증일을 선택하세요"
                  allowClear
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="내용"
              view={null}
              edit={
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="내용을 입력하세요"
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="인증 기관명"
              view={null}
              edit={
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  placeholder="인증 기관명을 입력하세요"
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </ContentModal>

      <ConfirmModal
        open={deleteConfirmOpen}
        title="인증 삭제"
        content={'선택한 인증 정보를 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.'}
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
