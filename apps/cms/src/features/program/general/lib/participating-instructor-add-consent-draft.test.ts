import { describe, expect, it } from 'vitest'
import {
  PARTICIPATING_INSTRUCTOR_THIRD_PARTY_RECIPIENT_PLACEHOLDER,
  createGeneralInstitutionParticipatingInstructorAddConsentParagraphs,
  createParticipatingInstructorAddConsentParagraphs,
} from './participating-instructor-add-consent-draft'
import {
  JA_VOLUNTEER_EXPERIENCE_OPTION_IDS,
  PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS,
  createParticipatingVolunteerAddRegistrationDraft,
} from './participating-volunteer-add-registration-draft'

function cellValues(row: { kind: string; value?: string }[] | undefined) {
  return (row ?? []).map(cell => cell.value ?? '')
}

describe('참여 강사 추가 등록 동의서 — 일반 기관형 preset (Figma 03-2)', () => {
  it('시안 문구로 수집 항목·보유기간을 채우고 동의는 미선택으로 시작한다', () => {
    const [personal, thirdParty] = createGeneralInstitutionParticipatingInstructorAddConsentParagraphs()

    expect(cellValues(personal.fieldDataRows[0])).toEqual([
      '이름, 개인 연락처, e-mail',
      'JA 프로그램 강사활동 안내 및\n진행에 필요한 정보 안내',
      '이용 기간: 해당 프로그램이 진행되는 기간\n보유 기간: 동의일로부터 3년 보관 후 파기',
    ])
    expect(cellValues(thirdParty.fieldDataRows[0])).toEqual([
      '',
      '이름, 개인 연락처, e-mail',
      'JA 프로그램 강사활동 안내 및\n진행에 필요한 정보 안내',
      '동의일로부터 3년 보관 후 파기',
    ])
    expect((thirdParty.columnFields[0] as { placeholder?: string } | undefined)?.placeholder).toBe(
      PARTICIPATING_INSTRUCTOR_THIRD_PARTY_RECIPIENT_PLACEHOLDER
    )
    expect(personal.bottomConsent).toBeUndefined()
    expect(thirdParty.bottomConsent).toBeUndefined()
  })

  it('기본 preset(다른 유형)은 기존 문구·동의 기본값을 유지한다', () => {
    const [personal, thirdParty] = createParticipatingInstructorAddConsentParagraphs()
    expect(cellValues(personal.fieldDataRows[0])[0]).toBe('이름, 연락처, 성별, 이메일, 소속(학교)')
    expect(cellValues(thirdParty.fieldDataRows[0])[0]).toBe('배정된 교육 대상 학교')
    expect(personal.bottomConsent).toBe('agree')
  })
})

describe('참여 봉사자 추가 등록 — JA 봉사 프로그램 진행 경험 여부 선택지', () => {
  function experienceLabels(preset?: 'default' | 'generalInstitution') {
    const paragraph = createParticipatingVolunteerAddRegistrationDraft(preset).paragraphs.find(
      p => p.id === PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.jaVolunteerExperience
    )
    if (paragraph?.variant !== 'multiple_choice') throw new Error('missing paragraph')
    return paragraph.items.map(item => [item.id, item.label])
  }

  it('일반 기관형은 「있음 / 없음」, id는 동일', () => {
    expect(experienceLabels('generalInstitution')).toEqual([
      [JA_VOLUNTEER_EXPERIENCE_OPTION_IDS.yes, '있음'],
      [JA_VOLUNTEER_EXPERIENCE_OPTION_IDS.no, '없음'],
    ])
  })

  it('기본값(UJAT 등)은 기존 라벨 유지', () => {
    expect(experienceLabels()).toEqual([
      [JA_VOLUNTEER_EXPERIENCE_OPTION_IDS.yes, '동의서 제출 요청'],
      [JA_VOLUNTEER_EXPERIENCE_OPTION_IDS.no, '동의서 미제출'],
    ])
  })
})
