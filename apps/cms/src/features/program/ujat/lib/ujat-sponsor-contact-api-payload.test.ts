import { describe, expect, it } from 'vitest'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import {
  stripUnselectedUjatSponsorContactsFromOverlay,
  ujatSponsorManagerContactIdsForApi,
} from './ujat-sponsor-contact-api-payload'

describe('ujat sponsor contact API payload', () => {
  it('미선택 sentinel은 API contact id 목록에서 제외한다', () => {
    expect(
      ujatSponsorManagerContactIdsForApi({
        ids: [SPONSOR_CONTACT_UNSELECTED_VALUE],
        id: SPONSOR_CONTACT_UNSELECTED_VALUE,
        managerLine: '미선택',
      })
    ).toEqual([])
  })

  it('등록 overlay snapshot에서 sentinel 키를 비운다', () => {
    const next = stripUnselectedUjatSponsorContactsFromOverlay({
      'ujat.basicInfo.sponsorContactIds': [SPONSOR_CONTACT_UNSELECTED_VALUE],
      'ujat.basicInfo.sponsorContactId': SPONSOR_CONTACT_UNSELECTED_VALUE,
      'ujat.basicInfo.sponsorManagerName': '미선택',
    })
    expect(next['ujat.basicInfo.sponsorContactIds']).toEqual([])
    expect(next['ujat.basicInfo.sponsorContactId']).toBeUndefined()
  })
})
