/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { parseGeneralProgramServiceDetailJson } from '@/features/program/general/lib/general-program-service-detail-json'
import { parseCompanySchoolServiceDetailJson } from '@/features/program/1c-1s/api/service-detail-json'
import { parseTrainedTeacherServiceDetailJson } from '@/features/program/trained-teachers/api/service-detail-json'
import { parseRegistrationOverlay as parseUjatRegistrationOverlay } from '@/features/program/ujat/api/service-detail'
import { parseRegistrationOverlayFromServiceDetailJson } from '@/features/program/shared/lib/public-program-title'

/**
 * Part4 루트 `registrationOverlay` 읽기 fallback 제거 parity — d5631638c에서 만든 스냅샷.
 * - nested(`registration.overlay`)만 있는 JSON: 결과가 그대로여야 한다.
 * - 루트가 섞인 JSON(일반·1사1교·공고명): 제거 후 루트 키가 빠지는 것이 의도된 변경
 *   (스냅샷 대신 nested 결과와 같음/빈 값으로 단정).
 * - TT·UJAT 파서는 원래 루트를 읽지 않으므로 그대로여야 한다.
 */

const NESTED = {
  'generalRegistration.basicInfo.publicProgramTitle': '중첩 공고명',
  'generalRegistration.basicInfo.surveyItems': { survey: true, satisfaction: false },
  'recruit.inquiryTel': '02-111-1111',
}
const ROOT = {
  'generalRegistration.basicInfo.publicProgramTitle': '루트 공고명',
  'generalRegistration.basicInfo.surveyItems': { survey: false, lecture_evaluation: true },
  'recruit.rootOnly': '루트에만 있는 값',
}

function generalJson(variant: 'nested' | 'both' | 'root') {
  return JSON.stringify({
    schemaVersion: 1,
    generalCommonInfo: { announcementTitle: '공고' },
    generalParticipantTypes: ['organization'],
    ...(variant !== 'root' ? { registration: { overlay: NESTED } } : {}),
    ...(variant !== 'nested' ? { registrationOverlay: ROOT } : {}),
  })
}

function companySchoolJson(variant: 'nested' | 'both' | 'root') {
  return JSON.stringify({
    schemaVersion: 1,
    program: { generalCommonInfo: { announcementTitle: '공고' } },
    ...(variant !== 'root' ? { registration: { overlay: NESTED } } : {}),
    ...(variant !== 'nested' ? { registrationOverlay: ROOT } : {}),
  })
}

function pick(program: Record<string, unknown>) {
  return {
    registrationOverlay: program.registrationOverlay,
    generalSurveyMenuKeys: program.generalSurveyMenuKeys,
  }
}

describe('루트 registrationOverlay 읽기 parity', () => {
  it('일반 parse — nested', () => {
    expect(pick(parseGeneralProgramServiceDetailJson(generalJson('nested')))).toMatchSnapshot()
  })
  it('1사1교 parse — nested', () => {
    expect(pick(parseCompanySchoolServiceDetailJson(companySchoolJson('nested')))).toMatchSnapshot()
  })
  it('공고명 overlay parse — nested', () => {
    expect(parseRegistrationOverlayFromServiceDetailJson(generalJson('nested'))).toMatchSnapshot()
  })

  // 의도된 변경: 루트는 더 이상 읽지 않는다. 루트가 섞여도 nested만 있을 때와 같고, 루트만 있으면 비어 있다.
  it('일반 parse — both는 nested와 같다 / root만 있으면 overlay 없음', () => {
    const nested = pick(parseGeneralProgramServiceDetailJson(generalJson('nested')))
    expect(pick(parseGeneralProgramServiceDetailJson(generalJson('both')))).toEqual(nested)
    expect(
      pick(parseGeneralProgramServiceDetailJson(generalJson('root'))).registrationOverlay
    ).toBeUndefined()
  })
  it('1사1교 parse — both는 nested와 같다 / root만 있으면 overlay 없음', () => {
    const nested = pick(parseCompanySchoolServiceDetailJson(companySchoolJson('nested')))
    expect(pick(parseCompanySchoolServiceDetailJson(companySchoolJson('both')))).toEqual(nested)
    expect(
      pick(parseCompanySchoolServiceDetailJson(companySchoolJson('root'))).registrationOverlay
    ).toBeUndefined()
  })
  it('공고명 overlay parse — both는 nested와 같다 / root만 있으면 빈 객체', () => {
    expect(parseRegistrationOverlayFromServiceDetailJson(generalJson('both'))).toEqual(NESTED)
    expect(parseRegistrationOverlayFromServiceDetailJson(generalJson('root'))).toEqual({})
  })

  it('TT parse — 루트 섞임(원래 루트 안 읽음)', () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      program: {},
      registration: { overlay: NESTED },
      registrationOverlay: ROOT,
    })
    expect(pick(parseTrainedTeacherServiceDetailJson(raw))).toMatchSnapshot()
  })

  it('UJAT overlay parse — 루트 섞임(원래 루트 안 읽음)', () => {
    const raw = JSON.stringify({ registration: { overlay: NESTED }, registrationOverlay: ROOT })
    expect(parseUjatRegistrationOverlay(raw)).toMatchSnapshot()
  })
})
