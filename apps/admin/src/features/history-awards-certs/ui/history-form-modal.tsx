import { useCallback, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  HistoryCreateInput,
  HistoryItem,
} from '@/entities/history-awards-certs/model/types'
import { coerceRadioBoolean } from '@/features/history-awards-certs/lib/format'
import {
  CmsButton,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  CmsTextArea,
  ConfirmModal,
  ContentModal,
  useCmsAlert,
} from '@/shared/ui'

import './form-modal.css'

type Props = {
  open: boolean
  variant: 'create' | 'edit'
  initial?: HistoryItem | null
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onSubmit: (values: HistoryCreateInput) => void
  onDelete?: () => void
}

export function HistoryFormModal({
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
    <HistoryFormBody
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

function HistoryFormBody({
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
  const [year, setYear] = useState(() =>
    variant === 'edit' && initial ? String(initial.year) : ''
  )
  const [month, setMonth] = useState(() =>
    variant === 'edit' && initial ? String(initial.month) : ''
  )
  const [content, setContent] = useState(() =>
    variant === 'edit' && initial ? initial.content : ''
  )

  const handleSubmit = useCallback(() => {
    const yearN = Number(year)
    const monthN = Number(month)
    if (!Number.isInteger(yearN) || yearN < 1900 || yearN > 2100) {
      showAlert({ title: '연도 확인', content: '올바른 연혁 년도를 입력해 주세요.' })
      return
    }
    if (!Number.isInteger(monthN) || monthN < 1 || monthN > 12) {
      showAlert({ title: '월 확인', content: '월은 1~12 사이의 숫자로 입력해 주세요.' })
      return
    }
    const trimmed = content.trim()
    if (!trimmed) {
      showAlert({ title: '내용 필수', content: '내용을 입력해 주세요.' })
      return
    }
    onSubmit({ isPublic, year: yearN, month: monthN, content: trimmed })
  }, [content, isPublic, month, onSubmit, showAlert, year])

  const title = variant === 'create' ? '연혁 등록' : '연혁 수정'
  const primaryLabel = variant === 'create' ? '연혁 등록' : '수정'

  return (
    <>
      <ContentModal
        open
        onCancel={onCancel}
        title={title}
        description="년도와 월, 내용을 기재해 주세요."
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
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={confirmLoading || deleteLoading}
                  loading={deleteLoading}
                >
                  연혁 삭제
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
        <DetailInfoForm title={title} hideHeader mode="edit">
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
              label="연혁 년도/월"
              view={null}
              edit={
                <div className="hac-form-modal__year-month" role="group" aria-label="연혁 년도/월">
                  <label className="hac-form-modal__unit-field">
                    <CmsInput
                      inputSize="medium"
                      width={100}
                      value={year}
                      onChange={e => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="년도"
                      aria-label="연혁 년도"
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
              view={null}
              edit={
                <CmsTextArea
                  className="hac-form-modal__content-field"
                  inputSize="medium"
                  width="100%"
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="내용을 입력하세요"
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </ContentModal>

      <ConfirmModal
        open={deleteConfirmOpen}
        title="연혁 삭제"
        content={'선택한 연혁을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.'}
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
