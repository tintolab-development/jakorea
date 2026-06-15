/**
 * 강의 출석 내역 모달
 * 명세: docs/design/lecture-attendance-modal-spec.md
 */

import { useMemo, useState, useEffect, useCallback } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
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
      <span className="lecture-attendance-modal__rate-note">(강의 진행 회차 기준)</span>
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
}

interface AttendanceTableRow {
  key: string
  studentName: string
  sessions: LectureAttendanceSession[]
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
  const { attended: attendedDisplay, held: heldDisplay } =
    countLectureAttendanceHeldAndAttended(rateSource)

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

  const tableRow: AttendanceTableRow | null = detailBase
    ? {
        key: 'student',
        studentName: detailBase.studentName,
        sessions: tableSessions,
      }
    : null

  const columns: ColumnsType<AttendanceTableRow> = useMemo(() => {
    const roundCount = tableSessions.length
    const roundColumns: ColumnsType<AttendanceTableRow> = Array.from(
      { length: roundCount },
      (_, index) => {
        const roundNumber = index + 1
        return {
          title: `${roundNumber}회차`,
          key: `round-${roundNumber}`,
          width: editing ? 200 : 100,
          align: 'center' as const,
          onHeaderCell: () => ({
            className: 'lecture-attendance-modal__round-header-cell',
          }),
          onCell: () => ({
            className: 'lecture-attendance-modal__round-body-cell',
          }),
          render: (_value, record) => {
            const session = record.sessions.find(s => s.roundNumber === roundNumber)
            if (!session) return '-'
            return (
              <SessionStatusCell
                session={session}
                editing={editing}
                onPick={patchSessionStatus}
              />
            )
          },
        }
      }
    )

    return [
      {
        title: '학생명',
        dataIndex: 'studentName',
        key: 'studentName',
        width: 100,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ className: 'lecture-attendance-modal__fixed-header-cell' }),
        onCell: () => ({ className: 'lecture-attendance-modal__fixed-body-cell' }),
      },
      {
        title: '출석률',
        key: 'attendanceRate',
        width: 168,
        align: 'center',
        onHeaderCell: () => ({ className: 'lecture-attendance-modal__fixed-header-cell' }),
        onCell: () => ({ className: 'lecture-attendance-modal__fixed-body-cell' }),
        render: () => <AttendanceRateValue attended={attendedDisplay} held={heldDisplay} />,
      },
      {
        title: '강의 회차별 출석 내역',
        key: 'rounds',
        children: roundColumns,
      },
    ]
  }, [tableSessions.length, editing, attendedDisplay, heldDisplay, patchSessionStatus])

  return (
    <ContentModal
      open={open}
      onCancel={handleModalCancel}
      title="강의 출석 내역"
      footer={footer}
      className="lecture-attendance-modal"
      zIndex={zIndex}
      width={Math.min(960, 320 + tableSessions.length * (editing ? 200 : 100))}
      description={
        detailBase
          ? `**[${detailBase.studentName}]** 학생의 강의 출석 내역입니다.`
          : undefined
      }
    >
      {tableRow ? (
        <div className="lecture-attendance-modal__table-wrap">
          <Table<AttendanceTableRow>
            className="lecture-attendance-modal__table cms-data-table"
            rowKey="key"
            size="middle"
            pagination={false}
            scroll={{ x: 'max-content' }}
            columns={columns}
            dataSource={[tableRow]}
          />
        </div>
      ) : null}
    </ContentModal>
  )
}
