import { useEffect, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import {
  EXPENSE_CATEGORY_LABEL,
  type ExpenseCategory,
  type FinanceItemCreateInput,
  type FinanceSection,
  type FinanceViewKind,
} from '@/entities/income-expense/model/types'
import { parseAmountInput, parseRatioInput } from '@/features/income-expense/lib/format'
import {
  CmsButton,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  ContentModal,
  useCmsAlert,
} from '@/shared/ui'

import './item-form-modal.css'

const MODAL_TITLE: Record<FinanceSection, Record<FinanceViewKind, string>> = {
  income: {
    graph: '수입총계 그래프 항목 등록',
    table: '수입총계 테이블 항목 등록',
  },
  expense: {
    graph: '지출총계 그래프 항목 등록',
    table: '지출총계 테이블 항목 등록',
  },
}

const MODAL_DESCRIPTION =
  '홈페이지 투명경영 영역에 노출되는 항목을 등록해 주세요. 그래프 항목은 최대 10개까지 등록할 수 있습니다.'

type ItemFormModalProps = {
  open: boolean
  section: FinanceSection
  view: FinanceViewKind
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: FinanceItemCreateInput) => void
}

export function ItemFormModal({
  open,
  section,
  view,
  confirmLoading,
  onCancel,
  onSubmit,
}: ItemFormModalProps) {
  const { showAlert } = useCmsAlert()
  const showCategory = section === 'expense' && view === 'table'

  const [category, setCategory] = useState<ExpenseCategory>('direct')
  const [name, setName] = useState('')
  const [ratio, setRatio] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (!open) return
    setCategory('direct')
    setName('')
    setRatio('')
    setAmount('')
  }, [open, section, view])

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      showAlert({ title: '입력 확인', content: '항목명을 입력해 주세요.' })
      return
    }
    const ratioNum = parseRatioInput(ratio)
    if (ratioNum === null) {
      showAlert({ title: '입력 확인', content: '비율을 숫자로 입력해 주세요.' })
      return
    }
    const amountNum = parseAmountInput(amount)
    if (amountNum === null) {
      showAlert({ title: '입력 확인', content: '금액을 숫자로 입력해 주세요.' })
      return
    }
    if (showCategory && !category) {
      showAlert({ title: '입력 확인', content: '구분을 선택해 주세요.' })
      return
    }

    onSubmit({
      name: trimmed,
      ratio: ratioNum,
      amount: amountNum,
      ...(showCategory ? { category } : {}),
    })
  }

  const title = MODAL_TITLE[section][view]

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      description={MODAL_DESCRIPTION}
      width={720}
      className="income-expense-item-form-modal"
      footer={
        <div className="content-modal__footer-actions">
          <div className="income-expense-item-form-modal__footer-start" />
          <div className="income-expense-item-form-modal__footer-end">
            <CmsButton
              variant="secondary"
              size="large"
              type="button"
              disabled={confirmLoading}
              onClick={onCancel}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="large"
              type="button"
              loading={confirmLoading}
              disabled={confirmLoading}
              onClick={handleSubmit}
            >
              등록
            </CmsButton>
          </div>
        </div>
      }
    >
      <DetailInfoForm
        title={title}
        hideHeader
        mode="edit"
        className="income-expense-item-form-modal__form"
      >
        {showCategory ? (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="구분"
              required
              view={null}
              edit={
                <CmsRadioGroup
                  size="medium"
                  value={category}
                  onChange={e => setCategory(e.target.value as ExpenseCategory)}
                >
                  <CmsRadio size="medium" value="direct">
                    {EXPENSE_CATEGORY_LABEL.direct}
                  </CmsRadio>
                  <CmsRadio size="medium" value="indirect">
                    {EXPENSE_CATEGORY_LABEL.indirect}
                  </CmsRadio>
                </CmsRadioGroup>
              }
            />
          </DetailInfoForm.Row>
        ) : null}

        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="항목명"
            required
            view={null}
            edit={
              <CmsInput
                inputSize="large"
                width="100%"
                placeholder="항목명을 입력하세요"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="비율"
            required
            view={null}
            edit={
              <div className="income-expense-item-form-modal__with-suffix">
                <CmsInput
                  inputSize="large"
                  width="100%"
                  placeholder="0"
                  value={ratio}
                  onChange={e => setRatio(e.target.value)}
                  inputMode="decimal"
                />
                <span className="income-expense-item-form-modal__suffix">%</span>
              </div>
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="금액"
            required
            view={null}
            edit={
              <div className="income-expense-item-form-modal__with-suffix">
                <CmsInput
                  inputSize="large"
                  width="100%"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  inputMode="numeric"
                />
                <span className="income-expense-item-form-modal__suffix">원</span>
              </div>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}
