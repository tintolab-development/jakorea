import { useEffect, useState } from 'react'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import { PFButton, PFText } from '@/shared/ui'
import { writingFormDraftFromApplicationForm } from '@/features/program/lib/application-form-draft'
import { EducationSurveyFormBody } from '@/features/mypage/education/surveys/ui/survey-form-body'
import { EMPTY_SURVEY_SIDECAR, type SurveySidecarState } from '@/features/mypage/education/surveys/lib/survey-sidecar'
import { buildEducationSurveyAnswers, validateEducationSurveyFill } from '@/features/mypage/education/surveys/lib/survey-answers'
import { uploadMemberPortalFile } from '@/features/mypage/instructor-apply/api/member-file-upload'
import {
  getLectureReportApiErrorMessage, getLectureReportAssignments, getLectureReportBinding,
  getLectureReportContent, getLectureReportState, renderLectureReport, saveLectureReportDraft,
  submitLectureReport, submitLectureReportResponse, type LectureReportAssignment,
  type LectureReportContent, type LectureReportFormBinding, type LectureReportFormResponseInput,
  type LectureReportPage, type LectureReportState,
} from '../api/lecture-report-client'
import styles from './lecture-report-panel.module.css'
import { clampLectureReportPage, resolveLectureReportAction } from '../lib/lecture-report-policy'

type Props = { programId: number; instructorProgram: boolean }
type View = { assignment: LectureReportAssignment; mode: 'write' | 'read' }
function record(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
function label(row: LectureReportAssignment): string { return row.scheduleName || (row.sessionNo ? `${row.sessionNo}차시` : '강의 일정') }
function date(value: string | null): string { return value ? new Date(value).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }) : '—' }
function statusLabel(state: LectureReportState | undefined, row: LectureReportAssignment): string {
  switch (state?.reportStatus) {
    case 'UPCOMING': return '강의 진행 예정'
    case 'AVAILABLE': return '작성 가능'
    case 'OVERDUE': return '기한 경과 · 지각 제출 가능'
    case 'BUSINESS_ENDED': return '사업 운영 종료 · 제출 불가'
    case 'SUBMITTED': return '제출 완료'
    default: return row.lectureStatus === 'UPCOMING' ? '강의 진행 예정' : row.reportStatus === 'SUBMITTED' ? '제출 완료' : '제출 현황 확인 중'
  }
}

