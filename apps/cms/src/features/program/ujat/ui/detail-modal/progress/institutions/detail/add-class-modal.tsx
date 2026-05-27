import { useCallback, useEffect, useMemo, useState } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { UjatInstitutionApplicationGradeBlockDetail } from '../../../application-institution/detail/detail-types'
import {
  flattenExistingClasses,
  formatGradeLabelFromValue,
  gradeValueFromLabel,
  isDuplicateClassInGradeBlocks,
  removeClassesFromGradeBlocks,
  type UjatEducationProgressClassRemoval,
  type UjatEducationProgressPendingClassRow,
} from './grade-blocks'

export type UjatEducationProgressAddClassConfirmPayload = {
  added: UjatEducationProgressPendingClassRow[]
  removed: UjatEducationProgressClassRemoval[]
}
import './add-class-modal.css'

const MODAL_Z_INDEX = 1100

const GRADE_OPTIONS = Array.from({ length: 6 }, (_, index) => ({
  value: String(index + 1),
  label: `${index + 1}학년`,
}))

const CLASS_OPTIONS = Array.from({ length: 20 }, (_, index) => ({
  value: String(index + 1),
  label: `${index + 1}반`,
}))

type DraftClassForm = {
  grade?: string
  classNo?: string
  studentCount: string
}

const EMPTY_DRAFT: DraftClassForm = {
  grade: undefined,
  classNo: undefined,
  studentCount: '',
}

function parseStudentCount(raw: string): number | null {
  const value = Number.parseInt(raw.replace(/\D/g, ''), 10)
  if (!Number.isFinite(value) || value < 1) return null
  return value
}

