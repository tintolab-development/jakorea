import { describe, expect, it } from 'vitest'
import { sponsorContactRegisterFormSchema } from './sponsor-contact-register-schema'

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

  it('accepts a short extension without format rules', () => {
    const parsed = sponsorContactRegisterFormSchema.safeParse({
      ...validBase,
      officePhone: '1234',
    })
    expect(parsed.success).toBe(true)
  })

  it('accepts free-text extension labels', () => {
    const parsed = sponsorContactRegisterFormSchema.safeParse({
      ...validBase,
      officePhone: '내선 123',
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects officePhone longer than 20 characters', () => {
    const parsed = sponsorContactRegisterFormSchema.safeParse({
      ...validBase,
      officePhone: 'a'.repeat(21),
    })
    expect(parsed.success).toBe(false)
  })
})
