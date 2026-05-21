/**
 * 강의 출석 내역 모달
 * 명세: docs/design/lecture-attendance-modal-spec.md
 * 공통 ContentModal 사용, 강의 출석 전용 컨텐츠(설명·테이블·푸터 버튼)만 구성
 */

import { useMemo, useState, useEffect, useCallback, type ReactNode } from 'react'
import { Radio } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import type { Application } from '@/types/domain'
import type { SchoolDetailStudentRow } from '../model/school-detail-types'
import type { LectureAttendanceDetail, LectureAttendanceSession, LectureAttendanceStatusKey } from '../model/school-detail-types'
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

function countAttendanceDisplay(sessions: LectureAttendanceSession[]) {
  const held = sessions.filter(s => s.status !== 'not_held').length
  const attended = sessions.filter(s => s.status === 'attended').length
  return { attended, held }
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
  /** 출석 정정 저장 시 (회차별 출석/결석, API 연동 시 부모에서 처리) */
  onSaveAttendance?: (sessions: LectureAttendanceSession[]) => void
  /** 출석 정정 버튼 클릭 시 (편집 모드 진입과 함께 호출, 선택) */
  onCorrectAttendance?: () => void
  /** 저장 후 재오픈 시 목업 재계산 대신 이 회차 데이터 사용 */
  savedSessions?: LectureAttendanceSession[] | null
}

function SessionStatusCell({
  session,
  editing,
  onPick,
}: {
  session: LectureAttendanceSession
  editing: boolean
  onPick: (roundNumber: number, status: 'attended' | 'absent') => void
}) {
  if (session.status === 'not_held' || !editing) {
    return (
      <span
        className={`lecture-attendance-modal__status-text lecture-attendance-modal__status-text--${session.status}`}
      >
        {SESSION_STATUS_DISPLAY[session.status]}
      </span>
    )
  }
  return (
    <Radio.Group
      className="lecture-attendance-modal__session-radios"
      value={session.status}
      onChange={e => onPick(session.roundNumber, e.target.value as 'attended' | 'absent')}
    >
      <Radio value="attended">출석</Radio>
      <Radio value="absent">결석</Radio>
    </Radio.Group>
  )
}

export function LectureAttendanceModal({
  open,
  onCancel,
  student = null,
  schoolId = '',
  application = null,
  userName = '',
  onSaveAttendance,
  onCorrectAttendance,
  savedSessions = null,
}: LectureAttendanceModalProps) {
  const detailBase: LectureAttendanceDetail | null = useMemo(() => {
    if (!open) return null
    if (application && userName) {
      return getLectureAttendanceDetailForApplication(application, userName)
    }
    if (student && schoolId) {
      return getLectureAttendanceDetail(student, schoolId)
    }
    return null
  }, [open, student, schoolId, application, userName])

  const [sessionOverrides, setSessionOverrides] = useState<LectureAttendanceSession[] | null>(null)
  const [editing, setEditing] = useState(false)
  const [sessionDraft, setSessionDraft] = useState<LectureAttendanceSession[]>([])

  useEffect(() => {
    if (open && detailBase) {
      setSessionOverrides(null)
      setEditing(false)
      const initial =
        savedSessions && savedSessions.length > 0
          ? savedSessions.map(s => ({ ...s }))
          : detailBase.sessions.map(s => ({ ...s }))
      setSessionDraft(initial)
    }
  }, [open, detailBase, savedSessions])

  const sessions =
    sessionOverrides ??
    (savedSessions && savedSessions.length > 0 ? savedSessions : detailBase?.sessions ?? [])
  const tableSessions = editing ? sessionDraft : sessions
  const rateSource = editing ? sessionDraft : sessions
  const { attended: attendedDisplay, held: heldDisplay } = countAttendanceDisplay(rateSource)

  const patchSessionStatus = useCallback((roundNumber: number, status: 'attended' | 'absent') => {
    setSessionDraft(prev =>
      prev.map(s => (s.roundNumber === roundNumber ? { ...s, status } : s))
    )
  }, [])

  const startCorrection = useCallback(() => {
    setSessionDraft(sessions.map(s => ({ ...s })))
    setEditing(true)
    onCorrectAttendance?.()
  }, [sessions, onCorrectAttendance])

  const cancelCorrection = useCallback(() => {
    setSessionDraft(sessions.map(s => ({ ...s })))
    setEditing(false)
  }, [sessions])

  const saveCorrection = useCallback(() => {
    const next = sessionDraft.map(s => ({ ...s }))
    setSessionOverrides(next)
    setEditing(false)
    onSaveAttendance?.(next)
  }, [sessionDraft, onSaveAttendance])

  const footer = editing ? (
    <>
      <CmsButton variant="secondary" size="large" onClick={cancelCorrection}>
        취소
      </CmsButton>
      <CmsButton variant="primary" size="large" onClick={saveCorrection}>
        저장
      </CmsButton>
    </>
  ) : (
    <>
      <CmsButton variant="secondary" size="large" onClick={onCancel}>
        닫기
      </CmsButton>
      <CmsButton variant="primary" size="large" onClick={startCorrection}>
        출석 정정
      </CmsButton>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="강의 출석 내역"
      footer={footer}
      className="lecture-attendance-modal"
      description={
        detailBase ? (
          <p className="lecture-attendance-modal__description">
            <span className="lecture-attendance-modal__description-name">[{detailBase.studentName}]</span>
            <span className="lecture-attendance-modal__description-text"> 학생의 강의 출석 내역입니다.</span>
          </p>
        ) : undefined
      }
    >
      <div className="lecture-attendance-modal__body">
        {detailBase ? (
          <>
            <div className="lecture-attendance-modal__table-wrap">
              <table className="lecture-attendance-modal__table" role="table">
                <tbody>
                  <tr>
                    <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--label">
                      학생명
                    </td>
                    <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--value">
                      {detailBase.studentName}
                    </td>
                    <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--label">
                      출석률
                    </td>
                    <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--value">
                      <span className="lecture-attendance-modal__rate-wrap">
                        <span className="lecture-attendance-modal__rate-count">
                          {attendedDisplay} / {heldDisplay}건
                        </span>
                        <span className="lecture-attendance-modal__rate-note">
                          (강의 진행 회차 기준)
                        </span>
                      </span>
                    </td>
                  </tr>
                  {(() => {
                    const rows: ReactNode[] = []
                    const list = tableSessions
                    for (let i = 0; i < list.length; i += 2) {
                      const s1 = list[i]
                      const s2 = list[i + 1]
                      rows.push(
                        <tr key={i}>
                          <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--label">
                            {s1.roundNumber}회차
                          </td>
                          <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--value">
                            <SessionStatusCell
                              session={s1}
                              editing={editing}
                              onPick={patchSessionStatus}
                            />
                          </td>
                          <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--label">
                            {s2 ? `${s2.roundNumber}회차` : ''}
                          </td>
                          <td className="lecture-attendance-modal__cell lecture-attendance-modal__cell--value">
                            {s2 ? (
                              <SessionStatusCell
                                session={s2}
                                editing={editing}
                                onPick={patchSessionStatus}
                              />
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
  )
}
