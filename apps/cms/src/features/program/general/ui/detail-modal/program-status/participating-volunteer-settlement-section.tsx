/**
 * 참여 봉사자 상세 — 정산 현황 탭 (일반 프로그램)
 *
 * 봉사자 정산은 일정별 영수증 정산(개인 일정별 정산 심사 API, applicationType=VOLUNTEER)이다.
 * 행 id는 participants API `participantId`(= program_participant.id)라 BE `participantId` 필터로 고른다.
 */

import { useMemo } from 'react'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { Program } from '@/types/domain'
import type { VolunteerReceiptSettlementTarget } from '@/features/program/general/api/volunteer-settlement-review-remote'
import { VolunteerReceiptSettlementPanel } from './volunteer-receipt-settlement-panel'

export interface ParticipatingVolunteerSettlementSectionProps {
  volunteer: ParticipatingVolunteerRow
  program: Program
}

export function ParticipatingVolunteerSettlementSection({
  volunteer,
  program,
}: ParticipatingVolunteerSettlementSectionProps) {
  const target = useMemo(
    (): VolunteerReceiptSettlementTarget => ({
      kind: 'participant',
      participantId: volunteer.id?.trim() ?? '',
    }),
    [volunteer.id]
  )

  return (
    <VolunteerReceiptSettlementPanel
      program={program}
      target={target}
      assignedSessions={volunteer.sessions}
      unavailableNoticeKey="general-participating-volunteer-settlement"
    />
  )
}
