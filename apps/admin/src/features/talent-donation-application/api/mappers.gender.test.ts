import { describe, expect, it } from 'vitest'
import { mapTalentApplicationDetailToDomain } from './mappers'

type DetailInput = Parameters<typeof mapTalentApplicationDetailToDomain>[0]

describe('재능기부 상세 성별 매핑 (Step 6: null·마스킹을 남성으로 추정하지 않음)', () => {
  it.each([
    [null, null],
    ['**', null],
    ['UNKNOWN', null],
    ['male', 'male'],
    ['female', 'female'],
  ])('gender %s → %s', (input, expected) => {
    const detail = mapTalentApplicationDetailToDomain({
      id: 1,
      name: '홍길동',
      birthDate: null,
      gender: input,
      piiMasked: input === '**',
      maskedBirthDate: input === '**' ? '2000.**.**' : null,
      maskedGender: input === '**' ? '**' : null,
    } as unknown as DetailInput)
    expect(detail.gender).toBe(expected)
  })

  it('마스킹 응답은 서버 마스킹 값을 그대로 넘긴다', () => {
    const detail = mapTalentApplicationDetailToDomain({
      id: 2,
      name: '홍길동',
      birthDate: null,
      gender: null,
      piiMasked: true,
      maskedBirthDate: '2000.**.**',
      maskedGender: '**',
    } as unknown as DetailInput)
    expect(detail.maskedGender).toBe('**')
    expect(detail.maskedBirthDate).toBe('2000.**.**')
    expect(detail.gender).toBeNull()
  })
})
