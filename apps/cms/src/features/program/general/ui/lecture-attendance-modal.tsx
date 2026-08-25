/**
 * 강의 출석 내역 모달
 * 스크린샷: ContentModal 800 · 패딩 26/30/34 · 설명↔표↔푸터 30px
 * 본문: 4열 키-값 표(라벨 회색 / 값 흰색), 회차 2개씩 한 행
 */

import { useMemo, useState, useEffect, useCallback } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import type { Application } from '@/types/domain'
import type { SchoolDetailStudentRow } from '../model/school-detail-types'
import type {
  LectureAttendanceDetail,
  LectureAttendanceSession,
  LectureAttendanceStatusKey,
} from '../model/school-detail-types'
import { LECTURE_ATTENDANCE_STATUS_LABELS } from '../model/school-detail-types'
import {
  getLectureAttendanceDetail,
  getLectureAttendanceDetailForApplication,
} from '../lib/school-detail-mock'
import { countLectureAttendanceHeldAndAttended } from '../lib/lecture-attendance-count'
import './lecture-attendance-modal.css'

type EditableAttendanceStatus = Extract<LectureAttendanceStatusKey, 'attended' | 'absent' | 'late'>

function SessionStatusCell({
  session,
  editing,
  onPick,
}: {
  session: LectureAttendanceSession
  editing: boolean
  onPick: (roundNumber: number, status: EditableAttendanceStatus) => void
}) {
  if (session.status === 'not_held') {
    return (
      <span
        className="lecture-attendance-modal__status-text lecture-attendance-modal__status-text--not_held"
        aria-disabled
      >
        {LECTURE_ATTENDANCE_STATUS_LABELS.not_held}
      </span>
    )
  }

  if (!editing) {
    return (
      <span
        className={`lecture-attendance-modal__status-text lecture-attendance-modal__status-text--${session.status}`}
      >
        {LECTURE_ATTENDANCE_STATUS_LABELS[session.status]}
      </span>
    )
  }

  return (
    <CmsRadioGroup
      className="lecture-attendance-modal__session-radios"
      size="medium"
      value={session.status}
      onChange={e => onPick(session.roundNumber, e.target.value as EditableAttendanceStatus)}
    >
      <CmsRadio value="attended" size="medium">
        출석
      </CmsRadio>
      <CmsRadio value="absent" size="medium">
        결석
      </CmsRadio>
      <CmsRadio value="late" size="medium">
        지각
      </CmsRadio>
    </CmsRadioGroup>
  )
}

function AttendanceRateValue({ attended, held }: { attended: number; held: number }) {
  return (
    <span className="lecture-attendance-modal__rate-wrap">
      <span className="lecture-attendance-modal__rate-count">
        {attended} / {held}건
      </span>
      <span className="lecture-attendance-modal__rate-note"> (강의 진행 회차 기준)</span>
    </span>
  )
}

