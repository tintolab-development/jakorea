import { beforeEach, describe, expect, it, vi } from 'vitest'

const sponsor = vi.fn(async () => ({ id: '7' }))
const contacts = vi.fn(async () => [])

vi.mock('@/features/data-management/api/data-management-subset-api', () => ({
  getDataManagementSubsetApi: () => ({ sponsor, contacts }),
}))

import {
  fetchSponsorContactsRemote,
  fetchSponsorRemote,
} from '@/features/sponsor/api/sponsors-api-client'

describe('후원사 상세·담당자 contactPrivacy (정책 CMS-17·32·37)', () => {
  beforeEach(() => {
    sponsor.mockClear()
    contacts.mockClear()
  })

  it('기본(데이터 관리)은 파라미터 없이 호출해 원문 + 자동 기록 계약을 유지한다', async () => {
    await fetchSponsorRemote('7')
    await fetchSponsorContactsRemote('7')
    expect(sponsor).toHaveBeenCalledWith(7, undefined)
    expect(contacts).toHaveBeenCalledWith(7, undefined)
  })

  it('프로그램 공통 정보·등록 양식은 contactPrivacy=MASKED를 붙인다(필터와 함께)', async () => {
    await fetchSponsorRemote('7', 'MASKED')
    await fetchSponsorContactsRemote('7', { name: '담당' } as never, 'MASKED')
    await fetchSponsorContactsRemote('7', undefined, 'MASKED')
    expect(sponsor).toHaveBeenCalledWith(7, { contactPrivacy: 'MASKED' })
    expect(contacts).toHaveBeenNthCalledWith(1, 7, { name: '담당', contactPrivacy: 'MASKED' })
    expect(contacts).toHaveBeenNthCalledWith(2, 7, { contactPrivacy: 'MASKED' })
  })
})
