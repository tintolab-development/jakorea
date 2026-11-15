import { useEffect, useMemo, useState } from 'react'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import { useProgramDetail } from '@/features/program'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import type { LectureReportAssignment, LectureReportContent } from '../api/lecture-report-client'
import {
  buildLectureReportPageTitle,
  resolveLectureReportLectureName,
} from '../lib/lecture-report-display'
import {
  loadLectureReportPreview,
  writingFormDraftFromLectureReportPreview,
} from '../lib/lecture-report-preview-load'
import type { PlatformAlertCopy } from '@/shared/lib/platform-alert-copy'
import { PFAlertModal } from '@/shared/ui'
import { resolveEducationPreviewErrorAlert } from '../../shared/lib/education-error-alert'
import { LectureReportPreviewModal } from './lecture-report-preview-modal'

type LectureReportPreviewModalContainerProps = {
  open: boolean
  applicationId: string
  assignmentId: number | null
  onClose: () => void
}

export function LectureReportPreviewModalContainer({
  open,
  applicationId,
  assignmentId,
  onClose,
}: LectureReportPreviewModalContainerProps) {
  const [loading, setLoading] = useState(false)
  /** 시안 「미리보기 실패 시」 팝업 — 뜨면 미리보기 창은 닫는다 */
  const [errorAlert, setErrorAlert] = useState<PlatformAlertCopy | null>(null)
  const [content, setContent] = useState<LectureReportContent | null>(null)
  const [draft, setDraft] = useState<WritingFormDraft | null>(null)
  const [assignment, setAssignment] = useState<LectureReportAssignment | null>(null)
  const [programId, setProgramId] = useState<number | null>(null)

  const programQuery = useProgramDetail(programId == null ? null : String(programId), { fresh: true })
  const program = programQuery.program
  const { displayName } = useMypageMember()

  useEffect(() => {
    if (!open || assignmentId == null) {
      setLoading(false)
      setErrorAlert(null)
      setContent(null)
      setDraft(null)
      setAssignment(null)
      setProgramId(null)
      return
    }

    let alive = true
    setLoading(true)
    setErrorAlert(null)
    setContent(null)
    setDraft(null)
    setAssignment(null)
    setProgramId(null)

    void loadLectureReportPreview(assignmentId, applicationId)
      .then(loaded => {
        if (!alive) return
        setProgramId(loaded.state.programId)
        setAssignment(loaded.assignment)
        setContent(loaded.content)
        setDraft(writingFormDraftFromLectureReportPreview(loaded))
      })
      .catch(cause => {
        if (!alive) return
        setErrorAlert(resolveEducationPreviewErrorAlert(cause))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [open, assignmentId, applicationId])

  const pageTitle = useMemo(() => {
    const lectureName = resolveLectureReportLectureName(program, assignment ?? undefined)
    return buildLectureReportPageTitle(lectureName)
  }, [assignment, program])

  return (
    <>
      <LectureReportPreviewModal
        open={open && errorAlert == null}
        title={pageTitle}
        draft={draft}
        content={content}
        loading={loading}
        instructorName={displayName}
        hideInstitutionFields={program?.programAudience === 'individual'}
        onClose={onClose}
      />
      <PFAlertModal
        open={open && errorAlert != null}
        title={errorAlert?.title ?? ''}
        description={errorAlert?.description}
        onConfirm={() => {
          setErrorAlert(null)
          onClose()
        }}
      />
    </>
  )
}
