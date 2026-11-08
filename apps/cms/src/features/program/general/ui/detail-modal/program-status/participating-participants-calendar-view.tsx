/**
 * 참여자(개인) 캘린더 뷰 (풀페이지 모달 > 프로그램 진행 현황 > 참여자)
 * 표시 로직은 개인형 공통 {@link IndividualPersonCalendarView} (참여 봉사자 개인형과 동일)
 */

import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import {
  IndividualPersonCalendarView,
  type IndividualPersonCalendarAccessors,
} from './individual-person-calendar-view'

const PARTICIPANT_CALENDAR_ACCESSORS: IndividualPersonCalendarAccessors<ParticipatingIndividualParticipantRow> =
  {
    getId: participant => participant.id,
    getName: participant => participant.applicantName?.trim() || '참여자',
    getSessions: participant => participant.sessions,
    getMetaLabels: participant => [
      participant.affiliation?.trim() || '-',
      participant.educationGrade?.trim() || '-',
    ],
  }

export interface ParticipatingParticipantsCalendarViewProps {
  participants: ParticipatingIndividualParticipantRow[]
  selectedRowKeys: string[]
  onSelectionChange: (keys: string[]) => void
  onParticipantClick: (participant: ParticipatingIndividualParticipantRow) => void
  calendarGranularity?: 'month' | 'week'
  onCalendarGranularityChange?: (mode: 'month' | 'week') => void
}

export function ParticipatingParticipantsCalendarView({
  participants,
  selectedRowKeys,
  onSelectionChange,
  onParticipantClick,
  calendarGranularity,
  onCalendarGranularityChange,
}: ParticipatingParticipantsCalendarViewProps) {
  return (
    <IndividualPersonCalendarView
      people={participants}
      accessors={PARTICIPANT_CALENDAR_ACCESSORS}
      selectedRowKeys={selectedRowKeys}
      onSelectionChange={onSelectionChange}
      onPersonClick={onParticipantClick}
      calendarGranularity={calendarGranularity}
      onCalendarGranularityChange={onCalendarGranularityChange}
    />
  )
}
