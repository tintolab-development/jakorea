import { describe, expect, it } from 'vitest'
import {
  FIELD_FORMAT_EMAIL_MESSAGE,
  FIELD_FORMAT_PHONE_MESSAGE,
  isProgramContactFormatKey,
  isRecruitmentContactFormatKey,
  listContactFormatIssuesFromUnknown,
} from './registration-wizard-contact-format'

describe('listContactFormatIssuesFromUnknown', () => {
  it('ignores empty phone and email', () => {
    expect(
      listContactFormatIssuesFromUnknown({
        'recruit.institution.inquiryTel': '',
        'recruit.institution.inquiryEmail': '   ',
      })
    ).toEqual([])
  })

  it('flags invalid phone and email', () => {
    const issues = listContactFormatIssuesFromUnknown({
      'recruit.institution.inquiryTel': '1234',
      'recruit.institution.inquiryEmail': 'not-an-email',
    })
    expect(issues.map(issue => issue.message)).toEqual([
      FIELD_FORMAT_PHONE_MESSAGE,
      FIELD_FORMAT_EMAIL_MESSAGE,
    ])
  })

  it('accepts hyphenated korean phone and a simple email', () => {
    expect(
      listContactFormatIssuesFromUnknown({
        inquiryTel: '02-6085-6028',
        inquiryEmail: 'recruit@jakorea.org',
      })
    ).toEqual([])
  })

  it('maps nested contact.phone to inquiryTel for highlight', () => {
    const issues = listContactFormatIssuesFromUnknown({
      contact: { name: '담당', phone: '123', email: 'ok@a.com' },
    })
    expect(issues).toEqual([{ key: 'contact.inquiryTel', message: FIELD_FORMAT_PHONE_MESSAGE }])
  })

  it('can ignore recruitment keys on the program step', () => {
    const issues = listContactFormatIssuesFromUnknown(
      { 'recruit.institution.inquiryTel': '1234', contactPhone: '010-1234-5678' },
      isProgramContactFormatKey
    )
    expect(issues).toEqual([])
  })

  it('flags program-level contactPhone on the program step', () => {
    const issues = listContactFormatIssuesFromUnknown(
      { contactPhone: '1234' },
      isProgramContactFormatKey
    )
    expect(issues).toEqual([{ key: 'contactPhone', message: FIELD_FORMAT_PHONE_MESSAGE }])
  })

  it('keeps recruitment keys on the recruitment step', () => {
    expect(isRecruitmentContactFormatKey('recruit.volunteer.inquiryEmail')).toBe(true)
    const issues = listContactFormatIssuesFromUnknown(
      { 'recruit.volunteer.inquiryEmail': 'bad' },
      isRecruitmentContactFormatKey
    )
    expect(issues[0]?.message).toBe(FIELD_FORMAT_EMAIL_MESSAGE)
  })

  it('treats wizard recruitmentKv nested keys as recruitment', () => {
    const issues = listContactFormatIssuesFromUnknown(
      { recruitmentKv: { 'recruit.institution.inquiryTel': '1234' } },
      isRecruitmentContactFormatKey
    )
    expect(issues[0]?.message).toBe(FIELD_FORMAT_PHONE_MESSAGE)
  })
})
