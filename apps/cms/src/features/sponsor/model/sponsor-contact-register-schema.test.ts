import { describe, expect, it } from 'vitest'
import {
  SPONSOR_CONTACT_OFFICE_PHONE_FORMAT_MESSAGE,
  sponsorContactRegisterFormSchema,
} from './sponsor-contact-register-schema'

const validBase = {
  contactType: 'lead' as const,
  name: '김담당',
  department: '부서',
  position: '직함',
  phone: '010-9999-8888',
  email: 'email@mail.com',
  companyAddress: '회사주소',
  memo: '비고',
}

describe('sponsorContactRegisterFormSchema.officePhone', () => {
  it('allows empty officePhone', () => {
    const parsed = sponsorContactRegisterFormSchema.safeParse({
      ...validBase,
      officePhone: '',
    })
    expect(parsed.success).toBe(true)
  })

  it('accepts a Seoul landline', () => {
    const parsed = sponsorContactRegisterFormSchema.safeParse({
      ...validBase,
      officePhone: '02-1234-5678',
    })
    expect(parsed.success).toBe(true)
  })

  it('accepts a numeric extension', () => {
    const parsed = sponsorContactRegisterFormSchema.safeParse({
      ...validBase,
      officePhone: '1234',
    })
    expect(parsed.success).toBe(true)
  })

  it('accepts a hyphenated mobile number', () => {
    const parsed = sponsorContactRegisterFormSchema.safeParse({
      ...validBase,
      officePhone: '010-2222-2222',
    })
    expect(parsed.success).toBe(true)
  })

  it('accepts a hyphenated extension', () => {
    const parsed = sponsorContactRegisterFormSchema.safeParse({
      ...validBase,
      officePhone: '1234-5678',
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects non-numeric placeholder text', () => {
    const parsed = sponsorContactRegisterFormSchema.safeParse({
      ...validBase,
      officePhone: '내선번호',
    })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe(SPONSOR_CONTACT_OFFICE_PHONE_FORMAT_MESSAGE)
    }
  })
})
