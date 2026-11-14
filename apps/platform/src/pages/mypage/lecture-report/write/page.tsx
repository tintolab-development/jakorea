import { useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import type { TitleWithPeriodParagraph, WritingFormDraft } from '@jakorea/form-schema/writing-form'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ProgramBackButton, useProgramDetail } from '@/features/program'
import { writingFormDraftFromApplicationForm } from '@/features/program/lib/application-form-draft'
import { EducationSurveyFormBody } from '@/features/mypage/education/surveys/ui/survey-form-body'
import { resolveEducationSurveyPeriodLabel } from '@/features/mypage/education/surveys/ui/survey-header'
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
  getLectureReportState,
  renderLectureReport,
  submitLectureReport,
  type LectureReportAssignment,
  type LectureReportContent,
  type LectureReportFormBinding,
  type LectureReportState,
} from '@/features/mypage/education/schedules/api/lecture-report-client'
import { asAssignmentDisplayText } from '@/features/mypage/education/schedules/lib/instructor-assignment-support'
import { formatLectureReportProgressSessionLabel } from '@/features/mypage/education/schedules/lib/instructor-education-schedule-display'
import {
  INVALID_LECTURE_REPORT_BINDING_MESSAGE,
  LECTURE_REPORT_BINDING_UNAVAILABLE_MESSAGE,
  isValidLectureReportBindingContext,
} from '@/features/mypage/education/schedules/lib/lecture-report-contract'
import {
  lectureReportBackPath,
  lectureReportPreviewPath,
} from '@/features/mypage/education/schedules/lib/lecture-report-path'
import {
  lectureReportCompleteSettlementWritePath,
  lectureReportCompleteTabPath,
  resolveInstructorLectureApplicationId,
  resolveLectureSettlementSessionId,
} from '@/features/mypage/education/schedules/lib/lecture-report-complete-navigation'
import {
  lectureReportOverdueWarningText,
  shouldShowLectureReportOverdueWarning,
} from '@/features/mypage/education/schedules/lib/lecture-report-policy'
import { LectureReportSubmitCompleteModal } from '@/features/mypage/education/schedules/ui/lecture-report-submit-complete-modal'
import { fetchSettlementApplications } from '@/features/mypage/education/applications/api/activity-client'
import {
  findSettlementApplicationForLectureAssignment,
  isKnownSettlementApplicationSubmitted,
} from '@/features/mypage/education/settlements/lib/settlement-join'
import { isGeminiSettlementProgram } from '@/features/mypage/education/settlements/lib/payment-statement-status'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { PFAlertModal, PFButton, PFFormPage, PFLoadingSpinner, PFText } from '@/shared/ui'
import styles from './page.module.css'
import {
  buildLectureReportPageTitle,
  resolveLectureReportLectureName,
} from '@/features/mypage/education/schedules/lib/lecture-report-display'
import { resolveEducationSurveySectionDescription } from '@/features/mypage/education/surveys/lib/survey-section-title'
import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'
import { toSeoulDateOnly } from '@/shared/lib/format-display-date'

const REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE = '필수 항목 입력 안내'

const REQUIRED_FIELDS_INCOMPLETE_ALERT_DESCRIPTION = (
  <>
    입력되지 않은 필수 항목이 있어요.
    {'\n'}
    &apos;
    <PFText as="span" typo="bd-md-rg" color="error">
      *
    </PFText>
    &apos; 표시된 필수 항목을 모두 작성해 주세요.
  </>
)

