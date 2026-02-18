/**
 * 과제 제출 내역 모달
 * 학교 상세정보 모달 > 학생 명단 > 과제 제출 내역 "내역 보기" 클릭 시 노출
 * 테이블: 1행 학생명/제출률, 2~3행 회차별 제출 상태 + 과제 보기 버튼, 바디 높이 274px
 */

import { useMemo } from 'react'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { AppButton } from '@/shared/ui/app-button'
import type { SchoolDetailStudentRow } from '../model/school-detail-types'
import {
  type AssignmentSubmissionDetail,
  ASSIGNMENT_SUBMISSION_STATUS_LABELS,
} from '../model/school-detail-types'
import { getAssignmentSubmissionDetail } from '../lib/school-detail-mock'
import './assignment-submission-modal.css'

export interface AssignmentSubmissionModalProps {
  open: boolean
  onCancel: () => void
  student: SchoolDetailStudentRow | null
  schoolId: string
}

export function AssignmentSubmissionModal({
  open,
  onCancel,
  student,
  schoolId,
}: AssignmentSubmissionModalProps) {
  const detail: AssignmentSubmissionDetail | null = useMemo(() => {
    if (!open || !student || !schoolId) return null
    return getAssignmentSubmissionDetail(student, schoolId)
  }, [open, student, schoolId])

  const footer = (
    <AppButton variant="cancel" size="large" onClick={onCancel}>
      닫기
    </AppButton>
  )

  return (
    <TealHeaderModal
      open={open}
      onCancel={onCancel}
      title="과제 제출 내역"
      size="default"
      footer={footer}
      className="assignment-submission-modal"
    >
      <div className="assignment-submission-modal__body">
        {detail ? (
          <div className="assignment-submission-modal__table-wrap">
            <table className="assignment-submission-modal__table" role="table">
              <tbody>
                <tr>
                  <td className="assignment-submission-modal__cell assignment-submission-modal__cell--label">
                    학생명
                  </td>
                  <td className="assignment-submission-modal__cell assignment-submission-modal__cell--value">
                    <div className="assignment-submission-modal__cell-row">
                      {detail.studentName}
                    </div>
                  </td>
                  <td className="assignment-submission-modal__cell assignment-submission-modal__cell--label">
                    제출률
                  </td>
                  <td className="assignment-submission-modal__cell assignment-submission-modal__cell--value">
                    <div className="assignment-submission-modal__cell-row">
                      {detail.submissionRatePercent}%{' '}
                      <span className="assignment-submission-modal__rate-note">
                        (강의 진행 회차 기준)
                      </span>
                    </div>
                  </td>
                </tr>
                {(() => {
                  const rows: React.ReactNode[] = []
                  const sessions = detail.sessions
                  for (let i = 0; i < sessions.length; i += 2) {
                    const s1 = sessions[i]
                    const s2 = sessions[i + 1]
                    const canView1 = s1.status !== 'not_started'
                    const canView2 = s2 && s2.status !== 'not_started'
                    rows.push(
                      <tr key={i}>
                        <td className="assignment-submission-modal__cell assignment-submission-modal__cell--label">
                          {s1.roundNumber}회차
                        </td>
                        <td className="assignment-submission-modal__cell assignment-submission-modal__cell--value">
                          <div className="assignment-submission-modal__cell-row">
                            <span className="assignment-submission-modal__status">
                              {ASSIGNMENT_SUBMISSION_STATUS_LABELS[s1.status]}
                            </span>
                            <AppButton
                              variant="viewDetails"
                              size="small"
                              disabled={!canView1}
                              className="assignment-submission-modal__task-btn"
                            >
                              과제 보기
                            </AppButton>
                          </div>
                        </td>
                        <td className="assignment-submission-modal__cell assignment-submission-modal__cell--label">
                          {s2 ? `${s2.roundNumber}회차` : ''}
                        </td>
                        <td className="assignment-submission-modal__cell assignment-submission-modal__cell--value">
                          {s2 ? (
                            <div className="assignment-submission-modal__cell-row">
                              <span className="assignment-submission-modal__status">
                                {ASSIGNMENT_SUBMISSION_STATUS_LABELS[s2.status]}
                              </span>
                              <AppButton
                                variant="viewDetails"
                                size="small"
                                disabled={!canView2}
                                className="assignment-submission-modal__task-btn"
                              >
                                과제 보기
                              </AppButton>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )
                  }
                  return rows
                })()}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </TealHeaderModal>
  )
}
