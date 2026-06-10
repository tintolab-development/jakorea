/**
 * 참여 봉사자 — 임직원 자원봉사자 등록 모달
 * 프로그램 진행 현황 > 참여 봉사자 > 임직원 자원봉사자 등록
 */

import { useCallback, useEffect, type KeyboardEvent } from 'react'
import { Form } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CmsInput, CmsSelect } from '@/shared/ui'
import { parsePositiveIntInput } from '@/features/template/lib/participant-recruitment-institution-limits'
import type {
  EmployeeVolunteerSessionRow,
  EmployeeVolunteerSessionRowId,
} from '@/features/program/general/lib/employee-volunteer-session-rows'
import {
  createEmptyEmployeeVolunteerFormCounts,
  getEmployeeVolunteerCountsForInstitution,
  hasCompleteEmployeeVolunteerCounts,
  type EmployeeVolunteerInstitutionRegistration,
  type EmployeeVolunteerSessionCounts,
} from '@/features/program/general/lib/employee-volunteer-registration'
import './register-employee-volunteer-modal.css'

export type RegisterEmployeeVolunteerPayload = {
  institutionId: string
  institutionName: string
  countsBySessionId: Partial<Record<EmployeeVolunteerSessionRowId, EmployeeVolunteerSessionCounts>>
}

export type RegisterEmployeeVolunteerInstitutionOption = {
  value: string
  label: string
}

type RegisterEmployeeVolunteerFormValues = {
  institutionId?: string
  countsBySessionId: Partial<
    Record<EmployeeVolunteerSessionRowId, { newCount?: number; returningCount?: number }>
  >
}

export interface RegisterEmployeeVolunteerModalProps {
  open: boolean
  onCancel: () => void
  sessionRows: ReadonlyArray<EmployeeVolunteerSessionRow>
  institutionOptions: RegisterEmployeeVolunteerInstitutionOption[]
  savedRegistrations: ReadonlyArray<EmployeeVolunteerInstitutionRegistration>
  onNoInstitutionSelected: () => void
  onIncompleteCounts: () => void
  onRegister: (payload: RegisterEmployeeVolunteerPayload) => void
}

const MODAL_WIDTH = 800

function blockNonNumericVolunteerCountKey(event: KeyboardEvent<HTMLInputElement>) {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (allowed.includes(event.key)) return
  if (/^\d$/.test(event.key)) return
  event.preventDefault()
}

function SessionVolunteerCountPair({
  sessionRow,
  field,
}: {
  sessionRow: EmployeeVolunteerSessionRow
  field: 'newCount' | 'returningCount'
}) {
  const label = field === 'newCount' ? '신규' : '재참여'

  return (
    <div className="register-employee-volunteer-modal__count-pair">
      <span className="detail-info-form--text">{label}</span>
      <Form.Item
        name={['countsBySessionId', sessionRow.id, field]}
        getValueFromEvent={e => parsePositiveIntInput(e.target.value)}
      >
        <CmsInput
          inputSize="large"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          width="100%"
          placeholder="자원봉사자 수 입력"
          aria-label={`${sessionRow.label} ${label} 자원봉사자 수`}
          onKeyDown={blockNonNumericVolunteerCountKey}
        />
      </Form.Item>
    </div>
  )
}

