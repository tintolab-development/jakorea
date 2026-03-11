/**
 * 강의 출석 내역 모달
 * 명세: docs/design/lecture-attendance-modal-spec.md, lecture-attendance-modal-table-prompt.md
 * 테이블 700×144px, 행 48px, 라벨열 144px, 텍스트만·좌측정렬·선택불가
 */

import { useMemo } from 'react'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { AppButton } from '@/shared/ui/app-button'
import type { Application } from '@/types/domain'
import type { SchoolDetailStudentRow } from '../model/school-detail-types'
import {
  type LectureAttendanceDetail,
  LECTURE_ATTENDANCE_STATUS_LABELS,
} from '../model/school-detail-types'
import {
  getLectureAttendanceDetail,
  getLectureAttendanceDetailForApplication,
} from '../lib/school-detail-mock'
import './lecture-attendance-modal.css'

export interface LectureAttendanceModalProps {
  open: boolean
  onCancel: () => void
  /** 학교 상세용: 학생 행 + 학교 ID */
  student?: SchoolDetailStudentRow | null
  schoolId?: string
  /** 회원 상세용: 신청 + 회원명 */
  application?: Application | null
  userName?: string
}

export function LectureAttendanceModal({
  open,
  onCancel,
  student = null,
  schoolId = '',
  application = null,
  userName = '',
}: LectureAttendanceModalProps) {
  const detail: LectureAttendanceDetail | null = useMemo(() => {
    if (!open) return null
    if (application && userName) {
      return getLectureAttendanceDetailForApplication(application, userName)
    }
    if (student && schoolId) {
      return getLectureAttendanceDetail(student, schoolId)
    }
    return null
  }, [open, student, schoolId, application, userName])

  const footer = (
    <AppButton variant="cancel" size="large" onClick={onCancel}>
      닫기
    </AppButton>
  )

  return (
    <TealHeaderModal
      open={open}
      onCancel={onCancel}
      title="강의 출석 내역"
      size="default"
      footer={footer}
      className="lecture-attendance-modal"
    >
      <div className="lecture-attendance-modal__body">
        {detail ? (
          <div className="lecture-attendance-modal__table-wrap">
            <table className="lecture-attendance-modal__table" role="table">
              <tbody>
                <tr>
                  <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--label">
                    학생명
                  </td>
                  <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--value">
                    {detail.studentName}
                  </td>
                  <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--label">
                    참석률
                  </td>
                  <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--value">
                    {detail.attendanceRatePercent}%{' '}
                    <span className="lecture-attendance-modal__attendance-rate-note">
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
                    rows.push(
                      <tr key={i}>
                        <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--label">
                          {s1.roundNumber}회차
                        </td>
                        <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--value">
                          {LECTURE_ATTENDANCE_STATUS_LABELS[s1.status]}
                        </td>
                        <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--label">
                          {s2 ? `${s2.roundNumber}회차` : ''}
                        </td>
                        <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--value">
                          {s2 ? LECTURE_ATTENDANCE_STATUS_LABELS[s2.status] : ''}
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
