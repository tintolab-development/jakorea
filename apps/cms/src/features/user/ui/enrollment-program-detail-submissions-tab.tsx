/**
 * 수강 프로그램 상세 모달 — 제출 내역 및 서류 발급 탭
 */

import { useMemo } from 'react'
import type { Program } from '@/types/domain'
import dayjs from 'dayjs'
import './enrollment-program-detail-submissions-tab.css'

// ── 유틸 ─────────────────────────────────────────────

const DOW_KO = ['일', '월', '화', '수', '목', '금', '토']

function formatPeriod(start: string | Date, end: string | Date): string {
  const s = dayjs(start)
  const e = dayjs(end)
  return `${s.format('YY. MM. DD')} (${DOW_KO[s.day()]}) ~ ${e.format('YY. MM. DD')} (${DOW_KO[e.day()]})`
}

// ── 아이콘 ────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 16L7 11l1.4-1.45L11 12.15V4h2v8.15l2.6-2.6L17 11l-5 5zm-6 4c-.55 0-1.02-.196-1.413-.587A1.926 1.926 0 0 1 4 18v-3h2v3h12v-3h2v3c0 .55-.196 1.02-.587 1.413A1.926 1.926 0 0 1 18 20H6z" />
    </svg>
  )
}

// ── mock 데이터 ───────────────────────────────────────

interface SubmissionRow {
  id: string
  roundLabel: string
  submissionPeriod: string | null
  lectureStatus: '진행 완료' | '미진행'
  /** 과제 존재 + 제출 기간 내 → 과제 제출 버튼 활성 */
  canSubmit: boolean
  /** 제출된 과제 존재 → 과제 보기 버튼 활성 */
  canView: boolean
}

function getMockRows(program: Program): SubmissionRow[] {
  const now = dayjs()
  const rounds = [...(program.rounds ?? [])].sort((a, b) => a.roundNumber - b.roundNumber)

  const rows: SubmissionRow[] = rounds.map((round, idx) => {
    const isCompleted = idx < rounds.length - 1
    const period =
      round.startDate && round.endDate ? formatPeriod(round.startDate, round.endDate) : null

    // 과제 제출 기간 내 여부 (실제 연동 시 round의 submissionStartDate/EndDate 사용)
    const withinPeriod =
      round.startDate && round.endDate
        ? now.isAfter(dayjs(round.startDate)) && now.isBefore(dayjs(round.endDate))
        : false

    // mock: 3차시만 제출된 과제 존재
    const hasSubmission = idx === 2

    // 과제 제출: 과제 존재 + 기간 내 (마감 전)
    const canSubmit = withinPeriod
    // 과제 보기: 제출된 과제 존재
    const canView = hasSubmission

    return {
      id: round.id,
      roundLabel: `${round.roundNumber}차시`,
      submissionPeriod: period,
      lectureStatus: isCompleted ? '진행 완료' : '미진행',
      canSubmit,
      canView,
    }
  })

  // 만족도 조사 row
  const last = rounds[rounds.length - 1]
  rows.push({
    id: 'satisfaction-survey',
    roundLabel: '만족도 조사',
    submissionPeriod:
      last?.startDate && last?.endDate ? formatPeriod(last.startDate, last.endDate) : null,
    lectureStatus: '미진행',
    canSubmit: false,
    canView: false,
  })

  return rows
}

const DOCUMENTS = [
  { id: 'certificate', label: '수료증' },
  { id: 'activity', label: '활동확인서' },
]

// ── 메인 컴포넌트 ─────────────────────────────────────

interface Props {
  program: Program
}

export function EnrollmentProgramDetailSubmissionsTab({ program }: Props) {
  const rows = useMemo(() => getMockRows(program), [program])

  return (
    <div className="submissions-tab">
      {/* ── 과제 제출 내역 ─────────────────────── */}
      <section className="submissions-tab__section">
        <div className="submissions-tab__section-header">
          <h3 className="submissions-tab__section-title">과제 제출 내역</h3>
          <p className="submissions-tab__section-notice">
            제출 기간 마감 후에는 과제 수정이 불가합니다.
          </p>
        </div>

        <div className="submissions-tab__table-wrap">
          <table className="submissions-tab__table">
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="submissions-tab__th">진행 회차</th>
                <th className="submissions-tab__th">과제 제출 기간</th>
                <th className="submissions-tab__th">강의 진행 여부</th>
                <th className="submissions-tab__th">과제 제출 내역</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td className="submissions-tab__td submissions-tab__td--center">
                    {row.roundLabel}
                  </td>
                  <td className="submissions-tab__td submissions-tab__td--center">
                    {row.submissionPeriod ?? '-'}
                  </td>
                  <td className="submissions-tab__td submissions-tab__td--center">
                    <span
                      className={`submissions-tab__lecture-status ${
                        row.lectureStatus === '진행 완료'
                          ? 'submissions-tab__lecture-status--done'
                          : 'submissions-tab__lecture-status--pending'
                      }`}
                    >
                      {row.lectureStatus}
                    </span>
                  </td>
                  <td className="submissions-tab__td">
                    <div className="submissions-tab__btn-group">
                      <button
                        type="button"
                        className={`submissions-tab__btn ${
                          row.canSubmit
                            ? 'submissions-tab__btn--primary'
                            : 'submissions-tab__btn--disabled'
                        }`}
                        disabled={!row.canSubmit}
                      >
                        과제 제출
                      </button>
                      <button
                        type="button"
                        className={`submissions-tab__btn ${
                          row.canView
                            ? 'submissions-tab__btn--outline'
                            : 'submissions-tab__btn--disabled'
                        }`}
                        disabled={!row.canView}
                      >
                        과제 보기
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 서류 발급 ──────────────────────────── */}
      <section className="submissions-tab__section">
        <div className="submissions-tab__section-header">
          <h3 className="submissions-tab__section-title">서류 발급</h3>
          <p className="submissions-tab__section-notice">
            개인정보 보관 만료 전까지 자유롭게 발급이 가능합니다.
          </p>
        </div>

        <div className="submissions-tab__table-wrap">
          <table className="submissions-tab__doc-table">
            <tbody>
              {DOCUMENTS.map(doc => (
                <tr key={doc.id}>
                  <th className="submissions-tab__doc-th">{doc.label}</th>
                  <td className="submissions-tab__doc-td">
                    <button type="button" className="submissions-tab__download-btn">
                      <DownloadIcon />
                      파일 다운로드
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
