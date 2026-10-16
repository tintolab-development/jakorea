/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyDevProgramRegistrationAutofill } from './apply-dev-program-registration-autofill'
import {
  listDevAutofillRecruitOverlayTargets,
} from './dev-autofill-recruit-overlay'
import {
  getUjatProgramRegistrationOverlayRecord,
  resetUjatProgramRegistrationOverlayStoreForTests,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import {
  peekUjatRecruitInstitutionOverlayRecord,
  resetUjatRecruitInstitutionOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import {
  peekUjatRecruitVolunteerOverlayRecord,
  resetUjatRecruitVolunteerOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
import {
  peekGeneralRecruitOverlayRecord,
  resetGeneralRecruitOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS as IK } from '@/features/program/ujat/lib/ujat-recruit-overlay-keys'
import { UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS as VK } from '@/features/program/ujat/lib/ujat-recruit-overlay-keys'

vi.mock('@/features/sponsor/api/admin-sponsors-service', () => ({
  shouldUseSponsorsRemoteApi: () => false,
  getSponsorOptionsList: vi.fn(),
  getSponsorContacts: vi.fn(),
}))

afterEach(() => {
  resetUjatProgramRegistrationOverlayStoreForTests()
  resetUjatRecruitInstitutionOverlayStoreForTests()
  resetUjatRecruitVolunteerOverlayStoreForTests()
  resetGeneralRecruitOverlayStoreForTests()
})

describe('UJAT DEV 자동입력 — 단계별 필드', () => {
  it('공통 정보의 기간 앵커·반기 일정·정원·임금까지 채운다', async () => {
    await applyDevProgramRegistrationAutofill('ujat')

    const overlay = getUjatProgramRegistrationOverlayRecord()
    const operationRange = overlay['ujat.basicInfo.operationRangeSeal'] as {
      start?: string
      end?: string
    }

    expect(operationRange.start).toBeTruthy()
    expect(operationRange.end).toBeTruthy()
    expect(overlay['ujat.basicInfo.operationAnchorIso']).toBe(operationRange.start)
    expect(overlay['ujat.h1.event.range']).toBeTruthy()
    expect(overlay['ujat.h2.event.range']).toBeTruthy()
    expect(overlay['ujat.capacity.byRegion']).toBeTruthy()
    expect(overlay['ujat.wage.paymentItemValues']).toBeTruthy()
    expect(overlay['ujat.basicInfo.participant.individual']).toBe(false)
    expect(overlay['ujat.basicInfo.participant.teacher']).toBe(false)
  })

  it('기관·상반기·하반기 모집의 지원 방법·추가 내용·첨부 상태를 각 scope에 채운다', async () => {
    await applyDevProgramRegistrationAutofill('ujat')

    const targets = listDevAutofillRecruitOverlayTargets('ujat')
    expect(targets.ujatInstitution.length).toBeGreaterThan(0)
    expect(targets.ujatVolunteer.length).toBeGreaterThan(0)

    for (const code of targets.ujatInstitution) {
      const overlay = peekUjatRecruitInstitutionOverlayRecord(code)
      expect(overlay[IK.applicationMethod]).toBeTruthy()
      expect(overlay[IK.additionalContentHtml]).toContain('참여를 희망하는 학교')
      expect(overlay[IK.attachmentFileNames]).toEqual([])

      const detail = peekGeneralRecruitOverlayRecord(code)
      expect(detail['ujatRecruit.detailInfo.programDescription']).toBeTruthy()
      expect(detail['ujatRecruit.detailInfo.recruitmentGuide']).toBeTruthy()
      expect(detail['ujatRecruit.detailInfo.applicationMethod']).toBeTruthy()
      expect(detail['ujatRecruit.detailInfo.additionalContentHtml']).toBeTruthy()
    }

    for (const code of targets.ujatVolunteer) {
      const overlay = peekUjatRecruitVolunteerOverlayRecord(code)
      expect(overlay['ujat.recruit.volunteer.h1.additionalContentHtml']).toBeTruthy()
      expect(overlay['ujat.recruit.volunteer.h2.additionalContentHtml']).toBeTruthy()
      expect(overlay['ujat.recruit.volunteer.h1.attachmentFileNames']).toEqual([])
      expect(overlay['ujat.recruit.volunteer.h2.attachmentFileNames']).toEqual([])
      expect(overlay[VK.activityTermH1]).toBeTruthy()
      expect(overlay[VK.activityTermH2]).toBeTruthy()

      const detail = peekGeneralRecruitOverlayRecord(code)
      expect(detail['recruitVolunteer.h1.detailInfo.additionalContentHtml']).toBeTruthy()
      expect(detail['recruitVolunteer.h2.detailInfo.additionalContentHtml']).toBeTruthy()
    }
  })
})
