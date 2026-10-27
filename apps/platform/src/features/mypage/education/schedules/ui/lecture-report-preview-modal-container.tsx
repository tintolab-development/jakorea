import { useEffect, useMemo, useState } from 'react'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import { useProgramDetail } from '@/features/program'
import type { LectureReportAssignment, LectureReportContent } from '../api/lecture-report-client'
import {
  buildLectureReportPageTitle,
  resolveLectureReportLectureName,
} from '../lib/lecture-report-display'
import {
  getLectureReportPreviewLoadErrorMessage,
  loadLectureReportPreview,
  writingFormDraftFromLectureReportPreview,
} from '../lib/lecture-report-preview-load'
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
  const [error, setError] = useState('')
  const [content, setContent] = useState<LectureReportContent | null>(null)
  const [draft, setDraft] = useState<WritingFormDraft | null>(null)
  const [assignment, setAssignment] = useState<LectureReportAssignment | null>(null)
  const [programId, setProgramId] = useState<number | null>(null)

  const programQuery = useProgramDetail(programId == null ? null : String(programId), { fresh: true })
  const program = programQuery.program

  useEffect(() => {
    if (!open || assignmentId == null) {
      setLoading(false)
      setError('')
      setContent(null)
      setDraft(null)
      setAssignment(null)
      setProgramId(null)
      return
    }

    let alive = true
    setLoading(true)
    setError('')
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
        setError(getLectureReportPreviewLoadErrorMessage(cause))
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
    <LectureReportPreviewModal
      open={open}
      title={pageTitle}
      draft={draft}
      content={content}
      loading={loading}
      error={error}
      onClose={onClose}
    />
  )
}
