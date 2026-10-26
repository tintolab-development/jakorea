import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ProgramBackButton, useProgramDetail } from '@/features/program'
import { writingFormDraftFromApplicationForm } from '@/features/program/lib/application-form-draft'
import { EducationSurveyFormBody } from '@/features/mypage/education/surveys/ui/survey-form-body'
import {
  EMPTY_SURVEY_SIDECAR,
  type SurveySidecarState,
} from '@/features/mypage/education/surveys/lib/survey-sidecar'
import {
  applyEducationSurveyAnswersToDraft,
  buildEducationSurveyAnswers,
  validateEducationSurveyFill,
} from '@/features/mypage/education/surveys/lib/survey-answers'
import { uploadMemberPortalFile } from '@/features/mypage/instructor-apply/api/member-file-upload'
import {
  getLectureReportApiErrorMessage,
  getAllLectureReportAssignments,
  getLectureReportBinding,
  getLectureReportContent,
  getLectureReportState,
  renderLectureReport,
  submitLectureReport,
  submitLectureReportResponse,
  type LectureReportAssignment,
  type LectureReportContent,
  type LectureReportFormBinding,
  type LectureReportState,
} from '@/features/mypage/education/schedules/api/lecture-report-client'
import {
  INVALID_LECTURE_REPORT_BINDING_MESSAGE,
  LECTURE_REPORT_BINDING_UNAVAILABLE_MESSAGE,
  isValidLectureReportBindingContext,
} from '@/features/mypage/education/schedules/lib/lecture-report-contract'
import {
  lectureReportBackPath,
  lectureReportWritePath,
} from '@/features/mypage/education/schedules/lib/lecture-report-path'
import { LectureReportPreviewOverlay } from '@/features/mypage/education/schedules/ui/lecture-report-preview-overlay'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { PFButton, PFFormPage, PFLoadingSpinner, PFText } from '@/shared/ui'
import styles from './page.module.css'

type LoadedReport = {
  assignment: LectureReportAssignment
  state: LectureReportState
  binding: LectureReportFormBinding | null
  form: Record<string, unknown>
  content: LectureReportContent | null
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function parsePositiveInteger(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function formatDateLabel(value: string | null | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return ''
  const [year, month, day] = value.split('-')
  return `${year}년 ${month}월 ${day}일`
}

function formatPeriod(start: string | null | undefined, end: string | null | undefined): string {
  const startLabel = formatDateLabel(start)
  const endLabel = formatDateLabel(end)
  return startLabel && endLabel ? `${startLabel} ~ ${endLabel}` : startLabel || endLabel
}

function formatTime(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  }).format(date)
}

function applyLectureReportAssignmentContext(
  draft: WritingFormDraft,
  assignment: LectureReportAssignment,
  program: { title?: string; educationTargetDetailLabel?: string } | null | undefined
): WritingFormDraft {
  const educationDate = assignment.startAt?.slice(0, 10)
  const sessionTime = [formatTime(assignment.startAt), formatTime(assignment.endAt)]
    .filter(Boolean)
    .join(' ~ ')
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (
        paragraph.kind !== 'single_item' ||
        paragraph.variant !== 'lecture_report_program_progress'
      ) {
        return paragraph
      }
      return {
        ...paragraph,
        programName: program?.title?.trim() || paragraph.programName,
        institutionName: assignment.institutionName?.trim() || paragraph.institutionName,
        educationDate: educationDate || paragraph.educationDate,
        sessionTime: sessionTime || paragraph.sessionTime,
        sessionIndex:
          assignment.sessionNo != null ? `${assignment.sessionNo}차시` : paragraph.sessionIndex,
        educationTarget:
          program?.educationTargetDetailLabel?.trim() ||
          assignment.grade?.trim() ||
          paragraph.educationTarget,
        classLabel: assignment.grade?.trim() || paragraph.classLabel,
      }
    }),
  }
}

function reportTitle(
  title: string | undefined,
  assignment: LectureReportAssignment | undefined
): string {
  const programTitle = title?.trim() || assignment?.scheduleName?.trim() || '강의'
  return `JA KOREA 「${programTitle}」 강의보고서`
}

