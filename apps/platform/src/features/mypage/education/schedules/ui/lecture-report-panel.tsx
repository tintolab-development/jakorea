import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PFButton, PFMetaBadge, PFPagination, PFStateBadge, PFText } from '@/shared/ui'
import { EducationSessionListSkeleton } from '@/features/mypage/shared/ui'
import { EducationSessionCard, EducationSessionCardHeader } from '../../shared'
import lectureTeachingMintUrl from '@/widgets/mypage-layout/image/icon/lecture-teaching-mint-24.svg'
import alertRedUrl from '@/shared/assets/icons/alert-red.svg'
import checkDarkMintLargeUrl from '@/shared/assets/icons/check-dark-mint-large.svg'
import {
  getLectureReportAssignments, getLectureReportState, type LectureReportAssignment,
  type LectureReportStatus,
  type LectureReportPage, type LectureReportState,
} from '../api/lecture-report-client'
import { getLectureReportApiErrorMessage } from '../lib/lecture-report-contract'
import { lectureReportWritePath } from '../lib/lecture-report-path'
import styles from './lecture-report-panel.module.css'
import { clampLectureReportPage, resolveLectureReportAction } from '../lib/lecture-report-policy'

type Props = { applicationId: string; programId: number; instructorProgram: boolean }
function normalizeStatus(value: string | null | undefined): string { return (value ?? '').trim().toUpperCase() }
function resolveReportStatus(state: LectureReportState | undefined, row: LectureReportAssignment): LectureReportStatus | undefined {
  const validStatuses = new Set<LectureReportStatus>(['UPCOMING', 'AVAILABLE', 'OVERDUE', 'BUSINESS_ENDED', 'SUBMITTED'])
  const stateValue = normalizeStatus(state?.reportStatus)
  if (validStatuses.has(stateValue as LectureReportStatus)) return stateValue as LectureReportStatus

  const rowValue = normalizeStatus(row.reportStatus)
  if (validStatuses.has(rowValue as LectureReportStatus)) return rowValue as LectureReportStatus

  return ['UPCOMING', 'SCHEDULED', 'PLANNED'].includes(normalizeStatus(row.lectureStatus)) ? 'UPCOMING' : undefined
}
function formatDateOnly(value: string | null): string {
  if (!value) return ''
  const parsed = new Date(value)
  const parts = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }).formatToParts(parsed)
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? ''
  return `${part('year')}년 ${part('month')}월 ${part('day')}일(${part('weekday')})`
}
function formatDueDate(value: string | null): string {
  const formatted = formatDateOnly(value)
  return formatted ? `${formatted}까지` : ''
}
function formatTime(value: string | null): string {
  if (!value) return ''
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value))
}
function formatTimeRange(row: LectureReportAssignment): string {
  const start = formatTime(row.startAt)
  const end = formatTime(row.endAt)
  return start && end ? `${start}~${end}` : start || end
}
function lectureStatusPresentation(value: string | null | undefined): { label: string; tone: 'progress' | 'success' | 'disabled' } {
  switch (normalizeStatus(value)) {
    case 'UPCOMING': return { label: '진행 예정', tone: 'progress' }
    case 'COMPLETED':
    case 'ENDED':
    case 'FINISHED': return { label: '진행 완료', tone: 'success' }
    case 'IN_PROGRESS':
    case 'ONGOING': return { label: '진행 중', tone: 'progress' }
    default: return { label: '진행 현황 확인 중', tone: 'disabled' }
  }
}
function reportMessage(status: LectureReportStatus | undefined): string {
  switch (status) {
    case 'SUBMITTED': return '강의보고서 제출이 완료되었습니다'
    case 'OVERDUE': return '강의보고서 제출기한이 마감되었어요'
    case 'AVAILABLE': return '기한 내에 강의보고서를 제출해 주세요'
    case 'UPCOMING': return '강의보고서는 강의 진행 이후 작성이 가능해요'
    case 'BUSINESS_ENDED': return '사업 운영이 종료되어 강의보고서를 제출할 수 없어요'
    default: return '강의보고서 제출 상태를 확인하는 중입니다.'
  }
}

