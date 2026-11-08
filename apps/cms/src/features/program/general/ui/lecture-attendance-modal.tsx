/**
 * 강의 출석 내역 모달
 * 스크린샷: ContentModal 800 · 패딩 26/30/34 · 설명↔표↔푸터 30px
 * 본문: 학생명·출석률은 DetailInfoForm, 회차는 2개씩 한 행
 */

import { useMemo, useState, useEffect, useCallback } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
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
} from '../lib/school-detail'
import { countLectureAttendanceHeldAndAttended } from '../lib/lecture-attendance-count'
import {
  formatLectureAttendanceSessionLabel,
  lectureAttendanceSessionKey,
} from '../lib/lecture-attendance-session-identity'
import { ProgramAttendanceStatusText } from '@/features/program/shared/ui/program-attendance-status-text'
import type { ProgramAttendanceStatusTextKind } from '@/features/program/shared/lib/attendance-status-presentation'
import './lecture-attendance-modal.css'

const LECTURE_ATTENDANCE_TEXT_KIND: Record<
  LectureAttendanceStatusKey,
  ProgramAttendanceStatusTextKind
> = {
  attended: 'present',
  late: 'late',
  absent: 'absent',
  not_held: 'not_held',
}

type EditableAttendanceStatus = Extract<LectureAttendanceStatusKey, 'attended' | 'absent' | 'late'>

function SessionStatusCell({
  session,
  editing,
  onPick,
}: {
  session: LectureAttendanceSession
  editing: boolean
  onPick: (sessionKey: string, status: EditableAttendanceStatus) => void
}) {
  if (session.status === 'not_held' && !(editing && session.recordingOpen)) {
    return (
      <span className="lecture-attendance-modal__not-held" aria-disabled>
        <ProgramAttendanceStatusText
          kind="not_held"
          label={LECTURE_ATTENDANCE_STATUS_LABELS.not_held}
        />
      </span>
    )
  }

  if (!editing) {
    return (
      <ProgramAttendanceStatusText
        kind={LECTURE_ATTENDANCE_TEXT_KIND[session.status]}
        label={LECTURE_ATTENDANCE_STATUS_LABELS[session.status]}
      />
    )
  }

  return (
    <CmsRadioGroup
      className="lecture-attendance-modal__session-radios"
      size="medium"
      value={session.status === 'not_held' ? undefined : session.status}
      onChange={e =>
        onPick(lectureAttendanceSessionKey(session), e.target.value as EditableAttendanceStatus)
      }
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
    (savedSessions && savedSessions.length > 0 ? savedSessions : (detailBase?.sessions ?? []))
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

  const patchSessionStatus = useCallback((sessionKey: string, status: EditableAttendanceStatus) => {
    setSessionDraft(prev =>
      prev.map(s => (lectureAttendanceSessionKey(s) === sessionKey ? { ...s, status } : s))
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

  const handleModalCancel = useCallback(() => {
    if (editing) {
      cancelCorrection()
      return
    }
    onCancel()
  }, [editing, cancelCorrection, onCancel])

  const footer =
    summaryAttendanceCounts != null ? (
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
        detailBase ? `**[${detailBase.studentName}]** 학생의 강의 출석 내역입니다.` : undefined
      }
    >
      {remoteDetailLoading ? (
        <div className="lecture-attendance-modal__loading">로딩 중...</div>
      ) : detailBase ? (
        <DetailInfoForm title="강의 출석 내역" hideHeader mode="view">
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field label="학생명" view={detailBase.studentName} />
            <DetailInfoForm.Field
              label="출석률"
              view={<AttendanceRateValue attended={attendedDisplay} held={heldDisplay} />}
            />
          </DetailInfoForm.Row>
          {summaryAttendanceCounts == null
            ? sessionPairs.map(([left, right], index) => (
                <DetailInfoForm.Row type="double" key={`session-pair-${index}`}>
                  <DetailInfoForm.Field
                    label={left ? formatLectureAttendanceSessionLabel(left) : '\u00a0'}
                    view={
                      left ? (
                        <SessionStatusCell
                          session={left}
                          editing={editing}
                          onPick={patchSessionStatus}
                        />
                      ) : null
                    }
                  />
                  <DetailInfoForm.Field
                    label={right ? formatLectureAttendanceSessionLabel(right) : '\u00a0'}
                    view={
                      right ? (
                        <SessionStatusCell
                          session={right}
                          editing={editing}
                          onPick={patchSessionStatus}
                        />
                      ) : null
                    }
                  />
                </DetailInfoForm.Row>
              ))
            : null}
        </DetailInfoForm>
      ) : null}
    </ContentModal>
  )
}
