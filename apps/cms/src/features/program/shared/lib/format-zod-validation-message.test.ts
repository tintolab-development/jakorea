import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { formatZodIssueForUser } from './format-zod-validation-message'

describe('formatZodIssueForUser', () => {
  it('boolean null 오류를 필드 라벨이 포함된 한글 메시지로 변환한다', () => {
    const schema = z.object({ partnerInvolvement: z.boolean().optional() })
    const result = schema.safeParse({ partnerInvolvement: null })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(formatZodIssueForUser(result.error.issues[0])).toBe(
        'Partner Involvement 값을 선택해 주세요.'
      )
    }
  })

  it('custom 한글 메시지는 그대로 유지한다', () => {
    const issue = {
      code: 'custom' as const,
      message: '후원사를 선택해주세요',
      path: ['sponsorManagementIds'],
    }
    expect(formatZodIssueForUser(issue)).toBe('후원사를 선택해주세요')
  })
})
