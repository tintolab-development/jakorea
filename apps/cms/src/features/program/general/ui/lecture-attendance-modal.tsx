/**
 * 강의 출석 내역 모달
 * 명세: docs/design/lecture-attendance-modal-spec.md
 * 공통 ContentModal + DetailInfoForm 격자(이중 보더 방지)
 */

import { useMemo, useState, useEffect, useCallback } from 'react'

import { DetailInfoForm } from '@/shared/components/detail-info-form'
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
  /** 풀페이지 모달 위 중첩 시 (기본 Ant Modal z-index) */
  zIndex?: number
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
    <CmsRadioGroup
      className="lecture-attendance-modal__session-radios"
      size="medium"
      value={session.status}
      onChange={e => onPick(session.roundNumber, e.target.value as 'attended' | 'absent')}
    >
      <CmsRadio value="attended" size="medium">
        출석
      </CmsRadio>
      <CmsRadio value="absent" size="medium">
        결석
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

function SessionRoundField({
  session,
  editing,
  onPick,
}: {
  session: LectureAttendanceSession
  editing: boolean
  onPick: (roundNumber: number, status: 'attended' | 'absent') => void
}) {
  const statusView = (
    <SessionStatusCell session={session} editing={false} onPick={onPick} />
  )
  const canEditRound = editing && session.status !== 'not_held'

  return (
    <DetailInfoForm.Field
      label={`${session.roundNumber}회차`}
      view={statusView}
      edit={
        canEditRound ? (
          <SessionStatusCell session={session} editing onPick={onPick} />
        ) : undefined
      }
      readOnlyDisplay={!canEditRound}
    />
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

  const sessionRowPairs = useMemo(() => {
    const pairs: [LectureAttendanceSession, LectureAttendanceSession | undefined][] = []
    for (let i = 0; i < tableSessions.length; i += 2) {
      pairs.push([tableSessions[i]!, tableSessions[i + 1]])
    }
    return pairs
  }, [tableSessions])

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="강의 출석 내역"
      footer={footer}
      className="lecture-attendance-modal"
      zIndex={zIndex}
      description={
        detailBase
          ? `**[${detailBase.studentName}]** 학생의 강의 출석 내역입니다.`
          : undefined
      }
    >
      {detailBase ? (
        <DetailInfoForm
          title="강의 출석 내역"
          hideHeader
          mode={editing ? 'edit' : 'view'}
          className="lecture-attendance-modal__detail-form"
        >
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field label="학생명" view={detailBase.studentName} readOnlyDisplay />
            <DetailInfoForm.Field
              label="출석률"
              view={<AttendanceRateValue attended={attendedDisplay} held={heldDisplay} />}
              readOnlyDisplay
            />
          </DetailInfoForm.Row>
          {sessionRowPairs.map(([s1, s2]) => (
            <DetailInfoForm.Row key={`${s1.roundNumber}-${s2?.roundNumber ?? 'solo'}`} type="double">
              <SessionRoundField session={s1} editing={editing} onPick={patchSessionStatus} />
              {s2 ? (
                <SessionRoundField session={s2} editing={editing} onPick={patchSessionStatus} />
              ) : (
                <div className="lecture-attendance-modal__session-spacer" aria-hidden />
              )}
            </DetailInfoForm.Row>
          ))}
        </DetailInfoForm>
      ) : null}
    </ContentModal>
  )
}
