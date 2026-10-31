import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ContentModal, CmsButton, CmsCheckbox } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { fetchUjatEducationClasses } from '@/features/program/ujat/api/education-classes-api'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import type { UjatInstitutionApplicationGradeBlockDetail } from '../../../application-institution/detail/detail-types'
import type { EducationProgressHalfKey } from '../../tabs'
import type { UjatEducationProgressInstitutionDetail } from './types'
import {
  UNASSIGNED_GRADE_VALUE,
  UNASSIGNED_GRADE_LABEL,
  buildChangeClassScheduleOptions,
  buildExistingClassOptions,
  buildExistingClassOptionsFromEducationClasses,
  buildMappingFromRowFields,
  validateChangeClassRows,
  type ChangeClassConfirmPayload,
} from './change-class'
import './change-class-modal.css'

const MODAL_Z_INDEX = 1100

const NEW_GRADE_OPTIONS = [
  ...Array.from({ length: 6 }, (_, index) => ({
    value: String(index + 1),
    label: `${index + 1}학년`,
  })),
  { value: UNASSIGNED_GRADE_VALUE, label: UNASSIGNED_GRADE_LABEL },
]

const NEW_CLASS_OPTIONS = Array.from({ length: 20 }, (_, index) => ({
  value: String(index + 1),
  label: `${index + 1}반`,
}))

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

export type ChangeClassRemoteScheduleRow = {
  id: string
  dateDisplay: string
  isoDate?: string
  /** matrix scheduleId — remapping applyFromScheduleId */
  numericScheduleId?: number | null
}

export type UjatEducationProgressChangeClassModalProps = {
  open: boolean
  programId: string
  half: EducationProgressHalfKey
  detail: UjatEducationProgressInstitutionDetail
  gradeBlocks: ReadonlyArray<UjatInstitutionApplicationGradeBlockDetail>
  remoteScheduleRows?: ReadonlyArray<ChangeClassRemoteScheduleRow>
  confirming?: boolean
  onCancel: () => void
  onConfirm: (payload: ChangeClassConfirmPayload) => void | Promise<void>
}

