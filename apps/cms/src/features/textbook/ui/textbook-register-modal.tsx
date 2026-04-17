import { useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { CmsButton, CmsInput, CmsRadio, CmsSelect, ContentModal } from '@/shared/ui'
import type { TextbookCreateInput } from '@/features/textbook/model/textbook.types'
import './textbook-register-modal.css'

export type TextbookRegisterPayload = TextbookCreateInput

export interface TextbookRegisterModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (payload: TextbookRegisterPayload) => void
  initialValues?: Partial<TextbookRegisterPayload> | null
  mode?: 'create' | 'edit'
}

type FormState = TextbookRegisterPayload

const emptyForm = (): FormState => ({
  useStatus: 'USED',
  textbookName: '',
  businessArea: '',
  educationTarget: '',
  grade: '',
})

export function TextbookRegisterModal({
  open,
  onCancel,
  onSubmit,
  initialValues,
  mode = 'create',
}: TextbookRegisterModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    if (!open) return
    setForm({
      ...emptyForm(),
      ...initialValues,
    })
  }, [open, initialValues])

  const canSubmit = useMemo(
    () =>
      form.textbookName.trim().length > 0 &&
      form.businessArea.length > 0 &&
      form.educationTarget.length > 0 &&
      form.grade.length > 0,
    [form]
  )

  const handleSubmit = () => {
    if (!form.textbookName.trim()) {
      message.warning('교재명을 입력해 주세요.')
      return
    }
    if (!form.businessArea || !form.educationTarget || !form.grade) {
      message.warning('필수 항목을 모두 선택해 주세요.')
      return
    }
    onSubmit({
      ...form,
      textbookName: form.textbookName.trim(),
    })
  }

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={mode === 'edit' ? '교재 정보 수정' : '교재 등록'}
      width={600}
      className="textbook-register-modal"
      wrapClassName="textbook-register-modal-wrap"
      footer={
        <div className="textbook-register-modal__footer">
          <CmsButton variant="secondary" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton variant="primary" type="button" disabled={!canSubmit} onClick={handleSubmit}>
            {mode === 'edit' ? '수정' : '등록'}
          </CmsButton>
        </div>
      }
    >
      <div className="textbook-register-modal__form">
        <div className="textbook-register-modal__field">
          <span className="textbook-register-modal__label">사용 여부</span>
          <CmsRadio.Group
            value={form.useStatus}
            onChange={e => setForm(prev => ({ ...prev, useStatus: e.target.value }))}
          >
            <CmsRadio value="USED">사용</CmsRadio>
            <CmsRadio value="UNUSED">미사용</CmsRadio>
          </CmsRadio.Group>
        </div>

        <div className="textbook-register-modal__field">
          <span className="textbook-register-modal__label textbook-register-modal__label--required">
            교재명
          </span>
          <CmsInput
            value={form.textbookName}
            onChange={e => setForm(prev => ({ ...prev, textbookName: e.target.value }))}
            placeholder="교재명을 입력해 주세요."
            inputSize="large"
            width="100%"
          />
        </div>

        <div className="textbook-register-modal__field">
          <span className="textbook-register-modal__label textbook-register-modal__label--required">
            사업 분야
          </span>
          <CmsSelect
            inputSize="large"
            placeholder="사업 분야를 선택해 주세요."
            value={form.businessArea || undefined}
            onChange={value => setForm(prev => ({ ...prev, businessArea: String(value ?? '') }))}
            options={[
              { label: '기업가정신', value: '기업가정신' },
              { label: '금융교육', value: '금융교육' },
              { label: '진로교육', value: '진로교육' },
            ]}
            style={{ width: '100%' }}
            allowClear
          />
        </div>

        <div className="textbook-register-modal__field">
          <span className="textbook-register-modal__label textbook-register-modal__label--required">
            교육 대상
          </span>
          <CmsSelect
            inputSize="large"
            placeholder="교육 대상을 선택해 주세요."
            value={form.educationTarget || undefined}
            onChange={value => setForm(prev => ({ ...prev, educationTarget: String(value ?? '') }))}
            options={[
              { label: '초등학교', value: '초등학교' },
              { label: '중학교', value: '중학교' },
              { label: '고등학교', value: '고등학교' },
              { label: '대학교', value: '대학교' },
            ]}
            style={{ width: '100%' }}
            allowClear
          />
        </div>

        <div className="textbook-register-modal__field">
          <span className="textbook-register-modal__label textbook-register-modal__label--required">
            대상 학년
          </span>
          <CmsSelect
            inputSize="large"
            placeholder="대상 학년을 선택해 주세요."
            value={form.grade || undefined}
            onChange={value => setForm(prev => ({ ...prev, grade: String(value ?? '') }))}
            options={[
              { label: '전학년', value: '전학년' },
              { label: '1학년', value: '1학년' },
              { label: '2학년', value: '2학년' },
              { label: '3학년', value: '3학년' },
            ]}
            style={{ width: '100%' }}
            allowClear
          />
        </div>
      </div>
    </ContentModal>
  )
}
