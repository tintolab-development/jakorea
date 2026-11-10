/**
 * 참여 봉사자 — 임직원 자원봉사자 등록 모달
 * 프로그램 진행 현황 > 참여 봉사자 > 임직원 자원봉사자 등록
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Form } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CmsNumericInput, CmsSelect } from '@/shared/ui'
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
  /** 기관 선택 시 배정 일정 라벨이 반영된 행(미전달 시 sessionRows) */
  resolveSessionRowsForInstitution?: (institutionId?: string) => EmployeeVolunteerSessionRow[]
  institutionOptions: RegisterEmployeeVolunteerInstitutionOption[]
  savedRegistrations: ReadonlyArray<EmployeeVolunteerInstitutionRegistration>
  /** 개인 프로그램 — 배정 기관 셀렉 비노출 */
  hideInstitutionSelect?: boolean
  /** 개인 프로그램 — savedRegistrations 조회·저장 스코프 id */
  programLevelRegistrationScopeId?: string
  onNoInstitutionSelected: () => void
  onIncompleteCounts: () => void
  onRegister: (payload: RegisterEmployeeVolunteerPayload) => void | Promise<void>
  /** 기관 선택 시 remote 저장값 프리필 */
  onInstitutionChange?: (institutionId: string) => void
  /** 개인 프로그램 — 모달 오픈 시 프로그램 단위 저장값 프리필 */
  onProgramLevelOpen?: () => void
  /** 인원 입력 placeholder — 생략 시 기존 「자원봉사자 수 입력」. 일반 기관형 Figma 07-1/02는 「자원봉사자 수」 */
  countPlaceholder?: string
}

const MODAL_WIDTH = 880
const DEFAULT_COUNT_PLACEHOLDER = '자원봉사자 수 입력'

const INSTITUTION_DESCRIPTION =
  '각 배정 기관의 진행 일정별로 신규 참여 및 재참여 임직원 자원봉사자 수를 입력해 주세요.\n배정된 자원봉사자가 없는 경우 0으로 입력해 주세요.'

const INDIVIDUAL_PROGRAM_DESCRIPTION =
  '프로그램 교육 진행 일정별로 신규 참여 및 재참여 임직원 자원봉사자 수를 입력해 주세요.\n배정된 자원봉사자가 없는 경우 0으로 입력해 주세요.'

function SessionVolunteerCountPair({
  sessionRow,
  field,
  placeholder,
}: {
  sessionRow: EmployeeVolunteerSessionRow
  field: 'newCount' | 'returningCount'
  placeholder: string
}) {
  const label = field === 'newCount' ? '신규' : '재참여'

  return (
    <div className="register-employee-volunteer-modal__count-pair">
      <span className="detail-info-form--text">{label}</span>
      <Form.Item
        name={['countsBySessionId', sessionRow.id, field]}
        trigger="onValueChange"
        getValueFromEvent={value => parsePositiveIntInput(value)}
        getValueProps={value => ({ value: value == null ? '' : String(value) })}
      >
        <CmsNumericInput
          mode="integer"
          min={0}
          inputSize="small"
          pattern="[0-9]*"
          width="100%"
          placeholder={placeholder}
          aria-label={`${sessionRow.label} ${label} 자원봉사자 수`}
        />
      </Form.Item>
    </div>
  )
}