export function MypageLectureReportWritePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { applicationId = '', applicationType } = useParams<{
    applicationId: string
    applicationType?: string
  }>()
  const [searchParams] = useSearchParams()
  const assignmentId = parsePositiveInteger(searchParams.get('assignmentId'))
  const readOnly = searchParams.get('mode') === 'read' || searchParams.get('mode') === 'preview'
  const backPath = lectureReportBackPath(applicationId)
  const [loaded, setLoaded] = useState<LoadedReport | null>(null)
  const [draft, setDraft] = useState<WritingFormDraft | null>(null)
  const [sidecar, setSidecar] = useState<SurveySidecarState>(EMPTY_SURVEY_SIDECAR)
  const [fileObjectIdsByQuestion, setFileObjectIdsByQuestion] = useState<Record<string, number[]>>(
    {}
  )
  const [uploadingFile, setUploadingFile] = useState(false)
  const [fileUploadError, setFileUploadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const programQuery = useProgramDetail(
    loaded?.state.programId == null ? null : String(loaded.state.programId),
    { fresh: true }
  )
  const program = programQuery.program

  useEffect(() => {
    let alive = true

    async function load() {
      if (applicationType && applicationType !== 'INSTRUCTOR') {
        throw new Error('강의보고서 작성은 강사 프로그램에서만 이용할 수 있습니다.')
      }
      if (!assignmentId) {
        throw new Error('강의보고서 일정 정보가 없습니다.')
      }

      const state = await getLectureReportState(assignmentId)
      if (state.assignmentId !== assignmentId) {
        throw new Error('강의보고서 일정 정보가 요청한 배정과 일치하지 않습니다.')
      }
      if (
        applicationId &&
        state.instructorApplicationId != null &&
        state.instructorApplicationId !== Number(applicationId)
      ) {
        throw new Error('강의보고서 일정 정보가 현재 강의와 일치하지 않습니다.')
      }

      const assignments = await getAllLectureReportAssignments(state.programId)
      const assignment = assignments.find(item => item.assignmentId === assignmentId)
      if (!assignment) throw new Error('강의보고서 일정 정보를 찾을 수 없습니다.')
      if (
        assignment.programId !== state.programId ||
        assignment.scheduleId !== state.programScheduleId
      ) {
        throw new Error('강의보고서 일정 정보가 현재 강의와 일치하지 않습니다.')
      }

      if (readOnly) {
        if (state.reportStatus !== 'SUBMITTED') {
          throw new Error('아직 제출된 강의보고서가 없습니다.')
        }
        const content = await getLectureReportContent(assignmentId)
        return {
          assignment,
          state,
          binding: null,
          form: content.form,
          content,
        } satisfies LoadedReport
      }

      if (state.reportStatus === 'SUBMITTED') {
        throw new Error('이미 제출된 강의보고서입니다. 확인하기를 이용해 주세요.')
      }
      if (!state.canSubmit || !['AVAILABLE', 'OVERDUE'].includes(state.reportStatus)) {
        throw new Error(
          state.reportStatus === 'BUSINESS_ENDED'
            ? '사업 운영이 종료되어 제출할 수 없습니다.'
            : '현재 강의보고서를 작성할 수 없습니다.'
        )
      }
      if (state.bindingId == null) {
        throw new Error(LECTURE_REPORT_BINDING_UNAVAILABLE_MESSAGE)
      }

      const binding = await getLectureReportBinding(assignmentId)
      if (
        binding.assignmentId !== assignmentId ||
        binding.programId !== state.programId ||
        binding.programScheduleId !== state.programScheduleId ||
        binding.programScheduleId !== assignment.scheduleId ||
        binding.bindingId !== state.bindingId ||
        (state.templateVersionId != null && binding.templateVersionId !== state.templateVersionId)
      ) {
        throw new Error('강의보고서 양식 정보가 일정과 일치하지 않습니다.')
      }
      if (
        !isValidLectureReportBindingContext({
          ...binding,
          instructorApplicationId: assignment.instructorApplicationId,
        })
      ) {
        throw new Error(INVALID_LECTURE_REPORT_BINDING_MESSAGE)
      }
      const form = await renderLectureReport(binding.programId, binding.bindingId)
      return { assignment, state, binding, form, content: null } satisfies LoadedReport
    }

    setLoading(true)
    setError('')
    setLoaded(null)
    setDraft(null)
    setSidecar(EMPTY_SURVEY_SIDECAR)
    setFileObjectIdsByQuestion({})
    void load()
      .then(result => {
        if (!alive) return
        setLoaded(result)
        setDraft(
          applyLectureReportAssignmentContext(
            writingFormDraftFromLoadedReport(result),
            result.assignment,
            null
          )
        )
      })
      .catch(cause => {
        if (!alive) return
        setError(
          getLectureReportApiErrorMessage(
            cause,
            cause instanceof Error ? cause.message : '강의보고서를 불러오지 못했습니다.'
          )
        )
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [applicationId, applicationType, assignmentId, readOnly])

  useEffect(() => {
    if (readOnly || !program || !loaded) return
    setDraft(current =>
      current ? applyLectureReportAssignmentContext(current, loaded.assignment, program) : current
    )
  }, [loaded, program, readOnly])

  function onFileChange(paragraphId: string, files: File[], questionKey: string) {
    if (files.length === 0) {
      setFileObjectIdsByQuestion(previous => {
        const next = { ...previous }
        delete next[questionKey]
        return next
      })
      return
    }

    setUploadingFile(true)
    setFileUploadError('')
    void Promise.all(
      files.map(file => uploadMemberPortalFile({ file, filePurpose: 'ASSIGNMENT_ATTACHMENT' }))
    )
      .then(fileObjectIds => {
        setFileObjectIdsByQuestion(previous => ({ ...previous, [questionKey]: fileObjectIds }))
      })
      .catch(() => {
        setFileObjectIdsByQuestion(previous => {
          const next = { ...previous }
          delete next[questionKey]
          return next
        })
        setSidecar(previous => ({
          ...previous,
          fileNames: { ...previous.fileNames, [paragraphId]: [] },
        }))
        setFileUploadError('파일 업로드에 실패했습니다. 파일을 다시 선택해 주세요.')
      })
      .finally(() => setUploadingFile(false))
  }

  function buildResponseInput() {
    if (!loaded?.binding || !draft) throw new Error(INVALID_LECTURE_REPORT_BINDING_MESSAGE)
    if (
      loaded.binding.assignmentId !== loaded.assignment.assignmentId ||
      loaded.binding.programId !== loaded.state.programId ||
      loaded.binding.programScheduleId !== loaded.state.programScheduleId ||
      loaded.binding.programScheduleId !== loaded.assignment.scheduleId ||
      (loaded.state.bindingId != null && loaded.state.bindingId !== loaded.binding.bindingId) ||
      (loaded.state.templateVersionId != null &&
        loaded.state.templateVersionId !== loaded.binding.templateVersionId) ||
      !isValidLectureReportBindingContext({
        ...loaded.binding,
        instructorApplicationId: loaded.assignment.instructorApplicationId,
      })
    ) {
      throw new Error(INVALID_LECTURE_REPORT_BINDING_MESSAGE)
    }
    return {
      templateVersionId: loaded.binding.templateVersionId,
      programId: loaded.binding.programId,
      programFormBindingId: loaded.binding.bindingId,
      programScheduleId: loaded.binding.programScheduleId,
      contextType: loaded.binding.contextType,
      contextId: loaded.binding.contextId,
      answers: buildEducationSurveyAnswers(draft, sidecar),
      fileObjectIdsByQuestion,
    }
  }

  async function handleSubmit() {
    if (!loaded?.binding || !draft || busy || uploadingFile) return
    const validation = validateEducationSurveyFill(draft, sidecar, {
      fileObjectIdsByQuestion,
      minimumFilesPerAttachment: 2,
    })
    if (!validation.ok) {
      setError(validation.message)
      return
    }

    setBusy(true)
    setError('')
    try {
      const created = await submitLectureReportResponse(buildResponseInput())
      if (created.formResponseId == null) {
        throw new Error('양식 응답 ID를 받지 못했습니다. 최종 제출을 진행하지 않았습니다.')
      }
      const linkInput = {
        templateVersionId: loaded.binding.templateVersionId,
        formResponseId: created.formResponseId,
      }
      try {
        await submitLectureReport(loaded.assignment.assignmentId, linkInput)
      } catch {
        let alreadyLinked = false
        try {
          const afterFirstLinkFailure = await getLectureReportState(loaded.assignment.assignmentId)
          alreadyLinked =
            afterFirstLinkFailure.reportStatus === 'SUBMITTED' &&
            afterFirstLinkFailure.formResponseId === created.formResponseId
        } catch {
          // 상태 조회 실패 시에도 동일 formResponseId로 한 번만 재연결한다.
        }
        if (!alreadyLinked) {
          try {
            await submitLectureReport(loaded.assignment.assignmentId, linkInput)
          } catch (retryLinkError) {
            let retryWasAlreadyApplied = false
            try {
              const afterRetryLinkFailure = await getLectureReportState(
                loaded.assignment.assignmentId
              )
              retryWasAlreadyApplied =
                afterRetryLinkFailure.reportStatus === 'SUBMITTED' &&
                afterRetryLinkFailure.formResponseId === created.formResponseId
            } catch {
              // 재시도 결과를 확인할 수 없으면 원래 연결 오류를 유지한다.
            }
            if (!retryWasAlreadyApplied) throw retryLinkError
          }
        }
      }
      const latest = await getLectureReportState(loaded.assignment.assignmentId)
      if (
        latest.reportStatus !== 'SUBMITTED' ||
        latest.submitted !== true ||
        latest.canSubmit !== false ||
        latest.reportId == null ||
        latest.formResponseId == null
      ) {
        throw new Error('제출 요청 후 완료 상태를 확인하지 못했습니다.')
      }
      const content = await getLectureReportContent(loaded.assignment.assignmentId)
      if (!Array.isArray(content.files)) {
        throw new Error('제출된 강의보고서 첨부파일 정보를 확인하지 못했습니다.')
      }
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.lectureReportAssignments(String(loaded.state.programId)),
      })
      navigate(lectureReportWritePath(applicationId, loaded.assignment.assignmentId, 'preview'), {
        replace: true,
        state: { lectureReportSubmitted: true, formResponseId: content.formResponseId },
      })
    } catch (cause) {
      setError(
        getLectureReportApiErrorMessage(
          cause,
          cause instanceof Error ? cause.message : '강의보고서 제출에 실패했습니다.'
        )
      )
    } finally {
      setBusy(false)
    }
  }

  const pageTitle = reportTitle(program?.title, loaded?.assignment)
  const period = formatPeriod(program?.operatingPeriodStart, program?.operatingPeriodEnd)
  const formProgramTitle = program?.title || loaded?.assignment.scheduleName || '강의'

  if (readOnly) {
    return (
      <LectureReportPreviewOverlay
        open
        title={pageTitle}
        draft={draft}
        content={loaded?.content ?? null}
        loading={loading}
        error={error}
        onClose={() => navigate(backPath)}
      />
    )
  }

  return (
    <PFFormPage
      aria-label={readOnly ? '강의보고서 확인' : '강의보고서 작성'}
      className={styles.page}
      back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
      title={pageTitle}
      description="JA Korea의 더 나은 변화를 위해 여러분의 의견을 들려주세요."
      titleAside={
        period ? (
          <PFText as="p" typo="bd-lg-sb" color="primary-500" className={styles.period}>
            {period}
          </PFText>
        ) : null
      }
    >
      {loading ? <PFLoadingSpinner centered label="강의보고서를 불러오는 중" /> : null}
      {!loading && error ? (
        <PFText as="p" role="alert" typo="bd-md-rg" color="error" className={styles.error}>
          {error}
        </PFText>
      ) : null}
      {!loading && !error && loaded && draft ? (
        <>
          {loaded.state.reportStatus === 'OVERDUE' && !readOnly ? (
            <PFText
              as="p"
              role="status"
              typo="bd-md-rg"
              color="neutral-cool-600"
              className={styles.notice}
            >
              제출 기한이 지났습니다. 사업 운영 종료 전까지 지각 제출할 수 있습니다.
            </PFText>
          ) : null}
          {fileUploadError ? (
            <PFText as="p" role="alert" typo="bd-md-rg" color="error" className={styles.error}>
              {fileUploadError}
            </PFText>
          ) : null}
          <EducationSurveyFormBody
            draft={draft}
            programTitle={formProgramTitle}
            onUpdateParagraph={
              ((id, updater) => {
                setDraft(current =>
                  current
                    ? {
                        ...current,
                        paragraphs: current.paragraphs.map(paragraph =>
                          paragraph.id === id ? updater(paragraph) : paragraph
                        ),
                      }
                    : current
                )
              }) as FormUpdateParagraph
            }
            sidecar={sidecar}
            onSidecarChange={setSidecar}
            onFileChange={onFileChange}
            readOnly={readOnly}
          />
          {!readOnly ? (
            <div className={styles.actions}>
              <PFButton
                type="button"
                size="xlarge"
                width={240}
                disabled={busy || uploadingFile}
                onClick={() => void handleSubmit()}
              >
                {busy ? '제출 중...' : '제출하기'}
              </PFButton>
            </div>
          ) : null}
        </>
      ) : null}
    </PFFormPage>
  )
}

function writingFormDraftFromLoadedReport(report: LoadedReport): WritingFormDraft {
  const answers = report.content?.answers ?? record(report.form.answers)
  const draft = writingFormDraftFromApplicationForm(report.form, answers)
  if (!draft) throw new Error('강의보고서 양식을 화면에 표시할 수 없습니다.')
  return applyEducationSurveyAnswersToDraft(draft, answers)
}
