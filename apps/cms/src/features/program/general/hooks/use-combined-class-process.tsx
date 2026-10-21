import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { CombinedClassLeadTeacherCandidate } from '@/features/program/general/lib/combined-class-lead-teacher'
import {
  COMBINED_CLASS_CANCEL_COMPLETE_MODAL_TITLE,
  COMBINED_CLASS_CANCEL_MODAL_TITLE,
  buildCombinedClassCancelCompleteDescription,
  COMBINED_CLASS_GRADE_REQUIRED_MODAL_MESSAGE,
  COMBINED_CLASS_GRADE_REQUIRED_MODAL_TITLE,
  buildCombinedClassCancelDescription,
  buildCombinedClassProcessDescription,
} from '@/features/program/general/lib/combined-class-copy'
import { formatInstitutionApplicationGradeDisplay } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import { InstitutionCombinedClassCompleteModal } from '@/features/program/shared/ui/detail-modal/components/institution-combined-class-complete-modal'
import { InstitutionCombinedClassLeadTeacherModal } from '@/features/program/shared/ui/detail-modal/components/institution-combined-class-lead-teacher-modal'
import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'
import { useCmsAlert } from '@/shared/ui'
import { CmsButton } from '@/shared/ui/cms-button'
import { ContentModal } from '@/shared/ui/content-modal'

const MODAL_WIDTH = 600
const MODAL_BUTTON_WIDTH = 120

export type CombinedClassProcessSelection = {
  application: '신청' | '미신청'
  partnerIds: string[]
}

export type CombinedClassProcessPartnerOption = {
  value: string
  label: string
}

type ProcessTarget = {
  partnerIds: string[]
  partnerGrade: string
  candidates: CombinedClassLeadTeacherCandidate[]
}

function selectionKey(selection: CombinedClassProcessSelection): string {
  return `${selection.application}|${[...selection.partnerIds].sort().join(',')}`
}

function formatGradeLabel(grade: string): string {
  return formatInstitutionApplicationGradeDisplay(grade) || grade.trim() || '학년'
}

