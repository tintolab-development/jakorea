/**
 * 참여자(개인) 캘린더 — split-card 우측 (선택일 교육 일정 목록)
 */

import { useCallback, useMemo } from 'react'
import { EmptyState } from '@/shared/ui'
import type { ParticipatingIndividualParticipantCalendarEvent } from '@/features/program/general/lib/build-participating-individual-participant-calendar-events'
import { formatInstitutionCalendarSessionTimeDisplay } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-calendar-session'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'
import { SCHEDULE_COLORS } from '@/features/program/shared/ui/program-schedule-colors'
import type { ParticipatingIndividualParticipantRow } from '@/data/mock/participating-individual-participants'
import {
  ParticipatingParticipantCalendarListItem,
  type ParticipatingParticipantCalendarListRow,
} from './participating-participant-calendar-list-item'

export type ParticipatingParticipantsCalendarRightProps = {
  events: readonly ParticipatingIndividualParticipantCalendarEvent[]
  getColorForParticipant: (participantName: string) => ScheduleColorPair
  selectedParticipantIds: string[]
  onParticipantSelectionChange: (ids: string[]) => void
  onParticipantClick: (participant: ParticipatingIndividualParticipantRow) => void
}

function toListRow(
  event: ParticipatingIndividualParticipantCalendarEvent
): ParticipatingParticipantCalendarListRow {
  const { participant, session } = event.originalItem
  return {
    id: event.id,
    participantId: participant.id,
    participantName: participant.applicantName?.trim() || '참여자',
    affiliationLabel: participant.affiliation?.trim() || '-',
    gradeLabel: participant.educationGrade?.trim() || '-',
    sessionLabel: formatInstitutionCalendarSessionTimeDisplay(session),
  }
}

export function ParticipatingParticipantsCalendarRight({
  events,
  getColorForParticipant,
  selectedParticipantIds,
  onParticipantSelectionChange,
  onParticipantClick,
}: ParticipatingParticipantsCalendarRightProps) {
  const selectedSet = useMemo(() => new Set(selectedParticipantIds), [selectedParticipantIds])

  const listRows = useMemo(() => {
    return [...events]
      .sort((a, b) =>
        (a.originalItem.participant.applicantName || '').localeCompare(
          b.originalItem.participant.applicantName || '',
          'ko'
        )
      )
      .map(toListRow)
  }, [events])

  const handleToggle = useCallback(
    (participantId: string, checked: boolean) => {
      if (checked) {
        if (selectedSet.has(participantId)) return
        onParticipantSelectionChange([...selectedParticipantIds, participantId])
      } else {
        onParticipantSelectionChange(selectedParticipantIds.filter(id => id !== participantId))
      }
    },
    [onParticipantSelectionChange, selectedParticipantIds, selectedSet]
  )

  const isEmpty = listRows.length === 0

  return (
    <div
      className={
        isEmpty
          ? 'calendar-list participating-participants-calendar-right calendar-list--empty'
          : 'calendar-list participating-participants-calendar-right'
      }
    >
      {isEmpty ? (
        <EmptyState description="해당 날짜에 일정이 없습니다" />
      ) : (
        listRows.map(row => {
          const event = events.find(ev => ev.id === row.id)
          const colors =
            getColorForParticipant(row.participantName) ?? SCHEDULE_COLORS[0]
          const checked = selectedSet.has(row.participantId)

          return (
            <div
              key={row.id}
              role="button"
              tabIndex={0}
              className={[
                'calendar-list-item',
                checked ? 'calendar-list-item--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-has-color="true"
              style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
              }}
              onClick={() => {
                if (event) onParticipantClick(event.originalItem.participant)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (event) onParticipantClick(event.originalItem.participant)
                }
              }}
            >
              <div className="calendar-list-item__column">
                <ParticipatingParticipantCalendarListItem
                  row={row}
                  checked={checked}
                  onToggle={handleToggle}
                />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