const EDUCATION_PHOTOS_INCOMPLETE_ALERT_TITLE = '교육 사진 첨부 안내'
const EDUCATION_PHOTOS_INCOMPLETE_ALERT_DESCRIPTION =
  '교육 장면 사진을 2장 이상 첨부해 주세요'

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
  program: {
    title?: string
    educationTargetDetailLabel?: string
    programAudience?: 'organization' | 'individual'
  } | null | undefined
): WritingFormDraft {
  const educationDate = toSeoulDateOnly(assignment.startAt)
  const sessionTime = [formatTime(assignment.startAt), formatTime(assignment.endAt)]
    .filter(Boolean)
    .join(' ~ ')
  const hideInstitution = program?.programAudience === 'individual'
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
        institutionName: hideInstitution
          ? ''
          : assignment.institutionName?.trim() || paragraph.institutionName,
        institutionLocation: hideInstitution
          ? ''
          : assignment.institutionAddress?.trim() || paragraph.institutionLocation,
        educationDate: educationDate || paragraph.educationDate,
        sessionTime: sessionTime || paragraph.sessionTime,
        // 「진행 차시」 칸 — 그 일정의 커리큘럼 차시 수(`K차시`). 회차(sessionNo) 라벨을 넣지 않는다.
        sessionIndex:
          formatLectureReportProgressSessionLabel(assignment) || paragraph.sessionIndex,
        educationTarget:
          program?.educationTargetDetailLabel?.trim() ||
          asAssignmentDisplayText(assignment.grade) ||
          paragraph.educationTarget,
      }
    }),
  }
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
  const legacyPreviewRoute =
    searchParams.get('mode') === 'read' || searchParams.get('mode') === 'preview'
  const [loaded, setLoaded] = useState<LoadedReport | null>(null)
  const backPath = lectureReportBackPath(
    resolveInstructorLectureApplicationId({
      routeApplicationId: applicationId,
      instructorApplicationId:
        loaded?.assignment.instructorApplicationId ?? loaded?.state.instructorApplicationId,
    }),
  )
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
  const [alert, setAlert] = useState<{ title: string; description: ReactNode } | null>(null)
  const [submitCompleteOpen, setSubmitCompleteOpen] = useState(false)
  const [settlementSessionId, setSettlementSessionId] = useState('')
  const [paymentStatementAlreadySubmitted, setPaymentStatementAlreadySubmitted] = useState(false)
  const programQuery = useProgramDetail(
    loaded?.state.programId == null ? null : String(loaded.state.programId),
    { fresh: true }
  )
  const program = programQuery.program

  useEffect(() => {
    if (!legacyPreviewRoute || !assignmentId || !applicationId) return
    navigate(lectureReportPreviewPath(applicationId, assignmentId), { replace: true })
  }, [legacyPreviewRoute, assignmentId, applicationId, navigate])

  useEffect(() => {
    if (legacyPreviewRoute) return
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

      // 제출 가능 여부를 목록 조회보다 먼저 본다. 일정 미정 배정은 목록에 없으므로
      // 순서가 반대면 「일정 정보를 찾을 수 없습니다」로 막힌다.
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
      if (state.bindingId == null || state.templateVersionId == null) {
        throw new Error(LECTURE_REPORT_BINDING_UNAVAILABLE_MESSAGE)
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

      const binding = await getLectureReportBinding(assignmentId)
      if (
        binding.assignmentId !== assignmentId ||
        binding.programId !== state.programId ||
        binding.programScheduleId !== state.programScheduleId ||
        binding.programScheduleId !== assignment.scheduleId ||
        binding.bindingId !== state.bindingId ||
        binding.templateVersionId !== state.templateVersionId
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
  }, [applicationId, applicationType, assignmentId, legacyPreviewRoute])

  useEffect(() => {
    if (!program || !loaded) return
    setDraft(current =>
      current ? applyLectureReportAssignmentContext(current, loaded.assignment, program) : current
    )
  }, [loaded, program])

  function onFileAdd(paragraphId: string, files: File[], questionKey: string) {
    if (files.length === 0) return

    setUploadingFile(true)
    setFileUploadError('')
    void Promise.all(
      files.map(file => uploadMemberPortalFile({ file, filePurpose: 'ASSIGNMENT_ATTACHMENT' }))
    )
      .then(fileObjectIds => {
        setFileObjectIdsByQuestion(previous => ({
          ...previous,
          [questionKey]: [...(previous[questionKey] ?? []), ...fileObjectIds],
        }))
        setSidecar(previous => ({
          ...previous,
          fileNames: {
            ...previous.fileNames,
            [paragraphId]: [
              ...(previous.fileNames[paragraphId] ?? []),
              ...files.map(file => file.name),
            ],
          },
        }))
      })
      .catch(() => {
        setFileUploadError('파일 업로드에 실패했습니다. 파일을 다시 선택해 주세요.')
      })
      .finally(() => setUploadingFile(false))
  }

  function onFileRemove(paragraphId: string, index: number, questionKey: string) {
    setSidecar(previous => {
      const names = previous.fileNames[paragraphId] ?? []
      return {
        ...previous,
        fileNames: {
          ...previous.fileNames,
          [paragraphId]: names.filter((_, i) => i !== index),
        },
      }
    })
    setFileObjectIdsByQuestion(previous => {
      const ids = previous[questionKey] ?? []
      const nextIds = ids.filter((_, i) => i !== index)
      if (nextIds.length === 0) {
        const next = { ...previous }
        delete next[questionKey]
        return next
      }
      return { ...previous, [questionKey]: nextIds }
    })
    setFileUploadError('')
  }

  function buildSubmitInput() {
    if (!loaded?.binding || !draft) throw new Error(INVALID_LECTURE_REPORT_BINDING_MESSAGE)
    if (
      loaded.binding.assignmentId !== loaded.assignment.assignmentId ||
      loaded.binding.programId !== loaded.state.programId ||
      loaded.binding.programScheduleId !== loaded.state.programScheduleId ||
      loaded.binding.programScheduleId !== loaded.assignment.scheduleId ||
      loaded.state.bindingId !== loaded.binding.bindingId ||
      loaded.state.templateVersionId !== loaded.binding.templateVersionId ||
      !isValidLectureReportBindingContext({
        ...loaded.binding,
        instructorApplicationId: loaded.assignment.instructorApplicationId,
      })
    ) {
      throw new Error(INVALID_LECTURE_REPORT_BINDING_MESSAGE)
    }
    return {
      templateVersionId: loaded.binding.templateVersionId,
      formResponseId: loaded.state.formResponseId,
      attachmentGroupId: loaded.state.attachmentGroupId,
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
      setAlert(
        validation.incomplete === 'file_attachment'
          ? {
              title: EDUCATION_PHOTOS_INCOMPLETE_ALERT_TITLE,
              description: EDUCATION_PHOTOS_INCOMPLETE_ALERT_DESCRIPTION,
            }
          : {
              title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
              description: REQUIRED_FIELDS_INCOMPLETE_ALERT_DESCRIPTION,
            },
      )
      return
    }

    setBusy(true)
    try {
      await submitLectureReport(loaded.assignment.assignmentId, buildSubmitInput())
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
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.lectureReportAssignments(String(loaded.state.programId)),
      })
      let alreadySubmitted = false
      try {
        const settlements = await queryClient.fetchQuery({
          queryKey: platformQueryKeys.mypage.settlementApplications(),
          queryFn: ({ signal }) => fetchSettlementApplications(signal),
          staleTime: 0,
        })
        alreadySubmitted = isKnownSettlementApplicationSubmitted(
          findSettlementApplicationForLectureAssignment(settlements, {
            assignmentId: loaded.assignment.assignmentId,
            scheduleId: loaded.assignment.scheduleId,
            programId: loaded.state.programId,
          }),
        )
      } catch {
        alreadySubmitted = false
      }
      setPaymentStatementAlreadySubmitted(alreadySubmitted)
      setSettlementSessionId(
        resolveLectureSettlementSessionId({
          scheduleId: loaded.assignment.scheduleId,
          assignmentId: loaded.assignment.assignmentId,
        }),
      )
      setSubmitCompleteOpen(true)
    } catch (cause) {
      setAlert({
        title: '안내',
        description: getLectureReportApiErrorMessage(
          cause,
          cause instanceof Error ? cause.message : '강의보고서 제출에 실패했습니다.',
        ),
      })
    } finally {
      setBusy(false)
    }
  }

  const titleParagraph = draft?.paragraphs.find(
    (paragraph): paragraph is TitleWithPeriodParagraph =>
      paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period',
  )
  const lectureName = resolveLectureReportLectureName(program, loaded?.assignment)
  const pageTitle = buildLectureReportPageTitle(lectureName)
  const pageDescription = resolveEducationSurveySectionDescription(titleParagraph?.surveyDescription)
  const period = titleParagraph?.showWritingPeriodOnForm
    ? resolveEducationSurveyPeriodLabel(titleParagraph, loaded?.assignment.startAt, {
        submitDueAt: loaded?.assignment.submitDueAt ?? loaded?.state.submitDueAt,
      })
    : ''
  const formProgramTitle =
    program?.title || toDisplayEducationScheduleName(loaded?.assignment.scheduleName) || '강의'

  if (legacyPreviewRoute) {
    return <PFLoadingSpinner centered label="강의보고서 확인 화면으로 이동 중" />
  }

  return (
    <PFFormPage
      aria-label="강의보고서 작성"
      className={styles.page}
      back={<ProgramBackButton size="small" label="이전으로" to={backPath} />}
      title={
        <PFText as="h1" typo="hd-sm" color="black" className={styles.pageTitle}>
          {pageTitle}
        </PFText>
      }
      description={
        pageDescription ? (
          <PFText
            as="p"
            typo="bd-lg-rg"
            color="neutral-cool-500"
            className={styles.pageDescription}
          >
            {pageDescription}
          </PFText>
        ) : undefined
      }
      titleAside={
        period ? (
          <PFText as="p" typo="hl-lg" color="primary-700" className={styles.period}>
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
          {shouldShowLectureReportOverdueWarning(
            loaded.state.reportStatus,
            loaded.state.canSubmit,
          ) ? (
            <PFText
              as="p"
              role="status"
              typo="bd-md-rg"
              color="neutral-cool-600"
              className={styles.notice}
            >
              {lectureReportOverdueWarningText()}
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
            hideLectureReportInstitutionFields={program?.programAudience === 'individual'}
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
            onFileAdd={onFileAdd}
            onFileRemove={onFileRemove}
            uploadingFile={uploadingFile}
            readOnly={false}
          />
          {!submitCompleteOpen ? (
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

      <PFAlertModal
        open={alert != null}
        title={alert?.title ?? ''}
        description={alert?.description}
        onConfirm={() => setAlert(null)}
      />
      <LectureReportSubmitCompleteModal
        open={submitCompleteOpen}
        hidePaymentStatementCta={
          paymentStatementAlreadySubmitted ||
          isGeminiSettlementProgram({
            programType: program?.programType,
            detailCase: program?.detailCase,
          })
        }
        onLater={() => {
          const appId = resolveInstructorLectureApplicationId({
            routeApplicationId: applicationId,
            instructorApplicationId:
              loaded?.assignment.instructorApplicationId ?? loaded?.state.instructorApplicationId,
          })
          setSubmitCompleteOpen(false)
          navigate(lectureReportCompleteTabPath(appId), { replace: true })
        }}
        onWritePaymentStatement={() => {
          const appId = resolveInstructorLectureApplicationId({
            routeApplicationId: applicationId,
            instructorApplicationId:
              loaded?.assignment.instructorApplicationId ?? loaded?.state.instructorApplicationId,
          })
          const sessionId =
            settlementSessionId.trim() ||
            resolveLectureSettlementSessionId({
              scheduleId: loaded?.assignment.scheduleId,
              assignmentId: loaded?.assignment.assignmentId,
            })
          const writePath = lectureReportCompleteSettlementWritePath(appId, sessionId)
          setSubmitCompleteOpen(false)
          if (!writePath) {
            navigate(lectureReportCompleteTabPath(appId), { replace: true })
            return
          }
          if (loaded?.state.programId != null) {
            void queryClient.invalidateQueries({
              queryKey: platformQueryKeys.mypage.lectureReportAssignments(
                String(loaded.state.programId),
              ),
            })
          }
          navigate(writePath, { replace: true })
        }}
      />
    </PFFormPage>
  )
}

function writingFormDraftFromLoadedReport(report: LoadedReport): WritingFormDraft {
  const answers = report.content?.answers ?? record(report.form.answers)
  const draft = writingFormDraftFromApplicationForm(report.form, answers)
  if (!draft) throw new Error('강의보고서 양식을 화면에 표시할 수 없습니다.')
  return applyEducationSurveyAnswersToDraft(draft, answers)
}
