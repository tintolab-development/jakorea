import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ContentModal, CmsButton, useCmsAlert } from '@/shared/ui'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { fetchUjatEducationClasses } from '@/features/program/ujat/api/education-classes-api'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import type { UjatInstitutionApplicationGradeBlockDetail } from '../../../application-institution/detail/detail-types'
import {
  formatGradeLabelFromValue,
  gradeValueFromLabel,
  isDuplicateClassInGradeBlocks,
  type UjatEducationProgressClassRemoval,
  type UjatEducationProgressPendingClassRow,
} from './grade-blocks'
import {
  isDuplicateInEducationClasses,
  resolveEducationClassCountDisplay,
} from './add-class'
import './add-class-modal.css'

export type UjatEducationProgressAddClassConfirmPayload = {
  added: UjatEducationProgressPendingClassRow[]
  removed: UjatEducationProgressClassRemoval[]
  /** GET education-classes.revision — POST expectedRevision */
  expectedRevision: number | null
}

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
    <div className="add-class-modal__inputs">
      <div className="add-class-modal__field-grade">
        <CmsSelect
          inputSize="small"
          width={120}
          allowClear={false}
          withAllOption={false}
          placeholder="신청 학년"
          value={grade}
          disabled={readOnly}
          onChange={value => onGradeChange?.(value == null ? undefined : String(value))}
          options={GRADE_OPTIONS}
          aria-label={gradeAriaLabel}
        />
      </div>
      <div className="add-class-modal__field-class">
        <CmsSelect
          inputSize="small"
          width={120}
          allowClear={false}
          withAllOption={false}
          placeholder="신청 학급"
          value={classNo}
          disabled={readOnly}
          onChange={value => onClassNoChange?.(value == null ? undefined : String(value))}
          options={CLASS_OPTIONS}
          aria-label={classAriaLabel}
        />
      </div>
      <div className="add-class-modal__field-student-wrap">
        <div className="add-class-modal__field-student">
          <CmsNumericInput
            mode="integer"
            min={1}
            inputSize="small"
            width={120}
            placeholder="총 학생 수"
            value={studentCount}
            readOnly={readOnly}
            onValueChange={value => onStudentCountChange?.(value)}
            aria-label={studentCountAriaLabel}
          />
        </div>
        <span className="add-class-modal__unit">명</span>
      </div>
    </div>
  )
}

export type UjatEducationProgressAddClassModalProps = {
  open: boolean
  programId: string
  institutionId: string
  /** local fallback count when remote catalog unavailable */
  currentTotalClassCount: number
  existingGradeBlocks: ReadonlyArray<UjatInstitutionApplicationGradeBlockDetail>
  confirming?: boolean
  onCancel: () => void
  onConfirm: (payload: UjatEducationProgressAddClassConfirmPayload) => void | Promise<void>
}

