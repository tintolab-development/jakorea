/**
 * 강의 출석 내역 모달
 * 명세: docs/design/lecture-attendance-modal-spec.md
 * 공통 ContentModal 사용, 강의 출석 전용 컨텐츠(설명·테이블·푸터 버튼)만 구성
 */

import { useMemo } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import type { Application } from '@/types/domain'
import type { SchoolDetailStudentRow } from '../model/school-detail-types'
import type { LectureAttendanceDetail, LectureAttendanceStatusKey } from '../model/school-detail-types'
import {
  getLectureAttendanceDetail,
  getLectureAttendanceDetailForApplication,
} from '../lib/school-detail-mock'
import './lecture-attendance-modal.css'

/** 회차 셀 표시 문구 (스크린샷: 출석/결석/강의 미진행) */
const SESSION_STATUS_DISPLAY: Record<LectureAttendanceStatusKey, string> = {
  attended: '출석',
  absent: '결석',
  not_held: '강의 미진행',
}

export interface LectureAttendanceModalProps {
  open: boolean
  onCancel: () => void
  /** 학교 상세용: 학생 행 + 학교 ID */
  student?: SchoolDetailStudentRow | null
  schoolId?: string
  /** 회원 상세용: 신청 + 회원명 */
  application?: Application | null
  userName?: string
  /** 출석 정정 버튼 클릭 시 (선택) */
  onCorrectAttendance?: () => void
}

export function LectureAttendanceModal({
  open,
  onCancel,
  student = null,
  schoolId = '',
  application = null,
  userName = '',
  onCorrectAttendance,
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
    <>
      <AppButton variant="cancel" size="large" onClick={onCancel}>
        닫기
      </AppButton>
      <AppButton variant="primary" size="large" modalTeal onClick={() => onCorrectAttendance?.()}>
        출석 정정
      </AppButton>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="강의 출석 내역"
      footer={footer}
      className="lecture-attendance-modal"
    >
      <div className="lecture-attendance-modal__body">
        {detail ? (
          <>
            <p className="lecture-attendance-modal__description">
              <span className="lecture-attendance-modal__description-name">[{detail.studentName}]</span>
              <span className="lecture-attendance-modal__description-text"> 학생의 강의 출석 내역입니다.</span>
            </p>
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
                      출석률
                    </td>
                    <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--value">
                      <strong>{detail.attendanceRatePercent}%</strong>{' '}
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
                          <td
                            className={`lecture-attendance-modal__cell lecture-attendance-modal__cell--value lecture-attendance-modal__cell--status-${s1.status}`}
                          >
                            {SESSION_STATUS_DISPLAY[s1.status]}
                          </td>
                          <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--label">
                            {s2 ? `${s2.roundNumber}회차` : ''}
                          </td>
                          <td
                            className={`lecture-attendance-modal__cell lecture-attendance-modal__cell--value${s2 ? ` lecture-attendance-modal__cell--status-${s2.status}` : ''}`}
                          >
                            {s2 ? SESSION_STATUS_DISPLAY[s2.status] : ''}
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
  )
}
