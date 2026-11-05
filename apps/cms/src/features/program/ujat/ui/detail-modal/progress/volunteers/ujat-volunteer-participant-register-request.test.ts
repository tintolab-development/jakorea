import { describe, expect, it } from 'vitest'
import { VolunteerParticipantRegisterRequestJaProgramExperienceConsentRequest } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestJaProgramExperienceConsentRequest'
import { VolunteerParticipantRegisterRequestPersonalInfoConsent } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestPersonalInfoConsent'
import { VolunteerParticipantRegisterRequestRegistrationChannel } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestRegistrationChannel'
import { VolunteerParticipantRegisterRequestThirdPartyConsent } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestThirdPartyConsent'
import { VolunteerParticipantRegisterRequestVolunteerKind } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestVolunteerKind'
import type { VolunteerParticipantRegisterRequest } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequest'
import {
  attachUjatProgressVolunteerRegisterContext,
  isUjatProgressVolunteerMissingId1365,
} from './ujat-volunteer-participant-register-request'

const baseRequest: VolunteerParticipantRegisterRequest = {
  memberId: 12,
  volunteerKind: VolunteerParticipantRegisterRequestVolunteerKind.GENERAL,
  registrationChannel: VolunteerParticipantRegisterRequestRegistrationChannel.CMS_PROGRESS_ADD,
  personalInfoConsent: VolunteerParticipantRegisterRequestPersonalInfoConsent.AGREE,
  thirdPartyConsent: VolunteerParticipantRegisterRequestThirdPartyConsent.AGREE,
  jaProgramExperienceConsentRequest:
    VolunteerParticipantRegisterRequestJaProgramExperienceConsentRequest.NOT_REQUESTED,
  reason: 'CMS 참여 봉사자 추가 등록',
  thirdPartyRecipient: '서울○○중학교',
}

describe('attachUjatProgressVolunteerRegisterContext', () => {
  it('하반기 탭이면 SECOND_HALF와 UJAT 등록 사유를 붙인다', () => {
    const request = attachUjatProgressVolunteerRegisterContext(baseRequest, 'h2')
    expect(request.recruitHalf).toBe('SECOND_HALF')
    expect(request.reason).toBe('CMS UJAT 참여 봉사자 추가 등록')
    expect(request.memberId).toBe(12)
    expect(request.thirdPartyRecipient).toBe('서울○○중학교')
  })

  it('상반기 탭이면 FIRST_HALF를 붙인다', () => {
    const request = attachUjatProgressVolunteerRegisterContext(baseRequest, 'h1')
    expect(request.recruitHalf).toBe('FIRST_HALF')
  })

  it('CMS_PROGRESS_ADD에서 사용자 홈 전용 필드와 빈 문자열을 빼 둔다', () => {
    const request = attachUjatProgressVolunteerRegisterContext(
      {
        ...baseRequest,
        previousUjatTerm: { year: '2024', term: '2' },
        educationRegionCode: 'CUSTOM_1793704314696',
        applicationType: 'UJAT_GRADUATE',
        id1365: '09151234',
        thirdPartyRecipient: '-',
      },
      'h2'
    )
    expect(request).not.toHaveProperty('previousUjatTerm')
    expect(request.educationRegionCode).toBe('CUSTOM_1793704314696')
    expect(request).not.toHaveProperty('applicationType')
    expect(request).not.toHaveProperty('id1365')
    expect(request).not.toHaveProperty('thirdPartyRecipient')
    expect(request.volunteerKind).toBe('GENERAL')
    expect(request.recruitHalf).toBe('SECOND_HALF')
  })

  it('educationRegionCode가 비면 서울로 채우지 않고 omit 한다', () => {
    const request = attachUjatProgressVolunteerRegisterContext(
      { ...baseRequest, educationRegionCode: '   ' },
      'h1'
    )
    expect(request).not.toHaveProperty('educationRegionCode')
  })

  it('오버라이드 educationRegionCode는 마스터 code를 그대로 쓴다', () => {
    const request = attachUjatProgressVolunteerRegisterContext(
      baseRequest,
      'h1',
      'CUSTOM_1793704314696'
    )
    expect(request.educationRegionCode).toBe('CUSTOM_1793704314696')
  })
})

describe('isUjatProgressVolunteerMissingId1365', () => {
  it('후보에 1365가 없을 때만 true', () => {
    expect(isUjatProgressVolunteerMissingId1365(false)).toBe(true)
    expect(isUjatProgressVolunteerMissingId1365(true)).toBe(false)
    expect(isUjatProgressVolunteerMissingId1365(undefined)).toBe(false)
  })
})
