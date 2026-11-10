import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  buildParticipantSavedPatch,
  buildParticipantTeamRolePatch,
  mergeParticipantView,
  PARTICIPANT_DETAIL_PII_KEYS,
} from './participant-save-patch'

const maskedBase = {
  id: 'p-1',
  applicantName: '이개인',
  detail: {
    gender: '**',
    birthDate: '2008-**-**',
    contact: '010-****-5678',
    email: 'ind***@example.test',
    homeAddressFull: '서울특별시 종로구 *****',
    id1365: 'vol***99',
    affiliationSchool: '**중학교',
    teamName: '이전팀',
  },
} as unknown as ParticipatingIndividualParticipantRow

/** 저장 응답: 원문 오버레이가 섞인 화면 행을 기준으로 병합된 결과 */
const savedWithRaw = {
  id: 'p-1',
  applicantName: '이개인',
  adminComment: '메모',
  textbookId: '55',
  textbookName: '성공하는 경제생활',
  textbookKits: 1,
  textbookQuantity: 2,
  textbookStatus: 'pending',
  detail: {
    gender: 'FEMALE',
    birthDate: '2008-03-01',
    contact: '010-1234-5678',
    email: 'ind.unmask@example.test',
    homeAddressFull: '서울특별시 종로구 사직로 1 101호',
    id1365: 'volunteer99',
    affiliationSchool: '○○중학교',
    teamName: '새팀',
    teamMemberCount: 3,
  },
} as unknown as GeneralIndividualApplicantRow

const isRaw = (v: unknown) => typeof v === 'string' && v.length > 0 && !v.includes('*')

describe('참여자 상세 저장 후 로컬 상태 (Step 5 잔여 위험)', () => {
  it('저장 성공 후 detail 상태에 원문 개인정보가 없다', () => {
    const patch = buildParticipantSavedPatch({}, savedWithRaw)
    for (const key of PARTICIPANT_DETAIL_PII_KEYS) {
      expect(patch.detail).not.toHaveProperty(key)
    }
    expect(patch.detail).toMatchObject({ teamName: '새팀', teamMemberCount: 3 })
  })

  it('화면 행(목록 마스킹 값 + 저장 패치)은 마스킹 값을 유지하고 저장된 비개인정보만 바뀐다', () => {
    const patch = buildParticipantSavedPatch({}, savedWithRaw)
    // 저장 직후 원문 오버레이는 onRemask로 비워진 상태(null)
    const row = { ...maskedBase, ...patch, detail: { ...maskedBase.detail, ...patch.detail } }
    expect(row.detail?.contact).toBe('010-****-5678')
    expect(row.detail?.email).toBe('ind***@example.test')
    for (const key of PARTICIPANT_DETAIL_PII_KEYS) {
      expect(isRaw(row.detail?.[key])).toBe(false)
    }
    expect(row).toMatchObject({ textbookId: '55', adminComment: '메모' })
    expect(row.detail?.teamName).toBe('새팀')
  })

  it('이전 로컬 패치의 비개인정보는 보존하고, 마스킹 재조회가 늦거나 실패해도 원문 값이 생기지 않는다', () => {
    const prev = { detail: { teamRole: 'leader' as const } }
    const patch = buildParticipantSavedPatch(prev, savedWithRaw)
    expect(patch.detail?.teamRole).toBe('leader')
    // 재조회 결과가 없어도(지연·실패) 패치 자체에 원문이 없으므로 화면은 마스킹 값만 갖는다
    expect(JSON.stringify(patch)).not.toContain('010-1234-5678')
    expect(JSON.stringify(patch)).not.toContain('ind.unmask@example.test')
  })

  it('참여자 목록 캐시는 저장 후 원문으로 갱신되지 않는다(다른 참여자 데이터 유지)', () => {
    const client = new QueryClient()
    const listKey = generalProgramProgressQueryKeys.participants('186565')
    const listRows = [maskedBase, { ...maskedBase, id: 'p-2' }]
    client.setQueryData(listKey, listRows)
    buildParticipantSavedPatch({}, savedWithRaw)
    const after = client.getQueryData<ParticipatingIndividualParticipantRow[]>(listKey)
    expect(after).toBe(listRows)
    expect(JSON.stringify(after)).not.toContain('010-1234-5678')
  })
})

describe('참여자 화면 행 병합·팀 역할 저장 (Step 5 P2)', () => {
  const rawOverlay = {
    detail: { contact: '010-1234-5678', email: 'ind.unmask@example.test', homeAddressFull: '서울 종로구 사직로 1' },
  } as Partial<ParticipatingIndividualParticipantRow>

  it('저장 패치 후에도 목록의 마스킹 연락처가 화면 행에 남는다(빈 값으로 사라지지 않음)', () => {
    const patch = buildParticipantSavedPatch({}, savedWithRaw)
    const row = mergeParticipantView(maskedBase, patch, null)
    expect(row.detail?.contact).toBe('010-****-5678')
    expect(row.detail?.email).toBe('ind***@example.test')
    expect(row.detail?.teamName).toBe('새팀')
  })

  it('원문 오버레이가 있을 때 저장한 팀 역할 패치에도 원문이 들어가지 않는다', () => {
    const prev: Partial<ParticipatingIndividualParticipantRow> = {}
    const patch = buildParticipantTeamRolePatch(prev, { teamRole: 'leader', teamName: '새팀', teamMemberCount: 3 })
    expect(Object.keys(patch.detail ?? {}).sort()).toEqual(['teamMemberCount', 'teamName', 'teamRole'])
    expect(JSON.stringify(patch)).not.toContain('010-1234-5678')
    // 열람 중 화면은 오버레이 원문, 오버레이 해제 후에는 마스킹 값
    expect(mergeParticipantView(maskedBase, patch, rawOverlay).detail?.contact).toBe('010-1234-5678')
    expect(mergeParticipantView(maskedBase, patch, null).detail?.contact).toBe('010-****-5678')
    expect(mergeParticipantView(maskedBase, patch, null).detail?.teamRole).toBe('leader')
  })
})
