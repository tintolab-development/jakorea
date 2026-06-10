/**
 * 프로그램 진행현황 탭 — 참여 봉사자 목록 상태
 */

import { useCallback, useState } from 'react'
import {
  MOCK_PARTICIPATING_VOLUNTEERS,
  type ParticipatingVolunteerRow,
} from '@/data/mock/participating-volunteers'
import { buildParticipatingVolunteerRowFromMember } from '../lib/participating-volunteer-member-candidates'

export function useProgressVolunteerList() {
  const [volunteerList, setVolunteerList] = useState<ParticipatingVolunteerRow[]>(() => [
    ...MOCK_PARTICIPATING_VOLUNTEERS,
  ])

  const addVolunteerFromMember = useCallback(async (memberId: string) => {
    const nextNo = volunteerList.reduce((max, row) => Math.max(max, row.no), 0) + 1
    const nextId = `participating-volunteer-added-${memberId}`
    const row = await buildParticipatingVolunteerRowFromMember(memberId, nextNo, nextId)
    if (row) {
      setVolunteerList(prev => [...prev, row])
    }
    return row
  }, [volunteerList])

  return {
    volunteerList,
    addVolunteerFromMember,
  }
}