export function LectureReportPanel({ applicationId, programId, instructorProgram }: Props) {
  const navigate = useNavigate()
  const [pageNo, setPageNo] = useState(0)
  const [page, setPage] = useState<LectureReportPage | null>(null)
  const [states, setStates] = useState<Record<number, LectureReportState>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let alive = true
    const controller = new AbortController()
    getLectureReportAssignments(programId, pageNo, controller.signal).then(async result => {
      if (!alive) return
      if (result.totalPages > 0 && pageNo >= result.totalPages) { setPageNo(clampLectureReportPage(pageNo, result.totalPages)); return }
      setPage(result)
      const fetched = await Promise.all(result.items.map(async row => {
        try { return [row.assignmentId, await getLectureReportState(row.assignmentId)] as const } catch { return null }
      }))
      if (alive) setStates(previous => ({ ...previous, ...Object.fromEntries(fetched.filter((x): x is NonNullable<typeof x> => x != null)) }))
    }).catch(cause => {
      if (!alive) return
      setPage(null)
      setStates({})
      setError(getLectureReportApiErrorMessage(cause, '강의보고서 목록을 불러오지 못했습니다.'))
    }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false; controller.abort() }
  }, [programId, pageNo, reloadToken])

  function goToPage(next: number) {
    setError('')
    setLoading(true)
    setPage(null)
    setStates({})
    setPageNo(next)
  }
  function retry() {
    setError('')
    setLoading(true)
    setPage(null)
    setStates({})
    setReloadToken(value => value + 1)
  }
  if (loading && !page) return <EducationSessionListSkeleton statusMessage="강의보고서 목록을 불러오는 중입니다." />
  return <section className={styles.panel} aria-labelledby="lecture-report-title" aria-busy={loading}>
    <div className={styles.heading}>
      <h2 id="lecture-report-title" className={styles.headingTitle}>
        강의보고서 <span className={styles.headingCount}>{page?.totalElements ?? 0}건</span>
      </h2>
    </div>
    {error ? (
      <div className={styles.errorState} role="alert">
        <p className={styles.errorMessage}>{error}</p>
        <PFButton type="button" variant="tertiary" size="large" onClick={retry} disabled={loading}>
          다시 시도
        </PFButton>
      </div>
    ) : null}
    {!loading && !error && page?.items.length === 0 ? <p>제출할 강의보고서가 없습니다.</p> : null}
    {page && page.items.length > 0 ? <>
      <div className={styles.rows}>{page.items.map(row => {
        const state = states[row.assignmentId]
        const reportStatus = resolveReportStatus(state, row)
        const action = resolveLectureReportAction(reportStatus, state?.canSubmit ?? row.canSubmit)
        const submitted = reportStatus === 'SUBMITTED'
        const lectureStatus = lectureStatusPresentation(row.lectureStatus)
        const statusLoaded = state != null || row.reportStatus != null
        const timeRange = formatTimeRange(row)
        const timeLabel = [timeRange, row.sessionNo ? `${row.sessionNo}차시` : ''].filter(Boolean).join(' ')
        const institutionMeta = instructorProgram && (row.institutionName || row.grade) ? (
          <PFMetaBadge
            icon={<img src={lectureTeachingMintUrl} alt="" width={24} height={24} aria-hidden="true" />}
            primary={row.institutionName || '교육 기관'}
            secondary={row.grade || undefined}
          />
        ) : null
        const reportMeta = statusLoaded && reportStatus !== 'UPCOMING' ? (
          <span className={[styles.reportStatus, submitted ? styles.reportStatusSubmitted : styles.reportStatusMissing].join(' ')}>
            <img
              src={submitted ? checkDarkMintLargeUrl : alertRedUrl}
              className={styles.reportStatusIcon}
              alt=""
              aria-hidden="true"
            />
            <span>{submitted ? '제출 완료' : '보고서 미제출'}</span>
          </span>
        ) : null
        return (
          <EducationSessionCard className={styles.row} key={row.assignmentId}>
            <EducationSessionCardHeader
              badge={<PFStateBadge size="small" tone={lectureStatus.tone}>{lectureStatus.label}</PFStateBadge>}
              date={formatDateOnly(row.startAt) || '강의 일정'}
              subtitle={timeLabel ? <PFText as="span" typo="bd-md-rg" className={styles.timeLabel}>{timeLabel}</PFText> : undefined}
              aside={<div className={styles.headerAside}>{institutionMeta}{reportMeta}</div>}
            />
            <div className={[styles.reportGuide, submitted ? styles.reportGuideSubmitted : undefined].filter(Boolean).join(' ')}>
              <div className={styles.reportGuideCopy}>
                <p className={styles.reportMessage}>{reportMessage(reportStatus)}</p>
                {reportStatus !== 'UPCOMING' && row.submitDueAt ? <p className={styles.reportDueDate}>{formatDueDate(row.submitDueAt)}</p> : null}
              </div>
              <PFButton
                type="button"
                size="large"
                variant={submitted ? 'tertiary' : 'primary'}
                className={styles.reportActionButton}
                disabled={submitted ? false : action !== 'write'}
                onClick={() => navigate(lectureReportWritePath(applicationId, row.assignmentId, submitted ? 'preview' : 'write'))}
              >
                {submitted ? '강의보고서 확인하기' : '강의보고서 작성하기'}
              </PFButton>
            </div>
          </EducationSessionCard>
        )
      })}</div>
      {page.totalPages > 1 ? <div className={styles.pagination}><PFPagination currentPage={pageNo + 1} totalPages={page.totalPages} onPageChange={nextPage => goToPage(nextPage - 1)} ariaLabel="강의보고서 페이지" /></div> : null}
    </> : null}
  </section>
}