export function UjatEducationProgressChangeClassModal({
  open,
  programId,
  half,
  detail,
  gradeBlocks,
  remoteScheduleRows = [],
  confirming = false,
  onCancel,
  onConfirm,
}: UjatEducationProgressChangeClassModalProps) {
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)

  const educationClassesQuery = useQuery({
    queryKey: [
      ...ujatQueryKeys.organizationDetail(programId, detail.institutionId),
      'education-classes',
    ],
    queryFn: () => fetchUjatEducationClasses(programId, detail.institutionId),
    enabled: open && remoteEnabled && Boolean(detail.institutionId),
    staleTime: 30_000,
    retry: false,
  })

  const scheduleOptions = useMemo(
    () => buildChangeClassScheduleOptions(detail, half, remoteScheduleRows),
    [detail, half, remoteScheduleRows]
  )

  const existingClassOptions = useMemo(() => {
    const remoteClasses = educationClassesQuery.data?.classes
    if (remoteClasses && remoteClasses.length > 0) {
      return buildExistingClassOptionsFromEducationClasses(remoteClasses)
    }
    return buildExistingClassOptions(gradeBlocks)
  }, [educationClassesQuery.data?.classes, gradeBlocks])

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
    if (confirming) return false
    if (!applyScheduleRowId) return false
    if (!scheduleOptions.some(option => option.value === applyScheduleRowId)) return false
    return validateChangeClassRows(rows) == null
  }, [applyScheduleRowId, confirming, rows, scheduleOptions])

  const handleCancel = useCallback(() => {
    if (confirming) return
    setRows([createEmptyRow()])
    setFormError(null)
    setApplyScheduleRowId(undefined)
    onCancel()
  }, [confirming, onCancel])

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

  const handleConfirm = useCallback(async () => {
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

    const remoteRow = remoteScheduleRows.find(row => row.id === selectedSchedule.value)
    const numericScheduleId =
      remoteRow?.numericScheduleId != null && Number.isFinite(remoteRow.numericScheduleId)
        ? Number(remoteRow.numericScheduleId)
        : null
    const expectedRevision = educationClassesQuery.data?.revision
    if (
      remoteEnabled &&
      (expectedRevision == null || !Number.isFinite(expectedRevision))
    ) {
      setFormError('교육 학급 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      return
    }

    await onConfirm({
      applyScheduleRowId: selectedSchedule.value,
      applyFromScheduleId: numericScheduleId,
      applyIsoDate: selectedSchedule.isoDate,
      expectedRevision:
        expectedRevision != null && Number.isFinite(expectedRevision) ? expectedRevision : null,
      mappings,
    })
  }, [
    applyScheduleRowId,
    educationClassesQuery.data?.revision,
    onConfirm,
    remoteEnabled,
    remoteScheduleRows,
    rows,
    scheduleOptions,
  ])

  const footer = (
    <div className="ujat-education-progress-change-class-modal__footer">
      <CmsButton
        variant="secondary"
        size="h40"
        type="button"
        disabled={confirming}
        onClick={handleCancel}
      >
        취소
      </CmsButton>
      <CmsButton
        variant="primary"
        size="h40"
        type="button"
        disabled={!canConfirm}
        loading={confirming}
        onClick={() => {
          void handleConfirm()
        }}
      >
        변경
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
        "기존 학급과 변경할 학급 정보를 입력해 주세요.\n기존 학급의 교육만 취소하려면 변경할 학급의 학년을 '미배정'으로 선택해 주세요."
      }
    >
      <div className="ujat-education-progress-change-class-modal__apply-date-field">
        <span className="ujat-education-progress-change-class-modal__apply-date-label">
          변경사항 적용일
          <span className="ujat-education-progress-change-class-modal__required" aria-hidden>
            *
          </span>
        </span>
        <CmsSelect
          inputSize="medium"
          width="100%"
          withAllOption={false}
          placeholder="변경사항 적용일을 선택해 주세요"
          value={applyScheduleRowId}
          disabled={scheduleOptions.length === 0 || scheduleSelectDisabled || confirming}
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
            size="h32"
            className="ujat-education-progress-change-class-modal__toolbar-btn"
            disabled={!someRowsSelected || confirming}
            onClick={handleRemoveSelectedRows}
          >
            삭제
          </CmsButton>
          <CmsButton
            type="button"
            variant="secondary"
            size="h32"
            className="ujat-education-progress-change-class-modal__toolbar-btn"
            disabled={confirming}
            onClick={handleAddRow}
          >
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
                  disabled={confirming}
                  onChange={event => handleToggleAllRows(event.target.checked)}
                  aria-label="전체 선택"
                />
              </div>
              <div className="ujat-education-progress-change-class-modal__header-cell">기존 학급</div>
              <div className="ujat-education-progress-change-class-modal__header-cell">
                변경할 학급
              </div>
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
                      disabled={confirming}
                      onChange={event => handleToggleRow(row.id, event.target.checked)}
                      aria-label="행 선택"
                    />
                  </div>
                  <div className="ujat-education-progress-change-class-modal__body-cell">
                    <div className="ujat-education-progress-change-class-modal__class-fields">
                      <div className="ujat-education-progress-change-class-modal__field">
                        <CmsSelect
                          inputSize="small"
                          width="100%"
                          withAllOption={false}
                          placeholder="학년"
                          value={row.existingGrade}
                          disabled={confirming}
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
                      </div>
                      <span
                        className="ujat-education-progress-change-class-modal__field-divider"
                        aria-hidden
                      />
                      <div className="ujat-education-progress-change-class-modal__field">
                        <CmsSelect
                          inputSize="small"
                          width="100%"
                          withAllOption={false}
                          placeholder="학급"
                          value={row.existingClassNo}
                          disabled={!row.existingGrade || confirming}
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
                  </div>
                  <div className="ujat-education-progress-change-class-modal__body-cell">
                    <div className="ujat-education-progress-change-class-modal__class-fields">
                      <div className="ujat-education-progress-change-class-modal__field">
                        <CmsSelect
                          inputSize="small"
                          width="100%"
                          withAllOption={false}
                          placeholder="학년"
                          value={row.newGrade}
                          disabled={confirming}
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
                      </div>
                      <span
                        className="ujat-education-progress-change-class-modal__field-divider"
                        aria-hidden
                      />
                      <div className="ujat-education-progress-change-class-modal__field">
                        <CmsSelect
                          inputSize="small"
                          width="100%"
                          withAllOption={false}
                          placeholder="학급"
                          value={row.newClassNo || undefined}
                          disabled={isNewClassDisabled || confirming}
                          onChange={value => {
                            setRows(prev =>
                              prev.map(item =>
                                item.id === row.id
                                  ? {
                                      ...item,
                                      newClassNo: value == null ? '' : String(value),
                                    }
                                  : item
                              )
                            )
                            setFormError(null)
                          }}
                          options={NEW_CLASS_OPTIONS}
                          aria-label="변경 학급"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {formError ? (
          <p
            className="form-editor-template-field-hint-text ujat-education-progress-change-class-modal__form-error"
            role="alert"
          >
            {formError}
          </p>
        ) : null}
      </div>
    </ContentModal>
  )
}