export function useCombinedClassProcess(params: {
  /** 수정 모드이고 합반 대상 프로그램이며 리드 기관일 때 */
  active: boolean
  resetKey: string
  schoolName: string
  leadGrade: string
  committedApplication: '신청' | '미신청'
  committedPartnerIds: string[]
  partnerOptions: CombinedClassProcessPartnerOption[]
  applySelection: (next: CombinedClassProcessSelection) => void
  buildCandidates: (partnerIds: string[]) => CombinedClassLeadTeacherCandidate[]
  onProcess: (params: {
    partnerIds: string[]
    leadTeacherMemberId: number
  }) => Promise<boolean | number>
  onCancelMerge: (mergeGroupId?: number) => Promise<boolean>
}) {
  const {
    active,
    resetKey,
    schoolName,
    leadGrade,
    committedApplication,
    committedPartnerIds,
    partnerOptions,
    applySelection,
    buildCandidates,
    onProcess,
    onCancelMerge,
  } = params
  const { showAlert } = useCmsAlert()
  const [accepted, setAccepted] = useState<CombinedClassProcessSelection | null>(null)
  const [processTarget, setProcessTarget] = useState<ProcessTarget | null>(null)
  const [cancelTarget, setCancelTarget] = useState<{ partnerGrade: string } | null>(null)
  const [gradeAlertOpen, setGradeAlertOpen] = useState(false)
  const [completeGrades, setCompleteGrades] = useState<{
    leadGrade: string
    partnerGrade: string
  } | null>(null)
  const [cancelComplete, setCancelComplete] = useState<{
    schoolName: string
    leadGrade: string
    partnerGrade: string
  } | null>(null)
  const [activeMergeGroupId, setActiveMergeGroupId] = useState<number | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const ignoreEmptyPartnerChangeRef = useRef(false)

  const committedPartnerKey = [...committedPartnerIds].sort().join(',')
  const propsSelection = useMemo<CombinedClassProcessSelection>(
    () => ({
      application: committedApplication,
      partnerIds: committedPartnerIds,
    }),
    // 학년 id 목록은 정렬한 문자열로만 비교한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- committedPartnerKey가 내용 비교다
    [committedApplication, committedPartnerKey]
  )
  const effectiveCommitted =
    accepted && selectionKey(accepted) !== selectionKey(propsSelection) ? accepted : propsSelection

  useEffect(() => {
    setAccepted(null)
    setProcessTarget(null)
    setCancelTarget(null)
    setGradeAlertOpen(false)
    setCompleteGrades(null)
    setCancelComplete(null)
    setActiveMergeGroupId(undefined)
  }, [resetKey])

  const partnerGradeLabel = useCallback(
    (partnerIds: string[]) => {
      const labels = partnerIds
        .map(id => partnerOptions.find(option => option.value === id)?.label?.trim() || '')
        .filter(Boolean)
      return formatGradeLabel(labels[0] ?? '')
    },
    [partnerOptions]
  )

  const revertToCommitted = useCallback(() => {
    applySelection(effectiveCommitted)
  }, [applySelection, effectiveCommitted])

  const onApplicationChange = useCallback(
    (next: '신청' | '미신청', partnerIds: string[]) => {
      if (next === '미신청') {
        ignoreEmptyPartnerChangeRef.current = true
        queueMicrotask(() => {
          ignoreEmptyPartnerChangeRef.current = false
        })
        applySelection({ application: '미신청', partnerIds: [] })
        if (active && effectiveCommitted.application === '신청') {
          setCancelTarget({
            partnerGrade: partnerGradeLabel(effectiveCommitted.partnerIds),
          })
        }
        return
      }
      applySelection({ application: '신청', partnerIds })
    },
    [active, applySelection, effectiveCommitted, partnerGradeLabel]
  )

  const onPartnerIdsChange = useCallback(
    (partnerIds: string[], application: '신청' | '미신청') => {
      if (partnerIds.length === 0 && ignoreEmptyPartnerChangeRef.current) {
        ignoreEmptyPartnerChangeRef.current = false
        return
      }
      applySelection({ application, partnerIds })
      if (!active || application !== '신청' || partnerIds.length === 0) return
      if (
        effectiveCommitted.application === '신청' &&
        selectionKey(effectiveCommitted) ===
          selectionKey({ application: '신청', partnerIds })
      ) {
        return
      }
      const candidates = buildCandidates(partnerIds)
      if (candidates.length === 0) {
        void showAlert({
          title: '안내',
          content: '지정할 담당 교사가 없습니다.',
        })
        applySelection(effectiveCommitted)
        return
      }
      setProcessTarget({
        partnerIds,
        partnerGrade: partnerGradeLabel(partnerIds),
        candidates,
      })
    },
    [
      active,
      applySelection,
      buildCandidates,
      effectiveCommitted,
      partnerGradeLabel,
      showAlert,
    ]
  )

  const openGradeRequiredAlert = useCallback(() => {
    setGradeAlertOpen(true)
  }, [])

  const closeProcessModal = useCallback(() => {
    if (submitting) return
    revertToCommitted()
    setProcessTarget(null)
  }, [revertToCommitted, submitting])

  const confirmProcess = useCallback(
    (candidate: CombinedClassLeadTeacherCandidate) => {
      if (!processTarget) return
      const leadTeacherMemberId = candidate.teacherMemberId
      if (leadTeacherMemberId == null || !Number.isFinite(leadTeacherMemberId)) {
        void showAlert({
          title: '처리 실패',
          content: '담당 교사 회원 ID가 없어 지정할 수 없습니다.',
        })
        return
      }
      void (async () => {
        setSubmitting(true)
        try {
          const saved = await onProcess({
            partnerIds: processTarget.partnerIds,
            leadTeacherMemberId,
          })
          if (saved === false) return
          setActiveMergeGroupId(typeof saved === 'number' ? saved : undefined)
          const next: CombinedClassProcessSelection = {
            application: '신청',
            partnerIds: processTarget.partnerIds,
          }
          setAccepted(next)
          applySelection(next)
          setProcessTarget(null)
          setCompleteGrades({
            leadGrade: formatGradeLabel(leadGrade),
            partnerGrade: processTarget.partnerGrade,
          })
        } finally {
          setSubmitting(false)
        }
      })()
    },
    [applySelection, leadGrade, onProcess, processTarget, showAlert]
  )

  const closeCancelModal = useCallback(() => {
    if (submitting) return
    revertToCommitted()
    setCancelTarget(null)
  }, [revertToCommitted, submitting])

  const confirmCancel = useCallback(() => {
    const target = cancelTarget
    void (async () => {
      setSubmitting(true)
      try {
        const cancelled = await onCancelMerge(activeMergeGroupId)
        if (!cancelled) return
        setActiveMergeGroupId(undefined)
        const next: CombinedClassProcessSelection = { application: '미신청', partnerIds: [] }
        setAccepted(next)
        applySelection(next)
        setCancelTarget(null)
        if (target) {
          setCancelComplete({
            schoolName,
            leadGrade: formatGradeLabel(leadGrade),
            partnerGrade: target.partnerGrade,
          })
        }
      } finally {
        setSubmitting(false)
      }
    })()
  }, [activeMergeGroupId, applySelection, cancelTarget, leadGrade, onCancelMerge, schoolName])

  const formattedLeadGrade = formatGradeLabel(leadGrade)
  const processDescription = processTarget
    ? buildCombinedClassProcessDescription({
        schoolName,
        leadGrade: formattedLeadGrade,
        partnerGrade: processTarget.partnerGrade,
      })
    : ''
  const cancelDescription = cancelTarget
    ? buildCombinedClassCancelDescription({
        schoolName,
        leadGrade: formattedLeadGrade,
        partnerGrade: cancelTarget.partnerGrade,
      })
    : ''

  const modals: ReactNode = (
    <>
      <InstitutionCombinedClassLeadTeacherModal
        open={processTarget != null}
        candidates={processTarget?.candidates ?? []}
        description={processDescription}
        confirmLoading={submitting}
        zIndex={CMS_ALERT_MODAL_Z_INDEX}
        onCancel={closeProcessModal}
        onConfirm={confirmProcess}
      />
      <ContentModal
        open={cancelTarget != null}
        onCancel={closeCancelModal}
        title={COMBINED_CLASS_CANCEL_MODAL_TITLE}
        width={MODAL_WIDTH}
        zIndex={CMS_ALERT_MODAL_Z_INDEX}
        description={cancelDescription}
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="medium"
              width={MODAL_BUTTON_WIDTH}
              type="button"
              disabled={submitting}
              onClick={closeCancelModal}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              width={MODAL_BUTTON_WIDTH}
              type="button"
              loading={submitting}
              disabled={submitting}
              onClick={confirmCancel}
            >
              합반 취소
            </CmsButton>
          </>
        }
      >
        {null}
      </ContentModal>
      <ContentModal
        open={gradeAlertOpen}
        onCancel={() => setGradeAlertOpen(false)}
        title={COMBINED_CLASS_GRADE_REQUIRED_MODAL_TITLE}
        width={MODAL_WIDTH}
        zIndex={CMS_ALERT_MODAL_Z_INDEX}
        description={COMBINED_CLASS_GRADE_REQUIRED_MODAL_MESSAGE}
        footer={
          <CmsButton
            variant="primary"
            size="medium"
            width={MODAL_BUTTON_WIDTH}
            type="button"
            onClick={() => setGradeAlertOpen(false)}
          >
            닫기
          </CmsButton>
        }
      >
        {null}
      </ContentModal>
      <ContentModal
        open={cancelComplete != null}
        onCancel={() => setCancelComplete(null)}
        title={COMBINED_CLASS_CANCEL_COMPLETE_MODAL_TITLE}
        width={MODAL_WIDTH}
        zIndex={CMS_ALERT_MODAL_Z_INDEX}
        description={
          cancelComplete ? buildCombinedClassCancelCompleteDescription(cancelComplete) : ''
        }
        footer={
          <CmsButton
            variant="secondary"
            size="medium"
            type="button"
            onClick={() => setCancelComplete(null)}
          >
            확인
          </CmsButton>
        }
      >
        {null}
      </ContentModal>
      <InstitutionCombinedClassCompleteModal
        open={completeGrades != null}
        leadGrade={completeGrades?.leadGrade ?? ''}
        partnerGrade={completeGrades?.partnerGrade ?? ''}
        zIndex={CMS_ALERT_MODAL_Z_INDEX}
        onClose={() => setCompleteGrades(null)}
      />
    </>
  )

  return {
    onApplicationChange,
    onPartnerIdsChange,
    openGradeRequiredAlert,
    modals,
  }
}
