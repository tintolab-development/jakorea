/**
 * 과제 제출 내역 모달
 * 학교 상세정보 모달 > 학생 명단 > 과제 제출 내역 "내역 보기" 클릭 시 노출
 * ContentModal 사용. 스크린샷 기준: 설명 문구, 2열 테이블(학생명/제출률, 회차별 상태+과제 보기), 닫기 우측 정렬
 */

import { useMemo, useState } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import { AssignmentPreviewModal } from './assignment-preview-modal'
import type { Application } from '@/types/domain'
import type { SchoolDetailStudentRow } from '../model/school-detail-types'
import type {
  AssignmentSubmissionDetail,
  AssignmentSubmissionTableRow,
} from '../model/school-detail-types'
import {
  getAssignmentSubmissionDetail,
  getAssignmentSubmissionDetailForApplication,
} from '../lib/school-detail-mock'
import './assignment-submission-modal.css'

/** 회차 셀 표시 문구 (스크린샷: 제출 완료/미제출/강의 미진행) */
const SESSION_STATUS_DISPLAY: Record<'submitted' | 'not_submitted' | 'not_started', string> = {
  submitted: '제출 완료',
  not_submitted: '미제출',
  not_started: '강의 미진행',
}

function submissionRowUiStatus(row: AssignmentSubmissionTableRow): keyof typeof SESSION_STATUS_DISPLAY {
  if (row.lectureProgress === 'scheduled') return 'not_started'
  if (row.submissionStatus === 'submitted') return 'submitted'
  return 'not_submitted'
}

function submissionRateFromRows(rows: AssignmentSubmissionTableRow[]): number {
  const completed = rows.filter(r => r.lectureProgress === 'completed')
  if (completed.length === 0) return 0
  const submitted = completed.filter(r => r.submissionStatus === 'submitted').length
  return Math.round((submitted / completed.length) * 100)
}

export interface AssignmentSubmissionModalProps {
  open: boolean
  onCancel: () => void
  /** 목 데이터·상세 제목 연동용 (미전달 시 기본값) */
  programTitle?: string
  /** 학교 상세용: 학생 행 + 학교 ID */
  student?: SchoolDetailStudentRow | null
  schoolId?: string
  /** 회원 상세용: 신청 + 회원명 */
  application?: Application | null
  userName?: string
}

const DEFAULT_PROGRAM_TITLE = '프로그램'

export function AssignmentSubmissionModal({
  open,
  onCancel,
  programTitle = DEFAULT_PROGRAM_TITLE,
  student = null,
  schoolId = '',
  application = null,
  userName = '',
}: AssignmentSubmissionModalProps) {
  const detail: AssignmentSubmissionDetail | null = useMemo(() => {
    if (!open) return null
    const title = programTitle.trim() || DEFAULT_PROGRAM_TITLE
    if (application && userName) {
      return getAssignmentSubmissionDetailForApplication(application, userName, title)
    }
    if (student && schoolId) {
      return getAssignmentSubmissionDetail(student, schoolId, title)
    }
    return null
  }, [open, student, schoolId, application, userName, programTitle])

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewRound, setPreviewRound] = useState<number>(1)

  const openPreview = (roundNumber: number) => {
    setPreviewRound(roundNumber)
    setPreviewOpen(true)
  }

  const footer = (
    <AppButton variant="cancel" size="large" onClick={onCancel}>
      닫기
    </AppButton>
  )

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title="과제 제출 내역"
        footer={footer}
        className="assignment-submission-modal"
      >
        <div className="assignment-submission-modal__body">
          {detail ? (
            <>
              <p className="assignment-submission-modal__description">
                <span className="assignment-submission-modal__description-name">
                  [{detail.studentName}]
                </span>
                <span className="assignment-submission-modal__description-text">
                  {' '}
                  학생의 과제 제출 내역입니다.
                </span>
              </p>
              <div className="assignment-submission-modal__table-wrap">
                <table className="assignment-submission-modal__table" role="table">
                  <tbody>
                    <tr>
                      <td className="assignment-submission-modal__cell assignment-submission-modal__cell--label">
                        학생명
                      </td>
                      <td className="assignment-submission-modal__cell assignment-submission-modal__cell--value">
                        {detail.studentName}
                      </td>
                      <td className="assignment-submission-modal__cell assignment-submission-modal__cell--label">
                        제출률
                      </td>
                      <td className="assignment-submission-modal__cell assignment-submission-modal__cell--value">
                        <strong>{submissionRateFromRows(detail.rows)}%</strong>{' '}
                        <span className="assignment-submission-modal__rate-note">
                          (강의 진행 회차 기준)
                        </span>
                      </td>
                    </tr>
                    {(() => {
                      const tableRows: React.ReactNode[] = []
                      const sessionRows = detail.rows ?? []
                      for (let i = 0; i < sessionRows.length; i += 2) {
                        const s1 = sessionRows[i]!
                        const s2 = sessionRows[i + 1]
                        const ui1 = submissionRowUiStatus(s1)
                        const ui2 = s2 ? submissionRowUiStatus(s2) : null
                        const canView1 = s1.canViewAssignment
                        const canView2 = s2?.canViewAssignment ?? false
                        tableRows.push(
                          <tr key={s1.id}>
                            <td className="assignment-submission-modal__cell assignment-submission-modal__cell--label">
                              {s1.roundNumber}회차
                            </td>
                            <td className="assignment-submission-modal__cell assignment-submission-modal__cell--value">
                              <div className="assignment-submission-modal__cell-row assignment-submission-modal__cell-row--between">
                                <span
                                  className={`assignment-submission-modal__status assignment-submission-modal__status--${ui1}`}
                                >
                                  {SESSION_STATUS_DISPLAY[ui1]}
                                </span>
                                <AppButton
                                  variant="viewDetails"
                                  size="small"
                                  disabled={!canView1}
                                  className="assignment-submission-modal__task-btn"
                                  onClick={() => canView1 && openPreview(s1.roundNumber)}
                                >
                                  과제 보기
                                </AppButton>
                              </div>
                            </td>
                            <td className="assignment-submission-modal__cell assignment-submission-modal__cell--label">
                              {s2 ? `${s2.roundNumber}회차` : ''}
                            </td>
                            <td className="assignment-submission-modal__cell assignment-submission-modal__cell--value">
                              {s2 && ui2 ? (
                                <div className="assignment-submission-modal__cell-row assignment-submission-modal__cell-row--between">
                                  <span
                                    className={`assignment-submission-modal__status assignment-submission-modal__status--${ui2}`}
                                  >
                                    {SESSION_STATUS_DISPLAY[ui2]}
                                  </span>
                                  <AppButton
                                    variant="viewDetails"
                                    size="small"
                                    disabled={!canView2}
                                    className="assignment-submission-modal__task-btn"
                                    onClick={() => canView2 && openPreview(s2.roundNumber)}
                                  >
                                    과제 보기
                                  </AppButton>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )
                      }
                      return tableRows
                    })()}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </ContentModal>
      {detail && (
        <AssignmentPreviewModal
          open={previewOpen}
          onCancel={() => setPreviewOpen(false)}
          studentName={detail.studentName}
          roundNumber={previewRound}
        />
      )}
    </>
  )
}
