/**
 * UJAT 교육 진행 · 봉사자 상세 — 정산 현황 탭
 *
 * 봉사자 정산은 일정별 영수증 정산(개인 일정별 정산 심사 API, applicationType=VOLUNTEER)이다.
 * 이 화면은 봉사 신청 id(program_volunteer_application.id)만 갖고 있어 봉사 신청 id로 거른다.
 * 배정 일정은 「교육 배정 및 진행 현황」 탭이 따로 보여 주므로 여기서는 정산 신청 건만 그린다.
 */

import { useMemo } from 'react'
import type { Program } from '@/types/domain'
import type { VolunteerReceiptSettlementTarget } from '@/features/program/general/api/volunteer-settlement-review-remote'
import { VolunteerReceiptSettlementPanel } from '@/features/program/general/ui/detail-modal/program-status/volunteer-receipt-settlement-panel'
import { parseVolunteerApplicationNumericId } from '@/features/program/ujat/lib/volunteer-application-id'

export function UjatEducationProgressVolunteerSettlementTab({
  program,
  volunteerId,
}: {
  program: Program
  /** 봉사 신청 id. mock `h1-vol-*` 이면 조회하지 않는다 */
  volunteerId: string
}) {
  const target = useMemo((): VolunteerReceiptSettlementTarget => {
    const numericId = parseVolunteerApplicationNumericId(volunteerId)
    return {
      kind: 'volunteerApplication',
      volunteerApplicationId: numericId != null ? String(numericId) : '',
    }
  }, [volunteerId])

  return (
    <VolunteerReceiptSettlementPanel
      program={program}
      target={target}
      showProgress={false}
      unavailableNoticeKey="ujat-education-progress-volunteer-settlement"
    />
  )
}
