import { useCallback, useEffect, useMemo, useState } from 'react'
import { ContentModal, CmsButton, CmsCheckbox } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { UjatInstitutionApplicationGradeBlockDetail } from '../../../application-institution/detail/detail-types'
import type { EducationProgressHalfKey } from '../../ujat-education-progress-tabs'
import type { UjatEducationProgressInstitutionDetail } from './types'
import {
  UNASSIGNED_GRADE_VALUE,
  UNASSIGNED_GRADE_LABEL,
  buildChangeClassScheduleOptions,
  buildExistingClassOptions,
  buildMappingFromRowFields,
  validateChangeClassRows,
  type ChangeClassConfirmPayload,
} from './ujat-education-progress-change-class'
import './ujat-education-progress-change-class-modal.css'

const MODAL_Z_INDEX = 1100

const NEW_GRADE_OPTIONS = [
  ...Array.from({ length: 6 }, (_, index) => ({
    value: String(index + 1),
    label: `${index + 1}학년`,
  })),
  { value: UNASSIGNED_GRADE_VALUE, label: UNASSIGNED_GRADE_LABEL },
]

type ChangeClassRowState = {
  id: string
  selected: boolean
  existingGrade?: string
  existingClassNo?: string
  newGrade?: string
  newClassNo: string
}

