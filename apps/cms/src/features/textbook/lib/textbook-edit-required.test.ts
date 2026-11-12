import { describe, expect, it } from 'vitest'
import {
  isTextbookEditRequiredFilled,
  type TextbookEditRequiredInput,
} from './textbook-edit-required'

const FILLED: TextbookEditRequiredInput = {
  textbookName: '창업 교실',
  textbookNameEn: 'Startup Class',
  businessArea: '기업가정신',
  useStatus: 'USED',
  educationStages: [
    {
      key: 'elementary',
      label: '초등',
      selected: false,
      grades: [{ label: '5학년', selected: true }],
    },
  ] as TextbookEditRequiredInput['educationStages'],
}

describe('isTextbookEditRequiredFilled', () => {
  it('필수값이 모두 있으면 통과한다', () => {
    expect(isTextbookEditRequiredFilled(FILLED)).toBe(true)
  })

  it.each<[string, Partial<TextbookEditRequiredInput>]>([
    ['교재명(국문)', { textbookName: '  ' }],
    ['교재명(영문)', { textbookNameEn: '' }],
    ['사업 분야', { businessArea: '' }],
    ['사업 분야 전체', { businessArea: 'ALL' }],
    ['사용 여부', { useStatus: '' }],
    [
      '교육 대상',
      {
        educationStages: [
          { key: 'elementary', label: '초등', selected: false, grades: [] },
        ] as TextbookEditRequiredInput['educationStages'],
      },
    ],
  ])('%s를 비우면 미입력으로 본다', (_, patch) => {
    expect(isTextbookEditRequiredFilled({ ...FILLED, ...patch })).toBe(false)
  })
})