function createPendingRowId(): string {
  return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

type ClassRowFieldsProps = {
  grade?: string
  classNo?: string
  studentCount: string
  readOnly?: boolean
  onGradeChange?: (value: string | undefined) => void
  onClassNoChange?: (value: string | undefined) => void
  onStudentCountChange?: (value: string) => void
  gradeAriaLabel: string
  classAriaLabel: string
  studentCountAriaLabel: string
}

function ClassRowFields({
  grade,
  classNo,
  studentCount,
  readOnly = false,
  onGradeChange,
  onClassNoChange,
  onStudentCountChange,
  gradeAriaLabel,
  classAriaLabel,
  studentCountAriaLabel,
}: ClassRowFieldsProps) {
  return (
    <div className="ujat-education-progress-add-class-modal__inputs">
      <div className="ujat-education-progress-add-class-modal__field-grade">
        <CmsSelect
          inputSize="medium"
          width={110}
          withAllOption={false}
          placeholder="신청 학년"
          value={grade}
          disabled={readOnly}
          onChange={value => onGradeChange?.(value == null ? undefined : String(value))}
          options={GRADE_OPTIONS}
          aria-label={gradeAriaLabel}
        />
      </div>
      <div className="ujat-education-progress-add-class-modal__field-class">
        <CmsSelect
          inputSize="medium"
          width="100%"
          withAllOption={false}
          placeholder="신청 학급"
          value={classNo}
          disabled={readOnly}
          onChange={value => onClassNoChange?.(value == null ? undefined : String(value))}
          options={CLASS_OPTIONS}
          aria-label={classAriaLabel}
        />
      </div>
      <div className="ujat-education-progress-add-class-modal__field-student">
        <CmsInput
          inputSize="medium"
          width={110}
          placeholder="총 학생 수"
          value={studentCount}
          readOnly={readOnly}
          onChange={event => onStudentCountChange?.(event.target.value)}
          aria-label={studentCountAriaLabel}
        />
      </div>
      <span className="ujat-education-progress-add-class-modal__unit">명</span>
    </div>
  )
}

export type UjatEducationProgressAddClassModalProps = {
  open: boolean
  currentTotalClassCount: number
  existingGradeBlocks: ReadonlyArray<UjatInstitutionApplicationGradeBlockDetail>
  onCancel: () => void
  onConfirm: (payload: UjatEducationProgressAddClassConfirmPayload) => void
}

export function UjatEducationProgressAddClassModal({
  open,
  currentTotalClassCount,
  existingGradeBlocks,
  onCancel,
  onConfirm,
}: UjatEducationProgressAddClassModalProps) {
  const [pendingRows, setPendingRows] = useState<UjatEducationProgressPendingClassRow[]>([])
  const [removedExistingIds, setRemovedExistingIds] = useState<Set<string>>(() => new Set())
  const [draft, setDraft] = useState<DraftClassForm>(EMPTY_DRAFT)
  const [draftError, setDraftError] = useState<string | null>(null)

  const existingClassRows = useMemo(
    () => flattenExistingClasses(existingGradeBlocks),
    [existingGradeBlocks]
  )

  const visibleExistingClassRows = useMemo(
    () => existingClassRows.filter(row => !removedExistingIds.has(row.id)),
    [existingClassRows, removedExistingIds]
  )

  const removedExistingClasses = useMemo(
    (): UjatEducationProgressClassRemoval[] =>
      existingClassRows
        .filter(row => removedExistingIds.has(row.id))
        .map(row => ({ gradeLabel: row.gradeLabel, classNo: row.classNo })),
    [existingClassRows, removedExistingIds]
  )

  const effectiveGradeBlocks = useMemo(
    () => removeClassesFromGradeBlocks(existingGradeBlocks, removedExistingClasses),
    [existingGradeBlocks, removedExistingClasses]
  )

  const hasChanges = pendingRows.length > 0 || removedExistingIds.size > 0

  useEffect(() => {
    if (!open) return
    setPendingRows([])
    setRemovedExistingIds(new Set())
    setDraft(EMPTY_DRAFT)
    setDraftError(null)
  }, [open])

  const handleCancel = useCallback(() => {
    setPendingRows([])
    setRemovedExistingIds(new Set())
    setDraft(EMPTY_DRAFT)
    setDraftError(null)
    onCancel()
  }, [onCancel])

  const validateDraft = useCallback((): UjatEducationProgressPendingClassRow | null => {
    if (!draft.grade || !draft.classNo) {
      setDraftError('신청 학년과 신청 학급을 선택해 주세요.')
      return null
    }

    const studentCount = parseStudentCount(draft.studentCount)
    if (studentCount == null) {
      setDraftError('총 학생 수를 입력해 주세요.')
      return null
    }

    const gradeLabel = formatGradeLabelFromValue(draft.grade)
    const classNo = Number.parseInt(draft.classNo, 10)

    const duplicatedInPending = pendingRows.some(
      row => row.gradeLabel === gradeLabel && row.classNo === classNo
    )
    if (duplicatedInPending) {
      setDraftError('이미 등록 목록에 추가된 학급입니다.')
      return null
    }

    if (isDuplicateClassInGradeBlocks(effectiveGradeBlocks, gradeLabel, classNo)) {
      setDraftError('이미 진행 중인 학급입니다.')
      return null
    }

    setDraftError(null)
    return {
      id: createPendingRowId(),
      gradeLabel,
      classNo,
      studentCount,
    }
  }, [draft, effectiveGradeBlocks, pendingRows])

  const handleRegisterDraft = useCallback(() => {
    const nextRow = validateDraft()
    if (!nextRow) return
    setPendingRows(prev => [...prev, nextRow])
    setDraft(EMPTY_DRAFT)
  }, [validateDraft])

  const handleRemovePendingRow = useCallback((rowId: string) => {
    setPendingRows(prev => prev.filter(row => row.id !== rowId))
    setDraftError(null)
  }, [])

  const handleRemoveExistingRow = useCallback((rowId: string) => {
    setRemovedExistingIds(prev => new Set([...prev, rowId]))
    setDraftError(null)
  }, [])

  const handleConfirm = useCallback(() => {
    if (!hasChanges) return
    onConfirm({ added: pendingRows, removed: removedExistingClasses })
    setPendingRows([])
    setRemovedExistingIds(new Set())
    setDraft(EMPTY_DRAFT)
    setDraftError(null)
  }, [hasChanges, onConfirm, pendingRows, removedExistingClasses])

  const footer = (
    <div className="ujat-education-progress-add-class-modal__footer">
      <CmsButton variant="secondary" size="large" type="button" onClick={handleCancel}>
        취소
      </CmsButton>
      <CmsButton
        variant="primary"
        size="large"
        type="button"
        disabled={!hasChanges}
        onClick={handleConfirm}
      >
        학급 추가
      </CmsButton>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="교육 학급 추가"
      width={600}
      zIndex={MODAL_Z_INDEX}
      className="ujat-education-progress-add-class-modal"
      wrapClassName="ujat-education-progress-add-class-modal-wrap"
      footer={footer}
      description={`현재 진행 학급은 총 **[${currentTotalClassCount}학급]**입니다.\n추가로 교육을 진행할 학급 정보를 입력해 주세요.`}
    >
      <div className="ujat-education-progress-add-class-modal__table">
        <div className="ujat-education-progress-add-class-modal__table-scroll">
          <div className="ujat-education-progress-add-class-modal__header-row">
            <div className="ujat-education-progress-add-class-modal__header-info">추가 학급 정보</div>
            <div className="ujat-education-progress-add-class-modal__header-actions">관리</div>
          </div>

          {visibleExistingClassRows.map(row => (
            <div key={row.id} className="ujat-education-progress-add-class-modal__data-row">
              <div className="ujat-education-progress-add-class-modal__cell-info">
                <ClassRowFields
                  readOnly
                  grade={gradeValueFromLabel(row.gradeLabel)}
                  classNo={String(row.classNo)}
                  studentCount={String(row.studentCount)}
                  gradeAriaLabel={row.gradeLabel}
                  classAriaLabel={`${row.classNo}반`}
                  studentCountAriaLabel={`${row.studentCount}명`}
                />
              </div>
              <div className="ujat-education-progress-add-class-modal__cell-actions">
                <CmsButton
                  type="button"
                  variant="delete"
                  size="medium"
                  width={80}
                  className="ujat-education-progress-add-class-modal__action-btn"
                  onClick={() => handleRemoveExistingRow(row.id)}
                >
                  삭제
                </CmsButton>
              </div>
            </div>
          ))}

          {pendingRows.map(row => (
            <div key={row.id} className="ujat-education-progress-add-class-modal__data-row">
              <div className="ujat-education-progress-add-class-modal__cell-info">
                <ClassRowFields
                  readOnly
                  grade={gradeValueFromLabel(row.gradeLabel)}
                  classNo={String(row.classNo)}
                  studentCount={String(row.studentCount)}
                  gradeAriaLabel={row.gradeLabel}
                  classAriaLabel={`${row.classNo}반`}
                  studentCountAriaLabel={`${row.studentCount}명`}
                />
              </div>
              <div className="ujat-education-progress-add-class-modal__cell-actions">
                <CmsButton
                  type="button"
                  variant="delete"
                  size="medium"
                  width={80}
                  className="ujat-education-progress-add-class-modal__action-btn"
                  onClick={() => handleRemovePendingRow(row.id)}
                >
                  삭제
                </CmsButton>
              </div>
            </div>
          ))}

          <div className="ujat-education-progress-add-class-modal__data-row">
            <div
              className={`ujat-education-progress-add-class-modal__cell-info${draftError ? ' ujat-education-progress-add-class-modal__cell-info--draft' : ''}`}
            >
              <ClassRowFields
                grade={draft.grade}
                classNo={draft.classNo}
                studentCount={draft.studentCount}
                onGradeChange={value => {
                  setDraft(prev => ({ ...prev, grade: value }))
                  setDraftError(null)
                }}
                onClassNoChange={value => {
                  setDraft(prev => ({ ...prev, classNo: value }))
                  setDraftError(null)
                }}
                onStudentCountChange={value => {
                  setDraft(prev => ({ ...prev, studentCount: value }))
                  setDraftError(null)
                }}
                gradeAriaLabel="신청 학년"
                classAriaLabel="신청 학급"
                studentCountAriaLabel="총 학생 수"
              />
              {draftError ? (
                <span className="form-editor-template-field-hint-text" role="alert">
                  {draftError}
                </span>
              ) : null}
            </div>
            <div className="ujat-education-progress-add-class-modal__cell-actions">
              <CmsButton
                type="button"
                variant="secondary"
                size="medium"
                width={80}
                className="ujat-education-progress-add-class-modal__action-btn"
                onClick={handleRegisterDraft}
              >
                등록
              </CmsButton>
            </div>
          </div>
        </div>
      </div>
    </ContentModal>
  )
}