export function RegisterEmployeeVolunteerModal({
  open,
  onCancel,
  sessionRows,
  resolveSessionRowsForInstitution,
  institutionOptions,
  savedRegistrations,
  hideInstitutionSelect = false,
  programLevelRegistrationScopeId,
  onNoInstitutionSelected,
  onIncompleteCounts,
  onRegister,
  onInstitutionChange,
  onProgramLevelOpen,
  countPlaceholder = DEFAULT_COUNT_PLACEHOLDER,
}: RegisterEmployeeVolunteerModalProps) {
  const [form] = Form.useForm<RegisterEmployeeVolunteerFormValues>()
  const [submitting, setSubmitting] = useState(false)
  const selectedInstitutionId = Form.useWatch('institutionId', form)
  const displaySessionRows = useMemo(() => {
    if (hideInstitutionSelect) {
      return resolveSessionRowsForInstitution?.(programLevelRegistrationScopeId) ?? [...sessionRows]
    }
    if (!selectedInstitutionId) {
      return [...sessionRows]
    }
    return resolveSessionRowsForInstitution?.(selectedInstitutionId) ?? [...sessionRows]
  }, [
    hideInstitutionSelect,
    programLevelRegistrationScopeId,
    resolveSessionRowsForInstitution,
    selectedInstitutionId,
    sessionRows,
  ])
  const appliedScopeIdRef = useRef<string | null>(null)
  const appliedSavedSnapshotRef = useRef<string>('')

  const resetCountsForSessionRows = useCallback(() => {
    form.setFieldValue('countsBySessionId', createEmptyEmployeeVolunteerFormCounts(sessionRows))
  }, [form, sessionRows])

  const applySavedCountsForScope = useCallback(
    (scopeId: string | undefined) => {
      const nextCounts = createEmptyEmployeeVolunteerFormCounts(sessionRows)
      if (!scopeId) {
        form.setFieldValue('countsBySessionId', nextCounts)
        return
      }
      const saved = getEmployeeVolunteerCountsForInstitution(savedRegistrations, scopeId)
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
    },
    [form, savedRegistrations, sessionRows]
  )

  useEffect(() => {
    if (!open) {
      appliedScopeIdRef.current = null
      appliedSavedSnapshotRef.current = ''
      return
    }

    form.setFieldsValue({
      institutionId: undefined,
      countsBySessionId: createEmptyEmployeeVolunteerFormCounts(sessionRows),
    })
    appliedScopeIdRef.current = null
    appliedSavedSnapshotRef.current = ''

    if (hideInstitutionSelect) {
      onProgramLevelOpen?.()
    }
    // open 전환 시에만 초기화 — onProgramLevelOpen 인라인 참조 변경으로 폼이 리셋되지 않도록 deps 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hideInstitutionSelect, sessionRows])

  useEffect(() => {
    if (!open || hideInstitutionSelect || !selectedInstitutionId) return
    onInstitutionChange?.(selectedInstitutionId)
  }, [hideInstitutionSelect, onInstitutionChange, open, selectedInstitutionId])

  useEffect(() => {
    if (!open) return

    const scopeId = hideInstitutionSelect
      ? programLevelRegistrationScopeId
      : selectedInstitutionId

    if (!hideInstitutionSelect && !scopeId) {
      if (appliedScopeIdRef.current !== null) {
        resetCountsForSessionRows()
        appliedScopeIdRef.current = null
        appliedSavedSnapshotRef.current = ''
      }
      return
    }

    if (!scopeId) return

    const saved = getEmployeeVolunteerCountsForInstitution(savedRegistrations, scopeId)
    const savedSnapshot = JSON.stringify(saved ?? null)
    const scopeChanged = appliedScopeIdRef.current !== scopeId
    const savedChanged = appliedSavedSnapshotRef.current !== savedSnapshot

    if (!scopeChanged && !savedChanged) return

    applySavedCountsForScope(scopeId)
    appliedScopeIdRef.current = scopeId
    appliedSavedSnapshotRef.current = savedSnapshot
  }, [
    applySavedCountsForScope,
    hideInstitutionSelect,
    open,
    programLevelRegistrationScopeId,
    resetCountsForSessionRows,
    savedRegistrations,
    selectedInstitutionId,
  ])

  const handleCancel = () => {
    if (submitting) return
    form.resetFields()
    onCancel()
  }

  const handleSubmit = async () => {
    if (submitting) return

    let institutionId: string
    let institutionName: string

    if (hideInstitutionSelect) {
      if (!programLevelRegistrationScopeId) return
      institutionId = programLevelRegistrationScopeId
      institutionName = ''
    } else {
      const selectedId = form.getFieldValue('institutionId')
      if (!selectedId) {
        onNoInstitutionSelected()
        return
      }
      institutionId = selectedId
      institutionName =
        institutionOptions.find(option => option.value === institutionId)?.label ?? institutionId
    }

    const countsBySessionId = form.getFieldValue('countsBySessionId') ?? {}
    if (!hasCompleteEmployeeVolunteerCounts(displaySessionRows, countsBySessionId)) {
      onIncompleteCounts()
      return
    }

    const normalizedCounts: Partial<
      Record<EmployeeVolunteerSessionRowId, EmployeeVolunteerSessionCounts>
    > = {}
    for (const row of displaySessionRows) {
      const entry = countsBySessionId[row.id]
      normalizedCounts[row.id] = {
        newCount: entry?.newCount ?? 0,
        returningCount: entry?.returningCount ?? 0,
      }
    }

    setSubmitting(true)
    try {
      await onRegister({
        institutionId,
        institutionName,
        countsBySessionId: normalizedCounts,
      })
      form.resetFields()
      onCancel()
    } finally {
      setSubmitting(false)
    }
  }

  const footer = (
    <>
      <CmsButton variant="secondary" size="large" onClick={handleCancel} disabled={submitting}>
        취소
      </CmsButton>
      <CmsButton
        variant="primary"
        size="large"
        onClick={() => void handleSubmit()}
        loading={submitting}
        disabled={submitting} >
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
      description={hideInstitutionSelect ? INDIVIDUAL_PROGRAM_DESCRIPTION : INSTITUTION_DESCRIPTION}
    >
      <div className="register-employee-volunteer-modal__body">
        <Form<RegisterEmployeeVolunteerFormValues>
          form={form}
          layout="vertical"
          className="register-employee-volunteer-modal__form"
          requiredMark={false}
          initialValues={{ countsBySessionId: createEmptyEmployeeVolunteerFormCounts(sessionRows) }}
        >
          <DetailInfoForm title="임직원 자원봉사자 등록" hideHeader mode="edit">
            {!hideInstitutionSelect ? (
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="배정 기관"
                  required
                  fullRow
                  view="-"
                  edit={
                    <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
                      <CmsSelect
                        inputSize="small"
                        width="100%"
                        withAllOption={false}
                        placeholder="자원봉사자를 배정할 기관을 선택해 주세요"
                        value={selectedInstitutionId || undefined}
                        options={institutionOptions}
                        onChange={next =>
                          form.setFieldValue('institutionId', next ? String(next) : undefined)
                        }
                        notFoundContent={
                          institutionOptions.length === 0
                            ? '배정 가능한 기관이 없습니다'
                            : undefined
                        }
                        getPopupContainer={() => document.body}
                      />
                    </div>
                  }
                />
              </DetailInfoForm.Row>
            ) : null}
            {displaySessionRows.length > 0 ? (
              displaySessionRows.map(sessionRow => (
                <DetailInfoForm.Row type="single" key={sessionRow.id}>
                  <DetailInfoForm.Field
                    label={sessionRow.label}
                    fullRow
                    view="-"
                    edit={
                      <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap register-employee-volunteer-modal__counts">
                        <SessionVolunteerCountPair
                          sessionRow={sessionRow}
                          field="newCount"
                          placeholder={countPlaceholder}
                        />
                        <DetailInfoForm.InputsSeparator />
                        <SessionVolunteerCountPair
                          sessionRow={sessionRow}
                          field="returningCount"
                          placeholder={countPlaceholder}
                        />
                      </div>
                    }
                  />
                </DetailInfoForm.Row>
              ))
            ) : (
              <DetailInfoForm.Row type="custom">
                <p className="register-employee-volunteer-modal__empty">
                  프로그램 교육 일정 정보가 없어 입력할 일정을 표시할 수 없습니다.
                </p>
              </DetailInfoForm.Row>
            )}
          </DetailInfoForm>
        </Form>
      </div>
    </ContentModal>
  )
}