export function RegisterEmployeeVolunteerModal({
  open,
  onCancel,
  sessionRows,
  institutionOptions,
  savedRegistrations,
  onNoInstitutionSelected,
  onIncompleteCounts,
  onRegister,
}: RegisterEmployeeVolunteerModalProps) {
  const [form] = Form.useForm<RegisterEmployeeVolunteerFormValues>()
  const selectedInstitutionId = Form.useWatch('institutionId', form)

  const resetCountsForSessionRows = useCallback(() => {
    form.setFieldValue('countsBySessionId', createEmptyEmployeeVolunteerFormCounts(sessionRows))
  }, [form, sessionRows])

  useEffect(() => {
    if (!open) return
    form.setFieldsValue({
      institutionId: undefined,
      countsBySessionId: createEmptyEmployeeVolunteerFormCounts(sessionRows),
    })
  }, [open, form, sessionRows])

  useEffect(() => {
    if (!open || !selectedInstitutionId) {
      resetCountsForSessionRows()
      return
    }

    const saved = getEmployeeVolunteerCountsForInstitution(
      savedRegistrations,
      selectedInstitutionId
    )
    const nextCounts = createEmptyEmployeeVolunteerFormCounts(sessionRows)
    if (saved) {
      for (const row of sessionRows) {
        const entry = saved[row.id]
        if (!entry) continue
        nextCounts[row.id] = {
          newCount: entry.newCount,
          returningCount: entry.returningCount,
        }
      }
    }
    form.setFieldValue('countsBySessionId', nextCounts)
  }, [form, open, resetCountsForSessionRows, savedRegistrations, selectedInstitutionId, sessionRows])

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const handleSubmit = () => {
    const institutionId = form.getFieldValue('institutionId')
    if (!institutionId) {
      onNoInstitutionSelected()
      return
    }

    const institutionName =
      institutionOptions.find(option => option.value === institutionId)?.label ?? institutionId

    const countsBySessionId = form.getFieldValue('countsBySessionId') ?? {}
    if (!hasCompleteEmployeeVolunteerCounts(sessionRows, countsBySessionId)) {
      onIncompleteCounts()
      return
    }

    const normalizedCounts: Partial<
      Record<EmployeeVolunteerSessionRowId, EmployeeVolunteerSessionCounts>
    > = {}
    for (const row of sessionRows) {
      const entry = countsBySessionId[row.id]
      normalizedCounts[row.id] = {
        newCount: entry?.newCount ?? 0,
        returningCount: entry?.returningCount ?? 0,
      }
    }

    onRegister({
      institutionId,
      institutionName,
      countsBySessionId: normalizedCounts,
    })
    form.resetFields()
    onCancel()
  }

  const footer = (
    <>
      <CmsButton variant="secondary" size="large" onClick={handleCancel}>
        취소
      </CmsButton>
      <CmsButton variant="primary" size="large" onClick={handleSubmit}>
        등록
      </CmsButton>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="임직원 자원봉사자 등록"
      width={MODAL_WIDTH}
      footer={footer}
      className="register-employee-volunteer-modal"
      description={
        '배정된 기관에 배정된 신규/재참여 임직원 자원봉사자 수를 일정 별로 입력해 주세요.\n배정된 자원봉사자가 없는 경우, 0으로 입력해 주세요.'
      }
    >
      <div className="register-employee-volunteer-modal__body">
        <Form<RegisterEmployeeVolunteerFormValues>
          form={form}
          layout="vertical"
          className="register-employee-volunteer-modal__form"
          requiredMark={false}
          initialValues={{ countsBySessionId: createEmptyEmployeeVolunteerFormCounts(sessionRows) }}
        >
          <Form.Item
            name="institutionId"
            label="배정 기관"
            className="register-employee-volunteer-modal__field"
          >
            <CmsSelect
              inputSize="large"
              width="100%"
              withAllOption={false}
              placeholder="자원봉사자를 배정할 기관을 선택해 주세요"
              options={institutionOptions}
              notFoundContent={
                institutionOptions.length === 0 ? '배정 가능한 기관이 없습니다' : undefined
              }
              getPopupContainer={() => document.body}
            />
          </Form.Item>

          {sessionRows.length > 0 ? (
            <div
              className="register-employee-volunteer-modal__grid"
              role="group"
              aria-label="일정별 임직원 자원봉사자 수"
            >
              {sessionRows.map(sessionRow => (
                <div key={sessionRow.id} className="register-employee-volunteer-modal__row">
                  <div className="register-employee-volunteer-modal__session-label">
                    {sessionRow.label}
                  </div>
                  <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap register-employee-volunteer-modal__counts">
                    <SessionVolunteerCountPair sessionRow={sessionRow} field="newCount" />
                    <DetailInfoForm.InputsSeparator />
                    <SessionVolunteerCountPair sessionRow={sessionRow} field="returningCount" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="register-employee-volunteer-modal__empty">
              프로그램 교육 일정 정보가 없어 입력할 일정을 표시할 수 없습니다.
            </p>
          )}
        </Form>
      </div>
    </ContentModal>
  )
}