export function LectureReportPanel({ programId, instructorProgram }: Props) {
  const [pageNo, setPageNo] = useState(0)
  const [page, setPage] = useState<LectureReportPage | null>(null)
  const [states, setStates] = useState<Record<number, LectureReportState>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<View | null>(null)
  const [content, setContent] = useState<LectureReportContent | null>(null)
  const [form, setForm] = useState<Record<string, unknown> | null>(null)
  const [draft, setDraft] = useState<WritingFormDraft | null>(null)
  const [sidecar, setSidecar] = useState<SurveySidecarState>(EMPTY_SURVEY_SIDECAR)
  const [binding, setBinding] = useState<LectureReportFormBinding | null>(null)
  const [fileObjectIdsByQuestion, setFileObjectIdsByQuestion] = useState<Record<string, number[]>>({})
  const [uploadingFile, setUploadingFile] = useState(false)
  const [fileUploadError, setFileUploadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [showSettlementGuidance, setShowSettlementGuidance] = useState(false)

  useEffect(() => {
    let alive = true
    getLectureReportAssignments(programId, pageNo).then(async result => {
      if (!alive) return
      if (result.totalPages > 0 && pageNo >= result.totalPages) { setPageNo(clampLectureReportPage(pageNo, result.totalPages)); return }
      setPage(result)
      const fetched = await Promise.all(result.items.map(async row => {
        try { return [row.assignmentId, await getLectureReportState(row.assignmentId)] as const } catch { return null }
      }))
      if (alive) setStates(previous => ({ ...previous, ...Object.fromEntries(fetched.filter((x): x is NonNullable<typeof x> => x != null)) }))
    }).catch(() => { if (alive) setError('강의보고서 목록을 불러오지 못했습니다.') }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [programId, pageNo])

  async function refreshState(id: number) {
    const latest = await getLectureReportState(id)
    setStates(previous => ({ ...previous, [id]: latest }))
    return latest
  }
  function goToPage(next: number) {
    setError('')
    setLoading(true)
    setPageNo(next)
  }
  async function openRow(row: LectureReportAssignment, mode: 'write' | 'read') {
    setView({ assignment: row, mode }); setError(''); setNotice(''); setContent(null); setForm(null); setDraft(null); setSidecar(EMPTY_SURVEY_SIDECAR); setBinding(null); setFileObjectIdsByQuestion({}); setFileUploadError('')
    try {
      const state = await getLectureReportState(row.assignmentId)
      setStates(previous => ({ ...previous, [row.assignmentId]: state }))
      if (mode === 'read' || state.reportStatus === 'SUBMITTED') {
        if (state.reportStatus !== 'SUBMITTED') throw new Error('아직 제출된 강의보고서가 없습니다.')
        const submitted = await getLectureReportContent(row.assignmentId)
        setContent(submitted); setDraft(writingFormDraftFromApplicationForm(submitted.form, submitted.answers)); setView({ assignment: row, mode: 'read' }); return
      }
      if (!state.canSubmit || !['AVAILABLE', 'OVERDUE'].includes(state.reportStatus)) throw new Error(state.reportStatus === 'BUSINESS_ENDED' ? '사업 운영이 종료되어 제출할 수 없습니다.' : '현재 강의보고서를 작성할 수 없습니다.')
      const binding = await getLectureReportBinding(row.assignmentId)
      if (binding.assignmentId !== row.assignmentId || binding.programId !== programId) throw new Error('강의보고서 양식 정보가 일정과 일치하지 않습니다.')
      const rendered = await renderLectureReport(programId, binding.bindingId)
      if (rendered.formType !== 'WRITING') throw new Error('강의보고서 양식이 작성형(WRITING)이 아닙니다.')
      setBinding(binding); setForm(rendered)
      const prefilled = record(rendered.answers)
      setDraft(writingFormDraftFromApplicationForm(rendered, prefilled))
      if (state.reportStatus === 'OVERDUE') setNotice('제출 기한이 지났습니다. 사업 운영 종료 전까지 지각 제출할 수 있습니다.')
    } catch (cause) { setError(getLectureReportApiErrorMessage(cause, cause instanceof Error ? cause.message : '강의보고서를 열지 못했습니다.')) }
  }

  async function onFileChange(paragraphId: string, file: File | null, questionKey: string) {
    if (!file) {
      setFileObjectIdsByQuestion(previous => { const next = { ...previous }; delete next[questionKey]; return next })
      return
    }
    setUploadingFile(true); setFileUploadError('')
    try {
      const fileObjectId = await uploadMemberPortalFile({ file, filePurpose: 'ASSIGNMENT_ATTACHMENT' })
      setFileObjectIdsByQuestion(previous => ({ ...previous, [questionKey]: [fileObjectId] }))
    } catch {
      setFileObjectIdsByQuestion(previous => { const next = { ...previous }; delete next[questionKey]; return next })
      setSidecar(previous => ({ ...previous, fileNames: { ...previous.fileNames, [paragraphId]: null } }))
      setFileUploadError('파일 업로드에 실패했습니다. 파일을 다시 선택해 주세요.')
    } finally {
      setUploadingFile(false)
    }
  }

  function formResponseInput(currentBinding: LectureReportFormBinding): LectureReportFormResponseInput {
    const responseAnswers = buildEducationSurveyAnswers(draft!, sidecar)
    return {
      templateVersionId: currentBinding.templateVersionId,
      programId: currentBinding.programId,
      programFormBindingId: currentBinding.bindingId,
      contextType: currentBinding.contextType,
      contextId: currentBinding.contextId,
      answers: responseAnswers,
      ...(Object.keys(fileObjectIdsByQuestion).length > 0 ? { fileObjectIdsByQuestion } : {}),
    }
  }

  async function onSaveDraft() {
    if (!view || !form || !draft || !binding || busy || uploadingFile) return
    setBusy(true); setError('')
    try {
      const saved = await saveLectureReportDraft(formResponseInput(binding))
      if (!saved.formResponseId) throw new Error('임시저장 응답 ID를 받지 못했습니다.')
      setNotice('강의보고서가 임시저장되었습니다.')
    } catch (cause) {
      setError(getLectureReportApiErrorMessage(cause, cause instanceof Error ? cause.message : '임시저장에 실패했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  async function onSubmit() {
    if (!view || !form || !draft || !binding || busy || uploadingFile) return
    const validation = validateEducationSurveyFill(draft, sidecar)
    if (!validation.ok) { setError(validation.message); return }
    setBusy(true); setError('')
    try {
      const created = await submitLectureReportResponse(formResponseInput(binding))
      if (!created.formResponseId) throw new Error('양식 응답 ID를 받지 못했습니다. 최종 제출을 진행하지 않았습니다.')
      try {
        await submitLectureReport(view.assignment.assignmentId, { templateVersionId: binding.templateVersionId, formResponseId: created.formResponseId })
      } catch (reportError) {
        let latest: LectureReportState
        try {
          latest = await refreshState(view.assignment.assignmentId)
        } catch {
          setError(getLectureReportApiErrorMessage(reportError, '양식 응답은 저장됐지만 강의보고서 최종 제출 결과를 확인하지 못했습니다.'))
          return
        }
        if (latest.reportStatus === 'SUBMITTED') {
          setView({ assignment: view.assignment, mode: 'read' }); setContent(await getLectureReportContent(view.assignment.assignmentId))
          setNotice('강의보고서 제출이 확인되었습니다.'); setShowSettlementGuidance(true); return
        }
        setError(getLectureReportApiErrorMessage(reportError, '양식 응답은 저장됐지만 강의보고서 최종 제출은 확인되지 않았습니다. 중복 제출을 막기 위해 다시 제출하지 않았습니다.'))
        return
      }
      const latest = await refreshState(view.assignment.assignmentId)
      if (latest.reportStatus !== 'SUBMITTED') { setError('제출 요청 후 완료 상태를 확인하지 못했습니다.'); return }
      setView({ assignment: view.assignment, mode: 'read' }); setContent(await getLectureReportContent(view.assignment.assignmentId))
      setShowSettlementGuidance(true)
      setNotice('강의보고서 제출이 완료되었습니다. 제출 완료 후에는 수정할 수 없습니다. 지급조서 작성은 정산 현황에서 확인해 주세요.')
    } catch (cause) { setError(getLectureReportApiErrorMessage(cause, cause instanceof Error ? cause.message : '제출에 실패했습니다.')) }
    finally { setBusy(false) }
  }

  return <section className={styles.panel} aria-labelledby="lecture-report-title">
    <div className={styles.heading}><div><h2 id="lecture-report-title">강의보고서</h2><PFText as="p" typo="bd-sm-rg">배정된 강의 일정별 보고서 제출 현황을 확인할 수 있습니다.</PFText></div></div>
    {loading ? <p role="status">강의보고서 목록을 불러오는 중입니다.</p> : null}
    {error && !view ? <p role="alert">{error}</p> : null}
    {!loading && page?.totalElements === 0 ? <p>제출할 강의보고서가 없습니다.</p> : null}
    {page && page.items.length > 0 ? <>
      <div className={styles.rows}>{page.items.map(row => {
        const state = states[row.assignmentId]
        const reportState = statusLabel(state, row)
        const action = resolveLectureReportAction(state?.reportStatus, state?.canSubmit === true)
        const upcoming = action === 'disabled' && (state?.reportStatus === 'UPCOMING' || (!state && row.lectureStatus === 'UPCOMING'))
        const submitted = action === 'read' || row.reportStatus === 'SUBMITTED'
        return <article className={styles.row} key={row.assignmentId}>
          <div className={styles.rowTitle}><strong>{label(row)}</strong><span>{reportState}</span></div>
          <dl><div><dt>강의 일시</dt><dd>{date(row.startAt)}{row.endAt ? ` ~ ${date(row.endAt)}` : ''}</dd></div><div><dt>제출 기한</dt><dd>{date(row.submitDueAt)}</dd></div>
            {instructorProgram ? <><div><dt>교육 기관</dt><dd>{row.institutionName || '—'}</dd></div><div><dt>교육 학년</dt><dd>{row.grade || '—'}</dd></div></> : null}</dl>
          {state?.reportStatus === 'BUSINESS_ENDED' ? <p>사업 운영 종료로 강의보고서를 제출할 수 없습니다.</p> : null}
          <PFButton size="medium" type="button" disabled={submitted ? false : upcoming || action !== 'write'} onClick={() => void openRow(row, submitted ? 'read' : 'write')}>{submitted ? '강의보고서 확인하기' : '강의보고서 작성하기'}</PFButton>
        </article>
      })}</div>
      {page.totalPages > 1 ? <nav className={styles.pagination} aria-label="강의보고서 페이지"><PFButton size="small" type="button" disabled={pageNo <= 0} onClick={() => goToPage(pageNo - 1)}>이전</PFButton><span>{pageNo + 1} / {page.totalPages}</span><PFButton size="small" type="button" disabled={pageNo + 1 >= page.totalPages} onClick={() => goToPage(pageNo + 1)}>다음</PFButton></nav> : null}
    </> : null}
    {view ? <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={view.mode === 'read' ? '강의보고서 확인' : '강의보고서 작성'}>
      <div className={styles.dialog}><div className={styles.dialogHead}><h3>{view.mode === 'read' ? content?.title || '제출한 강의보고서' : '강의보고서 작성'}</h3><button type="button" onClick={() => { setView(null); setContent(null); setForm(null); setError('') }} aria-label="닫기">×</button></div>
        {notice ? <p role="status">{notice}</p> : null}{error ? <p role="alert">{error}</p> : null}{fileUploadError ? <p role="alert">{fileUploadError}</p> : null}
        {view.mode === 'read' && !content ? <p role="status">제출 내용을 불러오는 중입니다.</p> : null}
        {view.mode === 'read' && content ? <><p>제출 상태: {content.responseStatus} · 제출 시각: {date(content.submittedAt)}</p><p>읽기 전용</p></> : null}
        {view.mode === 'write' && !form && !error ? <p role="status">강의보고서 양식을 불러오는 중입니다.</p> : null}
        {draft ? <EducationSurveyFormBody draft={draft} programTitle={label(view.assignment)} onUpdateParagraph={((id, updater) => setDraft(current => current ? ({ ...current, paragraphs: current.paragraphs.map(paragraph => paragraph.id === id ? updater(paragraph) : paragraph) }) : current)) as FormUpdateParagraph} sidecar={sidecar} onSidecarChange={setSidecar} onFileChange={onFileChange} readOnly={view.mode === 'read'} /> : null}
        {content?.files.length ? <div className={styles.question}><strong>첨부파일</strong>{content.files.map(file => <p key={file.formSubmissionFileId}>{file.originalFileName} · {file.contentType}{file.downloadable ? ' · 다운로드 가능' : ' · 다운로드 불가'}</p>)}</div> : null}
        <div className={styles.actions}>{view.mode === 'write' ? <><PFButton type="button" size="medium" variant="secondary" disabled={busy || !form || !draft || uploadingFile} onClick={() => void onSaveDraft()}>{busy ? '저장 중…' : '임시저장'}</PFButton><PFButton type="button" size="medium" disabled={busy || !form || !draft || !binding || uploadingFile} onClick={() => void onSubmit()}>{busy ? '제출 중…' : '강의보고서 제출하기'}</PFButton></> : null}<PFButton type="button" size="medium" onClick={() => { setView(null); setContent(null); setForm(null); setDraft(null); setBinding(null); setFileObjectIdsByQuestion({}); setError('') }}>닫기</PFButton></div>
      </div>
    </div> : null}
    {showSettlementGuidance ? <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="settlement-guidance-title">
      <div className={styles.dialog}>
        <div className={styles.dialogHead}><h3 id="settlement-guidance-title">강의보고서 제출이 완료되었습니다.</h3></div>
        <p>지급조서는 교육 상세의 정산 현황에서 이어서 작성할 수 있습니다.</p>
        <div className={styles.actions}><PFButton type="button" size="medium" onClick={() => setShowSettlementGuidance(false)}>닫기</PFButton></div>
      </div>
    </div> : null}
  </section>
}