export interface LectureAttendanceModalProps {
  open: boolean
  onCancel: () => void
  student?: SchoolDetailStudentRow | null
  schoolId?: string
  application?: Application | null
  userName?: string
  onSaveAttendance?: (sessions: LectureAttendanceSession[]) => void
  onCorrectAttendance?: () => void
  savedSessions?: LectureAttendanceSession[] | null
  zIndex?: number
  /** API enrollment-summary 집계값만 있을 때 회차별 mock 대신 요약만 표시 */
  attendanceSummaryOnly?: string
  /** remote API 상세 — 지정 시 mock 미사용 */
  remoteDetail?: LectureAttendanceDetail | null
  remoteDetailLoading?: boolean
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
  zIndex,
  attendanceSummaryOnly,
  remoteDetail,
  remoteDetailLoading = false,
}: LectureAttendanceModalProps) {
  const summaryAttendanceCounts = useMemo(() => {
    if (remoteDetail !== undefined) return null
    if (!attendanceSummaryOnly?.trim()) return null
    const match = /(\d+)\s*\/\s*(\d+)/.exec(attendanceSummaryOnly.replace('/', ' / '))
    if (!match) return null
    return { attended: Number(match[1]), held: Number(match[2]) }
  }, [attendanceSummaryOnly, remoteDetail])

  const detailBase: LectureAttendanceDetail | null = useMemo(() => {
    if (!open) return null
    if (remoteDetail !== undefined) return remoteDetail
    if (summaryAttendanceCounts != null && application && userName) {
      return {
        studentName: userName,
        attendanceRatePercent: 0,
        sessions: [],
      }
    }
    if (application && userName) {
      return getLectureAttendanceDetailForApplication(application, userName)
    }
    if (student && schoolId) {
      return getLectureAttendanceDetail(student, schoolId)
    }
    return null
  }, [open, student, schoolId, application, userName, summaryAttendanceCounts, remoteDetail])

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
  const { attended: attendedDisplay, held: heldDisplay } =
    summaryAttendanceCounts ?? countLectureAttendanceHeldAndAttended(rateSource)

  const sessionPairs = useMemo(() => {
    const pairs: Array<[LectureAttendanceSession | null, LectureAttendanceSession | null]> = []
    for (let i = 0; i < tableSessions.length; i += 2) {
      pairs.push([tableSessions[i] ?? null, tableSessions[i + 1] ?? null])
    }
    return pairs
  }, [tableSessions])

  const patchSessionStatus = useCallback(
    (roundNumber: number, status: EditableAttendanceStatus) => {
      setSessionDraft(prev =>
        prev.map(s => (s.roundNumber === roundNumber ? { ...s, status } : s))
      )
    },
    []
  )

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

  const handleModalCancel = useCallback(() => {
    if (editing) {
      cancelCorrection()
      return
    }
    onCancel()
  }, [editing, cancelCorrection, onCancel])

  const footer = summaryAttendanceCounts != null ? (
    <CmsButton variant="secondary" size="medium" onClick={onCancel}>
      닫기
    </CmsButton>
  ) : editing ? (
    <>
      <CmsButton variant="secondary" size="medium" onClick={cancelCorrection}>
        취소
      </CmsButton>
      <CmsButton variant="primary" size="medium" onClick={saveCorrection}>
        저장
      </CmsButton>
    </>
  ) : (
    <>
      <CmsButton variant="secondary" size="medium" onClick={onCancel}>
        닫기
      </CmsButton>
      <CmsButton variant="primary" size="medium" onClick={startCorrection}>
        출석 정정
      </CmsButton>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleModalCancel}
      title="강의 출석 내역"
      footer={footer}
      className="lecture-attendance-modal"
      zIndex={zIndex}
      width={800}
      description={
        detailBase
          ? `**[${detailBase.studentName}]** 학생의 강의 출석 내역입니다.`
          : undefined
      }
    >
      {remoteDetailLoading ? (
        <div className="lecture-attendance-modal__loading">로딩 중...</div>
      ) : detailBase ? (
        <div className="lecture-attendance-modal__table-wrap">
          <table className="lecture-attendance-modal__grid">
            <colgroup>
              <col className="lecture-attendance-modal__col-label" />
              <col className="lecture-attendance-modal__col-value" />
              <col className="lecture-attendance-modal__col-label" />
              <col className="lecture-attendance-modal__col-value" />
            </colgroup>
            <tbody>
              <tr>
                <th scope="row">학생명</th>
                <td>{detailBase.studentName}</td>
                <th scope="row">출석률</th>
                <td>
                  <AttendanceRateValue attended={attendedDisplay} held={heldDisplay} />
                </td>
              </tr>
              {summaryAttendanceCounts == null
                ? sessionPairs.map(([left, right], index) => (
                    <tr key={`session-pair-${index}`}>
                      <th scope="row">{left ? `${left.roundNumber}회차` : null}</th>
                      <td>
                        {left ? (
                          <SessionStatusCell
                            session={left}
                            editing={editing}
                            onPick={patchSessionStatus}
                          />
                        ) : null}
                      </td>
                      <th scope="row">{right ? `${right.roundNumber}회차` : null}</th>
                      <td>
                        {right ? (
                          <SessionStatusCell
                            session={right}
                            editing={editing}
                            onPick={patchSessionStatus}
                          />
                        ) : null}
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </ContentModal>
  )
}