export function UjatEducationProgressAddClassModal({
  open,
  programId,
  institutionId,
  currentTotalClassCount,
  existingGradeBlocks,
  confirming = false,
  onCancel,
  onConfirm,
}: UjatEducationProgressAddClassModalProps) {
  const { showAlert } = useCmsAlert()
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  const [pendingRows, setPendingRows] = useState<UjatEducationProgressPendingClassRow[]>([])
  const [draft, setDraft] = useState<DraftClassForm>(EMPTY_DRAFT)

  const educationClassesQuery = useQuery({
    queryKey: [...ujatQueryKeys.organizationDetail(programId, institutionId), 'education-classes'],
    queryFn: () => fetchUjatEducationClasses(programId, institutionId),
    enabled: open && remoteEnabled && Boolean(institutionId),
    staleTime: 30_000,
    retry: false,
  })

  const remoteClasses = educationClassesQuery.data?.classes ?? []
  const displayClassCount = useMemo(() => {
    if (!remoteEnabled) return currentTotalClassCount
    const fromApi = resolveEducationClassCountDisplay(educationClassesQuery.data)
    return fromApi ?? currentTotalClassCount
  }, [currentTotalClassCount, educationClassesQuery.data, remoteEnabled])

  /** 진짜 학급 없음 (BE: classes=[] ↔ count 0). count>0 invent 힌트 제거 */
  const catalogEmpty =
    remoteEnabled &&
    educationClassesQuery.isFetched &&
    !educationClassesQuery.isError &&
    remoteClasses.length === 0

  const hasChanges = pendingRows.length > 0

  useEffect(() => {
    if (!open) return
    setPendingRows([])
    setDraft(EMPTY_DRAFT)
  }, [open])

  const handleCancel = useCallback(() => {
    if (confirming) return
    setPendingRows([])
    setDraft(EMPTY_DRAFT)
    onCancel()
  }, [confirming, onCancel])

  const validateDraft = useCallback((): UjatEducationProgressPendingClassRow | null => {
    if (!draft.grade || !draft.classNo) {
      showAlert({ title: '안내', content: '신청 학년과 신청 학급을 선택해 주세요.' })
      return null
    }

    const studentCount = parseStudentCount(draft.studentCount)
    if (studentCount == null) {
      showAlert({ title: '안내', content: '총 학생 수를 입력해 주세요.' })
      return null
    }

    const gradeLabel = formatGradeLabelFromValue(draft.grade)
    const classNo = Number.parseInt(draft.classNo, 10)

    const duplicatedInPending = pendingRows.some(
      row => row.gradeLabel === gradeLabel && row.classNo === classNo
    )
    if (duplicatedInPending) {
      showAlert({ title: '안내', content: '이미 등록 목록에 추가된 학급입니다.' })
      return null
    }

    if (remoteEnabled) {
      if (educationClassesQuery.isLoading) {
        showAlert({ title: '안내', content: '교육 학급 목록을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.' })
        return null
      }
      if (educationClassesQuery.isError) {
        showAlert({
          title: '안내',
          content: '교육 학급 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        })
        return null
      }
      if (isDuplicateInEducationClasses(remoteClasses, gradeLabel, classNo)) {
        showAlert({ title: '안내', content: '이미 진행 중인 학급입니다.' })
        return null
      }
    } else if (isDuplicateClassInGradeBlocks(existingGradeBlocks, gradeLabel, classNo)) {
      showAlert({ title: '안내', content: '이미 진행 중인 학급입니다.' })
      return null
    }

    return {
      id: createPendingRowId(),
      gradeLabel,
      classNo,
      studentCount,
    }
  }, [
    draft,
    educationClassesQuery.isError,
    educationClassesQuery.isLoading,
    existingGradeBlocks,
    pendingRows,
    remoteClasses,
    remoteEnabled,
    showAlert,
  ])

  const handleRegisterDraft = useCallback(() => {
    if (confirming) return
    const nextRow = validateDraft()
    if (!nextRow) return
    setPendingRows(prev => [...prev, nextRow])
    setDraft(EMPTY_DRAFT)
  }, [confirming, validateDraft])

  const handleRemovePendingRow = useCallback(
    (rowId: string) => {
      if (confirming) return
      setPendingRows(prev => prev.filter(row => row.id !== rowId))
    },
    [confirming]
  )

  const handleConfirm = useCallback(() => {
    if (!hasChanges || confirming) return
    if (remoteEnabled) {
      const revision = educationClassesQuery.data?.revision
      if (revision == null || !Number.isFinite(revision)) {
        showAlert({
          title: '안내',
          content: '교육 학급 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        })
        return
      }
      void onConfirm({ added: pendingRows, removed: [], expectedRevision: revision })
      return
    }
    void onConfirm({ added: pendingRows, removed: [], expectedRevision: null })
  }, [
    confirming,
    educationClassesQuery.data?.revision,
    hasChanges,
    onConfirm,
    pendingRows,
    remoteEnabled,
    showAlert,
  ])

  const footer = (
    <div className="add-class-modal__footer">
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
        disabled={!hasChanges || confirming}
        loading={confirming}
        onClick={handleConfirm}
      >
        저장
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
      className="add-class-modal"
      wrapClassName="add-class-modal-wrap"
      footer={footer}
      description={`현재 진행 학급은 총 **[${displayClassCount}학급]**입니다.\n추가로 교육을 진행할 학급 정보를 입력해 주세요.`}
    >
      {catalogEmpty ? (
        <p className="form-editor-template-field-hint-text add-class-modal__catalog-hint" role="status">
          등록된 교육 학급이 없습니다. 아래에 학급을 등록·저장하면 카탈로그에 반영됩니다.
        </p>
      ) : null}

      {remoteEnabled && educationClassesQuery.isError ? (
        <p className="form-editor-template-field-hint-text add-class-modal__catalog-hint" role="alert">
          교육 학급 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}

      <div className="add-class-modal__table">
        <div className="add-class-modal__table-scroll">
          <div className="add-class-modal__header-row">
            <div className="add-class-modal__header-info">추가 학급 정보</div>
            <div className="add-class-modal__header-actions">관리</div>
          </div>

          {pendingRows.map(row => (
            <div key={row.id} className="add-class-modal__data-row">
              <div className="add-class-modal__cell-info">
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
              <div className="add-class-modal__cell-actions">
                <CmsButton
                  type="button"
                  variant="delete"
                  size="h32"
                  className="add-class-modal__action-btn"
                  disabled={confirming}
                  onClick={() => handleRemovePendingRow(row.id)}
                >
                  삭제
                </CmsButton>
              </div>
            </div>
          ))}

          <div className="add-class-modal__data-row">
            <div className="add-class-modal__cell-info">
              <ClassRowFields
                grade={draft.grade}
                classNo={draft.classNo}
                studentCount={draft.studentCount}
                readOnly={confirming}
                onGradeChange={value => {
                  setDraft(prev => ({ ...prev, grade: value }))
                }}
                onClassNoChange={value => {
                  setDraft(prev => ({ ...prev, classNo: value }))
                }}
                onStudentCountChange={value => {
                  setDraft(prev => ({ ...prev, studentCount: value }))
                }}
                gradeAriaLabel="신청 학년"
                classAriaLabel="신청 학급"
                studentCountAriaLabel="총 학생 수"
              />
            </div>
            <div className="add-class-modal__cell-actions">
              <CmsButton
                type="button"
                variant="secondary"
                size="h32"
                className="add-class-modal__action-btn"
                disabled={confirming}
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
