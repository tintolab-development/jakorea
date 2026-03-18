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
  AssignmentSubmissionStatusKey,
} from '../model/school-detail-types'
import {
  getAssignmentSubmissionDetail,
  getAssignmentSubmissionDetailForApplication,
} from '../lib/school-detail-mock'
import './assignment-submission-modal.css'

/** 회차 셀 표시 문구 (스크린샷: 제출 완료/미제출/강의 미진행) */
const SESSION_STATUS_DISPLAY: Record<AssignmentSubmissionStatusKey, string> = {
  submitted: '제출 완료',
  not_submitted: '미제출',
  not_started: '강의 미진행',
}

export interface AssignmentSubmissionModalProps {
  open: boolean
  onCancel: () => void
  /** 학교 상세용: 학생 행 + 학교 ID */
  student?: SchoolDetailStudentRow | null
  schoolId?: string
  /** 회원 상세용: 신청 + 회원명 */
  application?: Application | null
  userName?: string
}

export function AssignmentSubmissionModal({
  open,
  onCancel,
  student = null,
  schoolId = '',
  application = null,
  userName = '',
}: AssignmentSubmissionModalProps) {
  const detail: AssignmentSubmissionDetail | null = useMemo(() => {
    if (!open) return null
    if (application && userName) {
      return getAssignmentSubmissionDetailForApplication(application, userName)
    }
    if (student && schoolId) {
      return getAssignmentSubmissionDetail(student, schoolId)
    }
    return null
  }, [open, student, schoolId, application, userName])

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
                        <strong>{detail.submissionRatePercent}%</strong>{' '}
                        <span className="assignment-submission-modal__rate-note">
                          (강의 진행 회차 기준)
                        </span>
                      </td>
                    </tr>
                    {(() => {
                      const rows: React.ReactNode[] = []
                      const sessions = detail.sessions
                      for (let i = 0; i < sessions.length; i += 2) {
                        const s1 = sessions[i]
                        const s2 = sessions[i + 1]
                        const canView1 = s1.status === 'submitted'
                        const canView2 = s2 ? s2.status === 'submitted' : false
                        rows.push(
                          <tr key={i}>
                            <td className="assignment-submission-modal__cell assignment-submission-modal__cell--label">
                              {s1.roundNumber}회차
                            </td>
                            <td className="assignment-submission-modal__cell assignment-submission-modal__cell--value">
                              <div className="assignment-submission-modal__cell-row assignment-submission-modal__cell-row--between">
                                <span
                                  className={`assignment-submission-modal__status assignment-submission-modal__status--${s1.status}`}
                                >
                                  {SESSION_STATUS_DISPLAY[s1.status]}
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
                              {s2 ? (
                                <div className="assignment-submission-modal__cell-row assignment-submission-modal__cell-row--between">
                                  <span
                                    className={`assignment-submission-modal__status assignment-submission-modal__status--${s2.status}`}
                                  >
                                    {SESSION_STATUS_DISPLAY[s2.status]}
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
                      return rows
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