function createRowId(): string {
  return `change-row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createEmptyRow(): ChangeClassRowState {
  return {
    id: createRowId(),
    selected: false,
    existingGrade: undefined,
    existingClassNo: undefined,
    newGrade: undefined,
    newClassNo: '',
  }
}

export type UjatEducationProgressChangeClassModalProps = {
  open: boolean
  half: EducationProgressHalfKey
  detail: UjatEducationProgressInstitutionDetail
  gradeBlocks: ReadonlyArray<UjatInstitutionApplicationGradeBlockDetail>
  onCancel: () => void
  onConfirm: (payload: ChangeClassConfirmPayload) => void
}

export function UjatEducationProgressChangeClassModal({
  open,
  half,
  detail,
  gradeBlocks,
  onCancel,
  onConfirm,
}: UjatEducationProgressChangeClassModalProps) {
  const scheduleOptions = useMemo(
    () => buildChangeClassScheduleOptions(detail, half),
    [detail, half]
  )

  const existingClassOptions = useMemo(
    () => buildExistingClassOptions(gradeBlocks),
    [gradeBlocks]
  )

  const scheduleSelectDisabled = scheduleOptions.length <= 1

  const [applyScheduleRowId, setApplyScheduleRowId] = useState<string | undefined>(undefined)
  const [rows, setRows] = useState<ChangeClassRowState[]>(() => [createEmptyRow()])
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setRows([createEmptyRow()])
    setFormError(null)
    if (scheduleOptions.length === 1) {
      setApplyScheduleRowId(scheduleOptions[0].value)
    } else {
      setApplyScheduleRowId(undefined)
    }
  }, [open, scheduleOptions])

  const allRowsSelected = rows.length > 0 && rows.every(row => row.selected)
  const someRowsSelected = rows.some(row => row.selected)
  const headerCheckboxIndeterminate = someRowsSelected && !allRowsSelected

  const canConfirm = useMemo(() => {
    if (!applyScheduleRowId) return false
    if (!scheduleOptions.some(option => option.value === applyScheduleRowId)) return false
    return validateChangeClassRows(rows) == null
  }, [applyScheduleRowId, rows, scheduleOptions])

  const handleCancel = useCallback(() => {
    setRows([createEmptyRow()])
    setFormError(null)
    setApplyScheduleRowId(undefined)
    onCancel()
  }, [onCancel])

  const handleToggleAllRows = useCallback((checked: boolean) => {
    setRows(prev => prev.map(row => ({ ...row, selected: checked })))
  }, [])

  const handleToggleRow = useCallback((rowId: string, checked: boolean) => {
    setRows(prev => prev.map(row => (row.id === rowId ? { ...row, selected: checked } : row)))
  }, [])

  const handleAddRow = useCallback(() => {
    setRows(prev => [...prev, createEmptyRow()])
    setFormError(null)
  }, [])

  const handleRemoveSelectedRows = useCallback(() => {
    setRows(prev => {
      const selectedCount = prev.filter(row => row.selected).length
      if (selectedCount === 0) return prev
      const next = prev.filter(row => !row.selected)
      if (next.length === 0) return [createEmptyRow()]
      if (selectedCount === prev.length) return [createEmptyRow()]
      return next
    })
    setFormError(null)
  }, [])

  const handleConfirm = useCallback(() => {
    const validationError = validateChangeClassRows(rows)
    if (validationError) {
      setFormError(validationError)
      return
    }

    const selectedSchedule = scheduleOptions.find(option => option.value === applyScheduleRowId)
    if (!selectedSchedule) {
      setFormError('변경사항 적용일을 선택해 주세요.')
      return
    }

    const mappings = rows
      .map(row =>
        buildMappingFromRowFields(
          row.existingGrade,
          row.existingClassNo,
          row.newGrade,
          row.newClassNo
        )
      )
      .filter((mapping): mapping is NonNullable<typeof mapping> => mapping != null)

    if (mappings.length !== rows.length) {
      setFormError('입력 정보를 확인해 주세요.')
      return
    }

    onConfirm({
      applyScheduleRowId: selectedSchedule.value,
      applyIsoDate: selectedSchedule.isoDate,
      mappings,
    })
    setRows([createEmptyRow()])
    setFormError(null)
    setApplyScheduleRowId(undefined)
  }, [applyScheduleRowId, onConfirm, rows, scheduleOptions])

  const footer = (
    <div className="ujat-education-progress-change-class-modal__footer">
      <CmsButton variant="secondary" size="large" type="button" onClick={handleCancel}>
        취소
      </CmsButton>
      <CmsButton
        variant="primary"
        size="large"
        type="button"
        width={200}
        disabled={!canConfirm}
        onClick={handleConfirm}
      >
        변경사항 적용
      </CmsButton>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="교육 학년 및 학급 변경"
      width={600}
      zIndex={MODAL_Z_INDEX}
      className="ujat-education-progress-change-class-modal"
      wrapClassName="ujat-education-progress-change-class-modal-wrap"
      footer={footer}
      description={
        '변경할 기존 학급과 신규 학급 정보를 입력해 주세요.\n기존 학급의 교육만 취소할 시 변경 학급의 학년 선택에서 "미배정"을 선택해 주세요.'
      }
    >
      <div className="ujat-education-progress-change-class-modal__apply-date-field">
        <span className="ujat-education-progress-change-class-modal__apply-date-label">
          변경사항 적용일
        </span>
        <CmsSelect
          inputSize="large"
          width="100%"
          withAllOption={false}
          placeholder="변경사항 적용일을 선택해 주세요"
          value={applyScheduleRowId}
          disabled={scheduleOptions.length === 0 || scheduleSelectDisabled}
          onChange={value =>
            setApplyScheduleRowId(value == null ? undefined : String(value))
          }
          options={scheduleOptions.map(option => ({
            value: option.value,
            label: option.label,
          }))}
          aria-label="변경사항 적용일"
        />
      </div>

      <div className="ujat-education-progress-change-class-modal__table-section">
        <div className="ujat-education-progress-change-class-modal__table-toolbar">
          <CmsButton
            type="button"
            variant="delete"
            size="medium"
            width={80}
            disabled={!someRowsSelected}
            onClick={handleRemoveSelectedRows}
          >
            삭제
          </CmsButton>
          <CmsButton type="button" variant="secondary" size="medium" width={80} onClick={handleAddRow}>
            추가
          </CmsButton>
        </div>

        <div className="ujat-education-progress-change-class-modal__table">
          <div className="ujat-education-progress-change-class-modal__table-scroll">
            <div className="ujat-education-progress-change-class-modal__header-row">
              <div className="ujat-education-progress-change-class-modal__header-cell ujat-education-progress-change-class-modal__header-cell--checkbox">
                <CmsCheckbox
                  checked={allRowsSelected}
                  indeterminate={headerCheckboxIndeterminate}
                  onChange={event => handleToggleAllRows(event.target.checked)}
                  aria-label="전체 선택"
                />
              </div>
              <div className="ujat-education-progress-change-class-modal__header-cell">기존 학급</div>
              <div className="ujat-education-progress-change-class-modal__header-cell">변경 학급</div>
            </div>

            {rows.map(row => {
              const classOptions = row.existingGrade
                ? (existingClassOptions.classOptionsByGrade[row.existingGrade] ?? [])
                : []
              const isNewClassDisabled = row.newGrade === UNASSIGNED_GRADE_VALUE

              return (
                <div key={row.id} className="ujat-education-progress-change-class-modal__data-row">
                  <div className="ujat-education-progress-change-class-modal__body-cell ujat-education-progress-change-class-modal__body-cell--checkbox">
                    <CmsCheckbox
                      checked={row.selected}
                      onChange={event => handleToggleRow(row.id, event.target.checked)}
                      aria-label="행 선택"
                    />
                  </div>
                  <div className="ujat-education-progress-change-class-modal__body-cell">
                    <div className="ujat-education-progress-change-class-modal__class-fields">
                      <CmsSelect
                        inputSize="medium"
                        width="100%"
                        withAllOption={false}
                        placeholder="학년"
                        value={row.existingGrade}
                        onChange={value => {
                          const grade = value == null ? undefined : String(value)
                          setRows(prev =>
                            prev.map(item =>
                              item.id === row.id
                                ? {
                                    ...item,
                                    existingGrade: grade,
                                    existingClassNo: undefined,
                                  }
                                : item
                            )
                          )
                          setFormError(null)
                        }}
                        options={existingClassOptions.gradeOptions}
                        aria-label="기존 학년"
                      />
                      <CmsSelect
                        inputSize="medium"
                        width="100%"
                        withAllOption={false}
                        placeholder="학급"
                        value={row.existingClassNo}
                        disabled={!row.existingGrade}
                        onChange={value => {
                          setRows(prev =>
                            prev.map(item =>
                              item.id === row.id
                                ? {
                                    ...item,
                                    existingClassNo:
                                      value == null ? undefined : String(value),
                                  }
                                : item
                            )
                          )
                          setFormError(null)
                        }}
                        options={classOptions}
                        aria-label="기존 학급"
                      />
                    </div>
                  </div>
                  <div className="ujat-education-progress-change-class-modal__body-cell">
                    <div className="ujat-education-progress-change-class-modal__class-fields">
                      <CmsSelect
                        inputSize="medium"
                        width="100%"
                        withAllOption={false}
                        placeholder="학년"
                        value={row.newGrade}
                        onChange={value => {
                          const grade = value == null ? undefined : String(value)
                          setRows(prev =>
                            prev.map(item =>
                              item.id === row.id
                                ? {
                                    ...item,
                                    newGrade: grade,
                                    newClassNo:
                                      grade === UNASSIGNED_GRADE_VALUE ? '' : item.newClassNo,
                                  }
                                : item
                            )
                          )
                          setFormError(null)
                        }}
                        options={NEW_GRADE_OPTIONS}
                        aria-label="변경 학년"
                      />
                      <CmsInput
                        inputSize="medium"
                        width="100%"
                        placeholder="학급"
                        value={row.newClassNo}
                        disabled={isNewClassDisabled}
                        onChange={event => {
                          const digits = event.target.value.replace(/\D/g, '')
                          setRows(prev =>
                            prev.map(item =>
                              item.id === row.id ? { ...item, newClassNo: digits } : item
                            )
                          )
                          setFormError(null)
                        }}
                        aria-label="변경 학급"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {formError ? (
          <p className="form-editor-template-field-hint-text ujat-education-progress-change-class-modal__form-error" role="alert">
            {formError}
          </p>
        ) : null}
      </div>
    </ContentModal>
  )
}
