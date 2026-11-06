import { afterEach, describe, expect, it } from 'vitest'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS } from '@/features/program/ujat/lib/ujat-recruit-overlay-keys'
import {
  peekActiveUjatRecruitInstitutionOverlayRecord,
  peekActiveUjatRecruitVolunteerOverlayRecord,
  registerUjatRegistrationRecruitRhf,
} from '@/features/program/ujat/lib/ujat-registration-rhf-api'

function values(patch: Partial<ProgramDetailEditFormValues> = {}): ProgramDetailEditFormValues {
  return {
    announcementTitle: '기관 공고',
    recruitmentContactOrganizationName: '문의처',
    volunteerRecruitmentContactOrganizationName: '봉사문의',
    ...patch,
  } as ProgramDetailEditFormValues
}

afterEach(() => {
  registerUjatRegistrationRecruitRhf(null)
})

describe('ujat registration recruit RHF peek', () => {
  it('RHF가 없으면 null 이다', () => {
    expect(peekActiveUjatRecruitInstitutionOverlayRecord()).toBeNull()
    expect(peekActiveUjatRecruitVolunteerOverlayRecord()).toBeNull()
  })

  it('기관·봉사자 반기 overlay를 RHF 값에서 만든다', () => {
    registerUjatRegistrationRecruitRhf({
      getInstitution: () => values({ announcementTitle: 'RHF 기관 공고' }),
      getVolunteerH1: () => values({ announcementTitle: 'H1 공고' }),
      getVolunteerH2: () => values({ announcementTitle: 'H2 공고' }),
    })
    expect(peekActiveUjatRecruitInstitutionOverlayRecord()).toMatchObject({
      [UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS.publicTitle]: 'RHF 기관 공고',
    })
    const volunteer = peekActiveUjatRecruitVolunteerOverlayRecord()
    expect(volunteer).toMatchObject({
      'ujat.recruit.volunteer.h1.publicTitle': 'H1 공고',
      'ujat.recruit.volunteer.h2.publicTitle': 'H2 공고',
    })
  })
})
